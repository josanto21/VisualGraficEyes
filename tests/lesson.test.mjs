import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {VGEEngine} from '../src/VGEEngine.mjs';
import {VGEGraphics} from '../src/graphics/VGEGraphics.mjs';
import {CoilPulse} from '../src/graphics/CoilPulse.mjs';
import {validateDocument} from '../src/validate.mjs';
import {defaultFactories} from '../src/factories.mjs';
import {validateGraphics} from '../src/graphics/validateGraphics.mjs';
import {pscFactories} from '../examples/psc-factories.mjs';
const json=async f=>JSON.parse(await readFile(new URL(`../examples/${f}.json`,import.meta.url),'utf8'));
const data=await json('psc.beginner'),config=await json('psc.beginner.graphics'),lesson=await json('psc.lesson');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const create=()=>{const e=new VGEEngine(data,{geometryFactories:pscFactories}),g=new VGEGraphics(e,data,config,{lowPower:false}),p=new CoilPulse(e,lesson.signals);return{e,g,p}};
test('el modelo por capas conserva el contrato y sus referencias gráficas',()=>{validateDocument(data,{factories:{...defaultFactories,...pscFactories}});validateGraphics(config,data);assert.equal(lesson.story.length,4);assert.ok(lesson.story.every(s=>s.text&&s.technical&&s.advanced));});
test('buscar un instante sincroniza las dos señales con el campo, sin reconstruir el modelo',()=>{
 const{e,g}=create();e.select('blades').explode(.25);const geometry=e.getMesh('rotor_core').geometry;
 for(const[f,a,b]of[[0,0,1],[.25,1,0],[.5,0,-1],[.75,-1,0]]){e.seekCycle('mainCurrent',f);near(e.getObject('main_winding').userData.data.iNorm,a);near(e.getObject('aux_winding').userData.data.iNorm,b);near(g.state.field.vector[1],a);near(g.state.field.vector[2],-b);near(g.state.field.magnitude,1);}
 assert.equal(e.selectedId,'blades');assert.equal(e.state.exploded,.25);assert.equal(e.getMesh('rotor_core').geometry,geometry);e.dispose();
});
test('el cursor rechaza valores inválidos sin modificar el instante',()=>{const{e}=create();e.seekCycle('mainCurrent',.2);const before=e.getBindingState('mainCurrent');for(const f of [-.1,1.1,NaN])assert.throws(()=>e.seekCycle('mainCurrent',f));assert.throws(()=>e.seekCycle('missing',.5));assert.deepEqual(e.getBindingState('mainCurrent'),before);e.dispose();});
test('el brillo empieza en B y pasa a A con el mismo cursor, sin cambiar sus colores',()=>{
 const{e}=create();const a=e.getMesh('main_winding_pack0_turn0'),b=e.getMesh('aux_winding_pack0_turn0');
 e.seekCycle('mainCurrent',0);assert.ok(Math.max(...b.material.emissive.toArray())>Math.max(...a.material.emissive.toArray()));const baseA=a.material.color.getHexString(),baseB=b.material.color.getHexString();
 e.seekCycle('mainCurrent',.25);assert.ok(Math.max(...a.material.emissive.toArray())>Math.max(...b.material.emissive.toArray()));assert.equal(a.material.color.getHexString(),baseA);assert.equal(b.material.color.getHexString(),baseB);e.dispose();
});
test('B alcanza el máximo positivo antes que A con adelantos de 30, 60 y 90 grados',()=>{
 const{e}=create();
 for(const delta of [30,60,90]){
  e.setParam('phaseDeg',delta).seekCycle('mainCurrent',.25-delta/360);
  near(e.getObject('aux_winding').userData.data.iNorm,1);
  assert.ok(e.getObject('main_winding').userData.data.iNorm<1);
  e.seekCycle('mainCurrent',.25);
  near(e.getObject('main_winding').userData.data.iNorm,1);
  assert.ok(e.getObject('aux_winding').userData.data.iNorm<1);
 }
 e.dispose();
});
test('el campo gira en el sentido del giro ilustrativo y la estela usa muestras anteriores de esas señales',()=>{
 const{e,g}=create();e.seekCycle('mainCurrent',.1);const before=g.state.field.vector,rotation=e.getObject('rotor').rotation.x,bladeRotation=e.getObject('blades').rotation.x;e.advance(.02);const after=g.state.field.vector;const fieldTurn=Math.atan2(after[2],after[1])-Math.atan2(before[2],before[1]);assert.ok(fieldTurn>0);assert.ok(e.getObject('rotor').rotation.x-rotation>0);near(e.getObject('rotor').rotation.x-rotation,e.getObject('blades').rotation.x-bladeRotation);
 const trail=g.field.group.children.find(o=>o.isLine&&o.geometry.attributes.color),vertices=trail.geometry.attributes.position.array;near(vertices[1],after[1]*config.field.scale);near(vertices[2],after[2]*config.field.scale);
 assert.ok(Math.atan2(vertices.at(-1),vertices.at(-2))<Math.atan2(after[2],after[1]));e.dispose();
});
test('el verde queda reservado al campo, con metal gris y cajita neutra',()=>{
 for(const mat of Object.values(data.resources.materials))assert.notEqual(mat.color.toLowerCase(),config.field.resultantColor.toLowerCase());assert.equal(data.resources.materials.rotor.color,'#A5A5A5');assert.equal(data.entities.find(x=>x.id==='capacitor').material,'plastic');
});
test('1.000 actualizaciones con brillo y estela conservan geometrías y cachés',()=>{
 const{e,g,p}=create();e.select('main_winding');g.setSelectionMode('emissive');e.advance(.01);e.select('rotor_core');g.setSelectionMode('outline');
 const geometries=new Set();e.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry)});const before={g:g.stats,p:p.stats};
 for(let i=0;i<1000;i++)e.advance(1/60);const after=new Set();e.root.traverse(o=>{if(o.geometry)after.add(o.geometry)});assert.deepEqual(after,geometries);assert.deepEqual({g:g.stats,p:p.stats},before);e.dispose();
});
test('el adaptador libera la estela y los materiales de brillo una sola vez',()=>{
 const{e,g}=create();let disposed=0;const trail=g.field.group.children.find(o=>o.isLine&&o.geometry.attributes.color);trail.geometry.addEventListener('dispose',()=>disposed++);e.dispose();e.dispose();assert.equal(disposed,1);
});
