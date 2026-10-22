// Capacidades del contrato; no son afirmaciones de disponibilidad o ejecución.
export const engines=Object.freeze({
 anatomy:{name:'Anatomy',mode:'ANATOMÍA',kind:'build',skills:['anatomy'],operations:['build'],native:'JS/TS + kit SVG'},
 circuitjs:{name:'CircuitJS / Falstad',mode:'LABORATORIO',kind:'interactive',skills:[],operations:['play','pause','setParam','sample'],native:'CircuitJS text'},
 manim:{name:'Manim Community',mode:'ANIMADO-PASOS',kind:'render',skills:[],operations:['render'],native:'Python Scene'},
 remotion:{name:'Remotion',mode:'VIDEO-ESCENAS',kind:'render',skills:['remotion-best-practices','remotion-create','remotion-markup','remotion-render'],operations:['preview','render'],native:'React composition'},
 spline:{name:'Spline',mode:'ESCENA 3D',kind:'interactive',skills:[],operations:['play','pause','setParam','select'],native:'.splinecode'},
 threejs:{name:'VGE / Three.js',mode:'ANATOMÍA',kind:'interactive',skills:['visualgrafic-eyes'],operations:['play','pause','select','explode','setStep','setParam','injectFault'],native:'VGE JSON'}
});
export function getEngine(id){if(!Object.hasOwn(engines,id))throw new Error(`VGE_UNKNOWN_ENGINE: ${id}`);return structuredClone(engines[id]);}
