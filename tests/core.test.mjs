import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateProject,VGESession,openCircuitJS,openSpline,getEngine} from '../src/core/index.mjs';
import {planNativeJob,runNativeJob} from '../src/core/native-jobs.mjs';
import {pscFactories} from '../examples/psc-factories.mjs';
const root=new URL('../',import.meta.url),project=JSON.parse(await readFile(new URL('examples/unified/project.json',root),'utf8'));
const copy=()=>structuredClone(project);
test('el manifiesto reúne fuentes nativas y las tres capas, con errores legibles',()=>{
 assert.equal(validateProject(project).stages.length,6);
 const p=copy();delete p.stages[0].layers.common;assert.throws(()=>validateProject(p),/VGE_INVALID_PROJECT.*common/);
 const q=copy();q.stages[0].label='REAL';assert.throws(()=>validateProject(q),/VGE_INVALID_PROJECT/);
 const r=copy();r.stages.push(r.stages[0]);assert.throws(()=>validateProject(r),/duplicada/);
});
test('sin exportación Spline o URL CircuitJS no se habilita una integración ficticia',()=>{
 for(const id of ['espacio','circuito']){const p=copy();p.stages.find(s=>s.id===id).enabled=true;assert.throws(()=>validateProject(p),/requiere/);}
 assert.throws(()=>getEngine('__proto__'),/UNKNOWN_ENGINE/);
});
test('sesión abre el motor PSC real y propaga un parámetro con unidad y rango',async()=>{
 const session=new VGESession(project,{readJSON:async p=>JSON.parse(await readFile(new URL(p,root),'utf8')),engineOptions:{geometryFactories:pscFactories}});
 await session.open('abanico');session.setParam('adelanto',90);session.command('explode',0.5);session.command('select','rotor');
 assert.equal(session.layers(3).common,project.stages[1].layers.common);assert.ok(session.layers(3).advanced);assert.equal(session.layers().technical,undefined);
 assert.throws(()=>session.setParam('adelanto',181),/INVALID_PARAMETER/);assert.throws(()=>session.command('render'),/UNSUPPORTED_OPERATION/);
 await assert.rejects(session.open('espacio'),/CONFIGURATION_REQUIRED/);await assert.rejects(session.open('pasos'),/NATIVE_JOB_REQUIRED/);
 assert.equal(session.active,'abanico');session.dispose();session.dispose();assert.throws(()=>session.play(),/DISPOSED/);
});
test('ocultar pausa y volver respeta la pausa elegida; liberar quita el listener',async()=>{
 let callback,playing=false,disposed=0;
 const doc={hidden:false,addEventListener:(n,f)=>callback=f,removeEventListener:()=>callback=null};
 const adapter=async()=>({pause:()=>playing=false,play:()=>playing=true,setParam:()=>{},dispose:()=>disposed++});
 const session=new VGESession(project,{visibilityDocument:doc,adapters:{threejs:adapter}});await session.open('abanico');session.play();assert.equal(playing,true);
 doc.hidden=true;callback();assert.equal(playing,false);doc.hidden=false;callback();assert.equal(playing,true);
 session.pause();doc.hidden=true;callback();doc.hidden=false;callback();assert.equal(playing,false);session.dispose();assert.equal(callback,null);assert.equal(disposed,1);
});
test('CircuitJS: contrato de API, importación, medidas y pausa con doble; no simulación nativa',async()=>{
 const calls=[],sim={setSimRunning:v=>calls.push(['run',v]),importCircuit:(s,b)=>calls.push(['import',s,b]),setExtVoltage:(n,v)=>calls.push(['param',n,v]),getTime:()=>0.1,getElements:()=>[{getType:()=>'ResistorElm',getCurrent:()=>0.005,getVoltageDiff:()=>5}]};
 const stage=project.stages.find(s=>s.engine==='circuitjs'),a=await openCircuitJS(stage,{circuitWindow:{CircuitJS1:sim},readText:async()=>'circuit'});
 a.setParam('source',5);a.play();assert.equal(a.sample().elements[0].current,0.005);a.dispose();assert.deepEqual(calls.at(-1),['run',false]);assert.ok(calls.some(c=>c[0]==='import'&&c[2]===false));
 await assert.rejects(openCircuitJS(stage,{}),/CIRCUITJS_UNAVAILABLE/);
});
test('Spline: contrato con doble, limpieza en error; no carga nativa de una escena',async()=>{
 let disposed=0,loaded;class App{load(p){loaded=p;return Promise.resolve();}stop(){}play(){}setVariable(){}findObjectById(){return undefined;}dispose(){disposed++;}}
 const stage={source:{sceneUrl:'owned-scene.splinecode'}};const a=await openSpline(stage,{SplineApplication:App,canvas:{}});assert.equal(loaded,stage.source.sceneUrl);assert.throws(()=>a.select('missing'),/UNKNOWN_ENTITY/);a.dispose();assert.equal(disposed,1);
 class Broken extends App{load(){return Promise.reject(new Error('load failed'));}}
 await assert.rejects(openSpline(stage,{SplineApplication:Broken,canvas:{}}),/load failed/);assert.equal(disposed,2);
});
test('tareas nativas conservan su ejecutable y rechazan salir del proyecto',()=>{
 const path=new URL('../',import.meta.url).pathname;
 const m=planNativeJob(project,'pasos','render',{root:path});assert.deepEqual(m.args.slice(0,3),['-m','manim','render']);
 const p=copy();p.stages[0].source.entry='../outside.mjs';assert.throws(()=>planNativeJob(p,'maquina','build',{root:path}),/INVALID_PROJECT|INVALID_PATH/);
 assert.throws(()=>planNativeJob(project,'maquina','render',{root:path}),/UNSUPPORTED_OPERATION/);
});
test('un proceso exitoso sin artefacto no se declara render terminado',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'vge-native-'));
 try{const entry=join(dir,'empty.mjs');await writeFile(entry,'');await assert.rejects(runNativeJob({engine:'test',command:process.execPath,args:[entry,join(dir,'missing.mp4')],cwd:dir,output:join(dir,'missing.mp4')}),/MISSING_OUTPUT/);}finally{await rm(dir,{recursive:true,force:true});}
});
test('las tareas nativas reciben el mismo contrato de datos y rechazan valores fuera de rango',()=>{
 const path=new URL('../',import.meta.url).pathname;
 const a=planNativeJob(project,'maquina','build',{root:path,parameters:{adelanto:90}});
 const m=planNativeJob(project,'pasos','render',{root:path,parameters:{adelanto:90}});
 assert.equal(JSON.parse(a.args[2]).parameters.adelanto,90);
 assert.equal(JSON.parse(m.env.VGE_STAGE_DATA).parameters.adelanto,90);
 assert.equal(JSON.parse(m.env.VGE_STAGE_DATA).layers.common,project.stages.find(s=>s.id==='pasos').layers.common);
 assert.throws(()=>planNativeJob(project,'maquina','build',{root:path,parameters:{adelanto:999}}),/INVALID_PARAMETER/);
});
