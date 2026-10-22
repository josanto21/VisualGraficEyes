import React from 'react';
import {AbsoluteFill,Composition,registerRoot,useCurrentFrame,useVideoConfig,interpolate} from 'remotion';
// Fuente nativa de integración. Sin CSS temporal ni requestAnimationFrame.
const Connection=({layers})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig();
 return <AbsoluteFill style={{backgroundColor:'#101820',color:'#f2f0e8',fontFamily:'sans-serif',padding:70,justifyContent:'space-between'}}>
  <div><div style={{fontSize:24,letterSpacing:3,color:'#edb66e'}}>ILUSTRACIÓN · CONEXIÓN REMOTION</div><h1 style={{fontSize:64,lineHeight:1.1}}>¿Cómo se transmite un giro?</h1></div>
  <svg viewBox="0 0 600 330" style={{width:'100%',height:400}} aria-label="Rueda naranja conectada a un eje">
   <path d="M300 165H540" stroke="#9ca5ac" strokeWidth="20"/>
   <g style={{transformOrigin:'300px 165px',rotate:interpolate(frame,[0,5*fps],['0deg','360deg'],{extrapolateRight:'clamp'})}}>
    <circle cx="300" cy="165" r="120" fill="none" stroke="#edb66e" strokeWidth="16"/><path d="M180 165H420M300 45V285" stroke="#edb66e" strokeWidth="10"/>
   </g><circle cx="300" cy="165" r="22" fill="#9ca5ac"/>
  </svg>
  <p style={{fontSize:36,lineHeight:1.35}}>{layers?.common??'La rueda y su eje transmiten el giro, como una perilla y su varilla.'}</p>
 </AbsoluteFill>;
};
const Root=()=> <Composition id="VGEConnection" component={Connection} width={720} height={960} fps={24} durationInFrames={120} defaultProps={{}}/>;
registerRoot(Root);
