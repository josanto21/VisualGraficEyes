import * as THREE from 'three';
import { validateGraphics, defaultGraphics } from './validateGraphics.mjs';
import { FieldVectors } from './FieldVectors.mjs';
const vertexShader = `
  #include <clipping_planes_pars_vertex>
  uniform vec2 uResolution;
  uniform float uWidth;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vec3 viewNormal = normalize(normalMatrix * normal);
    vec2 direction = (projectionMatrix * vec4(viewNormal, 0.0)).xy;
    direction /= max(length(direction), 0.0001);
    gl_Position = projectionMatrix * mvPosition;
    gl_Position.xy += direction * (2.0 * uWidth / uResolution) * gl_Position.w;
    #include <clipping_planes_vertex>
  }
`;
const fragmentShader = `
  #include <clipping_planes_pars_fragment>
  uniform vec3 uColor;
  void main() {
    #include <clipping_planes_fragment>
    gl_FragColor = vec4(uColor, 1.0);
    #include <colorspace_fragment>
  }
`;
export function worldVisible(object) {
  for (let current = object; current; current = current.parent) if (!current.visible) return false;
  return true;
}
/** Adaptador de Fase 2: recursos propios; no muta materiales del núcleo. */
export class VGEGraphics {
  #engine; #config; #entries; #selected = undefined; #selectedEntries = []; #variants = new Map(); #variantCount = 0;
  #plane = new THREE.Plane(); #localPlane = new THREE.Plane(); #planes; #anchor; #clipMeshes = new Set(); #amount = 0;
  #mode; #actualMode = 'outline'; #lowPower; #slow = false; #lastTime = null; #samples = 0; #ema = 0; #budget;
  #outlineMaterials; #resolution = new THREE.Vector2(640, 800); #renderer; #previousLocalClipping; #disposed = false; #color;
  field = null;
  constructor(engine, document, config = defaultGraphics, options = {}) {
    validateGraphics(config, document);
    this.#engine = engine; this.#config = structuredClone(config); this.#mode = config.selection.mode; this.#amount = config.clipping?.amount ?? 0;
    this.#renderer = options.renderer ?? null; this.#budget = 1000 / (options.maxFps ?? 30);
    this.#lowPower = options.lowPower ?? ((globalThis.navigator?.deviceMemory ?? 8) <= 4 || (globalThis.navigator?.hardwareConcurrency ?? 8) <= 4);
    this.#color = new THREE.Color(config.selection.color); this.#planes = [this.#plane];
    if (config.clipping) {
      this.#anchor = engine.getObject(config.clipping.anchor); this.#localPlane.normal.fromArray(config.clipping.normal);
      if (this.#renderer) { this.#previousLocalClipping = this.#renderer.localClippingEnabled; this.#renderer.localClippingEnabled = true; }
    }
    const definitions = new Map(document.entities.map(e => [e.id, e]));
    this.#entries = document.entities.filter(e => e.geometry).map(e => {
      const ancestry = new Set(); let id = e.id;
      while (id !== null) { ancestry.add(id); id = definitions.get(id).parent; }
      const mesh = engine.getMesh(e.id);
      if (config.clipping?.entities.some(id => ancestry.has(id))) this.#clipMeshes.add(mesh);
      return { id: e.id, mesh, ancestry, outline: null };
    });
    const outlineMaterial = cut => new THREE.ShaderMaterial({
      name: cut ? 'VGE:selected-cut-outline' : 'VGE:selected-outline', vertexShader, fragmentShader,
      side: THREE.BackSide, depthTest: true, depthWrite: false, toneMapped: false,
      clipping: true, clippingPlanes: cut ? this.#planes : null,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
      uniforms: { uColor: { value: this.#color }, uResolution: { value: this.#resolution }, uWidth: { value: config.selection.width } },
    });
    this.#outlineMaterials = [outlineMaterial(false), outlineMaterial(true)];
    for (const entry of this.#entries) {
      const outline = new THREE.Mesh(entry.mesh.geometry, this.#outlineMaterials[this.#clipMeshes.has(entry.mesh) ? 1 : 0]);
      outline.name = `VGE:outline:${entry.id}`; outline.userData.vgeEffect = true; outline.visible = false; outline.renderOrder = 5;
      entry.mesh.add(outline); entry.outline = outline;
    }
    try { if (config.field) this.field = new FieldVectors(engine, config.field, document); engine.addEffect(this); }
    catch (error) { this.dispose(); throw error; }
  }
  #variant(base, cut, selected) {
    if (!cut && !selected) return base;
    let variants = this.#variants.get(base);
    if (!variants) { variants = new Map(); this.#variants.set(base, variants); }
    const key = `${cut ? 1 : 0}${selected ? 1 : 0}`;
    if (variants.has(key)) return variants.get(key);
    const material = base.clone();
    if (cut) { material.clippingPlanes = this.#planes; material.clipShadows = true; material.side = THREE.DoubleSide; }
    if (selected) {
      if (material.emissive) { material.emissive.copy(this.#color); material.emissiveIntensity = 0.65; }
      else material.color.lerp(this.#color, 0.6);
    }
    material.needsUpdate = true; variants.set(key, material); this.#variantCount++; return material;
  }
  update(engine) {
    if (this.#disposed) return;
    engine.root.updateMatrixWorld(true);
    if (this.#config.clipping) {
      const range = this.#config.clipping.range;
      this.#localPlane.constant = range[1] + (range[0] - range[1]) * this.#amount;
      this.#plane.copy(this.#localPlane).applyMatrix4(this.#anchor.matrixWorld);
    }
    if (this.#selected !== engine.selectedId) {
      this.#selected = engine.selectedId;
      this.#selectedEntries = this.#selected === null ? [] : this.#entries.filter(e => e.ancestry.has(this.#selected));
    }
    this.#actualMode = this.#mode === 'auto' ? (this.#lowPower || this.#slow || this.#selectedEntries.length > this.#config.selection.maxOutlineMeshes ? 'emissive' : 'outline') : this.#mode;
    if (this.#renderer?.getDrawingBufferSize) {
      this.#renderer.getDrawingBufferSize(this.#resolution);
      const pixelRatio = this.#renderer.getPixelRatio?.() ?? 1;
      for (const material of this.#outlineMaterials) material.uniforms.uWidth.value = this.#config.selection.width * pixelRatio;
    }
    for (const entry of this.#entries) {
      const selected = this.#selected !== null && entry.ancestry.has(this.#selected);
      entry.outline.visible = selected && this.#actualMode === 'outline' && worldVisible(entry.mesh);
      entry.mesh.material = this.#variant(entry.mesh.material, this.#clipMeshes.has(entry.mesh), selected && this.#actualMode === 'emissive');
    }
    this.field?.update();
  }
  observeFrame(timeMs, playing) {
    if (!playing) { this.#lastTime = null; return; }
    if (this.#lastTime !== null) {
      const dt = timeMs - this.#lastTime;
      if (dt > 0 && dt < 250) {
        this.#ema = this.#samples === 0 ? dt : this.#ema * 0.9 + dt * 0.1;
        if (++this.#samples >= 30 && this.#ema > this.#budget * 1.7) this.#slow = true;
      } else { this.#samples = 0; this.#ema = 0; }
    }
    this.#lastTime = timeMs;
  }
  setCut(amount) {
    if (!this.#config.clipping) throw new Error('Este visual no declara un plano de corte');
    if (!Number.isFinite(amount) || amount < 0 || amount > 1) throw new RangeError('Corte: se requiere un número entre 0 y 1');
    this.#amount = amount; this.#engine.refresh(); return this;
  }
  setSelectionMode(mode) {
    if (!['auto', 'outline', 'emissive'].includes(mode)) throw new RangeError('Modo de selección desconocido');
    this.#mode = mode; this.#engine.refresh(); return this;
  }
  setFieldVisible(value) { this.field?.setVisible(value); this.#engine.refresh(); return this; }
  isClipped(mesh, point) { return this.#clipMeshes.has(mesh) && this.#plane.distanceToPoint(point) < -1e-7; }
  get plane() { return this.#plane.clone(); }
  get state() { return { amount: this.#amount, selectionMode: this.#mode, actualSelectionMode: this.#actualMode, slowFallback: this.#slow, field: this.field?.state ?? null }; }
  get stats() { return { outlineObjects: this.#entries.length, visibleOutlines: this.#entries.filter(e => e.outline.visible).length, variants: this.#variantCount, fieldGeometries: this.field ? (this.#config.field.trail ? 4 : 3) : 0 }; }
  dispose() {
    if (this.#disposed) return; this.#disposed = true;
    for (const entry of this.#entries) entry.outline.removeFromParent();
    for (const material of this.#outlineMaterials) material.dispose();
    for (const variants of this.#variants.values()) for (const material of variants.values()) material.dispose();
    this.#variants.clear(); this.field?.dispose();
    if (this.#renderer && this.#previousLocalClipping !== undefined) this.#renderer.localClippingEnabled = this.#previousLocalClipping;
  }
}
