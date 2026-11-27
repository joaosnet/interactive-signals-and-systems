import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DCONV_PRESETS, DCONV_SIGNALS, calculateDConvData, convolveSeq, seqAt, seqEnd, seqLatex
} from '../js/dconv-engine.js';

const close = (a, b, tol = 1e-12) => Math.abs(a - b) < tol;

test('Convolucao discreta: retangulo * retangulo e um triangulo', () => {
  const d = calculateDConvData('rect_rect');
  assert.deepEqual(d.y, { start: 0, values: [1, 2, 3, 2, 1] });
  assert.equal(d.lengthY, d.lengthX + d.lengthH - 1);
  assert.equal(d.yAt(-1), 0);
  assert.equal(d.yAt(5), 0);
});

test('Convolucao discreta: impulso e identidade, impulso deslocado atrasa', () => {
  const id = calculateDConvData('identity');
  assert.deepEqual(id.y.values, DCONV_SIGNALS.ramp4.values);
  assert.equal(id.y.start, 0);
  const delay = calculateDConvData('delay');
  assert.deepEqual(delay.y.values, DCONV_SIGNALS.ramp4.values);
  assert.equal(delay.y.start, 2);
});

test('Convolucao discreta: comutativa, e a soma de y e o produto das somas', () => {
  for (const key of Object.keys(DCONV_PRESETS)) {
    const d = calculateDConvData(key);
    const swapped = convolveSeq(d.h, d.x);
    assert.equal(swapped.start, d.y.start, key);
    swapped.values.forEach((v, i) => assert.ok(close(v, d.y.values[i]), `${key} i=${i}`));
    assert.ok(close(d.sumY, d.sumX * d.sumH, 1e-9), `${key}: soma`);
  }
});

test('Convolucao discreta: productAt reproduz y[n] em todo o percurso do slider', () => {
  for (const key of Object.keys(DCONV_PRESETS)) {
    const d = calculateDConvData(key);
    for (let n = d.nMin; n <= d.nMax; n++) {
      const { terms, sum } = d.productAt(n);
      assert.ok(close(sum, d.yAt(n)), `${key} n=${n}`);
      const range = d.overlapRange(n);
      if (!range) assert.equal(terms.length, 0, `${key} n=${n}`);
      else assert.equal(terms.length, range.hi - range.lo + 1, `${key} n=${n}`);
    }
    // Fora do suporte de y nao ha sobreposicao
    assert.equal(d.overlapRange(d.yStart - 1), null, key);
    assert.ok(d.kMin <= d.x.start && d.kMax >= d.xEnd, key);
  }
});

test('Convolucao discreta: retangulo * exponencial bate com a forma fechada', () => {
  const d = calculateDConvData('rect_exp');
  const a = 0.7;
  assert.equal(d.infinite, true);
  for (let n = 0; n <= d.yEnd; n++) {
    // y[n] = sum_{k=0}^{min(n,4)} a^{n-k}
    const exact = n <= 4
      ? (1 - a ** (n + 1)) / (1 - a)
      : a ** (n - 4) * (1 - a ** 5) / (1 - a);
    assert.ok(close(d.yAt(n), exact, 1e-9), `n=${n}`);
  }
});

test('Convolucao discreta: media movel, diferenca e eco', () => {
  const avg = calculateDConvData('average');
  // y[3] = (x[1] + x[2] + x[3]) / 3
  assert.ok(close(avg.yAt(3), (1 + 0.6 + 1.3) / 3));
  const diff = calculateDConvData('difference');
  assert.deepEqual(diff.y, { start: 0, values: [1, 0, 0, 0, 0, -1] });
  const echo = calculateDConvData('echo');
  assert.deepEqual(echo.y.values, [0.25, 0.5, 0.75, 1, 0.125, 0.25, 0.375, 0.5]);
});

test('Convolucao discreta: utilitarios de sequencia e LaTeX', () => {
  const s = { start: -1, values: [2, 3, 4] };
  assert.equal(seqEnd(s), 1);
  assert.equal(seqAt(s, -2), 0);
  assert.equal(seqAt(s, 0), 3);
  assert.equal(seqLatex(s), String.raw`\{2,\,\underset{\uparrow}{3},\,4\}`);
  assert.equal(seqLatex({ start: 2, values: [1, 1] }), String.raw`\{1,\,1\}_{\;n \ge 2}`);
  assert.equal(calculateDConvData('inexistente').presetKey, 'rect_rect');
  assert.equal(calculateDConvData('rect_rect').latexY, String.raw`\{\underset{\uparrow}{1},\,2,\,3,\,2,\,1\}`);
});
