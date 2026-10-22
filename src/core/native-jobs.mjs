import {resolve,relative,isAbsolute,dirname,join} from 'node:path';
import {existsSync,mkdirSync,statSync,rmSync,realpathSync,readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {validateProject} from './manifest.mjs';

function local(root,path) {
  if(typeof path!=='string'||!path||isAbsolute(path)||path.includes('\\'))throw new Error('VGE_INVALID_PATH: ruta relativa requerida');
  const absolute=resolve(root,path),r=relative(root,absolute);
  if(r==='..'||r.startsWith('../'))throw new Error(`VGE_INVALID_PATH: ${path}`);
  let ancestor=absolute;while(!existsSync(ancestor))ancestor=dirname(ancestor);
  const rr=relative(realpathSync(root),realpathSync(ancestor));
  if(rr==='..'||rr.startsWith('../')||isAbsolute(rr))throw new Error(`VGE_INVALID_PATH: enlace fuera del proyecto ${path}`);
  return absolute;
}
export function planNativeJob(project,id,operation,{root=process.cwd(),python=process.env.VGE_PYTHON??'python3',parameters={}}={}) {
  validateProject(project);root=resolve(root);
  const s=project.stages.find(s=>s.id===id);
  if(!s)throw new Error(`VGE_UNKNOWN_STAGE: ${id}`);
  if(!s.enabled)throw new Error(`VGE_CONFIGURATION_REQUIRED: ${s.reason}`);
  const values=Object.fromEntries(project.parameters.map(p=>[p.id,p.value]));
  for(const [id,value] of Object.entries(parameters)){
    const p=project.parameters.find(p=>p.id===id);
    if(!p||!Number.isFinite(value)||value<p.min||value>p.max)throw new Error(`VGE_INVALID_PARAMETER: ${id}`);
    values[id]=value;
  }
  const payload={projectId:project.id,stageId:s.id,label:s.label,layers:s.layers,parameters:values};
  const entry=local(root,s.source.entry??'.');
  if(!existsSync(entry))throw new Error(`VGE_MISSING_SOURCE: ${s.source.entry}`);
  const output=s.source.output?local(root,s.source.output):null;
  if(output&&!relative(root,output).startsWith('out/'))throw new Error('VGE_INVALID_PATH: las salidas deben estar en out/');
  if(operation==='build'&&s.engine==='anatomy')return {engine:s.engine,operation,cwd:root,command:process.execPath,args:[entry,output,JSON.stringify(payload)],output};
  if(operation==='render'&&s.engine==='manim')return {engine:s.engine,operation,cwd:root,command:python,args:['-m','manim','render','-ql','--disable_caching','--media_dir',join(root,'out/manim'),'--output_file',output,entry,s.source.scene],env:{VGE_STAGE_DATA:JSON.stringify(payload)},output};
  if(['preview','render'].includes(operation)&&s.engine==='remotion') {
    const cwd=local(root,s.source.cwd),require=createRequire(join(cwd,'package.json'));
    let cli;try{const packagePath=require.resolve('@remotion/cli/package.json');const metadata=JSON.parse(readFileSync(packagePath,'utf8'));cli=join(dirname(packagePath),metadata.bin.remotion);if(!existsSync(cli))throw new Error('bin ausente');}catch{throw new Error('VGE_DEPENDENCY_MISSING: ejecutar npm ci --prefix integrations/remotion');}
    return {engine:s.engine,operation,cwd,command:process.execPath,args:operation==='preview'?[cli,'studio',entry,'--no-open','--props',JSON.stringify(payload)]:[cli,'render',entry,s.source.composition,output,'--codec=h264','--concurrency=1','--props',JSON.stringify(payload)],output:operation==='render'?output:null};
  }
  throw new Error(`VGE_UNSUPPORTED_OPERATION: ${s.engine}/${operation}`);
}
// Ejecutar solo mediante una acción explícita; cargar un manifiesto nunca ejecuta fuentes.
export async function runNativeJob(plan,{signal}={}) {
  if(plan.output){mkdirSync(dirname(plan.output),{recursive:true});rmSync(plan.output,{force:true});}
  const result=await new Promise((accept,reject)=>{
    const child=spawn(plan.command,plan.args,{cwd:plan.cwd,stdio:'inherit',shell:false,signal,env:{...process.env,...plan.env}});
    child.on('error',error=>reject(new Error(`VGE_EXECUTION_FAILED: ${error.message}`)));
    child.on('close',(code,reason)=>code===0?accept({code}):reject(new Error(`VGE_EXECUTION_FAILED: ${plan.engine}, código ${code}, señal ${reason??'ninguna'}`)));
  });
  if(plan.output&&(!existsSync(plan.output)||statSync(plan.output).size===0))throw new Error(`VGE_MISSING_OUTPUT: ${plan.output}`);
  return {...result,engine:plan.engine,status:plan.output?'ARTIFACT_PRODUCED':'PROCESS_COMPLETED',output:plan.output,visualInspection:'NO VERIFICADO'};
}
