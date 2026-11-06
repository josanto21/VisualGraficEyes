/* Comprobación del Bloque D: el verificador detecta lo que debe y no inventa fallos. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const {verifyPage} = require('./verify-page.cjs');
const root = path.resolve(__dirname, '..'), out = path.resolve(process.env.VGE_QA_DIR || path.join(root, 'out/qa-block-d'));
const fixtures = path.join(root, 'tests/fixtures/verify');

(async () => {
  fs.mkdirSync(out, {recursive:true});
  const results = [];
  const run = async (id, fn) => {
    try { const detail = await fn(); results.push({id, status:'PASS', ...detail}); console.log('PASS ' + id); }
    catch (error) { results.push({id, status:'FAIL', message:error.message}); console.error('FAIL ' + id + ': ' + error.message); }
  };
  await run('D-verificador-pagina-buena', async () => {
    const r = await verifyPage(path.join(fixtures, 'bien.html'), {artifact:true, widths:[390, 1280], themes:['claro', 'oscuro'], out:path.join(out, 'bien')});
    assert.equal(r.estado, 'PASA', JSON.stringify(r.resumen));
    assert.equal(r.resumen.fallas, 0);
    assert.ok(r.cdnDesdeNodeModules.some(u => u.includes('three@0.180.0')), 'three no se sirvió desde node_modules');
    assert.ok(r.recorrido.some(c => /\+ 2 etapas/.test(c.contexto)), 'el recorrido no pulsó las etapas');
    assert.equal(r.comprobaciones.length, 4, 'faltan combinaciones de ancho y tema');
    return {estado:r.estado, navegador:r.navegador, comprobaciones:r.comprobaciones.length + r.recorrido.length};
  });
  await run('D-verificador-pagina-mala', async () => {
    const r = await verifyPage(path.join(fixtures, 'mal.html'), {artifact:true, widths:[390], themes:['claro'], tour:false, out:path.join(out, 'mal')});
    assert.equal(r.estado, 'FALLA');
    for (const code of ['desbordamiento', 'control-pequeno', 'error-consola', 'csp', 'fondo-transparente', 'decimales-mezclados']) {
      assert.ok(r.resumen.codigos.includes(code), `no detectó ${code}: ${r.resumen.codigos.join(', ')}`);
    }
    return {estado:r.estado, codigos:r.resumen.codigos};
  });
  await run('D-doctor-plan', async () => {
    const {doctor} = await import('../src/core/doctor.mjs');
    const {plan} = await doctor({root, network:false});
    assert.ok(['LISTO', 'PREPARABLE', 'BLOQUEADO'].includes(plan.verificacion.estado));
    assert.deepEqual(Object.keys(plan.modos), ['ANATOMÍA', 'LABORATORIO', 'ANIMADO-PASOS', 'VIDEO-ESCENAS', 'ESCENA 3D', 'MAPA', 'DATOS']);
    for (const m of Object.values(plan.modos)) assert.ok(m.estado === 'LISTO' || m.alternativa, 'un modo sin alternativa');
    return {verificacion:plan.verificacion.estado, modos:Object.fromEntries(Object.entries(plan.modos).map(([k, v]) => [k, v.estado]))};
  });
  fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify({fecha:new Date().toISOString(), results}, null, 2) + '\n');
  if (results.some(r => r.status !== 'PASS')) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
