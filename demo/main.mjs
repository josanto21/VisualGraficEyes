import {mountVGE} from '../src/ui/mountVGE.mjs';
import {mountBeginnerVGE} from '../src/ui/mountBeginnerVGE.mjs';
import {pscFactories} from '../examples/psc-factories.mjs';
import psc from '../examples/psc.beginner.json' with {type:'json'};
import graphics from '../examples/psc.beginner.graphics.json' with {type:'json'};
import lesson from '../examples/psc.lesson.json' with {type:'json'};
import bubble from '../examples/bubble-sort.json' with {type:'json'};
import bubbleLesson from '../examples/bubble-sort.lesson.json' with {type:'json'};
import {showError} from '../src/ui/status.mjs';
const host=document.querySelector('#vge'),input=document.createElement('input');input.type='file';input.accept='.json,application/json';
const open=()=>input.click();
const mount=(data,options={})=>data?.metadata?.id==='fan-psc'?mountBeginnerVGE(host,data,{geometryFactories:pscFactories,graphics,lesson,...options,onOpen:open}):mountVGE(host,data,{geometryFactories:pscFactories,lesson:data?.metadata?.id===bubble.metadata.id?bubbleLesson:undefined,...options,onOpen:open});
input.addEventListener('change',async()=>{
 if(!input.files[0])return;
 try{mount(JSON.parse(await input.files[0].text()));}catch(error){host.__vge?.dispose();host.__vge=null;showError(host,error,open);}input.value='';
});
mount(new URLSearchParams(location.search).get('example')==='bubble-sort'?bubble:psc);
window.VGEDemo={mount,defaultDocument:psc,defaultGraphics:graphics,lesson,examples:{psc,bubble},get current(){return host.__vge}};
