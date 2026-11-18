import test from 'node:test';
import assert from 'node:assert/strict';

import {
  compileSignalExpr,
  validateSignalExpression,
  exprToLatex,
  latexToExpr,
  integrateSimpson,
  detectSupportAndRegions,
  calculateFourierData,
  calculateCTFTData
} from '../js/math-engine.js';

import {
  BUILTIN_CONV_PRESETS,
  BUILTIN_FOURIER_PRESETS,
  BUILTIN_CTFT_PRESETS
} from '../js/presets.js';

test('compileSignalExpr implementa convencao UFPA/Lathi (u(0)=0.5, sinc=sin(x)/x, sincpi, tri, rect)', () => {
  const fnU = compileSignalExpr('u(t)');
  assert.equal(fnU(-0.5), 0);
  assert.equal(fnU(0), 0.5);
  assert.equal(fnU(0.5), 1);

  const fnSinc = compileSignalExpr('sinc(t)');
  assert.equal(fnSinc(0), 1);
  assert.ok(Math.abs(fnSinc(Math.PI)) < 1e-6);
  assert.ok(Math.abs(fnSinc(Math.PI / 2) - 2 / Math.PI) < 1e-6);

  const fnSincPi = compileSignalExpr('sincpi(t)');
  assert.equal(fnSincPi(0), 1);
  assert.ok(Math.abs(fnSincPi(1)) < 1e-6);

  const fnTri = compileSignalExpr('tri(t)');
  assert.equal(fnTri(0), 1);
  assert.equal(fnTri(0.5), 0.5);
  assert.equal(fnTri(-0.5), 0.5);
  assert.equal(fnTri(1.2), 0);

  const fnRect = compileSignalExpr('rect(t)');
  assert.equal(fnRect(0.49), 1);
  assert.equal(fnRect(0.51), 0);

  const bad = validateSignalExpression('e^(');
  assert.equal(bad.valid, false);
  const empty = validateSignalExpression('');
  assert.equal(empty.valid, false);
});

test('exprToLatex e latexToExpr preservam avaliacao em round-trip e simplificam reflexao', () => {
  const cases = [
    'e^(-2*t)*u(t)',
    '2*(u(t+1)-u(t)) - 2*(u(t)-u(t-1))',
    'sinc(2*t - 2) * (u(t) - u(t-2))',
    'sincpi(t) * rect(t/2)',
    'r(t) - 2*r(t-1) + r(t-2)',
    'cos(2*pi*t)*rect(t/4)'
  ];

  for (const expr of cases) {
    const ltx = exprToLatex(expr, 't');
    const back = latexToExpr(ltx);
    const fn1 = compileSignalExpr(expr);
    const fn2 = compileSignalExpr(back);
    for (let t = -2.5; t <= 3.5; t += 0.37) {
      assert.ok(
        Math.abs(fn1(t) - fn2(t)) < 1e-6,
        `Divergencia em round-trip de "${expr}" -> "${ltx}" -> "${back}" em t=${t}`
      );
    }
  }

  const refl = exprToLatex('e^(-t)*u(t)', '(-\\tau)');
  assert.ok(!refl.includes('-(-\\tau)'), `Dupla negacao nao simplificada: ${refl}`);
});

test('Convolucao: presets batem com solucao analitica, comutam e nao truncam suporte semi-infinito', () => {
  const testTimes = [-0.5, 0.4, 1.1, 1.8, 2.5, 3.3, 4.2];
  for (const [key, p] of Object.entries(BUILTIN_CONV_PRESETS)) {
    for (const t of testTimes) {
      const yAnalytical = p.conv(t);
      const yNum = integrateSimpson(p.fnX, p.fnH, t);
      const yComm = integrateSimpson(p.fnH, p.fnX, t);
      assert.ok(
        Math.abs(yNum - yAnalytical) < 0.04,
        `Preset ${key} em t=${t}: analitico=${yAnalytical}, numerico=${yNum}`
      );
      assert.ok(
        Math.abs(yNum - yComm) < 0.03,
        `Comutatividade falhou em ${key} t=${t}: ${yNum} vs ${yComm}`
      );
    }
  }

  // Filtragem de impulso delta(t - 1) sem jitter
  const fnRect = compileSignalExpr('rect(t/2)');
  const fnDelta = compileSignalExpr('delta(t-1)');
  for (let t = 0.25; t <= 1.75; t += 0.15) {
    const y = integrateSimpson(fnRect, fnDelta, t);
    assert.ok(Math.abs(y - 1.0) < 0.02, `Jitter em delta em t=${t}: y=${y}`);
  }
  assert.ok(Math.abs(integrateSimpson(fnRect, fnDelta, -0.5)) < 1e-4);
  assert.ok(Math.abs(integrateSimpson(fnRect, fnDelta, 2.5)) < 1e-4);

  // Suporte semi-infinito nao deve gerar falso ramo final y(t) = 0
  const fnExp = compileSignalExpr('e^(-2*t)*u(t)');
  const fnPulse = compileSignalExpr('u(t) - u(t-3)');
  const detExpPulse = detectSupportAndRegions(fnExp, fnPulse);
  assert.equal(detExpPulse.supportX[1], Infinity);
  assert.deepEqual(detExpPulse.supportH, [0, 3]);
  const lastRegion = detExpPulse.regions[detExpPulse.regions.length - 1];
  assert.ok(!lastRegion.latex.includes('y(t) = 0'), `Falso ramo nulo ao final: ${lastRegion.latex}`);

  const fnStep = compileSignalExpr('u(t)');
  const detExpStep = detectSupportAndRegions(fnExp, fnStep);
  assert.equal(detExpStep.regions.length, 2);
  assert.ok(!detExpStep.regions[1].latex.includes('y(t) = 0'));
});

test('Serie de Fourier: simetrias dos presets (pulse_train=even) e sinais centrados na origem', () => {
  const expectedSym = {
    square: 'quarter_odd',
    sawtooth: 'odd',
    triangular: 'quarter_even',
    half_wave: 'none',
    full_wave: 'even',
    pulse_train: 'even',
    sinc_train: 'even'
  };

  for (const [key, p] of Object.entries(BUILTIN_FOURIER_PRESETS)) {
    const c = calculateFourierData(p.expr, p.T0, p.N);
    assert.equal(c.symmetryType, expectedSym[key], `Simetria incorreta em ${key}: ${c.symmetryType}`);
    assert.ok(c.efficiency > 90, `Eficiencia inesperadamente baixa em ${key}: ${c.efficiency}`);
  }

  const pulse = calculateFourierData(BUILTIN_FOURIER_PRESETS.pulse_train.expr, 2.0, 7);
  assert.ok(Math.abs(pulse.a0 - 0.25) < 0.005);
  assert.ok(Math.abs(pulse.harmonics[0].bn) < 1e-4, `bn nao nulo para sinal par: ${pulse.harmonics[0].bn}`);

  // Sinal centrado rect(t) em [-T0/2, T0/2)
  const rectC = calculateFourierData('rect(t)', 2.0, 7);
  assert.ok(Math.abs(rectC.a0 - 0.5) < 0.005, `a0 errado para rect(t) centrado: ${rectC.a0}`);
  assert.equal(rectC.fPeriodic(-0.25), 1);
  assert.equal(rectC.fPeriodic(0.75), 0);
  assert.equal(rectC.symmetryType, 'even');
});

test('CTFT: identidade de Parseval (<1%), tri unificado, bridge e sinal de X(0)', () => {
  for (const [key, p] of Object.entries(BUILTIN_CTFT_PRESETS)) {
    const tau = p.tau0 || 2.0;
    const a = p.a || 1.0;
    const T0 = p.defaultT0 || 4.0;
    const c = calculateCTFTData(key, tau, a, T0, p.expr);
    const relErr = Math.abs(c.energyTime - c.energyFreq) / c.energyTime;
    assert.ok(
      relErr < 0.01,
      `Erro Parseval >= 1% no preset CTFT "${key}": Et=${c.energyTime}, Ef=${c.energyFreq}, err=${relErr}`
    );
  }

  const tri2 = calculateCTFTData('tri', 2.0, 1.0, 4.0);
  assert.ok(Math.abs(tri2.energyTime - (4 / 3)) < 1e-6);
  assert.ok(Math.abs(tri2.valX0 - 2.0) < 1e-6);
  assert.ok(Math.abs(tri2.energyTime - tri2.energyFreq) / tri2.energyTime < 0.01);

  const bridge = calculateCTFTData('bridge', 1.0, 1.0, 8.0);
  assert.equal(bridge.fnTime(8.0), 1);
  assert.equal(bridge.fnTime(4.0), 0);
  assert.ok(bridge.bridgeHarmonics.length >= 5);

  const customRect = calculateCTFTData('custom_ctft', 2.0, 1.0, 4.0, 'rect(t/2)');
  assert.ok(Math.abs(customRect.energyTime - customRect.energyFreq) / customRect.energyTime < 0.01);
  assert.ok(customRect.valX0 > 1.9);

  const customNeg = calculateCTFTData('custom_ctft', 2.0, 1.0, 4.0, '-rect(t/2)');
  assert.ok(customNeg.valX0 < -1.9);
  assert.ok(Math.abs(Math.abs(customNeg.fnPhase(0)) - Math.PI) < 0.01);
});
