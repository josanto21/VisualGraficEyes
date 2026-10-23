const assert = require('node:assert/strict');

// Se cuentan oraciones del texto común, sin sumar títulos, valores ni capas opcionales.
const sentences = new Intl.Segmenter('es', {granularity:'sentence'});
function measureContent({text, labels}, context) {
  const sentenceCount = [...sentences.segment(text.trim())]
    .filter(({segment}) => /[\p{L}\p{N}]/u.test(segment)).length;
  const labelCount = labels.length;
  assert.ok(sentenceCount > 0, `${context}: explicación vacía`);
  assert.ok(sentenceCount <= 2, `${context}: ${sentenceCount} frases; máximo 2`);
  assert.ok(labelCount <= 2, `${context}: ${labelCount} etiquetas visibles; máximo 2`);
  return {sentenceCount, labelCount};
}

module.exports = {measureContent};
