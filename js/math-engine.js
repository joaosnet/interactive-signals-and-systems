// ============================================================================
// MATH-ENGINE.JS — Compilação de Sinais, Detecção de Regiões e Fourier
// ============================================================================

export function renderMath(el, latex, displayMode = false) {
  if (!el) return;
  if (window.katex) {
    try {
      window.katex.render(latex, el, { throwOnError: false, displayMode, strict: 'ignore' });
      return;
    } catch (err) {}
  }
  el.textContent = latex;
}

export function latexToHtml(latex, displayMode = false) {
  if (window.katex) {
    try {
      return window.katex.renderToString(latex, { throwOnError: false, displayMode, strict: 'ignore' });
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
    // Remove redundant double parentheses like u((-\tau)) -> u(-\tau)
    s = s.replace(/\(\(([^()]+)\)\)/g, '($1)');
  }
  s = s.replace(/\bpi\b/gi, '\\pi ');
  s = replaceBalancedCall(s, 'e^(', 'e^{', '}');
  s = s.replace(/e\^([a-zA-Z0-9_\\+-]+)/g, 'e^{$1}');
  s = replaceBalancedCall(s, 'abs(', '\\left|', '\\right|');
  s = replaceBalancedCall(s, 'rect(', '\\mathrm{rect}(', ')');
  s = replaceBalancedCall(s, 'tri(', '\\mathrm{tri}(', ')');
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

export function compileSignalExpr(expr) {
  const raw = (expr || '0').trim();
  const clean = (raw.includes('\\') || raw.includes('{') || /\)\s*[a-zA-Z(]/.test(raw) || /\d\s*[a-zA-Z(]/.test(raw))
    ? latexToExpr(raw)
    : raw;
  const u = (v) => (v >= 0 ? 1.0 : 0.0);
  const r = (v) => (v >= 0 ? v : 0.0);
  const rect = (v) => (Math.abs(v) <= 0.5 ? 1.0 : 0.0);
  const tri = (v) => (Math.abs(v) <= 1.0 ? 1.0 - Math.abs(v) : 0.0);
  const sinc = (v) => (Math.abs(v) < 1e-6 ? 1.0 : Math.sin(Math.PI * v) / (Math.PI * v));
  const sign = (v) => (v > 0 ? 1.0 : v < 0 ? -1.0 : 0.0);
  const sgn = sign;
  const delta = (v) => {
    const eps = 0.05;
    return Math.abs(v) <= eps ? (1.0 / (2 * eps)) : 0.0;
  };

  let jsExpr = clean;

  // Substitui e^(...) e e^... por exp(...) antes de qualquer processamento de potência
  jsExpr = replaceBalancedCall(jsExpr, 'e^(', 'exp(', ')');
  jsExpr = jsExpr.replace(/e\^([a-zA-Z0-9_\\+-]+)/g, 'exp($1)');

  // Converte potências gerais base^exp em Math.pow(base, exp) para evitar SyntaxError em negações unárias
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
    .replace(/\bsign\s*\(/g, 'sign(')
    .replace(/\bsgn\s*\(/g, 'sgn(')
    .replace(/\bdelta\s*\(/g, 'delta(');

  try {
    const fn = new Function('t', 'u', 'r', 'rect', 'tri', 'sinc', 'sign', 'sgn', 'delta', `"use strict"; return Number(${jsExpr}) || 0;`);
    fn(0.5, u, r, rect, tri, sinc, sign, sgn, delta);
    return (tVal) => {
      try {
        const val = fn(tVal, u, r, rect, tri, sinc, sign, sgn, delta);
        return Number.isFinite(val) ? val : 0;
      } catch (e) {
        return 0;
      }
    };
  } catch (err) {
    return () => 0;
  }
}

export function integrateSimpson(fnA, fnB, tVal, a = -5.0, b = 7.5, n = 320) {
  const h = (b - a) / n;
  let sum = fnA(a) * fnB(tVal - a) + fnA(b) * fnB(tVal - b);
  for (let i = 1; i < n; i++) {
    const tau = a + i * h;
    const val = fnA(tau) * fnB(tVal - tau);
    sum += (i % 2 === 0 ? 2 : 4) * val;
  }
  return (h / 3) * sum;
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

// Detector Automático de Suporte e Regiões Críticas de Convolução
export function detectSupportAndRegions(fnX, fnH, exprX = '', exprH = '') {
  const scanSupport = (fn) => {
    let a = null;
    let b = null;
    const step = 0.05;
    for (let t = -8.0; t <= 10.0; t += step) {
      if (Math.abs(fn(t)) > 1e-3) {
        if (a === null) a = Math.round(t * 10) / 10;
        b = Math.round(t * 10) / 10;
      }
    }
    if (a === null) return [0, 3];
    return [Math.max(-8, a), Math.min(8, b)];
  };

  const [x1, x2] = scanSupport(fnX);
  const [h1, h2] = scanSupport(fnH);

  const tStart = x1 + h1;
  const tMid1 = x1 + h2;
  const tMid2 = x2 + h1;
  const tEnd = x2 + h2;

  const pts = [tStart, Math.min(tMid1, tMid2), Math.max(tMid1, tMid2), tEnd].sort((a, b) => a - b);
  const uniquePts = pts.filter((val, idx, arr) => idx === 0 || Math.abs(val - arr[idx - 1]) > 0.15);

  const regions = [];
  // 1. Antes da sobreposição
  regions.push({
    range: `t < ${uniquePts[0].toFixed(1)}`,
    test: (t) => t < uniquePts[0],
    sampleT: uniquePts[0] - 0.8,
    latex: 'y(t) = 0 \\quad (\\text{Sem sobreposição})',
    latexEn: 'y(t) = 0 \\quad (\\text{No overlap})'
  });

  // 2. Regiões intermediárias de sobreposição
  for (let i = 0; i < uniquePts.length - 1; i++) {
    const rA = uniquePts[i];
    const rB = uniquePts[i + 1];
    const mid = (rA + rB) / 2;
    const intLatex = `y(t) = \\int_{\\max(${x1}, t-${h2})}^{\\min(${x2}, t-${h1})} x(\\tau)h(t-\\tau)d\\tau`;
    regions.push({
      range: `${rA.toFixed(1)} \\le t < ${rB.toFixed(1)}`,
      test: (t) => t >= rA && t < rB,
      sampleT: mid,
      latex: intLatex,
      latexEn: intLatex
    });
  }

  // 3. Após o fim da sobreposição
  const lastPt = uniquePts[uniquePts.length - 1];
  regions.push({
    range: `t \\ge ${lastPt.toFixed(1)}`,
    test: (t) => t >= lastPt,
    sampleT: lastPt + 0.8,
    latex: 'y(t) = 0 \\quad (\\text{Fim da sobreposição})',
    latexEn: 'y(t) = 0 \\quad (\\text{End of overlap})'
  });

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

  const numSamples = 300;
  const dt = T0 / numSamples;

  // Função periódica em todo o eixo t
  const fPeriodic = (t) => {
    const wrapped = ((t % T0) + T0) % T0;
    return fn(wrapped);
  };

  // 1. DC Level a0
  let a0Sum = 0;
  let totalEnergySum = 0;
  for (let i = 0; i < numSamples; i++) {
    const tSample = (i + 0.5) * dt;
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
      const tSample = (i + 0.5) * dt;
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
  const testSteps = 60;
  for (let i = 0; i < testSteps; i++) {
    const tVal = ((i + 0.5) / testSteps) * T0;
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
    const tSample = (i + 0.5) * dt;
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
