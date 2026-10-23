import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VGEEngine } from '../VGEEngine.mjs';
import { validateDocument } from '../validate.mjs';
import { defaultFactories } from '../factories.mjs';
import { VGEGraphics, worldVisible } from '../graphics/VGEGraphics.mjs';
import { defaultGraphics, validateGraphics } from '../graphics/validateGraphics.mjs';
import { createModelBadge, showError } from './status.mjs';
import { validateLesson } from './validateLesson.mjs';

export function mountVGE(host, data, { graphics = defaultGraphics, lesson, geometryFactories = {}, onOpen = null } = {}) {
  host.__vge?.dispose(); host.__vge = null;
  let engine, effects, renderer, controls, abort;
  const removers=[];
  const dom = host.ownerDocument;
  const dispose = () => { abort?.abort(); removers.splice(0).forEach(fn=>fn()); controls?.dispose(); if (engine) engine.dispose(); else renderer?.dispose(); };
  try {
    validateDocument(data, { factories: { ...defaultFactories, ...geometryFactories } });
    validateGraphics(graphics, data);
    validateLesson(lesson,data);
    if(lesson.layout!=='steps')throw new Error('Lección VGE inválida: el visor genérico requiere layout steps.');
    const parts=new Map(lesson.parts.map(p=>[p.id,p]));
    const badge = createModelBadge(data.model, dom);
    const shell = dom.createElement('article'); shell.className = 'viewer';
    shell.innerHTML = `
      <header class="viewer-header">
        <div class="eyebrow">VGE <span>Explora paso a paso</span></div>
        <div class="title-row"><h1></h1><span class="badge-slot"></span></div>
        <p class="subtitle"></p>
        <p class="common-intro"></p>
        <div class="level"><label for="vge-level">Nivel</label><select id="vge-level"><option value="1">Para todos</option><option value="2">Con nombres técnicos</option><option value="3">Con detalle avanzado</option></select></div>
      </header>
      <div class="workspace">
        <div class="visual-column">
          <h2 class="step-title"></h2><p class="step-text"></p><p class="value-readout" hidden></p>
          <div class="stage">
            <canvas aria-label="Modelo tridimensional: arrastra para girar y toca una pieza para seleccionarla"></canvas>
            <svg class="annotation-line" aria-hidden="true"><path/><circle r="3.5"/></svg>
            <div class="annotation" hidden><strong></strong><span></span></div>
            <div class="stage-note">Giro y campo en cámara lenta</div>
          </div>
          <p class="fallback-note" hidden>La vista 3D no está disponible; puedes seguir los pasos y la explicación.</p>
          <div class="legend"></div>
          <div class="transport"><button type="button" data-action="prev" aria-label="Paso anterior">←</button><button type="button" data-action="play" class="play">Animar</button><button type="button" data-action="next" aria-label="Paso siguiente">→</button><span class="step-index"></span></div>
          <div class="layer-buttons"><button type="button" data-action="technical" aria-expanded="false">Ver el nombre técnico</button><button type="button" data-action="advanced" aria-expanded="false">Saber más</button></div>
          <section class="layer-panel layer-two" hidden><h2>Lo mismo, con sus nombres</h2><p class="technical-text"></p><p class="signal-values" hidden></p></section>
          <section class="layer-panel layer-three" hidden><h2>Detalle y límites</h2><p class="advanced-text"></p><p class="model-scope"></p><button class="open-json" type="button">Abrir otro modelo (archivo JSON)</button></section>
        </div>
        <div class="controls" data-mode="cut">
          <nav class="control-tabs" aria-label="Controles del visual"><button type="button" data-view="cut" aria-pressed="true">Ver dentro</button><button type="button" data-view="select" aria-pressed="false">Partes</button><button type="button" data-view="field" aria-pressed="false">Señales</button></nav>
          <section class="control-card" data-panel="cut"><div class="control-title"><label for="vge-cut">Corte del exterior</label><output for="vge-cut" id="cut-value">50 %</output></div><input id="vge-cut" type="range" min="0" max="100" step="1"><p class="cut-description"></p></section>
          <section class="control-card" data-panel="select"><label for="vge-part">Toca una parte o elige su nombre</label><select id="vge-part"></select><div class="selection-settings"><label for="vge-highlight">Resaltado</label><select id="vge-highlight"><option value="auto">Normal · se adapta</option><option value="outline">Normal · borde blanco</option><option value="emissive">Ligero · parte más clara</option></select></div><p class="selection-status"></p></section>
          <section class="control-card" data-panel="cut"><div class="control-title"><label for="vge-explode">Separar piezas</label><output for="vge-explode" id="explode-value">0 %</output></div><input id="vge-explode" type="range" min="0" max="100" step="1"><p>Juntas → separadas para verlas mejor</p></section>
          <section class="control-card field-card" data-panel="field"><div class="control-title"><label for="vge-phase">Desfase de corrientes</label><output for="vge-phase" id="phase-value">60°</output></div><input id="vge-phase" type="range" min="0" max="180" step="1"><label class="check"><input id="vge-field" type="checkbox" checked> Mostrar flechas del campo</label><p>La flecha resultante suma las componentes normalizadas.</p></section>
        </div>
      </div>
      <details class="glossary generic-glossary"><summary>Glosario · toca una palabra</summary><div class="glossary-terms"></div></details>
      <footer class="model-footer"><p class="scope"></p><p class="takeaway"><strong>Qué debes llevarte</strong><span></span></p></footer>
    `;
    shell.querySelector('h1').textContent = lesson.title;
    shell.querySelector('.badge-slot').append(badge);
    shell.querySelector('.scope').textContent = lesson.scope;
    shell.querySelector('.model-scope').textContent = data.model.scope;
    shell.querySelector('.subtitle').textContent = lesson.scope;
    shell.querySelector('.scope').hidden=true;
    shell.querySelector('.common-intro').textContent=lesson.intro;
    shell.querySelector('.takeaway span').textContent = lesson.takeaway??'Recorre los pasos y observa cómo contribuye cada parte.';
    for(const term of lesson.glossary){
      const detail=dom.createElement('details'),summary=dom.createElement('summary'),common=dom.createElement('p'),technical=dom.createElement('p');
      summary.textContent=term.name;common.textContent=term.meaning;technical.textContent=term.technical;technical.className='technical-name';technical.hidden=true;
      detail.append(summary,common,technical);shell.querySelector('.glossary-terms').append(detail);
    }
    host.replaceChildren(shell);
    const canvas = shell.querySelector('canvas'), stage = shell.querySelector('.stage');
    let context=null;try{context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'})}catch{}
    if(context){
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setClearColor(0x000000, 0); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    }else{stage.hidden=true;shell.querySelector('.fallback-note').hidden=false;}
    const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xdceaff, 0x30384c, 2.6));
    const key = new THREE.DirectionalLight(0xfff2de, 3.5); key.position.set(3, 6, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0x8fb6ff, 2); rim.position.set(-4, 3, -3); scene.add(rim);
    const render = renderer?.render.bind(renderer); let lastLabelTime = -Infinity;
    if(renderer)renderer.render = (s, camera) => {
      render(s, camera); if (!engine || !effects) return;
      const now = performance.now(); effects.observeFrame(now, engine.isPlaying);
      if (now - lastLabelTime > 120) { updateLabels(); lastLabelTime = now; }
    };
    engine = new VGEEngine(data, { renderer, scene, surface: renderer?canvas:null, ownsRenderer: Boolean(renderer), geometryFactories, quality: 'mobile', maxFps: 30 });
    effects = new VGEGraphics(engine, data, graphics, { renderer, maxFps: 30 });
    controls = renderer?new OrbitControls(engine.camera, canvas):{target:new THREE.Vector3(),update(){},addEventListener(){},dispose(){}}; controls.enableDamping = false; controls.enablePan = false;
    engine.camera.zoom = 1.18; engine.camera.updateProjectionMatrix();
    controls.minDistance = 2.8; controls.maxDistance = 18;
    controls.target.fromArray(data.steps[0].camera.target); controls.update();
    controls.addEventListener('change', () => engine.invalidate());
    abort = new AbortController(); const listen = (element, event, callback) => element.addEventListener(event, callback, { signal: abort.signal });
    let level=1,technical=false,advanced=false,lastStep=-1;
    const updateLayers=()=>{
      shell.querySelector('.layer-two').hidden=!technical;shell.querySelector('.layer-three').hidden=!advanced;
      shell.querySelector('[data-action="technical"]').setAttribute('aria-expanded',String(technical));
      shell.querySelector('[data-action="advanced"]').setAttribute('aria-expanded',String(advanced));
      for(const name of shell.querySelectorAll('.technical-name'))name.hidden=!technical;
      shell.querySelector('[data-view="field"]').hidden=!graphics.field||!technical;
      if(!technical&&shell.querySelector('.controls').dataset.mode==='field'){
        shell.querySelector('.controls').dataset.mode='select';
        for(const b of shell.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view==='select'));
      }
    };
    listen(shell.querySelector('#vge-level'),'change',()=>{level=Number(shell.querySelector('#vge-level').value);technical=level>=2;advanced=level>=3;updateLayers();updateLabels()});
    listen(shell.querySelector('[data-action="technical"]'),'click',()=>{technical=!technical;updateLayers();updateLabels()});
    listen(shell.querySelector('[data-action="advanced"]'),'click',()=>{advanced=!advanced;updateLayers();updateLabels()});
    for (const button of shell.querySelectorAll('[data-view]')) listen(button, 'click', () => {
      shell.querySelector('.controls').dataset.mode = button.dataset.view;
      for (const item of shell.querySelectorAll('[data-view]')) item.setAttribute('aria-pressed', String(item === button));
    });
    const part = shell.querySelector('#vge-part'), cut = shell.querySelector('#vge-cut'), explode = shell.querySelector('#vge-explode');
    const phase = shell.querySelector('#vge-phase'), mode = shell.querySelector('#vge-highlight'), fieldCheck = shell.querySelector('#vge-field');
    const definitions = new Map(data.entities.map(e => [e.id, e]));
    const none = dom.createElement('option'); none.value = ''; none.textContent = 'Sistema completo · sin selección'; part.append(none);
    for (const entity of data.entities) if (entity.selectable !== false) { const option = dom.createElement('option'); option.value = entity.id; option.textContent = parts.get(entity.id)?.name??'Parte del dibujo'; part.append(option); }
    cut.disabled = !graphics.clipping; cut.value = String(effects.state.amount * 100);
    shell.querySelector('.cut-description').textContent = graphics.clipping?.description ?? 'Este modelo no solicita un corte.';
    if (graphics.clipping) shell.querySelector('label[for="vge-cut"]').textContent = graphics.clipping.label;
    const phaseName = data.parameters.flatMap(p => p.bindings).find(b => graphics.field?.sources.some(s => s.entity === b.entity) && b.phaseParameter)?.phaseParameter;
    const phaseParam = data.parameters.find(p => p.name === phaseName);
    if (phaseParam) { phase.min = String(phaseParam.range[0]); phase.max = String(phaseParam.range[1]); }
    else shell.querySelector('.field-card').hidden = true;
    if (!graphics.field) {
      shell.querySelector('.field-card').hidden = true; shell.querySelector('[data-view="field"]').hidden = true;
      shell.querySelector('.signal-values').hidden = true;
    }
    shell.querySelector('.stage-note').textContent=lesson.stageNote??'Arrastra para girar la vista; toca una parte para conocerla.';
    for (const source of lesson.legend??[]) {
      const item = dom.createElement('span'), swatch = dom.createElement('i'); swatch.style.background = source.color;
      item.append(swatch, dom.createTextNode(source.text)); shell.querySelector('.legend').append(item);
    }
    if (!graphics.clipping) {
      shell.querySelector('[data-view="cut"]').hidden = true; shell.querySelector('.controls').dataset.mode = 'select';
      for (const item of shell.querySelectorAll('[data-view]')) item.setAttribute('aria-pressed', String(item.dataset.view === 'select'));
    }
    fieldCheck.checked = graphics.field?.visible ?? false; mode.value = graphics.selection.mode;
    listen(part, 'change', () => { engine.select(part.value || null); updateLabels(); });
    listen(cut, 'input', () => { effects.setCut(Number(cut.value) / 100); updateLabels(); });
    listen(explode, 'input', () => { engine.explode(Number(explode.value) / 100); updateLabels(); });
    listen(phase, 'input', () => { engine.setParam(phaseName, Number(phase.value)); updateLabels(); });
    listen(mode, 'change', () => { effects.setSelectionMode(mode.value); updateLabels(); });
    listen(fieldCheck, 'change', () => { effects.setFieldVisible(fieldCheck.checked); updateLabels(); });
    const previous = shell.querySelector('[data-action="prev"]'), next = shell.querySelector('[data-action="next"]'), play = shell.querySelector('[data-action="play"]');
    const go = delta => { const n = engine.state.step + delta; if (n < 0 || n >= data.steps.length) return; engine.setStep(n); controls.target.fromArray(data.steps[n].camera.target); controls.update(); updateLabels(); };
    listen(previous, 'click', () => go(-1)); listen(next, 'click', () => go(1));
    listen(play, 'click', () => { engine.isPlaying ? engine.pause() : engine.play(); updateLabels(); });
    if (onOpen) listen(shell.querySelector('.open-json'), 'click', onOpen); else shell.querySelector('.open-json').hidden = true;
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(); let down = null;
    const meshes = data.entities.filter(e => e.geometry).map(e => engine.getMesh(e.id));
    listen(canvas, 'pointerdown', event => down = { x: event.clientX, y: event.clientY });
    listen(canvas, 'pointerup', event => {
      if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 7) { down = null; return; }
      down = null; const rect = canvas.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      engine.root.updateMatrixWorld(true); raycaster.setFromCamera(pointer, engine.camera);
      const hit = raycaster.intersectObjects(meshes, false).find(hit => worldVisible(hit.object) && !effects.isClipped(hit.object, hit.point));
      if (!hit) return;
      let id = hit.object.userData.entityId; while (id !== null && definitions.get(id).selectable === false) id = definitions.get(id).parent;
      if (id !== null) { engine.select(id); updateLabels(); }
    });
    const annotation = shell.querySelector('.annotation'), path = shell.querySelector('.annotation-line path'), dot = shell.querySelector('.annotation-line circle');
    const center = new THREE.Vector3(), projected = new THREE.Vector3(), box = new THREE.Box3(); let annotated = undefined;
    function updateLabels() {
      const state = engine.state, graphicState = effects.state;
      shell.querySelector('#cut-value').textContent = `${Math.round(graphicState.amount * 100)} %`;
      shell.querySelector('#explode-value').textContent = `${Math.round(state.exploded * 100)} %`; explode.value = String(Math.round(state.exploded * 100));
      if (phaseParam) { phase.value = String(state.parameters[phaseName]); shell.querySelector('#phase-value').textContent = `${state.parameters[phaseName]}${phaseParam.unit}`; }
      part.value = state.selected ?? ''; previous.disabled = state.step === 0; next.disabled = state.step === data.steps.length - 1;
      play.textContent = state.playing ? 'Pausar' : 'Animar';
      shell.querySelector('.step-index').textContent = `${String(state.step + 1).padStart(2, '0')} / ${String(data.steps.length).padStart(2, '0')}`;
      if(lastStep!==state.step){lastStep=state.step;technical=level>=2;advanced=level>=3;updateLayers()}
      const step=lesson.story[state.step];
      shell.querySelector('.step-title').textContent=step.title;
      shell.querySelector('.step-text').textContent=step.text;
      shell.querySelector('.technical-text').textContent=step.technical;
      shell.querySelector('.advanced-text').textContent=step.advanced;
      const currentPart=parts.get(state.selected);
      shell.querySelector('.selection-status').textContent = `Resaltado: ${graphicState.actualSelectionMode === 'outline' ? 'normal' : 'ligero'}${graphicState.selectionMode === 'auto' ? ' · se adapta' : ''}${!renderer&&currentPart?' · '+currentPart.name+': '+currentPart.function:''}`;
      if(lesson.readout){
        const r=lesson.readout,values=engine.getObject(r.entity).userData.data[r.dataKey],readout=shell.querySelector('.value-readout');
        readout.hidden=false;readout.textContent=r.label+': '+values.join(' · ');
      }
      if (graphicState.field) shell.querySelector('.signal-values').textContent = graphicState.field.sources.map((s,i) => `${graphics.field.sources[i].label} ${s.value.toFixed(2)}`).join('  ·  ') + `  ·  Σ ${graphicState.field.magnitude.toFixed(2)} (normalizados)`;
      annotation.hidden = state.selected === null; path.style.display = dot.style.display = state.selected === null ? 'none' : '';
      if (state.selected !== null) {
        const object = engine.getObject(state.selected), entity = definitions.get(state.selected);
        if (annotated !== state.selected) {
          object.updateWorldMatrix(true, true); box.setFromObject(object); box.getCenter(center); object.worldToLocal(center); annotated = state.selected;
        }
        annotation.querySelector('strong').textContent=technical?(currentPart?.technical??'Parte del dibujo'):(currentPart?.name??'Parte del dibujo');
        annotation.querySelector('span').textContent=currentPart?.function??'Su función no está descrita en esta lección.';
        object.updateWorldMatrix(true, false); projected.copy(center).applyMatrix4(object.matrixWorld).project(engine.camera);
        const rect = stage.getBoundingClientRect(), labelRect = annotation.getBoundingClientRect();
        const x = (projected.x + 1) * rect.width / 2, y = (1 - projected.y) * rect.height / 2;
        const sx = labelRect.left - rect.left + labelRect.width * 0.72, sy = labelRect.bottom - rect.top;
        const onScreen = projected.z >= -1 && projected.z <= 1 && x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
        path.style.display = dot.style.display = onScreen ? '' : 'none';
        path.setAttribute('d', `M${sx},${sy + 2} L${sx},${sy + 12} L${x},${y}`); dot.setAttribute('cx', String(x)); dot.setAttribute('cy', String(y));
      } else annotated = undefined;
    }
    for(const type of ['stepchange','selectionchange','parameterchange','explodechange','faultchange']){
      engine.addEventListener(type,updateLabels);removers.push(()=>engine.removeEventListener(type,updateLabels));
    }
    if (graphics.selection.initialEntity) engine.select(graphics.selection.initialEntity);
    if (!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) engine.play();
    updateLabels();
    const handle = { engine, graphics: effects, renderer, controls, dispose, get state() { return { modelKind: data.model.kind, engine: engine.state, graphics: effects.state }; } };
    host.__vge = handle; return handle;
  } catch (error) { dispose(); showError(host, error, onOpen); return { error, dispose() {} }; }
}
