import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { graphicsSchema } from '../src/graphics/validateGraphics.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
export async function buildDemo() {
  const result = await build({ absWorkingDir: root, entryPoints: ['demo/main.mjs'], bundle: true, platform: 'browser', format: 'iife', target: ['chrome100', 'safari16'], write: false, minify: true, legalComments: 'eof', charset: 'utf8' });
  const template = await readFile(new URL('../demo/index.html', import.meta.url), 'utf8');
  const script = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const dependencyLicenses = [];
  for (const name of ['three','ajv','fast-uri','fast-deep-equal','json-schema-traverse','require-from-string']) {
    for (const file of ['LICENSE','LICENSE.txt','LICENSE.md']) { try { dependencyLicenses.push(`${name}\n${await readFile(new URL(`../node_modules/${name}/${file}`, import.meta.url),'utf8')}`); break; } catch {} }
  }
  const licenses = dependencyLicenses.join('\n\n');
  const html = template.replace('/*VGE_BUNDLE*/', () => script) + '\n<!-- Licencias de dependencias incluidas:\n' + licenses.replaceAll('--','—') + '\n-->\n';
  await mkdir(new URL('../dist/', import.meta.url),{recursive:true});
  await writeFile(new URL('../dist/index.html', import.meta.url),html);
  await writeFile(new URL('../dist/THIRD-PARTY-LICENSES.txt', import.meta.url),licenses);
  await writeFile(new URL('../schema/vge.graphics.schema.json', import.meta.url),JSON.stringify(graphicsSchema,null,2)+'\n');
  console.log(`Demo autónoma: ${Buffer.byteLength(html)} bytes · Three.js y datos incluidos`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await buildDemo();
