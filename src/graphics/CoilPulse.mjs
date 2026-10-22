import * as THREE from 'three';
/** Brillo semántico del mismo canal que leen la gráfica y el vector. */
export class CoilPulse {
  #entries=[]; #variants=new Map(); #disposed=false;
  constructor(engine,sources) {
    for(const source of sources) engine.getObject(source.entity).traverse(object=>{
      if(object.isMesh && !object.userData.vgeEffect) this.#entries.push({mesh:object,source:engine.getObject(source.entity),color:new THREE.Color(source.color)});
    });
    engine.addEffect(this);
  }
  update() {
    if(this.#disposed)return;
    for(const entry of this.#entries){
      const base=entry.mesh.material; let variant=this.#variants.get(base);
      if(!variant){variant=base.clone();variant.name='VGE:coil-pulse';this.#variants.set(base,variant);}
      // Conservar la señal blanca del resaltado ligero sobre el brillo de color.
      const selected=base.emissive?.r>0 || base.emissive?.g>0 || base.emissive?.b>0;
      variant.emissive.copy(entry.color).multiplyScalar(.04+.85*Math.min(1.5,Math.abs(entry.source.userData.data.iNorm)));
      if(selected)variant.emissive.addScalar(.18);
      variant.emissiveIntensity=1;
      entry.mesh.material=variant;
    }
  }
  get stats(){return {variants:this.#variants.size};}
  dispose(){if(this.#disposed)return;this.#disposed=true;for(const m of this.#variants.values())m.dispose();this.#variants.clear();}
}
