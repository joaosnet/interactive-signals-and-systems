// ============================================================================
// LAPLACE-ENGINE.JS — Transformada de Laplace bilateral de sinais notáveis
// ----------------------------------------------------------------------------
// X(s) = ∫ x(t) e^{-st} dt,  s = σ + jω
//
// Cada par é descrito por polos, zeros, ganho e região de convergência (ROC):
//   X(s) = K · Π(s - z_i) / Π(s - p_k),   ROC = { σ_min < Re{s} < σ_max }
// A mesma X(s) com ROCs diferentes corresponde a sinais diferentes (causal ×
// anticausal), por isso a ROC faz parte do resultado e não é um detalhe.
// Sem dependência de DOM: pode ser testado com node --test.
// ============================================================================

import { buildLaplaceCustom } from './pz-engine.js';

const fmt = (v, digits = 1) => {
  const r = Math.round(v * 10 ** digits) / 10 ** digits;
  return Object.is(r, -0) ? '0' : String(r);
};

/** "s + a" com o sinal certo: a=2 → "s + 2", a=-1 → "s - 1", a=0 → "s". */
function sPlus(a) {
  if (Math.abs(a) < 1e-9) return 's';
  return a > 0 ? `s + ${fmt(a)}` : `s - ${fmt(-a)}`;
}

/** Expoente "-a t" legível: a=1 → "-t", a=-0.5 → "0.5t". */
function expArg(a, tail = 't') {
  if (Math.abs(a) < 1e-9) return '0';
  const mag = Math.abs(a);
  const coef = Math.abs(mag - 1) < 1e-9 ? '' : fmt(mag);
  return `${a > 0 ? '-' : ''}${coef}${tail}`;
}

const u = (t) => (Math.abs(t) < 1e-12 ? 0.5 : (t > 0 ? 1 : 0)); // convenção Lathi: u(0) = 1/2

/**
 * Catálogo de pares. `params` diz quais parâmetros o par usa ('a' = decaimento,
 * 'w0' = frequência de oscilação) e a faixa do slider de cada um.
 */
export const LAPLACE_PRESETS = {
  step: {
    title: 'Degrau Unitário', titleEn: 'Unit Step',
    params: {},
    build: () => ({
      causality: 'causal',
      fnTime: (t) => u(t),
      poles: [{ re: 0, im: 0 }], zeros: [], gain: 1,
      roc: { min: 0, max: Infinity },
      latexTime: 'u(t)',
      latexX: '\\frac{1}{s}'
    })
  },
  exp: {
    title: 'Exponencial Causal', titleEn: 'Causal Exponential',
    params: { a: { min: -1.5, max: 3, def: 1 } },
    build: ({ a }) => ({
      causality: 'causal',
      fnTime: (t) => Math.exp(-a * t) * u(t),
      poles: [{ re: -a, im: 0 }], zeros: [], gain: 1,
      roc: { min: -a, max: Infinity },
      latexTime: `e^{${expArg(a)}}u(t)`,
      latexX: `\\frac{1}{${sPlus(a)}}`
    })
  },
  anticausal: {
    title: 'Exponencial Anticausal', titleEn: 'Anticausal Exponential',
    params: { a: { min: -1.5, max: 3, def: 1 } },
    build: ({ a }) => ({
      causality: 'anticausal',
      fnTime: (t) => (-Math.exp(-a * t) * u(-t)) || 0, // "|| 0" evita -0 para t > 0
      poles: [{ re: -a, im: 0 }], zeros: [], gain: 1,
      roc: { min: -Infinity, max: -a },
      latexTime: `-e^{${expArg(a)}}u(-t)`,
      latexX: `\\frac{1}{${sPlus(a)}}`
    })
  },
  bilateral: {
    title: 'Exponencial Bilateral', titleEn: 'Two-Sided Exponential',
    params: { a: { min: 0.3, max: 3, def: 1 } },
    build: ({ a }) => ({
      causality: 'bilateral',
      fnTime: (t) => Math.exp(-a * Math.abs(t)),
      poles: [{ re: -a, im: 0 }, { re: a, im: 0 }], zeros: [], gain: -2 * a,
      roc: { min: -a, max: a },
      latexTime: `e^{${expArg(a, '|t|')}}`,
      latexX: `\\frac{${fmt(2 * a)}}{${fmt(a * a, 2)} - s^2}`
    })
  },
  ramp: {
    title: 'Rampa', titleEn: 'Ramp',
    params: {},
    build: () => ({
      causality: 'causal',
      fnTime: (t) => (t > 0 ? t : 0),
      poles: [{ re: 0, im: 0 }, { re: 0, im: 0 }], zeros: [], gain: 1,
      roc: { min: 0, max: Infinity },
      latexTime: 't\\,u(t)',
      latexX: '\\frac{1}{s^2}'
    })
  },
  cos: {
    title: 'Cosseno Causal', titleEn: 'Causal Cosine',
    params: { w0: { min: 0.5, max: 5, def: 2 } },
    build: ({ w0 }) => ({
      causality: 'causal',
      fnTime: (t) => Math.cos(w0 * t) * u(t),
      poles: [{ re: 0, im: w0 }, { re: 0, im: -w0 }], zeros: [{ re: 0, im: 0 }], gain: 1,
      roc: { min: 0, max: Infinity },
      latexTime: `\\cos(${fmt(w0)}t)\\,u(t)`,
      latexX: `\\frac{s}{s^2 + ${fmt(w0 * w0, 2)}}`
    })
  },
  sin: {
    title: 'Seno Causal', titleEn: 'Causal Sine',
    params: { w0: { min: 0.5, max: 5, def: 2 } },
    build: ({ w0 }) => ({
      causality: 'causal',
      fnTime: (t) => Math.sin(w0 * t) * u(t),
      poles: [{ re: 0, im: w0 }, { re: 0, im: -w0 }], zeros: [], gain: w0,
      roc: { min: 0, max: Infinity },
      latexTime: `\\sin(${fmt(w0)}t)\\,u(t)`,
      latexX: `\\frac{${fmt(w0)}}{s^2 + ${fmt(w0 * w0, 2)}}`
    })
  },
  dampedsin: {
    title: 'Seno Amortecido', titleEn: 'Damped Sine',
    params: { a: { min: -1, max: 3, def: 0.5 }, w0: { min: 0.5, max: 5, def: 3 } },
    build: ({ a, w0 }) => ({
      causality: 'causal',
      fnTime: (t) => Math.exp(-a * t) * Math.sin(w0 * t) * u(t),
      poles: [{ re: -a, im: w0 }, { re: -a, im: -w0 }], zeros: [], gain: w0,
      roc: { min: -a, max: Infinity },
      latexTime: `e^{${expArg(a)}}\\sin(${fmt(w0)}t)\\,u(t)`,
      latexX: `\\frac{${fmt(w0)}}{(${sPlus(a)})^2 + ${fmt(w0 * w0, 2)}}`
    })
  },
  dampedcos: {
    title: 'Cosseno Amortecido', titleEn: 'Damped Cosine',
    params: { a: { min: -1, max: 3, def: 0.5 }, w0: { min: 0.5, max: 5, def: 3 } },
    build: ({ a, w0 }) => ({
      causality: 'causal',
      fnTime: (t) => Math.exp(-a * t) * Math.cos(w0 * t) * u(t),
      poles: [{ re: -a, im: w0 }, { re: -a, im: -w0 }], zeros: [{ re: -a, im: 0 }], gain: 1,
      roc: { min: -a, max: Infinity },
      latexTime: `e^{${expArg(a)}}\\cos(${fmt(w0)}t)\\,u(t)`,
      latexX: `\\frac{${sPlus(a)}}{(${sPlus(a)})^2 + ${fmt(w0 * w0, 2)}}`
    })
  }
};

function rocLatex(roc) {
  const lo = Number.isFinite(roc.min) ? fmt(roc.min, 2) : null;
  const hi = Number.isFinite(roc.max) ? fmt(roc.max, 2) : null;
  if (lo !== null && hi !== null) return `${lo} < \\operatorname{Re}\\{s\\} < ${hi}`;
  if (lo !== null) return `\\operatorname{Re}\\{s\\} > ${lo}`;
  if (hi !== null) return `\\operatorname{Re}\\{s\\} < ${hi}`;
  return '\\text{todo o plano } s';
}

/**
 * Calcula o par de Laplace de um preset.
 * @returns dados do par: polos, zeros, ROC, x(t), X(s) avaliável em qualquer s,
 *          e as conclusões que dependem da ROC (existência de Fourier, estabilidade).
 */
export function calculateLaplaceData(presetKey = 'exp', aVal = 1, w0Val = 2, custom = null) {
  // Sinal montado pelo aluno (polos, zeros, ganho e ROC): se for inválido, cai no par padrão
  const customResult = presetKey === 'custom' && custom ? buildLaplaceCustom(custom) : null;
  const isCustom = Boolean(customResult?.ok);
  const key = isCustom ? 'custom' : (LAPLACE_PRESETS[presetKey] ? presetKey : 'exp');
  const preset = isCustom ? { params: {}, build: () => customResult.built } : LAPLACE_PRESETS[key];
  const clampParam = (name, value, fallback) => {
    const spec = preset.params[name];
    if (!spec) return fallback;
    const v = Number.isFinite(Number(value)) ? Number(value) : spec.def;
    return Math.max(spec.min, Math.min(spec.max, v));
  };
  const a = clampParam('a', aVal, 0);
  const w0 = clampParam('w0', w0Val, 0);
  const built = preset.build({ a, w0 });
  const { poles, zeros, gain, roc } = built;

  /** X(s) em s = re + j·im, pela forma fatorada. Vale em todo o plano (continuação analítica). */
  const evalX = (re, im) => {
    let numRe = gain;
    let numIm = 0;
    for (const z of zeros) {
      const dr = re - z.re;
      const di = im - z.im;
      [numRe, numIm] = [numRe * dr - numIm * di, numRe * di + numIm * dr];
    }
    let denRe = 1;
    let denIm = 0;
    for (const p of poles) {
      const dr = re - p.re;
      const di = im - p.im;
      [denRe, denIm] = [denRe * dr - denIm * di, denRe * di + denIm * dr];
    }
    const d2 = denRe * denRe + denIm * denIm;
    if (d2 < 1e-24) return { re: Infinity, im: 0 };
    return { re: (numRe * denRe + numIm * denIm) / d2, im: (numIm * denRe - numRe * denIm) / d2 };
  };
  const mag = (re, im) => {
    const v = evalX(re, im);
    return Math.hypot(v.re, v.im);
  };

  const inROC = (sigma) => sigma > roc.min + 1e-9 && sigma < roc.max - 1e-9;

  // A transformada de Fourier é X(jω): só existe (como função) se o eixo jω está DENTRO da ROC.
  const hasFourier = inROC(0);
  // Polos sobre o eixo jω (na borda da ROC): caso marginal — Fourier só com impulsos.
  const onAxis = poles.some((p) => Math.abs(p.re) < 1e-9) && !hasFourier
    && (Math.abs(roc.min) < 1e-9 || Math.abs(roc.max) < 1e-9);
  // Estabilidade BIBO de um sistema com h(t) = x(t): equivale a o eixo jω pertencer à ROC.
  const stability = hasFourier ? 'stable' : (onAxis ? 'marginal' : 'unstable');

  return {
    presetKey: key,
    rocIndex: isCustom ? customResult.rocIndex : null,
    a,
    w0,
    hasParamA: Boolean(preset.params.a),
    hasParamW0: Boolean(preset.params.w0),
    paramSpec: preset.params,
    causality: built.causality,
    fnTime: built.fnTime,
    poles,
    zeros,
    gain,
    roc,
    latexTime: built.latexTime,
    latexX: built.latexX,
    latexROC: rocLatex(roc),
    evalX,
    mag,
    inROC,
    hasFourier,
    stability
  };
}

/**
 * Integra numericamente X(s) = ∫ x(t) e^{-st} dt para conferir o par analítico.
 * Só converge para σ dentro da ROC; fora dela o resultado cresce com a janela.
 */
export function numericLaplace(fnTime, sigma, omega, tMin = -40, tMax = 40, n = 80000) {
  const dt = (tMax - tMin) / n;
  let re = 0;
  let im = 0;
  for (let i = 0; i < n; i++) {
    const t = tMin + (i + 0.5) * dt;
    const x = fnTime(t);
    if (x === 0) continue;
    const env = x * Math.exp(-sigma * t);
    re += env * Math.cos(omega * t);
    im -= env * Math.sin(omega * t);
  }
  return { re: re * dt, im: im * dt };
}
