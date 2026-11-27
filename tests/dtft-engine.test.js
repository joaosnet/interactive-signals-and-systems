import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DTFT_PRESETS, calculateDTFTData, numericDTFT, spectralEnergy, wrapOmega
} from '../js/dtft-engine.js';

const dist = (a, b) => Math.hypot(a.re - b.re, a.im - b.im);
const regular = Object.keys(DTFT_PRESETS).filter((k) => k !== 'cos');

test('DTFT: toda forma fechada bate com a soma direta', () => {
  for (const key of regular) {
    const d = calculateDTFTData(key);
    // O passa-baixas ideal decai como 1/n: precisa de mais termos e de tolerancia maior
    const N = d.slowDecay ? 20000 : 400;
    const tol = d.slowDecay ? 5e-3 : 1e-9;
    for (const w of [0, 0.4, 1.7, -2.6, 3.0]) {
      const exact = d.evalX(w);
      const num = numericDTFT(d.fnSeq, w, N);
      assert.ok(dist(exact, num) < tol, `${key} em W=${w}: exato=${JSON.stringify(exact)} num=${JSON.stringify(num)}`);
    }
  }
});

test('DTFT: formas fechadas valem em toda a faixa do parametro', () => {
  for (const key of regular.filter((k) => DTFT_PRESETS[k].param && !DTFT_PRESETS[k].build(1).slowDecay)) {
    const spec = DTFT_PRESETS[key].param;
    for (const p of [spec.min, spec.max]) {
      const d = calculateDTFTData(key, p);
      for (const w of [0, 0.9, -2.2]) {
        assert.ok(dist(d.evalX(w), numericDTFT(d.fnSeq, w, 600)) < 1e-9, `${key} p=${p} W=${w}`);
      }
    }
  }
});

test('DTFT: espectro periodico em 2pi e com simetria conjugada (sequencias reais)', () => {
  for (const key of regular) {
    const d = calculateDTFTData(key);
    for (const w of [0.3, 1.1, 2.9]) {
      assert.ok(dist(d.evalX(w), d.evalX(w + 2 * Math.PI)) < 1e-9, `${key}: periodo`);
      assert.ok(dist(d.evalX(w), d.evalX(w - 4 * Math.PI)) < 1e-9, `${key}: periodo`);
      const pos = d.evalX(w);
      const neg = d.evalX(-w);
      assert.ok(Math.abs(pos.re - neg.re) < 1e-12 && Math.abs(pos.im + neg.im) < 1e-12, `${key}: X(-W) = X*(W)`);
    }
  }
  assert.ok(Math.abs(wrapOmega(3 * Math.PI + 0.2) - (-Math.PI + 0.2)) < 1e-12);
  assert.ok(Math.abs(wrapOmega(-0.5) + 0.5) < 1e-12);
});

test('DTFT: Parseval — energia no tempo igual a energia no espectro', () => {
  for (const key of regular) {
    const d = calculateDTFTData(key);
    const spectral = spectralEnergy(d);
    assert.ok(Math.abs(spectral - d.energy) / d.energy < 2e-3, `${key}: tempo=${d.energy} espectro=${spectral}`);
  }
  // E a energia declarada confere com a soma direta de |x[n]|²
  for (const key of regular.filter((k) => k !== 'sinc')) {
    const d = calculateDTFTData(key);
    let e = 0;
    for (let n = -500; n <= 500; n++) e += d.fnSeq(n) ** 2;
    assert.ok(Math.abs(e - d.energy) < 1e-9, key);
  }
  assert.equal(calculateDTFTData('cos').energy, Infinity);
});

test('DTFT: a soma parcial converge para a forma fechada', () => {
  const rect = calculateDTFTData('rect', 3);
  assert.ok(dist(rect.partialSum(0.8, 3), rect.evalX(0.8)) < 1e-12); // N >= M ja e exata
  assert.ok(dist(rect.partialSum(0.8, 1), rect.evalX(0.8)) > 0.1);
  const exp = calculateDTFTData('exp', 0.7);
  const e5 = dist(exp.partialSum(1, 5), exp.evalX(1));
  const e40 = dist(exp.partialSum(1, 40), exp.evalX(1));
  assert.ok(e40 < 1e-5 && e5 > 100 * e40);
  // Gibbs: perto da borda do passa-baixas a soma parcial passa de 1 em ~9%
  const lp = calculateDTFTData('sinc', 1);
  let peak = 0;
  for (let i = 0; i <= 400; i++) peak = Math.max(peak, lp.partialSum((i / 400) * 1, 40).re);
  assert.ok(peak > 1.07 && peak < 1.11, `pico de Gibbs = ${peak}`);
});

test('DTFT: cosseno tem espectro de impulsos e pares viram filtros', () => {
  const c = calculateDTFTData('cos', 1.2);
  assert.equal(c.isImpulsive, true);
  assert.deepEqual(c.impulses, [{ omega: 1.2, area: Math.PI }, { omega: -1.2, area: Math.PI }]);
  assert.equal(c.filterType, null);
  assert.equal(calculateDTFTData('movavg').filterType, 'lowpass');
  assert.equal(calculateDTFTData('exp', 0.7).filterType, 'lowpass');
  assert.equal(calculateDTFTData('exp', -0.7).filterType, 'highpass');
  assert.equal(calculateDTFTData('diff').filterType, 'highpass');
  assert.equal(calculateDTFTData('delta').filterType, 'allpass');
  // Media movel: ganho 1 em W = 0 e zero em W = 2pi/M
  const ma = calculateDTFTData('movavg', 4);
  assert.ok(Math.abs(ma.mag(0) - 1) < 1e-12);
  assert.ok(ma.mag(Math.PI / 2) < 1e-12);
  assert.ok(Number.isNaN(ma.phase(Math.PI / 2)));
  // Fase linear: -W (M-1)/2
  assert.ok(Math.abs(ma.phase(0.4) + 0.4 * 1.5) < 1e-12);
});

test('DTFT: parametros limitados a faixa e LaTeX dos pares', () => {
  assert.equal(calculateDTFTData('rect', 99).param, 8);
  assert.equal(calculateDTFTData('rect', 2.6).param, 3);
  assert.equal(calculateDTFTData('exp', -5).param, -0.9);
  assert.equal(calculateDTFTData('diff', 3).param, null);
  assert.equal(calculateDTFTData('inexistente').presetKey, 'rect');
  assert.equal(calculateDTFTData('rect', 2).latexX, String.raw`\frac{\sin(2.5\,\Omega)}{\sin(\Omega/2)}`);
  assert.equal(calculateDTFTData('exp', 0.7).latexX, String.raw`\frac{1}{1 - 0.7\,e^{-j\Omega}}`);
  assert.equal(calculateDTFTData('exp', -0.5).latexX, String.raw`\frac{1}{1 + 0.5\,e^{-j\Omega}}`);
  assert.equal(calculateDTFTData('exp', -0.5).latexTime, String.raw`(-0.5)^{n}\,u[n]`);
  assert.equal(calculateDTFTData('rect', 2).peakMag, 5);
});
