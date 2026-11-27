import test from 'node:test';
import assert from 'node:assert/strict';

import { Z_PRESETS, calculateZData, numericZ } from '../js/z-engine.js';

// Raio de teste dentro da ROC de cada par
function radiusInROC(roc) {
  const lo = Number.isFinite(roc.min);
  const hi = Number.isFinite(roc.max);
  if (lo && hi) return Math.sqrt(roc.min * roc.max);
  if (lo) return roc.min + 0.5;
  if (hi) return roc.max / 2;
  return 1;
}

function assertMatchesSum(data, label) {
  const r = radiusInROC(data.roc);
  for (const omega of [0.3, 1.3, -2.7]) {
    const re = r * Math.cos(omega);
    const im = r * Math.sin(omega);
    const exact = data.evalX(re, im);
    const num = numericZ(data.fnSeq, re, im);
    const err = Math.hypot(exact.re - num.re, exact.im - num.im);
    const scale = Math.max(1, Math.hypot(exact.re, exact.im));
    assert.ok(err / scale < 1e-6, `${label} em z=${r}∠${omega}: exato=${JSON.stringify(exact)} num=${JSON.stringify(num)}`);
  }
}

test('Z: todo par analitico bate com a soma numerica dentro da ROC', () => {
  for (const key of Object.keys(Z_PRESETS)) {
    const spec = Z_PRESETS[key].params;
    assertMatchesSum(calculateZData(key, spec.a?.def, spec.w0?.def), key);
  }
});

test('Z: pares continuam corretos nos extremos e com base negativa', () => {
  assertMatchesSum(calculateZData('exp', -0.8), 'exp a=-0.8');
  assertMatchesSum(calculateZData('exp', 1.5), 'exp a=1.5');
  assertMatchesSum(calculateZData('exp', 0), 'exp a=0');
  assertMatchesSum(calculateZData('anticausal', 1.8), 'anticausal a=1.8');
  assertMatchesSum(calculateZData('bilateral', 0.9), 'bilateral a=0.9');
  assertMatchesSum(calculateZData('dampedcos', 1.5, 2.9), 'dampedcos');
  assertMatchesSum(calculateZData('dampedsin', 0.3, 0.2), 'dampedsin');
  assertMatchesSum(calculateZData('cos', 0, 2.0), 'cos w0=2');
});

test('Z: mesma X(z), ROCs opostas para o par causal e o anticausal', () => {
  const causal = calculateZData('exp', 0.8);
  const anti = calculateZData('anticausal', 0.8);
  assert.deepEqual(causal.evalX(0.4, 1.1), anti.evalX(0.4, 1.1));
  assert.deepEqual(causal.roc, { min: 0.8, max: Infinity });
  assert.deepEqual(anti.roc, { min: -Infinity, max: 0.8 });
  assert.equal(causal.inROC(1), true);
  assert.equal(anti.inROC(1), false);
  assert.equal(anti.inROC(0), true); // a origem pertence a ROC do anticausal
  assert.equal(anti.fnSeq(0), 0);
  assert.ok(Math.abs(anti.fnSeq(-1) + 1 / 0.8) < 1e-12);
});

test('Z: estabilidade e existencia da DTFT seguem a posicao do circulo unitario na ROC', () => {
  assert.equal(calculateZData('exp', 0.8).stability, 'stable');
  assert.equal(calculateZData('exp', -0.8).stability, 'stable');
  assert.equal(calculateZData('exp', 0.8).hasDTFT, true);
  assert.equal(calculateZData('exp', 1.2).stability, 'unstable');
  assert.equal(calculateZData('exp', 1.2).hasDTFT, false);
  // Polos sobre o circulo unitario: marginal
  for (const key of ['step', 'cos', 'sin', 'ramp']) {
    assert.equal(calculateZData(key, 0, 0.8).stability, 'marginal', key);
    assert.equal(calculateZData(key, 0, 0.8).hasDTFT, false, key);
  }
  assert.equal(calculateZData('exp', 1).stability, 'marginal');
  assert.equal(calculateZData('exp', -1).stability, 'marginal');
  assert.equal(calculateZData('delta').stability, 'stable');
  assert.equal(calculateZData('bilateral', 0.6).stability, 'stable');
  assert.equal(calculateZData('dampedsin', 0.8, 0.8).stability, 'stable');
  assert.equal(calculateZData('dampedsin', 1.2, 0.8).stability, 'unstable');
  // Anticausal estavel exige polo FORA do circulo unitario
  assert.equal(calculateZData('anticausal', 1.5).stability, 'stable');
  assert.equal(calculateZData('anticausal', 0.8).stability, 'unstable');
});

test('Z: X(e^{jW}) coincide com a DTFT conhecida quando ela existe', () => {
  const a = 0.7;
  const data = calculateZData('exp', a);
  for (const w of [0, 0.7, 3]) {
    // DTFT{a^n u[n]} = 1/(1 - a e^{-jW})  =>  |X| = 1/sqrt(1 - 2a cos W + a²)
    assert.ok(Math.abs(data.magPolar(1, w) - 1 / Math.sqrt(1 - 2 * a * Math.cos(w) + a * a)) < 1e-12);
  }
  const bi = calculateZData('bilateral', a);
  for (const w of [0, 0.7, 3]) {
    // DTFT{a^{|n|}} = (1 - a²)/(1 - 2a cos W + a²), real e positiva
    const v = bi.evalX(Math.cos(w), Math.sin(w));
    assert.ok(Math.abs(v.re - (1 - a * a) / (1 - 2 * a * Math.cos(w) + a * a)) < 1e-12);
    assert.ok(Math.abs(v.im) < 1e-12);
  }
});

test('Z: parametros sao limitados a faixa do preset e o LaTeX acompanha o sinal de a', () => {
  assert.equal(calculateZData('exp', 99).a, 1.5);
  assert.equal(calculateZData('bilateral', -5).a, 0.5);
  assert.equal(calculateZData('inexistente').presetKey, 'exp');
  assert.equal(calculateZData('exp', 0.8).latexX, String.raw`\frac{z}{z - 0.8}`);
  assert.equal(calculateZData('exp', -0.5).latexX, String.raw`\frac{z}{z + 0.5}`);
  assert.equal(calculateZData('exp', 0).latexX, '1');
  assert.equal(calculateZData('exp', 0.8).latexTime, String.raw`0.8^{n}\,u[n]`);
  assert.equal(calculateZData('exp', -0.5).latexTime, String.raw`(-0.5)^{n}\,u[n]`);
  assert.equal(calculateZData('exp', 0.8).latexROC, '|z| > 0.8');
  assert.equal(calculateZData('anticausal', 0.8).latexROC, '|z| < 0.8');
  assert.equal(calculateZData('bilateral', 0.5).latexROC, '0.5 < |z| < 2');
  assert.equal(calculateZData('delta').latexROC, String.raw`\forall\, z`);
  // cos(pi/2 n): o termo em z do denominador some
  assert.equal(calculateZData('cos', 0, Math.PI / 2).latexX, String.raw`\frac{z^2}{z^2 + 1}`);
  assert.equal(calculateZData('sin', 0, 0.8).latexX, String.raw`\frac{0.72\,z}{z^2 - 1.39z + 1}`);
});
