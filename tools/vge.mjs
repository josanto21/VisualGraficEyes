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
    const flags=process.argv.slice(3);
    const {doctor}=await import('../src/core/doctor.mjs');
    const report=await doctor({root,network:!flags.includes('--sin-red')});
    report.contrato='válido';
    if(flags.includes('--json'))console.log(JSON.stringify(report,null,2));
    else{
      const {plan}=report,pad=(s,n)=>String(s).padEnd(n);
      console.log(`Entorno: Node ${report.entorno.node} · ${report.entorno.platform} · contrato ${report.contrato}`);
      console.log(`\nVerificación visual: ${plan.verificacion.estado} — ${plan.verificacion.motivo}`);
      if(plan.verificacion.siguiente)console.log(`  siguiente: ${plan.verificacion.siguiente}`);
      console.log('\nMotores');
      for(const [name,s] of Object.entries(plan.motores)){
        console.log(`  ${pad(s.estado,11)} ${pad(name,10)} ${s.motivo}`);
        for(const k of ['siguiente','alternativa','presupuesto','nota'])if(s[k])console.log(`  ${pad('',23)}${k}: ${s[k]}`);
      }
      console.log('\nPlan por modo');
      for(const [mode,m] of Object.entries(plan.modos))console.log(`  ${pad(mode,14)} ${m.estado==='LISTO'?m.motor:m.estado==='PREPARABLE'?`${m.motor} tras preparar; mientras tanto: ${m.alternativa}`:`${m.alternativa} (${m.motor} bloqueado)`}`);
      console.log('\n'+plan.notas.map(n=>'· '+n).join('\n'));
      console.log('\nDetalle completo: npm run core:doctor -- --json');
    }
  } else throw new Error('Uso: node tools/vge.mjs doctor [--json] [--sin-red]|validate|plan ID OPERACION|run ID OPERACION');
} catch(error){console.error(error.message);process.exitCode=1;}
