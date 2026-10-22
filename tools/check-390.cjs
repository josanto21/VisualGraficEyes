/* Revisión puntual de esta corrección; no es la matriz de Fase 5. */
const {chromium}=require(process.env.VGE_PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.VGE_QA_DIR || path.join(root,'qa'));
const near=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({...(process.env.VGE_CHROME_PATH?{executablePath:process.env.VGE_CHROME_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});const errors=[],requests=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  const mark=s=>{checks.push(s);console.log('✓ '+s)};
  const targets=async context=>{
   const result=await page.evaluate(()=>{
    const controls=[...document.querySelectorAll('button,input,select,summary,a')].filter(e=>e.getClientRects().length&&!e.disabled);
    const sizes=controls.map(e=>{const target=e.matches('input[type=checkbox]')?e.closest('label')||e:e,r=target.getBoundingClientRect();return{element:e.id||e.dataset.action||e.textContent.trim().slice(0,45)||e.tagName,width:r.width,height:r.height}});
    return{overflow:document.documentElement.scrollWidth>innerWidth,bad:sizes.filter(r=>r.width<43.99||r.height<43.99),count:sizes.length};
   });assert.equal(result.overflow,false,context+' tiene desbordamiento');assert.deepEqual(result.bad,[],context+' tiene controles pequeños');return result.count;
  };
  const setRange=async(id,value)=>page.locator(id).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}))},value);
  const screenshot=async name=>{await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(140);await page.screenshot({path:path.join(out,name),fullPage:true})};
  await page.goto('file://'+path.join(root,'dist/index.html'));await page.waitForFunction(()=>window.VGEDemo?.current);
  assert.equal(await page.locator('#vge-level').inputValue(),'1');assert.equal(await page.locator('.layer-two').isVisible(),false);assert.equal(await page.locator('.layer-three').isVisible(),false);assert.equal(await page.evaluate(()=>VGEDemo.current.engine),null);
  await targets('Inicio');await screenshot('despues-inicio-390.png');mark('Inicio en capa 1, pregunta y analogía antes de crear WebGL');
  for(let i=0;i<4;i++){
   assert.equal(await page.locator('.step-count').textContent(),`Paso ${i+1} de 4`);
   assert.doesNotMatch(await page.locator('body').innerText(),/\bPSC\b|\bestator\b|\brotor\b|emisiv|senoide|normaliz|Σ/iu);
   assert.ok(await page.locator('.story-text').isVisible());
   if(i===0){assert.match(await page.locator('.story-text').textContent(),/B empuja primero y A después/);assert.equal(await page.locator('[data-actor=b]').getAttribute('class'),'actor-focus');}
   if(i===1)assert.match(await page.locator('.story-text').textContent(),/la que adelanta a B/);
   await targets('Historia '+i);
   if(i===1)await screenshot('despues-relevo-390.png');
   if(i<3)await page.locator('[data-action="story-next"]').click();
  }
  await page.waitForFunction(()=>VGEDemo.current.engine);await page.evaluate(()=>{VGEDemo.current.engine.pause().seekCycle('mainCurrent',.10)});await screenshot('despues-comun-390.png');mark('Cuatro pasos, máximo dos frases por paso y lenguaje común sin jerga visible');
  await page.selectOption('#vge-level','2');assert.ok(await page.locator('.story-text').isVisible());assert.ok(await page.locator('.layer-two').isVisible());assert.equal(await page.locator('.layer-three').isVisible(),false);await targets('Capa técnica');
  await screenshot('despues-tecnico-390.png');mark('Nivel técnico conserva la explicación común y añade nombres, ondas y escala explicada');
  for(const[f,a,b]of [[0,0,1],[.25,1,0],[.5,0,-1],[.75,-1,0]]){
   await setRange('#vge-cursor',f*1000);
   const value=await page.evaluate(()=>{const h=VGEDemo.current,c=[...document.querySelectorAll('.waves circle')];return{a:h.engine.getObject('main_winding').userData.data.iNorm,b:h.engine.getObject('aux_winding').userData.data.iNorm,field:h.graphics.state.field.vector,x:Number(c[0].getAttribute('cx')),y:c.map(e=>Number(e.getAttribute('cy'))),pulse:[h.engine.getMesh('main_winding_pack0_turn0').material.emissive,h.engine.getMesh('aux_winding_pack0_turn0').material.emissive].map(c=>Math.max(c.r,c.g,c.b)),push:document.querySelector('.push-now').textContent}});
   near(value.a,a);near(value.b,b);near(value.field[1],a);near(value.field[2],-b);near(value.x,22+316*f);near(value.y[0],76-43*a);near(value.y[1],76-43*b);assert.ok(value.push.includes(Math.abs(a)>Math.abs(b)?'A':'B'));assert.ok(Math.abs(a)>Math.abs(b)?value.pulse[0]>value.pulse[1]:value.pulse[1]>value.pulse[0]);
  }mark('El mismo cursor actualiza ondas, texto, brillo de A/B y vector del campo en cuatro instantes conocidos');
  const direction=await page.evaluate(()=>{
   const h=VGEDemo.current,e=h.engine;
   const lead=[30,60,90].map(delta=>{e.setParam('phaseDeg',delta).seekCycle('mainCurrent',.25-delta/360);const bPeak={a:e.getObject('main_winding').userData.data.iNorm,b:e.getObject('aux_winding').userData.data.iNorm};e.seekCycle('mainCurrent',.25);return{delta,bPeak,aPeak:{a:e.getObject('main_winding').userData.data.iNorm,b:e.getObject('aux_winding').userData.data.iNorm}}});
   e.setParam('phaseDeg',90).seekCycle('mainCurrent',.1);const before=h.graphics.state.field.vector,rotor=e.getObject('rotor').rotation.x,blades=e.getObject('blades').rotation.x;e.advance(.02);const after=h.graphics.state.field.vector;
   return{lead,fieldTurn:Math.atan2(after[2],after[1])-Math.atan2(before[2],before[1]),rotorTurn:e.getObject('rotor').rotation.x-rotor,bladesTurn:e.getObject('blades').rotation.x-blades};
  });
  for(const row of direction.lead){near(row.bPeak.b,1);assert.ok(row.bPeak.a<1);near(row.aPeak.a,1);assert.ok(row.aPeak.b<1);}
  assert.ok(direction.fieldTurn>0&&direction.rotorTurn>0);near(direction.rotorTurn,direction.bladesTurn);mark('B alcanza su máximo antes que A a 30/60/90 grados; flecha, pieza central y aspas giran en el mismo sentido');
  await page.selectOption('#vge-level','3');assert.ok(await page.locator('.story-text').isVisible());assert.ok(await page.locator('.layer-two').isVisible());assert.ok(await page.locator('.layer-three').isVisible());await targets('Capa avanzada');await setRange('#vge-cursor',100);await screenshot('despues-avanzado-390.png');mark('Nivel avanzado añade fórmulas, convención de signos y límites, sin ocultar la capa común');
  await page.locator('[data-action="technical"]').click();assert.equal(await page.locator('.layer-two').isVisible(),false);await page.locator('[data-action="back"]').click();assert.ok(await page.locator('.layer-two').isVisible());assert.ok(await page.locator('.layer-three').isVisible());await page.selectOption('#vge-level','1');await page.locator('[data-action="story-next"]').click();assert.equal(await page.locator('.layer-two').isVisible(),false);assert.equal(await page.locator('.layer-three').isVisible(),false);mark('Nivel controla la capa por defecto de cada escena y las capas se pueden abrir con un toque');
  await page.locator('[data-action="story-next"]').click();
  for(const id of ['main_winding','aux_winding','capacitor','rotor_core','blades','stator','shaft_part']){
   await page.selectOption('#vge-part',id);assert.equal(await page.evaluate(()=>VGEDemo.current.engine.selectedId),id);assert.equal(await page.locator('.piece-label').count(),2);await targets('Pieza '+id);if(['main_winding','aux_winding','capacitor'].includes(id))await screenshot(`pieza-${id}-390.png`);assert.ok((await page.locator('.piece-label.label-0 strong').textContent()).length>0);
  }mark('Siete piezas tienen nombre común, función y conexión gráfica; dos etiquetas como máximo');
  await page.selectOption('#vge-part','rotor_core');await page.selectOption('#vge-highlight','outline');assert.equal(await page.evaluate(()=>VGEDemo.current.graphics.stats.visibleOutlines),1);
  await page.selectOption('#vge-highlight','emissive');const light=await page.evaluate(()=>({selected:VGEDemo.current.engine.getMesh('rotor_core').material.emissive.toArray(),other:VGEDemo.current.engine.getMesh('shaft_part').material.emissive.toArray(),outlines:VGEDemo.current.graphics.stats.visibleOutlines}));assert.ok(light.selected.some(x=>x>0));assert.deepEqual(light.other,[0,0,0]);assert.equal(light.outlines,0);mark('Resaltado normal exclusivo y respaldo ligero sin aclarar otras piezas');
  await page.locator('[data-view="cut"]').click();await targets('Corte');
  const hashes=[];
  for(const amount of [0,100]){await setRange('#vge-cut',amount);const bytes=await page.locator('.stage').screenshot();hashes.push(crypto.createHash('sha256').update(bytes).digest('hex'));}assert.notEqual(hashes[0],hashes[1]);await setRange('#vge-cut',62);
  await setRange('#vge-explode',100);near(await page.evaluate(()=>VGEDemo.current.engine.state.exploded),1);assert.match(await page.locator('.stage-note').innerText(),/piezas juntas/);await setRange('#vge-explode',0);mark('Corte real y separación/rearmado sin perder piezas ni explicación');
  await page.locator('[data-view="field"]').click();await targets('Turnos');await setRange('#vge-phase',0);assert.equal(await page.evaluate(()=>VGEDemo.current.engine.getParameter('rotorFreedom')),0);assert.match(await page.locator('.phase-description').innerText(),/va y viene/);await setRange('#vge-phase',90);assert.equal(await page.evaluate(()=>VGEDemo.current.engine.getParameter('rotorFreedom')),1);mark('Los turnos juntos muestran un campo pulsante y detienen el giro ilustrativo');
  await page.locator('.glossary summary').click();await targets('Glosario');await page.locator('.glossary-terms [data-term="bobina"]').click();assert.ok(await page.locator('dialog').isVisible());assert.match(await page.locator('.common-meaning').textContent(),/carrete/);await targets('Definición');await page.locator('[data-action="close-term"]').click();mark('Glosario tocable con analogías y controles de al menos 44 px');
  await page.locator('.stage').scrollIntoViewIfNeeded();await page.evaluate(()=>{VGEDemo.current.engine.play()});await page.waitForTimeout(120);const first=await page.evaluate(()=>VGEDemo.current.engine.getBindingState('mainCurrent').phase);await page.waitForTimeout(230);const second=await page.evaluate(()=>VGEDemo.current.engine.getBindingState('mainCurrent').phase);assert.notEqual(first,second);
  await page.evaluate(()=>VGEDemo.current.engine.pause());await page.waitForTimeout(120);const frozen=await page.evaluate(()=>({frame:VGEDemo.current.renderer.info.render.frame,field:VGEDemo.current.graphics.state.field.vector}));await page.waitForTimeout(250);assert.deepEqual(await page.evaluate(()=>({frame:VGEDemo.current.renderer.info.render.frame,field:VGEDemo.current.graphics.state.field.vector})),frozen);mark('Movimiento observado; pausa congela dibujo, campo y reloj sin seguir dibujando');
  await page.evaluate(()=>VGEDemo.current.goStory(0));await page.waitForTimeout(100);const frame=await page.evaluate(()=>VGEDemo.current.renderer.info.render.frame);await page.waitForTimeout(220);assert.equal(await page.evaluate(()=>VGEDemo.current.renderer.info.render.frame),frame);mark('Al ocultar la escena no se sigue dibujando');
  await page.setViewportSize({width:320,height:844});await targets('Inicio 320 px');await page.evaluate(()=>VGEDemo.current.goStory(3));await page.selectOption('#vge-level','3');await targets('Capas 320 px');mark('Comprobación adicional a 320 px sin desbordamiento ni objetivos táctiles pequeños');
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>VGEDemo.mount({}));assert.ok(await page.locator('.error-panel').isVisible());assert.match(await page.locator('.error-detail').textContent(),/Documento VGE inválido/);mark('JSON inválido muestra un mensaje visible');
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);mark('Consola limpia y HTML sin peticiones externas');
  fs.writeFileSync(path.join(out,'comprobacion-390.json'),JSON.stringify({viewport:390,secondaryWidth:320,checks,direction,consoleErrors:errors,externalRequests:requests,renderer:'Chromium con WebGL por software',scope:'Comprobación puntual de la corrección de Fase 2, no matriz formal de Fase 5.'},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
