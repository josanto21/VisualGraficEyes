(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const fmt = (x, d = 0) => x.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
window.VGE = { $, $$, el, fmt, reduced, active: null };

/* ---------- Nivel ---------- */
const main = $('#main');
const setLevel = (v) => { main.dataset.level = v; const i = $(`#lv-${v}`); if (i) i.checked = true; store.set('vge-nivel', v); document.dispatchEvent(new CustomEvent('vge:level', { detail: +v })); };
$$('input[name="nivel"]').forEach((i) => i.addEventListener('change', () => setLevel(i.value)));
setLevel(store.get('vge-nivel') || '1');

/* ---------- Pestañas (con #enlace) ---------- */
const ids = $$('.tab').map((t) => t.dataset.tab);
function show(id) {
  if (!ids.includes(id)) id = 'anatomia';
  $$('.tab').forEach((t) => { const on = t.dataset.tab === id; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
  $$('.panel').forEach((p) => { p.hidden = p.id !== id; });
  window.VGE.active = id;
  document.dispatchEvent(new CustomEvent('vge:tab', { detail: id }));
}
$$('.tab').forEach((t, i, all) => {
  t.addEventListener('click', () => { if (location.hash !== '#' + t.dataset.tab) location.hash = t.dataset.tab; else show(t.dataset.tab); });
  t.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
    const n = all[(i + d + all.length) % all.length]; n.focus(); n.click();
  });
});
addEventListener('hashchange', () => show(location.hash.slice(1)));
window.VGE.start = () => show(location.hash.slice(1));

/* =====================================================================
   LABORATORIO · filtro RC
   ===================================================================== */
{
  const R = $('#rc-r'), Cc = $('#rc-c'), F = $('#rc-f');
  const si = (x, unit) => {
    const P = [[1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n']];
    const [m, p] = P.find(([m]) => Math.abs(x) >= m * 0.9995) || P[P.length - 1];
    const v = x / m; return `${fmt(v, v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${p}${unit}`;
  };
  // Esquema estático
  const sch = $('#rc-schem');
  sch.innerHTML = `
    <g fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round">
      <path d="M40 40H96M150 40H210V60M210 84V110H40V96M40 40V54"/>
      <path d="M210 40H262"/>
    </g>
    <circle cx="40" cy="75" r="20" fill="var(--stage)" stroke="var(--ink-3)" stroke-width="2"/>
    <path d="M28 75q6-12 12 0t12 0" fill="none" stroke="var(--ink-3)" stroke-width="2"/>
    <rect x="96" y="31" width="54" height="18" rx="2" fill="var(--stage)" stroke="var(--ink)" stroke-width="2"/>
    <path d="M194 60H226M194 84H226" stroke="var(--flow)" stroke-width="3"/>
    <circle cx="262" cy="40" r="4" fill="var(--flow)"/>
    <path d="M28 110H52M32 116H48M37 122H43" stroke="var(--ink)" stroke-width="2"/>
    <text x="123" y="24" text-anchor="middle" font-size="13" fill="var(--ink)">R</text>
    <text x="236" y="76" font-size="13" fill="var(--flow)">C</text>
    <text x="270" y="44" font-size="12" fill="var(--flow)">salida</text>
    <text x="40" y="146" text-anchor="middle" font-size="12" fill="var(--ink-3)">entrada ~</text>
    <text x="123" y="68" text-anchor="middle" font-size="11" class="mono" fill="var(--ink-3)" id="rc-s-r"></text>
    <text x="236" y="96" font-size="11" class="mono" fill="var(--ink-3)" id="rc-s-c"></text>`;

  const bode = $('#rc-bode'), time = $('#rc-time');
  const B = { x0: 40, x1: 330, y0: 18, y1: 178, fmin: 0, fmax: 6, dbmin: -60 };
  const bx = (lf) => B.x0 + (lf - B.fmin) / (B.fmax - B.fmin) * (B.x1 - B.x0);
  const by = (db) => B.y0 + (Math.max(db, B.dbmin) / B.dbmin) * (B.y1 - B.y0);
  // Rejilla del diagrama de Bode (una vez)
  {
    const g = el('g', {}, bode);
    for (let d = 0; d <= 6; d++) {
      el('line', { x1: bx(d), x2: bx(d), y1: B.y0, y2: B.y1, stroke: 'var(--rule)' }, g);
      const t = el('text', { x: bx(d), y: B.y1 + 14, 'text-anchor': 'middle', 'font-size': 10.5, fill: 'var(--ink-3)', class: 'mono' }, g);
      t.textContent = ['1', '10', '100', '1k', '10k', '100k', '1M'][d];
    }
    for (const db of [0, -20, -40, -60]) {
      el('line', { x1: B.x0, x2: B.x1, y1: by(db), y2: by(db), stroke: 'var(--rule)' }, g);
      const t = el('text', { x: B.x0 - 5, y: by(db) + 4, 'text-anchor': 'end', 'font-size': 10.5, fill: 'var(--ink-3)', class: 'mono' }, g); t.textContent = db;
    }
    const tx = el('text', { x: (B.x0 + B.x1) / 2, y: 206, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-3)' }, g); tx.textContent = 'Frecuencia (Hz)';
    const ty = el('text', { x: 10, y: 12, 'font-size': 11, fill: 'var(--ink-3)' }, g); ty.textContent = 'dB';
  }
  const bCurve = el('path', { fill: 'none', stroke: 'var(--flow)', 'stroke-width': 2.2 }, bode);
  const bFc = el('line', { stroke: 'var(--ok)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3', y1: B.y0, y2: B.y1 }, bode);
  const bFcDot = el('circle', { r: 4.5, fill: 'var(--ok)' }, bode);
  const bF = el('line', { stroke: 'var(--ctrl)', 'stroke-width': 2, y1: B.y0, y2: B.y1 }, bode);
  const bFDot = el('circle', { r: 5, fill: 'var(--ctrl)', stroke: 'var(--stage)', 'stroke-width': 2 }, bode);

  const T = { x0: 30, x1: 330, ym: 98, a: 66 };
  {
    const g = el('g', {}, time);
    el('line', { x1: T.x0, x2: T.x1, y1: T.ym, y2: T.ym, stroke: 'var(--rule)' }, g);
    for (const v of [1, -1]) el('line', { x1: T.x0, x2: T.x1, y1: T.ym - v * T.a, y2: T.ym - v * T.a, stroke: 'var(--rule)', 'stroke-dasharray': '2 4' }, g);
    const t1 = el('text', { x: T.x0 - 5, y: T.ym - T.a + 4, 'text-anchor': 'end', 'font-size': 10.5, class: 'mono', fill: 'var(--ink-3)' }, g); t1.textContent = '+1';
    const t2 = el('text', { x: T.x0 - 5, y: T.ym + T.a + 4, 'text-anchor': 'end', 'font-size': 10.5, class: 'mono', fill: 'var(--ink-3)' }, g); t2.textContent = '−1';
    const t3 = el('text', { x: T.x0 - 5, y: T.ym + 4, 'text-anchor': 'end', 'font-size': 10.5, class: 'mono', fill: 'var(--ink-3)' }, g); t3.textContent = '0';
    const ty = el('text', { x: 4, y: 12, 'font-size': 11, fill: 'var(--ink-3)' }, g); ty.textContent = 'V (relativo a la entrada)';
  }
  const tIn = el('path', { fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 }, time);
  const tOut = el('path', { fill: 'none', stroke: 'var(--flow)', 'stroke-width': 2.4 }, time);
  const tAx = el('text', { x: 180, y: 206, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-3)' }, time);

  function cjs(r, c, f) {
    const dt = Math.min(5e-6, 1 / (f * 200));
    return [
      `$ 1 ${dt.toExponential(3)} 10.20027730826997 50 5 50 5e-11`,
      `v 96 336 96 112 0 1 ${+f.toPrecision(4)} 1 0 0 0.5`,
      `r 96 112 272 112 0 ${+r.toPrecision(4)}`,
      `c 272 112 272 336 0 ${(+c.toPrecision(4)).toExponential()} 0`,
      `w 96 336 272 336 0`,
      `g 96 336 96 368 0 0`,
    ].join('\n');
  }

  function update() {
    const r = 10 ** +R.value, c = 10 ** +Cc.value, lf = +F.value, f = 10 ** lf;
    const fc = 1 / (2 * Math.PI * r * c), x = f / fc;
    const gain = 1 / Math.sqrt(1 + x * x), db = 20 * Math.log10(gain), ph = -Math.atan(x) * 180 / Math.PI;
    $('#rc-r-out').textContent = si(r, 'Ω'); $('#rc-c-out').textContent = si(c, 'F'); $('#rc-f-out').textContent = si(f, 'Hz');
    $('#rc-s-r').textContent = si(r, 'Ω'); $('#rc-s-c').textContent = si(c, 'F');
    $('#rc-fc').textContent = si(fc, 'Hz');
    $('#rc-gain').textContent = `${fmt(gain * 100, gain < 0.1 ? 1 : 0)} %`;
    $('#rc-db').textContent = `${fmt(db, 1)} dB`;
    $('#rc-ph').textContent = `${fmt(ph, 0)}°`;
    // Bode
    let d = '';
    for (let k = 0; k <= 160; k++) { const l = B.fmin + (B.fmax - B.fmin) * k / 160, xx = 10 ** l / fc; d += (k ? 'L' : 'M') + bx(l).toFixed(1) + ' ' + by(-10 * Math.log10(1 + xx * xx)).toFixed(1); }
    bCurve.setAttribute('d', d);
    const lfc = Math.log10(fc), inFc = lfc >= B.fmin && lfc <= B.fmax;
    for (const e of [bFc, bFcDot]) e.style.display = inFc ? '' : 'none';
    bFc.setAttribute('x1', bx(lfc)); bFc.setAttribute('x2', bx(lfc)); bFcDot.setAttribute('cx', bx(lfc)); bFcDot.setAttribute('cy', by(-3.01));
    bF.setAttribute('x1', bx(lf)); bF.setAttribute('x2', bx(lf)); bFDot.setAttribute('cx', bx(lf)); bFDot.setAttribute('cy', by(db));
    // Onda: 2 periodos de la entrada, régimen permanente
    const per = 1 / f, tspan = 2 * per; let di = '', dout = '';
    const phr = -Math.atan(x);
    for (let k = 0; k <= 200; k++) {
      const t = tspan * k / 200, xp = T.x0 + (T.x1 - T.x0) * k / 200, w = 2 * Math.PI * f * t;
      di += (k ? 'L' : 'M') + xp.toFixed(1) + ' ' + (T.ym - T.a * Math.sin(w)).toFixed(1);
      dout += (k ? 'L' : 'M') + xp.toFixed(1) + ' ' + (T.ym - T.a * gain * Math.sin(w + phr)).toFixed(1);
    }
    tIn.setAttribute('d', di); tOut.setAttribute('d', dout);
    tAx.textContent = `Tiempo: 2 periodos = ${si(tspan, 's')}`;
    $('#rc-cjs').textContent = cjs(r, c, f);
  }
  [R, Cc, F].forEach((i) => i.addEventListener('input', update));
  update();
  $('#rc-copy').addEventListener('click', () => {
    const txt = $('#rc-cjs').textContent, msg = $('#rc-copy-msg');
    const sel = () => { const rg = document.createRange(); rg.selectNodeContents($('#rc-cjs')); const s = getSelection(); s.removeAllRanges(); s.addRange(rg); msg.textContent = 'Texto seleccionado: cópialo con Ctrl+C.'; };
    try { navigator.clipboard.writeText(txt).then(() => { msg.textContent = 'Copiado.'; }, sel); } catch { sel(); }
  });
}

/* =====================================================================
   PASOS · burbuja (ejecuta el algoritmo y guarda la traza)
   ===================================================================== */
{
  const inputs = {
    ejemplo: [5, 3, 8, 1, 6, 2],
    casi: [1, 2, 4, 3, 5, 6],
    reves: [6, 5, 4, 3, 2, 1],
  };
  const randomInput = () => { const a = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5).slice(0, 6); return a; };
  let trace = [], i = 0, timer = null, items = [];
  const barsEl = $('#bs-bars');

  function run(a0) {
    const a = a0.map((v, k) => ({ v, id: k }));
    const T = []; let cmp = 0, swp = 0, end = a.length - 1, pass = 0;
    const snap = (o) => T.push({ order: a.map((x) => x.id), cmp, swp, pass, end, ...o });
    snap({ line: 0, msg: `Lista de entrada: ${a.map((x) => x.v).join(', ')}. Se recorrerá comparando vecinos.`, done: -1 });
    let changed;
    do {
      pass++; changed = false;
      snap({ line: 1, msg: `Pasada ${pass}: se recorre desde el inicio hasta la posición ${end}.`, done: end + 1 });
      for (let k = 0; k < end; k++) {
        cmp++;
        const L = a[k].v, Rr = a[k + 1].v;
        if (L > Rr) {
          snap({ line: 3, a: k, b: k + 1, kind: 'cmp', msg: `¿${L} > ${Rr}? Sí: están al revés.`, done: end + 1 });
          [a[k], a[k + 1]] = [a[k + 1], a[k]]; swp++; changed = true;
          snap({ line: 4, a: k, b: k + 1, kind: 'swap', msg: `Se intercambian: ${Rr} pasa a la izquierda y ${L} sigue hacia la derecha.`, done: end + 1 });
        } else {
          snap({ line: 3, a: k, b: k + 1, kind: 'cmp', msg: `¿${L} > ${Rr}? No: se quedan donde están.`, done: end + 1 });
        }
      }
      end--;
      snap({ line: 6, msg: changed ? `Fin de la pasada ${pass}: ${a[end + 1].v} ya está en su lugar.` : `La pasada ${pass} no intercambió nada: la lista ya está ordenada.`, done: end + 1 });
    } while (changed && end > 0);
    snap({ line: 7, msg: `Lista ordenada: ${a.map((x) => x.v).join(', ')}. ${cmp} comparaciones y ${swp} intercambios.`, done: 0, final: true });
    return T;
  }

  function build(arr) {
    stop();
    barsEl.innerHTML = '';
    const max = Math.max(...arr);
    items = arr.map((v, k) => {
      const b = document.createElement('div'); b.className = 'bar idle';
      b.style.height = `${18 + (v / max) * 150}px`;
      b.innerHTML = `<span>${v}</span>`; barsEl.appendChild(b); return b;
    });
    for (let k = 0; k < arr.length; k++) { const s = document.createElement('div'); s.className = 'slotlbl'; s.textContent = k; s.dataset.slot = k; barsEl.appendChild(s); }
    trace = run(arr); i = 0;
    $('#bs-slider').max = trace.length - 1;
    layout(); render();
  }
  function layout() {
    const w = barsEl.clientWidth, n = items.length, gap = 8, bw = Math.min(56, (w - gap * (n - 1)) / n);
    const x0 = (w - (bw * n + gap * (n - 1))) / 2;
    items.forEach((b) => { b.style.width = bw + 'px'; b.style.left = x0 + 'px'; });
    $$('.slotlbl', barsEl).forEach((s) => { s.style.left = x0 + s.dataset.slot * (bw + gap) + 'px'; s.style.width = bw + 'px'; });
    barsEl.dataset.bw = bw; barsEl.dataset.gap = gap;
  }
  function render() {
    const s = trace[i], bw = +barsEl.dataset.bw, gap = +barsEl.dataset.gap;
    s.order.forEach((id, pos) => {
      const b = items[id];
      b.style.transform = `translateX(${pos * (bw + gap)}px)`;
      let c = 'idle';
      if (s.done >= 0 && pos >= s.done) c = 'done';
      if (pos === s.a || pos === s.b) c = s.kind === 'swap' ? 'swap' : 'cmp';
      b.className = 'bar ' + c;
    });
    $$('#bs-code li').forEach((li, k) => li.classList.toggle('hl', k === s.line || (s.kind === 'swap' && k === 5)));
    $('#bs-status').textContent = s.msg;
    $('#bs-pass').textContent = s.pass ? s.pass : '—';
    $('#bs-cmp').textContent = s.cmp; $('#bs-swp').textContent = s.swp;
    $('#bs-slider').value = i; $('#bs-step-out').textContent = `${i + 1} de ${trace.length}`;
    $('#bs-prev').disabled = i === 0; $('#bs-next').disabled = i === trace.length - 1;
  }
  const go = (d) => { i = Math.max(0, Math.min(trace.length - 1, i + d)); render(); if (i === trace.length - 1) stop(); };
  function stop() { clearInterval(timer); timer = null; $('#bs-play').textContent = '▶ Reproducir'; }
  $('#bs-prev').onclick = () => { stop(); go(-1); };
  $('#bs-next').onclick = () => { stop(); go(1); };
  $('#bs-reset').onclick = () => { stop(); i = 0; render(); };
  $('#bs-slider').oninput = (e) => { stop(); i = +e.target.value; render(); };
  $('#bs-play').onclick = () => {
    if (timer) return stop();
    if (i === trace.length - 1) i = 0;
    $('#bs-play').textContent = '⏸ Pausar';
    timer = setInterval(() => { if (window.VGE.active !== 'pasos' || document.hidden) return; go(1); }, reduced.matches ? 1400 : 950);
  };
  $$('[data-input]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-input]').forEach((x) => x.classList.toggle('on', x === b));
    build(b.dataset.input === 'azar' ? randomInput() : inputs[b.dataset.input]);
  }));
  build(inputs.ejemplo);
  document.addEventListener('vge:tab', (e) => { if (e.detail === 'pasos') { layout(); render(); } else stop(); });
  addEventListener('resize', () => { if (window.VGE.active === 'pasos') { layout(); render(); } });
}

/* =====================================================================
   VIDEO · escenas
   ===================================================================== */
{
  const v = $('#vid'), chips = $$('[data-seek]');
  chips.forEach((b) => b.addEventListener('click', () => { v.currentTime = +b.dataset.seek; v.play().catch(() => {}); }));
  const mark = () => { const t = v.currentTime; const k = t < 5 ? 0 : t < 15.5 ? 1 : 2; chips.forEach((c, j) => c.classList.toggle('on', j === k)); };
  v.addEventListener('timeupdate', mark); mark();
  document.addEventListener('vge:tab', (e) => { if (e.detail !== 'video') v.pause(); });
}

/* =====================================================================
   MAPA · corrosión
   ===================================================================== */
{
  const svg = $('#map-svg');
  const state = { pintura: false, zinc: false, seco: false, sal: false };
  const node = (id, x, y, w, h, color, lines, opts = {}) => {
    const g = el('g', { class: 'node', id }, svg);
    el('rect', { x, y, width: w, height: h, rx: 8, fill: `var(--${color}-soft)`, stroke: `var(--${color})` }, g);
    let ty = y + (opts.top ?? 20);
    lines.forEach(([cls, txt, lv]) => {
      const t = el('text', { x: x + 10, y: ty, class: cls + (lv ? ' lv' + lv : '') }, g); t.textContent = txt; ty += cls === 't' ? 17 : 15;
    });
    return g;
  };
  const defs = el('defs', {}, svg);
  for (const c of ['flow', 'ctrl', 'cons', 'ink-3']) {
    const m = el('marker', { id: 'ar-' + c, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0L10 5L0 10z', fill: `var(--${c})` }, m);
  }
  const edge = (id, d, color) => el('path', { id, d, class: 'edge', stroke: `var(--${color})`, 'marker-end': `url(#ar-${color})` }, svg);
  // Aristas primero (quedan debajo)
  const eFe = edge('e-fe', 'M62 64 L80 114', 'flow');
  const eH2o = edge('e-h2o', 'M180 64 L180 102', 'flow');
  const eO2 = edge('e-o2', 'M298 64 L280 114', 'flow');
  const eCell = edge('e-cell', 'M180 234 L180 268', 'ctrl');
  const eC1 = edge('e-c1', 'M150 322 L104 358', 'cons');
  const eC2 = edge('e-c2', 'M210 322 L256 358', 'cons');
  const eLoop = edge('e-loop', 'M354 392 C 378 392, 378 170, 356 170', 'cons');
  // Nodos
  node('n-fe', 8, 12, 108, 52, 'flow', [['t', 'Hierro'], ['s', 'el metal']]);
  node('n-h2o', 126, 12, 108, 52, 'flow', [['t', 'Agua'], ['s', 'humedad, lluvia']]);
  node('n-o2', 244, 12, 108, 52, 'flow', [['t', 'Oxígeno'], ['s', 'del aire']]);
  const cell = el('g', { id: 'n-cell' }, svg);
  el('rect', { x: 8, y: 104, width: 344, height: 130, rx: 10, fill: 'none', stroke: 'var(--ctrl)', 'stroke-width': 1.5 }, cell);
  const ct = el('text', { x: 20, y: 228, 'font-size': 12, 'font-weight': 600, fill: 'var(--ctrl)' }, cell); ct.textContent = 'Pila de corrosión';
  svg.appendChild(cell);
  const an = node('n-an', 20, 116, 150, 94, 'ctrl', [['t', 'Ánodo'], ['s', 'el hierro suelta'], ['s', 'electrones'], ['f', 'Fe → Fe²⁺ + 2e⁻', 2]]);
  const ca = node('n-ca', 190, 116, 150, 94, 'ctrl', [['t', 'Cátodo'], ['s', 'el oxígeno y el agua'], ['s', 'los recogen'], ['f', 'O₂+2H₂O+4e⁻ → 4OH⁻', 2]]);
  const eE = el('path', { d: 'M171 150 L188 150', class: 'edge', stroke: 'var(--ctrl)', 'marker-end': 'url(#ar-ctrl)' }, svg);
  const eLbl = el('text', { x: 180, y: 142, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ctrl)', class: 'mono' }, svg); eLbl.textContent = 'e⁻';
  const rust = node('n-rust', 100, 268, 160, 54, 'cons', [['t', 'Herrumbre'], ['s', 'óxido de hierro']]);
  const c1 = node('n-c1', 8, 358, 172, 62, 'cons', [['t', 'Pierde espesor'], ['s', 'y resistencia']]);
  const c2 = node('n-c2', 188, 358, 166, 62, 'cons', [['t', 'Capa porosa'], ['s', 'no frena el avance']]);
  const loopT = el('text', { x: 370, y: 300, 'font-size': 11, fill: 'var(--cons)', transform: 'rotate(-90 370 300)', 'text-anchor': 'middle' }, svg); loopT.textContent = 'sigue';
  // Marcas de corte
  const xMark = (x, y) => { const g = el('g', { class: 'xm', transform: `translate(${x} ${y})` }, svg); el('circle', { r: 8, fill: 'var(--stage)', stroke: 'var(--ink-3)' }, g); el('path', { d: 'M-4 -4L4 4M4 -4L-4 4', stroke: 'var(--ink)', 'stroke-width': 1.8 }, g); return g; };
  const xFe = xMark(71, 89), xH2o = xMark(180, 83), xO2 = xMark(289, 89);
  const zincTag = el('g', {}, svg); el('rect', { x: 64, y: 4, width: 60, height: 18, rx: 4, fill: 'var(--ink)' }, zincTag);
  const zt = el('text', { x: 94, y: 17, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--on-ink)', class: 'mono' }, zincTag); zt.textContent = 'capa Zn';
  const fastT = el('text', { x: 188, y: 90, 'font-size': 11, fill: 'var(--flow)', 'font-weight': 600 }, svg); fastT.textContent = '+ sal: más rápido';

  const lvls = () => { const L = +main.dataset.level; $$('.lv2', svg).forEach((t) => { t.style.display = L >= 2 ? '' : 'none'; }); };
  document.addEventListener('vge:level', lvls); lvls();

  function update() {
    const cutFe = state.zinc, cutH2o = state.pintura || state.seco, cutO2 = state.pintura;
    const active = !cutFe && !cutH2o && !cutO2;
    eFe.classList.toggle('cut', cutFe); xFe.style.display = cutFe ? '' : 'none';
    eH2o.classList.toggle('cut', cutH2o); xH2o.style.display = cutH2o ? '' : 'none';
    eO2.classList.toggle('cut', cutO2); xO2.style.display = cutO2 ? '' : 'none';
    zincTag.style.display = state.zinc ? '' : 'none';
    const fast = active && state.sal;
    eH2o.setAttribute('stroke-width', fast ? 4.5 : 2); fastT.style.display = fast ? '' : 'none';
    for (const e of [cell, an, ca, eE, eLbl, eCell, rust, eC1, eC2, c1, c2, eLoop, loopT]) e.classList.toggle('faded', !active);
    let msg;
    if (active) msg = state.sal ? 'Con sal, el agua conduce mejor: la pila trabaja más rápido. Así se oxida tanto el metal cerca del mar.' : 'Sin protección: hierro, agua y oxígeno forman la pila, y la herrumbre porosa deja que siga avanzando.';
    else {
      const why = [];
      if (state.pintura) why.push('la pintura no deja llegar agua ni oxígeno al metal');
      if (state.seco && !state.pintura) why.push('sin humedad no hay agua que conecte la pila');
      if (state.zinc) why.push('el zinc se corroe en lugar del hierro y lo protege, aun si se raya');
      msg = 'Se detiene: ' + why.join('; ') + '.';
    }
    $('#map-status').textContent = msg;
  }
  $$('[data-tg]').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.tg; state[k] = !state[k]; b.setAttribute('aria-pressed', state[k]); update(); }));
  update();
}

/* =====================================================================
   DATOS · LED
   ===================================================================== */
{
  const RS = [100, 150, 220, 330, 470, 680, 1000, 2200];
  const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
  const ILIM = 20; // mA
  const svg = $('#led-svg'), tip = $('#led-tip'), box = $('#led-chart');
  const M = { l: 40, r: 10, t: 20, b: 42, W: 360, H: 236 };
  let sel = 2;
  const ohm = (r) => r >= 1000 ? `${fmt(r / 1000, r % 1000 ? 1 : 0)} k` : `${r} `;
  const nextE12 = (r) => { for (let d = 1; d <= 1e6; d *= 10) for (const e of E12) if (e * d >= r - 1e-9) return e * d; return null; };
  const niceMax = (v) => { const steps = [10, 20, 25, 40, 50, 60, 80, 100, 120, 150]; return steps.find((s) => s >= v) || Math.ceil(v / 50) * 50; };
  const vals = () => ({ vs: +$('input[name="vs"]:checked').value, vf: +$('input[name="vf"]:checked').value });
  const ledColor = () => ({ '2.0': '#e43b2f', '2.1': '#f2b705', '3.1': '#8fc8ff' })[$('input[name="vf"]:checked').value];

  function draw() {
    const { vs, vf } = vals();
    const I = RS.map((r) => Math.max(0, (vs - vf) / r * 1000));
    const ymax = niceMax(Math.max(ILIM * 1.25, ...I));
    const x0 = M.l, x1 = M.W - M.r, y0 = M.t, y1 = M.H - M.b, band = (x1 - x0) / RS.length, bw = band * 0.62;
    const Y = (v) => y1 - v / ymax * (y1 - y0);
    svg.innerHTML = '';
    const step = ymax <= 25 ? 5 : ymax <= 60 ? 10 : ymax <= 100 ? 20 : 30;
    for (let v = 0; v <= ymax + 1e-9; v += step) {
      el('line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), class: 'ax', 'stroke-opacity': v ? .7 : 1 }, svg);
      const t = el('text', { x: x0 - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'axt mono' }, svg); t.textContent = v;
    }
    const yl = el('text', { x: 4, y: 12, class: 'axt' }, svg); yl.textContent = 'mA';
    const xl = el('text', { x: (x0 + x1) / 2, y: M.H - 4, 'text-anchor': 'middle', class: 'axt' }, svg); xl.textContent = 'Resistencia (Ω)';
    // Barras
    RS.forEach((r, k) => {
      const cx = x0 + band * (k + 0.5), over = I[k] > ILIM + 1e-9, h = Math.max(0, y1 - Y(I[k]));
      const g = el('g', { class: 'b', tabindex: 0, role: 'button', 'aria-label': `${ohm(r)}Ω: ${fmt(I[k], 1)} mA${over ? ', excede el límite' : ''}` }, svg);
      el('rect', { x: cx - band / 2, y: y0, width: band, height: y1 - y0, fill: 'transparent' }, g);
      if (h > 0.5) el('path', { d: `M${cx - bw / 2} ${y1} V${y1 - h + 4} Q${cx - bw / 2} ${y1 - h} ${cx - bw / 2 + 4} ${y1 - h} H${cx + bw / 2 - 4} Q${cx + bw / 2} ${y1 - h} ${cx + bw / 2} ${y1 - h + 4} V${y1} Z`, fill: over ? 'var(--crit)' : 'var(--flow)', opacity: k === sel ? 1 : .78 }, g);
      if (over) { const w = el('text', { x: cx, y: Y(I[k]) - 5, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--crit)', 'font-weight': 700 }, g); w.textContent = '⚠'; }
      if (k === sel) { const t = el('text', { x: cx, y: Y(I[k]) - (over ? 19 : 5), 'text-anchor': 'middle', 'font-size': 11.5, fill: 'var(--ink)', class: 'mono', 'font-weight': 500 }, g); t.textContent = fmt(I[k], 1); }
      const lb = el('text', { x: cx, y: y1 + 15, 'text-anchor': 'middle', class: 'axt mono', fill: k === sel ? 'var(--ink)' : '' }, g); lb.textContent = ohm(r).trim();
      const pick = () => { sel = k; draw(); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      g.addEventListener('pointerenter', () => showTip(k, cx, Y(I[k]), I[k], r));
      g.addEventListener('pointerleave', () => { tip.hidden = true; });
    });
    // Línea de límite (encima de las barras)
    el('line', { x1: x0, x2: x1, y1: Y(ILIM), y2: Y(ILIM), class: 'lim' }, svg);
    const lt = el('text', { x: x1, y: Y(ILIM) - 5, 'text-anchor': 'end', 'font-size': 11, fill: 'var(--crit)' }, svg); lt.textContent = 'límite típico 20 mA';
    // Lecturas
    const Isel = I[sel], rsel = RS[sel], over = Isel > ILIM + 1e-9;
    const dot = $('#led-dot'), c = ledColor(), k = Math.min(1, Isel / ILIM);
    dot.style.background = Isel > 0 ? `radial-gradient(circle at 40% 38%, #fff ${k * 22}%, ${c} ${30 + k * 30}%, color-mix(in srgb, ${c} ${Math.round(25 + 60 * k)}%, var(--stage)) 100%)` : 'var(--stage)';
    dot.style.boxShadow = Isel > 0 ? `0 0 ${6 + 26 * k}px ${2 + 8 * k}px color-mix(in srgb, ${c} ${Math.round(70 * k)}%, transparent)` : 'none';
    const sp = $('#led-sel');
    if (vs <= vf) sp.innerHTML = `Con ${fmt(vs, 1)} V la fuente no alcanza para encender un LED que necesita ${fmt(vf, 1)} V.`;
    else sp.innerHTML = `Con <b>${ohm(rsel)}Ω</b> pasan <b>${fmt(Isel, 1)} mA</b>. ${over ? '<span class="warn-t">⚠ Más de 20 mA: el LED se calienta y dura menos.</span>' : 'Dentro del límite.'} <span style="color:var(--ink-3)">(brillo ilustrativo)</span>`;
    if (vs > vf) {
      const rmin = (vs - vf) / (ILIM / 1000), rp = nextE12(rmin), ip = (vs - vf) / rp * 1000, p = (ip / 1000) ** 2 * rp * 1000;
      $('#led-rmin').textContent = `${fmt(rmin, 0)} Ω`; $('#led-rpick').textContent = `${ohm(rp)}Ω`; $('#led-ipick').textContent = `${fmt(ip, 1)} mA`;
      $('#led-pw').textContent = `Con ${ohm(rp)}Ω la resistencia disipa ${fmt(p, 0)} mW; ${p > 125 ? 'usa una de ½ W para ir con margen.' : 'una de ¼ W (250 mW) sobra.'}`;
    } else { $('#led-rmin').textContent = '—'; $('#led-rpick').textContent = '—'; $('#led-ipick').textContent = '—'; $('#led-pw').textContent = ''; }
    // Tabla
    $('#led-table').innerHTML = `<thead><tr><th>Resistencia</th><th>Corriente</th><th>Estado</th></tr></thead><tbody>${RS.map((r, j) => `<tr><td>${ohm(r)}Ω</td><td>${fmt(I[j], 1)} mA</td><td>${I[j] > ILIM + 1e-9 ? '⚠ excede' : I[j] === 0 ? 'apagado' : 'dentro del límite'}</td></tr>`).join('')}</tbody>`;
  }
  function showTip(k, cx, y, i, r) {
    const rect = svg.getBoundingClientRect(), s = rect.width / M.W, br = box.getBoundingClientRect();
    tip.textContent = `${ohm(r)}Ω · ${fmt(i, 1)} mA`;
    tip.style.left = (rect.left - br.left + cx * s) + 'px'; tip.style.top = (rect.top - br.top + y * s) + 'px'; tip.hidden = false;
  }
  $$('input[name="vs"], input[name="vf"]').forEach((i) => i.addEventListener('change', draw));
  draw();
}
window.VGE.start();
})();
