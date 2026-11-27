import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLaplaceCustom, buildZCustom, expandConj, laplaceRocOptions, zRocOptions, rocText
} from '../js/pz-engine.js';
import { calculateLaplaceData, numericLaplace } from '../js/laplace-engine.js';
import { calculateZData, numericZ } from '../js/z-engine.js';

const close = (a, b, tol = 1e-9) => Math.abs(a - b) < tol;

test('Polos e zeros: conjugados implicitos e regioes de convergencia', () => {
  assert.deepEqual(expandConj([{ re: -1, im: 2 }, { re: 3, im: 0 }]), [{ re: -1, im: 2 }, { re: -1, im: -2 }, { re: 3, im: 0 }]);
  assert.deepEqual(laplaceRocOptions([{ re: -2, im: 0 }, { re: 1, im: 3 }]), [
    { min: -Infinity, max: -2 }, { min: -2, max: 1 }, { min: 1, max: Infinity }
  ]);
  assert.deepEqual(zRocOptions([{ re: 0.5, im: 0 }, { re: 0, im: 2 }]), [
    { min: -Infinity, max: 0.5 }, { min: 0.5, max: 2 }, { min: 2, max: Infinity }
  ]);
  // Polo na origem tira z = 0 da ROC, mas nao cria um anel novo
  assert.deepEqual(zRocOptions([{ re: 0, im: 0 }]), [{ min: 0, max: Infinity }]);
  assert.equal(rocText({ min: -2, max: 1 }, 's'), '-2 < Re{s} < 1');
  assert.equal(rocText({ min: 0.5, max: Infinity }, 'z'), '|z| > 0.5');
  assert.equal(rocText({ min: -Infinity, max: 0.5 }, 'z'), '|z| < 0.5');
});

test('Laplace do aluno: reproduz os pares conhecidos', () => {
  // 1/(s+1), causal → e^{-t}u(t)
  const one = buildLaplaceCustom({ poles: [{ re: -1, im: 0 }], zeros: [], gain: 1 });
  assert.equal(one.ok, true);
  assert.equal(one.built.causality, 'causal');
  assert.ok(close(one.built.fnTime(1), Math.exp(-1)) && one.built.fnTime(-1) === 0 && close(one.built.fnTime(0), 0.5));
  assert.equal(one.built.latexX, String.raw`\frac{1}{(s + 1)}`);
  assert.equal(one.built.latexTime, String.raw`e^{-t}\,u(t)`);
  // Mesma X(s), ROC a esquerda → -e^{-t}u(-t)
  const anti = buildLaplaceCustom({ poles: [{ re: -1, im: 0 }], zeros: [], gain: 1, rocIndex: 0 });
  assert.equal(anti.built.causality, 'anticausal');
  assert.ok(close(anti.built.fnTime(-1), -Math.E) && anti.built.fnTime(1) === 0);
  // 3/((s+1)²+9) → e^{-t} sen(3t) u(t)
  const damped = buildLaplaceCustom({ poles: [{ re: -1, im: 3 }], zeros: [], gain: 3 });
  for (const t of [0.2, 0.7, 1.9]) assert.ok(close(damped.built.fnTime(t), Math.exp(-t) * Math.sin(3 * t), 1e-9), `t=${t}`);
  assert.equal(damped.built.latexX, String.raw`\frac{3}{(s^2 + 2s + 10)}`);
  // (s+1)/((s+1)²+9) → e^{-t} cos(3t) u(t)
  const dcos = buildLaplaceCustom({ poles: [{ re: -1, im: 3 }], zeros: [{ re: -1, im: 0 }], gain: 1 });
  for (const t of [0.2, 0.7, 1.9]) assert.ok(close(dcos.built.fnTime(t), Math.exp(-t) * Math.cos(3 * t), 1e-9), `t=${t}`);
});

test('Laplace do aluno: qualquer montagem valida bate com a integral numerica na ROC', () => {
  const custom = { poles: [{ re: -2, im: 0 }, { re: 1, im: 2 }], zeros: [{ re: 0, im: 0 }], gain: 2 };
  for (const rocIndex of [0, 1, 2]) {
    const data = calculateLaplaceData('custom', 0, 0, { ...custom, rocIndex });
    assert.equal(data.presetKey, 'custom');
    assert.equal(data.rocIndex, rocIndex);
    const sigma = Number.isFinite(data.roc.min) && Number.isFinite(data.roc.max)
      ? (data.roc.min + data.roc.max) / 2
      : (Number.isFinite(data.roc.min) ? data.roc.min + 1 : data.roc.max - 1);
    for (const omega of [0, 1.3, -2.7]) {
      const exact = data.evalX(sigma, omega);
      const num = numericLaplace(data.fnTime, sigma, omega);
      const err = Math.hypot(exact.re - num.re, exact.im - num.im);
      assert.ok(err / Math.max(1, Math.hypot(exact.re, exact.im)) < 5e-3, `roc=${rocIndex} s=${sigma}+j${omega}: ${JSON.stringify(exact)} vs ${JSON.stringify(num)}`);
    }
  }
  // Estabilidade segue a ROC escolhida: so a faixa que contem o eixo jw e estavel
  assert.equal(calculateLaplaceData('custom', 0, 0, { ...custom, rocIndex: 1 }).stability, 'stable');
  assert.equal(calculateLaplaceData('custom', 0, 0, { ...custom, rocIndex: 2 }).stability, 'unstable');
  assert.equal(calculateLaplaceData('custom', 0, 0, { ...custom, rocIndex: 1 }).causality, 'bilateral');
});

test('Laplace do aluno: montagens invalidas sao recusadas e o motor cai no par padrao', () => {
  assert.deepEqual(buildLaplaceCustom({ poles: [], zeros: [] }), { ok: false, error: 'nopole' });
  assert.equal(buildLaplaceCustom({ poles: [{ re: -1, im: 0 }], zeros: [{ re: 0, im: 0 }] }).error, 'improper');
  assert.equal(buildLaplaceCustom({ poles: [{ re: -1, im: 0 }, { re: -1.02, im: 0 }], zeros: [] }).error, 'repeated');
  assert.equal(calculateLaplaceData('custom', 1, 2, { poles: [] }).presetKey, 'exp');
  assert.equal(calculateLaplaceData('custom').presetKey, 'exp');
  // Ganho nulo ou invalido vira 1; listas longas sao cortadas
  assert.equal(buildLaplaceCustom({ poles: [{ re: -1, im: 0 }], gain: 0 }).built.gain, 1);
  assert.equal(buildLaplaceCustom({ poles: [1, 2, 3, 4, 5, 6].map((k) => ({ re: -k, im: 0 })) }).built.poles.length, 4);
});

test('Z do aluno: reproduz os pares conhecidos pela integral de inversao', () => {
  // z/(z-0.8), |z| > 0.8 → 0.8^n u[n]
  const causal = buildZCustom({ poles: [{ re: 0.8, im: 0 }], zeros: [{ re: 0, im: 0 }], gain: 1 });
  assert.equal(causal.built.causality, 'causal');
  for (const n of [0, 1, 5, 12]) assert.ok(close(causal.built.fnSeq(n), 0.8 ** n, 1e-9), `n=${n}`);
  assert.equal(causal.built.fnSeq(-1), 0);
  assert.equal(causal.built.latexX, String.raw`\frac{z}{(z - 0.8)}`);
  // Mesma X(z), |z| < 0.8 → -0.8^n u[-n-1]
  const anti = buildZCustom({ poles: [{ re: 0.8, im: 0 }], zeros: [{ re: 0, im: 0 }], gain: 1, rocIndex: 0 });
  assert.equal(anti.built.causality, 'anticausal');
  for (const n of [-1, -2, -6]) assert.ok(close(anti.built.fnSeq(n), -(0.8 ** n), 1e-9), `n=${n}`);
  assert.equal(anti.built.fnSeq(0), 0);
  // Par conjugado r·e^{±jW}: z(z - r cos W)/(z² - 2 r cos W z + r²) → r^n cos(Wn) u[n]
  const r = 0.9;
  const W = 0.7;
  const osc = buildZCustom({
    poles: [{ re: r * Math.cos(W), im: r * Math.sin(W) }],
    zeros: [{ re: 0, im: 0 }, { re: r * Math.cos(W), im: 0 }],
    gain: 1
  });
  for (const n of [0, 1, 4, 9]) assert.ok(close(osc.built.fnSeq(n), r ** n * Math.cos(W * n), 1e-9), `n=${n}`);
  // Sem polos: FIR em potencias positivas de z (amostras em n <= 0)
  const fir = buildZCustom({ poles: [], zeros: [{ re: 0.5, im: 0 }], gain: 2 }); // 2(z - 0.5) = 2z - 1
  assert.equal(fir.built.causality, 'finite');
  assert.ok(close(fir.built.fnSeq(-1), 2) && close(fir.built.fnSeq(0), -1) && fir.built.fnSeq(1) === 0);
});

test('Z do aluno: bate com a soma direta na ROC e a estabilidade segue o anel', () => {
  const custom = { poles: [{ re: 0.5, im: 0 }, { re: 0, im: 1.5 }], zeros: [{ re: 0, im: 0 }, { re: -1, im: 0 }], gain: 1 };
  for (const rocIndex of [0, 1, 2]) {
    const data = calculateZData('custom', 0, 0, { ...custom, rocIndex });
    assert.equal(data.presetKey, 'custom');
    const lo = Math.max(0, data.roc.min);
    const rr = Number.isFinite(data.roc.max) ? (lo > 0 ? Math.sqrt(lo * data.roc.max) : data.roc.max / 2) : lo + 0.5;
    for (const om of [0.3, 1.3, -2.7]) {
      const re = rr * Math.cos(om);
      const im = rr * Math.sin(om);
      const exact = data.evalX(re, im);
      const num = numericZ(data.fnSeq, re, im, -120, 120);
      const err = Math.hypot(exact.re - num.re, exact.im - num.im);
      assert.ok(err / Math.max(1, Math.hypot(exact.re, exact.im)) < 1e-5, `roc=${rocIndex} |z|=${rr}: ${JSON.stringify(exact)} vs ${JSON.stringify(num)}`);
    }
  }
  assert.equal(calculateZData('custom', 0, 0, { ...custom, rocIndex: 1 }).stability, 'stable');   // 0.5 < |z| < 1.5
  assert.equal(calculateZData('custom', 0, 0, { ...custom, rocIndex: 2 }).stability, 'unstable'); // |z| > 1.5
  assert.equal(buildZCustom({ poles: [], zeros: [] }).error, 'empty');
  assert.equal(buildZCustom({ poles: [{ re: 1, im: 0 }, { re: 1.03, im: 0 }], zeros: [], rocIndex: 1 }).error, 'repeated');
  assert.equal(buildZCustom({ poles: [{ re: 1, im: 0 }, { re: 1.05, im: 0 }], zeros: [], rocIndex: 1 }).error, 'narrow');
  assert.equal(calculateZData('custom', 0.8, 0.8, { poles: [], zeros: [] }).presetKey, 'exp');
});
