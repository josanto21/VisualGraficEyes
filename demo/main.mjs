import {mountVGE} from '../src/ui/mountVGE.mjs';
import {mountBeginnerVGE} from '../src/ui/mountBeginnerVGE.mjs';
import {pscFactories} from '../examples/psc-factories.mjs';
import psc from '../examples/psc.beginner.json' with {type:'json'};
import graphics from '../examples/psc.beginner.graphics.json' with {type:'json'};
import lesson from '../examples/psc.lesson.json' with {type:'json'};
import {showError} from '../src/ui/status.mjs';
const host=document.querySelector('#vge'),input=document.createElement('input');input.type='file';input.accept='.json,application/json';
const open=()=>input.click();
const mount=data=>data?.metadata?.id==='fan-psc'?mountBeginnerVGE(host,data,{geometryFactories:pscFactories,graphics,lesson,onOpen:open}):mountVGE(host,data,{geometryFactories:pscFactories,onOpen:open});
input.addEventListener('change',async()=>{
 if(!input.files[0])return;
 try{mount(JSON.parse(await input.files[0].text()));}catch(error){host.__vge?.dispose();host.__vge=null;showError(host,error,open);}input.value='';
});
mount(psc);
window.VGEDemo={mount,defaultDocument:psc,defaultGraphics:graphics,lesson,get current(){return host.__vge}};
