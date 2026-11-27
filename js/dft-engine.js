// ============================================================================
// DFT-ENGINE.JS — Transformada Discreta de Fourier e o algoritmo FFT
// ----------------------------------------------------------------------------
// X[k] = Σ_{n=0}^{N-1} x[n] e^{-j2πkn/N}        x[n] = (1/N) Σ_k X[k] e^{j2πkn/N}
//
// A DFT é a DTFT de uma sequência de N amostras, avaliada em Ω_k = 2πk/N.
// Aqui há duas implementações da mesma conta: a soma direta (N² produtos) e a
// FFT radix-2 (N/2·log₂N borboletas), com contadores para comparar o custo.
// Sem dependência de DOM: pode ser testado com node --test.
// ============================================================================

const TWO_PI = 2 * Math.PI;

const fmt = (v, digits = 2) => {
  const r = Math.round(v * 10 ** digits) / 10 ** digits;
  return Object.is(r, -0) ? '0' : String(r);
};

/** Soma direta: N² multiplicações complexas. */
export function dftNaive(x) {
  const N = x.length;
  const re = new Array(N).fill(0);
  const im = new Array(N).fill(0);
  let mults = 0;
  for (let k = 0; k < N; k++) {
    for (let n = 0; n < N; n++) {
      const ang = (-TWO_PI * k * n) / N;
      re[k] += x[n] * Math.cos(ang);
      im[k] += x[n] * Math.sin(ang);
      mults++;
    }
  }
  return { re, im, mults };
}

/** Inverte os `bits` bits menos significativos de i (ordem de entrada da FFT). */
export function bitReverse(i, bits) {
  let r = 0;
  for (let b = 0; b < bits; b++) {
    r = (r << 1) | ((i >> b) & 1);
  }
  return r;
}

/**
 * FFT radix-2 iterativa (decimação no tempo). N deve ser potência de 2.
 * @param sign -1 para a transformada direta, +1 para a inversa (sem o fator 1/N)
 */
export function fft(reIn, imIn = null, sign = -1) {
  const N = reIn.length;
  const bits = Math.round(Math.log2(N));
  if (2 ** bits !== N) throw new Error('fft: N deve ser potência de 2');
  const re = new Array(N);
  const im = new Array(N);
  for (let i = 0; i < N; i++) {
    const j = bitReverse(i, bits);
    re[j] = reIn[i];
    im[j] = imIn ? imIn[i] : 0;
  }
  let butterflies = 0;
  for (let span = 2; span <= N; span *= 2) {
    const half = span / 2;
    for (let start = 0; start < N; start += span) {
      for (let k = 0; k < half; k++) {
        // Borboleta: (a, b) → (a + W·b, a − W·b), com W = e^{∓j2πk/span}
        const ang = (sign * TWO_PI * k) / span;
        const wr = Math.cos(ang);
        const wi = Math.sin(ang);
        const a = start + k;
        const b = a + half;
        const tr = re[b] * wr - im[b] * wi;
        const ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        butterflies++;
      }
    }
  }
  return { re, im, butterflies, stages: bits };
}

/** DFT inversa via FFT. */
export function ifft(re, im) {
  const N = re.length;
  const out = fft(re, im, +1);
  return { re: out.re.map((v) => v / N), im: out.im.map((v) => v / N) };
}

/**
 * Catálogo de sinais. `fn(n, N)` gera a amostra; `cycles(N)` (quando existe) diz
 * quantos ciclos do tom cabem na janela — inteiro = linhas limpas, fracionário = vazamento.
 */
export const DFT_PRESETS = {
  cosbin: {
    title: 'Cosseno no Bin', titleEn: 'Cosine on a Bin', titleEs: 'Coseno en el Bin',
    idea: 'duas linhas limpas', ideaEn: 'two clean lines', ideaEs: 'dos líneas limpias',
    fn: (n, N) => Math.cos((TWO_PI * 2 * n) / N),
    cycles: () => 2,
    latex: () => '\\cos\\!\\left(2\\pi \\cdot 2\\,\\tfrac{n}{N}\\right)'
  },
  leak: {
    title: 'Cosseno Fora do Bin', titleEn: 'Off-Bin Cosine', titleEs: 'Coseno Fuera del Bin',
    idea: 'vazamento espectral', ideaEn: 'spectral leakage', ideaEs: 'fuga espectral',
    fn: (n, N) => Math.cos((TWO_PI * 2.5 * n) / N),
    cycles: () => 2.5,
    latex: () => '\\cos\\!\\left(2\\pi \\cdot 2.5\\,\\tfrac{n}{N}\\right)'
  },
  twotone: {
    title: 'Dois Tons', titleEn: 'Two Tones', titleEs: 'Dos Tonos',
    idea: 'cada tom, um par de linhas', ideaEn: 'each tone, a pair of lines', ideaEs: 'cada tono, un par de líneas',
    fn: (n, N) => Math.cos((TWO_PI * 1 * n) / N) + 0.5 * Math.cos((TWO_PI * 3 * n) / N),
    latex: () => '\\cos\\!\\left(2\\pi\\tfrac{n}{N}\\right) + 0.5\\cos\\!\\left(2\\pi \\cdot 3\\,\\tfrac{n}{N}\\right)'
  },
  rect: {
    title: 'Pulso Retangular', titleEn: 'Rectangular Pulse', titleEs: 'Pulso Rectangular',
    idea: 'amostras do Dirichlet', ideaEn: 'samples of the Dirichlet kernel', ideaEs: 'muestras del núcleo de Dirichlet',
    fn: (n, N) => (n < N / 4 ? 1 : 0),
    latex: () => 'u[n] - u[n - \\tfrac{N}{4}]'
  },
  impulse: {
    title: 'Impulso', titleEn: 'Impulse', titleEs: 'Impulso',
    idea: 'espectro plano', ideaEn: 'flat spectrum', ideaEs: 'espectro plano',
    fn: (n) => (n === 0 ? 1 : 0),
    latex: () => '\\delta[n]'
  },
  alternating: {
    title: 'Alternado (−1)ⁿ', titleEn: 'Alternating (−1)ⁿ', titleEs: 'Alternado (−1)ⁿ',
    idea: 'a frequência mais alta', ideaEn: 'the highest frequency', ideaEs: 'la frecuencia más alta',
    fn: (n) => (n % 2 === 0 ? 1 : -1),
    cycles: (N) => N / 2,
    latex: () => '(-1)^{n}'
  },
  exp: {
    title: 'Exponencial', titleEn: 'Exponential', titleEs: 'Exponencial',
    idea: 'passa-baixas amostrado', ideaEn: 'sampled low-pass', ideaEs: 'pasa-bajos muestreado',
    fn: (n) => 0.8 ** n,
    latex: () => '0.8^{n}'
  },
  ramp: {
    title: 'Rampa', titleEn: 'Ramp', titleEs: 'Rampa',
    idea: 'dente de serra periódico', ideaEn: 'periodic sawtooth', ideaEs: 'diente de sierra periódico',
    fn: (n, N) => n / N,
    latex: () => '\\tfrac{n}{N}'
  }
};

/**
 * Janelas (forma periódica, a usada em análise espectral). `mainHalf` é a meia
 * largura do lóbulo principal em bins: a janela retangular tem o lóbulo mais
 * estreito e os lóbulos laterais mais altos; Hann e Hamming trocam uma coisa pela outra.
 */
export const DFT_WINDOWS = {
  rect: { title: 'Retangular', titleEn: 'Rectangular', titleEs: 'Rectangular', mainHalf: 1, fn: () => 1, latex: 'w[n] = 1' },
  hann: {
    title: 'Hann', titleEn: 'Hann', titleEs: 'Hann', mainHalf: 2,
    fn: (n, N) => 0.5 - 0.5 * Math.cos((TWO_PI * n) / N),
    latex: 'w[n] = 0.5 - 0.5\\cos\\!\\left(\\tfrac{2\\pi n}{N}\\right)'
  },
  hamming: {
    title: 'Hamming', titleEn: 'Hamming', titleEs: 'Hamming', mainHalf: 2,
    fn: (n, N) => 0.54 - 0.46 * Math.cos((TWO_PI * n) / N),
    latex: 'w[n] = 0.54 - 0.46\\cos\\!\\left(\\tfrac{2\\pi n}{N}\\right)'
  }
};
export const DFT_WINDOW_KEYS = Object.keys(DFT_WINDOWS);

export const DFT_MIN_BITS = 2;   // N = 4
export const DFT_MAX_BITS = 6;   // N = 64

/**
 * Calcula a DFT de um preset com N = 2^bits amostras, pela soma direta e pela FFT.
 */
/**
 * @param customValues  amostras digitadas pelo aluno quando presetKey === 'custom'.
 *   N é a menor potência de 2 que as contém; aumentar N completa com zeros
 *   (zero-padding), o que amostra a mesma DTFT em mais pontos.
 */
export function calculateDFTData(presetKey = 'cosbin', bitsVal = 4, windowKeyVal = 'rect', customValues = null) {
  const isCustom = presetKey === 'custom' && Array.isArray(customValues) && customValues.length > 0;
  const key = isCustom ? 'custom' : (DFT_PRESETS[presetKey] ? presetKey : 'cosbin');
  const samples = isCustom ? customValues.slice(0, 2 ** DFT_MAX_BITS).map(Number) : null;
  const preset = isCustom
    ? {
        fn: (n) => (n < samples.length ? samples[n] : 0),
        latex: () => `\\{${samples.slice(0, 6).map((v) => fmt(v)).join(',\\,')}${samples.length > 6 ? ',\\,\\ldots' : ''}\\}`
      }
    : DFT_PRESETS[key];
  const b = Number.isFinite(Number(bitsVal)) ? Math.round(Number(bitsVal)) : 4;
  const minBits = isCustom ? Math.max(DFT_MIN_BITS, Math.ceil(Math.log2(samples.length))) : DFT_MIN_BITS;
  const bits = Math.max(minBits, Math.min(DFT_MAX_BITS, b));
  const N = 2 ** bits;

  const windowKey = DFT_WINDOWS[windowKeyVal] ? windowKeyVal : 'rect';
  const win = DFT_WINDOWS[windowKey];
  const raw = Array.from({ length: N }, (_, n) => preset.fn(n, N));
  const w = Array.from({ length: N }, (_, n) => win.fn(n, N));
  // A DFT é calculada sobre o sinal já multiplicado pela janela
  const x = raw.map((v, n) => v * w[n]);
  const naive = dftNaive(x);
  const fast = fft(x);

  // Resíduo numérico (~1e-16) vira zero para não poluir magnitude e fase
  const clean = (v) => (Math.abs(v) < 1e-9 ? 0 : v);
  const re = fast.re.map(clean);
  const im = fast.im.map(clean);
  const mag = re.map((r, k) => Math.hypot(r, im[k]));
  const phase = re.map((r, k) => (mag[k] < 1e-9 ? NaN : Math.atan2(im[k], r)));

  let fftError = 0;
  for (let k = 0; k < N; k++) {
    fftError = Math.max(fftError, Math.hypot(fast.re[k] - naive.re[k], fast.im[k] - naive.im[k]));
  }

  /** DTFT da sequência de N amostras (zero fora da janela): a "envoltória" que a DFT amostra. */
  const envelope = (omega) => {
    let er = 0;
    let ei = 0;
    for (let n = 0; n < N; n++) {
      er += x[n] * Math.cos(omega * n);
      ei -= x[n] * Math.sin(omega * n);
    }
    return Math.hypot(er, ei);
  };

  const energyTime = x.reduce((acc, v) => acc + v * v, 0);
  const energyFreq = mag.reduce((acc, v) => acc + v * v, 0) / N;
  const cycles = preset.cycles ? preset.cycles(N) : null;

  // Espalhamento: fração da energia fora do lóbulo principal em torno do maior bin
  // (e do seu espelho N - k). Mede o quanto a janela "segura" o vazamento.
  let peakBin = 0;
  for (let k = 0; k <= N / 2; k++) if (mag[k] > mag[peakBin]) peakBin = k;
  let inMain = 0;
  for (let k = 0; k < N; k++) {
    const d = Math.min(Math.abs(k - peakBin), Math.abs(k - (N - peakBin)), Math.abs(k - peakBin - N), Math.abs(k + N - peakBin));
    if (d <= win.mainHalf) inMain += mag[k] * mag[k];
  }
  const totalSq = mag.reduce((acc, v) => acc + v * v, 0);
  const spread = totalSq > 1e-12 ? Math.max(0, 1 - inMain / totalSq) : 0;

  return {
    presetKey: key,
    N,
    bits,
    minBits,
    // Zeros acrescentados depois das amostras digitadas (só em sinais do aluno)
    zeroPadded: isCustom ? N - samples.length : 0,
    windowKey,
    window: w,
    rawX: raw,
    peakBin,
    spread,
    x,
    re,
    im,
    mag,
    phase,
    peakMag: Math.max(...mag),
    maxAbsX: Math.max(...x.map(Math.abs)),
    maxAbsRaw: Math.max(...raw.map(Math.abs)),
    envelope,
    energyTime,
    energyFreq,
    naiveMults: naive.mults,
    butterflies: fast.butterflies,
    stages: fast.stages,
    speedup: naive.mults / fast.butterflies,
    fftError,
    cycles,
    // Vazamento: o tom não completa um número inteiro de ciclos na janela
    leaks: cycles === null ? null : Math.abs(cycles - Math.round(cycles)) > 1e-9,
    binOmega: (k) => (TWO_PI * k) / N,
    latexTime: preset.latex(N),
    resolutionLatex: `\\tfrac{2\\pi}{${N}} = ${fmt(TWO_PI / N, 3)}`
  };
}
