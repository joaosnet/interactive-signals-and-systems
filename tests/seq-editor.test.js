import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSequence, parseStart, formatSequence } from '../js/seq-parse.js';
import { calculateDConvData } from '../js/dconv-engine.js';
import { calculateDTFTData, numericDTFT, spectralEnergy } from '../js/dtft-engine.js';
import { calculateDFTData } from '../js/dft-engine.js';

const close = (a, b, tol = 1e-9) => Math.abs(a - b) < tol;

test('Sequencia digitada: separadores, fracoes e decimal com virgula', () => {
  assert.deepEqual(parseSequence('1, 2, 3'), { ok: true, values: [1, 2, 3] });
  assert.deepEqual(parseSequence('1 2   3'), { ok: true, values: [1, 2, 3] });
  assert.deepEqual(parseSequence('0,5; 1,5; 2'), { ok: true, values: [0.5, 1.5, 2] });
  assert.deepEqual(parseSequence('{1, -1}'), { ok: true, values: [1, -1] });
  assert.deepEqual(parseSequence('1, 2,'), { ok: true, values: [1, 2] });
  const frac = parseSequence('1/3, -1/2, 1e-1, .5');
  assert.ok(frac.ok && close(frac.values[0], 1 / 3) && frac.values[1] === -0.5 && close(frac.values[2], 0.1) && frac.values[3] === 0.5);
  assert.equal(formatSequence([1, 1 / 3, -2]), '1, 0.3333, -2');
  assert.equal(parseStart('-3'), -3);
  assert.equal(parseStart('99'), 10);
  assert.equal(parseStart('abc'), 0);
});

test('Sequencia digitada: erros claros e nada e executado como codigo', () => {
  assert.deepEqual(parseSequence(''), { ok: false, error: 'empty' });
  assert.deepEqual(parseSequence('  ,  '), { ok: false, error: 'empty' });
  assert.equal(parseSequence('1, dois, 3').error, 'invalid');
  assert.equal(parseSequence('1, dois, 3').item, 'dois');
  assert.equal(parseSequence('1,,2').error, 'invalid');
  assert.equal(parseSequence('1/0').error, 'invalid');
  assert.equal(parseSequence('1/2/3').error, 'invalid');
  assert.equal(parseSequence('5000').error, 'range');
  assert.equal(parseSequence('1 2 3 4 5', { maxLen: 4 }).error, 'long');
  for (const evil of ['alert(1)', '1; process.exit()', 'Math.PI', '0x10', '1+1', 'Infinity', 'NaN']) {
    assert.equal(parseSequence(evil).ok, false, evil);
  }
});

test('Convolucao discreta com sequencias do aluno', () => {
  const d = calculateDConvData('custom', { x: { start: -1, values: [1, 2, 1] }, h: { start: 2, values: [1, -1] } });
  assert.equal(d.presetKey, 'custom');
  assert.deepEqual(d.y, { start: 1, values: [1, 1, -1, -1] });
  assert.equal(d.yAt(2), 1);
  assert.ok(close(d.sumY, d.sumX * d.sumH));
  for (let n = d.nMin; n <= d.nMax; n++) assert.ok(close(d.productAt(n).sum, d.yAt(n)), `n=${n}`);
  assert.ok(d.kMin <= -1 && d.kMax >= 1);
  assert.match(d.latexX, /underset/); // a seta marca n = 0
  // Sem dados do aluno, 'custom' cai no exemplo padrao
  assert.equal(calculateDConvData('custom').presetKey, 'rect_rect');
});

test('DTFT de uma sequencia do aluno: soma direta, Parseval e texto', () => {
  const seq = { start: -1, values: [1, 2, 1] };
  const d = calculateDTFTData('custom', null, seq);
  assert.equal(d.presetKey, 'custom');
  assert.equal(d.param, null);
  for (const w of [0, 0.7, -2.1, 3.1]) {
    // {1, 2, 1} centrada: X = 2 + 2cos(W), real
    const v = d.evalX(w);
    assert.ok(close(v.re, 2 + 2 * Math.cos(w)) && close(v.im, 0), `w=${w}`);
    const num = numericDTFT(d.fnSeq, w, 20);
    assert.ok(close(num.re, v.re) && close(num.im, v.im));
  }
  assert.equal(d.energy, 6);
  assert.ok(Math.abs(spectralEnergy(d) - 6) < 1e-6);
  assert.equal(d.filterType, 'lowpass');
  assert.equal(d.latexX, String.raw`e^{j\Omega} + 2 + e^{-j\Omega}`);
  assert.equal(calculateDTFTData('custom', null, { start: 0, values: [1, -1] }).filterType, 'highpass');
  assert.notEqual(d.signature, calculateDTFTData('custom', null, { start: 0, values: [1, 2, 1] }).signature);
  assert.equal(calculateDTFTData('custom').presetKey, 'rect');
});

test('DFT de amostras do aluno: N minimo e zero-padding', () => {
  const samples = [1, 2, 3, 4, 5];
  const d = calculateDFTData('custom', 2, 'rect', samples);
  assert.equal(d.presetKey, 'custom');
  assert.equal(d.N, 8);           // menor potencia de 2 que cabe 5 amostras
  assert.equal(d.minBits, 3);
  assert.equal(d.zeroPadded, 3);
  assert.deepEqual(d.rawX, [1, 2, 3, 4, 5, 0, 0, 0]);
  assert.ok(close(d.re[0], 15));
  assert.ok(d.fftError < 1e-10);
  // Zero-padding: mais pontos da MESMA DTFT (os bins antigos reaparecem nos pares)
  const padded = calculateDFTData('custom', 4, 'rect', samples);
  assert.equal(padded.N, 16);
  for (let k = 0; k < 8; k++) assert.ok(close(padded.mag[2 * k], d.mag[k], 1e-9), `k=${k}`);
  assert.equal(calculateDFTData('custom', 4, 'rect', []).presetKey, 'cosbin');
  assert.equal(calculateDFTData('cosbin', 4).zeroPadded, 0);
});
