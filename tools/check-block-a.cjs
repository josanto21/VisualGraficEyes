/* Regresiones del Bloque A. Un viewport de 390 px no es un teléfono físico. */
const {chromium}=require(process.env.VGE_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.VGE_QA_DIR||path.join(root,'out/qa-block-a'));
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({...(process.env.VGE_CHROME_PATH?{executablePath:process.env.VGE_CHROME_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const results=[];
 const run=async(id,fn,{noWebGL=false}={})=>{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'reduce'}),errors=[],consoleErrors=[];
  page.setDefaultTimeout(5000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  try{
   if(noWebGL)await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args);};});
   await page.goto('file://'+path.join(root,'dist/index.html'));await page.waitForFunction(()=>window.VGEDemo?.current);
   await fn(page);assert.deepEqual(errors,[]);
   assert.deepEqual(consoleErrors,[]);
   await page.screenshot({path:path.join(out,id+'-390.png'),fullPage:true});
   const gpu=await page.evaluate(()=>{const renderer=VGEDemo.current?.renderer;if(!renderer)return null;const gl=renderer.getContext(),info=gl.getExtension('WEBGL_debug_renderer_info');return info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
   results.push({id,status:'PASS',pageErrors:errors,consoleErrors,gpu,viewport:page.viewportSize(),expectedWebGLFailure:noWebGL});console.log('PASS '+id);
  }catch(error){results.push({id,status:'FAIL',message:error.message,pageErrors:errors,consoleErrors});console.error('FAIL '+id+': '+error.message);}
  finally{await page.close();}
 };
 const range=async(page,id,value)=>page.locator(id).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 const layout=async page=>{
  const r=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,small:[...document.querySelectorAll('button,select,input,summary')].filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{const t=e.matches('[type=checkbox]')?e.closest('label'):e,r=t.getBoundingClientRect();return{id:e.id||e.textContent.trim().slice(0,30),w:r.width,h:r.height};}).filter(r=>r.w<43.99||r.h<43.99)}));
  assert.equal(r.overflow,false);assert.deepEqual(r.small,[]);
 };
 try{
  await run('VGE-007',async page=>{
   await page.evaluate(()=>{VGEDemo.current.goStory(3);VGEDemo.current.engine.pause().setStep(6);});
   assert.equal(await page.locator('#vge-explode').inputValue(),'100');
   assert.equal(await page.locator('#vge-step').inputValue(),'6');
   assert.equal(await page.locator('.story-title').innerText(),'Separar para mirar');
   assert.match(await page.locator('.story-text').innerText(),/piezas.*juntas/);
   await page.evaluate(()=>VGEDemo.current.engine.setParam('phaseDeg',120));assert.equal(await page.locator('#vge-phase').inputValue(),'120');
   await page.evaluate(()=>VGEDemo.current.engine.setParam('phaseDeg',30.5));assert.equal(await page.locator('#vge-phase').inputValue(),'30.5');
   await page.evaluate(()=>VGEDemo.current.engine.setParam('phaseDeg',0));assert.equal(await page.locator('#vge-phase').inputValue(),'0');assert.equal(await page.evaluate(()=>VGEDemo.current.engine.getParameter('rotorFreedom')),0);
   if(!await page.locator('.explore').isVisible())await page.locator('[data-action="story-next"]').click();
   await page.selectOption('#vge-step','5');assert.equal(await page.evaluate(()=>VGEDemo.current.engine.state.step),5);assert.equal(await page.locator('#vge-explode').inputValue(),'40');
   await page.evaluate(()=>VGEDemo.current.engine.explode(.655));assert.equal(await page.locator('#vge-explode').inputValue(),'65.5');
   if(!await page.locator('.explore').isVisible())await page.locator('[data-action="story-next"]').click();
   await page.locator('[data-view="field"]').click();await range(page,'#vge-phase',30);
   assert.equal(await page.evaluate(()=>VGEDemo.current.engine.getParameter('phaseDeg')),30);assert.equal(await page.evaluate(()=>VGEDemo.current.engine.getParameter('rotorFreedom')),1);
   await page.locator('[data-view="cut"]').click();await range(page,'#vge-explode',20);assert.equal(await page.evaluate(()=>VGEDemo.current.engine.state.exploded),.2);
   assert.ok(await page.locator('.story-text').isVisible());await layout(page);
  });
  await run('VGE-008',async page=>{
   await page.evaluate(()=>VGEDemo.current.goStory(3));
   assert.match(await page.locator('h1').innerText(),/Cómo hace girar/);
   assert.ok(await page.locator('.story-text').isVisible());assert.match(await page.locator('.story-text').innerText(),/personas empujando una rueda/);
   assert.ok(await page.locator('.static-fallback svg[role="img"]').isVisible());assert.equal(await page.locator('.error-panel').count(),0);
   for(const level of ['1','2','3']){await page.selectOption('#vge-level',level);assert.ok(await page.locator('.story-text').isVisible());await layout(page);}
   await page.setViewportSize({width:320,height:844});await layout(page);
   await page.locator('[data-action="story-next"]').click();assert.match(await page.locator('.step-count').innerText(),/Paso 1/);
   await page.setViewportSize({width:390,height:844});await page.evaluate(()=>VGEDemo.current.goStory(3));assert.ok(await page.locator('.static-fallback').isVisible());
  },{noWebGL:true});
  await run('VGE-014',async page=>{
   await page.evaluate(()=>VGEDemo.current.goStory(3));await page.selectOption('#vge-level','3');
   const note=await page.locator('.material-note').innerText();assert.match(note,/metal.*plástico/iu);assert.doesNotMatch(await page.locator('.layer-three').innerText(),/Las piezas grises son metal/);
   assert.equal(await page.evaluate(()=>VGEDemo.defaultDocument.entities.find(e=>e.id==='capacitor').material),'plastic');await layout(page);
  });
 }finally{await browser.close();}
 const report={viewport:390,renderer:'Chromium / WebGL por software',results,mobileHardware:'NO VERIFICADO',userComprehension:'NO VERIFICADO'};
 fs.writeFileSync(path.join(out,'block-a.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length}));
 if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
