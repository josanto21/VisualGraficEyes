import Ajv2020 from 'ajv/dist/2020.js';
import schema from '../../schema/vge.lesson.schema.json' with {type:'json'};

const validateShape = new Ajv2020({allErrors:true,strict:true}).compile(schema);
const segmenter = new Intl.Segmenter('es',{granularity:'sentence'});
export function validateLesson(lesson,document) {
  const fail = issues => {throw new Error('Lección VGE inválida:\n'+issues.map(s=>'• '+s).join('\n'))};
  if (!validateShape(lesson)) fail(validateShape.errors.map(e=>`${e.instancePath||'/'}: ${e.message}`));
  const errors=[],entities=new Map(document.entities.map(e=>[e.id,e]));
  const known=(id,scope)=>{if(!entities.has(id))errors.push(`${scope}: entidad desconocida ${id}`)};
  const unique=(items,scope)=>{
    const ids=new Set();for(const item of items){if(ids.has(item.id))errors.push(`${scope}: id duplicado ${item.id}`);ids.add(item.id)}
    return ids;
  };
  unique(lesson.parts,'parts');const terms=unique(lesson.glossary,'glossary');
  for(const part of lesson.parts){known(part.id,'parts');if(part.term&&!terms.has(part.term))errors.push(`parts.${part.id}: palabra de glosario desconocida ${part.term}`)}
  if(lesson.layout==='steps'){
    if(lesson.story.length!==document.steps.length)errors.push('story: el número de pasos no coincide con el modelo');
    if(!lesson.intro)errors.push('intro: falta la analogía común');
    for(const step of lesson.story)known(step.focus,'story.focus');
    const described=new Set(lesson.parts.map(p=>p.id));
    for(const entity of document.entities)if(entity.selectable!==false&&!described.has(entity.id))errors.push(`parts: falta la función común de ${entity.id}`);
  }
  for(const [i,step]of lesson.story.entries()){
    const count=[...segmenter.segment(step.text)].filter(({segment})=>/[\p{L}\p{N}]/u.test(segment)).length;
    if(count>2)errors.push(`story.${i}.text: ${count} frases; máximo 2`);
  }
  const bindings=document.parameters.flatMap(p=>p.bindings);
  for(const signal of lesson.signals){
    known(signal.entity,'signals');
    if(!bindings.some(b=>b.id===signal.binding&&b.entity===signal.entity))errors.push(`signals: vínculo desconocido ${signal.binding}`);
  }
  if(lesson.readout){
    const {entity,dataKey}=lesson.readout;known(entity,'readout');
    for(const step of document.steps){
      const value=step.state?.entities?.find(e=>e.id===entity)?.data?.[dataKey]??entities.get(entity)?.data?.[dataKey];
      if(!Array.isArray(value)||!value.length||!value.every(v=>typeof v==='string'||typeof v==='number'&&Number.isFinite(v)))errors.push(`readout: falta una lista de valores simples en ${step.id}`);
    }
  }
  if(errors.length)fail(errors);
  return lesson;
}
