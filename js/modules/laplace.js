// ============================================================================
// MODULES/LAPLACE.JS — Transformada de Laplace no plano s
// ----------------------------------------------------------------------------
// Palco: o plano s fica no piso (σ na horizontal, jω na profundidade) e |X(s)|
// é a altura — os polos viram "mastros de tenda". A parede do fundo mostra x(t)
// e x(t)·e^{-σt}, o fator de convergência que explica a ROC.
// Passos: 1 definição, 2 polos/zeros/ROC, 3 superfície |X(s)| com corte em σ,
//         4 corte no eixo jω (Fourier) e estabilidade.
// Módulo totalmente plugável: cena, caderno e galeria vivem aqui.
// ============================================================================

import { state } from '../state.js';
import { renderMath } from '../math-engine.js';
import { LAPLACE_PRESETS, calculateLaplaceData } from '../laplace-engine.js';
import { registerModule } from './registry.js';

// ---- Geometria do palco -----------------------------------------------------
const S_MAX = 4.0;      // σ ∈ [-4, 4] → x
const W_MAX = 6.0;      // ω ∈ [-6, 6] → z ∈ [0, 6]
const Z_MID = 3.0;
const Z_WALL = -0.9;    // parede do domínio do tempo (atrás do plano s; a câmera fica em +z)
const MAG_CAP = 2.6;    // |X(s)| é cortado aqui (perto dos polos vai a infinito)
const MAG_SCALE = 0.9;
const T_MIN = -3.0;     // t ∈ [-3, 5] na parede do fundo
const T_MAX = 5.0;
const AMP_CLAMP = 2.4;

const zOf = (omega) => Z_MID + omega / 2;
const xOfT = (t) => -S_MAX + (t - T_MIN);
const height = (mag) => Math.min(mag, MAG_CAP) * MAG_SCALE;

const SIGMA = { min: -3.5, max: 3.5 };
let sweepDir = 1;

export function recomputeLaplace() {
  state.laplaceCalculated = calculateLaplaceData(state.laplacePresetKey, state.laplaceA, state.laplaceW0);
  // O motor limita os parâmetros à faixa do preset; o estado acompanha.
  if (state.laplaceCalculated.hasParamA) state.laplaceA = state.laplaceCalculated.a;
  if (state.laplaceCalculated.hasParamW0) state.laplaceW0 = state.laplaceCalculated.w0;
  return state.laplaceCalculated;
}

function calc() {
  return state.laplaceCalculated || recomputeLaplace();
}

export function selectLaplacePreset(key) {
  const preset = LAPLACE_PRESETS[key];
  if (!preset) return;
  state.laplacePresetKey = key;
  if (preset.params.a) state.laplaceA = preset.params.a.def;
  if (preset.params.w0) state.laplaceW0 = preset.params.w0.def;
  recomputeLaplace();
}

/** σ do corte desenhado: no passo 4 o corte é sempre o eixo jω (Fourier). */
function cutSigma() {
  return state.step === 4 ? 0 : state.laplaceSigma;
}

// ---- Formatação -------------------------------------------------------------
const num = (v, d = 2) => {
  const r = Math.round(v * 10 ** d) / 10 ** d;
  return Object.is(r, -0) ? '0' : String(r);
};

function complexLatex(p) {
  const hasRe = Math.abs(p.re) > 1e-9;
  const hasIm = Math.abs(p.im) > 1e-9;
  if (!hasIm) return num(p.re);
  const imPart = `${p.im < 0 ? '-' : (hasRe ? '+' : '')} j${num(Math.abs(p.im))}`;
  return hasRe ? `${num(p.re)} ${imPart}` : imPart.trim();
}

function listLatex(points, emptyText) {
  if (points.length === 0) return `\\text{${emptyText}}`;
  // Polos repetidos aparecem uma vez, com a multiplicidade
  const groups = [];
  points.forEach((p) => {
    const g = groups.find((it) => Math.abs(it.p.re - p.re) < 1e-9 && Math.abs(it.p.im - p.im) < 1e-9);
    if (g) g.n += 1;
    else groups.push({ p, n: 1 });
  });
  return groups.map((g) => (g.n > 1 ? `${complexLatex(g.p)}\\;(\\times ${g.n})` : complexLatex(g.p))).join(',\\quad ');
}

const STABILITY_TEXT = {
  stable: { pt: 'Estável', en: 'Stable' },
  marginal: { pt: 'Marginalmente estável', en: 'Marginally stable' },
  unstable: { pt: 'Instável', en: 'Unstable' }
};

// ---- Slider -----------------------------------------------------------------
function sigmaSlider() {
  return {
    titleKey: 'sliderLaplaceSigma', ...SIGMA, step: 0.05, keyStep: 0.1,
    get: () => state.laplaceSigma,
    set: (v) => { state.laplaceSigma = v; },
    badge: () => `σ = ${state.laplaceSigma.toFixed(2)}`
  };
}

function paramSlider(c) {
  if (c.hasParamA) {
    const spec = c.paramSpec.a;
    return {
      titleKey: 'sliderLaplaceA', min: spec.min, max: spec.max, step: 0.05, keyStep: 0.1,
      get: () => state.laplaceA,
      set: (v) => { state.laplaceA = v; recomputeLaplace(); },
      badge: () => `a = ${state.laplaceA.toFixed(2)}`
    };
  }
  if (c.hasParamW0) {
    const spec = c.paramSpec.w0;
    return {
      titleKey: 'sliderLaplaceW0', min: spec.min, max: spec.max, step: 0.05, keyStep: 0.1,
      get: () => state.laplaceW0,
      set: (v) => { state.laplaceW0 = v; recomputeLaplace(); },
      badge: () => `ω₀ = ${state.laplaceW0.toFixed(2)} rad/s`
    };
  }
  return null;
}

// ---- Cena -------------------------------------------------------------------
function renderScene(scene, dt) {
  const frame = scene.begin(dt);
  if (!frame) return;
  const { pal, strokeScale } = frame;
  const c = calc();
  const sc = cutSigma();
  const showSurface = state.step >= 3;
  const cutOk = c.inROC(sc);
  const cutColor = cutOk ? pal.conv : pal.x2;

  // 1. Parede do fundo: domínio do tempo
  if (state.layers.grid) {
    scene.polygon([
      { x: -S_MAX, y: -1.4, z: Z_WALL }, { x: S_MAX, y: -1.4, z: Z_WALL },
      { x: S_MAX, y: AMP_CLAMP, z: Z_WALL }, { x: -S_MAX, y: AMP_CLAMP, z: Z_WALL }
    ], pal.wallFill, pal.wallBorder, 1);
    scene.line({ x: -S_MAX, y: 0, z: Z_WALL }, { x: S_MAX, y: 0, z: Z_WALL }, pal.gridMain, 1.2 * strokeScale);
    scene.line({ x: xOfT(0), y: -1.4, z: Z_WALL }, { x: xOfT(0), y: AMP_CLAMP, z: Z_WALL }, pal.gridMain, 1.2 * strokeScale);
  }

  // Curvas no tempo; interrompe o traço onde a amplitude estoura a parede
  const drawTimeCurve = (fn, color, width, dash) => {
    let seg = [];
    const flush = () => {
      if (seg.length > 1) scene.polyline(seg, color, width, dash);
      seg = [];
    };
    const steps = 240;
    for (let i = 0; i <= steps; i++) {
      const t = T_MIN + (i / steps) * (T_MAX - T_MIN);
      const y = fn(t);
      if (!Number.isFinite(y) || y > AMP_CLAMP || y < -1.4) flush();
      else seg.push({ x: xOfT(t), y, z: Z_WALL });
    }
    flush();
  };
  if (showSurface) {
    // x(t)·e^{-σt}: é deste sinal que se tira a transformada de Fourier no corte σ
    drawTimeCurve((t) => c.fnTime(t) * Math.exp(-sc * t), cutColor, 1.8 * strokeScale, [4, 3]);
  }
  drawTimeCurve(c.fnTime, pal.x1, 2.6 * strokeScale, []);

  // 2. Piso: plano s com a ROC sombreada
  const rocLo = Math.max(-S_MAX, c.roc.min);
  const rocHi = Math.min(S_MAX, c.roc.max);
  if (rocHi > rocLo) {
    scene.polygon([
      { x: rocLo, y: 0, z: 0 }, { x: rocHi, y: 0, z: 0 },
      { x: rocHi, y: 0, z: 2 * Z_MID }, { x: rocLo, y: 0, z: 2 * Z_MID }
    ], pal.convFill, null, 0);
  }
  [c.roc.min, c.roc.max].filter((v) => Number.isFinite(v) && Math.abs(v) <= S_MAX).forEach((edge) => {
    scene.line({ x: edge, y: 0, z: 0 }, { x: edge, y: 0, z: 2 * Z_MID }, pal.conv, 1.6 * strokeScale, [5, 4]);
  });

  if (state.layers.grid) {
    for (let s = -S_MAX; s <= S_MAX + 1e-9; s += 1) {
      scene.line({ x: s, y: 0, z: 0 }, { x: s, y: 0, z: 2 * Z_MID }, pal.gridSub, 0.8);
    }
    for (let w = -W_MAX; w <= W_MAX + 1e-9; w += 2) {
      scene.line({ x: -S_MAX, y: 0, z: zOf(w) }, { x: S_MAX, y: 0, z: zOf(w) }, pal.gridSub, 0.8);
    }
  }
  // Eixos σ e jω
  scene.line({ x: -S_MAX, y: 0, z: Z_MID }, { x: S_MAX, y: 0, z: Z_MID }, pal.axis, 1.6 * strokeScale);
  scene.line({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 2 * Z_MID }, pal.axis, 1.8 * strokeScale);

  // 3. Superfície |X(s)| em malha de arame (do fundo para a frente)
  if (showSurface) {
    const N = 32;
    scene.alpha = 0.55;
    for (let j = 0; j <= N; j += 2) {
      const w = -W_MAX + (j / N) * 2 * W_MAX;
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const s = -S_MAX + (i / N) * 2 * S_MAX;
        pts.push({ x: s, y: height(c.mag(s, w)), z: zOf(w) });
      }
      scene.polyline(pts, pal.gridMain, 1.0 * strokeScale);
    }
    for (let i = 0; i <= N; i += 2) {
      const s = -S_MAX + (i / N) * 2 * S_MAX;
      const pts = [];
      for (let j = 0; j <= N; j++) {
        const w = -W_MAX + (j / N) * 2 * W_MAX;
        pts.push({ x: s, y: height(c.mag(s, w)), z: zOf(w) });
      }
      // Dentro da ROC a integral converge: essas fatias ganham a cor de destaque
      scene.polyline(pts, c.inROC(s) ? pal.conv : pal.gridMain, (c.inROC(s) ? 1.3 : 1.0) * strokeScale);
    }
    scene.alpha = 1.0;

    // 4. Corte em σ: a curva |X(σ + jω)| e a sua "cortina" até o piso
    const cutPts = [];
    const M = 160;
    for (let j = 0; j <= M; j++) {
      const w = -W_MAX + (j / M) * 2 * W_MAX;
      cutPts.push({ x: sc, y: height(c.mag(sc, w)), z: zOf(w) });
    }
    scene.alpha = 0.22;
    scene.polygon([{ x: sc, y: 0, z: 0 }, ...cutPts, { x: sc, y: 0, z: 2 * Z_MID }], cutColor, null, 0);
    scene.alpha = 1.0;
    scene.line({ x: sc, y: 0, z: 0 }, { x: sc, y: 0, z: 2 * Z_MID }, cutColor, 1.6 * strokeScale);
    scene.polyline(cutPts, cutColor, 3.0 * strokeScale, cutOk ? [] : [6, 4]);
  }

  // 5. Polos (×) e zeros (○)
  c.zeros.forEach((z) => {
    scene.ring({ x: z.re, y: 0, z: zOf(z.im) }, 6.5 * strokeScale, pal.x1, 2.4 * strokeScale);
  });
  c.poles.forEach((p) => {
    const base = { x: p.re, y: 0, z: zOf(p.im) };
    if (Math.abs(p.re) > S_MAX || Math.abs(p.im) > W_MAX) return;
    if (showSurface) scene.line(base, { ...base, y: MAG_CAP * MAG_SCALE }, pal.x2, 1.4 * strokeScale, [3, 3]);
    scene.cross(base, 6.5 * strokeScale, pal.x2, 2.8 * strokeScale);
  });

  scene.end();

  // 6. Rótulos e leitura
  const rocCenter = rocHi > rocLo ? (rocLo + rocHi) / 2 : 0;
  scene.labels([
    { slot: 'lbl-tau', latex: '\\sigma', x: S_MAX - 0.3, y: -0.15, z: Z_MID },
    { slot: 'lbl-t', latex: 'j\\omega', x: 0, y: -0.15, z: 2 * Z_MID - 0.2 },
    { slot: 'lbl-z', latex: '|X(s)|', x: -S_MAX, y: 2.0, z: Z_MID, visible: showSurface },
    { slot: 'lbl-x1', latex: `x(t) = ${c.latexTime}`, x: xOfT(2.6), y: 1.9, z: Z_WALL },
    { slot: 'lbl-x2', latex: `x(t)\\,e^{-${num(sc)}t}`.replace('e^{--', 'e^{'), x: xOfT(-1.6), y: 1.3, z: Z_WALL, visible: showSurface && Math.abs(sc) > 1e-9 },
    { slot: 'lbl-conv', latex: '\\text{ROC}', x: rocCenter, y: 0.05, z: 2 * Z_MID - 1.2, visible: rocHi > rocLo },
    {
      slot: 'lbl-b1',
      latex: Math.abs(sc) < 1e-9 ? 's = j\\omega' : `\\sigma = ${num(sc)}`,
      x: sc, y: height(c.mag(sc, 0)) + 0.35, z: Z_MID, visible: showSurface
    }
  ]);
  scene.livePill(`X(s) = ${c.latexX} \\quad \\text{ROC: } ${c.latexROC}`);
}

// ---- Caderno ----------------------------------------------------------------
const notebook = {
  metric(isEn) {
    const c = calc();
    if (state.step === 1) return { label: isEn ? 'Complex frequency' : 'Frequência complexa', latex: 's = \\sigma + j\\omega' };
    if (state.step === 2) return { label: 'ROC', latex: c.latexROC };
    if (state.step === 3) {
      const sc = cutSigma();
      const verdict = c.inROC(sc)
        ? (isEn ? '\\in \\text{ROC}' : '\\in \\text{ROC}')
        : (isEn ? '\\notin \\text{ROC (diverges)}' : '\\notin \\text{ROC (diverge)}');
      return { label: isEn ? 'Cut' : 'Corte', latex: `\\sigma = ${num(sc)} \\; ${verdict}` };
    }
    const txt = STABILITY_TEXT[c.stability][isEn ? 'en' : 'pt'];
    return { label: isEn ? 'System h(t) = x(t)' : 'Sistema h(t) = x(t)', latex: `\\text{${txt}}` };
  },

  lines(isEn) {
    const c = calc();
    const sc = cutSigma();

    if (state.step === 1) {
      return [
        {
          label: isEn ? '1.1 Bilateral Laplace Transform Definition:' : '1.1 Definição da Transformada de Laplace Bilateral:',
          latex: 'X(s) = \\mathcal{L}\\{x(t)\\} = \\int_{-\\infty}^{+\\infty} x(t)\\,e^{-st}\\,dt, \\quad s = \\sigma + j\\omega'
        },
        {
          label: isEn ? '1.2 Time-Domain Signal:' : '1.2 Sinal no Domínio do Tempo:',
          latex: `x(t) = ${c.latexTime}`
        },
        {
          label: isEn ? '1.3 Laplace as a Fourier Transform with a Convergence Factor:' : '1.3 Laplace é uma Fourier com Fator de Convergência:',
          latex: 'X(\\sigma + j\\omega) = \\mathcal{F}\\{x(t)\\,e^{-\\sigma t}\\}'
        }
      ];
    }

    if (state.step === 2) {
      const rocRule = {
        causal: isEn
          ? '\\text{Right-sided signal} \\implies \\text{ROC to the right of the rightmost pole}'
          : '\\text{Sinal causal (lateral direito)} \\implies \\text{ROC à direita do polo mais à direita}',
        anticausal: isEn
          ? '\\text{Left-sided signal} \\implies \\text{ROC to the left of the leftmost pole}'
          : '\\text{Sinal anticausal (lateral esquerdo)} \\implies \\text{ROC à esquerda do polo mais à esquerda}',
        bilateral: isEn
          ? '\\text{Two-sided signal} \\implies \\text{ROC is a strip between poles}'
          : '\\text{Sinal bilateral} \\implies \\text{ROC é uma faixa entre polos}'
      }[c.causality];
      return [
        {
          label: isEn ? '2.1 Transform Pair:' : '2.1 Par de Transformada:',
          latex: `${c.latexTime} \\;\\longleftrightarrow\\; X(s) = ${c.latexX}`
        },
        {
          label: isEn ? '2.2 Poles (×) and Zeros (○):' : '2.2 Polos (×) e Zeros (○):',
          latex: `p: \\; ${listLatex(c.poles, isEn ? 'none' : 'nenhum')} \\qquad z: \\; ${listLatex(c.zeros, isEn ? 'none' : 'nenhum')}`
        },
        {
          label: isEn ? '2.3 Region of Convergence (ROC):' : '2.3 Região de Convergência (ROC):',
          latex: c.latexROC
        },
        {
          label: isEn ? '2.4 Why this ROC:' : '2.4 Por que essa ROC:',
          latex: rocRule
        }
      ];
    }

    if (state.step === 3) {
      const inside = c.inROC(sc);
      const value = c.mag(sc, 0);
      return [
        {
          label: isEn ? `3.1 Vertical Cut at σ = ${num(sc)}:` : `3.1 Corte Vertical em σ = ${num(sc)}:`,
          latex: `X(${num(sc)} + j\\omega) = \\int_{-\\infty}^{+\\infty} \\left[x(t)\\,e^{${num(-sc)}t}\\right] e^{-j\\omega t}\\,dt`
        },
        {
          label: isEn ? '3.2 Does the Integral Converge Here?' : '3.2 A Integral Converge Aqui?',
          latex: inside
            ? `\\sigma = ${num(sc)} \\in \\text{ROC} \\implies |X(${num(sc)})| = ${Number.isFinite(value) ? value.toFixed(3) : '\\infty'}`
            : (isEn
              ? `\\sigma = ${num(sc)} \\notin \\text{ROC} \\implies x(t)e^{-\\sigma t} \\text{ is not absolutely integrable}`
              : `\\sigma = ${num(sc)} \\notin \\text{ROC} \\implies x(t)e^{-\\sigma t} \\text{ não é absolutamente integrável}`)
        },
        {
          label: isEn ? '3.3 Surface Reading:' : '3.3 Leitura da Superfície:',
          latex: isEn
            ? '|X(s)| \\to \\infty \\text{ at poles}, \\quad |X(s)| = 0 \\text{ at zeros}'
            : '|X(s)| \\to \\infty \\text{ nos polos}, \\quad |X(s)| = 0 \\text{ nos zeros}'
        }
      ];
    }

    // Passo 4
    const fourierLine = c.hasFourier
      ? `j\\omega \\in \\text{ROC} \\implies X(\\omega) = X(s)\\big|_{s = j\\omega}`
      : (c.stability === 'marginal'
        ? (isEn
          ? '\\text{Pole on the } j\\omega \\text{ axis} \\implies \\text{Fourier exists only with impulses } \\delta(\\omega)'
          : '\\text{Polo sobre o eixo } j\\omega \\implies \\text{Fourier só existe com impulsos } \\delta(\\omega)')
        : (isEn
          ? 'j\\omega \\notin \\text{ROC} \\implies \\text{the Fourier transform does not exist}'
          : 'j\\omega \\notin \\text{ROC} \\implies \\text{a transformada de Fourier não existe}'));
    const stab = STABILITY_TEXT[c.stability][isEn ? 'en' : 'pt'];
    const stabLine = c.stability === 'stable'
      ? `j\\omega \\in \\text{ROC} \\implies \\int_{-\\infty}^{+\\infty} |h(t)|\\,dt < \\infty \\implies \\textbf{${stab}}`
      : c.stability === 'marginal'
      ? (isEn
        ? `\\text{Pole on the } j\\omega \\text{ axis} \\implies \\int_{-\\infty}^{+\\infty} |h(t)|\\,dt = \\infty \\implies \\textbf{${stab}} \\text{ (not BIBO)}`
        : `\\text{Polo sobre o eixo } j\\omega \\implies \\int_{-\\infty}^{+\\infty} |h(t)|\\,dt = \\infty \\implies \\textbf{${stab}} \\text{ (não é BIBO)}`)
      : `j\\omega \\notin \\text{ROC} \\implies \\int_{-\\infty}^{+\\infty} |h(t)|\\,dt = \\infty \\implies \\textbf{${stab}}`;
    return [
      {
        label: isEn ? '4.1 Bridge to the Fourier Transform:' : '4.1 Ponte com a Transformada de Fourier:',
        latex: fourierLine
      },
      {
        label: isEn ? '4.2 BIBO Stability of a System with h(t) = x(t):' : '4.2 Estabilidade BIBO de um Sistema com h(t) = x(t):',
        latex: stabLine
      },
      {
        label: isEn ? '4.3 Causal Systems Shortcut:' : '4.3 Atalho para Sistemas Causais:',
        latex: isEn
          ? '\\text{Causal and stable} \\iff \\text{all poles in } \\operatorname{Re}\\{s\\} < 0'
          : '\\text{Causal e estável} \\iff \\text{todos os polos em } \\operatorname{Re}\\{s\\} < 0'
      },
      {
        label: isEn ? '4.4 Operational Properties:' : '4.4 Propriedades Operacionais:',
        latex: '\\mathcal{L}\\{x(t - t_0)\\} = e^{-st_0}X(s), \\quad \\mathcal{L}\\left\\{\\tfrac{dx}{dt}\\right\\} = sX(s), \\quad \\mathcal{L}\\{x * h\\} = X(s)H(s)'
      }
    ];
  },

  table(container, isEn) {
    const header = document.createElement('div');
    header.className = 'grid grid-cols-3 gap-2 px-2 py-1.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[10px] font-bold text-sec uppercase tracking-wider mb-1';
    [isEn ? 'Signal x(t)' : 'Sinal x(t)', 'X(s)', 'ROC'].forEach((text, i) => {
      const span = document.createElement('span');
      span.textContent = text;
      if (i === 2) span.className = 'text-right';
      header.appendChild(span);
    });
    container.appendChild(header);

    Object.keys(LAPLACE_PRESETS).forEach((key) => {
      const isCurrent = state.laplacePresetKey === key;
      // A linha do par ativo acompanha os parâmetros atuais; as demais usam os valores padrão
      const spec = LAPLACE_PRESETS[key].params;
      const data = isCurrent ? calc() : calculateLaplaceData(key, spec.a?.def, spec.w0?.def);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `region-row w-full text-left px-2 py-1.5 rounded-lg grid grid-cols-3 items-center gap-2 ui-control ${isCurrent ? 'active font-semibold' : ''}`;
      const cells = [data.latexTime, data.latexX, data.latexROC].map((latex, i) => {
        const span = document.createElement('span');
        span.className = `text-[10px] truncate ${i === 2 ? 'text-right' : ''}`;
        renderMath(span, latex, false);
        return span;
      });
      btn.append(...cells);
      btn.addEventListener('click', () => {
        selectLaplacePreset(key);
        window.dispatchEvent(new CustomEvent('module-preset-changed'));
      });
      container.appendChild(btn);
    });
  }
};

// ---- Galeria ----------------------------------------------------------------
function renderGallery(gallery, isEn, refresh) {
  Object.entries(LAPLACE_PRESETS).forEach(([key, preset]) => {
    const isActive = state.laplacePresetKey === key;
    const data = isActive ? calc() : calculateLaplaceData(key, preset.params.a?.def, preset.params.w0?.def);

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
    badge.className = 'text-[9px] font-mono-code font-semibold';
    badge.style.color = 'var(--c-conv)';
    badge.textContent = { causal: isEn ? 'causal' : 'causal', anticausal: isEn ? 'anticausal' : 'anticausal', bilateral: isEn ? 'two-sided' : 'bilateral' }[data.causality];
    head.append(title, badge);

    const math = document.createElement('div');
    math.className = 'preset-math text-[10px] pt-0.5 truncate';
    renderMath(math, `${data.latexTime} \\leftrightarrow ${data.latexX}`, false);

    card.append(head, math);
    const choose = () => {
      selectLaplacePreset(key);
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
export const laplaceModule = registerModule({
  id: 'laplace',
  hash: 'laplace',
  i18n: { title: 'modLaplaceTitle', sub: 'modLaplaceSub', stepPrefix: 'stepLaplace', regionsTitle: 'regionsLaplaceTitle' },
  zenLabel: 'X(s)',
  controls: [],
  hudTargets: [],          // os sinais vêm dos pares notáveis; não há editor livre
  defaultHudTarget: null,
  defaultSliderValue: 0,
  notebookEveryFrames: 6,
  cameraTarget: { x: 0, y: 0.7, z: 3.3 },

  slider() {
    if (state.step === 3) return sigmaSlider();
    return paramSlider(calc()) || sigmaSlider();
  },

  onEnter() {
    recomputeLaplace();
  },

  onStepEnter() {},

  tick(spd) {
    const spec = this.slider();
    // Vai e volta entre os extremos do slider: o polo atravessa o eixo jω nos dois sentidos
    let next = spec.get() + sweepDir * 0.012 * spd * (spec.max - spec.min) / 4;
    if (next >= spec.max) { next = spec.max; sweepDir = -1; }
    if (next <= spec.min) { next = spec.min; sweepDir = 1; }
    spec.set(next);
  },

  renderScene,
  notebook,
  renderGallery
});
