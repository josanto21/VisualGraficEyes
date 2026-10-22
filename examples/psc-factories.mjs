import * as THREE from 'three';

// Extensión de dominio. El núcleo VGE no importa este archivo.
const positive = { type: 'number', exclusiveMinimum: 0 };
export const pscFactories = {
  'psc.blade': {
    schema: {
      type: 'object', additionalProperties: false,
      properties: { rootRadius: positive, radius: positive, chord: positive, thickness: positive, pitchRoot: { type: 'number' }, pitchTip: { type: 'number' }, sweep: { type: 'number' } },
      required: ['rootRadius', 'radius', 'chord', 'thickness', 'pitchRoot', 'pitchTip', 'sweep'],
    },
    check: p => p.radius > p.rootRadius ? [] : ['radius debe superar rootRadius'],
    create(p, { quality }) {
      const nu = quality === 'mobile' ? 22 : 32, nv = 8;
      const positions = [], indices = [];
      const index = (side, u, v) => side * (nu + 1) * (nv + 1) + u * (nv + 1) + v;
      for (let side = 0; side < 2; side++) for (let i = 0; i <= nu; i++) {
        const u = i / nu;
        const r = p.rootRadius + (p.radius - p.rootRadius) * u;
        const chord = p.chord * (0.25 + 0.75 * Math.sin(Math.PI * u) ** 0.75) * (1 - 0.8 * u ** 10);
        const pitch = p.pitchRoot + (p.pitchTip - p.pitchRoot) * u;
        const sweep = p.sweep * u - 0.1;
        const yr = Math.cos(sweep), zr = Math.sin(sweep), yt = -zr, zt = yr;
        for (let j = 0; j <= nv; j++) {
          const v = 2 * j / nv - 1;
          const c = chord * v;
          positions.push(0.08 * u * u + Math.sin(pitch) * c + (side ? 1 : -1) * p.thickness / 2,
            r * yr + Math.cos(pitch) * c * yt, r * zr + Math.cos(pitch) * c * zt);
        }
      }
      const quad = (a, b, c, d) => indices.push(a, b, c, a, c, d);
      for (let side = 0; side < 2; side++) for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const a = index(side, i, j), b = index(side, i + 1, j), c = index(side, i + 1, j + 1), d = index(side, i, j + 1);
        if (side) quad(a, b, c, d); else quad(a, d, c, b);
      }
      // Cerrar ambos laterales, raíz y punta: superficie con espesor, no una lámina abierta.
      for (let i = 0; i < nu; i++) {
        quad(index(0, i, 0), index(0, i + 1, 0), index(1, i + 1, 0), index(1, i, 0));
        quad(index(0, i, nv), index(1, i, nv), index(1, i + 1, nv), index(0, i + 1, nv));
      }
      for (let j = 0; j < nv; j++) {
        quad(index(0, 0, j), index(1, 0, j), index(1, 0, j + 1), index(0, 0, j + 1));
        quad(index(0, nu, j), index(0, nu, j + 1), index(1, nu, j + 1), index(1, nu, j));
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices); geometry.computeVertexNormals();
      return geometry;
    },
  },
};
