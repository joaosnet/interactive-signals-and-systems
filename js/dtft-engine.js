// ============================================================================
// DTFT-ENGINE.JS — Transformada de Fourier de Tempo Discreto de pares notáveis
// ----------------------------------------------------------------------------
// X(e^{jΩ}) = Σ x[n] e^{-jΩn}        x[n] = (1/2π) ∫_{2π} X(e^{jΩ}) e^{jΩn} dΩ
//
// O espectro é contínuo em Ω e periódico de período 2π. Cada par traz a forma
// fechada X(e^{jΩ}); a soma parcial X_N(Ω) = Σ_{|n|≤N} x[n] e^{-jΩn} mostra a
// convergência (e o fenômeno de Gibbs no passa-baixas ideal).
// Sinais de potência (cosseno) têm espectro feito de impulsos: `impulses`.
// Sem dependência de DOM: pode ser testado com node --test.
// ============================================================================

const TWO_PI = 2 * Math.PI;

const fmt = (v, digits = 2) => {
  const r = Math.round(v * 10 ** digits) / 10 ** digits;
  return Object.is(r, -0) ? '0' : String(r);
};

/** Reduz Ω ao período fundamental (-π, π]. */
export function wrapOmega(omega) {
  let w = omega % TWO_PI;
  if (w > Math.PI) w -= TWO_PI;
  if (w <= -Math.PI) w += TWO_PI;
  return w;
}

/** Núcleo de Dirichlet sin(LΩ/2)/sin(Ω/2), com o limite ±L nos múltiplos de 2π. */
function dirichlet(omega, L) {
  const s = Math.sin(omega / 2);
  if (Math.abs(s) < 1e-9) return L * Math.cos((omega / 2) * (L - 1));
  return Math.sin((L * omega) / 2) / s;
}

/**
 * Catálogo de pares. Cada par tem no máximo um parâmetro (`param`), com o
 * símbolo mostrado no slider e a faixa permitida.
 */
export const DTFT_PRESETS = {
  rect: {
    title: 'Pulso Retangular', titleEn: 'Rectangular Pulse',
    param: { symbol: 'M', min: 1, max: 8, def: 2, step: 1 },
    build: (M) => ({
      fnSeq: (n) => (Math.abs(n) <= M ? 1 : 0),
      evalX: (w) => ({ re: dirichlet(w, 2 * M + 1), im: 0 }),
      energy: 2 * M + 1,
      latexTime: `u[n+${M}] - u[n-${M + 1}]`,
      latexX: `\\frac{\\sin(${fmt(M + 0.5, 1)}\\,\\Omega)}{\\sin(\\Omega/2)}`
    })
  },
  exp: {
    title: 'Exponencial Causal', titleEn: 'Causal Exponential',
    param: { symbol: 'a', min: -0.9, max: 0.9, def: 0.7, step: 0.05 },
    build: (a) => ({
      fnSeq: (n) => (n >= 0 ? a ** n : 0),
      // 1 / (1 - a e^{-jΩ})
      evalX: (w) => {
        const dr = 1 - a * Math.cos(w);
        const di = a * Math.sin(w);
        const d2 = dr * dr + di * di;
        return { re: dr / d2, im: -di / d2 };
      },
      energy: 1 / (1 - a * a),
      latexTime: Math.abs(a) < 1e-9 ? '\\delta[n]' : `${a < 0 ? `(${fmt(a)})` : fmt(a)}^{n}\\,u[n]`,
      latexX: Math.abs(a) < 1e-9
        ? '1'
        : `\\frac{1}{1 ${a > 0 ? '-' : '+'} ${fmt(Math.abs(a))}\\,e^{-j\\Omega}}`
    })
  },
  bilateral: {
    title: 'Exponencial Bilateral', titleEn: 'Two-Sided Exponential',
    param: { symbol: 'a', min: 0.1, max: 0.9, def: 0.6, step: 0.05 },
    build: (a) => ({
      fnSeq: (n) => a ** Math.abs(n),
      evalX: (w) => ({ re: (1 - a * a) / (1 - 2 * a * Math.cos(w) + a * a), im: 0 }),
      energy: (1 + a * a) / (1 - a * a),
      latexTime: `${fmt(a)}^{|n|}`,
      latexX: `\\frac{${fmt(1 - a * a)}}{${fmt(1 + a * a)} - ${fmt(2 * a)}\\cos\\Omega}`
    })
  },
  sinc: {
    title: 'Passa-Baixas Ideal', titleEn: 'Ideal Low-Pass',
    param: { symbol: '\\Omega_c', symbolText: 'Ωc', min: 0.3, max: 2.8, def: 1.0, step: 0.05 },
    build: (wc) => ({
      fnSeq: (n) => (n === 0 ? wc / Math.PI : Math.sin(wc * n) / (Math.PI * n)),
      evalX: (w) => {
        const d = Math.abs(wrapOmega(w)) - wc;
        return { re: Math.abs(d) < 1e-9 ? 0.5 : (d < 0 ? 1 : 0), im: 0 };
      },
      energy: wc / Math.PI,
      latexTime: `\\frac{\\sin(${fmt(wc)}\\,n)}{\\pi n}`,
      latexX: `\\operatorname{rect}\\!\\left(\\tfrac{\\Omega}{${fmt(2 * wc)}}\\right)`,
      slowDecay: true
    })
  },
  cos: {
    title: 'Cosseno', titleEn: 'Cosine',
    param: { symbol: '\\Omega_0', symbolText: 'Ω₀', min: 0.3, max: 2.8, def: 1.0, step: 0.05 },
    build: (w0) => ({
      fnSeq: (n) => Math.cos(w0 * n),
      evalX: () => ({ re: 0, im: 0 }),
      impulses: [{ omega: w0, area: Math.PI }, { omega: -w0, area: Math.PI }],
      energy: Infinity,
      latexTime: `\\cos(${fmt(w0)}\\,n)`,
      latexX: `\\pi\\left[\\delta(\\Omega - ${fmt(w0)}) + \\delta(\\Omega + ${fmt(w0)})\\right]`
    })
  },
  movavg: {
    title: 'Média Móvel', titleEn: 'Moving Average',
    param: { symbol: 'M', min: 2, max: 8, def: 3, step: 1 },
    build: (M) => ({
      fnSeq: (n) => (n >= 0 && n < M ? 1 / M : 0),
      // (1/M) e^{-jΩ(M-1)/2} · sin(MΩ/2)/sin(Ω/2): fase linear
      evalX: (w) => {
        const amp = dirichlet(w, M) / M;
        const ph = (-w * (M - 1)) / 2;
        return { re: amp * Math.cos(ph), im: amp * Math.sin(ph) };
      },
      energy: 1 / M,
      latexTime: `\\tfrac{1}{${M}}\\,(u[n] - u[n-${M}])`,
      latexX: `\\tfrac{1}{${M}}\\,e^{-j${fmt((M - 1) / 2, 1)}\\Omega}\\,\\frac{\\sin(${fmt(M / 2, 1)}\\,\\Omega)}{\\sin(\\Omega/2)}`
    })
  },
  diff: {
    title: 'Primeira Diferença', titleEn: 'First Difference',
    param: null,
    build: () => ({
      fnSeq: (n) => (n === 0 ? 1 : (n === 1 ? -1 : 0)),
      evalX: (w) => ({ re: 1 - Math.cos(w), im: Math.sin(w) }),
      energy: 2,
      latexTime: '\\delta[n] - \\delta[n-1]',
      latexX: '1 - e^{-j\\Omega}'
    })
  },
  delta: {
    title: 'Impulso Unitário', titleEn: 'Unit Impulse',
    param: null,
    build: () => ({
      fnSeq: (n) => (n === 0 ? 1 : 0),
      evalX: () => ({ re: 1, im: 0 }),
      energy: 1,
      latexTime: '\\delta[n]',
      latexX: '1'
    })
  }
};

/** Soma direta Σ_{n=-N}^{N} x[n] e^{-jΩn}. */
export function numericDTFT(fnSeq, omega, N = 2000) {
  let re = 0;
  let im = 0;
  for (let n = -N; n <= N; n++) {
    const x = fnSeq(n);
    if (x === 0) continue;
    re += x * Math.cos(omega * n);
    im -= x * Math.sin(omega * n);
  }
  return { re, im };
}

/**
 * Calcula o par de DTFT de um preset.
 * @returns x[n], X(e^{jΩ}) em forma fechada, soma parcial, energia e a leitura
 *          do par como filtro (passa-baixas / passa-altas).
 */
/** Par montado a partir de uma sequência finita digitada pelo aluno: { start, values }. */
function customPreset(seq) {
  const values = Array.isArray(seq?.values) && seq.values.length > 0 ? seq.values.map(Number) : [1];
  const start = Number.isFinite(seq?.start) ? Math.round(seq.start) : 0;
  const end = start + values.length - 1;
  // X(e^{jΩ}) escrito termo a termo (até 4 termos; depois, reticências)
  const terms = [];
  values.forEach((v, i) => {
    if (Math.abs(v) < 1e-12 || terms.length > 4) return;
    const n = start + i;
    const coef = Math.abs(Math.abs(v) - 1) < 1e-12 && n !== 0 ? '' : fmt(Math.abs(v));
    const expo = n === 0 ? '' : `e^{${n > 0 ? '-' : ''}j${Math.abs(n) === 1 ? '' : Math.abs(n)}\\Omega}`;
    terms.push({ sign: v < 0 ? '-' : '+', text: `${coef}${expo}` || '1' });
  });
  const shown = terms.slice(0, 4).map((t, i) => (i === 0 ? (t.sign === '-' ? '-' : '') : ` ${t.sign} `) + t.text).join('');
  const shownValues = values.slice(0, 7).map((v, i) => (start + i === 0 ? `\\underset{\\uparrow}{${fmt(v)}}` : fmt(v)));
  return {
    param: null,
    build: () => ({
      fnSeq: (n) => (n >= start && n <= end ? values[n - start] : 0),
      evalX: (w) => {
        let re = 0;
        let im = 0;
        for (let i = 0; i < values.length; i++) {
          re += values[i] * Math.cos(w * (start + i));
          im -= values[i] * Math.sin(w * (start + i));
        }
        return { re, im };
      },
      energy: values.reduce((acc, v) => acc + v * v, 0),
      latexTime: `\\{${shownValues.join(',\\,')}${values.length > 7 ? ',\\,\\ldots' : ''}\\}${start > 0 || end < 0 ? `_{\\;n \\ge ${start}}` : ''}`,
      latexX: `${shown || '0'}${terms.length > 4 ? ' + \\cdots' : ''}`
    })
  };
}

/**
 * @param customSeq  { start, values } quando presetKey === 'custom'
 */
export function calculateDTFTData(presetKey = 'rect', paramValue, customSeq = null) {
  const isCustom = presetKey === 'custom' && Boolean(customSeq);
  const key = isCustom ? 'custom' : (DTFT_PRESETS[presetKey] ? presetKey : 'rect');
  const preset = isCustom ? customPreset(customSeq) : DTFT_PRESETS[key];
  const spec = preset.param;
  let param = null;
  if (spec) {
    const v = Number.isFinite(Number(paramValue)) && paramValue !== null && paramValue !== undefined ? Number(paramValue) : spec.def;
    param = Math.max(spec.min, Math.min(spec.max, v));
    if (spec.step === 1) param = Math.round(param);
  }
  const built = preset.build(param);
  const impulses = built.impulses || [];
  const isImpulsive = impulses.length > 0;

  const mag = (w) => {
    const v = built.evalX(w);
    return Math.hypot(v.re, v.im);
  };
  /** Fase em (-π, π]; NaN onde o espectro é nulo (fase indefinida). */
  const phase = (w) => {
    const v = built.evalX(w);
    if (Math.hypot(v.re, v.im) < 1e-9) return NaN;
    const p = Math.atan2(v.im, v.re);
    return Math.abs(p) < 1e-12 ? 0 : p;
  };
  const partialSum = (w, N) => numericDTFT(built.fnSeq, w, N);

  let peakMag = 0;
  for (let i = 0; i <= 256; i++) peakMag = Math.max(peakMag, mag(-Math.PI + (i / 256) * TWO_PI));

  // Leitura como filtro h[n] = x[n]: compara o ganho em Ω = 0 (lento) com Ω = π (rápido)
  let filterType = null;
  if (!isImpulsive) {
    const g0 = mag(0);
    const gPi = mag(Math.PI);
    if (g0 > 1.5 * gPi) filterType = 'lowpass';
    else if (gPi > 1.5 * g0) filterType = 'highpass';
    else filterType = 'allpass';
  }

  return {
    presetKey: key,
    // Distingue sequências do aluno entre si (a cena guarda curvas em cache por esta chave)
    signature: isCustom ? `${customSeq.start}:${customSeq.values.join(',')}` : '',
    param,
    paramSpec: spec,
    fnSeq: built.fnSeq,
    evalX: built.evalX,
    mag,
    phase,
    partialSum,
    impulses,
    isImpulsive,
    energy: built.energy,
    slowDecay: Boolean(built.slowDecay),
    peakMag,
    filterType,
    latexTime: built.latexTime,
    latexX: built.latexX
  };
}

/** (1/2π) ∫_{-π}^{π} |X(e^{jΩ})|² dΩ pela regra do ponto médio (lado espectral de Parseval). */
export function spectralEnergy(data, points = 8000) {
  const dw = TWO_PI / points;
  let acc = 0;
  for (let i = 0; i < points; i++) {
    const m = data.mag(-Math.PI + (i + 0.5) * dw);
    acc += m * m;
  }
  return (acc * dw) / TWO_PI;
}
