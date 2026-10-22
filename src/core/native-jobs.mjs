import {resolve,relative,isAbsolute,dirname,join,basename,extname,sep} from 'node:path';
import {existsSync,mkdirSync,lstatSync,rmSync,realpathSync,readFileSync,mkdtempSync,renameSync,openSync,readSync,closeSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {validateProject} from './manifest.mjs';

const outside=r=>r==='..'||r.startsWith('..'+sep)||isAbsolute(r);
function local(root,path) {
  if(typeof path!=='string'||!path||isAbsolute(path)||path.includes('\\'))throw new Error('VGE_INVALID_PATH: ruta relativa requerida');
  const absolute=resolve(root,path),r=relative(root,absolute);
  if(outside(r))throw new Error(`VGE_INVALID_PATH: ${path}`);
  let ancestor=absolute;while(!existsSync(ancestor))ancestor=dirname(ancestor);
  const rr=relative(realpathSync(root),realpathSync(ancestor));
  if(outside(rr))throw new Error(`VGE_INVALID_PATH: enlace fuera del proyecto ${path}`);
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
  const outputRelative=output?relative(resolve(root,'out'),output):null;
  if(output&&(outputRelative===''||outside(outputRelative)))throw new Error('VGE_INVALID_PATH: las salidas deben estar en out/');
  if(operation==='build'&&s.engine==='anatomy')return {engine:s.engine,operation,cwd:root,command:process.execPath,args:[entry,output,JSON.stringify(payload)],output};
  if(operation==='render'&&s.engine==='manim')return {engine:s.engine,operation,cwd:root,command:python,args:['-m','manim','render','-ql','--disable_caching','--media_dir',join(root,'out/manim'),'--output_file',output,entry,s.source.scene],env:{VGE_STAGE_DATA:JSON.stringify(payload)},output};
  if(['preview','render'].includes(operation)&&s.engine==='remotion') {
    const cwd=local(root,s.source.cwd),require=createRequire(join(cwd,'package.json'));
    let cli;try{const packagePath=require.resolve('@remotion/cli/package.json');const metadata=JSON.parse(readFileSync(packagePath,'utf8'));cli=join(dirname(packagePath),metadata.bin.remotion);if(!existsSync(cli))throw new Error('bin ausente');}catch{throw new Error('VGE_DEPENDENCY_MISSING: ejecutar npm ci --prefix integrations/remotion');}
    return {engine:s.engine,operation,cwd,command:process.execPath,args:operation==='preview'?[cli,'studio',entry,'--no-open','--props',JSON.stringify(payload)]:[cli,'render',entry,s.source.composition,output,'--codec=h264','--concurrency=1','--props',JSON.stringify(payload)],output:operation==='render'?output:null};
  }
  throw new Error(`VGE_UNSUPPORTED_OPERATION: ${s.engine}/${operation}`);
}
// Verificación estructural, no inspección visual ni decodificación completa del video.
function verifyArtifact(file) {
  if(!existsSync(file))throw new Error(`VGE_MISSING_OUTPUT: ${file}`);
  const stat=lstatSync(file);
  if(!stat.isFile()||stat.size===0)throw new Error(`VGE_INVALID_OUTPUT: se requiere un archivo regular no vacío, ${file}`);
  const extension=extname(file).toLowerCase();
  if(extension==='.html'){
    const text=readFileSync(file,'utf8');
    if(!/^\s*<!doctype html>/i.test(text)||!/<svg\b/i.test(text)||!/<\/svg\s*>/i.test(text))throw new Error(`VGE_INVALID_OUTPUT: documento HTML/SVG incompleto, ${file}`);
    return 'HTML_SVG_STRUCTURE';
  }
  if(extension==='.mp4'){
    const fd=openSync(file,'r'),header=Buffer.alloc(16),boxes=new Set();let offset=0;
    try{
      while(offset<stat.size){
        if(stat.size-offset<8||readSync(fd,header,0,8,offset)!==8)throw new Error('cabecera truncada');
        let size=header.readUInt32BE(0),minimum=8;const type=header.toString('ascii',4,8);
        if(size===1){if(readSync(fd,header,8,8,offset+8)!==8)throw new Error('tamaño truncado');size=Number(header.readBigUInt64BE(8));minimum=16;}
        if(size===0)size=stat.size-offset;
        if(!Number.isSafeInteger(size)||size<minimum||size>stat.size-offset)throw new Error('tamaño inválido');
        if(type==='mdat'&&size===minimum)throw new Error('sin datos de video');
        boxes.add(type);offset+=size;
      }
      if(!['ftyp','moov','mdat'].every(type=>boxes.has(type)))throw new Error('faltan cajas de video');
    }catch(error){throw new Error(`VGE_INVALID_OUTPUT: contenedor MP4 inválido (${error.message}), ${file}`);}
    finally{closeSync(fd);}
    return 'MP4_CONTAINER_STRUCTURE';
  }
  throw new Error(`VGE_INVALID_OUTPUT: extensión no admitida ${extension}`);
}
// Ejecutar solo mediante una acción explícita; cargar un manifiesto nunca ejecuta fuentes.
export async function runNativeJob(plan,{signal}={}) {
  let temporary=null,result,failure;
  try{
    let args=[...plan.args],candidate=null;
    if(plan.output){
      if(!args.includes(plan.output))throw new Error('VGE_MISSING_OUTPUT: falta un argumento explícito para la salida');
      mkdirSync(dirname(plan.output),{recursive:true});
      temporary=mkdtempSync(join(dirname(plan.output),'.vge-render-'));
      candidate=join(temporary,basename(plan.output));
      args=args.map(arg=>arg===plan.output?candidate:arg);
      if(plan.engine==='manim'){
        const index=args.indexOf('--media_dir');if(index>=0)args[index+1]=join(temporary,'media');
      }
    }
    const processResult=await new Promise((accept,reject)=>{
      let spawnError;
      const child=spawn(plan.command,args,{cwd:plan.cwd,stdio:'inherit',shell:false,signal,env:{...process.env,...plan.env}});
      // Esperar close también al abortar: no limpiar mientras el hijo escribe.
      child.once('error',error=>spawnError=error);
      child.once('close',(code,reason)=>spawnError?reject(new Error(`VGE_EXECUTION_FAILED: ${spawnError.message}`)):code===0?accept({code}):reject(new Error(`VGE_EXECUTION_FAILED: ${plan.engine}, código ${code}, señal ${reason??'ninguna'}`)));
    });
    const verification=candidate?verifyArtifact(candidate):null;
    // Mismo filesystem: nunca se borra primero la exportación anterior.
    if(candidate)renameSync(candidate,plan.output);
    result={...processResult,engine:plan.engine,status:plan.output?'ARTIFACT_PRODUCED':'PROCESS_COMPLETED',output:plan.output,verification,visualInspection:'NO VERIFICADO'};
  }catch(error){failure=error;}
  finally{
    if(temporary)try{rmSync(temporary,{recursive:true,force:true});}catch(error){
      // Un problema de limpieza no convierte una sustitución completada en render fallido.
      if(result)result.cleanupWarning=error.message;else if(failure)failure.cleanupError=error.message;
    }
  }
  if(failure)throw failure;
  return result;
}
