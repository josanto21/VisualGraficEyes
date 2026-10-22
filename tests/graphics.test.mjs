import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { VGEEngine } from '../src/VGEEngine.mjs';
import { VGEGraphics } from '../src/graphics/VGEGraphics.mjs';
import { validateGraphics } from '../src/graphics/validateGraphics.mjs';
import { pscFactories } from '../examples/psc-factories.mjs';
const data=JSON.parse(await readFile(new URL('../examples/psc.json',import.meta.url),'utf8'));
const config=JSON.parse(await readFile(new URL('../examples/psc.graphics.json',import.meta.url),'utf8'));
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} ≠ ${b}`);
function create(options={},document=data){const e=new VGEEngine(document,{geometryFactories:pscFactories});const g=new VGEGraphics(e,document,config,{lowPower:false,...options});return{e,g};}
test('las cuatro condiciones del contrato están presentes y son ejecutables',()=>{
 const d=structuredClone(data);d.faults.push({id:'hideRotor',title:'Ocultar rotor',scenario:'Prueba de visibilidad',text:'Modo límite declarativo',visualEffects:[{entity:'rotor',visible:false}],parameterEffects:[{name:'rotorFreedom',operation:'set',value:0}]});
 const{e}=create({},d);assert.ok(d.steps.some(s=>s.prediction));assert.ok(d.entities.every(x=>x.transform.assembled.position&&x.transform.exploded.position));assert.equal(e.getObject('rotor_core').parent,e.getObject('rotor'));assert.ok(['ILUSTRACIÓN','SIMULACIÓN'].includes(d.model.kind));
 e.injectFault('hideRotor');assert.equal(e.getObject('rotor').visible,false);assert.equal(e.getParameter('rotorFreedom'),0);e.injectFault(null);assert.equal(e.getObject('rotor').visible,true);assert.equal(e.getParameter('rotorFreedom'),1);assert.throws(()=>new VGEEngine({}),/Documento VGE inválido/);e.dispose();
});
test('el slider mueve un plano real en el espacio del ancla y nunca modifica vértices',()=>{
 const{e,g}=create();const geo=e.getMesh('shell').geometry,positions=geo.attributes.position.array.slice();g.setCut(0);approx(g.plane.constant,1.43+.78);assert.ok(!g.isClipped(e.getMesh('shell'),new THREE.Vector3(0,2.16,0)));
 g.setCut(.5);approx(g.plane.constant,1.43);assert.ok(g.isClipped(e.getMesh('shell'),new THREE.Vector3(0,1.8,0)));assert.ok(!g.isClipped(e.getMesh('shell'),new THREE.Vector3(0,1.1,0)));assert.ok(!g.isClipped(e.getMesh('rotor_core'),new THREE.Vector3(0,1.8,0)));assert.equal(e.getMesh('shell').geometry,geo);assert.deepEqual(geo.attributes.position.array,positions);assert.throws(()=>g.setCut(1.1),RangeError);e.dispose();
});
test('el clipping clona materiales sin recortar otras piezas que compartían material',()=>{
 const{e,g}=create();const cover=e.getMesh('front_bearing').material,shaft=e.getMesh('shaft_part').material;assert.notEqual(cover,shaft);assert.equal(cover.clippingPlanes.length,1);assert.equal(shaft.clippingPlanes,null);const plane=cover.clippingPlanes[0];g.setCut(.8);assert.equal(e.getMesh('front_bearing').material,cover);assert.equal(cover.clippingPlanes[0],plane);e.dispose();
});
test('el contorno solo aparece en la entidad seleccionada y conserva la geometría',()=>{
 const{e,g}=create();g.setSelectionMode('outline');e.select('rotor_core');const selected=e.getMesh('rotor_core'),outline=selected.children.find(c=>c.userData.vgeEffect);assert.ok(outline.visible);assert.equal(outline.geometry,selected.geometry);assert.equal(e.getMesh('shell').children.find(c=>c.userData.vgeEffect).visible,false);assert.equal(g.stats.visibleOutlines,1);e.advance(.05);assert.equal(g.stats.visibleOutlines,1);e.select('blade0');assert.equal(outline.visible,false);assert.equal(g.stats.visibleOutlines,1);e.select(null);assert.equal(g.stats.visibleOutlines,0);e.dispose();
});
test('la selección de un grupo cubre únicamente su subárbol',()=>{
 const{e,g}=create();g.setSelectionMode('outline');e.select('rotor');assert.ok(g.stats.visibleOutlines>1);for(const id of ['shell','blade0','capacitor'])assert.equal(e.getMesh(id).children.find(c=>c.userData.vgeEffect).visible,false);e.dispose();
});
test('respaldo emisivo aislado, reversible y compatible con fallos',()=>{
 const{e,g}=create();const base=e.getMesh('cage_bar0').material;g.setSelectionMode('emissive');e.select('shaft_part');const selected=e.getMesh('shaft_part').material;assert.notEqual(selected,base);assert.equal(e.getMesh('cage_bar1').material,base);assert.ok(selected.emissive.r>0);assert.equal(base.emissive.r,0);assert.equal(g.stats.visibleOutlines,0);e.select(null);assert.equal(e.getMesh('shaft_part').material,base);e.select('rotor_core').injectFault('rotor_blocked');assert.equal(e.getMesh('rotor_core').material.color.getHexString(),'ff746a');e.injectFault(null);assert.equal(e.getMesh('rotor_core').material.color.getHexString(),'a5a5a5');e.dispose();
});
test('auto usa emisivo por equipo limitado, coste de grupo o intervalos lentos',()=>{
 let h=create({lowPower:true});h.e.select('rotor_core');assert.equal(h.g.state.actualSelectionMode,'emissive');h.e.dispose();h=create({lowPower:false});h.e.select('rotor_core');assert.equal(h.g.state.actualSelectionMode,'outline');h.e.select('rotor');assert.equal(h.g.state.actualSelectionMode,'emissive');h.e.select('rotor_core');for(let i=0;i<40;i++)h.g.observeFrame(i*70,true);h.e.refresh();assert.equal(h.g.state.actualSelectionMode,'emissive');assert.equal(h.g.state.slowFallback,true);h.e.dispose();
});
test('el campo es la suma de los datos de corrientes, sin oscilador independiente',()=>{
 const{e,g}=create();e.advance(.071);const m=e.getObject('main_winding').userData.data.iNorm,a=e.getObject('aux_winding').userData.data.iNorm;const v=g.state.field.vector;approx(v[0],0);approx(v[1],m);approx(v[2],-a);const frozen=g.state.field.vector;for(let i=0;i<30;i++)e.refresh();assert.deepEqual(g.state.field.vector,frozen);e.setParam('frequencyHz',50);assert.deepEqual(g.state.field.vector,frozen);e.advance(.02);assert.notDeepEqual(g.state.field.vector,frozen);e.dispose();
});
test('con corrientes en cuadratura de igual amplitud el módulo es constante',()=>{
 const{e,g}=create();e.setParam('phaseDeg',90).setParam('auxAmplitude',1);let before;for(let i=0;i<40;i++){e.advance(.01);const s=g.state.field;approx(s.magnitude,1);const angle=Math.atan2(s.vector[2],s.vector[1]);if(before!==undefined)assert.ok(Math.atan2(Math.sin(angle-before),Math.cos(angle-before))>0);before=angle;}e.dispose();
});
test('con desfase 0 el campo pulsa sobre una línea y puede anularse',()=>{
 const{e,g}=create();e.setParam('phaseDeg',0).setParam('auxAmplitude',1);approx(g.state.field.magnitude,0);e.advance(.05);const v=g.state.field.vector;approx(v[1],-v[2]);assert.ok(g.state.field.magnitude>0);e.dispose();
});
test('la amplitud auxiliar nula elimina su contribución al campo',()=>{
 const{e,g}=create();e.advance(.03).injectFault('capacitor_open');approx(g.state.field.sources[1].value,0);approx(g.state.field.vector[2],0);e.injectFault(null);assert.notEqual(g.state.field.vector[2],0);e.dispose();
});
test('1.000 frames no reemplazan geometrías ni expanden cachés tras calentar estados',()=>{
 const{e,g}=create();e.select('rotor_core');g.setSelectionMode('emissive');g.setSelectionMode('outline');const before=g.stats,geometries=new Set();e.root.traverse(o=>{if(o.isMesh)geometries.add(o.geometry)});for(let i=0;i<1000;i++){e.advance(1/60);if(i%100===0)g.setCut(i/1000)}assert.deepEqual(g.stats,before);const after=new Set();e.root.traverse(o=>{if(o.isMesh)after.add(o.geometry)});assert.deepEqual(after,geometries);e.dispose();
});
test('el adaptador libera sus recursos y nunca dispone la geometría prestada',()=>{
 const{e,g}=create();let n=0;e.getMesh('shell').geometry.addEventListener('dispose',()=>n++);e.removeEffect(g);assert.equal(n,0);assert.equal(e.getMesh('shell').children.length,0);assert.equal(e.getMesh('shell').material.clippingPlanes,null);e.dispose();assert.equal(n,1);
});
test('referencias gráficas erróneas se rechazan con un mensaje identificable',()=>{
 for(const mutate of [c=>c.clipping.anchor='missing',c=>c.field.sources[0].channel='data.missing',c=>c.field.sources[0].axis=[0,0,0],c=>c.clipping.range=[1,-1]]){const c=structuredClone(config);mutate(c);assert.throws(()=>validateGraphics(c,data),/Documento VGE inválido/);}
});
