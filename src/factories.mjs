import * as THREE from 'three';

const positive = { type: 'number', exclusiveMinimum: 0 };
const vec3 = { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 };
const schema = (properties, required) => ({ type: 'object', additionalProperties: false, properties, required });
const segments = { type: 'integer', minimum: 8, maximum: 128 };

// Las fábricas solo se llaman al construir. Cada definición crea UN recurso.
// La resolución se decide una vez; nunca depende de un fotograma.
export const defaultFactories = Object.freeze({
  box: {
    schema: schema({ size: { type: 'array', items: positive, minItems: 3, maxItems: 3 } }, ['size']),
    create: p => new THREE.BoxGeometry(...p.size),
  },
  cylinderX: {
    schema: schema({ radius: positive, length: positive, segments }, ['radius', 'length']),
    create: (p, { quality }) => new THREE.CylinderGeometry(p.radius, p.radius, p.length, p.segments ?? (quality === 'mobile' ? 32 : 64)).rotateZ(-Math.PI / 2),
  },
  ringX: {
    schema: schema({ innerRadius: positive, outerRadius: positive, length: positive, segments }, ['innerRadius', 'outerRadius', 'length']),
    check: p => p.outerRadius > p.innerRadius ? [] : ['outerRadius debe superar innerRadius'],
    create(p, { quality }) {
      const h = p.length / 2;
      const profile = [[p.innerRadius, -h], [p.outerRadius, -h], [p.outerRadius, h], [p.innerRadius, h], [p.innerRadius, -h]];
      return new THREE.LatheGeometry(profile.map(v => new THREE.Vector2(...v)), p.segments ?? (quality === 'mobile' ? 32 : 64)).rotateZ(-Math.PI / 2);
    },
  },
  annularSectorX: {
    schema: schema({ innerRadius: positive, outerRadius: positive, length: positive, angle: { type: 'number', exclusiveMinimum: 0, maximum: 6.283185307179586 } }, ['innerRadius', 'outerRadius', 'length', 'angle']),
    check: p => p.outerRadius > p.innerRadius ? [] : ['outerRadius debe superar innerRadius'],
    create(p, { quality }) {
      const shape = new THREE.Shape();
      const n = quality === 'mobile' ? 12 : 24;
      for (let j = 0; j <= n; j++) {
        const a = -p.angle / 2 + p.angle * j / n;
        const point = [p.outerRadius * Math.sin(a), p.outerRadius * Math.cos(a)];
        if (j === 0) shape.moveTo(...point); else shape.lineTo(...point);
      }
      for (let j = n; j >= 0; j--) {
        const a = -p.angle / 2 + p.angle * j / n;
        shape.lineTo(p.innerRadius * Math.sin(a), p.innerRadius * Math.cos(a));
      }
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth: p.length, bevelEnabled: false, steps: 1 }).translate(0, 0, -p.length / 2).rotateY(Math.PI / 2);
    },
  },
  sphere: {
    schema: schema({ radius: positive, segments }, ['radius']),
    create: (p, { quality }) => new THREE.SphereGeometry(p.radius, p.segments ?? (quality === 'mobile' ? 20 : 32), quality === 'mobile' ? 12 : 20),
  },
  tube: {
    schema: schema({ points: { type: 'array', items: vec3, minItems: 2, maxItems: 64 }, radius: positive, closed: { type: 'boolean' }, segments: { type: 'integer', minimum: 8, maximum: 256 } }, ['points', 'radius']),
    check: p => p.points.some((v, i) => i > 0 && v.every((n, j) => n === p.points[i - 1][j])) ? ['puntos consecutivos coincidentes'] : [],
    create(p, { quality }) {
      const path = new THREE.CatmullRomCurve3(p.points.map(v => new THREE.Vector3(...v)), p.closed ?? false, 'centripetal');
      return new THREE.TubeGeometry(path, p.segments ?? (quality === 'mobile' ? 40 : 72), p.radius, quality === 'mobile' ? 6 : 8, p.closed ?? false);
    },
  },
});

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
