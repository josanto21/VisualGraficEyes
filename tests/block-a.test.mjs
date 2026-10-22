import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {syncBuiltinESMExports} from 'node:module';
import {VGEEngine} from '../src/VGEEngine.mjs';
import {validateDocument} from '../src/validate.mjs';
import {pscFactories} from '../examples/psc-factories.mjs';
import {planNativeJob,runNativeJob} from '../src/core/native-jobs.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const bubble=await json('examples/bubble-sort.json'),psc=await json('examples/psc.beginner.json'),project=await json('examples/unified/project.json');
const hash=data=>createHash('sha256').update(data).digest('hex');
const html='<!doctype html><html lang="es"><body><svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg></body></html>';

async function nativeCase(run,filename='figure.html'){
 const dir=await mkdtemp(path.join(tmpdir(),'vge-regression-a-'));
 try{
  const output=path.join(dir,filename),entry=path.join(dir,'writer.mjs'),previous=filename.endsWith('.mp4')?await readFile(new URL('fixtures/one-frame.mp4',import.meta.url)):Buffer.from(html+'\n<!-- exportación anterior -->\n');
  await writeFile(output,previous);
  await run({dir,output,entry,previous,plan:{engine:'test',operation:'build',cwd:dir,command:process.execPath,args:[entry,output],output}});
 }finally{await rm(dir,{recursive:true,force:true});}
}
test('VGE-001: un render fallido conserva los bytes y el hash de la exportación previa',()=>nativeCase(async({output,entry,previous,plan,dir})=>{
 await writeFile(entry,"import{writeFileSync}from'node:fs';writeFileSync(process.argv[2],'incompleto');process.exitCode=7;");
 await assert.rejects(runNativeJob(plan),/VGE_EXECUTION_FAILED/);
 const actual=await readFile(output);assert.deepEqual(actual,previous);assert.equal(hash(actual),hash(previous));
 assert.deepEqual((await readdir(dir)).sort(),['figure.html','writer.mjs']);
}));

test('VGE-001: error de ejecutable conserva también la exportación anterior',()=>nativeCase(async({output,previous,plan,dir})=>{
 plan.command=path.join(dir,'missing-executable');await assert.rejects(runNativeJob(plan),/VGE_EXECUTION_FAILED/);
 assert.equal(hash(await readFile(output)),hash(previous));assert.deepEqual(await readdir(dir),['figure.html']);
}));
test('VGE-001: abortar espera al cierre del proceso y conserva la salida anterior',()=>nativeCase(async({output,previous,plan,entry,dir})=>{
 await writeFile(entry,`import{writeFileSync}from'node:fs';writeFileSync(process.argv[2],${JSON.stringify(html)});setTimeout(()=>{},10000);`);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),150);
 try{await assert.rejects(runNativeJob(plan,{signal:controller.signal}),/VGE_EXECUTION_FAILED/);}finally{clearTimeout(timer);}
 assert.equal(hash(await readFile(output)),hash(previous));assert.deepEqual((await readdir(dir)).sort(),['figure.html','writer.mjs']);
}));
test('VGE-001: rechaza un MP4 truncado sin reemplazar el video válido',()=>nativeCase(async({output,previous,plan,entry})=>{
 await writeFile(entry,"import{writeFileSync}from'node:fs';writeFileSync(process.argv[2],Buffer.from('000000186674797069736f6d','hex'));");
 await assert.rejects(runNativeJob(plan),/VGE_INVALID_OUTPUT/);assert.equal(hash(await readFile(output)),hash(previous));
},'clip.mp4'));
test('VGE-001: acepta el contenedor de un MP4 real generado para la regresión',()=>nativeCase(async({output,plan,entry})=>{
 await writeFile(entry,"import{copyFileSync}from'node:fs';copyFileSync(process.argv[3],process.argv[2]);");
 const fixture=fileURLToPath(new URL('fixtures/one-frame.mp4',import.meta.url));plan.args.push(fixture);
 const result=await runNativeJob(plan);assert.equal(result.status,'ARTIFACT_PRODUCED');assert.equal(hash(await readFile(output)),hash(await readFile(fixture)));
},'clip.mp4'));
test('VGE-001: una salida no vacía pero inválida tampoco reemplaza la anterior',()=>nativeCase(async({output,entry,previous,plan})=>{
 await writeFile(entry,"import{writeFileSync}from'node:fs';writeFileSync(process.argv[2],'esto no es un documento HTML');");
 await assert.rejects(runNativeJob(plan),/VGE_INVALID_OUTPUT/);assert.equal(hash(await readFile(output)),hash(previous));
}));
test('VGE-001: un éxito se construye en temporal antes de sustituir la salida',()=>nativeCase(async({output,entry,previous,plan,dir})=>{
 await writeFile(entry,`import{readFileSync,writeFileSync}from'node:fs';import assert from'node:assert/strict';assert.notEqual(process.argv[2],process.env.VGE_PREVIOUS_PATH);assert.equal(readFileSync(process.env.VGE_PREVIOUS_PATH,'utf8'),${JSON.stringify(previous.toString())});writeFileSync(process.argv[2],${JSON.stringify(html)});`);
 // Instrumentación de la prueba: el hijo comprueba que la salida final aún conserva sus bytes.
 plan.env={VGE_PREVIOUS_PATH:output};
 const result=await runNativeJob(plan);assert.equal(result.status,'ARTIFACT_PRODUCED');assert.equal(result.output,output);assert.equal(await readFile(output,'utf8'),html);
 assert.deepEqual((await readdir(dir)).sort(),['figure.html','writer.mjs']);
}));

function scaleDocument({kind='LINEAR',offset=-.5,override=.1}={}){
 const d=structuredClone(bubble);d.steps[0].state.entities.find(e=>e.id==='e3').scale=[override,1,1];
 const binding={id:'sizeBinding',entity:'e3',channel:'scale.x',kind,scale:0,combine:'add',explanation:'Cambio de tamaño de prueba.'};
 if(kind==='LINEAR')binding.offset=offset;else Object.assign(binding,{bias:0,amplitude:.5});
 d.parameters.push({name:'size',label:'Tamaño',unit:'1',range:[0,1],value:0,bindings:[binding]});return d;
}
for(const config of [{kind:'LINEAR',override:.1,offset:-.5},{kind:'LINEAR',override:.5,offset:-.5},{kind:'SINE',override:.1}]){
 test(`VGE-002: rechaza escala efectiva ${config.kind}, base de paso ${config.override}`,()=>{
  assert.throws(()=>validateDocument(scaleDocument(config)),/escala.*(?:positiva|finita)/i);
 });
}
test('VGE-002: la composición válida respeta pose, paso, parámetros y escala del fallo',()=>{
 const d=scaleDocument({offset:.1,override:.2});d.parameters[0].bindings[0].scale=.2;
 d.faults=[{id:'sizeFault',title:'Cambio de prueba',scenario:'Prueba de escala.',text:'Solo cambia el tamaño.',parameterEffects:[{name:'size',operation:'set',value:.5}],visualEffects:[{entity:'e3',scale:[.8,.9,1.2]}]}];
 const e=new VGEEngine(d);try{assert.ok(Math.abs(e.getObject('e3').scale.x-.3)<1e-12);e.setParam('size',1).explode(.7);assert.ok(Math.abs(e.getObject('e3').scale.x-.5)<1e-12);e.injectFault('sizeFault');assert.deepEqual(e.getObject('e3').scale.toArray(),[.8,.9,1.2]);e.injectFault(null);assert.ok(Math.abs(e.getObject('e3').scale.x-.5)<1e-12);}finally{e.dispose();}
});
test('VGE-003: seekCycle rechaza fases no finitas antes de modificar ningún vínculo',()=>{
 const d=structuredClone(psc);d.parameters[0].bindings[0].scale=1e-320;
 const e=new VGEEngine(d,{geometryFactories:pscFactories});try{
  e.advance(.2);const ids=d.parameters.flatMap(p=>p.bindings).filter(b=>b.kind!=='LINEAR').map(b=>b.id);
  const before=ids.map(id=>e.getBindingState(id));const state=e.state,rotation=e.getObject('rotor').rotation.toArray();
  assert.throws(()=>e.seekCycle('mainCurrent',.5),/finit|fase|interval/i);
  assert.deepEqual(ids.map(id=>e.getBindingState(id)),before);assert.deepEqual(e.state,state);assert.deepEqual(e.getObject('rotor').rotation.toArray(),rotation);
  e.seekCycle('mainCurrent',0);assert.ok(ids.every(id=>Number.isFinite(e.getBindingState(id).phase)));
 }finally{e.dispose();}
});
test('VGE-004: el plan admite la salida aunque relative use separadores Windows',()=>{
 // Reproduce el separador de path.win32.relative conservando el filesystem POSIX del test.
 const relative=path.relative;
 try{path.relative=(...args)=>relative(...args).replaceAll('/','\\');syncBuiltinESMExports();
  const p=planNativeJob(project,'maquina','build',{root});assert.equal(p.output,path.resolve(root,'out/anatomy.html'));
 }finally{path.relative=relative;syncBuiltinESMExports();}
});
test('VGE-004: rechaza salidas fuera de out, incluso con un prefijo parecido',()=>{
 for(const output of ['out-copy/a.html','out','../escape.html']){
  const d=structuredClone(project);d.stages[0].source.output=output;
  assert.throws(()=>planNativeJob(d,'maquina','build',{root}),/INVALID_PATH|INVALID_PROJECT/);
 }
});
