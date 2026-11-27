// ============================================================================
// DCONV-ENGINE.JS — Convolução discreta (soma de convolução)
// ----------------------------------------------------------------------------
// y[n] = x[n] * h[n] = Σ_k x[k] h[n-k]
//
// Uma sequência é { start, values }: values[i] é a amostra em n = start + i.
// Fora desse intervalo a sequência vale zero. Sequências de suporte infinito
// (ex.: a^n u[n]) são guardadas com cauda longa o bastante para o erro ser
// desprezível e marcadas com `infinite: true`; `viewEnd` diz até onde desenhar.
// Sem dependência de DOM: pode ser testado com node --test.
// ============================================================================

const fmt = (v, digits = 2) => {
  const r = Math.round(v * 10 ** digits) / 10 ** digits;
  return Object.is(r, -0) ? '0' : String(r);
};

export const seqEnd = (seq) => seq.start + seq.values.length - 1;

/** Amostra da sequência em n (zero fora do suporte). */
export function seqAt(seq, n) {
  const i = n - seq.start;
  return i >= 0 && i < seq.values.length ? seq.values[i] : 0;
}

/** Soma de convolução de duas sequências de suporte finito. */
export function convolveSeq(x, h) {
  const values = new Array(x.values.length + h.values.length - 1).fill(0);
  for (let i = 0; i < x.values.length; i++) {
    if (x.values[i] === 0) continue;
    for (let j = 0; j < h.values.length; j++) {
      values[i + j] += x.values[i] * h.values[j];
    }
  }
  return { start: x.start + h.start, values };
}

const TAIL = 80; // amostras guardadas de uma sequência infinita (0.7^80 ≈ 4e-13)

/** Sequências elementares usadas pelos exemplos. */
export const DCONV_SIGNALS = {
  rect3: { start: 0, values: [1, 1, 1], latex: 'u[n] - u[n-3]' },
  rect5: { start: 0, values: [1, 1, 1, 1, 1], latex: 'u[n] - u[n-5]' },
  ramp4: { start: 0, values: [0.25, 0.5, 0.75, 1], latex: '\\tfrac{n+1}{4}\\,(u[n] - u[n-4])' },
  noisy: { start: 0, values: [0, 1, 0.6, 1.3, 0.8, 1.1, 1], latex: '\\{0,\\,1,\\,0.6,\\,1.3,\\,0.8,\\,1.1,\\,1\\}' },
  delta: { start: 0, values: [1], latex: '\\delta[n]' },
  delay2: { start: 2, values: [1], latex: '\\delta[n-2]' },
  diff: { start: 0, values: [1, -1], latex: '\\delta[n] - \\delta[n-1]' },
  avg3: { start: 0, values: [1 / 3, 1 / 3, 1 / 3], latex: '\\tfrac{1}{3}\\,(u[n] - u[n-3])' },
  echo: { start: 0, values: [1, 0, 0, 0, 0.5], latex: '\\delta[n] + 0.5\\,\\delta[n-4]' },
  exp07: {
    start: 0,
    values: Array.from({ length: TAIL }, (_, n) => 0.7 ** n),
    latex: '0.7^{n}\\,u[n]',
    infinite: true,
    viewEnd: 9
  }
};

/** Exemplos: cada um é um par (x, h) com uma ideia para ensinar. */
export const DCONV_PRESETS = {
  rect_rect: {
    title: 'Retângulo * Retângulo', titleEn: 'Rectangle * Rectangle',
    idea: 'vira um triângulo', ideaEn: 'becomes a triangle',
    x: 'rect3', h: 'rect3'
  },
  rect_exp: {
    title: 'Retângulo * Exponencial', titleEn: 'Rectangle * Exponential',
    idea: 'carga e descarga', ideaEn: 'charge and discharge',
    x: 'rect5', h: 'exp07'
  },
  identity: {
    title: 'Impulso (identidade)', titleEn: 'Impulse (identity)',
    idea: 'x * δ = x', ideaEn: 'x * δ = x',
    x: 'ramp4', h: 'delta'
  },
  delay: {
    title: 'Atraso', titleEn: 'Delay',
    idea: 'x * δ[n−2] = x[n−2]', ideaEn: 'x * δ[n−2] = x[n−2]',
    x: 'ramp4', h: 'delay2'
  },
  average: {
    title: 'Média Móvel', titleEn: 'Moving Average',
    idea: 'suaviza o sinal', ideaEn: 'smooths the signal',
    x: 'noisy', h: 'avg3'
  },
  difference: {
    title: 'Primeira Diferença', titleEn: 'First Difference',
    idea: 'detecta as bordas', ideaEn: 'detects the edges',
    x: 'rect5', h: 'diff'
  },
  echo: {
    title: 'Eco', titleEn: 'Echo',
    idea: 'cópia atrasada e atenuada', ideaEn: 'delayed, attenuated copy',
    x: 'ramp4', h: 'echo'
  }
};

/** "{1, 2, 3}" com a seta ↑ marcando a amostra de n = 0 (quando ela está no trecho mostrado). */
export function seqLatex(seq, maxItems = 9) {
  const shown = seq.values.slice(0, maxItems).map((v, i) => {
    const txt = fmt(v);
    return seq.start + i === 0 ? `\\underset{\\uparrow}{${txt}}` : txt;
  });
  const more = seq.values.length > maxItems ? ',\\,\\ldots' : '';
  const origin = seq.start > 0 || seqEnd(seq) < 0 ? `_{\\;n \\ge ${seq.start}}` : '';
  return `\\{${shown.join(',\\,')}${more}\\}${origin}`;
}

/**
 * Calcula a convolução discreta de um exemplo.
 * @returns x, h, y e as funções que descrevem o passo a passo para um n fixo.
 */
export function calculateDConvData(presetKey = 'rect_rect') {
  const key = DCONV_PRESETS[presetKey] ? presetKey : 'rect_rect';
  const preset = DCONV_PRESETS[key];
  const x = DCONV_SIGNALS[preset.x];
  const h = DCONV_SIGNALS[preset.h];
  const y = convolveSeq(x, h);

  // Trecho mostrado: sequências infinitas são desenhadas só até viewEnd
  const xEnd = x.infinite ? x.viewEnd : seqEnd(x);
  const hEnd = h.infinite ? h.viewEnd : seqEnd(h);
  const infinite = Boolean(x.infinite || h.infinite);
  const yStart = y.start;
  const yEnd = infinite ? xEnd + hEnd : seqEnd(y);

  // O slider de n passa um pouco do suporte para mostrar "sem sobreposição"
  const nMin = yStart - 2;
  const nMax = yEnd + 2;
  // Eixo k: cabe x[k], h[k], h[-k] e h[n-k] em todo o percurso do slider
  const kMin = Math.max(-14, Math.min(x.start, h.start, -hEnd, nMin - hEnd));
  const kMax = Math.min(18, Math.max(xEnd, hEnd, -h.start, nMax - h.start));

  /** Faixa de k em que x[k] e h[n-k] são ambos não nulos; null se não há sobreposição. */
  const overlapRange = (n) => {
    const lo = Math.max(x.start, n - seqEnd(h));
    const hi = Math.min(seqEnd(x), n - h.start);
    return lo <= hi ? { lo, hi } : null;
  };

  /** Os produtos x[k]·h[n-k] que entram em y[n] e a soma deles. */
  const productAt = (n) => {
    const range = overlapRange(n);
    const terms = [];
    let sum = 0;
    if (range) {
      for (let k = range.lo; k <= range.hi; k++) {
        const xk = seqAt(x, k);
        const hk = seqAt(h, n - k);
        terms.push({ k, xk, hk, prod: xk * hk });
        sum += xk * hk;
      }
    }
    return { terms, sum };
  };

  const sumOf = (seq) => seq.values.reduce((acc, v) => acc + v, 0);
  const maxAbs = (seq) => seq.values.reduce((acc, v) => Math.max(acc, Math.abs(v)), 0);

  return {
    presetKey: key,
    x,
    h,
    y,
    infinite,
    xEnd,
    hEnd,
    yStart,
    yEnd,
    nMin,
    nMax,
    kMin,
    kMax,
    lengthX: x.values.length,
    lengthH: h.values.length,
    lengthY: y.values.length,
    yAt: (n) => seqAt(y, n),
    overlapRange,
    productAt,
    sumX: sumOf(x),
    sumH: sumOf(h),
    sumY: sumOf(y),
    maxAbsY: maxAbs(y),
    latexX: x.latex,
    latexH: h.latex,
    latexY: seqLatex({ start: y.start, values: y.values.slice(0, yEnd - yStart + 1) })
  };
}
