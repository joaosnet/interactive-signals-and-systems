// ============================================================================
// MODULES/DTFT.JS — Transformada de Fourier de Tempo Discreto
// ----------------------------------------------------------------------------
// Palco: três trilhos paralelos.
//   fundo  → hastes de x[n]
//   meio   → |X(e^{jΩ})| (contínuo em Ω)
//   frente → fase ∠X(e^{jΩ}) (só no passo 4)
// Passos: 1 definição, 2 soma parcial X_N(Ω) (convergência e Gibbs),
//         3 periodicidade 2π, 4 magnitude, fase e leitura como filtro.
// Módulo totalmente plugável: cena, caderno e galeria vivem aqui.
// ============================================================================

import { state } from '../state.js';
import { renderMath } from '../math-engine.js';
import { DTFT_PRESETS, calculateDTFTData } from '../dtft-engine.js';
import { registerModule } from './registry.js';
import { renderSequenceEditor } from './seq-editor.js';

// ---- Geometria do palco -----------------------------------------------------
const X_HALF = 4.5;
const Z_T = 0.4;        // trilho do tempo (fundo; a câmera fica em +z)
const Z_M = 3.4;        // trilho da magnitude
const Z_P = 6.2;        // trilho da fase
const N_VIEW = 10;      // hastes de n = -10 a 10
const AMP_T = 1.5;      // altura da maior amostra
const AMP_M = 2.0;      // altura do pico de |X|
const AMP_P = 1.0;      // altura de uma fase igual a π
const IMPULSE_H = 1.7;  // altura das setas de impulso
const N_MAX_TERMS = 40;

const OMEGA = { min: -3.14, max: 3.14 };
let sweepDir = 1;
let tickAcc = 0;

function paramOf(key) {
  const spec = DTFT_PRESETS[key]?.param;
  if (!spec) return null;
  const v = state.dtftParams[key];
  return Number.isFinite(v) ? v : spec.def;
}

export function recomputeDTFT() {
  const key = DTFT_PRESETS[state.dtftPresetKey] || state.dtftPresetKey === 'custom' ? state.dtftPresetKey : 'rect';
  state.dtftPresetKey = key;
  state.dtftCalculated = calculateDTFTData(key, paramOf(key), state.dtftCustom);
  if (state.dtftCalculated.paramSpec) state.dtftParams[key] = state.dtftCalculated.param;
  return state.dtftCalculated;
}

function calc() {
  return state.dtftCalculated || recomputeDTFT();
}

export function selectDTFTPreset(key) {
  if (!DTFT_PRESETS[key] && key !== 'custom') return;
  state.dtftPresetKey = key;
  recomputeDTFT();
}

// ---- Formatação -------------------------------------------------------------
const num = (v, d = 2) => {
  const r = Math.round(v * 10 ** d) / 10 ** d;
  return Object.is(r, -0) ? '0' : String(r);
};

function complexLatex(v) {
  if (Math.abs(v.im) < 5e-3) return num(v.re);
  return `${num(v.re)} ${v.im < 0 ? '-' : '+'} j${num(Math.abs(v.im))}`;
}

const FILTER_TEXT = {
  lowpass: { pt: 'passa-baixas', en: 'low-pass' },
  highpass: { pt: 'passa-altas', en: 'high-pass' },
  allpass: { pt: 'passa-tudo', en: 'all-pass' },
  impulses: { pt: 'impulsos', en: 'impulses' }
};
const filterLabel = (d, isEn) => FILTER_TEXT[d.filterType || 'impulses'][isEn ? 'en' : 'pt'];

/** A sequência cabe inteira na soma parcial de N termos de cada lado? */
function isExactAt(d, N) {
  if (d.isImpulsive || d.slowDecay) return false;
  for (let n = N + 1; n <= 60; n++) {
    if (d.fnSeq(n) !== 0 || d.fnSeq(-n) !== 0) return false;
  }
  return true;
}

// ---- Curvas (com cache: só recalcula quando par, parâmetro, N ou faixa mudam) --
const curveCache = new Map();
function cached(key, build) {
  if (!curveCache.has(key)) {
    if (curveCache.size > 24) curveCache.clear();
    curveCache.set(key, build());
  }
  return curveCache.get(key);
}

function exactCurve(d, W) {
  return cached(`x|${d.presetKey}|${d.signature}|${d.param}|${W}`, () => {
    const M = W > 4 ? 540 : 240;
    const pts = [];
    for (let i = 0; i <= M; i++) {
      const w = -W + (i / M) * 2 * W;
      pts.push({ w, mag: d.mag(w), phase: d.phase(w) });
    }
    return pts;
  });
}

function partialCurve(d, N, W) {
  return cached(`p|${d.presetKey}|${d.signature}|${d.param}|${N}|${W}`, () => {
    const M = 240;
    const pts = [];
    for (let i = 0; i <= M; i++) {
      const w = -W + (i / M) * 2 * W;
      const v = d.partialSum(w, N);
      pts.push({ w, mag: Math.hypot(v.re, v.im) });
    }
    return pts;
  });
}

// ---- Slider -----------------------------------------------------------------
function paramSlider(d) {
  const spec = d.paramSpec;
  if (!spec) return null;
  const name = spec.symbolText || spec.symbol;
  return {
    titleKey: 'sliderDtftParam', min: spec.min, max: spec.max, step: spec.step, keyStep: spec.step,
    get: () => paramOf(d.presetKey),
    set: (v) => { state.dtftParams[d.presetKey] = v; recomputeDTFT(); },
    badge: () => `${name} = ${spec.step === 1 ? paramOf(d.presetKey) : paramOf(d.presetKey).toFixed(2)}`
  };
}

function omegaSlider() {
  return {
    titleKey: 'sliderDtftOmega', ...OMEGA, step: 0.02, keyStep: 0.1,
    get: () => state.dtftOmega,
    set: (v) => { state.dtftOmega = v; },
    badge: () => `Ω = ${state.dtftOmega.toFixed(2)} rad`
  };
}

function termsSlider() {
  return {
    titleKey: 'sliderDtftN', min: 0, max: N_MAX_TERMS, step: 1, keyStep: 1,
    get: () => state.dtftN,
    set: (v) => { state.dtftN = Math.max(0, Math.min(N_MAX_TERMS, Math.round(v))); },
    badge: () => `N = ${state.dtftN}`
  };
}

// ---- Cena -------------------------------------------------------------------
function renderScene(scene, dt) {
  const frame = scene.begin(dt);
  if (!frame) return;
  const { pal, strokeScale } = frame;
  const d = calc();
  const step = state.step;
  const W = step === 3 ? 3 * Math.PI : Math.PI;      // faixa de Ω mostrada
  const xOfW = (w) => (w / W) * X_HALF;
  const xOfN = (n) => (n / N_VIEW) * X_HALF;
  const showPhase = step === 4 && !d.isImpulsive;
  const probe = state.dtftOmega;
  const N = state.dtftN;

  let maxAbs = 0;
  for (let n = -N_VIEW; n <= N_VIEW; n++) maxAbs = Math.max(maxAbs, Math.abs(d.fnSeq(n)));
  const tScale = AMP_T / Math.max(1, maxAbs) * (maxAbs < 1 ? 1 / Math.max(maxAbs, 1e-9) : 1);
  // Nos pares de impulsos a soma parcial cresce com N: normaliza pelo pico (N + 1/2)
  const mScale = d.isImpulsive ? IMPULSE_H / (N + 0.5) : AMP_M / Math.max(d.peakMag, 1e-9);

  // 1. Piso
  if (state.layers.grid) {
    for (let n = -N_VIEW; n <= N_VIEW; n += 2) {
      scene.line({ x: xOfN(n), y: 0, z: Z_T - 0.35 }, { x: xOfN(n), y: 0, z: Z_T + 0.35 }, pal.gridSub, 0.8);
    }
    const zEnd = showPhase ? Z_P + 0.4 : Z_M + 0.4;
    for (let k = -3; k <= 3; k++) {
      const w = k * Math.PI;
      if (Math.abs(w) > W + 1e-9) continue;
      scene.line({ x: xOfW(w), y: 0, z: Z_M - 0.4 }, { x: xOfW(w), y: 0, z: zEnd }, Math.abs(k) === 1 ? pal.gridMain : pal.gridSub, Math.abs(k) === 1 ? 1.2 : 0.8, k === 0 ? [] : [4, 3]);
    }
  }
  // Passo 3: o período fundamental (-π, π] fica destacado
  if (step === 3) {
    scene.polygon([
      { x: xOfW(-Math.PI), y: 0, z: Z_M - 0.5 }, { x: xOfW(Math.PI), y: 0, z: Z_M - 0.5 },
      { x: xOfW(Math.PI), y: 0, z: Z_M + 0.5 }, { x: xOfW(-Math.PI), y: 0, z: Z_M + 0.5 }
    ], pal.convFill, pal.conv, 1);
  }

  // 2. Trilho do tempo: hastes de x[n]
  scene.line({ x: -X_HALF - 0.3, y: 0, z: Z_T }, { x: X_HALF + 0.3, y: 0, z: Z_T }, pal.axis, 1.4 * strokeScale);
  for (let n = -N_VIEW; n <= N_VIEW; n++) {
    const v = d.fnSeq(n);
    const base = { x: xOfN(n), y: 0, z: Z_T };
    // No passo 2 as amostras que ainda não entraram na soma ficam apagadas
    const used = step !== 2 || Math.abs(n) <= N;
    scene.alpha = used ? 1.0 : 0.25;
    if (Math.abs(v) < 1e-9) scene.dot(base, 2.4 * strokeScale, pal.x1);
    else scene.stem(base, { ...base, y: v * tScale }, pal.x1, 2.2 * strokeScale, 3.4 * strokeScale);
  }
  scene.alpha = 1.0;

  // 3. Trilho da magnitude
  scene.line({ x: -X_HALF - 0.3, y: 0, z: Z_M }, { x: X_HALF + 0.3, y: 0, z: Z_M }, pal.axis, 1.4 * strokeScale);
  const toPts = (curve, scale) => curve.map((p) => ({ x: xOfW(p.w), y: p.mag * scale, z: Z_M }));

  if (d.isImpulsive) {
    // Setas de impulso em ±Ω₀ e nas réplicas a cada 2π
    scene.alpha = step === 2 ? 0.35 : 1.0;
    d.impulses.forEach((imp) => {
      for (let k = -2; k <= 2; k++) {
        const w = imp.omega + k * 2 * Math.PI;
        if (Math.abs(w) > W) continue;
        const x = xOfW(w);
        scene.line({ x, y: 0, z: Z_M }, { x, y: IMPULSE_H, z: Z_M }, pal.conv, 3.0 * strokeScale);
        scene.polygon([
          { x: x - 0.11, y: IMPULSE_H - 0.02, z: Z_M }, { x: x + 0.11, y: IMPULSE_H - 0.02, z: Z_M },
          { x, y: IMPULSE_H + 0.26, z: Z_M }
        ], pal.conv, null, 0);
      }
    });
    scene.alpha = 1.0;
  } else {
    const pts = toPts(exactCurve(d, W), mScale);
    scene.alpha = step === 2 ? 0.35 : 1.0;
    scene.polygon([{ ...pts[0], y: 0 }, ...pts, { ...pts[pts.length - 1], y: 0 }], pal.convFill, null, 0);
    scene.polyline(pts, pal.conv, (step === 2 ? 1.8 : 2.8) * strokeScale);
    scene.alpha = 1.0;
  }
  if (step === 2) {
    scene.polyline(toPts(partialCurve(d, N, W), mScale), pal.prod, 2.8 * strokeScale);
  }

  // 4. Trilho da fase e sonda em Ω (passo 4)
  if (showPhase) {
    scene.line({ x: -X_HALF - 0.3, y: 0, z: Z_P }, { x: X_HALF + 0.3, y: 0, z: Z_P }, pal.axis, 1.4 * strokeScale);
    [-1, 1].forEach((s) => {
      scene.line({ x: -X_HALF, y: s * AMP_P, z: Z_P }, { x: X_HALF, y: s * AMP_P, z: Z_P }, pal.gridMain, 0.9, [3, 4]);
    });
    // Interrompe o traço onde a fase é indefinida ou salta (dobra em ±π ou troca de sinal de X)
    let seg = [];
    let prev = NaN;
    const flush = () => {
      if (seg.length > 1) scene.polyline(seg, pal.prod, 2.4 * strokeScale);
      seg = [];
    };
    exactCurve(d, W).forEach((p) => {
      if (Number.isNaN(p.phase) || Math.abs(p.phase - prev) > 2.0) flush();
      if (!Number.isNaN(p.phase)) seg.push({ x: xOfW(p.w), y: (p.phase / Math.PI) * AMP_P, z: Z_P });
      prev = p.phase;
    });
    flush();
  }
  if (step === 4) {
    const x = xOfW(probe);
    const m = d.mag(probe) * mScale;
    scene.line({ x, y: 0, z: Z_M }, { x, y: 0, z: showPhase ? Z_P : Z_M }, pal.x2, 1.4 * strokeScale, [4, 3]);
    if (!d.isImpulsive) scene.stem({ x, y: 0, z: Z_M }, { x, y: m, z: Z_M }, pal.x2, 2.4 * strokeScale, 4.6 * strokeScale);
    else scene.ring({ x, y: 0, z: Z_M }, 5 * strokeScale, pal.x2, 2.2 * strokeScale);
    if (showPhase) {
      const ph = d.phase(probe);
      if (!Number.isNaN(ph)) scene.stem({ x, y: 0, z: Z_P }, { x, y: (ph / Math.PI) * AMP_P, z: Z_P }, pal.x2, 2.4 * strokeScale, 4.6 * strokeScale);
    }
  }

  scene.end();

  // 5. Rótulos e leitura
  const tick = step === 3 ? ['3\\pi', '-3\\pi'] : ['\\pi', '-\\pi'];
  const probeMag = d.mag(probe);
  scene.labels([
    { slot: 'lbl-x1', latex: `x[n] = ${d.latexTime}`, x: -X_HALF * 0.6, y: AMP_T + 0.5, z: Z_T },
    { slot: 'lbl-tau', latex: 'n', x: X_HALF + 0.55, y: -0.1, z: Z_T },
    {
      slot: 'lbl-conv',
      latex: step === 2 ? `|X_{${N}}(\\Omega)|` : '|X(e^{j\\Omega})|',
      x: -X_HALF - 0.6, y: 1.0, z: Z_M
    },
    { slot: 'lbl-t', latex: '\\Omega', x: X_HALF + 0.95, y: -0.1, z: Z_M },
    { slot: 'lbl-z', latex: tick[0], x: X_HALF, y: -0.35, z: Z_M + 0.3 },
    { slot: 'lbl-x2', latex: tick[1], x: -X_HALF, y: -0.35, z: Z_M + 0.3 },
    { slot: 'lbl-b1', latex: '\\angle X(e^{j\\Omega})', x: -X_HALF - 0.6, y: 0.7, z: Z_P, visible: showPhase },
    {
      slot: 'lbl-b2',
      latex: `|X| = ${num(probeMag)}`,
      x: xOfW(probe), y: probeMag * mScale + 0.45, z: Z_M,
      visible: step === 4 && !d.isImpulsive
    }
  ]);
  scene.livePill(`${d.latexTime} \\;\\longleftrightarrow\\; ${d.latexX}`);
}

// ---- Caderno ----------------------------------------------------------------
const notebook = {
  metric(isEn) {
    const d = calc();
    if (state.step === 1) return { label: isEn ? 'Spectrum' : 'Espectro', latex: isEn ? '\\text{continuous in } \\Omega' : '\\text{contínuo em } \\Omega' };
    if (state.step === 2) return { label: isEn ? 'Terms in the sum' : 'Termos na soma', latex: `2N + 1 = ${2 * state.dtftN + 1}` };
    if (state.step === 3) return { label: isEn ? 'Period' : 'Período', latex: '2\\pi' };
    if (d.isImpulsive) return { label: isEn ? 'Spectrum' : 'Espectro', latex: isEn ? '\\text{impulses}' : '\\text{impulsos}' };
    return { label: isEn ? 'Probe' : 'Sonda', latex: `|X(e^{j${num(state.dtftOmega)}})| = ${num(d.mag(state.dtftOmega), 3)}` };
  },

  lines(isEn) {
    const d = calc();
    const N = state.dtftN;
    const w = state.dtftOmega;

    if (state.step === 1) {
      return [
        {
          label: isEn ? '1.1 Analysis (DTFT):' : '1.1 Análise (DTFT):',
          latex: 'X(e^{j\\Omega}) = \\sum_{n=-\\infty}^{+\\infty} x[n]\\,e^{-j\\Omega n}'
        },
        {
          label: isEn ? '1.2 Synthesis (inverse DTFT):' : '1.2 Síntese (DTFT inversa):',
          latex: 'x[n] = \\frac{1}{2\\pi}\\int_{2\\pi} X(e^{j\\Omega})\\,e^{j\\Omega n}\\,d\\Omega'
        },
        { label: isEn ? '1.3 Sequence:' : '1.3 Sequência:', latex: `x[n] = ${d.latexTime}` },
        { label: isEn ? '1.4 Transform Pair:' : '1.4 Par de Transformada:', latex: `X(e^{j\\Omega}) = ${d.latexX}` }
      ];
    }

    if (state.step === 2) {
      const refW = d.isImpulsive ? d.impulses[0].omega : 0;
      const part = d.partialSum(refW, N);
      let verdict;
      if (isExactAt(d, N)) {
        verdict = isEn
          ? '\\text{the whole sequence is inside} \\implies X_N = X \\text{ exactly}'
          : '\\text{a sequência inteira já entrou} \\implies X_N = X \\text{ exata}';
      } else if (d.isImpulsive) {
        verdict = isEn
          ? '\\text{not summable: the peaks grow with } N \\to \\text{impulses}'
          : '\\text{não é somável: os picos crescem com } N \\to \\text{impulsos}';
      } else if (d.slowDecay) {
        verdict = isEn
          ? '\\text{Gibbs: the} \\approx 9\\% \\text{ overshoot never goes away}'
          : '\\text{Gibbs: o sobressinal de} \\approx 9\\% \\text{ nunca desaparece}';
      } else {
        verdict = isEn
          ? '\\sum |x[n]| < \\infty \\implies X_N \\to X \\text{ uniformly}'
          : '\\sum |x[n]| < \\infty \\implies X_N \\to X \\text{ uniformemente}';
      }
      return [
        {
          label: isEn ? `2.1 Partial Sum with N = ${N}:` : `2.1 Soma Parcial com N = ${N}:`,
          latex: `X_{${N}}(\\Omega) = \\sum_{n=-${N}}^{${N}} x[n]\\,e^{-j\\Omega n}`
        },
        { label: isEn ? '2.2 Does It Converge?' : '2.2 Converge?', latex: verdict },
        {
          label: isEn ? `2.3 Value at Ω = ${num(refW)}:` : `2.3 Valor em Ω = ${num(refW)}:`,
          latex: d.isImpulsive
            ? `X_{${N}}(${num(refW)}) = ${num(part.re, 3)} \\approx N + \\tfrac{1}{2}`
            : `X_{${N}}(0) = ${num(part.re, 3)} \\quad \\text{vs.} \\quad X(e^{j0}) = ${num(d.evalX(0).re, 3)}`
        }
      ];
    }

    if (state.step === 3) {
      return [
        {
          label: isEn ? '3.1 The Spectrum Repeats Every 2π:' : '3.1 O Espectro se Repete a Cada 2π:',
          latex: 'e^{-j(\\Omega + 2\\pi)n} = e^{-j\\Omega n} \\implies X(e^{j(\\Omega + 2\\pi)}) = X(e^{j\\Omega})'
        },
        {
          label: isEn ? '3.2 One Period is Enough (Ω = π is the fastest oscillation):' : '3.2 Basta um Período (Ω = π é a oscilação mais rápida):',
          latex: '-\\pi < \\Omega \\le \\pi, \\qquad e^{j\\pi n} = (-1)^n'
        },
        {
          label: isEn ? '3.3 Parseval:' : '3.3 Parseval:',
          latex: Number.isFinite(d.energy)
            ? `\\sum_n |x[n]|^2 = \\frac{1}{2\\pi}\\int_{2\\pi} |X(e^{j\\Omega})|^2\\,d\\Omega = ${num(d.energy, 3)}`
            : (isEn ? '\\sum_n |x[n]|^2 = \\infty \\quad (\\text{power signal})' : '\\sum_n |x[n]|^2 = \\infty \\quad (\\text{sinal de potência})')
        },
        {
          label: isEn ? '3.4 Bridge to the Z-Transform (unit circle):' : '3.4 Ponte com a Transformada Z (círculo unitário):',
          latex: 'X(e^{j\\Omega}) = X(z)\\big|_{z = e^{j\\Omega}}'
        }
      ];
    }

    // Passo 4
    if (d.isImpulsive) {
      return [
        { label: isEn ? '4.1 Spectrum:' : '4.1 Espectro:', latex: `X(e^{j\\Omega}) = ${d.latexX}` },
        {
          label: isEn ? '4.2 Reading:' : '4.2 Leitura:',
          latex: isEn
            ? '\\text{all the content sits at } \\Omega = \\pm\\Omega_0 \\;(+ 2\\pi k)'
            : '\\text{todo o conteúdo está em } \\Omega = \\pm\\Omega_0 \\;(+ 2\\pi k)'
        },
        {
          label: isEn ? '4.3 Properties:' : '4.3 Propriedades:',
          latex: 'x[n - n_0] \\leftrightarrow e^{-j\\Omega n_0}X(e^{j\\Omega}), \\qquad x * h \\leftrightarrow X \\cdot H'
        }
      ];
    }
    const v = d.evalX(w);
    const ph = d.phase(w);
    const gain = d.mag(w);
    return [
      {
        label: isEn ? `4.1 Spectrum at Ω = ${num(w)} rad:` : `4.1 Espectro em Ω = ${num(w)} rad:`,
        latex: `X(e^{j${num(w)}}) = ${complexLatex(v)}`
      },
      {
        label: isEn ? '4.2 Magnitude and Phase:' : '4.2 Magnitude e Fase:',
        latex: `|X| = ${num(gain, 3)}, \\qquad \\angle X = ${Number.isNaN(ph) ? (isEn ? '\\text{undefined}' : '\\text{indefinida}') : `${num(ph, 3)}\\ \\text{rad}`}`
      },
      {
        label: isEn ? '4.3 As a Filter h[n] = x[n]:' : '4.3 Como Filtro h[n] = x[n]:',
        latex: `\\cos(${num(w)}n) \\;\\longrightarrow\\; ${num(gain, 3)}\\cos(${num(w)}n ${Number.isNaN(ph) || Math.abs(ph) < 5e-3 ? '' : `${ph < 0 ? '-' : '+'} ${num(Math.abs(ph))}`})`
      },
      {
        label: isEn ? '4.4 Filter Type (gain at Ω = 0 vs. Ω = π):' : '4.4 Tipo de Filtro (ganho em Ω = 0 vs. Ω = π):',
        latex: `|X(e^{j0})| = ${num(d.mag(0), 3)}, \\quad |X(e^{j\\pi})| = ${num(d.mag(Math.PI), 3)} \\implies \\textbf{${filterLabel(d, isEn)}}`
      },
      {
        label: isEn ? '4.5 Properties:' : '4.5 Propriedades:',
        latex: 'x[n - n_0] \\leftrightarrow e^{-j\\Omega n_0}X(e^{j\\Omega}), \\qquad x * h \\leftrightarrow X \\cdot H'
      }
    ];
  },

  table(container, isEn) {
    const header = document.createElement('div');
    header.className = 'grid grid-cols-2 gap-2 px-2 py-1.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[10px] font-bold text-sec uppercase tracking-wider mb-1';
    [isEn ? 'Sequence x[n]' : 'Sequência x[n]', 'X(e^jΩ)'].forEach((text, i) => {
      const span = document.createElement('span');
      span.textContent = text;
      if (i === 1) span.className = 'text-right';
      header.appendChild(span);
    });
    container.appendChild(header);

    Object.keys(DTFT_PRESETS).forEach((key) => {
      const isCurrent = state.dtftPresetKey === key;
      const data = isCurrent ? calc() : calculateDTFTData(key, paramOf(key));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `region-row w-full text-left px-2 py-1.5 rounded-lg grid grid-cols-2 items-center gap-2 ui-control ${isCurrent ? 'active font-semibold' : ''}`;
      const cells = [data.latexTime, data.latexX].map((latex, i) => {
        const span = document.createElement('span');
        span.className = `text-[10px] truncate ${i === 1 ? 'text-right' : ''}`;
        renderMath(span, latex, false);
        return span;
      });
      btn.append(...cells);
      btn.addEventListener('click', () => {
        selectDTFTPreset(key);
        window.dispatchEvent(new CustomEvent('module-preset-changed'));
      });
      container.appendChild(btn);
    });
  }
};

// ---- Galeria ----------------------------------------------------------------
function renderGallery(gallery, isEn, refresh) {
  renderSequenceEditor(gallery, {
    isEn,
    title: isEn ? 'Type your own x[n]' : 'Digite o seu x[n]',
    active: state.dtftPresetKey === 'custom',
    fields: [
      { id: 'x', label: 'x[n]:', values: state.dtftCustom.values, start: state.dtftCustom.start, hasStart: true, maxLen: 21, startMin: -10, startMax: 10 }
    ],
    onApply: (result) => {
      // A parede do tempo mostra n de -10 a 10: a sequência é encaixada nessa janela
      const start = Math.min(result.x.start, 10 - (result.x.values.length - 1));
      state.dtftCustom = { start: Math.max(-10, start), values: result.x.values };
      selectDTFTPreset('custom');
      refresh();
    }
  });

  Object.entries(DTFT_PRESETS).forEach(([key, preset]) => {
    const isActive = state.dtftPresetKey === key;
    const data = isActive ? calc() : calculateDTFTData(key, paramOf(key));

    const card = document.createElement('div');
    card.className = `preset-pill rounded-lg p-2 cursor-pointer flex flex-col justify-between gap-1 relative ${isActive ? 'active' : ''}`;
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.setAttribute('aria-pressed', String(isActive));

    const head = document.createElement('div');
    head.className = 'flex items-center justify-between gap-1';
    const title = document.createElement('span');
    title.className = 'text-[11px] font-bold truncate text-primary';
    title.textContent = isEn ? preset.titleEn : preset.title;
    const badge = document.createElement('span');
    badge.className = 'text-[9px] font-mono-code font-semibold shrink-0';
    badge.style.color = 'var(--c-conv)';
    badge.textContent = filterLabel(data, isEn);
    head.append(title, badge);

    const math = document.createElement('div');
    math.className = 'preset-math text-[10px] pt-0.5 truncate';
    renderMath(math, `${data.latexTime} \\leftrightarrow ${data.latexX}`, false);

    card.append(head, math);
    const choose = () => {
      selectDTFTPreset(key);
      refresh();
    };
    card.addEventListener('click', choose);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        choose();
      }
    });
    gallery.appendChild(card);
  });
}

// ---- Registro ---------------------------------------------------------------
export const dtftModule = registerModule({
  id: 'dtft',
  hash: 'dtft',
  i18n: { title: 'modDtftTitle', sub: 'modDtftSub', stepPrefix: 'stepDtft', regionsTitle: 'regionsDtftTitle' },
  zenLabel: 'X(e^jΩ)',
  controls: [],
  hudTargets: [],          // as sequências vêm dos pares notáveis; não há editor livre
  defaultHudTarget: null,
  defaultSliderValue: 0,
  notebookEveryFrames: 6,
  cameraTarget: { x: 0, y: 0.6, z: 3.3 },
  mobileZoomOut: 1.3,   // recuo extra da câmera em telas estreitas

  slider() {
    if (state.step === 2) return termsSlider();
    if (state.step === 4) return omegaSlider();
    return paramSlider(calc()) || omegaSlider();
  },

  onEnter() {
    recomputeDTFT();
  },

  onStepEnter() {},

  tick(spd) {
    const spec = this.slider();
    // Vai e volta entre os extremos; sliders inteiros andam um passo por vez
    tickAcc += 0.012 * spd * (spec.max - spec.min) / 4;
    if (tickAcc < spec.step) return;
    let next = spec.get() + sweepDir * Math.floor(tickAcc / spec.step) * spec.step;
    tickAcc = 0;
    if (next >= spec.max) { next = spec.max; sweepDir = -1; }
    if (next <= spec.min) { next = spec.min; sweepDir = 1; }
    spec.set(next);
  },

  renderScene,
  notebook,
  renderGallery
});
