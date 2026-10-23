import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const readJSON = name => JSON.parse(readFileSync(path.join(root, name), 'utf8'));

test('VGE-009: Playwright se instala localmente con versión exacta y preparación documentada', () => {
  const pkg = readJSON('package.json');
  assert.match(pkg.devDependencies.playwright ?? '', /^\d+\.\d+\.\d+$/, 'Falta Playwright fijado en devDependencies');
  const installed = require('playwright/package.json');
  assert.equal(installed.version, pkg.devDependencies.playwright);
  const resolved = realpathSync(require.resolve('playwright'));
  assert.ok(resolved.startsWith(realpathSync(path.join(root, 'node_modules')) + path.sep), 'Playwright procede del host');
  assert.ok(pkg.scripts['browser:install'], 'Falta el comando de preparación del navegador');
  assert.match(pkg.devDependencies['@puppeteer/browsers'] ?? '', /^\d+\.\d+\.\d+$/);
  const browserConfig = readJSON('tools/browser.json');
  const browsers = JSON.parse(readFileSync(path.join(path.dirname(require.resolve('playwright-core/package.json')), 'browsers.json'), 'utf8'));
  const expected = browsers.browsers.find(b => b.name === 'chromium-headless-shell');
  assert.equal(browserConfig.buildId, expected.browserVersion, 'El navegador descargado no coincide con Playwright');
  assert.equal(browserConfig.browser, 'chrome-headless-shell');
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /npm run browser:install/);
  for (const file of ['tools/check-390.cjs', 'tools/check-block-a.cjs']) {
    assert.doesNotMatch(readFileSync(path.join(root, file), 'utf8'), /VGE_PLAYWRIGHT_MODULE|VGE_CHROME_PATH|NODE_PATH/, file+' depende del host');
  }
});

test('VGE-010: AJV instalado y lock coinciden con una versión parcheada y fijada', () => {
  const spec = readJSON('package.json').dependencies.ajv;
  assert.match(spec, /^8\.\d+\.\d+$/);
  const [, minor] = spec.split('.').map(Number);
  assert.ok(minor >= 18, 'La versión está afectada por GHSA-2g4f-4pwh-qvx6');
  assert.equal(require('ajv/package.json').version, spec);
  assert.equal(readJSON('package-lock.json').packages['node_modules/ajv'].version, spec);
});

test('VGE-011: una sola implementación del motor y entradas que consumen src/', async () => {
  assert.equal(existsSync(path.join(root, 'engine')), false, 'Existe un segundo árbol engine/');
  const pkg = readJSON('package.json');
  for (const target of Object.values(pkg.exports)) assert.ok(target.startsWith('./src/'));
  const canonical = await import('../src/VGEEngine.mjs');
  const publicAPI = await import('vge-v2-phase2');
  assert.equal(publicAPI.VGEEngine, canonical.VGEEngine);
  const walk = dir => readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
  for (const dir of ['src','demo','examples','tools','tests']) {
    for (const file of walk(path.join(root, dir)).filter(f => /\.[cm]?js$/.test(f))) {
      const source = readFileSync(file,'utf8');
      const imports = [...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(|\brequire\s*\()\s*['"]([^'"]+)['"]/g)];
      for (const [,target] of imports) assert.doesNotMatch(target, /(?:^|\/)engine\//, file+' conserva un import al duplicado');
    }
  }
});

test('check:390 rechaza tres frases o tres etiquetas y registra las cantidades reales', () => {
  const { measureContent } = require('../tools/qa-content.cjs');
  const lesson = readJSON('examples/psc.lesson.json');
  for (const step of lesson.story) {
    const result = measureContent({text:step.text, labels:[]}, step.title);
    assert.equal(result.sentenceCount, 2);
    assert.equal(result.labelCount, 0);
  }
  assert.throws(() => measureContent({text:'Una frase. Otra frase. Una tercera.',labels:[]},'Tres frases'), /3 frases.*máximo 2/);
  assert.throws(() => measureContent({text:'Una frase.',labels:['A','B','C']},'Tres etiquetas'), /3 etiquetas.*máximo 2/);
  assert.throws(() => measureContent({text:'  ',labels:[]},'Sin explicación'), /explicación vacía/);
  assert.deepEqual(measureContent({text:'Una frase. Dos frases.',labels:['A','B']},'Límite'), {sentenceCount:2,labelCount:2});
});
