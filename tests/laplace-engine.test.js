import test from 'node:test';
import assert from 'node:assert/strict';

import { LAPLACE_PRESETS, calculateLaplaceData, numericLaplace } from '../js/laplace-engine.js';

// Ponto de teste dentro da ROC de cada par
function pointInROC(roc) {
  if (Number.isFinite(roc.min) && Number.isFinite(roc.max)) return (roc.min + roc.max) / 2;
  if (Number.isFinite(roc.min)) return roc.min + 1.0;
  return roc.max - 1.0;
}

test('Laplace: todo par analitico bate com a integral numerica dentro da ROC', () => {
  for (const key of Object.keys(LAPLACE_PRESETS)) {
    const spec = LAPLACE_PRESETS[key].params;
    const data = calculateLaplaceData(key, spec.a ? spec.a.def : 0, spec.w0 ? spec.w0.def : 0);
    const sigma = pointInROC(data.roc);
    for (const omega of [0, 1.3, -2.7]) {
      const exact = data.evalX(sigma, omega);
      const num = numericLaplace(data.fnTime, sigma, omega);
      const err = Math.hypot(exact.re - num.re, exact.im - num.im);
      const scale = Math.max(1, Math.hypot(exact.re, exact.im));
      assert.ok(err / scale < 5e-3, `${key} em s=${sigma}+j${omega}: exato=${JSON.stringify(exact)} num=${JSON.stringify(num)}`);
    }
  }
});

test('Laplace: mesma X(s), ROCs opostas para o par causal e o anticausal', () => {
  const causal = calculateLaplaceData('exp', 1);
  const anti = calculateLaplaceData('anticausal', 1);
  assert.deepEqual(causal.evalX(0.4, 1.1), anti.evalX(0.4, 1.1));
  assert.deepEqual(causal.roc, { min: -1, max: Infinity });
  assert.deepEqual(anti.roc, { min: -Infinity, max: -1 });
  assert.equal(causal.inROC(0), true);
  assert.equal(anti.inROC(0), false);
  assert.equal(anti.fnTime(1), 0);
  assert.ok(Math.abs(anti.fnTime(-1) + Math.E) < 1e-12);
});

test('Laplace: estabilidade e existencia de Fourier seguem a posicao do eixo jw na ROC', () => {
  assert.equal(calculateLaplaceData('exp', 1).stability, 'stable');
  assert.equal(calculateLaplaceData('exp', 1).hasFourier, true);
  // a < 0: exponencial crescente, polo no semiplano direito
  assert.equal(calculateLaplaceData('exp', -0.5).stability, 'unstable');
  assert.equal(calculateLaplaceData('exp', -0.5).hasFourier, false);
  // Polos sobre o eixo jw: marginal
  for (const key of ['step', 'cos', 'sin', 'ramp']) {
    assert.equal(calculateLaplaceData(key, 0, 2).stability, 'marginal', key);
    assert.equal(calculateLaplaceData(key, 0, 2).hasFourier, false, key);
  }
  assert.equal(calculateLaplaceData('exp', 0).stability, 'marginal');
  assert.equal(calculateLaplaceData('bilateral', 1).stability, 'stable');
  assert.equal(calculateLaplaceData('dampedsin', 0.5, 3).stability, 'stable');
  assert.equal(calculateLaplaceData('dampedsin', -0.5, 3).stability, 'unstable');
  // Anticausal estavel exige polo no semiplano DIREITO
  assert.equal(calculateLaplaceData('anticausal', -1).stability, 'stable');
  assert.equal(calculateLaplaceData('anticausal', 1).stability, 'unstable');
});

test('Laplace: X(jw) coincide com a transformada de Fourier conhecida quando ela existe', () => {
  const a = 1.5;
  const data = calculateLaplaceData('exp', a);
  for (const w of [0, 0.7, 3]) {
    // F{e^{-at}u(t)} = 1/(a + jw)
    assert.ok(Math.abs(data.mag(0, w) - 1 / Math.hypot(a, w)) < 1e-12);
  }
  const bi = calculateLaplaceData('bilateral', a);
  for (const w of [0, 0.7, 3]) {
    // F{e^{-a|t|}} = 2a/(a² + w²)
    const v = bi.evalX(0, w);
    assert.ok(Math.abs(v.re - (2 * a) / (a * a + w * w)) < 1e-12);
    assert.ok(Math.abs(v.im) < 1e-12);
  }
});

test('Laplace: parametros sao limitados a faixa do preset e o LaTeX acompanha o sinal de a', () => {
  assert.equal(calculateLaplaceData('exp', 99).a, 3);
  assert.equal(calculateLaplaceData('bilateral', -5).a, 0.3);
  assert.equal(calculateLaplaceData('inexistente').presetKey, 'exp');
  assert.equal(calculateLaplaceData('exp', 2).latexX, String.raw`\frac{1}{s + 2}`);
  assert.equal(calculateLaplaceData('exp', -1).latexX, String.raw`\frac{1}{s - 1}`);
  assert.equal(calculateLaplaceData('exp', 0).latexX, String.raw`\frac{1}{s}`);
  assert.equal(calculateLaplaceData('exp', 1).latexTime, 'e^{-t}u(t)');
  assert.equal(calculateLaplaceData('exp', -0.5).latexTime, 'e^{0.5t}u(t)');
  assert.equal(calculateLaplaceData('exp', 1).latexROC, String.raw`\operatorname{Re}\{s\} > -1`);
  assert.equal(calculateLaplaceData('bilateral', 2).latexROC, String.raw`-2 < \operatorname{Re}\{s\} < 2`);
});
