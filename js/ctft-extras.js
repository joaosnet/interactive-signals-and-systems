// ============================================================================
// CTFT-EXTRAS.JS — Propriedades e transformada inversa sobre um par de CTFT
// ----------------------------------------------------------------------------
// Recebe o resultado de calculateCTFTData (fnTime, fnMag, fnPhase, energia...)
// e devolve o par transformado pela propriedade escolhida:
//   deslocamento  y(t) = x(t - t₀)        Y(ω) = X(ω) e^{-jωt₀}
//   escala        y(t) = x(at)            Y(ω) = (1/|a|) X(ω/a)
//   modulação     y(t) = x(t) cos(ω₀t)    Y(ω) = ½[X(ω - ω₀) + X(ω + ω₀)]
// e a síntese limitada em banda (transformada inversa):
//   x_W(t) = (1/2π) ∫_{-W}^{W} X(ω) e^{jωt} dω
// Vale para sinais reais (X(-ω) = X*(ω)). Sem dependência de DOM.
// ============================================================================

/** Modos de exploração da CTFT e a faixa do slider de cada um. */
export const CTFT_MODE_SPECS = {
  shift: { min: -3, max: 3, def: 1.0, step: 0.1, symbol: 't₀', unit: 's' },
  scale: { min: -3, max: 3, def: 2.0, step: 0.05, symbol: 'a', unit: '', minAbs: 0.25 },
  mod: { min: 0, max: 12, def: 6.0, step: 0.2, symbol: 'ω₀', unit: 'rad/s' },
  inverse: { min: 0.5, max: 30, def: 6.0, step: 0.5, symbol: 'W', unit: 'rad/s' }
};
export const CTFT_MODES = ['none', ...Object.keys(CTFT_MODE_SPECS)];

export function clampModeValue(mode, value) {
  const spec = CTFT_MODE_SPECS[mode];
  if (!spec) return 0;
  const v = Number.isFinite(Number(value)) && value !== null && value !== undefined ? Number(value) : spec.def;
  const clamped = Math.max(spec.min, Math.min(spec.max, v));
  // Escala: a = 0 não existe (x(0·t) é constante); perto de zero o valor "pula" para ±minAbs
  if (spec.minAbs && Math.abs(clamped) < spec.minAbs) return clamped < 0 ? -spec.minAbs : spec.minAbs;
  return clamped;
}

const fmt = (v, d = 2) => {
  const r = Math.round(v * 10 ** d) / 10 ** d;
  return Object.is(r, -0) ? '0' : String(r);
};

/** X(ω) complexo a partir de magnitude e fase. */
export function complexX(calc, w) {
  const m = calc.fnMag(w);
  const p = calc.fnPhase(w);
  return { re: m * Math.cos(p), im: m * Math.sin(p) };
}

/** Reduz uma fase a (-π, π]. */
function wrapPhase(p) {
  let w = p % (2 * Math.PI);
  if (w > Math.PI) w -= 2 * Math.PI;
  if (w <= -Math.PI) w += 2 * Math.PI;
  return w;
}

/** ∫ f(t)² dt numérico na janela onde o sinal vive (para a energia do sinal modulado). */
function timeEnergy(fn, tMin = -14, tMax = 14, n = 5600) {
  const dt = (tMax - tMin) / n;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const v = fn(tMin + (i + 0.5) * dt);
    acc += v * v;
  }
  return acc * dt;
}

/**
 * Aplica uma propriedade ao par. Devolve os campos que substituem os do par
 * original (fnTime, fnMag, fnPhase, energia, X(0)) e os textos da propriedade.
 */
export function applyCTFTProperty(calc, mode, rawValue) {
  const value = clampModeValue(mode, rawValue);

  if (mode === 'shift') {
    const t0 = value;
    const sign = t0 < 0 ? '+' : '-';
    const mag = fmt(Math.abs(t0));
    return {
      mode, value,
      fnTime: (t) => calc.fnTime(t - t0),
      fnMag: (w) => calc.fnMag(w),
      fnPhase: (w) => (calc.fnMag(w) < 1e-9 ? 0 : wrapPhase(calc.fnPhase(w) - w * t0)),
      energyTime: calc.energyTime,
      valX0: calc.valX0,
      labelTime: Math.abs(t0) < 1e-9 ? 'x(t)' : `x(t ${sign} ${mag})`,
      labelSpec: '|X(\\omega)|',
      ruleLatex: 'x(t - t_0) \\;\\longleftrightarrow\\; X(\\omega)\\,e^{-j\\omega t_0}',
      caseLatex: `y(t) = x(t ${sign} ${mag}) \\;\\longleftrightarrow\\; Y(\\omega) = X(\\omega)\\,e^{${t0 < 0 ? '' : '-'}j${mag}\\omega}`,
      effect: 'shift'
    };
  }

  if (mode === 'scale') {
    const a = value;
    return {
      mode, value,
      fnTime: (t) => calc.fnTime(a * t),
      fnMag: (w) => calc.fnMag(w / a) / Math.abs(a),
      fnPhase: (w) => calc.fnPhase(w / a),
      energyTime: calc.energyTime / Math.abs(a),
      valX0: calc.valX0 / Math.abs(a),
      labelTime: `x(${fmt(a)}t)`,
      labelSpec: `\\tfrac{1}{${fmt(Math.abs(a))}}\\left|X\\!\\left(\\tfrac{\\omega}{${fmt(a)}}\\right)\\right|`,
      ruleLatex: 'x(at) \\;\\longleftrightarrow\\; \\frac{1}{|a|}\\,X\\!\\left(\\frac{\\omega}{a}\\right)',
      caseLatex: `y(t) = x(${fmt(a)}t) \\;\\longleftrightarrow\\; Y(\\omega) = \\frac{1}{${fmt(Math.abs(a))}}\\,X\\!\\left(\\frac{\\omega}{${fmt(a)}}\\right)`,
      // a < 0 reflete o sinal no tempo (e conjuga o espectro, para x(t) real)
      effect: a < 0 ? 'reflect' : (a > 1 ? 'compress' : (a < 1 ? 'expand' : 'same'))
    };
  }

  if (mode === 'mod') {
    const w0 = value;
    const Y = (w) => {
      const lo = complexX(calc, w - w0);
      const hi = complexX(calc, w + w0);
      return { re: 0.5 * (lo.re + hi.re), im: 0.5 * (lo.im + hi.im) };
    };
    const fnTime = (t) => calc.fnTime(t) * Math.cos(w0 * t);
    return {
      mode, value,
      fnTime,
      fnMag: (w) => {
        const y = Y(w);
        return Math.hypot(y.re, y.im);
      },
      fnPhase: (w) => {
        const y = Y(w);
        return Math.hypot(y.re, y.im) < 1e-9 ? 0 : Math.atan2(y.im, y.re);
      },
      energyTime: timeEnergy(fnTime),
      valX0: Y(0).re,
      labelTime: `x(t)\\cos(${fmt(w0)}t)`,
      labelSpec: '|Y(\\omega)|',
      ruleLatex: 'x(t)\\cos(\\omega_0 t) \\;\\longleftrightarrow\\; \\tfrac{1}{2}\\left[X(\\omega - \\omega_0) + X(\\omega + \\omega_0)\\right]',
      caseLatex: `Y(\\omega) = \\tfrac{1}{2}\\left[X(\\omega - ${fmt(w0)}) + X(\\omega + ${fmt(w0)})\\right]`,
      effect: 'mod'
    };
  }

  return null;
}

/**
 * Síntese limitada em banda: x_W(t) = (1/2π) ∫_{-W}^{W} X(ω) e^{jωt} dω.
 * Para x(t) real isso é (1/π) ∫_0^W |X(ω)| cos(ωt + ∠X(ω)) dω.
 */
export function sampleSpectrum(calc, W, n = 600) {
  const dw = W / n;
  const w = new Float64Array(n);
  const mag = new Float64Array(n);
  const ph = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    w[i] = (i + 0.5) * dw;
    mag[i] = calc.fnMag(w[i]);
    ph[i] = calc.fnPhase(w[i]);
  }
  return { w, mag, ph, dw, n };
}

export function inverseAt(spec, t) {
  let acc = 0;
  for (let i = 0; i < spec.n; i++) acc += spec.mag[i] * Math.cos(spec.w[i] * t + spec.ph[i]);
  return (acc * spec.dw) / Math.PI;
}

export function inverseCTFT(calc, t, W, n = 600) {
  return inverseAt(sampleSpectrum(calc, W, n), t);
}

/** Fração da energia de x(t) que está na banda |ω| ≤ W (Parseval). */
export function bandEnergyFraction(calc, W, n = 600) {
  const spec = sampleSpectrum(calc, W, n);
  let acc = 0;
  for (let i = 0; i < spec.n; i++) acc += spec.mag[i] * spec.mag[i];
  const inBand = (acc * spec.dw) / Math.PI;
  return calc.energyTime > 1e-12 ? Math.min(1, inBand / calc.energyTime) : 0;
}

// Cache da curva reconstruída: só refaz quando o par ou W mudam (a cena redesenha a cada quadro).
const curveCache = new WeakMap();
export function reconstructionCurve(calc, W, tMin, tMax, steps) {
  const hit = curveCache.get(calc);
  if (hit && hit.W === W && hit.steps === steps && hit.tMin === tMin && hit.tMax === tMax) return hit.pts;
  const spec = sampleSpectrum(calc, W);
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = tMin + (i / steps) * (tMax - tMin);
    pts.push({ t, y: inverseAt(spec, t) });
  }
  curveCache.set(calc, { W, steps, tMin, tMax, pts });
  return pts;
}
