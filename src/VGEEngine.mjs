import * as THREE from 'three';
import { validateDocument } from './validate.mjs';
import { canonical, defaultFactories } from './factories.mjs';

const TAU = Math.PI * 2;
const finite = (v, name) => { if (!Number.isFinite(v)) throw new TypeError(`${name} debe ser finito`); };
function freezeTree(value) {
  if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) freezeTree(child); }
  return value;
}
function pose(transform, fallback) {
  return {
    position: new THREE.Vector3(...transform.position),
    rotation: new THREE.Vector3(...transform.rotation ?? fallback?.rotation ?? [0, 0, 0]),
    scale: new THREE.Vector3(...transform.scale ?? fallback?.scale ?? [1, 1, 1]),
  };
}

/** Núcleo agnóstico del dominio con adaptadores gráficos de Fase 2.
 * El renderer se inyecta: permite pruebas sin WebGL y propiedad explícita de recursos.
 */
export class VGEEngine extends THREE.EventDispatcher {
  #doc; #nodes = new Map(); #children = new Map(); #entityDefs; #params; #userParams = new Map();
  #geometries = new Map(); #materials = new Map(); #geometryRefs = new Map(); #materialRefs = new Map();
  #bindings = []; #effectiveParams = new Map(); #step = 0; #selected = null; #explode = 0; #fault = null;
  #renderer; #ownsRenderer; #surface; #raf; #caf; #frameId = null; #lastFrame = null; #maxFps;
  #document; #visibilityListener; #intersection; #resizeObserver; #offscreen = false;
  #playing = false; #dirty = true; #disposed = false; #target = new THREE.Vector3();
  #effects = new Set();

  constructor(document, options = {}) {
    super();
    const factories = { ...defaultFactories, ...options.geometryFactories };
    validateDocument(document, { factories });
    // Reserva de interfaz únicamente: ningún .glb se carga ni se ignora en silencio.
    if (document.entities.some(e => e.geometry && document.resources.geometries[e.geometry].kind === 'asset')) throw new Error('GLB_NOT_IMPLEMENTED: el esquema admite la referencia; Fase 1 construye solo geometría paramétrica');
    const quality = options.quality ?? 'mobile';
    if (!['mobile', 'desktop'].includes(quality)) throw new RangeError('quality debe ser mobile o desktop');
    this.#maxFps = options.maxFps ?? (quality === 'mobile' ? 30 : 60);
    finite(this.#maxFps, 'maxFps');
    if (this.#maxFps <= 0 || this.#maxFps > 120) throw new RangeError('maxFps debe estar en (0,120]');
    this.#doc = freezeTree(structuredClone(document));
    this.#entityDefs = new Map(this.#doc.entities.map(e => [e.id, e]));
    this.#params = new Map(this.#doc.parameters.map(p => [p.name, p]));
    this.scene = options.scene ?? new THREE.Scene();
    this.root = new THREE.Group(); this.root.name = `VGE:${document.metadata.id}`;
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 200);
    this.#renderer = options.renderer ?? null;
    this.#ownsRenderer = options.ownsRenderer ?? false;
    this.#surface = options.surface ?? this.#renderer?.domElement ?? null;
    this.#document = options.visibilityDocument ?? globalThis.document ?? null;
    this.#raf = options.requestFrame ?? globalThis.requestAnimationFrame?.bind(globalThis) ?? null;
    this.#caf = options.cancelFrame ?? globalThis.cancelAnimationFrame?.bind(globalThis) ?? null;
    if (this.#renderer && (!this.#raf || !this.#caf)) throw new TypeError('Un renderer requiere requestFrame y cancelFrame');
    try {
      this.#build(factories, quality);
      this.scene.add(this.root);
      for (const parameter of this.#doc.parameters) for (const definition of parameter.bindings) {
        const [property, axis] = definition.channel.split('.');
        this.#bindings.push({ definition, parameter: parameter.name, node: this.#nodes.get(definition.entity), property, axis, phase: 0 });
      }
      this.setStep(0);
      this.#attachLifecycle(options, quality);
      this.#schedule();
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  #build(factories, quality) {
    for (const e of this.#doc.entities) {
      const object = new THREE.Group(); object.name = e.id;
      object.userData = { entityId: e.id, label: e.label, description: e.description, data: structuredClone(e.data ?? {}) };
      const assembled = pose(e.transform.assembled);
      const exploded = pose(e.transform.exploded, e.transform.assembled);
      const node = { object, mesh: null, definition: e, assembled, exploded, baseRotation: new THREE.Vector3(), override: null, visible: false };
      this.#nodes.set(e.id, node);
      this.#children.set(e.id, []);
      if (e.geometry) {
        const def = this.#doc.resources.geometries[e.geometry];
        const key = canonical({ factory: def.factory, params: def.params, quality });
        let geometry = this.#geometries.get(key);
        if (!geometry) {
          geometry = factories[def.factory].create(def.params, { quality, THREE });
          if (!geometry?.isBufferGeometry) { geometry?.dispose?.(); throw new TypeError(`La fábrica ${def.factory} debe devolver BufferGeometry`); }
          this.#geometries.set(key, geometry);
          geometry.computeBoundingBox(); geometry.computeBoundingSphere();
        }
        this.#geometryRefs.set(e.geometry, geometry);
        const material = this.#material(e.material);
        node.mesh = new THREE.Mesh(geometry, material);
        node.mesh.userData.entityId = e.id;
        node.mesh.castShadow = false; node.mesh.receiveShadow = false;
        object.add(node.mesh);
      }
    }
    // Dos pasadas: no dependemos del orden del archivo JSON.
    for (const e of this.#doc.entities) {
      (e.parent === null ? this.root : this.#nodes.get(e.parent).object).add(this.#nodes.get(e.id).object);
      if (e.parent !== null) this.#children.get(e.parent).push(e.id);
    }
    // Precalcular materiales de pasos/fallos para no crearlos durante la reproducción.
    for (const s of this.#doc.steps) for (const state of s.state?.entities ?? []) if (state.material) this.#material(state.material);
    for (const f of this.#doc.faults) for (const effect of f.visualEffects) if (effect.material) this.#material(effect.material);
  }

  #material(id) {
    if (this.#materialRefs.has(id)) return this.#materialRefs.get(id);
    const def = this.#doc.resources.materials[id];
    const normalized = { type: def.type, color: def.color, opacity: def.opacity ?? 1, transparent: def.transparent ?? false, side: def.side ?? 'front', depthWrite: def.depthWrite ?? true };
    if (def.type === 'standard') Object.assign(normalized, { metalness: def.metalness ?? 0, roughness: def.roughness ?? 1 });
    const key = canonical(normalized);
    let material = this.#materials.get(key);
    if (!material) {
      const { type, side, ...params } = normalized;
      params.side = side === 'double' ? THREE.DoubleSide : THREE.FrontSide;
      material = type === 'standard' ? new THREE.MeshStandardMaterial(params) : new THREE.MeshBasicMaterial(params);
      this.#materials.set(key, material);
    }
    this.#materialRefs.set(id, material);
    return material;
  }

  #assertAlive() { if (this.#disposed) throw new Error('VGEEngine ya está liberado'); }
  #node(id) { const node = this.#nodes.get(id); if (!node) throw new RangeError(`Entidad desconocida: ${id}`); return node; }
  #parameter(name, value) {
    const p = this.#params.get(name);
    if (!p) throw new RangeError(`Parámetro desconocido: ${name}`);
    finite(value, name);
    if (value < p.range[0] || value > p.range[1]) throw new RangeError(`${name} debe estar en [${p.range.join(', ')}] ${p.unit}`);
  }

  #resolveParams(stepIndex, userParams, fault) {
    const result = new Map(this.#doc.parameters.map(p => [p.name, p.value]));
    for (const [name, value] of Object.entries(this.#doc.steps[stepIndex].state?.parameters ?? {})) result.set(name, value);
    for (const [name, value] of userParams) result.set(name, value);
    const definition = this.#doc.faults.find(f => f.id === fault);
    for (const effect of definition?.parameterEffects ?? []) {
      const current = result.get(effect.name);
      result.set(effect.name, effect.operation === 'set' ? effect.value : effect.operation === 'multiply' ? current * effect.value : current + effect.value);
    }
    for (const [name, value] of result) this.#parameter(name, value);
    for (const parameter of this.#doc.parameters) for (const b of parameter.bindings) {
      let rate = result.get(parameter.name) * b.scale;
      for (const gain of b.gains ?? []) rate *= result.get(gain);
      finite(rate, `binding ${b.id}`);
      finite((b.offset ?? 0) + (b.phaseParameter ? result.get(b.phaseParameter) * (b.phaseScale ?? 1) : 0), `fase ${b.id}`);
      finite((b.amplitude ?? 1) * (b.amplitudeParameter ? result.get(b.amplitudeParameter) : 1), `amplitud ${b.id}`);
    }
    return result; // Se calcula antes de mutar el estado: fallo atómico si sale de rango.
  }

  select(id) {
    this.#assertAlive();
    if (id !== null && this.#node(id).definition.selectable === false) throw new RangeError(`${id} no es seleccionable`);
    const previous = this.#selected;
    this.#selected = id;
    if (previous !== id) this.dispatchEvent({ type: 'selectionchange', id, previous });
    this.#commit(); return this;
  }

  explode(t) {
    this.#assertAlive(); finite(t, 'explode');
    if (t < 0 || t > 1) throw new RangeError('explode(t) requiere 0 ≤ t ≤ 1');
    this.#explode = t; this.#commit(); return this;
  }

  setStep(n) {
    this.#assertAlive();
    if (!Number.isInteger(n) || n < 0 || n >= this.#doc.steps.length) throw new RangeError('Índice de paso inválido (base 0)');
    const params = this.#resolveParams(n, this.#userParams, this.#fault);
    const step = this.#doc.steps[n];
    this.#step = n; this.#effectiveParams = params; this.#explode = step.explode ?? 0;
    this.#selected = step.selection ?? null;
    const visible = new Set(); const pending = [...step.visible];
    for (let i = 0; i < pending.length; i++) {
      const id = pending[i]; if (visible.has(id)) continue;
      visible.add(id);
      pending.push(...this.#children.get(id));
    }
    // Mostrar una pieza muestra sus ancestros, pero no sus hermanos.
    for (const id of [...visible]) {
      let parent = this.#entityDefs.get(id).parent;
      while (parent !== null) { visible.add(parent); parent = this.#entityDefs.get(parent).parent; }
    }
    const states = new Map((step.state?.entities ?? []).map(s => [s.id, s]));
    for (const [id, node] of this.#nodes) {
      node.visible = visible.has(id); node.override = states.get(id) ?? null;
      node.object.userData.data = { ...structuredClone(node.definition.data ?? {}), ...structuredClone(node.override?.data ?? {}) };
    }
    const c = step.camera;
    this.camera.position.fromArray(c.position); this.#target.fromArray(c.target);
    this.camera.fov = c.fov ?? 40; this.camera.near = c.near ?? 0.05; this.camera.far = c.far ?? 200;
    this.camera.lookAt(this.#target); this.camera.updateProjectionMatrix();
    // Un paso es una instantánea reproducible; no hereda la fase del anterior.
    for (const binding of this.#bindings) binding.phase = 0;
    this.#lastFrame = null;
    this.#commit();
    this.dispatchEvent({ type: 'stepchange', index: n, id: step.id, selection: this.#selected });
    this.dispatchEvent({ type: 'selectionchange', id: this.#selected });
    return this;
  }

  setParam(name, value) {
    this.#assertAlive(); this.#parameter(name, value);
    const user = new Map(this.#userParams); user.set(name, value);
    const params = this.#resolveParams(this.#step, user, this.#fault);
    this.#userParams = user; this.#effectiveParams = params;
    // La fase integrada se conserva al cambiar la velocidad; no hay salto angular.
    this.#commit();
    this.dispatchEvent({ type: 'parameterchange', name, value: params.get(name), requested: value });
    return this;
  }

  injectFault(id) {
    this.#assertAlive();
    if (id !== null && !this.#doc.faults.some(f => f.id === id)) throw new RangeError(`Fallo desconocido: ${id}`);
    const params = this.#resolveParams(this.#step, this.#userParams, id);
    this.#fault = id; this.#effectiveParams = params;
    this.#commit(); this.dispatchEvent({ type: 'faultchange', id }); return this;
  }

  #commit() { this.#apply(); this.#updateEffects(); this.invalidate(); }
  #updateEffects() { for (const effect of this.#effects) effect.update(this); }
  addEffect(effect) {
    this.#assertAlive();
    if (typeof effect?.update !== 'function' || typeof effect?.dispose !== 'function') throw new TypeError('Un efecto requiere update(engine) y dispose()');
    if (!this.#effects.has(effect)) { this.#effects.add(effect); this.#commit(); }
    return this;
  }
  removeEffect(effect) {
    this.#assertAlive();
    if (this.#effects.delete(effect)) { effect.dispose(); this.#commit(); }
    return this;
  }
  refresh() { this.#assertAlive(); this.#commit(); return this; }
  getParameter(name) { this.#assertAlive(); if (!this.#params.has(name)) throw new RangeError(`Parámetro desconocido: ${name}`); return this.#effectiveParams.get(name); }
  get selectedId() { return this.#selected; }
  get isPlaying() { return this.#playing; }
  // Inspección y búsqueda del mismo reloj: la gráfica no crea otro oscilador.
  getBindingState(id) {
    this.#assertAlive();
    const binding = this.#bindings.find(b => b.definition.id === id);
    if (!binding || binding.definition.kind === 'LINEAR') throw new RangeError(`Animación desconocida: ${id}`);
    const b = binding.definition;
    let rate = this.#effectiveParams.get(binding.parameter) * b.scale;
    for (const gain of b.gains ?? []) rate *= this.#effectiveParams.get(gain);
    return { kind: b.kind, phase: binding.phase, rate,
      offset: (b.offset ?? 0) + (b.phaseParameter ? this.#effectiveParams.get(b.phaseParameter) * (b.phaseScale ?? 1) : 0),
      amplitude: (b.amplitude ?? 1) * (b.amplitudeParameter ? this.#effectiveParams.get(b.amplitudeParameter) : 1), bias: b.bias ?? 0 };
  }
  seekCycle(id, fraction) {
    this.#assertAlive(); finite(fraction, 'fraction');
    if (fraction < 0 || fraction > 1) throw new RangeError('fraction debe estar entre 0 y 1');
    const reference = this.getBindingState(id);
    if (reference.rate === 0) throw new RangeError('El reloj elegido está detenido');
    for (const binding of this.#bindings) {
      if (binding.definition.kind === 'LINEAR') continue;
      const rate = this.getBindingState(binding.definition.id).rate;
      binding.phase = ((TAU * fraction * rate / reference.rate) % TAU + TAU) % TAU;
    }
    this.#lastFrame = null; this.#commit(); return this;
  }
  #apply() {
    for (const node of this.#nodes.values()) {
      const { object, assembled, exploded, override } = node;
      object.position.lerpVectors(assembled.position, exploded.position, this.#explode);
      object.scale.lerpVectors(assembled.scale, exploded.scale, this.#explode);
      // Euler XYZ fijo en el contrato; quaterniones para interpolar el despiece.
      // Los cuaterniones se precalculan en el primer uso, nunca por fotograma.
      if (!node.qA) {
        node.qA = new THREE.Quaternion().setFromEuler(new THREE.Euler(...assembled.rotation.toArray(), 'XYZ'));
        node.qE = new THREE.Quaternion().setFromEuler(new THREE.Euler(...exploded.rotation.toArray(), 'XYZ'));
      }
      object.quaternion.slerpQuaternions(node.qA, node.qE, this.#explode);
      if (override?.position) object.position.fromArray(override.position);
      if (override?.scale) object.scale.fromArray(override.scale);
      if (override?.rotation) object.rotation.set(...override.rotation, 'XYZ');
      node.baseRotation.set(object.rotation.x, object.rotation.y, object.rotation.z);
      object.visible = node.visible;
      if (node.mesh) node.mesh.material = this.#materialRefs.get(override?.material ?? node.definition.material);
    }
    for (const binding of this.#bindings) {
      const { definition: b, node } = binding;
      let value;
      if (b.kind === 'LINEAR') value = this.#effectiveParams.get(binding.parameter) * b.scale + (b.offset ?? 0);
      else if (b.kind === 'PHASE') value = binding.phase + (b.offset ?? 0);
      else {
        const phaseOffset = (b.offset ?? 0) + (b.phaseParameter ? this.#effectiveParams.get(b.phaseParameter) * (b.phaseScale ?? 1) : 0);
        const amplitude = (b.amplitude ?? 1) * (b.amplitudeParameter ? this.#effectiveParams.get(b.amplitudeParameter) : 1);
        value = (b.bias ?? 0) + amplitude * Math.sin(binding.phase + phaseOffset);
      }
      const { property, axis } = binding;
      const target = property === 'data' ? node.object.userData.data : node.object[property];
      // Para data, el valor base se obtiene del documento/paso, no del fotograma anterior.
      const base = property === 'data' ? node.override?.data?.[axis] ?? node.definition.data?.[axis] : property === 'rotation' ? node.baseRotation[axis] : target[axis];
      target[axis] = value + (b.combine === 'add' ? base : 0);
    }
    const fault = this.#doc.faults.find(f => f.id === this.#fault);
    for (const effect of fault?.visualEffects ?? []) {
      const node = this.#nodes.get(effect.entity);
      if (effect.visible !== undefined) node.object.visible = effect.visible && node.visible;
      if (effect.scale) node.object.scale.fromArray(effect.scale);
      // Cambiar referencia solo en la pieza afectada; nunca recolorear un material compartido.
      if (effect.material && node.mesh) node.mesh.material = this.#materialRefs.get(effect.material);
    }
  }

  #integrate(dt) {
    for (const binding of this.#bindings) {
      const b = binding.definition;
      if (b.kind === 'LINEAR') continue;
      let rate = this.#effectiveParams.get(binding.parameter) * b.scale;
      for (const gain of b.gains ?? []) rate *= this.#effectiveParams.get(gain);
      // Reducir el intervalo por el período evita desbordamiento para dt grandes.
      const delta = rate === 0 ? 0 : rate * (dt % (TAU / Math.abs(rate)));
      binding.phase = ((binding.phase + delta) % TAU + TAU) % TAU;
    }
  }
  advance(dt) {
    this.#assertAlive(); finite(dt, 'dt'); if (dt < 0) throw new RangeError('dt debe ser positivo o cero');
    this.#integrate(dt); this.#commit();
    return this;
  }

  play() { this.#assertAlive(); this.#playing = true; this.#lastFrame = null; this.invalidate(); return this; }
  pause() { this.#assertAlive(); this.#playing = false; this.#stopFrame(); this.invalidate(); return this; }
  invalidate() { this.#assertAlive(); this.#dirty = true; this.#schedule(); return this; }
  getObject(id) { this.#assertAlive(); return this.#node(id).object; }
  getMesh(id) { this.#assertAlive(); return this.#node(id).mesh; }
  get state() {
    return { step: this.#step, selected: this.#selected, exploded: this.#explode, fault: this.#fault, playing: this.#playing, parameters: Object.fromEntries(this.#effectiveParams), requestedParameters: Object.fromEntries(this.#userParams), disposed: this.#disposed };
  }
  get stats() { return { entities: this.#nodes.size, geometries: this.#geometries.size, materials: this.#materials.size, bindings: this.#bindings.length }; }

  #visible() { return !this.#document?.hidden && !this.#offscreen; }
  #dynamic() {
    if (!this.#playing) return false;
    return this.#bindings.some(({ definition: b, parameter }) => b.kind !== 'LINEAR' && b.scale * this.#effectiveParams.get(parameter) !== 0 && (b.gains ?? []).every(g => this.#effectiveParams.get(g) !== 0));
  }
  #stopFrame() { if (this.#frameId !== null) this.#caf?.(this.#frameId); this.#frameId = null; this.#lastFrame = null; }
  #schedule() {
    if (this.#disposed || !this.#renderer || !this.#visible() || this.#frameId !== null || (!this.#dirty && !this.#dynamic())) return;
    this.#frameId = this.#raf(now => this.#frame(now));
  }
  #frame(now) {
    this.#frameId = null;
    if (this.#disposed || !this.#visible()) { this.#lastFrame = null; return; }
    const elapsed = this.#lastFrame === null ? 0 : (now - this.#lastFrame) / 1000;
    const due = this.#lastFrame === null || this.#dirty || elapsed >= 1 / this.#maxFps - 0.0005;
    if (due) {
      if (this.#dynamic() && this.#lastFrame !== null) this.#integrate(Math.min(elapsed, 0.1));
      this.#apply(); this.#updateEffects();
      this.#lastFrame = now;
      this.#renderer.render(this.scene, this.camera);
      this.#dirty = false;
    }
    if (!this.#dynamic()) this.#lastFrame = null;
    this.#schedule();
  }
  #attachLifecycle(options, quality) {
    this.#visibilityListener = () => { this.#stopFrame(); if (this.#visible()) this.invalidate(); };
    this.#document?.addEventListener('visibilitychange', this.#visibilityListener);
    const Intersection = options.IntersectionObserver ?? globalThis.IntersectionObserver;
    if (Intersection && this.#surface) {
      this.#intersection = new Intersection(entries => {
        const entry = entries.find(e => e.target === this.#surface);
        if (!entry) return;
        this.#offscreen = !entry.isIntersecting;
        this.#stopFrame(); if (this.#visible()) this.invalidate();
      });
      this.#intersection.observe(this.#surface);
    }
    if (this.#renderer) {
      const cap = quality === 'mobile' ? 1.5 : 1.75;
      this.#renderer.setPixelRatio?.(Math.min(globalThis.devicePixelRatio ?? 1, cap));
      const resize = () => {
        const rect = this.#surface?.getBoundingClientRect?.();
        if (!rect || rect.width <= 0 || rect.height <= 0) return;
        this.camera.aspect = rect.width / rect.height; this.camera.updateProjectionMatrix();
        this.#renderer.setSize?.(rect.width, rect.height, false); this.invalidate();
      };
      const Resize = options.ResizeObserver ?? globalThis.ResizeObserver;
      if (Resize && this.#surface) { this.#resizeObserver = new Resize(resize); this.#resizeObserver.observe(this.#surface); }
      resize();
    }
  }

  dispose() {
    if (this.#disposed) return;
    this.#disposed = true; this.#playing = false;
    this.#stopFrame();
    this.#document?.removeEventListener('visibilitychange', this.#visibilityListener);
    this.#intersection?.disconnect(); this.#resizeObserver?.disconnect();
    for (const effect of this.#effects) effect.dispose();
    this.#effects.clear();
    this.root?.removeFromParent();
    for (const geometry of this.#geometries.values()) geometry.dispose();
    for (const material of this.#materials.values()) material.dispose();
    this.root?.clear(); this.#nodes.clear(); this.#children.clear(); this.#bindings.length = 0;
    this.#geometries.clear(); this.#materials.clear(); this.#geometryRefs.clear(); this.#materialRefs.clear();
    if (this.#ownsRenderer) this.#renderer?.dispose();
    this.dispatchEvent({ type: 'dispose' });
    this._listeners = {}; // EventDispatcher no ofrece removeAllListeners().
    this.#renderer = null;
  }
}
