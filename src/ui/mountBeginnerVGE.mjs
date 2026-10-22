import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {VGEEngine} from '../VGEEngine.mjs';
import {VGEGraphics,worldVisible} from '../graphics/VGEGraphics.mjs';
import {CoilPulse} from '../graphics/CoilPulse.mjs';
import {validateDocument} from '../validate.mjs';
import {defaultFactories} from '../factories.mjs';
import {validateGraphics} from '../graphics/validateGraphics.mjs';
import {createModelBadge,showError} from './status.mjs';
import {SignalDiagram} from './SignalDiagram.mjs';

const analogySVG=`<svg class="analogy" viewBox="0 0 360 214" role="img" aria-label="Dos personas representan los dos rollos: B empuja primero y A toma el siguiente turno">
 <defs><marker id="turn-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0 L6 3.5 L0 7" fill="#77d78f"/></marker></defs>
 <circle cx="180" cy="103" r="62" fill="#1d2025" stroke="#777" stroke-width="3"/><path d="M180 41 V165 M118 103 H242 M137 60 L223 146 M137 146 L223 60" stroke="#50545b" stroke-width="2"/><circle cx="180" cy="103" r="12" fill="#999"/>
 <g data-actor="a"><circle cx="53" cy="54" r="13" fill="#76bfff"/><path d="M54 77 V127 M54 88 L94 78 L120 95 M54 127 L34 159 M54 127 L76 159" fill="none" stroke="#76bfff" stroke-width="8" stroke-linecap="round"/><text x="52" y="188" text-anchor="middle" fill="#76bfff" font-size="15" font-weight="700">Bobina A</text><text x="52" y="207" text-anchor="middle" fill="#d0d3d9" font-size="11">Empuja después</text></g>
 <g data-actor="b"><circle cx="306" cy="54" r="13" fill="#ffa052"/><path d="M306 77 V127 M306 88 L271 119 L239 111 M306 127 L286 159 M306 127 L327 159" fill="none" stroke="#ffa052" stroke-width="8" stroke-linecap="round"/><text x="306" y="188" text-anchor="middle" fill="#ffa052" font-size="15" font-weight="700">Bobina B</text><text x="306" y="207" text-anchor="middle" fill="#d0d3d9" font-size="11">Empuja primero</text></g>
 <g data-actor="capacitor"><rect x="133" y="170" width="94" height="37" rx="8" fill="#393d44" stroke="#d8d9de"/><text x="180" y="193" text-anchor="middle" fill="#f0f0f3" font-size="11">Adelanta a B</text></g>
 <g data-actor="field"><path d="M144 78 A44 44 0 1 1 155 140" fill="none" stroke="#77d78f" stroke-width="6" marker-end="url(#turn-arrow)"/></g>
 <circle class="focus-first" cx="306" cy="54" r="20" fill="none" stroke="#fff" stroke-width="2"/>
</svg>`;

const staticMotorSVG=`<svg viewBox="0 0 360 270" role="img" aria-label="Dibujo fijo del motor: el rollo B naranja actúa primero y el A azul después. El imán invisible verde arrastra la pieza central gris y esta mueve las aspas." xmlns="http://www.w3.org/2000/svg">
 <rect x="1" y="1" width="358" height="268" rx="14" fill="#111318" stroke="#555962"/>
 <g fill="none" stroke-linecap="round" stroke-linejoin="round">
  <rect x="116" y="76" width="128" height="116" rx="24" fill="#292d34" stroke="#9b9da3" stroke-width="2"/>
  <path d="M135 111 Q180 82 226 111 M135 119 Q180 90 226 119" stroke="#ffa052" stroke-width="7"/>
  <path d="M135 155 Q180 184 226 155 M135 163 Q180 192 226 163" stroke="#76bfff" stroke-width="7"/>
  <ellipse cx="187" cy="137" rx="25" ry="37" fill="#9c9fa5" stroke="#e0e1e4" stroke-width="2"/>
  <path d="M194 137 H292" stroke="#c2c4c9" stroke-width="9"/>
  <path d="M294 136 C262 91 292 82 303 125 C345 111 351 140 307 146 C308 192 278 196 286 150 Z" fill="#737780" stroke="#e0e1e4" stroke-width="2"/>
  <path d="M166 96 A47 47 0 0 1 228 150 M216 142 L228 153 L232 136" stroke="#77d78f" stroke-width="4"/>
  <path d="M83 53 L123 92 M83 216 L126 170 M230 60 L195 100 M299 214 V175" stroke="#c5c7cd" stroke-width="1.5"/>
 </g>
 <g font-family="system-ui,sans-serif" font-size="18" font-weight="650">
  <text x="15" y="32" fill="#ffa052">Rollo B</text><text x="15" y="53" fill="#eceef3" font-size="16">Actúa primero</text>
  <text x="15" y="236" fill="#76bfff">Rollo A</text><text x="15" y="257" fill="#eceef3" font-size="16">Actúa después</text>
  <text x="230" y="32" text-anchor="middle" fill="#eceef3" font-size="16">Pieza que gira</text><text x="230" y="53" text-anchor="middle" fill="#eceef3" font-size="14">Mueve las aspas</text><text x="272" y="236" fill="#eceef3" font-size="17">Aspas</text><text x="260" y="257" fill="#eceef3" font-size="14">Mueven aire</text>
 </g>
</svg>`;

export function mountBeginnerVGE(host,data,{graphics,lesson,geometryFactories={},onOpen=null}={}){
 host.__vge?.dispose();host.__vge=null;
 const dom=host.ownerDocument,abort=new AbortController();
 let engine=null,effects=null,pulse=null,renderer=null,orbit=null,signals=null,story=0,level=1,technical=false,advanced=false,details=false,lastUI=-Infinity,rememberPlaying=true,renderError=null,modelStep=null;
 const definitions=new Map(data.entities.map(e=>[e.id,e])),parts=new Map(lesson.parts.map(p=>[p.id,p]));
 function releaseScene(){orbit?.dispose();if(engine)engine.dispose();else renderer?.dispose();engine=null;effects=null;pulse=null;renderer=null;orbit=null;signals=null;}
 const dispose=()=>{abort.abort();releaseScene();};
 try{
  validateDocument(data,{factories:{...defaultFactories,...geometryFactories}});validateGraphics(graphics,data);
  const bindings=data.parameters.flatMap(p=>p.bindings);
  for(const part of lesson.parts)if(!definitions.has(part.id))throw new Error(`La explicación menciona una pieza que falta: ${part.id}`);
  for(const signal of lesson.signals)if(!bindings.some(b=>b.id===signal.binding&&b.kind==='SINE'&&b.entity===signal.entity&&b.channel==='data.iNorm'))throw new Error(`Falta el movimiento compartido de ${signal.name}`);
  const shell=dom.createElement('article');shell.className='beginner';
  shell.innerHTML=`
   <header class="beginner-header"><div class="brand">VGE 2.0 <span>FASE 2</span></div><h1></h1><div class="rigor"><span class="badge-slot"></span><p></p></div><div class="level"><label for="vge-level">Nivel</label><select id="vge-level"><option value="1">Para todos</option><option value="2">Con nombres técnicos</option><option value="3">Con detalle avanzado</option></select></div></header>
   <section class="story-card"><nav class="story-progress" aria-label="Historia en cuatro pasos"></nav><p class="step-count"></p><h2 class="story-title"></h2><p class="story-text"></p><div class="analogy-slot">${analogySVG}</div>
    <div class="proof" hidden><div class="stage"><canvas aria-label="Motor: arrastra para girar la vista y toca una pieza para conocerla"></canvas><svg class="leaders" aria-hidden="true"></svg><div class="annotations"></div><button type="button" class="field-caption" data-term="field">El imán invisible da una vuelta <span>¿Qué es?</span></button><p class="stage-note">Las bobinas hacen de imán; no empujan con manos.</p></div><figure class="static-fallback" hidden>${staticMotorSVG}<figcaption>Esta vista es un dibujo fijo; puedes seguir la explicación y abrir sus detalles.</figcaption></figure><p class="push-now"></p><button type="button" class="play primary" data-action="play">Pausar movimiento</button></div>
    <div class="story-actions"><button type="button" data-action="back">Atrás</button><button type="button" data-action="story-next" class="primary"></button></div>
   </section>
   <div class="color-key"><p><i class="swatch a"></i><span><b>Azul:</b> el rollo A empuja después de B.</span></p><p><i class="swatch b"></i><span><b>Naranja:</b> el rollo B empuja primero.</span></p><p><i class="swatch field"></i><span><b>Verde:</b> el imán invisible cambia de dirección.</span></p></div>
   <div class="layer-buttons"><button type="button" data-action="technical" aria-expanded="false">Ver el nombre técnico</button><button type="button" data-action="advanced" aria-expanded="false">Saber más</button></div>
   <section class="layer-panel layer-two" hidden><h2>Lo mismo, con sus nombres</h2><p class="technical-text"></p><p class="scene-error" hidden></p><div class="signal-card" hidden><h3>El turno de A y el turno de B</h3><p>B llega antes al mismo punto de su curva; A llega después. La línea blanca marca ahora en ambas.</p><div class="wave-labels"><span class="ink-a">Bobina A (principal)</span><span class="ink-b">Bobina B (auxiliar)</span></div><svg class="waves" viewBox="0 0 360 152" role="img" aria-label="Dos ondas de electricidad: B se adelanta a A; la línea blanca marca el mismo instante que el brillo de los rollos"></svg><div class="wave-directions"><span>Arriba: un sentido</span><span>Abajo: sentido contrario</span></div><label for="vge-cursor">Mueve la línea blanca para elegir el instante</label><input type="range" id="vge-cursor" min="0" max="999" step="1" value="0" aria-valuetext="Inicio del ciclo"><p>Más lejos del centro de la gráfica = más brillo en ese rollo.</p><p class="signal-values"></p><p class="unit-note">Escala de ejemplo: 1 es el máximo elegido para A; 0 es el cambio de sentido. No son amperios medidos.</p></div></section>
   <section class="layer-panel layer-three" hidden><h2>Cómo se construye esta explicación</h2><p class="advanced-text"></p><div class="math-block"><p>El reloj común avanza θ; δ > 0 es el adelanto de B:</p><pre>i_A = sin(θ)
i_B = a · sin(θ + δ)
B* = (0, i_A, −i_B)</pre><p>i_A e i_B son señales de ejemplo; a es la amplitud relativa de B. B* es el vector de campo ilustrativo con ganancias iguales, sin unidades físicas.</p><p>La cajita (capacitor) adelanta la corriente de B respecto de A. Elegimos el eje positivo de B en −Z: con estas referencias la flecha y la pieza que gira avanzan hacia +X. El capacitor no es un temporizador; no deducimos δ de la capacidad de la cajita (capacitancia).</p><p class="parameter-values"></p></div><p>Las luces, el cursor y la flecha leen el mismo reloj. El brillo usa el valor absoluto de la señal, no luz ni calor reales.</p><p class="material-note">El gris distingue piezas neutras: algunas son de metal y otras, como la cajita, de plástico. La flecha verde es una ayuda para imaginar el campo. No se calculan fuerza, velocidad real, oposición al paso de la electricidad (impedancia), calentamiento ni cantidad de aire.</p><button type="button" class="open-json">Abrir otro modelo (archivo JSON)</button></section>
   <section class="explore" hidden><h2>Mira de cerca</h2><nav class="control-tabs" aria-label="Herramientas para explorar"><button type="button" data-view="select" aria-pressed="true">Piezas</button><button type="button" data-view="cut" aria-pressed="false">Ver dentro</button><button type="button" data-view="field" aria-pressed="false">Turnos</button></nav>
   <div class="controls" data-mode="select"><section class="control-card" data-panel="select"><label for="vge-step">Qué quieres mirar</label><select id="vge-step"></select><label for="vge-part">Toca una pieza o elige su nombre</label><select id="vge-part"></select><label for="vge-highlight">Resaltado</label><select id="vge-highlight"><option value="auto">Normal · se adapta al teléfono</option><option value="outline">Normal · borde blanco</option><option value="emissive">Ligero · pieza más clara</option></select><p class="selection-status"></p></section>
   <section class="control-card" data-panel="cut"><label for="vge-cut">Abrir una ventana para mirar dentro</label><input id="vge-cut" type="range" min="0" max="100" value="62"><div class="range-ends"><span>Cubierta completa</span><span>Interior visible</span></div><label for="vge-explode">Separar y volver a juntar las piezas</label><input id="vge-explode" type="range" min="0" max="100" step="any" value="0"><div class="range-ends"><span>Juntas</span><span>Separadas</span></div><p class="exploded-note">Separarlas sirve para mirar; el motor real funciona con sus piezas juntas.</p></section>
   <section class="control-card" data-panel="field"><label for="vge-phase">Separación entre los turnos de A y B</label><input id="vge-phase" type="range" min="0" max="180" step="any" value="90"><div class="range-ends"><span>Al mismo tiempo</span><span>En sentidos opuestos</span></div><p class="phase-description"></p><label class="check"><input id="vge-field" type="checkbox" checked><span>Mostrar el imán invisible</span></label></section></div></section>
   <details class="glossary"><summary>Glosario · toca una palabra</summary><p>La misma idea, explicada con un ejemplo.</p><div class="glossary-terms"></div></details>
   <p class="takeaway"><strong>Qué debes llevarte</strong><span>Dos bobinas actúan en momentos distintos. Su imán invisible hace girar la pieza central y las aspas.</span></p>
   <dialog class="term-dialog"><h2></h2><p class="common-meaning"></p><p class="technical-name" hidden></p><button type="button" data-action="close-term" class="primary">Entendido</button></dialog>`;
  const $=s=>shell.querySelector(s),$$=s=>[...shell.querySelectorAll(s)];
  $('h1').textContent=lesson.title;$('.badge-slot').append(createModelBadge(data.model,dom));$('.rigor p').textContent=lesson.scope;
  host.replaceChildren(shell);
  const listen=(element,event,callback)=>element.addEventListener(event,callback,{signal:abort.signal});
  for(let i=0;i<lesson.story.length;i++){const b=dom.createElement('button');b.type='button';b.textContent=String(i+1);b.setAttribute('aria-label',`Paso ${i+1}: ${lesson.story[i].title}`);listen(b,'click',()=>goStory(i));$('.story-progress').append(b);}
  for(const [index,step]of data.steps.entries()){const option=dom.createElement('option');option.value=String(index);option.textContent=step.title;$('#vge-step').append(option);}
  const phaseRange=data.parameters.find(p=>p.name==='phaseDeg').range;$('#vge-phase').min=phaseRange[0];$('#vge-phase').max=phaseRange[1];
  for(const p of lesson.parts){const o=dom.createElement('option');o.value=p.id;o.textContent=p.name;$('#vge-part').append(o);}
  for(const term of lesson.glossary){const b=dom.createElement('button');b.type='button';b.dataset.term=term.id;b.textContent=term.name;$('.glossary-terms').append(b);}
  const dialog=$('dialog');
  const openTerm=id=>{const term=lesson.glossary.find(t=>t.id===id);if(!term)return;dialog.querySelector('h2').textContent=term.name;dialog.querySelector('.common-meaning').textContent=term.meaning;dialog.querySelector('.technical-name').textContent=term.technical;dialog.querySelector('.technical-name').hidden=!technical;dialog.showModal();};
  listen(shell,'click',event=>{const term=event.target.closest('[data-term]');if(term)openTerm(term.dataset.term);});
  listen($('[data-action="close-term"]'),'click',()=>dialog.close());
  listen($('#vge-level'),'change',()=>{level=Number($('#vge-level').value);technical=level>=2;advanced=level>=3;updateLayers();});
  listen($('[data-action="technical"]'),'click',()=>{technical=!technical;updateLayers();});
  listen($('[data-action="advanced"]'),'click',()=>{advanced=!advanced;updateLayers();});
  listen($('[data-action="back"]'),'click',()=>goStory(Math.max(0,story-1)));
  listen($('[data-action="story-next"]'),'click',()=>{if(story<3)goStory(story+1);else if(renderError)goStory(0);else{details=!details;$('.explore').hidden=!details;updateStory();if(details)$('.explore').scrollIntoView({block:'nearest'});}});
  for(const button of $$('[data-view]'))listen(button,'click',()=>{$('.controls').dataset.mode=button.dataset.view;for(const b of $$('[data-view]'))b.setAttribute('aria-pressed',String(b===button));});
  const switchPart=id=>{engine.pause();engine.select(id||null);updateUI();};
  listen($('#vge-step'),'change',()=>engine?.setStep(Number($('#vge-step').value)));
  listen($('#vge-part'),'change',()=>switchPart($('#vge-part').value));
  listen($('#vge-highlight'),'change',()=>{effects?.setSelectionMode($('#vge-highlight').value);updateUI();});
  listen($('#vge-cut'),'input',()=>{effects?.setCut(Number($('#vge-cut').value)/100);updateUI();});
  listen($('#vge-explode'),'input',()=>{engine?.explode(Number($('#vge-explode').value)/100);updateUI();});
  listen($('#vge-phase'),'input',()=>{if(!engine)return;engine.setParam('phaseDeg',Number($('#vge-phase').value));updateUI();});
  listen($('#vge-field'),'change',()=>{effects?.setFieldVisible($('#vge-field').checked);updateUI();});
  listen($('#vge-cursor'),'input',()=>{if(!engine)return;engine.pause();engine.seekCycle(lesson.signals[0].binding,Number($('#vge-cursor').value)/1000);updateUI();});
  listen($('[data-action="play"]'),'click',()=>{engine.isPlaying?engine.pause():engine.play();updateUI();});
  if(onOpen)listen($('.open-json'),'click',onOpen);else $('.open-json').hidden=true;
  let labels=[];
  const vector=new THREE.Vector3();
  function syncPartOption(){
   const id=engine.selectedId??'';
   for(const option of [...$('#vge-part').options])if(option.dataset.current&&option.value!==id)option.remove();
   if(![...$('#vge-part').options].some(option=>option.value===id)){
    const option=dom.createElement('option');option.value=id;option.dataset.current='true';
    option.textContent=id?'Conjunto de piezas seleccionado':'Todo el conjunto';$('#vge-part').append(option);
   }
   $('#vge-part').value=id;
  }
  function makeLabels(){
   $('.annotations').replaceChildren();$('.leaders').replaceChildren();labels=[];
   const selected=parts.has(engine.selectedId)?engine.selectedId:'rotor_core';
   const ids=[selected,...(selected==='blades'?['rotor_core']:['blades'])];
   for(const[id,index]of ids.map((id,i)=>[id,i])){
    const p=parts.get(id),label=dom.createElement('button');label.type='button';label.className=`piece-label label-${index}`;label.dataset.term=p.term;
    const name=dom.createElement('strong'),fn=dom.createElement('span');name.textContent=technical?p.technical:p.name;fn.textContent=p.function;label.append(name,fn);$('.annotations').append(label);
    const path=dom.createElementNS('http://www.w3.org/2000/svg','path');$('.leaders').append(path);
    const dot=dom.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('r','3');$('.leaders').append(dot);
    labels.push({p,label,path,dot});
   }
  }
  function updateLabels(){
   if(!engine)return;engine.root.updateMatrixWorld(true);const stage=$('.stage').getBoundingClientRect();
   for(const{p,label,path,dot}of labels){
    const object=engine.getObject(p.id);label.hidden=!worldVisible(object);
    vector.fromArray(p.anchor).applyMatrix4(object.matrixWorld).project(engine.camera);
    const x=(vector.x+1)*stage.width/2,y=(1-vector.y)*stage.height/2,rect=label.getBoundingClientRect();
    const visible=!label.hidden&&vector.z>=-1&&vector.z<=1&&x>=0&&y>=0&&x<=stage.width&&y<=stage.height;
    path.style.display=dot.style.display=visible?'':'none';
    const sx=rect.left-stage.left+rect.width*.65,sy=rect.top-stage.top+rect.height;
    path.setAttribute('d',`M${sx},${sy} L${sx},${sy+8} L${x},${y}`);dot.setAttribute('cx',x);dot.setAttribute('cy',y);
   }
  }
  function updateUI(positionLabels=true){
   if(!engine)return;
   const field=effects.state.field,s=engine.state,a=field.sources[0].value,b=field.sources[1].value;
   const push=Math.abs(Math.abs(a)-Math.abs(b))<.04?'Ahora empujan parecido: A y B':`Ahora empuja más: Bobina ${Math.abs(a)>Math.abs(b)?'A':'B'}`;
   $('.push-now').textContent=push;
   $('[data-action="play"]').textContent=engine.isPlaying?'Pausar movimiento':'Reproducir movimiento';
   if($('#vge-part').value!==(engine.selectedId??'')){syncPartOption();makeLabels();}
   $('#vge-step').value=String(s.step);$('#vge-explode').value=s.exploded*100;$('#vge-phase').value=s.parameters.phaseDeg;
   $('#vge-explode').setAttribute('aria-valuetext',s.exploded===0?'Piezas juntas':s.exploded===1?'Piezas separadas para mirar':'Piezas parcialmente separadas');
   $('#vge-phase').setAttribute('aria-valuetext',s.parameters.phaseDeg===0?'Los dos turnos coinciden':s.parameters.phaseDeg===180?'Los turnos actúan en sentidos opuestos':'B empieza antes que A');
   $('.selection-status').textContent=effects.state.actualSelectionMode==='emissive'?'Ligero: la pieza elegida se aclara.':'Normal: un borde blanco señala la pieza elegida.';
   const fraction=signals.update();if(dom.activeElement!==$('#vge-cursor'))$('#vge-cursor').value=Math.round(fraction*1000);
   $('#vge-cursor').setAttribute('aria-valuetext',push);
   const format=n=>Math.abs(n)<.0005?'0.00':n.toFixed(2);
   $('.signal-values').textContent=`Bobina A (principal): ${format(a)} · Bobina B (auxiliar): ${format(b)}`;
   $('.parameter-values').textContent=`Separación ilustrativa δ: ${s.parameters.phaseDeg}° · amplitud relativa de B: ${s.parameters.auxAmplitude.toFixed(2)} · reloj eléctrico: ${s.parameters.frequencyHz} Hz, mostrado ${Math.round(1/s.parameters.slowMotion)} veces más lento.`;
   const pulsating=s.parameters.phaseDeg===0||s.parameters.phaseDeg===180;
   $('.phase-description').textContent=pulsating?(s.parameters.phaseDeg===0?'Juntas: el imán va y viene; por eso detenemos el giro del dibujo.':'En sentidos opuestos: el imán va y viene; el dibujo no gira.'):'B se adelanta a A: el imán invisible da vueltas.';
   $('.field-caption').hidden=!$('#vge-field').checked;
   $('.field-caption').firstChild.textContent=pulsating?'El imán invisible va y viene ':'El imán invisible da una vuelta ';
   $('.stage-note').textContent=s.exploded>0?'Separadas para mirar: un motor real funciona con sus piezas juntas.':'Las bobinas hacen de imán; no empujan con manos.';
   if(positionLabels)updateLabels();
  }
  function syncPhaseMotion(){
   if(!engine||engine.state.fault)return;
   const phase=engine.getParameter('phaseDeg'),freedom=phase===0||phase===180?0:1;
   if(engine.getParameter('rotorFreedom')!==freedom)engine.setParam('rotorFreedom',freedom);
  }
  function ensureEngine(){
   if(engine)return;
   const canvas=$('canvas'),context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
   if(!context)throw new Error('El navegador no ofrece WebGL 2 en esta vista.');
   renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true,powerPreference:'low-power'});renderer.setClearColor(0,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
   const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x333333,2.4));
   const light=new THREE.DirectionalLight(0xffffff,3.5);light.position.set(3,6,4);scene.add(light);
   const back=new THREE.DirectionalLight(0xffffff,1.5);back.position.set(-4,3,-3);scene.add(back);
   const render=renderer.render.bind(renderer);renderer.render=(scene,camera)=>{render(scene,camera);if(!effects||!signals)return;const now=performance.now();effects.observeFrame(now,engine.isPlaying);const labelsDue=now-lastUI>120;updateUI(labelsDue);if(labelsDue)lastUI=now;};
   engine=new VGEEngine(data,{renderer,scene,surface:canvas,ownsRenderer:true,geometryFactories,quality:'mobile',maxFps:30});
   effects=new VGEGraphics(engine,data,graphics,{renderer,maxFps:30});pulse=new CoilPulse(engine,lesson.signals);
   signals=new SignalDiagram(engine,lesson.signals,$('.waves'));
   orbit=new OrbitControls(engine.camera,canvas);orbit.enableDamping=false;orbit.enablePan=false;orbit.minDistance=3;orbit.maxDistance=18;orbit.target.fromArray(data.steps[0].camera.target);engine.camera.zoom=1.20;engine.camera.updateProjectionMatrix();orbit.update();orbit.addEventListener('change',()=>{engine.invalidate();updateLabels();});
   engine.addEventListener('selectionchange',()=>{syncPartOption();makeLabels();});
   engine.addEventListener('parameterchange',event=>{if(event.name==='phaseDeg')syncPhaseMotion();updateUI();});
   engine.addEventListener('explodechange',()=>updateUI());
   engine.addEventListener('faultchange',()=>{syncPhaseMotion();updateUI();});
   engine.addEventListener('stepchange',()=>{
    story=3;modelStep=engine.state.step;technical=level>=2;advanced=level>=3;
    orbit.target.fromArray(data.steps[modelStep].camera.target);orbit.update();
    syncPhaseMotion();updateStory();updateLayers();
   });
   syncPartOption();makeLabels();
   const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),meshes=data.entities.filter(e=>e.geometry).map(e=>engine.getMesh(e.id));let down=null;
   listen(canvas,'pointerdown',event=>down={x:event.clientX,y:event.clientY});
   listen(canvas,'pointerup',event=>{
    if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>7){down=null;return;}down=null;
    const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,engine.camera);
    const hit=ray.intersectObjects(meshes,false).find(h=>worldVisible(h.object)&&!effects.isClipped(h.object,h.point));if(!hit)return;
    let id=hit.object.userData.entityId;while(id!==null&&!parts.has(id))id=definitions.get(id).parent;
    if(id!==null)switchPart(id);
   });
   if(globalThis.matchMedia?.('(prefers-reduced-motion:reduce)').matches)rememberPlaying=false;
  }
  function updateLayers(){
   $('.layer-two').hidden=!technical;$('.layer-three').hidden=!advanced;
   $('[data-action="technical"]').setAttribute('aria-expanded',String(technical));$('[data-action="advanced"]').setAttribute('aria-expanded',String(advanced));
   $('[data-action="technical"]').textContent=technical?'Ocultar el nombre técnico':'Ver el nombre técnico';$('[data-action="advanced"]').textContent=advanced?'Cerrar detalle avanzado':'Saber más';
   for(const option of $('#vge-part').options){const p=parts.get(option.value);if(p)option.textContent=technical?p.technical:p.name;}
   if(engine){makeLabels();updateUI();engine.invalidate();}
  }
  function updateStory(){
   const s=lesson.story[story],view=story===3&&modelStep!==null?data.steps[modelStep]:s;
   $('.story-title').textContent=view.title;$('.story-text').textContent=view.text;$('.step-count').textContent=`Paso ${story+1} de 4`;
   $('.technical-text').textContent=s.technical;$('.advanced-text').textContent=s.advanced;
   $('[data-action="back"]').disabled=story===0;$('[data-action="story-next"]').textContent=story===3?(renderError?'Repetir la explicación':details?'Cerrar exploración':'Explorar las piezas'):s.next;
   for(const[b,i]of $$('.story-progress button').map((b,i)=>[b,i])){b.setAttribute('aria-current',i===story?'step':'false');}
   $('.analogy-slot').hidden=story===3;$('.proof').hidden=story!==3;$('.signal-card').hidden=story!==3||!!renderError;$('.math-block').hidden=story!==3;$('.explore').hidden=story!==3||!details||!!renderError;
   $('.stage').hidden=!!renderError;$('.static-fallback').hidden=story!==3||!renderError;$('.push-now').hidden=!!renderError;$('[data-action="play"]').hidden=!!renderError;
   $('.scene-error').hidden=!renderError;
   if(renderError)$('.scene-error').textContent=`No se pudo abrir el dibujo en movimiento (WebGL, la herramienta de gráficos 3D del navegador). Motivo: ${renderError.message}`;
   for(const actor of $$('[data-actor]')){
    actor.classList.toggle('actor-focus',actor.dataset.actor===s.focus);
    actor.style.display=(actor.dataset.actor==='capacitor'&&story!==1)||(actor.dataset.actor==='field'&&story!==2)?'none':'';
    for(const shape of actor.querySelectorAll('circle,path,rect'))shape.style.opacity=actor.dataset.actor===s.focus?'1':'.26';
   }
   $('.focus-first').style.display=story===0?'':'none';
  }
  function goStory(index){
   const resetView=index===3&&story!==3;
   if(engine&&story===3&&index!==3){rememberPlaying=engine.isPlaying;engine.pause();}
   story=index;modelStep=null;technical=level>=2;advanced=level>=3;updateStory();
   if(story===3&&!renderError){try{ensureEngine();if(resetView&&engine.state.step!==0)engine.setStep(0);modelStep=null;updateStory();if(rememberPlaying)engine.play();}catch(error){releaseScene();renderError=error;updateStory();}}
   updateLayers();
  }
  const handle={get engine(){return engine},get graphics(){return effects},get renderer(){return renderer},get pulse(){return pulse},dispose,goStory,get state(){return{story,level,technical,advanced,details,modelStep,renderMode:renderError?'static':'interactive',modelKind:data.model.kind,engine:engine?.state,graphics:effects?.state}}};
  host.__vge=handle;goStory(0);return handle;
 }catch(error){dispose();showError(host,error,onOpen);return{error,dispose(){}};}
}
