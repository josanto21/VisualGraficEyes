import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {engines,validateProject} from '../src/core/index.mjs';
import {planNativeJob,runNativeJob} from '../src/core/native-jobs.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const [action='doctor',id,operation]=process.argv.slice(2);
try {
  const project=validateProject(JSON.parse(await readFile(resolve(root,'examples/unified/project.json'),'utf8')));
  if(action==='validate'){console.log(`Manifiesto válido: ${project.stages.length} escenas, ${Object.keys(engines).length} motores`);}
  else if(action==='plan'||action==='run'){
    const plan=planNativeJob(project,id,operation,{root});
    console.log(JSON.stringify(plan,null,2));
    if(action==='run')console.log(JSON.stringify(await runNativeJob(plan),null,2));
  } else if(action==='doctor'){
    const dependency=(path,name)=>{try{const req=createRequire(resolve(root,path,'package.json'));const resolved=req.resolve(name);return {available:true,path:resolved};}catch{return {available:false};}};
    const manim=spawnSync(process.env.VGE_PYTHON??'python3',['-m','manim','--version'],{encoding:'utf8',timeout:15000});
    const anatomy=await import('../integrations/anatomy/vendor/kit/iso-kit.mjs');
    const status={
      contract:'valid',
      anatomy:{kitImported:typeof anatomy.solidSvg==='function',vendoredCopy:'partial',globalSkill:'NO VERIFICADO'},
      threejs:dependency('.','three'),
      circuitjs:{adapterImplemented:true,configurationDeclared:project.stages.find(s=>s.engine==='circuitjs').enabled,nativeSimulation:'NO VERIFICADO'},
      manim:{available:manim.status===0,version:manim.status===0?manim.stdout.trim():null,reason:manim.status===0?null:manim.error?.message??manim.stderr.trim()},
      remotion:dependency('integrations/remotion','@remotion/cli'),
      spline:{...dependency('integrations/spline','@splinetool/runtime'),sceneConfigured:project.stages.find(s=>s.engine==='spline').enabled},
      note:'Disponibilidad e importación no demuestran una ejecución visual. Consultar docs/NUCLEO-HERRAMIENTAS.md.'};
    console.log(JSON.stringify(status,null,2));
  } else throw new Error('Uso: node tools/vge.mjs doctor|validate|plan ID OPERACION|run ID OPERACION');
} catch(error){console.error(error.message);process.exitCode=1;}
