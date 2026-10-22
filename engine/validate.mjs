import Ajv2020 from 'ajv/dist/2020.js';
import schema from '../schema/vge.schema.json' with { type: 'json' };
import { defaultFactories } from './factories.mjs';

const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
const validateShape = ajv.compile(schema);
const factoryValidators = new WeakMap();
const unsafe = new Set(['__proto__', 'prototype', 'constructor']);

export class VGEValidationError extends Error {
  constructor(issues) {
    super(`Documento VGE inválido:\n${issues.map(x => `• ${x}`).join('\n')}`);
    this.name = 'VGEValidationError';
    this.issues = issues;
  }
}

function checkJSON(value, path = '$', ancestors = new Set(), depth = 0, budget = { n: 0 }) {
  if (++budget.n > 100000 || depth > 64) throw new VGEValidationError([`${path}: documento demasiado profundo o grande`]);
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return;
  if (typeof value !== 'object' || (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value)))) throw new VGEValidationError([`${path}: solo se permiten datos JSON finitos`]);
  if (ancestors.has(value)) throw new VGEValidationError([`${path}: referencia circular`]);
  ancestors.add(value);
  for (const key of Object.keys(value)) {
    if (unsafe.has(key)) throw new VGEValidationError([`${path}: clave reservada ${key}`]);
    checkJSON(value[key], `${path}.${key}`, ancestors, depth + 1, budget);
  }
  ancestors.delete(value);
}

export function validateDocument(document, { factories = defaultFactories } = {}) {
  checkJSON(document);
  if (!validateShape(document)) throw new VGEValidationError(validateShape.errors.map(e => `${e.instancePath || '/'}: ${e.message}`));
  const errors = [];
  const unique = (array, key, scope) => {
    const map = new Map();
    for (const item of array) {
      if (map.has(item[key])) errors.push(`${scope}: ${key} duplicado ${item[key]}`);
      map.set(item[key], item);
    }
    return map;
  };
  const entities = unique(document.entities, 'id', 'entities');
  const parameters = unique(document.parameters, 'name', 'parameters');
  unique(document.steps, 'id', 'steps');
  unique(document.faults, 'id', 'faults');
  const { geometries, materials } = document.resources;
  const has = (map, id, path) => { if (!map.has(id)) errors.push(`${path}: referencia desconocida ${id}`); };
  const hasMaterial = (id, path) => { if (!Object.hasOwn(materials, id)) errors.push(`${path}: material desconocido ${id}`); };
  const inRange = (name, value, path) => {
    const p = parameters.get(name);
    if (!p) errors.push(`${path}: parámetro desconocido ${name}`);
    else if (value < p.range[0] || value > p.range[1]) errors.push(`${path}: ${name} fuera de rango`);
  };
  const children = new Map(document.entities.map(e => [e.id, []]));
  const roots = document.entities.filter(e => e.parent === null);
  if (roots.length !== 1) errors.push('entities: se requiere una raíz única');
  for (const e of document.entities) {
    if (e.parent !== null) {
      has(entities, e.parent, `entities.${e.id}.parent`);
      children.get(e.parent)?.push(e.id);
    }
    if (e.geometry) {
      if (!Object.hasOwn(geometries, e.geometry)) errors.push(`entities.${e.id}: geometría desconocida ${e.geometry}`);
      else if (geometries[e.geometry].kind === 'parametric' && !e.material) errors.push(`entities.${e.id}: falta material`);
    } else if (e.material) errors.push(`entities.${e.id}: material sin geometría`);
    if (e.material) hasMaterial(e.material, `entities.${e.id}`);
  }
  // Recorrido iterativo: admite padres declarados después de sus hijos.
  const reached = new Set();
  const queue = roots.map(e => e.id);
  for (let i = 0; i < queue.length; i++) {
    if (reached.has(queue[i])) continue;
    reached.add(queue[i]); queue.push(...children.get(queue[i]) ?? []);
  }
  if (reached.size !== entities.size) errors.push('entities: ciclo de padres o entidad desconectada');
  for (const [id, geometry] of Object.entries(geometries)) {
    if (geometry.kind === 'asset') continue; // Reserva válida; carga .glb fuera de esta fase.
    const factory = Object.hasOwn(factories, geometry.factory) && factories[geometry.factory];
    if (!factory?.schema || typeof factory.create !== 'function') { errors.push(`geometries.${id}: fábrica no registrada ${geometry.factory}`); continue; }
    let validator = factoryValidators.get(factory);
    if (!validator) { validator = ajv.compile(factory.schema); factoryValidators.set(factory, validator); }
    if (!validator(geometry.params)) errors.push(...validator.errors.map(e => `geometries.${id}.params${e.instancePath}: ${e.message}`));
    else errors.push(...(factory.check?.(geometry.params) ?? []).map(e => `geometries.${id}: ${e}`));
  }
  const allBindings = [];
  for (const p of document.parameters) {
    if (p.range[0] >= p.range[1]) errors.push(`parameters.${p.name}: rango vacío o invertido`);
    inRange(p.name, p.value, 'parameters');
    if (p.step && p.step > p.range[1] - p.range[0]) errors.push(`parameters.${p.name}: paso mayor que el rango`);
    for (const b of p.bindings) {
      allBindings.push(b);
      has(entities, b.entity, `bindings.${b.id}`);
      for (const name of [...b.gains ?? [], ...[b.phaseParameter, b.amplitudeParameter].filter(Boolean)]) has(parameters, name, `bindings.${b.id}`);
      if (b.kind === 'LINEAR' && (b.gains?.length || b.phaseParameter || b.amplitudeParameter)) errors.push(`bindings.${b.id}: LINEAR solo admite scale, offset y combine`);
      if (b.kind === 'PHASE' && !/^(rotation\.|data\.)/.test(b.channel)) errors.push(`bindings.${b.id}: PHASE requiere rotation o data`);
      if (b.channel.startsWith('data.')) {
        const key = b.channel.slice(5);
        if (unsafe.has(key) || typeof entities.get(b.entity)?.data?.[key] !== 'number') errors.push(`bindings.${b.id}: el canal data debe existir y ser numérico`);
      }
      if (b.channel.startsWith('scale.')) {
        const axis = 'xyz'.indexOf(b.channel.at(-1));
        const e = entities.get(b.entity);
        const assembled = e?.transform.assembled.scale?.[axis] ?? 1;
        const exploded = e?.transform.exploded.scale?.[axis] ?? assembled;
        let minimum, maximum;
        if (b.kind === 'LINEAR') {
          const ends=p.range.map(v => v * b.scale + (b.offset ?? 0));
          minimum=Math.min(...ends);maximum=Math.max(...ends);
        }
        if (b.kind === 'SINE') {
          const a = b.amplitudeParameter ? parameters.get(b.amplitudeParameter) : null;
          const amplitude = Math.abs(b.amplitude ?? 1) * (a ? Math.max(...a.range.map(Math.abs)) : 1);
          minimum = (b.bias ?? 0) - amplitude;
          maximum = (b.bias ?? 0) + amplitude;
        }
        // El paso sustituye la pose antes del binding; el fallo visual se aplica al final.
        // El rango del parámetro cubre también sus efectos de fallo válidos.
        const contexts=[null,...document.steps];
        for(const step of contexts){
          const override=step?.state?.entities?.find(state=>state.id===b.entity)?.scale?.[axis];
          const low=override??Math.min(assembled,exploded),high=override??Math.max(assembled,exploded);
          const effectiveMin=minimum+(b.combine==='add'?low:0),effectiveMax=maximum+(b.combine==='add'?high:0);
          if(minimum!==undefined&&(!Number.isFinite(effectiveMin)||!Number.isFinite(effectiveMax)||effectiveMin<=0)){
            errors.push(`bindings.${b.id}${step?` / steps.${step.id}`:''}: podría producir escala no positiva o no finita`);break;
          }
        }
      }
    }
  }
  unique(allBindings, 'id', 'bindings');
  const channels = new Set();
  for (const b of allBindings) {
    const key = `${b.entity}/${b.channel}`;
    if (channels.has(key)) errors.push(`bindings: más de una relación escribe ${key}`);
    channels.add(key);
  }
  for (const s of document.steps) {
    const visible = new Set();
    const pending = [...s.visible];
    for (const id of s.visible) has(entities, id, `steps.${s.id}.visible`);
    for (let i = 0; i < pending.length; i++) {
      if (visible.has(pending[i])) continue;
      visible.add(pending[i]); pending.push(...children.get(pending[i]) ?? []);
    }
    if (s.selection) {
      has(entities, s.selection, `steps.${s.id}.selection`);
      if (entities.get(s.selection)?.selectable === false) errors.push(`steps.${s.id}: selección no seleccionable`);
      if (!visible.has(s.selection)) errors.push(`steps.${s.id}: selección fuera de visible`);
    }
    const { camera } = s;
    if (camera.position.every((v, i) => v === camera.target[i])) errors.push(`steps.${s.id}: cámara y objetivo coinciden`);
    if ((camera.far ?? 200) <= (camera.near ?? 0.05)) errors.push(`steps.${s.id}: far debe superar near`);
    unique(s.state?.entities ?? [], 'id', `steps.${s.id}.state`);
    for (const e of s.state?.entities ?? []) {
      has(entities, e.id, `steps.${s.id}.state`);
      if (e.material) {
        hasMaterial(e.material, `steps.${s.id}.state`);
        if (!entities.get(e.id)?.geometry) errors.push(`steps.${s.id}: un material requiere una entidad con geometría`);
      }
      for (const b of allBindings) if (b.entity === e.id && b.channel.startsWith('data.')) {
        const key = b.channel.slice(5);
        if (e.data && Object.hasOwn(e.data, key) && typeof e.data[key] !== 'number') errors.push(`steps.${s.id}: ${b.channel} debe seguir siendo numérico`);
      }
    }
    for (const [name, value] of Object.entries(s.state?.parameters ?? {})) inRange(name, value, `steps.${s.id}`);
    if (s.prediction) {
      const options = unique(s.prediction.options, 'id', `steps.${s.id}.prediction`);
      has(options, s.prediction.answer, `steps.${s.id}.prediction.answer`);
    }
  }
  for (const f of document.faults) {
    for (const e of f.visualEffects) {
      has(entities, e.entity, `faults.${f.id}`);
      if (e.material) {
        hasMaterial(e.material, `faults.${f.id}`);
        if (!entities.get(e.entity)?.geometry) errors.push(`faults.${f.id}: un material requiere una entidad con geometría`);
      }
    }
    for (const e of f.parameterEffects) {
      has(parameters, e.name, `faults.${f.id}`);
      if (e.operation === 'set') inRange(e.name, e.value, `faults.${f.id}`);
    }
  }
  if (errors.length) throw new VGEValidationError(errors);
  return document;
}
