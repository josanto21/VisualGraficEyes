import { readFile } from 'node:fs/promises';
import { validateDocument } from '../src/validate.mjs';
import { defaultFactories } from '../src/factories.mjs';
import { pscFactories } from '../examples/psc-factories.mjs';
for (const name of ['psc', 'psc.beginner', 'bubble-sort']) {
  const document = JSON.parse(await readFile(new URL(`../examples/${name}.json`, import.meta.url), 'utf8'));
  validateDocument(document, { factories: { ...defaultFactories, ...pscFactories } });
  console.log(`${name}: válido · ${document.entities.length} entidades · ${document.steps.length} pasos`);
}
