import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read = path => readFile(new URL('../'+path,import.meta.url),'utf8');
const json = async path => JSON.parse(await read(path));

test('C: las dos lecciones y el esquema distribuido son válidos', async () => {
  const {validateLesson} = await import('../src/ui/validateLesson.mjs');
  for (const [lesson,model] of [['psc','psc.beginner'],['bubble-sort','bubble-sort']]) {
    const data=await json('examples/'+lesson+'.lesson.json');
    assert.equal(validateLesson(data,await json('examples/'+model+'.json')),data);
  }
  assert.equal(await read('schema/vge.lesson.schema.json'),await read('skill/assets/vge.lesson.schema.json'));
});

test('C: rechaza capas vacías, referencias erróneas y pasos incompatibles con mensajes claros', async () => {
  const {validateLesson}=await import('../src/ui/validateLesson.mjs');
  const lesson=await json('examples/bubble-sort.lesson.json'),model=await json('examples/bubble-sort.json');
  for (const field of ['text','technical','advanced']) {
    const bad=structuredClone(lesson);delete bad.story[0][field];
    assert.throws(()=>validateLesson(bad,model),/Lección VGE inválida/);
    const blank=structuredClone(lesson);blank.story[0][field]='  ';
    assert.throws(()=>validateLesson(blank,model),/Lección VGE inválida/);
  }
  const unknown=structuredClone(lesson);unknown.parts[0].id='unknown';
  assert.throws(()=>validateLesson(unknown,model),/entidad desconocida/);
  const duplicate=structuredClone(lesson);duplicate.parts.push(duplicate.parts[0]);
  assert.throws(()=>validateLesson(duplicate,model),/duplicado/);
  const wrongSteps=structuredClone(lesson);wrongSteps.story.pop();
  assert.throws(()=>validateLesson(wrongSteps,model),/pasos/);
  const verbose=structuredClone(lesson);verbose.story[0].text='Una frase. Otra frase. Una tercera.';
  assert.throws(()=>validateLesson(verbose,model),/máximo 2/);
});

test('C: la lección numérica no altera la traza y sus capas explican sus límites', async () => {
  const {validateLesson}=await import('../src/ui/validateLesson.mjs');
  const lesson=await json('examples/bubble-sort.lesson.json'),model=await json('examples/bubble-sort.json');
  const before=JSON.stringify(model);validateLesson(lesson,model);assert.equal(JSON.stringify(model),before);
  assert.equal(lesson.layout,'steps');assert.equal(lesson.story.length,7);
  assert.match(lesson.intro,/tarjetas/);assert.match(lesson.story.at(-1).technical,/1.*2.*3/);
  assert.match(lesson.story.at(-1).advanced,/preparad|predefinid|traza/i);
});

test('C: la skill mantiene público general, capas obligatorias, dos lecturas y versión coherente', async () => {
  const skill=await read('skill/SKILL.md');
  assert.ok(/tres capas obligatorias/i.test(skill),'Falta la regla obligatoria de capas');
  assert.ok(/persona sin conocimiento previo/i.test(skill),'Falta la lectura sin conocimiento previo');
  assert.ok(/persona con conocimiento/i.test(skill),'Falta la lectura con conocimiento');
  assert.ok(/vge\.lesson\.schema\.json/.test(skill),'Falta el esquema de lección');
  const pkg=await json('package.json'),lock=await json('package-lock.json');
  assert.notEqual(pkg.version,'2.0.0-alpha.2.1');assert.ok(skill.includes(pkg.version));
  assert.equal(lock.version,pkg.version);assert.equal(lock.packages[''].version,pkg.version);
});
