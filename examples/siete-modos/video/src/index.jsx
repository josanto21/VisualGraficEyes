import React from 'react';
import {
  AbsoluteFill,
  Composition,
  Easing,
  interpolate,
  registerRoot,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {loadFont} from '@remotion/fonts';

// Paleta compartida con la página VGE (tema oscuro).
const C = {
  bg: '#0f161c',
  panel: '#16212a',
  ink: '#e7edf2',
  ink2: '#9fb0bd',
  rule: '#2f3e4a',
  flow: '#5b95f0', // corriente de colector (la grande)
  ctrl: '#f08a35', // corriente de base (la de control)
  ok: '#3cc278',
};
const DISPLAY = 'Big Shoulders Display';
const SANS = 'IBM Plex Sans';
const MONO = 'IBM Plex Mono';

loadFont({family: DISPLAY, url: staticFile('display-800.woff2'), weight: '800'});
loadFont({family: SANS, url: staticFile('ibm-plex-sans-latin-400-normal.woff2'), weight: '400'});
loadFont({family: SANS, url: staticFile('ibm-plex-sans-latin-600-normal.woff2'), weight: '600'});
loadFont({family: MONO, url: staticFile('ibm-plex-mono-latin-500-normal.woff2'), weight: '500'});

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const ease = Easing.bezier(0.16, 1, 0.3, 1);

// ---------- Modelo único: corriente de base y de colector por cuadro ----------
// β = 100 (supuesto). Carga de 240 Ω a 5 V → I_C(sat) = (5 − 0,2) / 240 = 20 mA.
const BETA = 100;
const IC_SAT = 20; // mA
const ibAt = (f) =>
  f < 60
    ? 0
    : f < 210
      ? interpolate(f, [60, 200], [0, 0.2], {...clamp, easing: Easing.inOut(Easing.quad)})
      : interpolate(f, [210, 300], [0.2, 0.35], {...clamp, easing: Easing.inOut(Easing.quad)});
const icAt = (f) => Math.min(BETA * ibAt(f), IC_SAT);

// Distancia recorrida por los puntos = integral de la corriente (velocidad ilustrativa).
const travel = (f, current, pxPerFrameAtRef, ref) => {
  let d = 0;
  for (let k = 0; k < f; k++) d += (current(k) / ref) * pxPerFrameAtRef;
  return d;
};

const pointAt = (pts, d) => {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    segs.push({x1, y1, x2, y2, len, start: total});
    total += len;
  }
  const t = ((d % total) + total) % total;
  const s = segs.find((g) => t >= g.start && t <= g.start + g.len) ?? segs[segs.length - 1];
  const u = (t - s.start) / s.len;
  return [s.x1 + (s.x2 - s.x1) * u, s.y1 + (s.y2 - s.y1) * u, total];
};

const Dots = ({pts, distance, spacing, color, r}) => {
  const total = pointAt(pts, 0)[2];
  const n = Math.floor(total / spacing);
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const [x, y] = pointAt(pts, distance + i * spacing);
        return <circle key={i} cx={x} cy={y} r={r} fill={color} />;
      })}
    </g>
  );
};

// ---------- Símbolo NPN (coordenadas compartidas) ----------
const NPN = ({cx, cy, s = 1, drawn = 1, stroke = C.ink}) => {
  const len = 900;
  const dash = {strokeDasharray: len, strokeDashoffset: len * (1 - drawn)};
  const T = (x, y) => `${cx + x * s} ${cy + y * s}`;
  return (
    <g fill="none" stroke={stroke} strokeWidth={6 * Math.max(1, s * 0.7)} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={cx} cy={cy} r={72 * s} style={dash} />
      <path d={`M${T(-130, 0)}L${T(-38, 0)}`} style={dash} />
      <path d={`M${T(-38, -42)}L${T(-38, 42)}`} strokeWidth={10 * Math.max(1, s * 0.7)} style={dash} />
      <path d={`M${T(-38, -18)}L${T(30, -60)}L${T(30, -130)}`} style={dash} />
      <path d={`M${T(-38, 18)}L${T(30, 60)}L${T(30, 130)}`} style={dash} />
      {/* Flecha del emisor: sale del transistor (NPN) */}
      <path d={`M${T(30, 60)}L${T(4, 60)}M${T(30, 60)}L${T(18, 37)}`} style={{...dash, opacity: drawn}} />
    </g>
  );
};

// ---------- Escena 1: apertura ----------
const Apertura = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, color: C.ink, padding: '100px 80px', justifyContent: 'space-between'}}>
      <div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 30,
            letterSpacing: 4,
            color: C.ctrl,
            opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], clamp),
          }}
        >
          VGE · VIDEO-ESCENAS
        </div>
        <h1
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 112,
            lineHeight: 0.98,
            margin: '24px 0 0',
            textTransform: 'uppercase',
            opacity: interpolate(frame, [0.2 * fps, 1 * fps], [0, 1], clamp),
            translate: interpolate(frame, [0.2 * fps, 1 * fps], ['0px 40px', '0px 0px'], {...clamp, easing: ease}),
          }}
        >
          ¿Cómo controla una corriente pequeña a una grande?
        </h1>
      </div>
      <svg viewBox="0 0 920 420" style={{width: '100%', height: 420}}>
        <NPN cx={460} cy={210} s={1.25} drawn={interpolate(frame, [1 * fps, 3 * fps], [0, 1], {...clamp, easing: ease})} />
        <g
          fontFamily={MONO}
          fontSize={40}
          fill={C.ink2}
          style={{opacity: interpolate(frame, [2.6 * fps, 3.2 * fps], [0, 1], clamp)}}
        >
          <text x={270} y={196}>B</text>
          <text x={520} y={60}>C</text>
          <text x={520} y={392}>E</text>
        </g>
      </svg>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 48,
          color: C.ink2,
          opacity: interpolate(frame, [3.2 * fps, 3.8 * fps], [0, 1], clamp),
        }}
      >
        El transistor NPN: base, colector y emisor.
      </div>
    </AbsoluteFill>
  );
};

// ---------- Escena 2: desarrollo (el circuito en acción) ----------
const BASE_PATH = [[190, 600], [556, 600]];
const COL_PATH = [[630, 330], [630, 540], [565, 580]];
const EMI_PATH = [[565, 620], [630, 660], [630, 772]];

const Meter = ({label, value, unit, max, color, digits, y}) => (
  <g>
    <text x={80} y={y} fontFamily={SANS} fontSize={40} fill={C.ink}>{label}</text>
    <text x={1000} y={y} textAnchor="end" fontFamily={MONO} fontSize={40} fill={C.ink}>
      {value.toFixed(digits).replace('.', ',')} {unit}
    </text>
    <rect x={80} y={y + 16} width={920} height={14} rx={7} fill={C.rule} />
    <rect x={80} y={y + 16} width={Math.max(14, (920 * value) / max)} height={14} rx={7} fill={color} opacity={value > 0 ? 1 : 0} />
  </g>
);

const Subtitle = ({frame}) => {
  const lines = [
    {from: 0, to: 60, t: 'Sin corriente en la base, el colector queda cerrado.'},
    {from: 60, to: 210, t: 'Un poco de corriente en la base deja pasar mucha en el colector.'},
    {from: 210, to: 400, t: 'Más base ya no sube el colector: saturación, la carga lo limita.'},
  ];
  return (
    <div style={{position: 'relative', height: 120, marginTop: 16}}>
      {lines.map((l) => (
        <div
          key={l.from}
          style={{
            position: 'absolute',
            inset: 0,
            fontFamily: SANS,
            fontSize: 44,
            lineHeight: 1.3,
            color: C.ink2,
            opacity: interpolate(frame, [l.from, l.from + 10, l.to - 10, l.to], [0, 1, 1, 0], clamp),
          }}
        >
          {l.t}
        </div>
      ))}
    </div>
  );
};

const Desarrollo = () => {
  const frame = useCurrentFrame();
  const ib = ibAt(frame);
  const ic = icAt(frame);
  const sat = frame >= 210 && ic >= IC_SAT - 1e-6;
  const dB = travel(frame, ibAt, 1.6, 0.2);
  const dC = travel(frame, icAt, 7, IC_SAT);
  const glow = ic / IC_SAT;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, color: C.ink, padding: '100px 80px 0'}}>
      <h2 style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 92, lineHeight: 1, margin: 0, textTransform: 'uppercase'}}>
        La base es la llave
      </h2>
      <Subtitle frame={frame} />
      <svg viewBox="0 0 1080 1080" style={{position: 'absolute', inset: 0}}>
        {/* Cables */}
        <g fill="none" stroke={C.rule} strokeWidth={8} strokeLinecap="round">
          <path d="M190 600H470" />
          <path d="M630 330V470" />
          <path d="M630 730V772H190V680" />
        </g>
        {/* Corrientes (sentido convencional), bajo los componentes */}
        <Dots pts={BASE_PATH} distance={dB} spacing={46} color={C.ctrl} r={ib > 0 ? 7 : 0} />
        <Dots pts={COL_PATH} distance={dC} spacing={30} color={C.flow} r={ic > 0 ? 9 : 0} />
        <Dots pts={EMI_PATH} distance={dC} spacing={30} color={C.flow} r={ic > 0 ? 9 : 0} />
        {/* Riel +5 V */}
        <path d="M570 330H690" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
        <text x={710} y={342} fontFamily={MONO} fontSize={36} fill={C.ink}>+5 V</text>
        {/* Carga (lámpara) */}
        <circle cx={630} cy={404} r={44} fill={C.bg} stroke={C.ink} strokeWidth={6} />
        <circle cx={630} cy={404} r={40} fill={C.flow} opacity={0.15 + 0.75 * glow} />
        <path d="M600 374L660 434M660 374L600 434" stroke={C.ink} strokeWidth={5} />
        <text x={700} y={414} fontFamily={SANS} fontSize={34} fill={C.ink2}>carga 240 Ω</text>
        {/* Resistencia de base */}
        <rect x={290} y={580} width={130} height={40} rx={4} fill={C.bg} stroke={C.ink} strokeWidth={6} />
        <text x={355} y={560} textAnchor="middle" fontFamily={SANS} fontSize={30} fill={C.ink2}>R base</text>
        {/* Fuente de control */}
        <circle cx={190} cy={640} r={40} fill={C.bg} stroke={C.ctrl} strokeWidth={6} />
        <text x={190} y={652} textAnchor="middle" fontFamily={MONO} fontSize={40} fill={C.ctrl}>+</text>
        <text x={246} y={700} fontFamily={SANS} fontSize={30} fill={C.ctrl}>control</text>
        {/* Tierra */}
        <path d="M410 772V796M370 796H450M384 812H436M398 828H422" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
        {/* Transistor (mismo símbolo que la apertura) */}
        <NPN cx={600} cy={600} s={1} drawn={1} />
        <g fontFamily={MONO} fontSize={32} fill={C.ink2}>
          <text x={484} y={586}>B</text>
          <text x={648} y={520}>C</text>
          <text x={648} y={712}>E</text>
        </g>
        {/* Medidores: mismo estado que los puntos */}
        <Meter label="Base · I_B" value={ib} unit="mA" max={0.4} color={C.ctrl} digits={2} y={858} />
        <Meter label="Colector · I_C" value={ic} unit="mA" max={25} color={C.flow} digits={1} y={940} />
        <g fontFamily={MONO} fontSize={32} fill={sat ? C.ok : C.ink2}>
          <text x={720} y={590}>{sat ? 'saturación:' : 'zona activa:'}</text>
          <text x={720} y={634}>{sat ? 'I_C máx = 20 mA' : 'I_C = 100 × I_B'}</text>
        </g>
        <text x={80} y={1040} fontFamily={SANS} fontSize={24} fill={C.ink2}>velocidad de los puntos: ilustrativa</text>
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Escena 3: cierre ----------
const Card = ({title, body, color, appear}) => (
  <div
    style={{
      borderLeft: `10px solid ${color}`,
      padding: '18px 0 18px 32px',
      opacity: appear,
      translate: `${(1 - appear) * 60}px 0px`,
    }}
  >
    <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 84, lineHeight: 1, textTransform: 'uppercase', color}}>{title}</div>
    <div style={{fontFamily: SANS, fontSize: 44, lineHeight: 1.3, marginTop: 12}}>{body}</div>
  </div>
);

const Cierre = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = (s) => interpolate(frame, [s * fps, (s + 0.6) * fps], [0, 1], {...clamp, easing: ease});
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, color: C.ink, padding: '100px 80px', gap: 48}}>
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 4, color: C.ink2}}>DOS USOS</div>
      <Card title="Interruptor" color={C.ok} appear={a(0.2)} body="Base en cero: apagado. Base de sobra: encendido a fondo." />
      <Card title="Amplificador" color={C.flow} appear={a(1)} body="En la zona media, el colector copia la base multiplicada por β." />
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 48, lineHeight: 1.3, marginTop: 'auto', opacity: a(2.2)}}>
        Una corriente pequeña en la base controla la corriente grande del colector.
      </div>
    </AbsoluteFill>
  );
};

export const Transistor = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence name="Apertura" durationInFrames={150}>
      <Apertura />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 15})} />
    <TransitionSeries.Sequence name="Desarrollo" durationInFrames={330}>
      <Desarrollo />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 15})} />
    <TransitionSeries.Sequence name="Cierre" durationInFrames={150}>
      <Cierre />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);

// 150 + 330 + 150 − 2 × 15 = 600 cuadros = 20 s a 30 fps
const Root = () => (
  <Composition id="Transistor" component={Transistor} durationInFrames={600} fps={30} width={1080} height={1080} defaultProps={{}} />
);

registerRoot(Root);
