import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const { $, $$, reduced } = window.VGE;
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const colorOf = (name) => new THREE.Color(css(name) || '#888');
const darkMode = () => matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.dataset.theme !== 'light' || document.documentElement.dataset.theme === 'dark';

/* Escena común: renderizador bajo demanda, pausa fuera de su pestaña */
function makeViewer(stage, tabId, { stencil = false } = {}) {
  const canvas = document.createElement('canvas');
  stage.prepend(canvas);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, stencil });
  } catch (e) {
    canvas.remove();
    const f = document.createElement('p'); f.className = 'fallback';
    f.textContent = 'Este navegador no pudo iniciar WebGL, así que la escena 3D no se puede mostrar. Las explicaciones y controles de abajo siguen siendo válidos.';
    stage.appendChild(f);
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.enablePan = false; controls.dampingFactor = 0.08;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 7, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.9); rim.position.set(-5, 2, -4); scene.add(rim);
  const v = { renderer, scene, camera, controls, canvas, running: false, onFrame: null, interacting: false };
  (window.VGE.viewers ||= {})[tabId] = v;
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage); resize();
  let last = 0, raf = 0, idle = 0;
  const loop = (t) => {
    raf = 0;
    if (window.VGE.active !== tabId || document.hidden) { v.running = false; return; }
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0); last = t;
    const busy = v.onFrame ? v.onFrame(dt) : false;
    const moved = controls.update();
    renderer.render(scene, camera);
    idle = busy || moved || v.interacting ? 0 : idle + 1;
    // controls.update() emite 'change' y eso llama a wake() dentro de este mismo ciclo:
    // si wake() ya agendó el siguiente cuadro, no agendar otro (se duplicarían los ciclos).
    if (idle < 30) { if (!raf) raf = requestAnimationFrame(loop); } else if (!raf) { v.running = false; last = 0; }
  };
  v.wake = () => { if (!raf && window.VGE.active === tabId && !document.hidden) { v.running = true; idle = 0; raf = requestAnimationFrame(loop); } };
  controls.addEventListener('start', () => { v.interacting = true; v.wake(); });
  controls.addEventListener('end', () => { v.interacting = false; v.wake(); });
  controls.addEventListener('change', v.wake);
  document.addEventListener('vge:tab', (e) => { if (e.detail === tabId) { resize(); v.wake(); } });
  document.addEventListener('visibilitychange', v.wake);
  return v;
}
const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);

/* =====================================================================
   ANATOMÍA · ventilador de escritorio
   ===================================================================== */
function initFan() {
  const stage = $('#fan-stage');
  const v = makeViewer(stage, 'anatomia');
  if (!v) return;
  const { scene, camera, controls } = v;
  camera.position.set(4.0, 2.9, 4.7).multiplyScalar(Math.max(1, 1.1 / Math.max(0.3, camera.aspect))); controls.target.set(0, 1.5, 0.4); controls.minDistance = 3; controls.maxDistance = 20;
  let baseDist = camera.position.distanceTo(controls.target);

  const C = {
    metal: 0xb9c2c9, dark: 0x3b4650, iron: 0x5d6770, copper: 0xb8662e, copper2: 0xdc9a55, alu: 0xcfd6dc,
    blade: colorOf('--flow').getHex(), body: darkMode() ? 0xdfe5ea : 0xf2f5f7, cap: 0x24292e, ctrl: colorOf('--ctrl').getHex(),
  };
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.15, ...o });
  const head = new THREE.Group(); head.position.y = 1.6; scene.add(head);
  const parts = [];
  const part = (id, name, func, tec, explode, delay, parent = head, spin = false) => {
    const g = new THREE.Group(); parent.add(g);
    const s = spin ? new THREE.Group() : g; if (spin) g.add(s);
    const anchor = new THREE.Object3D(); g.add(anchor);
    const p = { id, name, func, tec, g, s, anchor, explode: new THREE.Vector3(...explode), delay, ghost: false, meshes: [] };
    parts.push(p); return p;
  };
  const add = (p, geo, m, pos, rot) => { const mesh = new THREE.Mesh(geo, m); if (pos) mesh.position.set(...pos); if (rot) mesh.rotation.set(...rot); p.s.add(mesh); mesh.userData.part = p; p.meshes.push(mesh); return mesh; };
  const tube = (pts, r, seg = 12) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), seg, r, 5, false);
  const ringAt = (r, z, tubeR = 0.009) => { const t = new THREE.TorusGeometry(r, tubeR, 6, 72); t.translate(0, 0, z); return t; };

  // Base y poste (fijos)
  const base = part('base', 'Base y control', 'Sostiene el ventilador. El selector elige la velocidad.', 'En muchos ventiladores el selector conecta distintas tomas del bobinado.', [0, 0, 0], 0, scene);
  add(base, new THREE.CylinderGeometry(1.0, 1.1, 0.14, 56), mat(C.body), [0, 0.07, 0]);
  add(base, new THREE.BoxGeometry(0.62, 0.12, 0.3), mat(C.body), [0, 0.2, 0.55]);
  for (let k = 0; k < 4; k++) add(base, new THREE.BoxGeometry(0.1, 0.05, 0.12), mat(k === 1 ? C.ctrl : C.dark), [-0.21 + k * 0.14, 0.28, 0.55]);
  add(base, new THREE.CylinderGeometry(0.065, 0.08, 1.06, 24), mat(C.metal, { metalness: 0.6, roughness: 0.3 }), [0, 0.67, 0]);
  add(base, new THREE.SphereGeometry(0.1, 20, 14), mat(C.dark), [0, 1.2, 0]);
  base.anchor.position.set(0.5, 0.25, 0.55);

  // Carcasa del motor (perfil de revolución, eje z)
  const housing = part('carcasa', 'Carcasa del motor', 'Encierra el motor, sostiene el eje y deja salir el calor.', 'Los bujes o rodamientos que guían el eje van en sus tapas.', [0, 0, -1.15], 0.4);
  const prof = [[0.0, -0.62], [0.22, -0.6], [0.36, -0.52], [0.42, -0.38], [0.42, 0.12], [0.38, 0.18], [0.3, 0.2], [0.07, 0.2]].map(([r, h]) => new THREE.Vector2(r, h));
  const hg = new THREE.LatheGeometry(prof, 56); hg.rotateX(Math.PI / 2);
  add(housing, hg, mat(C.body, { side: THREE.DoubleSide }));
  for (let k = 0; k < 10; k++) add(housing, new THREE.BoxGeometry(0.02, 0.012, 0.36), mat(C.dark), [Math.cos(k * 0.2 + 1.1) * 0.425, Math.sin(k * 0.2 + 1.1) * 0.425, -0.12], [0, 0, k * 0.2 + 1.1]);
  housing.anchor.position.set(0, 0.48, -0.35); housing.ghost = true;

  // Estator con bobinas (fijo: referencia del despiece)
  const stator = part('estator', 'Estator y bobinas', 'Bobinas fijas de cobre: con corriente crean un campo magnético que gira.', 'Dos devanados (principal y auxiliar) desplazados 90°; el núcleo es de chapas de acero.', [0, 0, 0], 0);
  const sp = [[0.22, -0.3], [0.37, -0.3], [0.37, 0], [0.22, 0], [0.22, -0.3]].map(([r, h]) => new THREE.Vector2(r, h));
  const sg = new THREE.LatheGeometry(sp, 48); sg.rotateX(Math.PI / 2);
  add(stator, sg, mat(C.iron, { metalness: 0.5, roughness: 0.45, side: THREE.DoubleSide }));
  for (let k = 0; k < 4; k++) for (const z of [0.035, -0.335]) {
    const t = new THREE.TorusGeometry(0.295, 0.045, 8, 20, Math.PI / 2.6); t.rotateZ(k * Math.PI / 2 + 0.17); t.translate(0, 0, z);
    add(stator, t, mat(k % 2 ? C.copper2 : C.copper, { metalness: 0.7, roughness: 0.35 }));
  }
  stator.anchor.position.set(-0.3, 0.32, -0.15);

  // Rotor de jaula + eje (gira)
  const rotor = part('rotor', 'Rotor y eje', 'La pieza que gira. El campo de las bobinas la arrastra sin cables ni contacto.', 'Rotor de jaula de ardilla: barras de aluminio unidas por anillos; el campo induce corriente en ellas.', [0, 0, 0.85], 0.32, head, true);
  const core = new THREE.CylinderGeometry(0.2, 0.2, 0.28, 40); core.rotateX(Math.PI / 2); core.translate(0, 0, -0.15);
  add(rotor, core, mat(C.iron, { metalness: 0.5 }));
  for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; add(rotor, new THREE.BoxGeometry(0.022, 0.022, 0.29), mat(C.alu, { metalness: 0.7, roughness: 0.3 }), [Math.cos(a) * 0.2, Math.sin(a) * 0.2, -0.15], [0, 0, a]); }
  for (const z of [-0.295, -0.005]) add(rotor, new THREE.TorusGeometry(0.19, 0.024, 8, 40), mat(C.alu, { metalness: 0.7, roughness: 0.3 }), [0, 0, z]);
  const shaft = new THREE.CylinderGeometry(0.034, 0.034, 1.24, 20); shaft.rotateX(Math.PI / 2); shaft.translate(0, 0, 0.04);
  add(rotor, shaft, mat(C.metal, { metalness: 0.8, roughness: 0.25 }));
  rotor.anchor.position.set(0, 0.24, -0.15);

  // Capacitor (bajo la carcasa)
  const capP = part('capacitor', 'Capacitor', 'Desfasa la corriente de una bobina respecto de la otra; así el campo gira y el motor arranca solo.', 'Capacitor de marcha en serie con el devanado auxiliar: adelanta su corriente.', [0.75, 0, 0], 0.4);
  const cg = new THREE.CylinderGeometry(0.085, 0.085, 0.32, 28); cg.rotateZ(Math.PI / 2);
  add(capP, cg, mat(C.cap, { roughness: 0.6 }), [0.27, -0.48, -0.25]);
  const band = new THREE.CylinderGeometry(0.087, 0.087, 0.05, 28); band.rotateZ(Math.PI / 2);
  add(capP, band, mat(C.ctrl), [0.33, -0.48, -0.25]);
  capP.anchor.position.set(0.42, -0.48, -0.25);

  // Rejilla trasera
  const rear = part('rejilla-t', 'Rejilla trasera', 'Protección trasera; también sostiene a la delantera.', 'Se fija al frente de la carcasa; el borde engancha con la rejilla delantera.', [0, 0, 1.35], 0.24);
  const wire = mat(C.metal, { metalness: 0.7, roughness: 0.3 });
  const zr = (r) => 0.22 + 0.18 * ((r - 0.45) / 0.57);
  for (let k = 0; k < 28; k++) { const a = k * Math.PI * 2 / 28; add(rear, tube([[Math.cos(a) * 0.45, Math.sin(a) * 0.45, zr(0.45)], [Math.cos(a) * 1.02, Math.sin(a) * 1.02, zr(1.02)]], 0.008, 2), wire); }
  for (const r of [0.45, 0.65, 0.85]) add(rear, ringAt(r, zr(r)), wire);
  add(rear, ringAt(1.02, 0.4, 0.018), wire);
  rear.anchor.position.set(0.7, 0.55, 0.32); rear.ghost = true;

  // Aspas + buje (gira)
  const blades = part('aspas', 'Aspas', 'Empujan el aire hacia adelante: su inclinación convierte el giro en corriente de aire.', 'Cada aspa trabaja como un ala con un ángulo de ataque; el caudal crece con la velocidad.', [0, 0, 1.95], 0.16, head, true);
  const bs = new THREE.Shape();
  bs.moveTo(0.14, -0.06); bs.bezierCurveTo(0.35, -0.22, 0.75, -0.3, 0.92, -0.12); bs.quadraticCurveTo(0.99, 0.05, 0.86, 0.18); bs.bezierCurveTo(0.65, 0.3, 0.35, 0.2, 0.14, 0.06); bs.closePath();
  const bladeMat = mat(C.blade, { transparent: true, opacity: 0.88, side: THREE.DoubleSide, roughness: 0.35 });
  for (let k = 0; k < 3; k++) { const g = new THREE.ShapeGeometry(bs, 24); g.rotateX(0.42); g.rotateZ(k * Math.PI * 2 / 3); g.translate(0, 0, 0.55); add(blades, g, bladeMat); }
  const hub = new THREE.CylinderGeometry(0.15, 0.15, 0.14, 36); hub.rotateX(Math.PI / 2); hub.translate(0, 0, 0.55);
  add(blades, hub, mat(C.blade, { roughness: 0.4 }));
  blades.anchor.position.set(0, 0.62, 0.55);

  // Tuerca del aspa (gira con el eje)
  const spinner = part('tuerca', 'Tuerca del aspa', 'Sujeta las aspas al eje para que giren juntos.', 'Se enrosca en la punta del eje; al quitarla salen las aspas.', [0, 0, 2.45], 0.08, head, true);
  const dome = new THREE.SphereGeometry(0.1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2); dome.rotateX(Math.PI / 2); dome.translate(0, 0, 0.62);
  add(spinner, dome, mat(C.body, { roughness: 0.3 }));
  spinner.anchor.position.set(0, 0.12, 0.68);

  // Rejilla delantera
  const front = part('rejilla-d', 'Rejilla delantera', 'Protege los dedos sin frenar casi el aire.', 'Alambres radiales y anillos; la separación es pequeña para que no entren dedos.', [0, 0, 3.0], 0, head);
  const zf = (r) => 0.7 + 0.35 * (1 - (r / 1.02) ** 2);
  for (let k = 0; k < 28; k++) {
    const a0 = k * Math.PI * 2 / 28, pts = [];
    for (let j = 0; j <= 8; j++) { const r = 0.15 + (1.02 - 0.15) * j / 8, a = a0 + 0.35 * r; pts.push([Math.cos(a) * r, Math.sin(a) * r, zf(r)]); }
    add(front, tube(pts, 0.008, 14), wire);
  }
  for (const r of [0.38, 0.62, 0.84]) add(front, ringAt(r, zf(r)), wire);
  const bandG = new THREE.CylinderGeometry(1.025, 1.025, 0.3, 72, 1, true); bandG.rotateX(Math.PI / 2); bandG.translate(0, 0, 0.55);
  add(front, bandG, mat(C.body, { side: THREE.DoubleSide }));
  const badge = new THREE.CylinderGeometry(0.15, 0.15, 0.03, 36); badge.rotateX(Math.PI / 2); badge.translate(0, 0, zf(0.15));
  add(front, badge, mat(C.ctrl));
  front.anchor.position.set(-0.75, 0.7, 0.75); front.ghost = true;

  // Materiales propios por pieza (para atenuar/aislar)
  parts.forEach((p) => p.meshes.forEach((m) => { m.material = m.material.clone(); m.userData.baseOpacity = m.material.opacity; m.userData.baseTransparent = m.material.transparent; }));

  // Flujo de aire (puntos)
  const N = 90, pos = new Float32Array(N * 3), seeds = [];
  for (let k = 0; k < N; k++) { const a = Math.random() * Math.PI * 2, r = 0.15 + Math.random() * 0.8; seeds.push({ a, r, z: Math.random() }); }
  const airGeo = new THREE.BufferGeometry(); airGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const air = new THREE.Points(airGeo, new THREE.PointsMaterial({ color: colorOf('--flow'), size: 0.045, transparent: true, opacity: 0.55, depthWrite: false }));
  head.add(air);

  // Estado único
  const S = { spin: !reduced.matches, speed: 0, angle: 0, explode: 0, target: 0, xray: 0, xrayT: 0, sel: null, isolate: false, step: 0 };
  const steps = [
    { name: 'Funciona', say: 'El motor hace girar las aspas y estas empujan el aire hacia ti.', explode: 0, xray: 0, sel: null, isolate: false, spin: true },
    { name: 'Entramos', say: 'Dentro de la carcasa: bobinas fijas (estator) y una pieza que gira (rotor).', explode: 0, xray: 1, sel: null, isolate: false, spin: true },
    { name: 'Aislamos', say: 'Las bobinas crean el campo que gira; toca otra pieza para ver su función.', explode: 0.35, xray: 1, sel: 'estator', isolate: true, spin: false },
    { name: 'Despiece', say: 'Cada pieza separada a lo largo del eje, en el orden en que se desarma.', explode: 1, xray: 0, sel: null, isolate: false, spin: false },
    { name: 'Volvemos', say: 'Armado otra vez: el giro del rotor llega a las aspas por el eje.', explode: 0, xray: 0, sel: null, isolate: false, spin: true },
  ];
  const callout = $('#fan-callout'), leader = $('#fan-leader');
  const partBtns = {};
  parts.forEach((p) => {
    const b = document.createElement('button'); b.className = 'btn sm'; b.textContent = p.name; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => { select(S.sel === p.id ? null : p.id); }); $('#fan-parts').appendChild(b); partBtns[p.id] = b;
  });
  function select(id) {
    S.sel = id; Object.entries(partBtns).forEach(([k, b]) => b.setAttribute('aria-pressed', k === id));
    if (id && S.step !== 2) S.isolate = false;
    if (!id) S.isolate = false;
    styleParts(); v.wake();
  }
  function styleParts() {
    parts.forEach((p) => {
      const dim = (S.isolate && S.sel && p.id !== S.sel);
      const ghost = p.ghost ? S.xray : 0;
      const op = dim ? 0.12 : 1 - 0.82 * ghost;
      p.meshes.forEach((m) => {
        const mm = m.material, base = m.userData.baseOpacity;
        mm.opacity = Math.min(base, op); mm.transparent = mm.opacity < 0.999 || m.userData.baseTransparent; mm.depthWrite = mm.opacity > 0.5;
        mm.emissive?.setHex(S.sel === p.id ? 0x332211 : 0x000000);
      });
    });
  }
  function setStep(k, fromTour = false) {
    if (!fromTour) stopTour();
    S.step = k; const s = steps[k];
    S.target = s.explode; S.xrayT = s.xray; S.isolate = s.isolate; S.spin = s.spin && !reduced.matches;
    select(s.sel); S.isolate = s.isolate; styleParts();
    if (reduced.matches) { S.explode = S.target; S.xray = S.xrayT; }
    $('#fan-stepname').textContent = `${k + 1} · ${s.name}`; $('#fan-say').textContent = s.say;
    $$('#fan-steps .btn').forEach((b, j) => b.setAttribute('aria-pressed', j === k));
    $('#fan-explode').value = Math.round(S.target * 100); $('#fan-explode-out').textContent = `${Math.round(S.target * 100)} %`;
    syncPlay(); v.wake();
  }
  const syncPlay = () => { const b = $('#fan-play'); b.textContent = S.spin ? 'Pausar giro' : 'Girar'; b.setAttribute('aria-pressed', S.spin); };
  $$('#fan-steps .btn').forEach((b) => b.addEventListener('click', () => setStep(+b.dataset.step)));
  $('#fan-play').addEventListener('click', () => { S.spin = !S.spin; syncPlay(); v.wake(); });
  $('#fan-explode').addEventListener('input', (e) => { stopTour(); S.target = +e.target.value / 100; if (reduced.matches) S.explode = S.target; $('#fan-explode-out').textContent = `${e.target.value} %`; v.wake(); });
  let tour = null;
  function stopTour() { if (tour) { clearInterval(tour); tour = null; $('#fan-tour').textContent = '▶ Recorrido automático'; } }
  $('#fan-tour').addEventListener('click', () => {
    if (tour) return stopTour();
    $('#fan-tour').textContent = '⏸ Detener recorrido';
    let k = 0; setStep(0, true);
    tour = setInterval(() => { if (window.VGE.active !== 'anatomia' || document.hidden) return; k = (k + 1) % steps.length; setStep(k, true); }, 4200);
  });
  document.addEventListener('vge:tab', (e) => { if (e.detail !== 'anatomia') stopTour(); });

  controls.addEventListener('end', () => { baseDist = camera.position.distanceTo(controls.target) / (1 + 0.55 * S.explode); });
  // Selección por toque (sin arrastre)
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  v.canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  v.canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = v.canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(parts.flatMap((p) => p.meshes), false).filter((h) => h.object.material.opacity > 0.3);
    stopTour(); select(hits.length ? hits[0].object.userData.part.id : null);
  });

  const tmp = new THREE.Vector3();
  function placeCallout() {
    const p = parts.find((q) => q.id === S.sel);
    if (!p) { callout.hidden = true; leader.innerHTML = ''; return; }
    p.anchor.getWorldPosition(tmp); tmp.project(camera);
    const W = stage.clientWidth, H = stage.clientHeight, x = (tmp.x + 1) / 2 * W, y = (1 - tmp.y) / 2 * H;
    const lvl = +document.getElementById('main').dataset.level;
    callout.innerHTML = `<b>${p.name}</b>${p.func}${lvl >= 2 ? `<div class="tec">${p.tec}</div>` : ''}`;
    callout.hidden = false;
    const cw = callout.offsetWidth, ch = callout.offsetHeight;
    let cx = x < W / 2 ? x + 36 : x - 36 - cw, cy = y - ch - 30;
    if (cy < 44) cy = y + 30;
    cx = Math.max(8, Math.min(W - cw - 8, cx)); cy = Math.max(44, Math.min(H - ch - 8, cy));
    callout.style.left = cx + 'px'; callout.style.top = cy + 'px';
    const ex = Math.max(cx, Math.min(cx + cw, x)), ey = y < cy ? cy : cy + ch;
    leader.innerHTML = `<line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="var(--ink-3)" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="4" fill="var(--panel)" stroke="var(--ink)" stroke-width="2"/>`;
  }
  document.addEventListener('vge:level', () => { placeCallout(); });

  v.onFrame = (dt) => {
    const k = reduced.matches ? 1 : 1 - Math.exp(-dt * 4);
    const pe = S.explode, px = S.xray;
    S.explode += (S.target - S.explode) * k; if (Math.abs(S.target - S.explode) < 1e-3) S.explode = S.target;
    S.xray += (S.xrayT - S.xray) * k; if (Math.abs(S.xrayT - S.xray) < 1e-3) S.xray = S.xrayT;
    const wantSpeed = S.spin ? 9 : 0; S.speed += (wantSpeed - S.speed) * (1 - Math.exp(-dt * 2.5)); if (!S.spin && S.speed < 0.02) S.speed = 0;
    S.angle += S.speed * dt;
    parts.forEach((p) => {
      const t = ease((S.explode - p.delay * 0.6) / (1 - p.delay * 0.6));
      p.g.position.copy(p.explode).multiplyScalar(t);
      if (p.s !== p.g) p.s.rotation.z = -S.angle;
    });
    controls.target.z = 0.4 + 0.9 * S.explode;
    if (!v.interacting && S.explode !== pe) { const dir = camera.position.clone().sub(controls.target).normalize(); camera.position.copy(controls.target).addScaledVector(dir, baseDist * (1 + 0.55 * S.explode)); }
    if (S.xray !== px) styleParts();
    // Aire: solo con el ventilador armado y girando
    const flow = Math.max(0, 1 - S.explode * 6) * Math.min(1, S.speed / 9);
    air.visible = flow > 0.02; air.material.opacity = 0.55 * flow;
    if (air.visible) {
      seeds.forEach((s, i) => { s.z = (s.z + dt * 0.55 * (S.speed / 9)) % 1; const z = 1.1 + s.z * 2.4, spread = 1 + s.z * 0.25; pos[i * 3] = Math.cos(s.a) * s.r * spread; pos[i * 3 + 1] = Math.sin(s.a) * s.r * spread; pos[i * 3 + 2] = z; });
      airGeo.attributes.position.needsUpdate = true;
    }
    placeCallout();
    return S.speed > 0 || S.explode !== pe || S.xray !== px || S.explode !== S.target || S.xray !== S.xrayT;
  };
  setStep(0);
}

/* =====================================================================
   ESCENA 3D · engranajes rectos con perfil de evolvente
   ===================================================================== */
function gearOutline(z, m, alpha) {
  const rp = m * z / 2, rb = rp * Math.cos(alpha), ra = rp + m, rf = rp - 1.25 * m;
  const inv = (a) => Math.tan(a) - a;
  const psi = (r) => Math.PI / (2 * z) + inv(alpha) - inv(Math.acos(Math.min(1, rb / r)));
  const pts = [], P = (r, a) => pts.push(new THREE.Vector2(r * Math.cos(a), r * Math.sin(a)));
  const r0 = Math.max(rb, rf), N = 10;
  for (let k = 0; k < z; k++) {
    const th = k * 2 * Math.PI / z, thn = (k + 1) * 2 * Math.PI / z;
    if (rf < rb) P(rf, th - psi(rb));
    for (let i = 0; i <= N; i++) { const r = r0 + (ra - r0) * i / N; P(r, th - psi(r)); }
    for (let i = 1; i < 4; i++) P(ra, th - psi(ra) + (2 * psi(ra)) * i / 4);
    for (let i = N; i >= 0; i--) { const r = r0 + (ra - r0) * i / N; P(r, th + psi(r)); }
    if (rf < rb) P(rf, th + psi(rb));
    const a0 = th + psi(rb), a1 = thn - psi(rb);
    for (let i = 1; i < 4; i++) P(rf, a0 + (a1 - a0) * i / 4);
  }
  return { pts, rp, rb, ra, rf };
}
function circlePath(r, n = 48, cx = 0, cy = 0) { const p = new THREE.Path(); for (let i = 0; i <= n; i++) { const a = -i / n * Math.PI * 2; const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); i ? p.lineTo(x, y) : p.moveTo(x, y); } return p; }
function borePath(r, w, rk) {
  const b = Math.asin(w / 2 / r), p = new THREE.Path(), n = 40;
  p.moveTo(w / 2, rk); p.lineTo(-w / 2, rk);
  for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + b + (2 * Math.PI - 2 * b) * i / n; p.lineTo(r * Math.cos(a), r * Math.sin(a)); }
  p.closePath(); return p;
}
function extrude(shape, depth, s) { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, -depth / 2); g.scale(s, s, s); return g; }

function initGears() {
  const stage = $('#gear-stage');
  const v = makeViewer(stage, 'escena-3d', { stencil: true });
  if (!v) return;
  const { scene, camera, controls, renderer } = v;
  const S = 0.1; // 1 unidad = 10 mm
  const m = 2, al = 20 * Math.PI / 180, z1 = 18, z2 = 27, a = m * (z1 + z2) / 2;
  const views = { front: [0, 0.3, 10.5], iso: [3.2, 5.8, 8.2], top: [0.01, 11, 0.6], mesh: [-0.45, 0.35, 5.2] };
  const targets = { front: [0, 0.6, 0], iso: [0, 0.6, 0], top: [0, 0, 0.5], mesh: [-0.45, 0.25, 0] };
  camera.position.set(...views.iso); controls.target.set(0, 0.6, 0); controls.minDistance = 5; controls.maxDistance = 28;

  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 3.4);
  const mk = (color) => new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.42, clippingPlanes: [plane], side: THREE.FrontSide });
  const cDrive = colorOf('--ctrl'), cDriven = colorOf('--flow');

  // Rueda motriz (maciza)
  const o1 = gearOutline(z1, m, al), sh1 = new THREE.Shape(o1.pts); sh1.holes.push(borePath(4, 3, 5.6));
  const g1 = new THREE.Group(); g1.position.x = -a / 2 * S; scene.add(g1);
  const solids = [];
  const addSolid = (grp, geo, color) => { const ms = new THREE.Mesh(geo, mk(color)); ms.renderOrder = 6; grp.add(ms); solids.push([grp, geo]); return ms; };
  addSolid(g1, extrude(sh1, 12, S), cDrive);
  // Rueda conducida: llanta + alma con agujeros + cubo
  const o2 = gearOutline(z2, m, al);
  const rim = new THREE.Shape(o2.pts); rim.holes.push(circlePath(20.5, 72));
  const web = new THREE.Shape(); web.absarc(0, 0, 20.5, 0, Math.PI * 2, false); web.holes.push(circlePath(9, 48));
  for (let k = 0; k < 6; k++) web.holes.push(circlePath(3.2, 24, 14.75 * Math.cos(k * Math.PI / 3 + Math.PI / 6), 14.75 * Math.sin(k * Math.PI / 3 + Math.PI / 6)));
  const hubS = new THREE.Shape(); hubS.absarc(0, 0, 9, 0, Math.PI * 2, false); hubS.holes.push(borePath(5, 3, 7));
  const g2 = new THREE.Group(); g2.position.x = a / 2 * S; scene.add(g2);
  addSolid(g2, extrude(rim, 12, S), cDriven);
  addSolid(g2, extrude(web, 4, S), cDriven);
  addSolid(g2, extrude(hubS, 18, S), cDriven);
  // Marcas para contar vueltas
  for (const [g, r] of [[g1, 1.05], [g2, 2.25]]) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, clippingPlanes: [plane] })); d.position.set(0, r, 0.63); g.add(d); }

  // Tapas de corte con plantilla (stencil) y rayado
  const hatch = document.createElement('canvas'); hatch.width = hatch.height = 64;
  { const c = hatch.getContext('2d'); c.fillStyle = darkMode() ? '#2a353e' : '#e9eef1'; c.fillRect(0, 0, 64, 64); c.strokeStyle = darkMode() ? '#c9d4dc' : '#33414c'; c.lineWidth = 3; for (let i = -64; i < 128; i += 12) { c.beginPath(); c.moveTo(i, 64); c.lineTo(i + 64, 0); c.stroke(); } }
  const htex = new THREE.CanvasTexture(hatch); htex.wrapS = htex.wrapT = THREE.RepeatWrapping; htex.repeat.set(9, 9); htex.colorSpace = THREE.SRGBColorSpace;
  const base = new THREE.MeshBasicMaterial({ depthWrite: false, depthTest: false, colorWrite: false, stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc });
  const back = base.clone(); back.side = THREE.BackSide; back.clippingPlanes = [plane];
  back.stencilFail = back.stencilZFail = back.stencilZPass = THREE.IncrementWrapStencilOp;
  const frontM = base.clone(); frontM.side = THREE.FrontSide; frontM.clippingPlanes = [plane];
  frontM.stencilFail = frontM.stencilZFail = frontM.stencilZPass = THREE.DecrementWrapStencilOp;
  solids.forEach(([grp, geo]) => { const b = new THREE.Mesh(geo, back); b.renderOrder = 1; grp.add(b); const f = new THREE.Mesh(geo, frontM); f.renderOrder = 1; grp.add(f); });
  const capMat = new THREE.MeshBasicMaterial({ map: htex, stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc, stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp, side: THREE.DoubleSide });
  const cap = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), capMat); cap.rotation.x = -Math.PI / 2; cap.renderOrder = 1.1;
  cap.onAfterRender = (r) => r.clearStencil();
  scene.add(cap);

  // Guías: círculos primitivos y línea de acción (en el plano frontal)
  const guides = new THREE.Group(); scene.add(guides); guides.position.z = 0.64;
  const lineMat = (c, dashed) => dashed ? new THREE.LineDashedMaterial({ color: c, dashSize: 0.12, gapSize: 0.08, depthTest: false }) : new THREE.LineBasicMaterial({ color: c, depthTest: false });
  const circ = (r, cx, c) => { const pts = []; for (let i = 0; i <= 120; i++) { const t = i / 120 * Math.PI * 2; pts.push(new THREE.Vector3(cx + r * Math.cos(t), r * Math.sin(t), 0)); } const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(c, true)); l.computeLineDistances(); l.renderOrder = 9; return l; };
  const ink = colorOf('--ink');
  guides.add(circ(o1.rp * S, -a / 2 * S, ink), circ(o2.rp * S, a / 2 * S, ink));
  const n = new THREE.Vector2(Math.cos(al), -Math.sin(al));
  const T1 = new THREE.Vector3(-a / 2 * S + o1.rb * S * n.x, o1.rb * S * n.y, 0), T2 = new THREE.Vector3(a / 2 * S - o2.rb * S * n.x, -o2.rb * S * n.y, 0);
  const loa = new THREE.Line(new THREE.BufferGeometry().setFromPoints([T1, T2]), lineMat(colorOf('--ok'), false)); loa.renderOrder = 9; guides.add(loa);
  const pp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), new THREE.MeshBasicMaterial({ color: colorOf('--ok'), depthTest: false })); pp.position.set(-a / 2 * S + o1.rp * S, 0, 0); pp.renderOrder = 9; guides.add(pp);
  // Diente destacado (contorno del diente 0 de la motriz)
  const toothPts = o1.pts.slice(0, 2 * 11 + 3 + 2).map((p) => new THREE.Vector3(p.x * S, p.y * S, 0));
  const tooth = new THREE.Line(new THREE.BufferGeometry().setFromPoints(toothPts), new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false }));
  tooth.renderOrder = 10; const toothG = new THREE.Group(); toothG.add(tooth); g1.add(toothG); toothG.position.z = 0.61;
  guides.visible = false; toothG.visible = false;

  const St = { spin: !reduced.matches, w: 0, th: 0, cut: 0, cutT: 0, step: 0 };
  const steps = [
    { name: 'Engranan', say: 'La rueda pequeña empuja diente a diente a la grande, que gira al revés y más despacio.', cut: 0, spin: true, guides: false, view: 'iso' },
    { name: 'Cortamos', say: 'Cortada por la mitad: la grande es una llanta con dientes unida al cubo por un alma delgada.', cut: 1, spin: false, guides: false, view: 'iso' },
    { name: 'Un diente', say: 'Cada diente tiene flancos curvos (evolvente): así empujan con un ángulo constante y el giro sale parejo.', cut: 0, spin: true, guides: true, view: 'mesh', slow: true },
    { name: 'Volvemos', say: 'Por cada 3 vueltas de la pequeña, la grande da 2: menos velocidad, más fuerza.', cut: 0, spin: true, guides: false, view: 'iso' },
  ];
  const syncPlay = () => { const b = $('#gear-play'); b.textContent = St.spin ? 'Pausar giro' : 'Girar'; b.setAttribute('aria-pressed', St.spin); };
  let camTo = null, tgtTo = null;
  const fit = () => Math.max(1, 19 / (Math.max(0.3, camera.aspect) * 10.5));
  function setView(k) {
    tgtTo = new THREE.Vector3(...targets[k]);
    camTo = k === 'mesh' ? new THREE.Vector3(...views.mesh).sub(tgtTo).multiplyScalar(Math.max(1, 1.1 / camera.aspect)).add(tgtTo) : new THREE.Vector3(...views[k]).multiplyScalar(fit()).add(new THREE.Vector3(0, targets[k][1], 0));
    if (reduced.matches) { camera.position.copy(camTo); controls.target.copy(tgtTo); camTo = tgtTo = null; } v.wake();
  }
  function setStep(k) {
    const s = steps[k]; St.step = k; St.cutT = s.cut; St.spin = s.spin && !reduced.matches; St.slow = !!s.slow;
    guides.visible = toothG.visible = s.guides; setView(s.view);
    $('#gear-cut').value = s.cut * 100; cutLabel(s.cut);
    if (reduced.matches) St.cut = St.cutT;
    $('#gear-stepname').textContent = `${k + 1} · ${s.name}`; $('#gear-say').textContent = s.say;
    $$('#gear-steps .btn').forEach((b, j) => b.setAttribute('aria-pressed', j === k));
    syncPlay(); v.wake();
  }
  const cutLabel = (x) => { $('#gear-cut-out').textContent = x < 0.01 ? 'sin corte' : x > 0.99 ? 'por el centro' : `${Math.round(x * 100)} %`; };
  $$('#gear-steps .btn').forEach((b) => b.addEventListener('click', () => setStep(+b.dataset.step)));
  $$('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  $('#gear-play').addEventListener('click', () => { St.spin = !St.spin; syncPlay(); v.wake(); });
  $('#gear-cut').addEventListener('input', (e) => { St.cutT = +e.target.value / 100; if (reduced.matches) St.cut = St.cutT; cutLabel(St.cutT); v.wake(); });
  controls.addEventListener('start', () => { camTo = tgtTo = null; });

  const fmt = window.VGE.fmt;
  v.onFrame = (dt) => {
    const want = St.spin ? (St.slow ? 0.35 : 0.9) : 0; const pw = St.w, pc = St.cut;
    St.w += (want - St.w) * (1 - Math.exp(-dt * 3)); if (!St.spin && St.w < 0.005) St.w = 0;
    St.th += St.w * dt;
    St.cut += (St.cutT - St.cut) * (reduced.matches ? 1 : 1 - Math.exp(-dt * 5)); if (Math.abs(St.cutT - St.cut) < 1e-3) St.cut = St.cutT;
    g1.rotation.z = St.th; g2.rotation.z = -St.th * z1 / z2;
    plane.constant = 3.4 - 3.4 * St.cut; cap.position.y = plane.constant; cap.visible = St.cut > 0.002;
    if (tgtTo) { controls.target.lerp(tgtTo, 1 - Math.exp(-dt * 5)); if (controls.target.distanceTo(tgtTo) < 0.005) { controls.target.copy(tgtTo); tgtTo = null; } }
    if (camTo) { camera.position.lerp(camTo, 1 - Math.exp(-dt * 5)); if (camera.position.distanceTo(camTo) < 0.01) camTo = null; }
    const n1 = St.th / (2 * Math.PI), n2 = n1 * z1 / z2;
    $('#gear-n1').textContent = `${fmt(n1, 2)} vueltas`; $('#gear-n2').textContent = `${fmt(n2, 2)} vueltas`;
    return St.w > 0 || St.cut !== pc || pw !== St.w || !!camTo || !!tgtTo;
  };
  setStep(0);
}

/* Arranque perezoso: cada escena se crea la primera vez que se abre su pestaña */
const inits = { anatomia: initFan, 'escena-3d': initGears }, done = {};
const boot = (id) => { if (inits[id] && !done[id]) { done[id] = true; try { inits[id](); } catch (e) { console.error(e); } document.dispatchEvent(new CustomEvent('vge:tab', { detail: id })); } };
document.addEventListener('vge:tab', (e) => boot(e.detail));
boot(window.VGE.active);
