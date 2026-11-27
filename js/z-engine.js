// ============================================================================
// Z-ENGINE.JS — Transformada Z bilateral de sequências notáveis
// ----------------------------------------------------------------------------
// X(z) = Σ x[n] z^{-n},  z = r·e^{jΩ}
//
// Cada par é descrito por polos, zeros, ganho e região de convergência (ROC):
//   X(z) = K · Π(z - z_i) / Π(z - p_k),   ROC = { r_min < |z| < r_max }
// A ROC é um anel centrado na origem. A mesma X(z) com ROCs diferentes
// corresponde a sequências diferentes (causal × anticausal).
// `roc.min = -Infinity` significa que a origem pertence à ROC.
// Sem dependência de DOM: pode ser testado com node --test.
// ============================================================================

import { buildZCustom } from './pz-engine.js';

const EPS = 1e-9;

const fmt = (v, digits = 2) => {
  const r = Math.round(v * 10 ** digits) / 10 ** digits;
  return Object.is(r, -0) ? '0' : String(r);
};

/** "z - a" com o sinal certo: a=0.8 → "z - 0.8", a=-0.5 → "z + 0.5", a=0 → "z". */
function zMinus(a) {
  if (Math.abs(a) < EPS) return 'z';
  return a > 0 ? `z - ${fmt(a)}` : `z + ${fmt(-a)}`;
}

/** Termo com sinal para polinômios: term(-1.41, 'z') → " - 1.41z"; coeficiente nulo some. */
function term(coef, tail = '') {
  if (Math.abs(coef) < 5e-3) return '';
  return ` ${coef < 0 ? '-' : '+'} ${fmt(Math.abs(coef))}${tail}`;
}

/** Base de potência legível: 0.8 → "0.8", -0.8 → "(-0.8)". */
const base = (a) => (a < 0 ? `(${fmt(a)})` : fmt(a));

const u = (n) => (n >= 0 ? 1 : 0); // degrau discreto: u[0] = 1

/**
 * Catálogo de pares. `params` diz quais parâmetros o par usa ('a' = base da
 * exponencial / raio dos polos, 'w0' = frequência Ω₀ em rad/amostra) e a faixa
 * do slider de cada um.
 */
export const Z_PRESETS = {
  delta: {
    title: 'Impulso Unitário', titleEn: 'Unit Impulse',
    params: {},
    build: () => ({
      causality: 'finite',
      fnSeq: (n) => (n === 0 ? 1 : 0),
      poles: [], zeros: [], gain: 1,
      roc: { min: -Infinity, max: Infinity },
      latexTime: '\\delta[n]',
      latexX: '1'
    })
  },
  step: {
    title: 'Degrau Unitário', titleEn: 'Unit Step',
    params: {},
    build: () => ({
      causality: 'causal',
      fnSeq: (n) => u(n),
      poles: [{ re: 1, im: 0 }], zeros: [{ re: 0, im: 0 }], gain: 1,
      roc: { min: 1, max: Infinity },
      latexTime: 'u[n]',
      latexX: '\\frac{z}{z - 1}'
    })
  },
  exp: {
    title: 'Exponencial Causal', titleEn: 'Causal Exponential',
    params: { a: { min: -1.5, max: 1.5, def: 0.8 } },
    build: ({ a }) => {
      // a = 0: a^n u[n] degenera em δ[n] (polo e zero se cancelam na origem)
      if (Math.abs(a) < EPS) {
        return {
          causality: 'causal',
          fnSeq: (n) => (n === 0 ? 1 : 0),
          poles: [], zeros: [], gain: 1,
          roc: { min: -Infinity, max: Infinity },
          latexTime: '\\delta[n]',
          latexX: '1'
        };
      }
      return {
        causality: 'causal',
        fnSeq: (n) => (n >= 0 ? a ** n : 0),
        poles: [{ re: a, im: 0 }], zeros: [{ re: 0, im: 0 }], gain: 1,
        roc: { min: Math.abs(a), max: Infinity },
        latexTime: `${base(a)}^{n}\\,u[n]`,
        latexX: `\\frac{z}{${zMinus(a)}}`
      };
    }
  },
  anticausal: {
    title: 'Exponencial Anticausal', titleEn: 'Anticausal Exponential',
    params: { a: { min: 0.3, max: 1.8, def: 0.8 } },
    build: ({ a }) => ({
      causality: 'anticausal',
      fnSeq: (n) => (n <= -1 ? -(a ** n) : 0),
      poles: [{ re: a, im: 0 }], zeros: [{ re: 0, im: 0 }], gain: 1,
      roc: { min: -Infinity, max: a },
      latexTime: `-${base(a)}^{n}\\,u[-n-1]`,
      latexX: `\\frac{z}{${zMinus(a)}}`
    })
  },
  bilateral: {
    title: 'Exponencial Bilateral', titleEn: 'Two-Sided Exponential',
    params: { a: { min: 0.5, max: 0.95, def: 0.6 } },
    build: ({ a }) => ({
      causality: 'bilateral',
      fnSeq: (n) => a ** Math.abs(n),
      // z/(z-a) - z/(z-1/a) = (a - 1/a)·z / ((z-a)(z-1/a))
      poles: [{ re: a, im: 0 }, { re: 1 / a, im: 0 }], zeros: [{ re: 0, im: 0 }], gain: a - 1 / a,
      roc: { min: a, max: 1 / a },
      latexTime: `${fmt(a)}^{|n|}`,
      latexX: `\\frac{${fmt(a - 1 / a)}\\,z}{(${zMinus(a)})(${zMinus(1 / a)})}`
    })
  },
  ramp: {
    title: 'Rampa', titleEn: 'Ramp',
    params: {},
    build: () => ({
      causality: 'causal',
      fnSeq: (n) => (n >= 0 ? n : 0),
      poles: [{ re: 1, im: 0 }, { re: 1, im: 0 }], zeros: [{ re: 0, im: 0 }], gain: 1,
      roc: { min: 1, max: Infinity },
      latexTime: 'n\\,u[n]',
      latexX: '\\frac{z}{(z - 1)^2}'
    })
  },
  cos: {
    title: 'Cosseno Causal', titleEn: 'Causal Cosine',
    params: { w0: { min: 0.2, max: 2.9, def: 0.8 } },
    build: ({ w0 }) => sinusoid({ r: 1, w0, kind: 'cos' })
  },
  sin: {
    title: 'Seno Causal', titleEn: 'Causal Sine',
    params: { w0: { min: 0.2, max: 2.9, def: 0.8 } },
    build: ({ w0 }) => sinusoid({ r: 1, w0, kind: 'sin' })
  },
  dampedcos: {
    title: 'Cosseno Amortecido', titleEn: 'Damped Cosine',
    params: { a: { min: 0.3, max: 1.5, def: 0.8 }, w0: { min: 0.2, max: 2.9, def: 0.8 } },
    build: ({ a, w0 }) => sinusoid({ r: a, w0, kind: 'cos' })
  },
  dampedsin: {
    title: 'Seno Amortecido', titleEn: 'Damped Sine',
    params: { a: { min: 0.3, max: 1.5, def: 0.8 }, w0: { min: 0.2, max: 2.9, def: 0.8 } },
    build: ({ a, w0 }) => sinusoid({ r: a, w0, kind: 'sin' })
  }
};

/**
 * r^n cos(Ω₀n) u[n]  ↔  z(z - r cosΩ₀) / (z² - 2r cosΩ₀ z + r²)
 * r^n sin(Ω₀n) u[n]  ↔  r sinΩ₀ · z   / (z² - 2r cosΩ₀ z + r²)
 * Polos em r·e^{±jΩ₀}; ROC |z| > r.
 */
function sinusoid({ r, w0, kind }) {
  const c = Math.cos(w0);
  const s = Math.sin(w0);
  const damped = Math.abs(r - 1) > EPS;
  const env = damped ? `${fmt(r)}^{n}` : '';
  const den = `z^2${term(-2 * r * c, 'z')}${term(r * r)}`;
  const isCos = kind === 'cos';
  return {
    causality: 'causal',
    fnSeq: (n) => (n >= 0 ? r ** n * (isCos ? Math.cos(w0 * n) : Math.sin(w0 * n)) : 0),
    poles: [{ re: r * c, im: r * s }, { re: r * c, im: -r * s }],
    zeros: isCos ? [{ re: 0, im: 0 }, { re: r * c, im: 0 }] : [{ re: 0, im: 0 }],
    gain: isCos ? 1 : r * s,
    roc: { min: r, max: Infinity },
    latexTime: `${env}\\${kind}(${fmt(w0)}n)\\,u[n]`,
    latexX: isCos
      ? `\\frac{${Math.abs(r * c) < 5e-3 ? 'z^2' : `z(${zMinus(r * c)})`}}{${den}}`
      : `\\frac{${fmt(r * s)}\\,z}{${den}}`
  };
}

function rocLatex(roc) {
  const lo = Number.isFinite(roc.min) ? fmt(roc.min) : null;
  const hi = Number.isFinite(roc.max) ? fmt(roc.max) : null;
  if (lo !== null && hi !== null) return `${lo} < |z| < ${hi}`;
  if (lo !== null) return `|z| > ${lo}`;
  if (hi !== null) return `|z| < ${hi}`;
  return '\\forall\\, z';
}

/**
 * Calcula o par de Transformada Z de um preset.
 * @returns dados do par: polos, zeros, ROC, x[n], X(z) avaliável em qualquer z,
 *          e as conclusões que dependem da ROC (existência da DTFT, estabilidade).
 */
export function calculateZData(presetKey = 'exp', aVal = 0.8, w0Val = 0.8, custom = null) {
  // Sequência montada pelo aluno (polos, zeros, ganho e ROC): se for inválida, cai no par padrão
  const customResult = presetKey === 'custom' && custom ? buildZCustom(custom) : null;
  const isCustom = Boolean(customResult?.ok);
  const key = isCustom ? 'custom' : (Z_PRESETS[presetKey] ? presetKey : 'exp');
  const preset = isCustom ? { params: {}, build: () => customResult.built } : Z_PRESETS[key];
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

  /** X(z) em z = re + j·im, pela forma fatorada. Vale em todo o plano (continuação analítica). */
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
  /** |X(r·e^{jΩ})| — a leitura natural no plano z. */
  const magPolar = (r, omega) => mag(r * Math.cos(omega), r * Math.sin(omega));

  const inROC = (r) => r > roc.min + EPS && r < roc.max - EPS;

  // A DTFT é X(e^{jΩ}): só existe (como função) se o círculo unitário está DENTRO da ROC.
  const hasDTFT = inROC(1);
  // Polos sobre o círculo unitário (na borda da ROC): caso marginal — DTFT só com impulsos.
  const onCircle = !hasDTFT && poles.some((p) => Math.abs(Math.hypot(p.re, p.im) - 1) < 1e-6)
    && (Math.abs(roc.min - 1) < 1e-6 || Math.abs(roc.max - 1) < 1e-6);
  // Estabilidade BIBO de um sistema com h[n] = x[n]: equivale a o círculo unitário pertencer à ROC.
  const stability = hasDTFT ? 'stable' : (onCircle ? 'marginal' : 'unstable');

  return {
    presetKey: key,
    rocIndex: isCustom ? customResult.rocIndex : null,
    a,
    w0,
    hasParamA: Boolean(preset.params.a),
    hasParamW0: Boolean(preset.params.w0),
    paramSpec: preset.params,
    causality: built.causality,
    fnSeq: built.fnSeq,
    poles,
    zeros,
    gain,
    roc,
    latexTime: built.latexTime,
    latexX: built.latexX,
    latexROC: rocLatex(roc),
    evalX,
    mag,
    magPolar,
    inROC,
    hasDTFT,
    stability
  };
}

/**
 * Soma numericamente X(z) = Σ x[n] z^{-n} para conferir o par analítico.
 * Só converge para |z| dentro da ROC; fora dela a soma cresce com a janela.
 */
export function numericZ(fnSeq, re, im, nMin = -300, nMax = 300) {
  const r = Math.hypot(re, im);
  const theta = Math.atan2(im, re);
  let sumRe = 0;
  let sumIm = 0;
  for (let n = nMin; n <= nMax; n++) {
    const x = fnSeq(n);
    if (x === 0) continue;
    const m = x * r ** -n;
    sumRe += m * Math.cos(theta * n);
    sumIm -= m * Math.sin(theta * n);
  }
  return { re: sumRe, im: sumIm };
}
