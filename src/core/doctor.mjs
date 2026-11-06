// Diagnóstico del entorno antes de elegir motor (Bloque D).
// probeEnvironment() observa; planFromProbes() decide sin efectos para poder probarlo con datos fijos.
import {existsSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

export const HOSTS = Object.freeze({
  npm:'registry.npmjs.org',
  pypi:'pypi.org',
  github:'github.com',
  chromeForTesting:'storage.googleapis.com',
  remotionBrowser:'remotion.media',
  falstad:'www.falstad.com',
});

export const STATES = Object.freeze(['LISTO','PREPARABLE','BLOQUEADO']);

const run=(command,args,timeout=15000)=>{
  const r=spawnSync(command,args,{encoding:'utf8',timeout});
  if(r.error)return {ok:false,reason:r.error.code??r.error.message};
  return {ok:r.status===0,out:(r.stdout??'').trim(),err:(r.stderr??'').trim()};
};
const which=names=>{
  for(const name of names){
    const r=spawnSync(process.platform==='win32'?'where':'which',[name],{encoding:'utf8'});
    if(r.status===0&&r.stdout.trim())return r.stdout.trim().split(/\r?\n/)[0];
  }
  return null;
};

// curl respeta HTTPS_PROXY igual que npm y git; fetch de Node no lo hace por defecto.
export function probeHost(host,{seconds=6}={}) {
  const r=spawnSync('curl',['-s','-o','/dev/null','-I','-w','%{http_code}','--max-time',String(seconds),`https://${host}/`],{encoding:'utf8'});
  if(r.error)return {host,reachable:null,method:'sin curl: no comprobado'};
  const status=Number.parseInt(r.stdout,10)||0;
  return {host,reachable:status>0,status:status||null,method:'curl con el proxy del entorno'};
}

export async function probeEnvironment({root=process.cwd(),network=true,env=process.env}={}) {
  root=resolve(root);
  const dependency=(dir,name)=>{try{return {installed:true,path:createRequire(join(root,dir,'package.json')).resolve(name)};}catch{return {installed:false};}};
  let pinned;
  try{
    const config=JSON.parse(readFileSync(join(root,'tools/browser.json'),'utf8'));
    const {computeExecutablePath}=await import(pathToFileURL(createRequire(join(root,'package.json')).resolve('@puppeteer/browsers')).href);
    const path=computeExecutablePath({...config,cacheDir:join(root,'.cache/vge-browser')});
    pinned={buildId:config.buildId,path,exists:existsSync(path)};
  }catch(error){pinned={exists:false,reason:error.message};}
  const override=env.VGE_BROWSER?{path:env.VGE_BROWSER,exists:existsSync(env.VGE_BROWSER)}:null;
  const system=which(['google-chrome','google-chrome-stable','chromium','chromium-browser','chrome']);
  const ffmpeg=which(['ffmpeg']);
  const python=env.VGE_PYTHON??'python3';
  const py=run(python,['--version']);
  const manim=py.ok?run(python,['-m','manim','--version']):{ok:false};
  let kit=false;
  try{const k=await import(pathToFileURL(join(root,'integrations/anatomy/vendor/kit/iso-kit.mjs')).href);kit=typeof k.solidSvg==='function';}catch{}
  let splineScene=false;
  try{splineScene=!!JSON.parse(readFileSync(join(root,'examples/unified/project.json'),'utf8')).stages.find(s=>s.engine==='spline')?.enabled;}catch{}
  const circuitjs=['integrations/circuitjs/circuitjs.html','integrations/circuitjs/war/circuitjs.html'].find(p=>existsSync(join(root,p)))??null;
  const net=network?Object.fromEntries(Object.entries(HOSTS).map(([key,host])=>[key,probeHost(host)])):null;
  return {
    node:process.versions.node,platform:`${process.platform}-${process.arch}`,
    browser:{pinned,override,system},
    ffmpeg:ffmpeg?{available:true,path:ffmpeg}:{available:false},
    python:py.ok?{available:true,command:python,version:py.out||py.err}:{available:false,command:python},
    manim:manim.ok?{available:true,version:manim.out}:{available:false},
    threejs:dependency('.','three'),
    anatomy:{kitImported:kit},
    remotion:dependency('integrations/remotion','@remotion/cli'),
    spline:{...dependency('integrations/spline','@splinetool/runtime'),sceneConfigured:splineScene},
    circuitjs:{selfHosted:circuitjs},
    network:net,
  };
}

const state=(estado,motivo,{siguiente=null,alternativa=null,...extra}={})=>({estado,motivo,siguiente,alternativa,...extra});
// true: alcanzable; false: comprobado y bloqueado; null: no comprobado.
const reach=(p,key)=>p.network?(p.network[key]?.reachable??null):null;

export function planFromProbes(p) {
  const b=p.browser,offline=key=>reach(p,key)===false,unchecked=!p.network;
  let verificacion;
  if(b.pinned?.exists)verificacion=state('LISTO','Navegador fijado del proyecto',{siguiente:'npm run verify:page -- <página>',reproducible:true,navegador:b.pinned.path});
  else if(b.override?.exists)verificacion=state('LISTO','Navegador de VGE_BROWSER; no es la versión fijada',{siguiente:'npm run verify:page -- <página>',reproducible:false,navegador:b.override.path});
  else if(b.system)verificacion=state('PREPARABLE','Hay un Chrome del sistema, pero falta la versión fijada',{siguiente:`VGE_BROWSER=${b.system} npm run verify:page -- <página>`,alternativa:'Registrar en el informe que el navegador no es el fijado',reproducible:false,navegador:b.system});
  else if(!offline('chromeForTesting'))verificacion=state('PREPARABLE','Falta el navegador fijado',{siguiente:'npm run browser:install'});
  else verificacion=state('BLOQUEADO','Sin navegador y sin acceso a Chrome for Testing',{alternativa:'Declarar la verificación visual «NO VERIFICADO»'});
  const browserPath=verificacion.navegador??null;

  const motores={};
  motores.threejs=p.threejs.installed?state('LISTO','three instalado en el proyecto'):state('PREPARABLE','Falta three',{siguiente:'npm ci'});
  motores.anatomy=p.anatomy.kitImported
    ?state('LISTO','Kit Anatomy importable',{presupuesto:'Figura de 40–80 piezas: hasta 1 h; Hero: 2–4 h'})
    :state('BLOQUEADO','No se pudo importar el kit',{alternativa:'Three.js o SVG propio, sin llamarlo Anatomy'});
  if(!p.remotion.installed)motores.remotion=offline('npm')
    ?state('BLOQUEADO','Faltan dependencias y no hay acceso a npm',{alternativa:'Entregar fuente y comandos; no afirmar que existe el MP4'})
    :state('PREPARABLE','Faltan dependencias de Remotion',{siguiente:'npm ci --prefix integrations/remotion'});
  else if(!offline('remotionBrowser')&&!unchecked)motores.remotion=state('LISTO','Remotion instalado; puede descargar su navegador',{presupuesto:'Video de 20 s a 1080×1080: 1–3 min de render'});
  else if(browserPath)motores.remotion=state('LISTO','Remotion instalado; su navegador no se puede descargar aquí',{siguiente:`--browser-executable=${browserPath}`,presupuesto:'Video de 20 s a 1080×1080: 1–3 min de render',nota:'Registrar en la entrega el navegador usado'});
  else motores.remotion=state('BLOQUEADO','Remotion no puede obtener un navegador',{alternativa:'Entregar fuente y comandos; no afirmar que existe el MP4'});
  if(p.manim.available)motores.manim=state('LISTO',`Manim ${p.manim.version}`);
  else if(p.python.available&&!offline('pypi'))motores.manim=state('PREPARABLE','Python disponible; falta Manim',{siguiente:'python3 -m venv .venv && .venv/bin/pip install -r integrations/manim/requirements.txt',nota:'Manim necesita también Cairo y Pango del sistema; LaTeX solo si las escenas lo usan'});
  else motores.manim=state('BLOQUEADO','Sin Manim ni forma de instalarlo',{alternativa:'Pasos en HTML o video con Remotion; entregar la escena Manim sin renderizar'});
  if(p.circuitjs.selfHosted)motores.circuitjs=state('LISTO',`CircuitJS servido desde ${p.circuitjs.selfHosted}`);
  else motores.circuitjs=state(offline('falstad')?'BLOQUEADO':'PREPARABLE',offline('falstad')?'Sin copia propia y sin acceso a falstad.com':'Sin copia propia; falstad.com no se puede controlar desde otra página',{alternativa:'Modelo JS explícito y texto importable marcado «NO VERIFICADO»'});
  motores.spline=p.spline.installed&&p.spline.sceneConfigured
    ?state('LISTO','Runtime instalado y escena exportada configurada')
    :state('BLOQUEADO','Falta una exportación .splinecode real',{alternativa:'Three.js con geometría paramétrica'});
  motores.ffmpeg=p.ffmpeg.available?state('LISTO','ffmpeg disponible para revisar videos'):state('PREPARABLE','Sin ffmpeg: no se podrá inspeccionar el MP4 cuadro a cuadro');

  const pick=(engine,label,fallback)=>{const s=motores[engine];
    if(s.estado==='LISTO')return {motor:label,estado:'LISTO'};
    if(s.estado==='PREPARABLE'&&s.siguiente)return {motor:label,estado:'PREPARABLE',siguiente:s.siguiente,alternativa:fallback};
    return {motor:label,estado:s.estado,alternativa:fallback,motivo:s.motivo};};
  const modos={
    'ANATOMÍA':pick('threejs','Three.js (interior y despiece) o kit Anatomy (lámina técnica)','SVG con despiece en vistas'),
    'LABORATORIO':pick('circuitjs','CircuitJS/Falstad','Modelo JS explícito con fórmula visible'),
    'ANIMADO-PASOS':pick('manim','Manim (video matemático)','Pasos interactivos en HTML'),
    'VIDEO-ESCENAS':pick('remotion','Remotion','Fuente y comandos, sin afirmar video'),
    'ESCENA 3D':pick('spline','Spline (escena editable)','Three.js'),
    'MAPA':{motor:'Mermaid o SVG',estado:'LISTO'},
    'DATOS':{motor:'SVG o gráfico nativo',estado:'LISTO'},
  };
  const notas=[];
  if(unchecked)notas.push('Red no comprobada (--sin-red): los estados que dependen de descargas pueden cambiar.');
  if(p.network)notas.push('La red se comprobó con curl y el proxy del entorno; un programa que no use ese proxy puede fallar igual.');
  notas.push('Disponible no significa ejecutado: registrar comando, versión y salida de lo que realmente se use.');
  return {verificacion,motores,modos,notas};
}

export async function doctor(options) {
  const probes=await probeEnvironment(options);
  return {entorno:probes,plan:planFromProbes(probes)};
}
