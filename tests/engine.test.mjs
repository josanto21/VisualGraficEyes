import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { VGEEngine } from '../src/VGEEngine.mjs';
import { validateDocument, VGEValidationError } from '../src/validate.mjs';
import { defaultFactories } from '../src/factories.mjs';
import { AssetLoader } from '../src/AssetLoader.mjs';
import { pscFactories } from '../examples/psc-factories.mjs';

const read = async name => JSON.parse(await readFile(new URL(`../examples/${name}.json`, import.meta.url), 'utf8'));
const psc = await read('psc'), sorting = await read('bubble-sort');
const factories = { ...defaultFactories, ...pscFactories };
const create = (doc = psc, opts = {}) => new VGEEngine(doc, { geometryFactories: pscFactories, ...opts });
const approx = (a, b, eps = 1e-7) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
const angleDistance = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

test('ambos dominios cumplen el mismo contrato', () => {
  validateDocument(psc, { factories }); validateDocument(sorting);
});
test('rechaza errores de estructura y versiones antes de construir', () => {
  for (const mutate of [d => d.schemaVersion = '3.0', d => d.entities[0].unexpected = true, d => d.steps[0].camera.position = [1, 2]]) {
    const d = structuredClone(psc); mutate(d); assert.throws(() => create(d), VGEValidationError);
  }
});
test('rechaza IDs repetidos, padres inexistentes y ciclos', () => {
  for (const mutate of [d => d.entities.push(structuredClone(d.entities[1])), d => d.entities[1].parent = 'missing', d => d.entities[1].parent = d.entities[2].id]) {
    const d = structuredClone(psc); mutate(d); assert.throws(() => create(d), VGEValidationError);
  }
});
test('valida parámetros de las fábricas, referencias y canales duplicados', () => {
  for (const mutate of [
    d => d.resources.geometries.shellRing.params.innerRadius = 1,
    d => d.entities[2].material = 'missing',
    d => d.parameters[0].bindings[0].gains = ['missing'],
    d => d.parameters[0].bindings.push({ ...d.parameters[0].bindings[0], id: 'duplicateChannel' }),
    d => d.resources.geometries.bladeShape.factory = 'eval',
    d => d.parameters[0].range = [65, 45],
    d => d.steps[0].camera.far = 0.001,
    d => d.steps[0].state = { entities: [{ id: 'main_winding', data: { iNorm: 'incorrecto' } }] },
    d => d.faults[0].visualEffects = [{ entity: 'motor', material: 'fault' }],
  ]) { const d = structuredClone(psc); mutate(d); assert.throws(() => create(d), VGEValidationError); }
});
test('no acepta funciones, NaN, claves peligrosas ni documentos circulares', () => {
  for (const mutate of [d => d.metadata.title = () => {}, d => d.parameters[0].value = NaN, d => d.entities[0].data = JSON.parse('{"__proto__":{"polluted":true}}'), d => d.entities[0].data = d]) {
    const d = structuredClone(psc); mutate(d); assert.throws(() => create(d), VGEValidationError);
  }
  assert.equal({}.polluted, undefined);
});
test('construye la jerarquía aunque los padres aparezcan después', () => {
  const d = structuredClone(psc); d.entities.reverse();
  const e = create(d);
  assert.equal(e.getObject('rotor_core').parent, e.getObject('rotor'));
  assert.equal(e.getObject('rotor').parent, e.getObject('motor'));
  e.dispose();
});
test('reutiliza recursos idénticos incluso con IDs distintos', () => {
  const d = structuredClone(psc);
  d.resources.geometries.secondBar = { params: { length: 0.96, radius: 0.023 }, factory: 'cylinderX', kind: 'parametric' };
  d.resources.materials.otherSteel = { ...d.resources.materials.steel };
  const second = d.entities.find(e => e.id === 'cage_bar1'); second.geometry = 'secondBar'; second.material = 'otherSteel';
  const e = create(d);
  assert.equal(e.getMesh('cage_bar0').geometry, e.getMesh('cage_bar1').geometry);
  assert.equal(e.getMesh('cage_bar0').material, e.getMesh('cage_bar1').material);
  assert.equal(e.getMesh('blade0').geometry, e.getMesh('blade2').geometry);
  e.dispose();
});
test('ninguna geometría/material se recrea durante 1.000 actualizaciones', () => {
  const e = create();
  const before = e.stats, geometry = e.getMesh('rotor_core').geometry;
  for (let i = 0; i < 1000; i++) { e.advance(1 / 60); if (i % 100 === 0) e.explode(i / 1000); }
  assert.deepEqual(e.stats, before); assert.equal(e.getMesh('rotor_core').geometry, geometry);
  e.dispose();
});
test('el despiece usa coordenadas locales absolutas y no acumula desplazamientos', () => {
  const e = create(); e.explode(1);
  assert.equal(e.getObject('rotor').position.x, 1.55);
  approx(e.getObject('front').position.x, 3.26);
  e.explode(0.5); assert.equal(e.getObject('rotor').position.x, 0.775);
  e.explode(0); e.root.updateMatrixWorld(true);
  const center = e.getObject('rotor').getWorldPosition(new THREE.Vector3());
  assert.deepEqual(center.toArray(), [0, 1.43, 0]);
  assert.throws(() => e.explode(1.1), RangeError); e.dispose();
});
test('seleccionar emite evento sin mutar materiales compartidos', () => {
  const e = create(); const material = e.getMesh('rotor_core').material;
  let id; e.addEventListener('selectionchange', event => id = event.id);
  e.select('rotor_core'); assert.equal(id, 'rotor_core'); assert.equal(e.state.selected, id);
  assert.equal(e.getMesh('rotor_core').material, material);
  assert.throws(() => e.select('cage_bar0'), RangeError);
  assert.throws(() => e.select('missing'), RangeError);
  e.select(null); assert.equal(e.state.selected, null); e.dispose();
});
test('cambiar velocidad conserva la fase y cambia su derivada', () => {
  const e = create(); e.advance(0.25);
  const before = e.getObject('rotor').rotation.x;
  e.setParam('visualSpeedRpm', 30); approx(e.getObject('rotor').rotation.x, before);
  e.advance(0.1); approx(angleDistance(e.getObject('rotor').rotation.x, before), Math.PI * 0.1);
  approx(e.getObject('blades').rotation.x, e.getObject('rotor').rotation.x);
  e.dispose();
});
test('corrientes normalizadas comparten reloj y respetan el desfase indicado', () => {
  const e = create(); e.setParam('phaseDeg', 90).setParam('auxAmplitude', 0.5).advance(0.02);
  const phase = 2 * Math.PI * 60 * 0.025 * 0.02;
  approx(e.getObject('main_winding').userData.data.iNorm, Math.sin(phase));
  approx(e.getObject('aux_winding').userData.data.iNorm, 0.5 * Math.sin(phase + Math.PI / 2));
  const before = e.getObject('main_winding').userData.data.iNorm;
  e.setParam('frequencyHz', 50); approx(e.getObject('main_winding').userData.data.iNorm, before);
  e.dispose();
});
test('parámetros inválidos no alteran el estado', () => {
  const e = create(), before = e.state;
  assert.throws(() => e.setParam('frequencyHz', 0), RangeError);
  assert.throws(() => e.setParam('missing', 1), RangeError);
  assert.throws(() => e.setParam('frequencyHz', Infinity), TypeError);
  assert.deepEqual(e.state, before); e.dispose();
});
test('fallos reversibles conservan solicitudes y no contaminan materiales de otras piezas', () => {
  const e = create(); const original = e.getMesh('rotor_core').material;
  const other = e.getMesh('cage_bar0').material;
  e.injectFault('rotor_blocked').advance(0.2);
  assert.equal(e.getObject('rotor').rotation.x, 0); assert.equal(e.state.parameters.rotorFreedom, 0);
  assert.notEqual(e.getMesh('rotor_core').material, original); assert.equal(e.getMesh('cage_bar0').material, other);
  e.setParam('rotorFreedom', 0.7); assert.equal(e.state.parameters.rotorFreedom, 0);
  e.injectFault(null); assert.equal(e.state.parameters.rotorFreedom, 0.7); assert.equal(e.getMesh('rotor_core').material, original);
  e.injectFault('capacitor_open'); assert.equal(e.state.parameters.auxAmplitude, 0); assert.equal(e.state.parameters.visualSpeedRpm, 0);
  assert.equal(e.getObject('aux_winding').userData.data.iNorm, 0);
  e.injectFault(null); assert.equal(e.state.parameters.visualSpeedRpm, 18);
  e.dispose();
});
test('un fallo fuera del rango falla de forma atómica', () => {
  const d = structuredClone(psc); d.faults[0].parameterEffects = [{ name: 'frequencyHz', operation: 'multiply', value: 2 }];
  const e = create(d); const before = e.state;
  assert.throws(() => e.injectFault('capacitor_open'), RangeError); assert.deepEqual(e.state, before); e.dispose();
});
test('visible incluye subárbol y ancestros, sin activar hermanos', () => {
  const d = structuredClone(psc); d.steps[0].visible = ['rotor_core'];
  const e = create(d);
  assert.equal(e.getObject('rotor_core').visible, true); assert.equal(e.getObject('rotor').visible, true);
  assert.equal(e.getObject('motor').visible, true); assert.equal(e.getObject('shaft_part').visible, false);
  assert.equal(e.getObject('stator').visible, false); e.dispose();
});
test('los pasos restablecen transformaciones, datos, fase y visibilidad', () => {
  const e = create(); e.advance(0.2).select('rotor').explode(0.8).setStep(6);
  assert.equal(e.state.exploded, 1); assert.equal(e.state.parameters.visualSpeedRpm, 0);
  e.setStep(0); assert.equal(e.state.exploded, 0); assert.equal(e.state.selected, null);
  assert.equal(e.state.parameters.visualSpeedRpm, 18); assert.equal(e.getObject('rotor').rotation.x, 0);
  e.setParam('visualSpeedRpm', 24).setStep(6); assert.equal(e.state.parameters.visualSpeedRpm, 24);
  // Preferencia explícita del usuario > valor recomendado del paso.
  e.dispose();
});
test('el mismo núcleo reproduce el ordenamiento y permite retroceder', () => {
  const e = new VGEEngine(sorting);
  const order = () => ['e1', 'e2', 'e3'].sort((a, b) => e.getObject(a).position.x - e.getObject(b).position.x).map(id => e.getObject(id).userData.data.value);
  const expected = [[3,1,2],[3,1,2],[1,3,2],[1,3,2],[1,2,3],[1,2,3],[1,2,3]];
  for (let i = 0; i < expected.length; i++) { e.setStep(i); assert.deepEqual(order(), expected[i]); assert.deepEqual(e.getObject('array').userData.data.values, expected[i]); }
  e.setStep(0); assert.deepEqual(order(), [3,1,2]); assert.equal(e.getObject('array').userData.data.sorted, false);
  e.dispose();
});
test('el resultado y el multiconjunto de la traza concuerdan con el orden ascendente', () => {
  const input = sorting.entities[0].data.input;
  const reference = [...input].sort((a, b) => a - b);
  for (const step of sorting.steps) {
    const values = step.state.entities.find(s => s.id === 'array').data.values;
    assert.deepEqual([...values].sort((a, b) => a - b), reference);
  }
  assert.deepEqual(sorting.steps.at(-1).state.entities.find(s => s.id === 'array').data.values, reference);
});
test('la reserva .glb valida, pero se rechaza construir sin implementar el cargador', async () => {
  const d = structuredClone(sorting); d.resources.geometries.bar = { kind: 'asset', uri: './bars.glb', format: 'glb' };
  validateDocument(d); assert.throws(() => new VGEEngine(d), /GLB_NOT_IMPLEMENTED/);
  await assert.rejects(new AssetLoader().load({ uri: './bars.glb' }), /GLB_NOT_IMPLEMENTED/);
});

function harness(document = psc) {
  const visibility = new EventTarget(); visibility.hidden = false;
  const callbacks = new Map(); let next = 0;
  const surface = { getBoundingClientRect: () => ({ width: 320, height: 420 }) };
  const renderer = { domElement: surface, calls: 0, disposed: 0, render() { this.calls++; }, dispose() { this.disposed++; }, setSize(w,h) { this.size = [w,h]; }, setPixelRatio(r) { this.ratio = r; } };
  let io, ro;
  class IO { constructor(cb) { io = this; this.cb = cb; } observe() {} disconnect() { this.disconnected = true; } set(visible) { this.cb([{ target: surface, isIntersecting: visible }]); } }
  class RO { constructor(cb) { ro = this; this.cb = cb; } observe() {} disconnect() { this.disconnected = true; } }
  const e = create(document, { renderer, surface, visibilityDocument: visibility, IntersectionObserver: IO, ResizeObserver: RO,
    requestFrame: cb => { callbacks.set(++next, cb); return next; }, cancelFrame: id => callbacks.delete(id) });
  return { e, visibility, renderer, callbacks, io, ro, frame(now) { const current = [...callbacks.values()]; callbacks.clear(); current.forEach(cb => cb(now)); }, hidden(value) { visibility.hidden = value; visibility.dispatchEvent(new Event('visibilitychange')); } };
}
test('pausado dibuja cambios una vez y queda sin RAF pendiente', () => {
  const h = harness(); h.frame(0); assert.equal(h.renderer.calls, 1); assert.equal(h.callbacks.size, 0);
  h.e.explode(0.5); assert.equal(h.callbacks.size, 1); h.frame(16);
  assert.equal(h.renderer.calls, 2); assert.equal(h.callbacks.size, 0);
  assert.deepEqual(h.renderer.size, [320,420]); assert.ok(h.renderer.ratio <= 1.5); h.e.dispose();
});
test('advance manual solicita un dibujo y admite intervalos finitos grandes sin NaN', () => {
  const h = harness(); h.frame(0); h.e.advance(0.1); assert.equal(h.callbacks.size, 1); h.frame(100);
  assert.equal(h.renderer.calls, 2); assert.equal(h.callbacks.size, 0);
  h.e.advance(1e300); assert.ok(Number.isFinite(h.e.getObject('rotor').rotation.x)); h.e.dispose();
});
test('ocultar pestaña cancela RAF y reanuda sin salto temporal', () => {
  const h = harness(); h.e.play(); h.frame(0); h.frame(40);
  const angle = h.e.getObject('rotor').rotation.x, count = h.renderer.calls;
  h.hidden(true); assert.equal(h.callbacks.size, 0);
  h.e.setParam('visualSpeedRpm', 24); h.frame(5000); assert.equal(h.renderer.calls, count);
  h.hidden(false); h.frame(8000); approx(h.e.getObject('rotor').rotation.x, angle);
  h.frame(8040); assert.ok(h.e.getObject('rotor').rotation.x > angle); h.e.dispose();
});
test('fuera de pantalla no dibuja, incluso con cambios pendientes', () => {
  const h = harness(); h.e.play(); h.frame(0); h.io.set(false);
  assert.equal(h.callbacks.size, 0); h.e.explode(1); assert.equal(h.callbacks.size, 0);
  const count = h.renderer.calls; h.frame(3000); assert.equal(h.renderer.calls, count);
  h.io.set(true); h.frame(4000); assert.equal(h.renderer.calls, count + 1); h.e.dispose();
});
test('una escena estática no mantiene RAF aunque se invoque play', () => {
  const h = harness(sorting); h.e.play(); h.frame(0); assert.equal(h.callbacks.size, 0); h.e.dispose();
});
test('dispose libera cada recurso una sola vez y respeta la propiedad del renderer', () => {
  const h = harness(); const disposed = new Map(), resources = new Set();
  h.e.root.traverse(o => { if (o.isMesh) { resources.add(o.geometry); resources.add(o.material); } });
  // Incluye el material de fallo precalculado que no está montado inicialmente.
  h.e.injectFault('rotor_blocked'); resources.add(h.e.getMesh('rotor_core').material);
  for (const r of resources) r.addEventListener('dispose', () => disposed.set(r, (disposed.get(r) ?? 0) + 1));
  const scene = h.e.scene; h.e.play().dispose(); h.e.dispose();
  assert.equal(h.callbacks.size, 0); assert.ok(h.io.disconnected && h.ro.disconnected);
  assert.equal(scene.children.length, 0); assert.equal(disposed.size, resources.size);
  assert.ok([...disposed.values()].every(n => n === 1)); assert.equal(h.renderer.disposed, 0);
  assert.throws(() => h.e.select('rotor'), /liberado/);
  const renderer = { render() {}, dispose() { this.done = true; } };
  const e = create(psc, { renderer, ownsRenderer: true, requestFrame: () => 1, cancelFrame: () => {} }); e.dispose(); assert.equal(renderer.done, true);
});
test('la resolución mobile tiene menos triángulos; datos y API se conservan', () => {
  const mobile = create(), desktop = create(psc, { quality: 'desktop' });
  const count = e => { let n = 0; const seen = new Set(); e.root.traverse(o => { if (o.isMesh && !seen.has(o.geometry)) { seen.add(o.geometry); n += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3; } }); return n; };
  assert.ok(count(mobile) < count(desktop)); assert.deepEqual(mobile.state, desktop.state);
  mobile.dispose(); desktop.dispose();
});
