import {validateProject} from './manifest.mjs';
import {getEngine} from './registry.mjs';
import {interactiveAdapters} from './adapters.mjs';
export class VGESession{
 #project;#context;#active=null;#stage=null;#disposed=false;#busy=false;#wanted=false;#params;#visibility;#observer;
 constructor(project,context={}){
  this.#project=structuredClone(validateProject(project));this.#context=context;this.offscreen=false;
  this.#params=new Map(project.parameters.map(p=>[p.id,p.value]));const dom=context.visibilityDocument;
  if(dom?.addEventListener){this.#visibility=()=>this.#sync();dom.addEventListener('visibilitychange',this.#visibility);}
  if(context.surface&&context.IntersectionObserver){this.#observer=new context.IntersectionObserver(e=>{this.offscreen=!e.at(-1).isIntersecting;this.#sync();});this.#observer.observe(context.surface);}
 }
 #alive(){if(this.#disposed)throw new Error('VGE_DISPOSED: sesión cerrada');}
 #sync(){if(this.#active)(this.#wanted&&!this.#context.visibilityDocument?.hidden&&!this.offscreen?this.#active.play:this.#active.pause)?.();}
 get active(){return this.#stage?.id??null;}
 get project(){return structuredClone(this.#project);}
 layers(level=1){this.#alive();if(![1,2,3].includes(level))throw new RangeError('Nivel 1, 2 o 3');const l=this.#stage?.layers??this.#project.layers;return {common:l.common,...(level>=2?{technical:l.technical}:{}),...(level>=3?{advanced:l.advanced}:{})};}
 async open(id){
  this.#alive();if(this.#busy)throw new Error('VGE_BUSY: hay una apertura en curso');const stage=this.#project.stages.find(s=>s.id===id);
  if(!stage)throw new Error(`VGE_UNKNOWN_STAGE: ${id}`);if(!stage.enabled)throw new Error(`VGE_CONFIGURATION_REQUIRED: ${stage.reason}`);
  if(getEngine(stage.engine).kind!=='interactive')throw new Error(`VGE_NATIVE_JOB_REQUIRED: ${stage.engine}; usar plan/run`);
  const factory=this.#context.adapters?.[stage.engine]??interactiveAdapters[stage.engine];this.#busy=true;
  try{this.#active?.dispose();this.#active=null;this.#stage=null;this.#wanted=false;const candidate=await factory(stage,this.#context);
   if(this.#disposed){candidate.dispose();throw new Error('VGE_DISPOSED: apertura cancelada');}
   try{for(const b of stage.bindings)candidate.setParam(b.target,this.#params.get(b.parameter));candidate.pause();}catch(e){candidate.dispose();throw e;}
   this.#active=candidate;this.#stage=stage;return this;
  }finally{this.#busy=false;}
 }
 command(operation,...args){this.#alive();if(!this.#active)throw new Error('VGE_NO_ACTIVE_STAGE');if(!Object.hasOwn(this.#active,operation)||typeof this.#active[operation]!=='function'||['dispose','setParam','play','pause'].includes(operation))throw new Error(`VGE_UNSUPPORTED_OPERATION: ${this.#stage.engine}/${operation}`);return this.#active[operation](...args);}
 play(){this.#alive();this.#wanted=true;this.#sync();return this;}
 pause(){this.#alive();this.#wanted=false;this.#sync();return this;}
 setParam(id,value){this.#alive();const p=this.#project.parameters.find(p=>p.id===id),b=this.#stage?.bindings.find(b=>b.parameter===id);if(!p||!Number.isFinite(value)||value<p.min||value>p.max)throw new RangeError(`VGE_INVALID_PARAMETER: ${id}`);if(!b||typeof this.#active?.setParam!=='function')throw new Error(`VGE_UNSUPPORTED_PARAMETER: ${id}`);this.#active.setParam(b.target,value);this.#params.set(id,value);return this;}
 dispose(){if(this.#disposed)return;this.#disposed=true;this.#observer?.disconnect();this.#context.visibilityDocument?.removeEventListener?.('visibilitychange',this.#visibility);this.#active?.dispose();this.#active=null;this.#stage=null;}
}
