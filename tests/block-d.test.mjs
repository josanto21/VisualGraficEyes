import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {planFromProbes} from '../src/core/doctor.mjs';
const require=createRequire(import.meta.url);
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

// Entorno base: todo disponible y con red. Cada prueba cambia solo lo que examina.
const probes=(over={})=>structuredClone({
  node:'22.12.0',platform:'linux-x64',
  browser:{pinned:{exists:true,path:'/cache/chrome-headless-shell'},override:null,system:null},
  ffmpeg:{available:true},python:{available:true},manim:{available:true,version:'0.19.0'},
  threejs:{installed:true},anatomy:{kitImported:true},remotion:{installed:true},
  spline:{installed:true,sceneConfigured:true},circuitjs:{selfHosted:'integrations/circuitjs/circuitjs.html'},
  network:{npm:{reachable:true},pypi:{reachable:true},github:{reachable:true},chromeForTesting:{reachable:true},remotionBrowser:{reachable:true},falstad:{reachable:true}},
  ...over,
});
const offline=(...keys)=>({network:Object.fromEntries(['npm','pypi','github','chromeForTesting','remotionBrowser','falstad'].map(k=>[k,{reachable:!keys.includes(k)}]))});

test('D: con todo disponible, cada modo usa su motor nativo', () => {
  const plan=planFromProbes(probes());
  assert.equal(plan.verificacion.estado,'LISTO');assert.equal(plan.verificacion.reproducible,true);
  for(const [mode,m] of Object.entries(plan.modos))assert.equal(m.estado,'LISTO',mode);
});

test('D: sin navegador fijado, un Chrome del sistema se ofrece como verificación no reproducible', () => {
  const plan=planFromProbes(probes({browser:{pinned:{exists:false},override:null,system:'/usr/bin/google-chrome'}}));
  assert.equal(plan.verificacion.estado,'PREPARABLE');assert.equal(plan.verificacion.reproducible,false);
  assert.match(plan.verificacion.siguiente,/VGE_BROWSER=\/usr\/bin\/google-chrome/);
  const declared=planFromProbes(probes({browser:{pinned:{exists:false},override:{exists:true,path:'/opt/chrome'},system:null}}));
  assert.equal(declared.verificacion.estado,'LISTO');assert.equal(declared.verificacion.reproducible,false);
});

test('D: sin navegador ni descarga posible, la verificación visual queda NO VERIFICADO', () => {
  const plan=planFromProbes(probes({browser:{pinned:{exists:false},override:null,system:null},...offline('chromeForTesting')}));
  assert.equal(plan.verificacion.estado,'BLOQUEADO');assert.match(plan.verificacion.alternativa,/NO VERIFICADO/);
});

test('D: Remotion sin acceso a su navegador renderiza con el navegador disponible y lo dice', () => {
  const plan=planFromProbes(probes(offline('remotionBrowser')));
  assert.equal(plan.motores.remotion.estado,'LISTO');
  assert.match(plan.motores.remotion.siguiente,/--browser-executable=\/cache\/chrome-headless-shell/);
  assert.match(plan.motores.remotion.nota,/navegador usado/);
  const none=planFromProbes(probes({browser:{pinned:{exists:false},override:null,system:null},...offline('remotionBrowser','chromeForTesting')}));
  assert.equal(none.motores.remotion.estado,'BLOQUEADO');assert.match(none.motores.remotion.alternativa,/no afirmar/i);
});

test('D: CircuitJS, Manim y Spline caen a su alternativa declarada', () => {
  const plan=planFromProbes(probes({circuitjs:{selfHosted:null},manim:{available:false},python:{available:false},spline:{installed:false,sceneConfigured:false},...offline('falstad')}));
  assert.equal(plan.motores.circuitjs.estado,'BLOQUEADO');assert.match(plan.modos.LABORATORIO.alternativa,/Modelo JS/);
  assert.equal(plan.motores.manim.estado,'BLOQUEADO');assert.match(plan.modos['ANIMADO-PASOS'].alternativa,/HTML/);
  assert.equal(plan.motores.spline.estado,'BLOQUEADO');assert.equal(plan.modos['ESCENA 3D'].alternativa,'Three.js');
  const preparable=planFromProbes(probes({manim:{available:false}}));
  assert.equal(preparable.motores.manim.estado,'PREPARABLE');assert.match(preparable.modos['ANIMADO-PASOS'].siguiente,/pip install/);
});

test('D: sin comprobación de red el plan lo advierte en lugar de suponer acceso', () => {
  const plan=planFromProbes(probes({network:null,remotion:{installed:true}}));
  assert.ok(plan.notas.some(n=>/Red no comprobada/.test(n)));
  assert.match(plan.motores.remotion.motivo,/no se puede descargar aquí/);
});

test('D: el navegador fijado tiene prioridad y VGE_BROWSER se marca como no reproducible', async () => {
  const {browserInfo}=require('../tools/browser.cjs');
  let pinned=true;try{await browserInfo({});}catch{pinned=false;}
  const info=await browserInfo({VGE_BROWSER:process.execPath});
  if(pinned)assert.equal(info.source,'fijado');
  else{
    assert.deepEqual([info.source,info.reproducible,info.executablePath],['VGE_BROWSER',false,process.execPath]);
    await assert.rejects(()=>browserInfo({VGE_BROWSER:'/ruta/que/no/existe'}),/inexistente/);
  }
});

test('D: el verificador lee opciones, envuelve fragmentos y solo sirve CDN con versión exacta', () => {
  const {parseArgs,wrapArtifact,localCdnFile,ARTIFACT_CSP}=require('../tools/verify-page.cjs');
  const o=parseArgs(['p.html','--artefacto','--anchos','390','--temas','oscuro','--sin-recorrido']);
  assert.deepEqual([o.target,o.artifact,o.widths,o.themes,o.tour],['p.html',true,[390],['oscuro'],false]);
  assert.equal(parseArgs([]),null);assert.throws(()=>parseArgs(['p.html','--otra']),/desconocida/);
  const html=wrapArtifact('<title>x</title><p>hola</p>');
  assert.match(html,/^<!doctype html>/);assert.ok(html.includes('Content-Security-Policy'));assert.ok(html.includes('[hidden]{display:none!important}'));
  assert.match(ARTIFACT_CSP,/cdn\.jsdelivr\.net\/npm\//);assert.doesNotMatch(ARTIFACT_CSP,/esm\.sh/);
  const version=JSON.parse(readFileSync(new URL('../node_modules/three/package.json',import.meta.url),'utf8')).version;
  assert.ok(localCdnFile(new URL(`https://cdn.jsdelivr.net/npm/three@${version}/build/three.module.min.js`)));
  assert.equal(localCdnFile(new URL('https://cdn.jsdelivr.net/npm/three@0.1.0/build/three.module.min.js')),null);
  assert.equal(localCdnFile(new URL(`https://cdn.jsdelivr.net/npm/three@${version}/../../package.json`)),null);
});

test('D: el verificador avisa cuando cada clic tarda más que el anterior', () => {
  const {slowingClicks}=require('../tools/verify-page.cjs');
  const mk=a=>a.map(ms=>({que:'clic',ms}));
  // Tiempos medidos en la página de siete modos antes y después de corregir los ciclos duplicados.
  assert.match(slowingClicks(mk([748,774,794,3993,7145,10145])),/4,0 → 7,1 → 10,1 s/);
  assert.equal(slowingClicks(mk([395,428,417,421,463,371,381])),null);
  assert.equal(slowingClicks(mk([900,850,880,870,6000,800])),null,'un pico aislado no es crecimiento');
  assert.equal(slowingClicks(mk([100,2000,4000])),null,'pocos clics para juzgar');
});

test('D: cada caso de evaluación tiene el formato que lee claude plugin eval', async () => {
  const base='skill/evals/',cases=(await readdir(new URL('../'+base,import.meta.url))).sort();
  assert.ok(cases.length>=10,'se esperan al menos 10 casos');
  for(const name of cases){
    assert.match(name,/^[a-z][a-z0-9-]*$/);assert.ok(!['results','mocks','node_modules','files','true','false','null'].includes(name));
    const prompt=await read(`${base}${name}/prompt.md`);
    const [,settings,body]=prompt.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]+)$/)??[];
    assert.ok(settings&&body.trim(),`${name}: prompt.md sin bloque de ajustes o sin texto`);
    for(const line of settings.split('\n'))assert.match(line,/^(tags|max_turns|timeout_seconds|allowed_tools): /,`${name}: clave no admitida`);
    const yaml=await read(`${base}${name}/case.yaml`);
    assert.match(yaml,/^schema_version: "1\.1"\n/);assert.ok(yaml.includes(`\nname: ${name}\n`));assert.match(yaml,/expected_outcome: \|\n  \S/);
    const graders=(await readdir(new URL(`../${base}${name}/graders/`,import.meta.url))).sort();
    assert.ok(graders.length>=2,`${name}: pocos criterios`);
    for(const g of graders){
      assert.match(g,/^\d\d-[a-z0-9-]+\.md$/);
      const text=await read(`${base}${name}/graders/${g}`);
      assert.match(text,/^---\ntype: llm\nfocus: trace\nweight: 1\n---\n\n\S/,`${name}/${g}`);
    }
  }
});

test('D: la skill pide el doctor, el verificador y las reglas nuevas', async () => {
  const skill=await read('skill/SKILL.md'),nucleo=await read('skill/references/nucleo-y-herramientas.md');
  for(const needle of ['npm run core:doctor','npm run verify:page','--artefacto','ficha de procedencia','convención numérica','--browser-executable','entrega-en-artefactos.md'])assert.ok(skill.includes(needle),`Falta: ${needle}`);
  assert.ok(nucleo.includes('## Tiempo esperado por motor'));
  await read('skill/references/entrega-en-artefactos.md');
  const pkg=JSON.parse(await read('package.json'));
  assert.equal(pkg.scripts['verify:page'],'node tools/verify-page.cjs');assert.equal(pkg.scripts['check:block-d'],'node tools/check-block-d.cjs');
});
