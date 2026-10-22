const NS='http://www.w3.org/2000/svg',TAU=2*Math.PI;
/** Las curvas solo se reconstruyen al cambiar sus parámetros; el cursor lee el motor. */
export class SignalDiagram {
  #engine; #sources; #svg; #paths; #dots; #cursor; #key='';
  constructor(engine,sources,svg){
    this.#engine=engine;this.#sources=sources;this.#svg=svg;
    const create=(tag,attrs)=>{const el=svg.ownerDocument.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);svg.append(el);return el};
    create('path',{d:'M22 76 H338',stroke:'#8e929b','stroke-dasharray':'4 4'});
    this.#paths=sources.map(s=>create('path',{fill:'none',stroke:s.color,'stroke-width':3}));
    this.#cursor=create('path',{stroke:'#fff','stroke-width':1.5});
    this.#dots=sources.map(s=>create('circle',{r:4,fill:s.color,stroke:'#101114','stroke-width':2}));
    this.update();
  }
  update(){
    const signals=this.#sources.map(s=>this.#engine.getBindingState(s.binding));
    const reference=signals[0],fraction=reference.phase/TAU;
    const key=signals.map(s=>[s.offset,s.amplitude,s.bias,s.rate/reference.rate].join(',')).join('|');
    const y=v=>76-v*43;
    if(key!==this.#key){
      this.#key=key;
      for(let n=0;n<signals.length;n++){
        const s=signals[n],points=[];
        for(let i=0;i<=128;i++){const f=i/128;const value=s.bias+s.amplitude*Math.sin(TAU*f*s.rate/reference.rate+s.offset);points.push(`${i?'L':'M'}${22+316*f},${y(value)}`);}
        this.#paths[n].setAttribute('d',points.join(' '));
      }
    }
    const x=22+316*fraction;this.#cursor.setAttribute('d',`M${x} 14 V138`);
    for(let n=0;n<signals.length;n++){
      const value=this.#engine.getObject(this.#sources[n].entity).userData.data.iNorm;
      this.#dots[n].setAttribute('cx',x);this.#dots[n].setAttribute('cy',y(value));
    }
    return fraction;
  }
}
