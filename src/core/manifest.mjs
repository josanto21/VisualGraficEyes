import Ajv2020 from 'ajv/dist/2020.js';
import schema from '../../schema/vge.project.schema.json' with {type:'json'};
const check=new Ajv2020({allErrors:true,strict:true}).compile(schema);
export function validateProject(value){
 if(!check(value))throw new Error('VGE_INVALID_PROJECT: '+check.errors.map(e=>`${e.instancePath||'/'} ${e.message}`).join('; '));
 const ids=new Set(),params=new Set();
 for(const p of value.parameters){if(params.has(p.id))throw new Error(`VGE_INVALID_PROJECT: parámetro duplicado ${p.id}`);params.add(p.id);if(p.min>p.max||p.value<p.min||p.value>p.max)throw new Error(`VGE_INVALID_PROJECT: rango de ${p.id}`);}
 for(const s of value.stages){
  if(ids.has(s.id))throw new Error(`VGE_INVALID_PROJECT: escena duplicada ${s.id}`);ids.add(s.id);
  const mapped=new Set();for(const b of s.bindings){if(!params.has(b.parameter)||mapped.has(b.parameter))throw new Error(`VGE_INVALID_PROJECT: vínculo ${s.id}/${b.parameter}`);mapped.add(b.parameter);}
  if(s.engine==='spline'&&s.enabled&&!s.source.sceneUrl)throw new Error(`VGE_INVALID_PROJECT: ${s.id} requiere exportación .splinecode`);
  if(s.engine==='circuitjs'&&s.enabled&&!s.source.simulatorUrl)throw new Error(`VGE_INVALID_PROJECT: ${s.id} requiere CircuitJS del mismo origen`);
  if(!s.enabled&&!s.reason)throw new Error(`VGE_INVALID_PROJECT: explicar por qué ${s.id} está desactivada`);
 }
 return value;
}
