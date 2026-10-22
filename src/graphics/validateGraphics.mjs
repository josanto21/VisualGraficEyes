import Ajv2020 from 'ajv/dist/2020.js';
import { VGEValidationError } from '../validate.mjs';
const id = { type: 'string', pattern: '^[A-Za-z][A-Za-z0-9_.-]*$' };
const vec3 = { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 };
const positive = { type: 'number', exclusiveMinimum: 0 };
const color = { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' };
const object = (properties, required) => ({ type: 'object', properties, required, additionalProperties: false });
export const graphicsSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema', $id: 'urn:vge:graphics:2.0.0',
  ...object({
    schemaVersion: { const: '2.0.0' },
    selection: object({ mode: { enum: ['auto', 'outline', 'emissive'] }, color, width: { type: 'number', minimum: 0.5, maximum: 6 }, maxOutlineMeshes: { type: 'integer', minimum: 1, maximum: 128 }, initialEntity: id }, ['mode', 'color', 'width', 'maxOutlineMeshes']),
    clipping: object({ anchor: id, entities: { type: 'array', items: id, minItems: 1, uniqueItems: true }, normal: vec3, range: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 }, amount: { type: 'number', minimum: 0, maximum: 1 }, label: { type: 'string' }, description: { type: 'string' } }, ['anchor', 'entities', 'normal', 'range', 'amount', 'label', 'description']),
    field: object({ anchor: id, origin: vec3, sources: { type: 'array', minItems: 2, maxItems: 4, items: object({ entity: id, channel: { type: 'string', pattern: '^data\\.[A-Za-z][A-Za-z0-9_]*$' }, axis: vec3, coefficient: { type: 'number' }, color, label: { type: 'string' } }, ['entity', 'channel', 'axis', 'coefficient', 'color', 'label']) }, resultantColor: color, scale: positive, referenceRadius: positive, maxLength: positive, visible: { type: 'boolean' }, showSources: { type: 'boolean' }, emphasis: positive, trail: object({ samples: { type: 'integer', minimum: 4, maximum: 64 }, arc: { type: 'number', exclusiveMinimum: 0, maximum: 3.14 }, opacity: { type: 'number', minimum: 0, maximum: 1 } }, ['samples', 'arc', 'opacity']), label: { type: 'string' }, description: { type: 'string' } }, ['anchor', 'origin', 'sources', 'resultantColor', 'scale', 'referenceRadius', 'maxLength', 'visible', 'label', 'description']),
  }, ['schemaVersion', 'selection']),
};
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(graphicsSchema);
export function validateGraphics(config, document) {
  if (!validate(config)) throw new VGEValidationError(validate.errors.map(e => `graphics${e.instancePath}: ${e.message}`));
  const errors = [], entities = new Map(document.entities.map(e => [e.id, e]));
  const known = (id, path) => { if (!entities.has(id)) errors.push(`${path}: entidad desconocida ${id}`); };
  const unit = (v, path) => { if (Math.abs(Math.hypot(...v) - 1) > 1e-6) errors.push(`${path}: se requiere un vector unitario`); };
  if (config.selection.initialEntity) {
    known(config.selection.initialEntity, 'graphics.selection.initialEntity');
    if (entities.get(config.selection.initialEntity)?.selectable === false) errors.push('graphics.selection.initialEntity: entidad no seleccionable');
  }
  if (config.clipping) {
    const c = config.clipping; known(c.anchor, 'graphics.clipping.anchor'); unit(c.normal, 'graphics.clipping.normal');
    for (const id of c.entities) known(id, 'graphics.clipping.entities');
    if (c.range[0] >= c.range[1]) errors.push('graphics.clipping.range: rango vacío o invertido');
  }
  if (config.field) {
    known(config.field.anchor, 'graphics.field.anchor');
    for (const source of config.field.sources) {
      known(source.entity, 'graphics.field.sources'); unit(source.axis, 'graphics.field.sources.axis');
      const key = source.channel.slice(5);
      if (['__proto__', 'constructor', 'prototype'].includes(key) || typeof entities.get(source.entity)?.data?.[key] !== 'number') errors.push(`graphics.field: ${source.entity}.${source.channel} debe ser numérico`);
      for (const s of document.steps) {
        const override = s.state?.entities?.find(e => e.id === source.entity)?.data;
        if (override && Object.hasOwn(override, key) && typeof override[key] !== 'number') errors.push(`steps.${s.id}: el canal de campo ${key} debe seguir siendo numérico`);
      }
    }
  }
  if (errors.length) throw new VGEValidationError(errors);
  return config;
}
export const defaultGraphics = Object.freeze({ schemaVersion: '2.0.0', selection: { mode: 'auto', color: '#F2F6FF', width: 2.3, maxOutlineMeshes: 12 } });
