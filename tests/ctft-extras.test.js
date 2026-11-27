import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateCTFTData } from '../js/math-engine.js';
import { BUILTIN_CTFT_PRESETS } from '../js/presets.js';
import {
  CTFT_MODES, applyCTFTProperty, clampModeValue, complexX,
  inverseCTFT, bandEnergyFraction, reconstructionCurve
} from '../js/ctft-extras.js';

const close = (a, b, tol) => Math.abs(a - b) < tol;

/** X(ω) por integração direta de fnTime, para conferir as propriedades sem usar as próprias regras. */
function numericX(fn, w, tMin = -30, tMax = 30, n = 60000) {
  const dt = (tMax - tMin) / n;
  let re = 0;
  let im = 0;
  for (let i = 0; i < n; i++) {
    const t = tMin + (i + 0.5) * dt;
    const x = fn(t);
    if (x === 0) continue;
    re += x * Math.cos(w * t);
    im -= x * Math.sin(w * t);
  }
  return { re: re * dt, im: im * dt };
}

const rect = () => calculateCTFTData('rect', 2.0, 1.0, 4.0);
const expo = () => calculateCTFTData('exp', 2.0, 1.0, 4.0);
const tri = () => calculateCTFTData('tri', 1.0, 1.0, 4.0);

test('CTFT: novos pares gaussiana e sinc batem com a integral e com Parseval', () => {
  const g = calculateCTFTData('gauss', 1.5, 1.0, 4.0);
  for (const w of [0, 0.8, 2.5]) {
    const num = numericX(g.fnTime, w, -12, 12, 24000);
    assert.ok(close(num.re, g.fnMag(w), 1e-6) && close(num.im, 0, 1e-6), `gauss w=${w}`);
  }
  assert.ok(close(g.energyTime, 1.5 / Math.SQRT2, 1e-12));
  assert.ok(Math.abs(g.energyFreq - g.energyTime) / g.energyTime < 1e-3);

  // sinc(Wt) <-> (pi/W) rect(w/2W): dual do pulso retangular
  for (const W of [0.5, 2.0, 3.25, 5.0]) {
    const s = calculateCTFTData('sinc', W, 1.0, 4.0);
    assert.ok(close(s.fnMag(0.5 * W), Math.PI / W, 1e-12));
    assert.equal(s.fnMag(1.5 * W), 0);
    assert.ok(close(s.fnTime(0), 1, 1e-12));
    assert.ok(close(s.energyTime, Math.PI / W, 1e-12));
    assert.ok(Math.abs(s.energyFreq - s.energyTime) / s.energyTime < 1e-2, `sinc W=${W}: Ef=${s.energyFreq}`);
  }
  assert.ok(BUILTIN_CTFT_PRESETS.gauss && BUILTIN_CTFT_PRESETS.sinc);
});

test('CTFT propriedades: deslocamento no tempo muda so a fase', () => {
  for (const base of [rect(), expo()]) {
    const y = applyCTFTProperty(base, 'shift', 1.3);
    for (const w of [0.4, 1.7, -2.2]) {
      const num = numericX(y.fnTime, w);
      const m = y.fnMag(w);
      const p = y.fnPhase(w);
      assert.ok(close(num.re, m * Math.cos(p), 2e-3) && close(num.im, m * Math.sin(p), 2e-3), `${base.presetKey} w=${w}`);
      assert.ok(close(m, base.fnMag(w), 1e-12), 'magnitude invariante');
    }
    assert.equal(y.energyTime, base.energyTime);
  }
});

test('CTFT propriedades: escala comprime o tempo e alarga o espectro', () => {
  for (const base of [rect(), expo(), tri()]) {
    for (const a of [0.5, 2.0]) {
      const y = applyCTFTProperty(base, 'scale', a);
      for (const w of [0.4, 1.7, -2.2]) {
        const num = numericX(y.fnTime, w, -40, 40, 80000);
        const m = y.fnMag(w);
        const p = y.fnPhase(w);
        assert.ok(close(num.re, m * Math.cos(p), 2e-3) && close(num.im, m * Math.sin(p), 2e-3), `${base.presetKey} a=${a} w=${w}`);
      }
      assert.ok(close(y.energyTime, base.energyTime / a, 1e-12));
      assert.ok(close(y.valX0, base.valX0 / a, 1e-12));
      assert.equal(y.effect, a > 1 ? 'compress' : 'expand');
    }
  }
});

test('CTFT propriedades: modulacao desloca o espectro para +-w0 com metade da altura', () => {
  for (const base of [rect(), expo(), tri()]) {
    const y = applyCTFTProperty(base, 'mod', 6.0);
    for (const w of [0, 5.2, 6.0, -6.8]) {
      const num = numericX(y.fnTime, w);
      const m = y.fnMag(w);
      const p = y.fnPhase(w);
      assert.ok(close(num.re, m * Math.cos(p), 2e-3) && close(num.im, m * Math.sin(p), 2e-3), `${base.presetKey} w=${w}`);
    }
    // Energia: 1/2 E_x + 1/2 ∫ x² cos(2 w0 t) dt, conferida pela integral direta
    let e = 0;
    const dt = 60 / 120000;
    for (let i = 0; i < 120000; i++) e += y.fnTime(-30 + (i + 0.5) * dt) ** 2 * dt;
    assert.ok(close(y.energyTime, e, 2e-3), `${base.presetKey}: energia`);
  }
  // Pico em w0 ~ metade de X(0) quando as duas copias nao se sobrepoem
  const y = applyCTFTProperty(tri(), 'mod', 12);
  assert.ok(close(y.fnMag(12), 0.5 * tri().fnMag(0), 1e-2));
});

test('CTFT inversa: a sintese limitada em banda converge para x(t)', () => {
  const t1 = tri();
  for (const t of [0, 0.3, 0.8, 1.5]) {
    // A cauda de sinc² além de W = 30 ainda carrega ~2% no vértice
    assert.ok(close(inverseCTFT(t1, t, 30), t1.fnTime(t), 2.5e-2), `tri t=${t}`);
  }
  const e1 = expo();
  assert.ok(close(inverseCTFT(e1, 1.0, 30, 3000), Math.exp(-1), 1.5e-2));
  // Na descontinuidade a sintese passa pelo ponto medio
  assert.ok(close(inverseCTFT(rect(), 1.0, 30, 3000), 0.5, 2e-2));
  assert.ok(close(inverseCTFT(e1, 0, 30, 3000), 0.5, 2e-2));
  // Erro cai quando a banda aumenta
  const errNarrow = Math.abs(inverseCTFT(t1, 0, 2) - 1);
  const errWide = Math.abs(inverseCTFT(t1, 0, 20) - 1);
  assert.ok(errWide < errNarrow / 5);
  // Gibbs: o sobressinal do retangulo fica perto de 9% para qualquer banda larga
  const r = rect();
  let peak = 0;
  for (let i = 0; i <= 400; i++) peak = Math.max(peak, inverseCTFT(r, (i / 400) * 1.0, 25, 1500));
  assert.ok(peak > 1.07 && peak < 1.11, `pico de Gibbs = ${peak}`);
});

test('CTFT inversa: fracao de energia na banda e cache da curva', () => {
  const r = rect();
  // Lobulo principal do sinc (|w| <= 2pi/tau) guarda ~90,3% da energia
  assert.ok(close(bandEnergyFraction(r, Math.PI), 0.9028, 2e-3));
  assert.ok(bandEnergyFraction(r, 30) > 0.985);
  assert.ok(bandEnergyFraction(r, 2) < bandEnergyFraction(r, 6));
  const a = reconstructionCurve(r, 6, -5, 5, 180);
  assert.equal(reconstructionCurve(r, 6, -5, 5, 180), a);
  assert.notEqual(reconstructionCurve(r, 7, -5, 5, 180), a);
  assert.equal(a.length, 181);
});

test('CTFT extras: modos, limites e textos', () => {
  assert.deepEqual(CTFT_MODES, ['none', 'shift', 'scale', 'mod', 'inverse']);
  assert.equal(clampModeValue('shift', 99), 3);
  assert.equal(clampModeValue('scale', 0), 0.25);
  assert.equal(clampModeValue('mod', undefined), 6);
  assert.equal(clampModeValue('none', 3), 0);
  assert.equal(applyCTFTProperty(rect(), 'none', 1), null);
  assert.equal(applyCTFTProperty(rect(), 'shift', 1).labelTime, 'x(t - 1)');
  assert.equal(applyCTFTProperty(rect(), 'shift', -1.5).labelTime, 'x(t + 1.5)');
  assert.equal(applyCTFTProperty(rect(), 'scale', 2).labelTime, 'x(2t)');
  const c = complexX(expo(), 1);
  assert.ok(close(c.re, 0.5, 1e-12) && close(c.im, -0.5, 1e-12)); // 1/(1 + j)
});

test('CTFT propriedades: escala negativa reflete o sinal e espelha o espectro', () => {
  const base = expo(); // assimetrico: a reflexao muda o sinal de verdade
  for (const a of [-1, -2, -0.5]) {
    const y = applyCTFTProperty(base, 'scale', a);
    assert.ok(close(y.fnTime(-0.5), base.fnTime(-0.5 * a), 1e-12));
    for (const w of [0.4, 1.7, -2.2]) {
      const num = numericX(y.fnTime, w, -40, 40, 80000);
      const m = y.fnMag(w);
      const p = y.fnPhase(w);
      assert.ok(close(num.re, m * Math.cos(p), 2e-3) && close(num.im, m * Math.sin(p), 2e-3), `a=${a} w=${w}`);
    }
    assert.ok(close(y.energyTime, base.energyTime / Math.abs(a), 1e-12));
    assert.equal(y.effect, 'reflect');
  }
  assert.equal(applyCTFTProperty(base, 'scale', -2).labelTime, 'x(-2t)');
  // Perto de zero o valor salta para +-0,25 (x(0·t) nao e um sinal de energia)
  assert.equal(clampModeValue('scale', 0.1), 0.25);
  assert.equal(clampModeValue('scale', -0.1), -0.25);
  assert.equal(clampModeValue('scale', -9), -3);
});
