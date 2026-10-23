const {launchBrowser}=require('./browser.cjs');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.VGE_QA_DIR||path.join(root,'out/qa-block-c'));
const bubble=JSON.parse(fs.readFileSync(path.join(root,'examples/bubble-sort.json'),'utf8'));
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await launchBrowser(),results=[];
 const run=async(id,fn,{noWebGL=false}={})=>{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'reduce'}),errors=[];
  page.setDefaultTimeout(3500);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  try{
   if(noWebGL)await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args)}});
   await page.goto(pathToFileURL(path.join(root,'dist/index.html')).href);
   await page.waitForFunction(()=>window.VGEDemo?.current);
   await page.evaluate(d=>{VGEDemo.mount(d);VGEDemo.current.engine?.pause()},bubble);
   await fn(page);assert.deepEqual(errors,[]);results.push({id,status:'PASS',errors});console.log('PASS '+id);
   }catch(error){results.push({id,status:'FAIL',message:error.message,errors,viewport:page.viewportSize()});console.error('FAIL '+id+': '+error.message)}
  finally{await page.screenshot({path:path.join(out,id+'-390.png'),fullPage:true});await page.close()}
 };
 try{
  await run('VGE-005',async page=>{
   assert.equal(await page.locator('#vge-level').inputValue(),'1');
   assert.ok(await page.locator('.step-text').isVisible());assert.equal(await page.locator('.layer-two').isVisible(),false);assert.equal(await page.locator('.layer-three').isVisible(),false);
   assert.match(await page.locator('h1').innerText(),/Cómo/);assert.match(await page.locator('.common-intro').innerText(),/tarjetas/);
   const matrix=[];
   for(const width of [320,390,736]){
    await page.setViewportSize({width,height:844});
    for(const level of ['1','2','3']){
     await page.selectOption('#vge-level',level);
     for(let step=0;step<7;step++){
      await page.evaluate(n=>VGEDemo.current.engine.setStep(n),step);
      await page.waitForFunction(n=>document.querySelector('.step-index').textContent.trim().startsWith(String(n+1).padStart(2,'0')),step);
      assert.ok(await page.locator('.step-text').isVisible());
      assert.equal(await page.locator('.layer-two').isVisible(),Number(level)>=2);assert.equal(await page.locator('.layer-three').isVisible(),level==='3');
      const row=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,small:[...document.querySelectorAll('button,select,input,summary')].filter(e=>e.getClientRects().length&&!e.disabled).filter(e=>{const r=e.getBoundingClientRect();return r.width<43.99||r.height<43.99}).map(e=>e.id||e.textContent.trim().slice(0,30))}));
      assert.equal(row.overflow,false);assert.deepEqual(row.small,[]);matrix.push({width,level,step,...row});
     }
    }
   }
   await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'avanzado-390.png'),fullPage:true});await page.selectOption('#vge-level','1');
   await page.locator('[data-action="technical"]').click();assert.ok(await page.locator('.layer-two').isVisible());
   await page.evaluate(()=>VGEDemo.current.engine.setStep(0));assert.equal(await page.locator('.layer-two').isVisible(),false);
   await page.locator('[data-action="advanced"]').click();assert.ok(await page.locator('.layer-three').isVisible());assert.ok(await page.locator('.step-text').isVisible());
   await page.locator('[data-action="advanced"]').click();
   await page.evaluate(()=>VGEDemo.current.engine.setStep(6));assert.equal(await page.locator('.value-readout').innerText(),'Orden actual: 1 · 2 · 3');
   await page.evaluate(()=>{VGEDemo.current.engine.setStep(1).select('e3')});await page.waitForTimeout(180);
   fs.writeFileSync(path.join(out,'matrix.json'),JSON.stringify(matrix,null,2));
  });
  await run('VGE-006',async page=>{
   const labels=[];
   for(const width of [390,320,736]){
    await page.setViewportSize({width,height:844});
    for(const id of ['e3','e1','e2']){
     await page.selectOption('#vge-part',id);await page.waitForTimeout(180);
     const b=await page.evaluate(()=>{const a=document.querySelector('.annotation').getBoundingClientRect(),s=document.querySelector('.stage').getBoundingClientRect();return{annotation:{x:a.x,y:a.y,width:a.width,height:a.height},stage:{x:s.x,y:s.y,width:s.width,height:s.height},text:document.querySelector('.annotation').textContent}});
     const {annotation:a,stage:s}=b;assert.ok(a.x>=s.x&&a.y>=s.y&&a.x+a.width<=s.x+s.width&&a.y+a.height<=s.y+s.height,JSON.stringify(b));
     assert.ok(await page.locator('.annotation-line path').isVisible());labels.push({width,id,...b});
    }
   }
   await page.setViewportSize({width:390,height:844});await page.selectOption('#vge-part','e3');await page.waitForTimeout(180);
   fs.writeFileSync(path.join(out,'labels.json'),JSON.stringify(labels,null,2));
  });
  await run('sin-jerga-resaltado',async page=>{
   await page.selectOption('#vge-part','e3');
   for(const mode of ['auto','outline','emissive']){
    await page.selectOption('#vge-highlight',mode);
    assert.doesNotMatch(await page.locator('#vge-highlight').textContent(),/emisiv/iu);
    assert.doesNotMatch(await page.locator('.selection-status').innerText(),/emisiv/iu);
   }
   assert.equal(await page.evaluate(()=>VGEDemo.current.graphics.stats.visibleOutlines),0);
  });
  await run('capas-sin-webgl',async page=>{
   for(const level of ['1','2','3']){await page.selectOption('#vge-level',level);assert.ok(await page.locator('.step-text').isVisible())}
   assert.ok(await page.locator('.fallback-note').isVisible());
   await page.evaluate(()=>VGEDemo.current.engine.setStep(6));assert.equal(await page.locator('.value-readout').innerText(),'Orden actual: 1 · 2 · 3');
  },{noWebGL:true});
 }finally{await browser.close()}
 const report={results,viewport:390,otherWidths:[320,736],mobileHardware:'NO VERIFICADO',humanComprehension:'NO VERIFICADO'};
 fs.writeFileSync(path.join(out,'block-c.json'),JSON.stringify(report,null,2));
 if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
