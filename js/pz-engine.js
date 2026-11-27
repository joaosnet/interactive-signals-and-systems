// ============================================================================
// PZ-ENGINE.JS — Sinais montados pelo aluno a partir de polos e zeros (sem DOM)
// ----------------------------------------------------------------------------
// O aluno escolhe polos, zeros, ganho e a região de convergência; daqui sai o
// mesmo formato que os pares prontos de Laplace e Z usam (fnTime/fnSeq, polos,
// zeros, ROC, textos).
//   Laplace: x(t) por frações parciais (polos distintos, X(s) estritamente própria).
//   Z:       x[n] pela integral de inversão num círculo dentro da ROC,
//            x[n] = (1/2π) ∮ X(z) z^{n-1} dz, calculada como soma em M pontos.
// Polos e zeros complexos são guardados só com Im ≥ 0; o conjugado é implícito,
// para o sinal ser sempre real.
// ============================================================================

const EPS = 1e-6;

const fmt = (v, digits = 2) => {
  const r = Math.round(v * 10 ** digits) / 10 ** digits;
  return Object.is(r, -0) ? '0' : String(r);
};

const cmul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const cdiv = (a, b) => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
const csub = (a, b) => ({ re: a.re - b.re, im: a.im - b.im });

/** Lista guardada (Im ≥ 0) → lista completa, com os conjugados. */
export function expandConj(list = []) {
  const out = [];
  list.forEach((p) => {
    const re = Number(p.re) || 0;
    const im = Math.abs(Number(p.im) || 0);
    if (im < EPS) out.push({ re, im: 0 });
    else out.push({ re, im }, { re, im: -im });
  });
  return out;
}

function evalRational(poles, zeros, gain, s) {
  let num = { re: gain, im: 0 };
  zeros.forEach((z) => { num = cmul(num, csub(s, z)); });
  let den = { re: 1, im: 0 };
  poles.forEach((p) => { den = cmul(den, csub(s, p)); });
  return cdiv(num, den);
}

/** Fatores de um polinômio em `v` ('s' ou 'z'): raízes reais e pares conjugados. */
function factorsLatex(list, v) {
  const parts = [];
  const groups = [];
  list.forEach((p) => {
    const g = groups.find((it) => Math.abs(it.p.re - p.re) < EPS && Math.abs(it.p.im - p.im) < EPS);
    if (g) g.n += 1;
    else groups.push({ p, n: 1 });
  });
  groups.forEach(({ p, n }) => {
    let f;
    if (p.im < EPS) {
      f = Math.abs(p.re) < 5e-3 ? v : `(${v} ${p.re > 0 ? '-' : '+'} ${fmt(Math.abs(p.re))})`;
    } else {
      const b = -2 * p.re;
      const c = p.re * p.re + p.im * p.im;
      const mid = Math.abs(b) < 5e-3 ? '' : ` ${b < 0 ? '-' : '+'} ${fmt(Math.abs(b))}${v}`;
      f = `(${v}^2${mid} + ${fmt(c)})`;
    }
    parts.push(n > 1 ? `${f}^{${n}}` : f);
  });
  return parts.join('');
}

function rationalLatex(stored, v) {
  const num = factorsLatex(stored.zeros || [], v);
  const den = factorsLatex(stored.poles || [], v);
  const k = Number(stored.gain);
  const kTxt = Math.abs(k - 1) < 5e-3 ? '' : (Math.abs(k + 1) < 5e-3 ? '-' : fmt(k));
  const top = num ? `${kTxt}${kTxt && kTxt !== '-' ? '\\,' : ''}${num}` : (kTxt === '' ? '1' : (kTxt === '-' ? '-1' : kTxt));
  return den ? `\\frac{${top}}{${den}}` : top;
}

/** Limites comuns: ganho finito e não nulo, listas com tamanho razoável. */
function normalize(custom, { maxPoles = 4, maxZeros = 4 } = {}) {
  const clean = (list, max) => (Array.isArray(list) ? list : []).slice(0, max).map((p) => ({
    re: Math.max(-9, Math.min(9, Number(p.re) || 0)),
    im: Math.max(0, Math.min(9, Math.abs(Number(p.im) || 0)))
  })).map((p) => ({ re: p.re, im: p.im < 0.04 ? 0 : p.im }));
  const g = Number(custom?.gain);
  return {
    poles: clean(custom?.poles, maxPoles),
    zeros: clean(custom?.zeros, maxZeros),
    gain: Number.isFinite(g) && Math.abs(g) > 1e-6 ? Math.max(-20, Math.min(20, g)) : 1,
    rocIndex: Number.isInteger(custom?.rocIndex) ? custom.rocIndex : null
  };
}

function hasRepeated(points) {
  return points.some((p, i) => points.some((q, j) => j > i && Math.hypot(p.re - q.re, p.im - q.im) < 0.045));
}

// ============================== LAPLACE ==============================

/** Faixas verticais possíveis para a ROC: entre as partes reais distintas dos polos. */
export function laplaceRocOptions(storedPoles) {
  const edges = [...new Set(expandConj(storedPoles).map((p) => Math.round(p.re * 1000) / 1000))].sort((a, b) => a - b);
  const regions = [];
  for (let i = 0; i <= edges.length; i++) {
    regions.push({ min: i === 0 ? -Infinity : edges[i - 1], max: i === edges.length ? Infinity : edges[i] });
  }
  return regions;
}

/**
 * @returns { ok: true, built } no formato de LAPLACE_PRESETS[k].build(), ou { ok: false, error }
 *   error: 'nopole' | 'improper' (zeros ≥ polos) | 'repeated' (polos coincidentes)
 */
export function buildLaplaceCustom(custom) {
  const c = normalize(custom);
  const poles = expandConj(c.poles);
  const zeros = expandConj(c.zeros);
  if (poles.length === 0) return { ok: false, error: 'nopole' };
  if (zeros.length >= poles.length) return { ok: false, error: 'improper' };
  if (hasRepeated(poles)) return { ok: false, error: 'repeated' };

  const regions = laplaceRocOptions(c.poles);
  const rocIndex = c.rocIndex === null ? regions.length - 1 : Math.max(0, Math.min(regions.length - 1, c.rocIndex));
  const roc = regions[rocIndex];
  const causality = rocIndex === regions.length - 1 ? 'causal' : (rocIndex === 0 ? 'anticausal' : 'bilateral');

  // Resíduos: r_k = K · Π(p_k - z_i) / Π_{j≠k}(p_k - p_j)
  const terms = poles.map((p, k) => {
    let num = { re: c.gain, im: 0 };
    zeros.forEach((z) => { num = cmul(num, csub(p, z)); });
    let den = { re: 1, im: 0 };
    poles.forEach((q, j) => { if (j !== k) den = cmul(den, csub(p, q)); });
    // Polo à esquerda da ROC → parcela causal; à direita → parcela anticausal
    return { p, r: cdiv(num, den), causal: p.re <= roc.min + EPS };
  });

  const fnTime = (t) => {
    const side = Math.abs(t) < 1e-12 ? 0.5 : null;
    let acc = 0;
    for (const { p, r, causal } of terms) {
      const active = causal ? t > 0 : t < 0;
      if (!active && side === null) continue;
      const e = Math.exp(p.re * t);
      const value = e * (r.re * Math.cos(p.im * t) - r.im * Math.sin(p.im * t)); // Re{r·e^{pt}}
      acc += (causal ? 1 : -1) * value * (side ?? 1);
    }
    return Math.abs(acc) < 1e-12 ? 0 : acc;
  };

  // x(t) escrito por frações parciais: um termo por polo real e um por par conjugado
  const pieces = [];
  terms.filter((t) => t.p.im >= 0).forEach(({ p, r, causal }) => {
    const step = causal ? 'u(t)' : 'u(-t)';
    const mag = Math.abs(Math.abs(p.re) - 1) < 5e-3 ? '' : fmt(Math.abs(p.re));
    const expo = Math.abs(p.re) < 5e-3 ? '' : `e^{${p.re < 0 ? '-' : ''}${mag}t}`;
    let amp;
    let body;
    if (p.im < EPS) {
      amp = r.re;
      body = expo;
    } else {
      amp = 2 * Math.hypot(r.re, r.im);
      const phase = Math.atan2(r.im, r.re);
      const ph = Math.abs(phase) < 5e-3 ? '' : ` ${phase < 0 ? '-' : '+'} ${fmt(Math.abs(phase))}`;
      body = `${expo}\\cos(${fmt(p.im)}t${ph})`;
    }
    const signed = (causal ? 1 : -1) * amp;
    if (Math.abs(signed) < 5e-3) return;
    // Amplitude 1 não é escrita quando há uma exponencial ou um cosseno para carregá-la
    const ampTxt = body && Math.abs(Math.abs(signed) - 1) < 5e-3 ? '' : `${fmt(Math.abs(signed))}\\,`;
    pieces.push({ sign: signed < 0 ? '-' : '+', text: `${ampTxt}${body}${body ? '\\,' : ''}${step}` });
  });
  const latexTime = pieces.length === 0
    ? '0'
    : pieces.slice(0, 3).map((pc, i) => (i === 0 ? (pc.sign === '-' ? '-' : '') : ` ${pc.sign} `) + pc.text).join('')
      + (pieces.length > 3 ? ' + \\cdots' : '');

  return {
    ok: true,
    rocIndex,
    regions,
    built: {
      causality,
      fnTime,
      poles,
      zeros,
      gain: c.gain,
      roc,
      latexTime,
      latexX: rationalLatex(c, 's')
    }
  };
}

// ============================== Z ==============================

/** Anéis possíveis para a ROC: entre os módulos distintos dos polos. */
export function zRocOptions(storedPoles) {
  const radii = [...new Set(expandConj(storedPoles).map((p) => Math.round(Math.hypot(p.re, p.im) * 1000) / 1000))].sort((a, b) => a - b);
  const hasOriginPole = radii.length > 0 && radii[0] < 1e-3;
  const edges = radii.filter((r) => r >= 1e-3);
  const regions = [];
  for (let i = 0; i <= edges.length; i++) {
    regions.push({
      // Sem polo na origem, o disco interno inclui z = 0
      min: i === 0 ? (hasOriginPole ? 0 : -Infinity) : edges[i - 1],
      max: i === edges.length ? Infinity : edges[i]
    });
  }
  return regions;
}

const Z_CONTOUR_POINTS = 2048;

/**
 * @returns { ok: true, built } no formato de Z_PRESETS[k].build(), ou { ok: false, error }
 *   error: 'empty' (sem polos nem zeros) | 'repeated' | 'narrow' (anel estreito demais para inverter)
 */
export function buildZCustom(custom) {
  const c = normalize(custom);
  const poles = expandConj(c.poles);
  const zeros = expandConj(c.zeros);
  if (poles.length === 0 && zeros.length === 0) return { ok: false, error: 'empty' };
  if (hasRepeated(poles)) return { ok: false, error: 'repeated' };

  const regions = zRocOptions(c.poles);
  const rocIndex = c.rocIndex === null ? regions.length - 1 : Math.max(0, Math.min(regions.length - 1, c.rocIndex));
  const roc = regions[rocIndex];
  const lo = Math.max(0, roc.min);
  const hiFinite = Number.isFinite(roc.max);
  if (hiFinite && roc.max - lo < 0.06) return { ok: false, error: 'narrow' };
  // Raio do círculo de integração, bem dentro da ROC
  const r0 = hiFinite ? (lo > 0 ? Math.sqrt(lo * roc.max) : roc.max * 0.6) : Math.max(1, lo * 1.3 + 0.1);

  const samples = [];
  for (let m = 0; m < Z_CONTOUR_POINTS; m++) {
    const th = (2 * Math.PI * m) / Z_CONTOUR_POINTS;
    samples.push({ th, X: evalRational(poles, zeros, c.gain, { re: r0 * Math.cos(th), im: r0 * Math.sin(th) }) });
  }
  const cache = new Map();
  const fnSeq = (n) => {
    if (!Number.isInteger(n) || Math.abs(n) > 400) return 0;
    if (cache.has(n)) return cache.get(n);
    // x[n] = r0^n · (1/M) Σ X(r0 e^{jθ}) e^{jθn}  (parte real; a imaginária some por simetria)
    let acc = 0;
    for (const { th, X } of samples) acc += X.re * Math.cos(th * n) - X.im * Math.sin(th * n);
    let v = (acc / Z_CONTOUR_POINTS) * r0 ** n;
    if (Math.abs(v) < 1e-9) v = 0;
    cache.set(n, v);
    return v;
  };

  const outer = rocIndex === regions.length - 1;
  const causality = poles.length === 0 ? 'finite' : (outer ? 'causal' : (rocIndex === 0 ? 'anticausal' : 'bilateral'));
  const from = causality === 'causal' ? 0 : -2;
  const shown = [];
  for (let n = from; n <= from + 4; n++) {
    const txt = fmt(fnSeq(n));
    shown.push(n === 0 ? `\\underset{\\uparrow}{${txt}}` : txt);
  }
  const latexTime = `\\{${from < 0 ? '\\ldots,\\,' : ''}${shown.join(',\\,')},\\,\\ldots\\}`;

  return {
    ok: true,
    rocIndex,
    regions,
    built: {
      causality,
      fnSeq,
      poles,
      zeros,
      gain: c.gain,
      roc,
      latexTime,
      latexX: rationalLatex(c, 'z')
    }
  };
}

/** Texto simples (sem LaTeX) de uma região, para o seletor de ROC do editor. */
export function rocText(region, kind) {
  const name = kind === 'z' ? '|z|' : 'Re{s}';
  const lo = Number.isFinite(region.min) && !(kind === 'z' && region.min <= 0) ? fmt(region.min) : null;
  const hi = Number.isFinite(region.max) ? fmt(region.max) : null;
  if (lo !== null && hi !== null) return `${lo} < ${name} < ${hi}`;
  if (lo !== null) return `${name} > ${lo}`;
  if (hi !== null) return `${name} < ${hi}`;
  return kind === 'z' ? 'todo o plano z' : 'todo o plano s';
}
