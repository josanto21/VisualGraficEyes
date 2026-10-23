import { readFile } from 'node:fs/promises';
import { validateDocument } from '../src/validate.mjs';
import { defaultFactories } from '../src/factories.mjs';
import { pscFactories } from '../examples/psc-factories.mjs';
import { validateLesson } from '../src/ui/validateLesson.mjs';
for (const name of ['psc', 'psc.beginner', 'bubble-sort']) {
  const document = JSON.parse(await readFile(new URL(`../examples/${name}.json`, import.meta.url), 'utf8'));
  validateDocument(document, { factories: { ...defaultFactories, ...pscFactories } });
  console.log(`${name}: válido · ${document.entities.length} entidades · ${document.steps.length} pasos`);
}
for (const [lesson,model] of [['psc','psc.beginner'],['bubble-sort','bubble-sort']]) {
  const data=JSON.parse(await readFile(new URL(`../examples/${model}.json`,import.meta.url),'utf8'));
  const profile=JSON.parse(await readFile(new URL(`../examples/${lesson}.lesson.json`,import.meta.url),'utf8'));
  validateLesson(profile,data);
  console.log(`${lesson}.lesson: válida · ${profile.story.length} escenas · tres capas`);
}
