// ============================================================================
// MATH-ENGINE.JS — Compilação de Sinais, Detecção de Regiões e Fourier
// ============================================================================

export function renderMath(el, latex, displayMode = false) {
  if (!el) return;
  if (window.katex) {
    try {
      window.katex.render(latex, el, {
        output: 'html',
        throwOnError: false,
        displayMode,
        strict: 'ignore'
      });
      return;
    } catch (err) {}
  }
  el.textContent = latex;
}

export function latexToHtml(latex, displayMode = false) {
  if (window.katex) {
    try {
      return window.katex.renderToString(latex, {
        output: 'html',
        throwOnError: false,
        displayMode,
        strict: 'ignore'
      });
    } catch (err) {
      return latex;
    }
  }
  return latex;
}

function replaceBalancedCall(str, prefix, openOut, closeOut) {
  let out = '';
  let idx = 0;
  while (idx < str.length) {
    const found = str.indexOf(prefix, idx);
    if (found === -1) {
      out += str.slice(idx);
      break;
    }
    // Ensure word boundary if prefix starts with a letter
    if (found > 0 && /[a-zA-Z]/.test(prefix[0]) && /[a-zA-Z0-9_]/.test(str[found - 1])) {
      out += str.slice(idx, found + prefix.length);
      idx = found + prefix.length;
      continue;
    }
    out += str.slice(idx, found);
    let depth = 1;
    let scan = found + prefix.length;
    while (scan < str.length && depth > 0) {
      if (str[scan] === '(') depth++;
      else if (str[scan] === ')') depth--;
      scan++;
    }
    if (depth === 0) {
      const inner = str.slice(found + prefix.length, scan - 1).trim();
      out += openOut + inner + closeOut;
      idx = scan;
    } else {
      out += str.slice(found, found + prefix.length);
      idx = found + prefix.length;
    }
  }
  return out;
}

export function exprToLatex(expr, varName = 't') {
  if (!expr || !expr.trim()) return '0';
  let s = expr.trim();
  if (varName !== 't') {
    s = s.replace(/\bt\b/g, varName);
    // Simplify double negation -(-\tau) in exponents/parentheses -> \tau
    if (varName === '(-\\tau)') {
      s = s.replace(/([(^])-\(\s*-\\tau\s*\)/g, '$1\\tau');
    }
    // Remove redundant double parentheses like u((-\tau)) -> u(-\tau)
    s = s.replace(/\(\(([^()]+)\)\)/g, '($1)');
  }
  s = s.replace(/\bpi\b/gi, '\\pi ');
  s = replaceBalancedCall(s, 'e^(', 'e^{', '}');
  s = s.replace(/e\^([a-zA-Z0-9_\\+-]+)/g, 'e^{$1}');
  s = replaceBalancedCall(s, 'abs(', '\\left|', '\\right|');
  s = replaceBalancedCall(s, 'rect(', '\\mathrm{rect}(', ')');
  s = replaceBalancedCall(s, 'tri(', '\\mathrm{tri}(', ')');
  s = replaceBalancedCall(s, 'sincpi(', '\\mathrm{sinc}_{\\pi}(', ')');
  s = replaceBalancedCall(s, 'sinc(', '\\mathrm{sinc}(', ')');
  s = replaceBalancedCall(s, 'sin(', '\\sin(', ')');
  s = replaceBalancedCall(s, 'cos(', '\\cos(', ')');
  s = replaceBalancedCall(s, 'sign(', '\\mathrm{sgn}(', ')');
  s = replaceBalancedCall(s, 'sgn(', '\\mathrm{sgn}(', ')');
  s = replaceBalancedCall(s, 'delta(', '\\delta(', ')');
  s = s.replace(/\*/g, '\\cdot ');
  return s;
}

function extractBraceGroup(str, startIdx) {
  if (str[startIdx] !== '{') return null;
  let depth = 1;
  let i = startIdx + 1;
  while (i < str.length && depth > 0) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') depth--;
    i++;
  }
  if (depth !== 0) return null;
  return { content: str.slice(startIdx + 1, i - 1), endIdx: i };
}

export function latexToExpr(latex) {
  if (!latex || !latex.trim()) return '0';
  let s = latex.trim();

  // Normaliza comandos de agrupamento e espaçamento do MathLive/LaTeX
  s = s.replace(/\\mleft|\\left/g, '');
  s = s.replace(/\\mright|\\right/g, '');
  s = s.replace(/\\,|\\;|\\:|\\!|\\quad|\\qquad|\\ /g, ' ');
  s = s.replace(/\\cdot|\\times|\\ast/g, '*');
  s = s.replace(/\\div/g, '/');
  s = s.replace(/−/g, '-');

  // Converte barras de valor absoluto |x| em abs(x)
  s = s.replace(/\|([^|]+)\|/g, 'abs($1)');

  // Normaliza sinc_\pi / \mathrm{sinc}_{\pi} antes de remover wrappers
  s = s.replace(/\\(?:mathrm|operatorname)\s*\{\s*sinc\s*\}\s*_\s*\{\s*\\pi\s*\}/g, 'sincpi');
  s = s.replace(/\bsinc\s*_\s*\{\s*\\pi\s*\}/g, 'sincpi');
  s = s.replace(/\\sincpi\b/g, 'sincpi');

  // Remove wrappers de texto/operador (\mathrm{rect} -> rect, \operatorname{tri} -> tri)
  let guardWrap = 0;
  while (/\\(mathrm|operatorname|text|mathit|mathbf)\s*\{/.test(s) && guardWrap++ < 15) {
    s = s.replace(/\\(mathrm|operatorname|text|mathit|mathbf)\s*\{([^{}]*)\}/g, '$2');
  }

  // Converte \frac{a}{b} e \dfrac{a}{b}
  let guardFrac = 0;
  while (/\\d?frac\s*\{/.test(s) && guardFrac++ < 15) {
    const match = s.match(/\\d?frac\s*\{/);
    if (!match) break;
    const startBrace1 = match.index + match[0].length - 1;
    const g1 = extractBraceGroup(s, startBrace1);
    if (!g1) break;
    let nextIdx = g1.endIdx;
    while (nextIdx < s.length && /\s/.test(s[nextIdx])) nextIdx++;
    const g2 = extractBraceGroup(s, nextIdx);
    if (!g2) break;
    const num = g1.content.trim();
    const den = g2.content.trim();
    const numStr = /^[a-zA-Z0-9_.]+$/.test(num) ? num : `(${num})`;
    const denStr = /^[a-zA-Z0-9_.]+$/.test(den) ? den : `(${den})`;
    s = s.slice(0, match.index) + `(${numStr}/${denStr})` + s.slice(g2.endIdx);
  }

  // Converte \sqrt{a} -> sqrt(a)
  let guardSqrt = 0;
  while (/\\sqrt\s*\{/.test(s) && guardSqrt++ < 10) {
    const match = s.match(/\\sqrt\s*\{/);
    if (!match) break;
    const startBrace = match.index + match[0].length - 1;
    const g = extractBraceGroup(s, startBrace);
    if (!g) break;
    s = s.slice(0, match.index) + `sqrt(${g.content})` + s.slice(g.endIdx);
  }

  // Converte potências com chaves ^{...} -> ^(...)
  let guardPow = 0;
  while (/\^\s*\{/.test(s) && guardPow++ < 15) {
    const match = s.match(/\^\s*\{/);
    if (!match) break;
    const startBrace = match.index + match[0].length - 1;
    const g = extractBraceGroup(s, startBrace);
    if (!g) break;
    const inner = g.content.trim();
    const wrapped = /^[a-zA-Z0-9_.]+$/.test(inner) ? inner : `(${inner})`;
    s = s.slice(0, match.index) + `^${wrapped}` + s.slice(g.endIdx);
  }

  // Comandos matemáticos LaTeX
  s = s
    .replace(/\\pi\b/g, 'pi')
    .replace(/\\delta\b/g, 'delta')
    .replace(/\\sin\b/g, 'sin')
    .replace(/\\cos\b/g, 'cos')
    .replace(/\\exp\b/g, 'exp')
    .replace(/\\sgn\b/g, 'sign')
    .replace(/\\sinc\b/g, 'sinc')
    .replace(/\\rect\b/g, 'rect')
    .replace(/\\tri\b/g, 'tri')
    .replace(/\\placeholder\s*\{[^{}]*\}/g, 't')
    .replace(/\\exponentialE\b/g, 'e')
    .replace(/\\imaginaryI\b/g, '1');

  // Converte colchetes e chaves residuais em parênteses
  s = s.replace(/\[/g, '(').replace(/\]/g, ')');
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');

  // Remove barras invertidas residuais
  s = s.replace(/\\/g, '');

  // Insere multiplicação explícita onde há multiplicação implícita:
  // 1) Número seguido de letra ou '(' (ex: 2t -> 2*t, 2u(t) -> 2*u(t), 2(t-1) -> 2*(t-1))
  s = s.replace(/(\d)\s*([a-zA-Z(])/g, '$1*$2');
  // 2) ')' seguido de '(' ou letra ou número (ex: (t)(u(t)) -> (t)*(u(t)), e^(-t)u(t) -> e^(-t)*u(t))
  s = s.replace(/\)\s*(\(|[a-zA-Z0-9])/g, ')*$1');
  // 3) 'pi' ou 't' isolados seguidos de letra ou '(' (ex: pi t -> pi*t, t u(t) -> t*u(t), t(u(t)) -> t*(u(t)))
  s = s.replace(/\b(pi|t)\b\s*(\(|[a-zA-Z])/g, '$1*$2');

  // Limpa espaços múltiplos
  s = s.replace(/\s+/g, ' ').trim();
  return s || '0';
}

const SIGNAL_HELPERS = {
  u: (v) => (Math.abs(v) < 1e-12 ? 0.5 : (v > 0 ? 1.0 : 0.0)),
  r: (v) => (v >= 0 ? v : 0.0),
  rect: (v) => (Math.abs(Math.abs(v) - 0.5) < 1e-12 ? 0.5 : (Math.abs(v) < 0.5 ? 1.0 : 0.0)),
  tri: (v) => (Math.abs(v) <= 1.0 ? 1.0 - Math.abs(v) : 0.0),
  // Convenção UFPA / B. P. Lathi: sinc(x) = sin(x)/x; sincpi(x) = sin(pi*x)/(pi*x)
  sinc: (v) => (Math.abs(v) < 1e-7 ? 1.0 : Math.sin(v) / v),
  sincpi: (v) => (Math.abs(v) < 1e-7 ? 1.0 : Math.sin(Math.PI * v) / (Math.PI * v)),
  sign: (v) => (v > 0 ? 1.0 : v < 0 ? -1.0 : 0.0),
  get sgn() { return this.sign; },
  delta: (v) => {
    const eps = 0.025;
    return Math.abs(v) <= eps ? (1.0 / (2 * eps)) : 0.0;
  }
};

function buildSignalEvaluator(expr) {
  const raw = (expr || '0').trim();
  const clean = (raw.includes('\\') || raw.includes('{') || /\)\s*[a-zA-Z(]/.test(raw) || /\d\s*[a-zA-Z(]/.test(raw))
    ? latexToExpr(raw)
    : raw;

  let jsExpr = clean;
  jsExpr = replaceBalancedCall(jsExpr, 'e^(', 'exp(', ')');
  jsExpr = jsExpr.replace(/e\^([a-zA-Z0-9_\\+-]+)/g, 'exp($1)');

  let pGuard = 0;
  while (jsExpr.includes('^') && pGuard++ < 8) {
    const prev = jsExpr;
    jsExpr = jsExpr.replace(/(\([^()]+\)|[a-zA-Z0-9_.]+)\s*\^\s*(\([^()]+\)|[a-zA-Z0-9_.]+)/g, 'Math.pow($1, $2)');
    if (jsExpr === prev) break;
  }
  jsExpr = jsExpr.replace(/\^/g, '**');

  jsExpr = jsExpr
    .replace(/\bpi\b/gi, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
    .replace(/\bsin\s*\(/g, 'Math.sin(')
    .replace(/\bcos\s*\(/g, 'Math.cos(')
    .replace(/\bexp\s*\(/g, 'Math.exp(')
    .replace(/\bsqrt\s*\(/g, 'Math.sqrt(')
    .replace(/\babs\s*\(/g, 'Math.abs(')
    .replace(/\bsincpi\s*\(/g, 'sincpi(')
    .replace(/\bsign\s*\(/g, 'sign(')
    .replace(/\bsgn\s*\(/g, 'sgn(')
    .replace(/\bdelta\s*\(/g, 'delta(');

  const { u, r, rect, tri, sinc, sincpi, sign, sgn, delta } = SIGNAL_HELPERS;
  const rawFn = new Function(
    't', 'u', 'r', 'rect', 'tri', 'sinc', 'sincpi', 'sign', 'sgn', 'delta',
    `"use strict"; return Number(${jsExpr}) || 0;`
  );
  // Testa avaliação inicial para capturar SyntaxError / ReferenceError
  rawFn(-1.0, u, r, rect, tri, sinc, sincpi, sign, sgn, delta);
  rawFn(0.0, u, r, rect, tri, sinc, sincpi, sign, sgn, delta);
  rawFn(0.5, u, r, rect, tri, sinc, sincpi, sign, sgn, delta);

  const safeFn = (tVal) => {
    try {
      const v = rawFn(tVal, u, r, rect, tri, sinc, sincpi, sign, sgn, delta);
      return Number.isFinite(v) ? v : 0;
    } catch (e) {
      return 0;
    }
  };
  safeFn._hasDelta = /\bdelta\s*\(/.test(clean);
  return { fn: safeFn, cleanExpr: clean };
}

export function compileSignalExpr(expr) {
  try {
    return buildSignalEvaluator(expr).fn;
  } catch (err) {
    return () => 0;
  }
}

/**
 * Valida uma expressão de sinal de forma não-destrutiva (sem quebrar durante a digitação)
 * e retorna função compilada, suporte [tMin, tMax], energia Ex e pontos críticos.
 */
export function validateSignalExpression(expr) {
  const raw = (expr || '').trim();
  if (!raw) {
    return { valid: false, fn: null, support: [-1, 1], energy: 0, maxAmp: 1 };
  }

  // Verifica balanceamento de parênteses e chaves e se não termina com operador pendente
  let parenDepth = 0;
  let braceDepth = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '(') parenDepth++;
    else if (raw[i] === ')') parenDepth--;
    else if (raw[i] === '{') braceDepth++;
    else if (raw[i] === '}') braceDepth--;
    if (parenDepth < 0 || braceDepth < 0) {
      return { valid: false, fn: null, support: [-1, 1], energy: 0, maxAmp: 1 };
    }
  }
  if (parenDepth !== 0 || braceDepth !== 0 || /[+\-*/^_(\\]$/.test(raw)) {
    return { valid: false, fn: null, support: [-1, 1], energy: 0, maxAmp: 1 };
  }

  try {
    const { fn: safeFn, cleanExpr } = buildSignalEvaluator(raw);

    let tMin = null;
    let tMax = null;
    let energy = 0;
    let maxAmp = 0.01;
    const dt = 0.02;
    for (let t = -6.0; t <= 6.0; t += dt) {
      const y = safeFn(t);
      const absY = Math.abs(y);
      if (absY > maxAmp) maxAmp = absY;
      if (absY > 1e-3) {
        if (tMin === null) tMin = Math.round(t * 50) / 50;
        tMax = Math.round(t * 50) / 50;
      }
      energy += y * y * dt;
    }

    const support = tMin !== null ? [tMin, Math.max(tMin + 0.05, tMax)] : [0, 0];
    return { valid: true, fn: safeFn, support, energy, maxAmp, cleanExpr, isAllZero: tMin === null };
  } catch (err) {
    return { valid: false, fn: null, support: [-1, 1], energy: 0, maxAmp: 1 };
  }
}

export function integrateSimpson(fnA, fnB, tVal, a = null, b = null, n = 360) {
  const lo = a !== null ? a : Math.min(-8.0, tVal - 8.0);
  const hi = b !== null ? b : Math.max(10.0, tVal + 8.0);
  if (hi <= lo) return 0;

  const evalProd = (tau) => fnA(tau) * fnB(tVal - tau);
  const hasDelta = Boolean(fnA._hasDelta || fnB._hasDelta);

  const adaptivePanel = (x0, x1, f0, fl, fm, fr, f1, tol, depth) => {
    const h = x1 - x0;
    const s1 = (h / 6) * (f0 + 4 * fm + f1);
    const s2 = (h / 12) * (f0 + 4 * fl + 2 * fm + 4 * fr + f1);
    if (depth <= 0) {
      // Regra do ponto medio no limite evita vies de extremidade em saltos descontínuos
      return h * fm;
    }
    if (Math.abs(s2 - s1) <= 15 * tol) {
      return s2 + (s2 - s1) / 15;
    }
    const xm = 0.5 * (x0 + x1);
    const xl = 0.5 * (x0 + xm);
    const xr = 0.5 * (xm + x1);
    const fll = evalProd(0.5 * (x0 + xl));
    const flr = evalProd(0.5 * (xl + xm));
    const frl = evalProd(0.5 * (xm + xr));
    const frr = evalProd(0.5 * (xr + x1));
    return (
      adaptivePanel(x0, xm, f0, fll, fl, flr, fm, tol * 0.5, depth - 1) +
      adaptivePanel(xm, x1, fm, frl, fr, frr, f1, tol * 0.5, depth - 1)
    );
  };

  // Passo de painel <= 0.04 garante subamostragem < 0.01 menor que a largura do delta (0.05)
  const panels = Math.max(Math.floor(n / 2), Math.ceil((hi - lo) / 0.04));
  const step = (hi - lo) / panels;
  const tol = 1e-5;
  let total = 0;
  let x0 = lo;
  let f0 = evalProd(x0);

  for (let i = 0; i < panels; i++) {
    const x1 = i === panels - 1 ? hi : lo + (i + 1) * step;
    const xm = 0.5 * (x0 + x1);
    const xl = 0.5 * (x0 + xm);
    const xr = 0.5 * (xm + x1);
    const fl = evalProd(xl);
    const fm = evalProd(xm);
    const fr = evalProd(xr);
    const f1 = evalProd(x1);

    const forceSplit = hasDelta && [x0, xl, xm, xr, x1].some(
      (pt) => Math.abs(fnA(pt)) > 0.45 || Math.abs(fnB(tVal - pt)) > 0.45
    );

    if (forceSplit) {
      const fll = evalProd(0.5 * (x0 + xl));
      const flr = evalProd(0.5 * (xl + xm));
      const frl = evalProd(0.5 * (xm + xr));
      const frr = evalProd(0.5 * (xr + x1));
      total +=
        adaptivePanel(x0, xm, f0, fll, fl, flr, fm, tol * 0.5, 8) +
        adaptivePanel(xm, x1, fm, frl, fr, frr, f1, tol * 0.5, 8);
    } else {
      total += adaptivePanel(x0, x1, f0, fl, fm, fr, f1, tol, 9);
    }

    x0 = x1;
    f0 = f1;
  }

  return total;
}

// Formatador Racional Inteligente (exibe 1/6, 2/3, 4/pi, etc)
export function formatSymbolic(val) {
  if (Math.abs(val) < 1e-4) return '0';
  const signStr = val < 0 ? '-' : '';
  const absVal = Math.abs(val);

  // Testa frações simples p/q com q <= 24
  for (let q = 1; q <= 24; q++) {
    const p = Math.round(absVal * q);
    if (Math.abs(absVal - p / q) < 1e-3) {
      if (q === 1) return `${signStr}${p}`;
      return `${signStr}\\frac{${p}}{${q}}`;
    }
  }

  // Testa múltiplos de pi: (p/q) * pi
  const overPi = absVal / Math.PI;
  for (let q = 1; q <= 12; q++) {
    const p = Math.round(overPi * q);
    if (Math.abs(overPi - p / q) < 1e-3) {
      if (q === 1) return p === 1 ? `${signStr}\\pi` : `${signStr}${p}\\pi`;
      if (p === 1) return `${signStr}\\frac{\\pi}{${q}}`;
      return `${signStr}\\frac{${p}\\pi}{${q}}`;
    }
  }

  // Testa divisões por pi: p / (q * pi) (comum em Fourier)
  const timesPi = absVal * Math.PI;
  for (let q = 1; q <= 12; q++) {
    const p = Math.round(timesPi * q);
    if (Math.abs(timesPi - p / q) < 1e-3) {
      if (q === 1) return `${signStr}\\frac{${p}}{\\pi}`;
      return `${signStr}\\frac{${p}}{${q}\\pi}`;
    }
  }

  return val.toFixed(3);
}

function fmtBound(val) {
  const rounded = Math.round(val * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : Number(rounded.toFixed(2)).toString();
}

function buildConvolutionIntegralLatex(f1, f2, m1, m2, fSym = 'x', mSym = 'h') {
  const shiftTerm = (bound) => {
    if (Math.abs(bound) < 1e-6) return 't';
    return bound > 0 ? `t-${fmtBound(bound)}` : `t+${fmtBound(-bound)}`;
  };

  let lowExpr = '-\\infty';
  if (Number.isFinite(f1) && Number.isFinite(m2)) {
    lowExpr = `\\max(${fmtBound(f1)},\\, ${shiftTerm(m2)})`;
  } else if (Number.isFinite(f1)) {
    lowExpr = fmtBound(f1);
  } else if (Number.isFinite(m2)) {
    lowExpr = shiftTerm(m2);
  }

  let highExpr = '+\\infty';
  if (Number.isFinite(f2) && Number.isFinite(m1)) {
    highExpr = `\\min(${fmtBound(f2)},\\, ${shiftTerm(m1)})`;
  } else if (Number.isFinite(f2)) {
    highExpr = fmtBound(f2);
  } else if (Number.isFinite(m1)) {
    highExpr = shiftTerm(m1);
  }

  return `y(t) = \\int_{${lowExpr}}^{${highExpr}} ${fSym}(\\tau)${mSym}(t-\\tau)\\,d\\tau`;
}

// Detector Automático de Suporte e Regiões Críticas de Convolução
export function detectSupportAndRegions(fnX, fnH, exprX = '', exprH = '', isCommuted = false) {
  const scanSupport = (fn) => {
    let a = null;
    let b = null;
    const step = 0.025;
    for (let t = -10.0; t <= 10.0; t += step) {
      if (Math.abs(fn(t)) > 1e-3) {
        const snap = Math.round(t * 20) / 20;
        if (a === null) a = snap;
        b = snap;
      }
    }
    if (a === null) {
      return { support: [0, 0], isEmpty: true };
    }
    const leftInf = Math.abs(fn(-15.5)) > 0 && Math.abs(fn(-22.0)) > 0;
    const rightInf = Math.abs(fn(15.5)) > 0 && Math.abs(fn(22.0)) > 0;
    return {
      support: [leftInf ? -Infinity : a, rightInf ? Infinity : b],
      isEmpty: false
    };
  };

  const xInfo = scanSupport(fnX);
  const hInfo = scanSupport(fnH);
  const [x1, x2] = xInfo.support;
  const [h1, h2] = hInfo.support;

  if (xInfo.isEmpty || hInfo.isEmpty) {
    return {
      supportX: [x1, x2],
      supportH: [h1, h2],
      regions: [{
        range: 't \\in \\mathbb{R}',
        test: () => true,
        sampleT: 0,
        latex: 'y(t) = 0 \\quad (\\text{Sinal nulo})',
        latexEn: 'y(t) = 0 \\quad (\\text{Zero signal})'
      }]
    };
  }

  const tStart = (Number.isFinite(x1) && Number.isFinite(h1)) ? x1 + h1 : -Infinity;
  const tEnd = (Number.isFinite(x2) && Number.isFinite(h2)) ? x2 + h2 : Infinity;
  const candidates = [];
  if (Number.isFinite(tStart)) candidates.push(tStart);
  if (Number.isFinite(x1) && Number.isFinite(h2)) candidates.push(x1 + h2);
  if (Number.isFinite(x2) && Number.isFinite(h1)) candidates.push(x2 + h1);
  if (Number.isFinite(tEnd)) candidates.push(tEnd);

  candidates.sort((a, b) => a - b);
  const uniquePts = candidates.filter((val, idx, arr) => idx === 0 || Math.abs(val - arr[idx - 1]) > 0.08);
  const intLatex = isCommuted
    ? buildConvolutionIntegralLatex(h1, h2, x1, x2, 'h', 'x')
    : buildConvolutionIntegralLatex(x1, x2, h1, h2, 'x', 'h');
  const regions = [];

  if (uniquePts.length === 0) {
    regions.push({
      range: 't \\in \\mathbb{R}',
      test: () => true,
      sampleT: 0,
      latex: intLatex,
      latexEn: intLatex
    });
  } else {
    const firstPt = uniquePts[0];
    if (Number.isFinite(tStart)) {
      regions.push({
        range: `t < ${fmtBound(firstPt)}`,
        test: (t) => t < firstPt,
        sampleT: firstPt - 0.8,
        latex: 'y(t) = 0 \\quad (\\text{Sem sobreposição})',
        latexEn: 'y(t) = 0 \\quad (\\text{No overlap})'
      });
    } else {
      regions.push({
        range: `t < ${fmtBound(firstPt)}`,
        test: (t) => t < firstPt,
        sampleT: firstPt - 1.0,
        latex: intLatex,
        latexEn: intLatex
      });
    }

    for (let i = 0; i < uniquePts.length - 1; i++) {
      const rA = uniquePts[i];
      const rB = uniquePts[i + 1];
      const mid = (rA + rB) / 2;
      regions.push({
        range: `${fmtBound(rA)} \\le t < ${fmtBound(rB)}`,
        test: (t) => t >= rA && t < rB,
        sampleT: mid,
        latex: intLatex,
        latexEn: intLatex
      });
    }

    const lastPt = uniquePts[uniquePts.length - 1];
    if (Number.isFinite(tEnd)) {
      regions.push({
        range: `t \\ge ${fmtBound(lastPt)}`,
        test: (t) => t >= lastPt,
        sampleT: lastPt + 0.8,
        latex: 'y(t) = 0 \\quad (\\text{Fim da sobreposição})',
        latexEn: 'y(t) = 0 \\quad (\\text{End of overlap})'
      });
    } else {
      regions.push({
        range: `t \\ge ${fmtBound(lastPt)}`,
        test: (t) => t >= lastPt,
        sampleT: lastPt + 1.2,
        latex: intLatex,
        latexEn: intLatex
      });
    }
  }

  return {
    supportX: [x1, x2],
    supportH: [h1, h2],
    regions
  };
}

// Motor de Cálculo Completo da Série de Fourier (Trigonométrica, Compacta e Exponencial)
export function calculateFourierData(expr, T0Val = 3.0, NVal = 7) {
  const T0 = Math.max(0.2, Number(T0Val) || 3.0);
  const w0 = (2 * Math.PI) / T0;
  const fn = compileSignalExpr(expr);
  const N = Math.min(25, Math.max(1, Math.round(NVal) || 7));

  // Detecta automaticamente se o sinal foi definido em [-T0/2, T0/2) ou em [0, T0)
  let negEnergy = 0;
  let upperPosEnergy = 0;
  const probeCount = 24;
  for (let i = 0; i < probeCount; i++) {
    const frac = (i + 0.5) / probeCount;
    const tNeg = -T0 * 0.5 * frac;
    const tUpper = T0 * 0.5 + T0 * 0.5 * frac;
    const vNeg = fn(tNeg);
    const vUp = fn(tUpper);
    negEnergy += vNeg * vNeg;
    upperPosEnergy += vUp * vUp;
  }
  const tBase = (negEnergy > 1e-6 && upperPosEnergy < 1e-6) ? -T0 * 0.5 : 0;

  const numSamples = 600;
  const dt = T0 / numSamples;

  // Função periódica em todo o eixo t
  const fPeriodic = (t) => {
    const wrapped = tBase + ((((t - tBase) % T0) + T0) % T0);
    return fn(wrapped);
  };

  // 1. DC Level a0
  let a0Sum = 0;
  let totalEnergySum = 0;
  for (let i = 0; i < numSamples; i++) {
    const tSample = tBase + (i + 0.5) * dt;
    const v = fn(tSample);
    a0Sum += v;
    totalEnergySum += v * v;
  }
  const a0 = (a0Sum * dt) / T0;
  const totalPower = Math.max(1e-6, (totalEnergySum * dt) / T0);

  // 2. Harmônicas n = 1..N
  const harmonics = [];
  let harmonicPower = a0 * a0;

  for (let n = 1; n <= N; n++) {
    let anSum = 0;
    let bnSum = 0;
    for (let i = 0; i < numSamples; i++) {
      const tSample = tBase + (i + 0.5) * dt;
      const val = fn(tSample);
      anSum += val * Math.cos(n * w0 * tSample);
      bnSum += val * Math.sin(n * w0 * tSample);
    }
    let an = (2 / T0) * anSum * dt;
    let bn = (2 / T0) * bnSum * dt;
    if (Math.abs(an) < 1e-4) an = 0;
    if (Math.abs(bn) < 1e-4) bn = 0;

    const cn = Math.sqrt(an * an + bn * bn);
    const theta = cn > 1e-4 ? Math.atan2(-bn, an) : 0;
    const dnMagnitude = cn / 2.0;

    harmonics.push({
      n,
      nw0: n * w0,
      an,
      bn,
      cn,
      theta,
      dnMagnitude,
      dnAngle: theta
    });
    harmonicPower += 0.5 * (an * an + bn * bn);
  }

  // 3. Detecção Avançada de Simetrias
  let evenDiff = 0;
  let oddDiff = 0;
  let halfWaveDiff = 0;
  let normSum = 0;
  const testSteps = 120;
  for (let i = 0; i < testSteps; i++) {
    const tVal = tBase + ((i + 0.5) / testSteps) * T0;
    const fVal = fPeriodic(tVal);
    const fMinus = fPeriodic(-tVal);
    const fHalf = fPeriodic(tVal + T0 / 2);
    evenDiff += Math.abs(fVal - fMinus);
    oddDiff += Math.abs(fVal + fMinus);
    halfWaveDiff += Math.abs(fHalf + fVal);
    normSum += Math.abs(fVal);
  }
  const norm = Math.max(0.1, normSum);
  const isEven = (evenDiff / norm) < 0.04;
  const isOdd = !isEven && (oddDiff / norm) < 0.04;
  const isHalfWave = (halfWaveDiff / norm) < 0.04;
  const isQuarterWave = isHalfWave && (isEven || isOdd);

  let symmetryType = 'none';
  if (isQuarterWave) symmetryType = isEven ? 'quarter_even' : 'quarter_odd';
  else if (isHalfWave) symmetryType = 'half_wave';
  else if (isEven) symmetryType = 'even';
  else if (isOdd) symmetryType = 'odd';

  // 4. Reconstrução SN(t)
  const reconstruct = (t) => {
    let sum = a0;
    for (let i = 0; i < harmonics.length; i++) {
      const h = harmonics[i];
      sum += h.an * Math.cos(h.nw0 * t) + h.bn * Math.sin(h.nw0 * t);
    }
    return sum;
  };

  // 5. Erro Médio Quadrático (MSE) e Eficiência de Parseval
  let mseSum = 0;
  for (let i = 0; i < numSamples; i++) {
    const tSample = tBase + (i + 0.5) * dt;
    const orig = fn(tSample);
    const rec = reconstruct(tSample);
    const diff = orig - rec;
    mseSum += diff * diff;
  }
  const mse = (mseSum * dt) / T0;
  const efficiency = Math.min(100.0, Math.max(0.0, (harmonicPower / totalPower) * 100));

  return {
    T0,
    w0,
    f0: 1.0 / T0,
    tBase,
    a0,
    harmonics,
    symmetryType,
    reconstruct,
    fn,
    fPeriodic,
    totalPower,
    harmonicPower,
    efficiency,
    mse
  };
}

// ============================================================================
// MOTOR DE CÁLCULO DA TRANSFORMADA DE FOURIER CONTÍNUA (CTFT)
// Inclui Ponte de Khutoryansky (T0 -> Infinito), Magnitude |X(w)| e Fase ∠X(w)
// ============================================================================
export function calculateCTFTData(presetKey = 'rect', pulseWidthVal = 2.0, decayVal = 1.0, bridgeT0Val = 4.0, customExpr = null) {
  const tau = Math.max(0.25, Number(pulseWidthVal) || 2.0);
  const a = Math.max(0.2, Number(decayVal) || 1.0);
  const T0 = Math.max(tau + 0.5, Number(bridgeT0Val) || 4.0);
  const w0 = (2 * Math.PI) / T0;

  // 1. Sinal no Domínio do Tempo x(t)
  let fnTime = (t) => 0;
  let timeSupport = [-tau / 2, tau / 2];
  let latexTime = '\\operatorname{rect}(t/\\tau_0)';
  let latexCTFT = '\\tau_0 \\operatorname{sinc}\\left(\\frac{\\omega \\tau_0}{2}\\right)';
  let energyTime = tau;
  let valX0 = tau;

  // 2. Transformada Contínua X(w) = Mag * e^(j*Phase)
  let fnMag = (w) => 0;
  let fnPhase = (w) => 0;

  if (presetKey === 'custom_ctft' && customExpr) {
    const valRes = validateSignalExpression(customExpr);
    fnTime = valRes.valid && valRes.fn ? valRes.fn : compileSignalExpr(customExpr);
    timeSupport = valRes.support || [-2.0, 2.0];
    latexTime = exprToLatex(customExpr, 't');
    latexCTFT = `\\int_{${timeSupport[0].toFixed(1)}}^{${timeSupport[1].toFixed(1)}} \\left(${latexTime}\\right) e^{-j\\omega t}\\,dt`;

    const tStart = Math.max(-7.0, timeSupport[0] - 0.15);
    const tEnd = Math.min(7.0, timeSupport[1] + 0.15);
    const N_INT = 480;
    const dt = (tEnd - tStart) / Math.max(1, N_INT);
    const tSamples = new Float64Array(N_INT);
    const xSamples = new Float64Array(N_INT);
    let calcEnergy = 0;
    for (let i = 0; i < N_INT; i++) {
      const tVal = tStart + (i + 0.5) * dt;
      const xv = fnTime(tVal);
      tSamples[i] = tVal;
      xSamples[i] = xv;
      calcEnergy += xv * xv * dt;
    }
    energyTime = calcEnergy > 1e-6 ? calcEnergy : (valRes.energy || 0);

    const evalCustomX = (w) => {
      if (tEnd <= tStart + 1e-4) return { re: 0, im: 0 };
      let re = 0;
      let im = 0;
      for (let i = 0; i < N_INT; i++) {
        const angle = -w * tSamples[i];
        const xv = xSamples[i];
        re += xv * Math.cos(angle);
        im += xv * Math.sin(angle);
      }
      return { re: re * dt, im: im * dt };
    };

    const x0Complex = evalCustomX(0);
    valX0 = x0Complex.re;

    fnMag = (w) => {
      const c = evalCustomX(w);
      return Math.hypot(c.re, c.im);
    };
    fnPhase = (w) => {
      const c = evalCustomX(w);
      if (Math.hypot(c.re, c.im) < 1e-6) return 0;
      return Math.atan2(c.im, c.re);
    };
  } else if (presetKey === 'exp') {
    fnTime = (t) => (t > 0 ? Math.exp(-a * t) : (Math.abs(t) < 1e-12 ? 0.5 : 0));
    timeSupport = [0, Math.min(8.0, 6.0 / a)];
    latexTime = `e^{-${a.toFixed(1)}t} u(t)`;
    latexCTFT = `\\frac{1}{${a.toFixed(1)} + j\\omega}`;
    energyTime = 1.0 / (2 * a);
    valX0 = 1.0 / a;
    fnMag = (w) => 1.0 / Math.sqrt(a * a + w * w);
    fnPhase = (w) => -Math.atan2(w, a);
  } else if (presetKey === 'tri') {
    // Convenção unificada: tri(t/a) = max(0, 1 - |t/a|) com suporte [-a, a] e X(w) = a*sinc^2(w*a/2)
    const aTri = tau;
    fnTime = (t) => (Math.abs(t) <= aTri ? 1.0 - Math.abs(t) / aTri : 0);
    timeSupport = [-aTri, aTri];
    latexTime = aTri === 1.0
      ? '\\operatorname{tri}(t)'
      : `\\operatorname{tri}\\left(\\frac{t}{${aTri.toFixed(1)}}\\right)`;
    latexCTFT = aTri === 1.0
      ? '\\operatorname{sinc}^2\\left(\\frac{\\omega}{2}\\right)'
      : `${aTri.toFixed(1)} \\operatorname{sinc}^2\\left(\\frac{\\omega \\cdot ${aTri.toFixed(1)}}{2}\\right)`;
    energyTime = (2 / 3) * aTri;
    valX0 = aTri;
    fnMag = (w) => {
      const arg = (w * aTri) / 2;
      const s = Math.abs(arg) < 1e-7 ? 1.0 : Math.sin(arg) / arg;
      return aTri * s * s;
    };
    fnPhase = () => 0;
  } else if (presetKey === 'bilateral_exp') {
    fnTime = (t) => Math.exp(-a * Math.abs(t));
    timeSupport = [-Math.min(8.0, 6.0 / a), Math.min(8.0, 6.0 / a)];
    latexTime = `e^{-${a.toFixed(1)}|t|}`;
    latexCTFT = `\\frac{2 \\cdot ${a.toFixed(1)}}{${(a * a).toFixed(2)} + \\omega^2}`;
    energyTime = 1.0 / a;
    valX0 = 2.0 / a;
    fnMag = (w) => (2 * a) / (a * a + w * w);
    fnPhase = () => 0;
  } else if (presetKey === 'bridge') {
    fnTime = (t) => {
      const wrapped = ((((t + T0 * 0.5) % T0) + T0) % T0) - T0 * 0.5;
      return Math.abs(wrapped) <= tau / 2 ? 1.0 : 0;
    };
    timeSupport = [-tau / 2, tau / 2];
    latexTime = tau === 1.0
      ? '\\sum_{k} \\operatorname{rect}(t - k T_0)'
      : `\\sum_{k} \\operatorname{rect}\\left(\\frac{t - k T_0}{${tau.toFixed(1)}}\\right)`;
    latexCTFT = tau === 1.0
      ? '\\operatorname{sinc}\\left(\\frac{\\omega}{2}\\right)'
      : `${tau.toFixed(1)} \\operatorname{sinc}\\left(\\frac{\\omega \\cdot ${tau.toFixed(1)}}{2}\\right)`;
    energyTime = tau;
    valX0 = tau;
    fnMag = (w) => {
      const arg = (w * tau) / 2;
      const s = Math.abs(arg) < 1e-7 ? 1.0 : Math.sin(arg) / arg;
      return tau * Math.abs(s);
    };
    fnPhase = (w) => {
      const arg = (w * tau) / 2;
      const s = Math.abs(arg) < 1e-7 ? 1.0 : Math.sin(arg) / arg;
      return s >= 0 ? 0 : Math.PI;
    };
  } else {
    // Padrão: Pulso Retangular rect(t/tau)
    fnTime = (t) => (Math.abs(t) <= tau / 2 ? 1.0 : 0);
    timeSupport = [-tau / 2, tau / 2];
    latexTime = `\\operatorname{rect}\\left(\\frac{t}{${tau.toFixed(1)}}\\right)`;
    latexCTFT = `${tau.toFixed(1)} \\operatorname{sinc}\\left(\\frac{\\omega \\cdot ${tau.toFixed(1)}}{2}\\right)`;
    energyTime = tau;
    valX0 = tau;
    fnMag = (w) => {
      const arg = (w * tau) / 2;
      const s = Math.abs(arg) < 1e-7 ? 1.0 : Math.sin(arg) / arg;
      return tau * Math.abs(s);
    };
    fnPhase = (w) => {
      const arg = (w * tau) / 2;
      const s = Math.abs(arg) < 1e-7 ? 1.0 : Math.sin(arg) / arg;
      return s >= 0 ? 0 : Math.PI;
    };
  }

  // 3. Ponte de Khutoryansky: Raias Discretas T0 * Dn aproximando X(w)
  const bridgeHarmonics = [];
  const maxBridgeN = Math.min(25, Math.floor((16.0 / w0)));
  for (let n = -maxBridgeN; n <= maxBridgeN; n++) {
    const wn = n * w0;
    const magContinuous = fnMag(wn);
    const dnMagnitude = magContinuous / T0;
    bridgeHarmonics.push({
      n,
      wn,
      dnMagnitude,
      scaledDn: dnMagnitude * T0, // Deve coincidir com X(wn)
      phase: fnPhase(wn)
    });
  }

  // 4. Integração Numérica de Verificação de Parseval (malha ampla adaptativa)
  const scaleHint = Math.max(0.25, Math.min(tau, 1.0 / a));
  const wMax = Math.max(90.0, 60.0 / scaleHint);
  const numWSamples = 2000;
  const dw = (2 * wMax) / numWSamples;
  let energyFreqSum = 0;
  for (let i = 0; i < numWSamples; i++) {
    const wVal = -wMax + (i + 0.5) * dw;
    const m = fnMag(wVal);
    energyFreqSum += m * m;
  }
  const energyFreq = (energyFreqSum * dw) / (2 * Math.PI);

  return {
    presetKey,
    tau,
    a,
    T0,
    w0,
    valX0,
    fnTime,
    timeSupport,
    latexTime,
    latexCTFT,
    energyTime,
    energyFreq,
    fnMag,
    fnPhase,
    bridgeHarmonics
  };
}
