/* Verificador de páginas VGE (Bloque D).
   Repite la misma revisión en cada entrega: anchos, temas, errores, desbordamiento,
   controles táctiles, texto cortado, decimales mezclados y recorrido por pestañas y etapas.
   Distingue FALLA (bloquea la entrega) de AVISO (revisar) y declara lo que no puede verificar. */
const fs = require('node:fs');
const path = require('node:path');
const {launchBrowser} = require('./browser.cjs');

const root = path.resolve(__dirname, '..');
const LOCAL_HOST = 'vge-verify.local';
const HELP = `Uso: node tools/verify-page.cjs <página.html|URL> [opciones]
  --artefacto        Fragmento para claude.ai: se envuelve como lo hace la plataforma y se aplica
                     una aproximación de su lista de orígenes permitidos (CSP).
  --salida DIR       Carpeta del informe y las capturas (por defecto out/verify/<nombre>)
  --anchos 390,1280  Anchos de ventana a revisar
  --temas claro,oscuro
  --sin-recorrido    No pulsar pestañas ni etapas
  --tactil-estricto  Controles de menos de 44 px cuentan como FALLA (por defecto, AVISO)`;

// Aproximación de la política documentada para artefactos; no es la cabecera real de la plataforma.
const ARTIFACT_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net/npm/ https://unpkg.com https://cdn.tailwindcss.com https://code.jquery.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-src 'self'",
  "worker-src 'self' blob:",
].join('; ');

const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm','.woff2':'font/woff2','.glb':'model/gltf-binary'};
const mime = f => MIME[path.extname(f).toLowerCase()] ?? 'application/octet-stream';

function parseArgs(argv) {
  const o = {target:null, artifact:false, out:null, widths:[390, 1280], themes:['claro', 'oscuro'], tour:true, strictTouch:false};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--artefacto') o.artifact = true;
    else if (a === '--sin-recorrido') o.tour = false;
    else if (a === '--tactil-estricto') o.strictTouch = true;
    else if (a === '--salida') o.out = argv[++i];
    else if (a === '--anchos') o.widths = argv[++i].split(',').map(Number).filter(n => n > 0);
    else if (a === '--temas') o.themes = argv[++i].split(',').filter(t => ['claro', 'oscuro'].includes(t));
    else if (a === '-h' || a === '--ayuda') return null;
    else if (a.startsWith('--')) throw new Error(`Opción desconocida: ${a}`);
    else if (!o.target) o.target = a;
    else throw new Error(`Argumento de más: ${a}`);
  }
  if (!o.target) return null;
  if (!o.widths.length || !o.themes.length) throw new Error('Se necesita al menos un ancho y un tema');
  return o;
}

// El fragmento se envuelve con el mismo esqueleto mínimo que añade la publicación.
function wrapArtifact(fragment) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">`
    + `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">`
    + `<meta http-equiv="Content-Security-Policy" content="${ARTIFACT_CSP}">`
    + `<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}`
    + `body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>`
    + `</head><body>${fragment}</body></html>`;
}

// jsDelivr/unpkg con versión exacta → node_modules del proyecto, solo si la versión coincide.
function localCdnFile(url) {
  let m = null;
  if (url.host === 'cdn.jsdelivr.net') m = url.pathname.match(/^\/npm\/((?:@[^/]+\/)?[^@/]+)@([^/]+)\/(.+)$/);
  else if (url.host === 'unpkg.com') m = url.pathname.match(/^\/((?:@[^/]+\/)?[^@/]+)@([^/]+)\/(.+)$/);
  if (!m) return null;
  const [, name, version, rest] = m;
  const dir = path.join(root, 'node_modules', name);
  try {
    if (JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version !== version) return null;
  } catch { return null; }
  const file = path.resolve(dir, decodeURIComponent(rest));
  return file.startsWith(dir + path.sep) && fs.existsSync(file) ? file : null;
}


async function audit(page, {strictTouch}) {
  return page.evaluate(({strictTouch}) => {
    const name = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
    const visible = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const vw = innerWidth, issues = [];
    // Desbordamiento horizontal de la página
    if (document.documentElement.scrollWidth > vw + 1) {
      const clipped = e => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { if (getComputedStyle(a).overflowX !== 'visible') return true; } return false; };
      const culprits = [...document.body.querySelectorAll('*')].filter(e => visible(e) && getComputedStyle(e).position !== 'fixed' && e.getBoundingClientRect().right > vw + 1 && !clipped(e)).slice(0, 5).map(name);
      issues.push({nivel:'FALLA', codigo:'desbordamiento', detalle:`La página mide ${document.documentElement.scrollWidth}px de ancho en una ventana de ${vw}px`, elementos:culprits});
    }
    // Controles táctiles
    const selector = 'button,a[href],input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[tabindex]:not([tabindex="-1"])';
    const small = [];
    for (const e of document.querySelectorAll(selector)) {
      if (!visible(e) || e.disabled) continue;
      const target = e.matches('input[type=checkbox],input[type=radio]') ? (e.closest('label') ?? e) : e;
      const r = target.getBoundingClientRect();
      const min = Math.min(r.width, r.height);
      if (min < 44) small.push({elemento:name(e), texto:(e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 40), ancho:Math.round(r.width), alto:Math.round(r.height)});
    }
    const tiny = small.filter(s => Math.min(s.ancho, s.alto) < 24);
    if (tiny.length) issues.push({nivel:'FALLA', codigo:'control-pequeno', detalle:`${tiny.length} controles de menos de 24 px (WCAG 2.5.8)`, elementos:tiny.slice(0, 8)});
    const mid = small.filter(s => Math.min(s.ancho, s.alto) >= 24);
    if (mid.length) issues.push({nivel:strictTouch ? 'FALLA' : 'AVISO', codigo:'control-tactil', detalle:`${mid.length} controles entre 24 y 44 px; el mínimo cómodo para el dedo es 44 px`, elementos:mid.slice(0, 8)});
    // Texto cortado dentro de cajas con overflow oculto
    const cut = [];
    for (const e of document.body.querySelectorAll('*')) {
      if (!visible(e) || e.matches('canvas,svg,video,img,input,select,textarea') || e.closest('svg')) continue;
      const cs = getComputedStyle(e);
      if (!['hidden', 'clip'].includes(cs.overflowX) && !['hidden', 'clip'].includes(cs.overflowY)) continue;
      const hasText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (hasText && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) cut.push(name(e));
    }
    if (cut.length) issues.push({nivel:'AVISO', codigo:'texto-cortado', detalle:`${cut.length} cajas con texto que no cabe`, elementos:cut.slice(0, 6)});
    // Decimales mezclados en el texto visible (fuera de código)
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const comma = [], point = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const p = n.parentElement;
      if (!p || p.closest('code,pre,kbd,samp,script,style,noscript,[data-version]') || !visible(p)) continue;
      const t = n.textContent;
      for (const m of t.matchAll(/(?<![\d.,])\d+,\d+(?![\d.,])/g)) comma.push(m[0]);
      for (const m of t.matchAll(/(?<![\d.,])\d+\.\d+(?![\d.,])/g)) point.push(m[0]);
    }
    if (comma.length && point.length) issues.push({nivel:'AVISO', codigo:'decimales-mezclados', detalle:`Se usan coma (${comma.length}) y punto (${point.length}) como separador decimal`, ejemplos:{coma:[...new Set(comma)].slice(0, 4), punto:[...new Set(point)].slice(0, 4)}});
    const bg = getComputedStyle(document.body).backgroundColor;
    return {issues, fondoTransparente:bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)', lienzos:document.querySelectorAll('canvas').length, csp:window.__vgeCsp ?? []};
  }, {strictTouch});
}

// Devuelve un texto si los clics se vuelven lentos y crecen; null si no.
function slowingClicks(times, {floor = 1500, factor = 3} = {}) {
  const ms = times.map(t => t.ms);
  if (ms.length < 4) return null;
  const base = [...ms.slice(0, 3)].sort((a, b) => a - b)[1];
  let run = 1, best = 1, end = 0;
  for (let i = 1; i < ms.length; i++) { run = ms[i] > ms[i - 1] ? run + 1 : 1; if (run > best) { best = run; end = i; } }
  const peak = Math.max(...ms);
  if (peak < floor || peak < base * factor || best < 3) return null;
  const seq = ms.slice(end - best + 1, end + 1).map(v => (v / 1000).toFixed(1).replace('.', ',')).join(' → ');
  return `Los clics se vuelven más lentos (${seq} s; al inicio ~${(base / 1000).toFixed(1).replace('.', ',')} s). Suele indicar trabajo que se acumula, como dos requestAnimationFrame pendientes por cuadro.`;
}

async function verifyPage(target, options = {}) {
  const o = {artifact:false, widths:[390, 1280], themes:['claro', 'oscuro'], tour:true, strictTouch:false, ...options};
  const isUrl = /^https?:\/\//.test(target);
  const file = isUrl ? null : path.resolve(target);
  if (file && !fs.existsSync(file)) throw new Error(`No existe la página: ${target}`);
  const base = isUrl ? new URL(target).hostname : path.basename(file).replace(/\.[^.]+$/, '');
  const out = path.resolve(o.out ?? path.join(root, 'out/verify', base));
  fs.mkdirSync(out, {recursive:true});
  const pageDir = file ? path.dirname(file) : null, pageName = file ? path.basename(file) : null;
  const html = file ? (o.artifact ? wrapArtifact(fs.readFileSync(file, 'utf8')) : fs.readFileSync(file, 'utf8')) : null;
  const url = isUrl ? target : `https://${LOCAL_HOST}/${encodeURIComponent(pageName)}`;
  const cdnLocal = new Set(), externalFailed = new Set();

  const browser = await launchBrowser();
  const report = {
    pagina:target, modo:o.artifact ? 'artefacto' : 'página completa', fecha:new Date().toISOString(),
    navegador:browser.vgeInfo, estado:null, comprobaciones:[], recorrido:[], tiemposClic:[], cdnDesdeNodeModules:[], recursosExternosNoCargados:[],
    noVerificado:[
      'Rendimiento y fluidez en un teléfono físico',
      'Comprensión de personas reales',
      o.artifact ? 'CSP exacta de la plataforma: se aplicó una aproximación de la lista documentada' : 'Política de seguridad del sitio donde se publique',
    ],
  };
  try {
    for (const width of o.widths) for (const theme of o.themes) {
      const context = await browser.newContext({viewport:{width, height:width < 600 ? 844 : 900}, deviceScaleFactor:1, colorScheme:theme === 'oscuro' ? 'dark' : 'light'});
      await context.addInitScript(() => { document.addEventListener('securitypolicyviolation', e => { (window.__vgeCsp ||= []).push(`${e.violatedDirective}: ${e.blockedURI}`); }); });
      await context.route('**/*', async route => {
        const u = new URL(route.request().url());
        if (u.host === LOCAL_HOST) {
          const rel = decodeURIComponent(u.pathname.slice(1));
          if (rel === pageName) return route.fulfill({status:200, contentType:'text/html; charset=utf-8', body:html});
          const f = path.resolve(pageDir, rel);
          if (!f.startsWith(pageDir + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) return route.fulfill({status:404, body:''});
          return route.fulfill({status:200, contentType:mime(f), body:fs.readFileSync(f)});
        }
        const local = localCdnFile(u);
        if (local) { cdnLocal.add(u.href); return route.fulfill({status:200, contentType:mime(local), body:fs.readFileSync(local)}); }
        return route.continue();
      });
      const page = await context.newPage();
      const errors = [];
      const isLocal = u => { try { return new URL(u).host === LOCAL_HOST; } catch { return false; } };
      page.on('pageerror', e => errors.push(`Excepción: ${e.message}`));
      page.on('console', m => {
        if (m.type() !== 'error') return;
        const at = m.location()?.url ?? '';
        if (/Failed to load resource/i.test(m.text()) && at && !isLocal(at)) { externalFailed.add(at); return; }
        errors.push(m.text());
      });
      page.on('requestfailed', r => {
        // Un video cancela su descarga al tener los metadatos o al ocultarse: no es un fallo.
        if (r.resourceType() === 'media' && r.failure()?.errorText === 'net::ERR_ABORTED') return;
        if (isLocal(r.url())) errors.push(`No cargó ${r.url()}: ${r.failure()?.errorText}`); else externalFailed.add(r.url());
      });
      page.on('response', r => { if (isLocal(r.url()) && r.status() >= 400) errors.push(`HTTP ${r.status()} en ${r.url()}`); });

      const tag = `${width}-${theme}`;
      const check = async label => {
        const a = await audit(page, o);
        const issues = [...a.issues];
        if (errors.length) issues.push({nivel:'FALLA', codigo:'error-consola', detalle:`${errors.length} errores de consola o de carga`, elementos:[...new Set(errors)].slice(0, 6)});
        if (a.csp.length) issues.push({nivel:'FALLA', codigo:'csp', detalle:'Recursos bloqueados por la política de orígenes de artefactos', elementos:[...new Set(a.csp)].slice(0, 6)});
        if (a.fondoTransparente) issues.push({nivel:o.artifact ? 'FALLA' : 'AVISO', codigo:'fondo-transparente', detalle:'body sin fondo propio: en un artefacto se vería el fondo del visor'});
        errors.length = 0;
        return {contexto:label, ancho:width, tema:theme, lienzos:a.lienzos, problemas:issues};
      };
      await page.goto(url, {waitUntil:'load'});
      await page.waitForTimeout(1200);
      const shot = `${tag}.jpg`;
      await page.screenshot({path:path.join(out, shot), fullPage:true, type:'jpeg', quality:80, timeout:90000});
      console.error(`· ${tag} inicio`);
      report.comprobaciones.push({...await check('inicio'), captura:shot});

      // Recorrido: una vez por ancho, en el primer tema.
      if (o.tour && theme === o.themes[0]) {
        let clicks = 0;
        const times = [];
        const tabs = await page.locator('[role="tab"]:visible').all();
        const visits = tabs.length ? tabs : [null];
        for (let i = 0; i < visits.length && clicks < 80; i++) {
          let label = visits[i] ? `pestaña ${i + 1}` : 'página';
          const blocked = [];
          // Un clic que no responde se registra y el recorrido sigue: puede ser el entorno
          // (WebGL por software) o un ciclo de dibujo que satura el hilo principal.
          const press = async (loc, what) => {
            const t0 = Date.now();
            try { await loc.click({timeout:15000}); clicks++; times.push({que:what, ms:Date.now() - t0}); return true; }
            catch { blocked.push(what); times.push({que:what, ms:Date.now() - t0, bloqueado:true}); return false; }
          };
          if (visits[i]) {
            label = ((await visits[i].innerText().catch(() => '')).trim().split(/\n/)[0]) || label;
            if (await press(visits[i], `pestaña «${label}»`)) await page.waitForTimeout(900);
          }
          const steps = await page.locator('[data-step]:visible').all();
          for (const s of steps) { if (clicks >= 80) break; if (await press(s, `etapa ${(await s.innerText().catch(() => '')).trim().replace(/\s+/g, ' ')}`)) await page.waitForTimeout(600); }
          const name = `${tag}-${String(i + 1).padStart(2, '0')}.jpg`;
          let captured = true;
          try { await page.screenshot({path:path.join(out, name), fullPage:true, type:'jpeg', quality:75, timeout:90000}); }
          catch { captured = false; blocked.push('captura de pantalla'); }
          console.error(`· ${tag} ${label}`);
          const result = await check(`${label}${steps.length ? ` + ${steps.length} etapas` : ''}`);
          if (blocked.length) result.problemas.push({nivel:'AVISO', codigo:'interaccion-bloqueada', detalle:`No respondió en 15 s: ${blocked.join(', ')}. Si los clics anteriores ya iban cada vez más lentos, buscar ciclos de dibujo duplicados (dos requestAnimationFrame pendientes); si no, puede ser el WebGL por software del entorno.`});
          report.recorrido.push({...result, captura:captured ? name : null});
        }
        // Clics que tardan cada vez más delatan trabajo que se acumula (por ejemplo, ciclos de dibujo duplicados).
        const slow = slowingClicks(times);
        if (slow) report.recorrido.push({contexto:'tiempos de clic', ancho:width, tema:theme, lienzos:null, problemas:[{nivel:'AVISO', codigo:'clics-cada-vez-mas-lentos', detalle:slow}]});
        report.tiemposClic.push({ancho:width, tema:theme, clics:times});
      }
      await context.close();
    }
  } finally { await browser.close(); }
  report.cdnDesdeNodeModules = [...cdnLocal];
  report.recursosExternosNoCargados = [...externalFailed];
  const all = [...report.comprobaciones, ...report.recorrido].flatMap(c => c.problemas);
  report.estado = all.some(p => p.nivel === 'FALLA') ? 'FALLA' : 'PASA';
  report.resumen = {fallas:all.filter(p => p.nivel === 'FALLA').length, avisos:all.filter(p => p.nivel === 'AVISO').length, codigos:[...new Set(all.map(p => p.codigo))]};
  fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
  report.salida = out;
  return report;
}

function printSummary(r) {
  console.log(`${r.estado} · ${r.pagina} (${r.modo})`);
  console.log(`Navegador: ${r.navegador.source}${r.navegador.reproducible ? '' : ' — no es la versión fijada; resultado no reproducible'} · ${r.navegador.version}`);
  for (const c of [...r.comprobaciones, ...r.recorrido]) {
    const marks = c.problemas.map(p => `${p.nivel === 'FALLA' ? '✗' : '!'} ${p.codigo}`).join(', ') || '✓';
    console.log(`  ${String(c.ancho).padStart(4)} ${c.tema.padEnd(6)} ${c.contexto.slice(0, 38).padEnd(38)} ${marks}`);
  }
  if (r.cdnDesdeNodeModules.length) console.log(`CDN servido desde node_modules: ${r.cdnDesdeNodeModules.length} archivos`);
  if (r.recursosExternosNoCargados.length) console.log(`Recursos externos no cargados (aviso): ${r.recursosExternosNoCargados.length}`);
  console.log(`No verificado: ${r.noVerificado.join('; ')}`);
  console.log(`Informe: ${path.join(r.salida, 'verification.json')}`);
}

if (require.main === module) {
  (async () => {
    let options;
    try { options = parseArgs(process.argv.slice(2)); } catch (e) { console.error(e.message); console.error(HELP); process.exit(2); }
    if (!options) { console.log(HELP); process.exit(2); }
    const report = await verifyPage(options.target, options);
    printSummary(report);
    process.exitCode = report.estado === 'PASA' ? 0 : 1;
  })().catch(e => { console.error(e.message); process.exitCode = 2; });
}

module.exports = {verifyPage, parseArgs, wrapArtifact, localCdnFile, slowingClicks, ARTIFACT_CSP};
