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
  calculateCTFTData,
  formatSymbolic,
  makeConvolver,
  isZeroRegion
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

test('Parser: potencia de funcao, menos unario, notacao cientifica e whitelist de identificadores', () => {
  const val = (expr, t) => {
    const r = validateSignalExpression(expr);
    assert.ok(r.valid, `"${expr}" deveria ser valida`);
    return r.fn(t);
  };
  const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} != ${b}`);

  near(val('sin(t)^2', 1), Math.sin(1) ** 2, 'sin(t)^2');
  near(val('cos(t)^2*rect(t/4)', 1), Math.cos(1) ** 2, 'cos(t)^2*rect(t/4)');
  near(val('u(t)^2', 1), 1, 'u(t)^2');
  near(val('(t-1)^2', 3), 4, '(t-1)^2');
  near(val('-t^2', 2), -4, '-t^2 = -(t^2)');
  near(val('t^-2', 2), 0.25, 't^-2');
  near(val('2*-t', 2), -4, '2*-t');
  near(val('2e^(-2t)u(t)', 1), 2 * Math.exp(-2), '2e^(-2t)u(t)');
  near(val('1e-3*t', 0.7), 0.0007, '1e-3*t (notacao cientifica)');

  for (const evil of ['(globalThis.__pwn=1)', 't.constructor', 'alert(1)', 't;t', 'window', '`x`']) {
    assert.equal(validateSignalExpression(evil).valid, false, `"${evil}" deveria ser rejeitada`);
  }
  assert.equal(globalThis.__pwn, undefined);
});

test('formatSymbolic: formas com pi tem prioridade sobre fracoes de denominador grande', () => {
  assert.equal(formatSymbolic(2 / Math.PI), String.raw`\frac{2}{\pi}`);
  assert.equal(formatSymbolic(1 / Math.PI), String.raw`\frac{1}{\pi}`);
  assert.equal(formatSymbolic(4 / Math.PI), String.raw`\frac{4}{\pi}`);
  assert.equal(formatSymbolic(Math.PI / 2), String.raw`\frac{\pi}{2}`);
  assert.equal(formatSymbolic(1 / 3), String.raw`\frac{1}{3}`);
  assert.equal(formatSymbolic(-1 / 6), String.raw`-\frac{1}{6}`);
  assert.equal(formatSymbolic(5 / 12), String.raw`\frac{5}{12}`);
  assert.equal(formatSymbolic(2), '2');
});

test('Convolucao custom: sinais longe da origem, suporte alem de 10 e regiao nula', () => {
  const conv = (ex, eh) => {
    const fx = compileSignalExpr(ex);
    const fh = compileSignalExpr(eh);
    const auto = detectSupportAndRegions(fx, fh);
    return { auto, y: makeConvolver(fx, fh, auto.supportX, auto.supportH) };
  };

  // rect(t-12) * rect(t+12) = tri(t): antes dava y(0) = 0 por causa da janela fixa
  const far = conv('rect(t-12)', 'rect(t+12)');
  assert.ok(Math.abs(far.y(0) - 1) < 0.02, `y(0)=${far.y(0)}`);
  assert.ok(Math.abs(far.y(0.5) - 0.5) < 0.02, `y(0.5)=${far.y(0.5)}`);
  assert.ok(Math.abs(far.y(2)) < 1e-6);

  const wide = conv('u(t)-u(t-12)', 'rect(t)');
  assert.ok(Math.abs(wide.auto.supportX[1] - 12) < 0.06, `suporte=${wide.auto.supportX}`);
  assert.ok(Math.abs(wide.y(11) - 1) < 0.02);

  // Semi-infinito continua correto: e^{-t}u(t) * u(t) = (1 - e^{-t})u(t)
  const semi = conv('e^(-t)u(t)', 'u(t)');
  assert.equal(semi.auto.supportX[1], Infinity);
  assert.ok(Math.abs(semi.y(2) - (1 - Math.exp(-2))) < 0.01, `y(2)=${semi.y(2)}`);

  assert.equal(isZeroRegion({ latex: String.raw`y(t) = 0 \quad (\text{Sem sobreposição})` }), true);
  assert.equal(isZeroRegion({ latex: 'y(t) = 0' }), true);
  assert.equal(isZeroRegion({ latex: 'y(t) = 0.5t' }), false);
  assert.equal(isZeroRegion({ latex: String.raw`y(t) = \int_{0}^{t} x(\tau)h(t-\tau)\,d\tau` }), false);
});

test('CTFT: Parseval com cauda (<0.2% em todo o slider de a), truncamento sinalizado e pulso-base da ponte', () => {
  for (const a of [0.5, 1, 2, 4, 5]) {
    const c = calculateCTFTData('exp', 2.0, a, 4.0);
    const relErr = Math.abs(c.energyTime - c.energyFreq) / c.energyTime;
    assert.ok(relErr < 0.002, `exp a=${a}: err=${relErr}`);
  }
  for (const tau of [0.5, 1, 2, 4]) {
    const c = calculateCTFTData('rect', tau, 1.0, 6.0);
    const relErr = Math.abs(c.energyTime - c.energyFreq) / c.energyTime;
    assert.ok(relErr < 0.002, `rect tau=${tau}: err=${relErr}`);
  }

  assert.equal(calculateCTFTData('custom_ctft', 2, 1, 4, 'u(t)').isTruncated, true);
  assert.equal(calculateCTFTData('custom_ctft', 2, 1, 4, 'cos(t)').isTruncated, true);
  assert.equal(calculateCTFTData('custom_ctft', 2, 1, 4, 'rect(t/2)').isTruncated, false);
  assert.equal(calculateCTFTData('custom_ctft', 2, 1, 4, 'e^(-2t)u(t)').isTruncated, false);

  const bridge = calculateCTFTData('bridge', 2.0, 1.0, 8.0);
  assert.ok(!bridge.latexTime.includes('sum'), 'x(t) da ponte deve ser o pulso-base');
  assert.ok(bridge.latexPeriodic.includes('sum'));
});
