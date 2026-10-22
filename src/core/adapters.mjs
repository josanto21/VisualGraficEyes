const required=(v,name)=>{if(v==null)throw new Error(`VGE_CONFIGURATION_REQUIRED: ${name}`);return v;};
const method=(o,k)=>required(typeof o?.[k]==='function'?o[k].bind(o):null,`API ${k}`);
export async function openCircuitJS(stage,context){
 let sim;try{sim=required(context.circuitWindow?.CircuitJS1,'CircuitJS1 cargado y del mismo origen');}catch(e){throw new Error(`VGE_CIRCUITJS_UNAVAILABLE: ${e.message}`);}
 const pause=()=>method(sim,'setSimRunning')(false),play=()=>method(sim,'setSimRunning')(true);
 pause();const text=await method(context,'readText')(stage.source.circuit);method(sim,'importCircuit')(text,false);pause();
 return {engine:'circuitjs',play,pause,setParam:(name,v)=>method(sim,'setExtVoltage')(name,v),sample:()=>({time:method(sim,'getTime')(),elements:method(sim,'getElements')().map(e=>({type:e.getType(),current:e.getCurrent?.()??null,voltage:e.getVoltageDiff?.()??null}))}),dispose:pause};
}
export async function openSpline(stage,context){
 const Application=required(context.SplineApplication,'@splinetool/runtime Application'),scene=required(stage.source.sceneUrl,'exportación Spline real'),canvas=required(context.canvas,'canvas Spline');
 const app=new Application(canvas,{renderMode:'auto'});
 try{await app.load(scene);const pause=method(app,'stop'),play=method(app,'play');pause();
  return {engine:'spline',play,pause,select:id=>{const o=method(app,'findObjectById')(id);if(!o)throw new Error(`VGE_UNKNOWN_ENTITY: ${id}`);return o;},setParam:(name,v)=>method(app,'setVariable')(name,v),dispose:()=>method(app,'dispose')()};
 }catch(e){app.dispose?.();throw e;}
}
export async function openThreeJS(stage,context){
 const {VGEEngine}=await import('../VGEEngine.mjs');const data=await method(context,'readJSON')(stage.source.document);const instance=new VGEEngine(data,context.engineOptions??{});
 return {engine:'threejs',instance,...Object.fromEntries(['play','pause','select','explode','setStep','setParam','injectFault','dispose'].map(k=>[k,instance[k].bind(instance)]))};
}
export const interactiveAdapters={circuitjs:openCircuitJS,spline:openSpline,threejs:openThreeJS};
