import * as THREE from 'three';
const UP = new THREE.Vector3(0, 1, 0);
/** Flechas con geometría compartida. No hay reloj, seno ni fase propios. */
export class FieldVectors {
  #config; #sources; #sum = new THREE.Vector3(); #result; #shaft; #head; #ringGeometry; #materials = []; #disposed = false;
  #engine; #trailGeometry; #trailPosition; #trailColors; #past = new THREE.Vector3();
  constructor(engine, config, document = null) {
    this.#engine = engine;
    this.#config = config;
    this.group = new THREE.Group(); this.group.name = 'VGE:field'; this.group.userData.vgeEffect = true;
    this.group.position.fromArray(config.origin); this.group.visible = config.visible;
    engine.getObject(config.anchor).add(this.group);
    this.#shaft = new THREE.CylinderGeometry(1, 1, 1, 8); this.#head = new THREE.ConeGeometry(1, 1, 10);
    const glyph = color => {
      const material = new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, toneMapped: false });
      this.#materials.push(material);
      const group = new THREE.Group(), shaft = new THREE.Mesh(this.#shaft, material), head = new THREE.Mesh(this.#head, material);
      shaft.renderOrder = 20; head.renderOrder = 21; group.add(shaft, head); this.group.add(group);
      return { group, shaft, head, direction: new THREE.Vector3() };
    };
    this.#sources = config.sources.map(source => ({ ...source, binding: document?.parameters.flatMap(p => p.bindings).find(b => b.entity === source.entity && b.channel === source.channel && b.kind === 'SINE')?.id, object: engine.getObject(source.entity), key: source.channel.slice(5), axis: new THREE.Vector3(...source.axis), vector: new THREE.Vector3(), value: 0, glyph: glyph(source.color) }));
    this.#result = glyph(config.resultantColor);
    const a = this.#sources[0].axis.clone(), b = this.#sources[1].axis.clone().addScaledVector(a, -a.dot(this.#sources[1].axis));
    if (b.lengthSq() < 1e-8) b.set(Math.abs(a.x) < 0.9 ? 1 : 0, Math.abs(a.x) < 0.9 ? 0 : 1, 0).addScaledVector(a, -a.dot(b));
    b.normalize();
    const points = [];
    for (let i = 0; i < 80; i++) {
      const angle = 2 * Math.PI * i / 80;
      const p = a.clone().multiplyScalar(Math.cos(angle)).addScaledVector(b, Math.sin(angle)).multiplyScalar(config.referenceRadius);
      points.push(p.x, p.y, p.z);
    }
    this.#ringGeometry = new THREE.BufferGeometry(); this.#ringGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const ringMaterial = new THREE.LineBasicMaterial({ color: '#D3DCEB', transparent: true, opacity: 0.25, depthTest: false, depthWrite: false, toneMapped: false });
    this.#materials.push(ringMaterial);
    const ring = new THREE.LineLoop(this.#ringGeometry, ringMaterial); ring.renderOrder = 19; this.group.add(ring);
    if (config.trail) {
      this.#trailPosition = new Float32Array(config.trail.samples * 3);
      this.#trailColors = new Float32Array(config.trail.samples * 3);
      const color = new THREE.Color(config.resultantColor);
      for (let i = 0; i < config.trail.samples; i++) color.toArray(this.#trailColors, i * 3);
      this.#trailGeometry = new THREE.BufferGeometry();
      this.#trailGeometry.setAttribute('position', new THREE.BufferAttribute(this.#trailPosition, 3).setUsage(THREE.DynamicDrawUsage));
      this.#trailGeometry.setAttribute('color', new THREE.BufferAttribute(this.#trailColors, 3));
      const material = new THREE.LineBasicMaterial({vertexColors: true, transparent: true, opacity: config.trail.opacity, depthTest: false, depthWrite: false, toneMapped: false});
      this.#materials.push(material);
      const trail = new THREE.Line(this.#trailGeometry, material); trail.renderOrder = 22; trail.frustumCulled = false; this.group.add(trail);
    }
    this.update();
  }
  #setGlyph(glyph, vector, emphasis = 1) {
    const magnitude = vector.length(), length = Math.min(this.#config.maxLength, magnitude * this.#config.scale);
    glyph.group.visible = length > 1e-5; if (!glyph.group.visible) return;
    glyph.direction.copy(vector).divideScalar(magnitude); glyph.group.quaternion.setFromUnitVectors(UP, glyph.direction);
    const head = Math.min(0.10 * emphasis, length * 0.35), shaft = Math.max(1e-6, length - head);
    glyph.shaft.position.y = shaft / 2; glyph.shaft.scale.set(0.009 * emphasis, shaft, 0.009 * emphasis);
    glyph.head.position.y = shaft + head / 2; glyph.head.scale.set(0.030 * emphasis, head, 0.030 * emphasis);
  }
  update() {
    this.#sum.set(0, 0, 0);
    for (const source of this.#sources) {
      source.value = source.object.userData.data[source.key];
      if (!Number.isFinite(source.value)) throw new Error(`Campo: ${source.entity}.${source.channel} no es finito`);
      source.vector.copy(source.axis).multiplyScalar(source.value * source.coefficient);
      this.#sum.add(source.vector); this.#setGlyph(source.glyph, source.vector);
      if (this.#config.showSources === false) source.glyph.group.visible = false;
    }
    this.#setGlyph(this.#result, this.#sum, this.#config.emphasis ?? 1.4);
    if (this.#trailGeometry) {
      const signals = this.#sources.map(s => s.binding ? this.#engine.getBindingState(s.binding) : null);
      const rate = signals.find(s => s && s.rate !== 0)?.rate ?? 0;
      for (let i = 0; i < this.#config.trail.samples; i++) {
        const delta = this.#config.trail.arc * i / (this.#config.trail.samples - 1);
        this.#past.set(0, 0, 0);
        for (let n = 0; n < this.#sources.length; n++) {
          const s = this.#sources[n], signal = signals[n];
          const value = signal && rate !== 0 ? signal.bias + signal.amplitude * Math.sin(signal.phase + signal.offset - delta * signal.rate / rate) : s.value;
          this.#past.addScaledVector(s.axis, value * s.coefficient);
        }
        const length = this.#past.length();
        this.#past.multiplyScalar(length < 1e-8 ? 0 : Math.min(this.#config.maxLength, length * this.#config.scale) / length);
        this.#past.toArray(this.#trailPosition, i * 3);
      }
      this.#trailGeometry.attributes.position.needsUpdate = true;
    }
  }
  get state() { return { visible: this.group.visible, vector: this.#sum.toArray(), magnitude: this.#sum.length(), sources: this.#sources.map(s => ({ entity: s.entity, value: s.value, vector: s.vector.toArray() })) }; }
  setVisible(value) { this.group.visible = Boolean(value); }
  dispose() {
    if (this.#disposed) return; this.#disposed = true; this.group.removeFromParent(); this.group.clear();
    this.#shaft.dispose(); this.#head.dispose(); this.#ringGeometry.dispose(); this.#trailGeometry?.dispose(); for (const material of this.#materials) material.dispose();
  }
}
