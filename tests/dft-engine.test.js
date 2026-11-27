import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DFT_PRESETS, calculateDFTData, dftNaive, fft, ifft, bitReverse
} from '../js/dft-engine.js';

const close = (a, b, tol = 1e-9) => Math.abs(a - b) < tol;

test('FFT: mesma resposta da soma direta em todos os sinais e tamanhos', () => {
  for (const key of Object.keys(DFT_PRESETS)) {
    for (let bits = 2; bits <= 6; bits++) {
      const d = calculateDFTData(key, bits);
      assert.equal(d.N, 2 ** bits);
      assert.ok(d.fftError < 1e-10, `${key} N=${d.N}: erro ${d.fftError}`);
    }
  }
});

test('FFT: custo N/2·log2(N) borboletas contra N² da soma direta', () => {
  for (let bits = 2; bits <= 6; bits++) {
    const d = calculateDFTData('cosbin', bits);
    assert.equal(d.naiveMults, d.N * d.N);
    assert.equal(d.butterflies, (d.N / 2) * bits);
    assert.equal(d.stages, bits);
    assert.ok(close(d.speedup, (2 * d.N) / bits));
  }
  assert.throws(() => fft([1, 2, 3]));
});

test('FFT: inversa recupera a sequencia e bitReverse e uma involucao', () => {
  const x = [0.3, -1.2, 2, 0.5, 0, 1, -0.7, 4];
  const X = fft(x);
  const back = ifft(X.re, X.im);
  x.forEach((v, n) => {
    assert.ok(close(back.re[n], v, 1e-12), `n=${n}`);
    assert.ok(close(back.im[n], 0, 1e-12), `n=${n}`);
  });
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map((i) => bitReverse(i, 3)), [0, 4, 2, 6, 1, 5, 3, 7]);
  for (let i = 0; i < 32; i++) assert.equal(bitReverse(bitReverse(i, 5), 5), i);
  const naive = dftNaive(x);
  naive.re.forEach((v, k) => assert.ok(close(v, X.re[k], 1e-12) && close(naive.im[k], X.im[k], 1e-12)));
});

test('DFT: cosseno no bin da duas linhas limpas; fora do bin vaza', () => {
  const d = calculateDFTData('cosbin', 4);
  d.mag.forEach((m, k) => {
    assert.ok(close(m, k === 2 || k === 14 ? 8 : 0), `k=${k}: ${m}`);
  });
  assert.equal(d.leaks, false);
  assert.ok(Number.isNaN(d.phase[5]));

  const leak = calculateDFTData('leak', 4);
  assert.equal(leak.leaks, true);
  assert.ok(leak.mag.filter((m) => m > 0.1).length >= 14, 'energia espalhada por quase todos os bins');
  // Os dois bins vizinhos de 2.5 sao os maiores
  const order = leak.mag.slice(0, 8).map((m, k) => [m, k]).sort((a, b) => b[0] - a[0]);
  assert.deepEqual([order[0][1], order[1][1]].sort(), [2, 3]);
});

test('DFT: impulso, alternado, pulso e dois tons', () => {
  assert.ok(calculateDFTData('impulse', 3).mag.every((m) => close(m, 1)));
  const alt = calculateDFTData('alternating', 4);
  alt.mag.forEach((m, k) => assert.ok(close(m, k === 8 ? 16 : 0), `k=${k}`));
  assert.equal(alt.leaks, false);
  const rect = calculateDFTData('rect', 4);
  assert.ok(close(rect.re[0], 4)); // X[0] = soma das amostras
  assert.ok(close(rect.mag[4], 0)); // zero do Dirichlet em 2*pi/L
  const two = calculateDFTData('twotone', 5);
  assert.ok(close(two.mag[1], 16) && close(two.mag[3], 8) && close(two.mag[2], 0));
  assert.equal(two.leaks, null);
});

test('DFT: amostra a DTFT em 2*pi*k/N, tem simetria conjugada e obedece Parseval', () => {
  for (const key of Object.keys(DFT_PRESETS)) {
    const d = calculateDFTData(key, 4);
    for (let k = 0; k < d.N; k++) {
      assert.ok(close(d.envelope(d.binOmega(k)), d.mag[k], 1e-8), `${key} k=${k}: envoltoria`);
    }
    for (let k = 1; k < d.N; k++) {
      assert.ok(close(d.re[d.N - k], d.re[k]) && close(d.im[d.N - k], -d.im[k]), `${key} k=${k}: X[N-k] = X*[k]`);
    }
    assert.ok(close(d.energyTime, d.energyFreq, 1e-8), `${key}: Parseval`);
  }
});

test('DFT: parametros limitados e textos', () => {
  assert.equal(calculateDFTData('cosbin', 99).N, 64);
  assert.equal(calculateDFTData('cosbin', 0).N, 4);
  assert.equal(calculateDFTData('cosbin', 3.4).N, 8);
  assert.equal(calculateDFTData('inexistente').presetKey, 'cosbin');
  assert.equal(calculateDFTData('cosbin', 4).resolutionLatex, String.raw`\tfrac{2\pi}{16} = 0.393`);
  assert.equal(calculateDFTData('impulse', 4).latexTime, String.raw`\delta[n]`);
});

test('DFT janelas: Hann e Hamming seguram o vazamento ao custo de um lobulo mais largo', async () => {
  const { DFT_WINDOWS, DFT_WINDOW_KEYS } = await import('../js/dft-engine.js');
  assert.deepEqual(DFT_WINDOW_KEYS, ['rect', 'hann', 'hamming']);
  const rect = calculateDFTData('leak', 5, 'rect');
  const hann = calculateDFTData('leak', 5, 'hann');
  const hamming = calculateDFTData('leak', 5, 'hamming');
  // Longe do tom (k = N/2) a janela derruba o espectro em ordens de grandeza
  assert.ok(hann.mag[16] < rect.mag[16] / 100, `rect=${rect.mag[16]} hann=${hann.mag[16]}`);
  assert.ok(hamming.mag[16] < rect.mag[16] / 10);
  assert.ok(hann.spread < rect.spread / 20 && hamming.spread < rect.spread / 20);
  // ...mas o tom que cabia inteiro na janela passa a ocupar tres bins
  const onBin = calculateDFTData('cosbin', 5, 'hann');
  assert.ok(close(onBin.mag[2], 8) && close(onBin.mag[1], 4) && close(onBin.mag[3], 4) && close(onBin.mag[5], 0));
  assert.ok(close(calculateDFTData('cosbin', 5, 'rect').spread, 0));
  // A janela e aplicada antes da transformada, e Parseval continua valendo
  for (const key of DFT_WINDOW_KEYS) {
    const d = calculateDFTData('exp', 4, key);
    d.x.forEach((v, n) => assert.ok(close(v, d.rawX[n] * DFT_WINDOWS[key].fn(n, d.N))));
    assert.ok(close(d.energyTime, d.energyFreq, 1e-8), key);
    assert.ok(d.fftError < 1e-10, key);
  }
  assert.equal(calculateDFTData('cosbin', 4, 'inexistente').windowKey, 'rect');
  assert.ok(close(hann.window[0], 0) && close(hann.window[16], 1) && close(hamming.window[0], 0.08));
});
