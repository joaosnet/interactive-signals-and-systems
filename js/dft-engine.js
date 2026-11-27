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
    title: 'Cosseno no Bin', titleEn: 'Cosine on a Bin',
    idea: 'duas linhas limpas', ideaEn: 'two clean lines',
    fn: (n, N) => Math.cos((TWO_PI * 2 * n) / N),
    cycles: () => 2,
    latex: () => '\\cos\\!\\left(2\\pi \\cdot 2\\,\\tfrac{n}{N}\\right)'
  },
  leak: {
    title: 'Cosseno Fora do Bin', titleEn: 'Off-Bin Cosine',
    idea: 'vazamento espectral', ideaEn: 'spectral leakage',
    fn: (n, N) => Math.cos((TWO_PI * 2.5 * n) / N),
    cycles: () => 2.5,
    latex: () => '\\cos\\!\\left(2\\pi \\cdot 2.5\\,\\tfrac{n}{N}\\right)'
  },
  twotone: {
    title: 'Dois Tons', titleEn: 'Two Tones',
    idea: 'cada tom, um par de linhas', ideaEn: 'each tone, a pair of lines',
    fn: (n, N) => Math.cos((TWO_PI * 1 * n) / N) + 0.5 * Math.cos((TWO_PI * 3 * n) / N),
    latex: () => '\\cos\\!\\left(2\\pi\\tfrac{n}{N}\\right) + 0.5\\cos\\!\\left(2\\pi \\cdot 3\\,\\tfrac{n}{N}\\right)'
  },
  rect: {
    title: 'Pulso Retangular', titleEn: 'Rectangular Pulse',
    idea: 'amostras do Dirichlet', ideaEn: 'samples of the Dirichlet kernel',
    fn: (n, N) => (n < N / 4 ? 1 : 0),
    latex: () => 'u[n] - u[n - \\tfrac{N}{4}]'
  },
  impulse: {
    title: 'Impulso', titleEn: 'Impulse',
    idea: 'espectro plano', ideaEn: 'flat spectrum',
    fn: (n) => (n === 0 ? 1 : 0),
    latex: () => '\\delta[n]'
  },
  alternating: {
    title: 'Alternado (−1)ⁿ', titleEn: 'Alternating (−1)ⁿ',
    idea: 'a frequência mais alta', ideaEn: 'the highest frequency',
    fn: (n) => (n % 2 === 0 ? 1 : -1),
    cycles: (N) => N / 2,
    latex: () => '(-1)^{n}'
  },
  exp: {
    title: 'Exponencial', titleEn: 'Exponential',
    idea: 'passa-baixas amostrado', ideaEn: 'sampled low-pass',
    fn: (n) => 0.8 ** n,
    latex: () => '0.8^{n}'
  },
  ramp: {
    title: 'Rampa', titleEn: 'Ramp',
    idea: 'dente de serra periódico', ideaEn: 'periodic sawtooth',
    fn: (n, N) => n / N,
    latex: () => '\\tfrac{n}{N}'
  }
};

export const DFT_MIN_BITS = 2;   // N = 4
export const DFT_MAX_BITS = 6;   // N = 64

/**
 * Calcula a DFT de um preset com N = 2^bits amostras, pela soma direta e pela FFT.
 */
export function calculateDFTData(presetKey = 'cosbin', bitsVal = 4) {
  const key = DFT_PRESETS[presetKey] ? presetKey : 'cosbin';
  const preset = DFT_PRESETS[key];
  const b = Number.isFinite(Number(bitsVal)) ? Math.round(Number(bitsVal)) : 4;
  const bits = Math.max(DFT_MIN_BITS, Math.min(DFT_MAX_BITS, b));
  const N = 2 ** bits;

  const x = Array.from({ length: N }, (_, n) => preset.fn(n, N));
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

  return {
    presetKey: key,
    N,
    bits,
    x,
    re,
    im,
    mag,
    phase,
    peakMag: Math.max(...mag),
    maxAbsX: Math.max(...x.map(Math.abs)),
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
