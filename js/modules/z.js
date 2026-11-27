// ============================================================================
// MODULES/Z.JS — Transformada Z no plano z
// ----------------------------------------------------------------------------
// Palco: o plano z fica no piso (Re{z} na horizontal, Im{z} na profundidade) e
// |X(z)| é a altura. A ROC é um anel; o círculo unitário faz o papel que o
// eixo jω faz em Laplace. A parede do fundo mostra as hastes de x[n] e de
// x[n]·r^{-n}, o fator de convergência que explica a ROC.
// Passos: 1 definição, 2 polos/zeros/ROC, 3 superfície |X(z)| com corte em
//         |z| = r, 4 corte no círculo unitário (DTFT) e estabilidade.
// Módulo totalmente plugável: cena, caderno e galeria vivem aqui.
// ============================================================================

import { state } from '../state.js';
import { renderMath } from '../math-engine.js';
import { Z_PRESETS, calculateZData } from '../z-engine.js';
import { registerModule } from './registry.js';

// ---- Geometria do palco -----------------------------------------------------
const K = 1.5;          // unidades de cena por unidade do plano z
const R_MAX = 2.2;      // o piso mostra |z| ≤ 2.2
const Z_MID = 3.3;      // origem do plano z na profundidade
const Z_WALL = -0.9;    // parede do domínio do tempo (atrás do plano z; a câmera fica em +z)
const WALL_HALF = 4.0;
const MAG_CAP = 4.0;    // |X(z)| é cortado aqui (perto dos polos vai a infinito)
const MAG_SCALE = 0.6;
const N_MIN = -6;       // n ∈ [-6, 10] na parede do fundo
const N_MAX = 10;
const AMP_MAX = 2.4;
const AMP_MIN = -1.4;

// Im{z} positivo se afasta da câmera: visto de cima, o ângulo Ω cresce no sentido anti-horário.
const floorPt = (re, im, y = 0) => ({ x: re * K, y, z: Z_MID - im * K });
const polarPt = (r, omega, y = 0) => floorPt(r * Math.cos(omega), r * Math.sin(omega), y);
const xOfN = (n) => -WALL_HALF + (n - N_MIN) * (2 * WALL_HALF / (N_MAX - N_MIN));
const height = (mag) => Math.min(mag, MAG_CAP) * MAG_SCALE;

const RADIUS = { min: 0.2, max: 2.1 };
let sweepDir = 1;

export function recomputeZ() {
  state.zCalculated = calculateZData(state.zPresetKey, state.zA, state.zW0);
  // O motor limita os parâmetros à faixa do preset; o estado acompanha.
  if (state.zCalculated.hasParamA) state.zA = state.zCalculated.a;
  if (state.zCalculated.hasParamW0) state.zW0 = state.zCalculated.w0;
  return state.zCalculated;
}

function calc() {
  return state.zCalculated || recomputeZ();
}

export function selectZPreset(key) {
  const preset = Z_PRESETS[key];
  if (!preset) return;
  state.zPresetKey = key;
  if (preset.params.a) state.zA = preset.params.a.def;
  if (preset.params.w0) state.zW0 = preset.params.w0.def;
  recomputeZ();
}

/** Raio do corte desenhado: no passo 4 o corte é sempre o círculo unitário (DTFT). */
function cutRadius() {
  return state.step === 4 ? 1 : state.zR;
}

// ---- Formatação -------------------------------------------------------------
const num = (v, d = 2) => {
  const r = Math.round(v * 10 ** d) / 10 ** d;
  return Object.is(r, -0) ? '0' : String(r);
};

function complexLatex(p) {
  const hasRe = Math.abs(p.re) > 5e-3;
  const hasIm = Math.abs(p.im) > 5e-3;
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

const CAUSALITY_TEXT = {
  causal: { pt: 'causal', en: 'causal' },
  anticausal: { pt: 'anticausal', en: 'anticausal' },
  bilateral: { pt: 'bilateral', en: 'two-sided' },
  finite: { pt: 'finita', en: 'finite' }
};

// ---- Slider -----------------------------------------------------------------
function radiusSlider() {
  return {
    titleKey: 'sliderZR', ...RADIUS, step: 0.05, keyStep: 0.05,
    get: () => state.zR,
    set: (v) => { state.zR = v; },
    badge: () => `|z| = ${state.zR.toFixed(2)}`
  };
}

function paramSlider(c) {
  if (c.hasParamA) {
    const spec = c.paramSpec.a;
    return {
      titleKey: 'sliderZA', min: spec.min, max: spec.max, step: 0.05, keyStep: 0.05,
      get: () => state.zA,
      set: (v) => { state.zA = v; recomputeZ(); },
      badge: () => `a = ${state.zA.toFixed(2)}`
    };
  }
  if (c.hasParamW0) {
    const spec = c.paramSpec.w0;
    return {
      titleKey: 'sliderZW0', min: spec.min, max: spec.max, step: 0.05, keyStep: 0.05,
      get: () => state.zW0,
      set: (v) => { state.zW0 = v; recomputeZ(); },
      badge: () => `Ω₀ = ${state.zW0.toFixed(2)} rad`
    };
  }
  return null;
}

// ---- Cena -------------------------------------------------------------------
function circlePts(r, y = 0, segments = 72) {
  const pts = [];
  for (let i = 0; i <= segments; i++) pts.push(polarPt(r, (i / segments) * 2 * Math.PI, y));
  return pts;
}

function renderScene(scene, dt) {
  const frame = scene.begin(dt);
  if (!frame) return;
  const { pal, strokeScale } = frame;
  const c = calc();
  const rc = cutRadius();
  const showSurface = state.step >= 3;
  const cutOk = c.inROC(rc);
  const cutColor = cutOk ? pal.conv : pal.x2;

  // 1. Parede do fundo: domínio do tempo discreto
  if (state.layers.grid) {
    scene.polygon([
      { x: -WALL_HALF - 0.3, y: AMP_MIN, z: Z_WALL }, { x: WALL_HALF + 0.3, y: AMP_MIN, z: Z_WALL },
      { x: WALL_HALF + 0.3, y: AMP_MAX, z: Z_WALL }, { x: -WALL_HALF - 0.3, y: AMP_MAX, z: Z_WALL }
    ], pal.wallFill, pal.wallBorder, 1);
    scene.line({ x: -WALL_HALF - 0.3, y: 0, z: Z_WALL }, { x: WALL_HALF + 0.3, y: 0, z: Z_WALL }, pal.gridMain, 1.2 * strokeScale);
    scene.line({ x: xOfN(0), y: AMP_MIN, z: Z_WALL }, { x: xOfN(0), y: AMP_MAX, z: Z_WALL }, pal.gridMain, 1.2 * strokeScale);
  }

  // Hastes; a que estoura a parede é cortada e fica sem a bolinha
  const drawStems = (fn, color, width, radius, dx) => {
    for (let n = N_MIN; n <= N_MAX; n++) {
      const y = fn(n);
      if (!Number.isFinite(y) && !(Math.abs(y) === Infinity)) continue;
      const x = xOfN(n) + dx;
      const base = { x, y: 0, z: Z_WALL };
      if (y > AMP_MAX || y < AMP_MIN) {
        scene.line(base, { x, y: y > 0 ? AMP_MAX : AMP_MIN, z: Z_WALL }, color, width, [3, 3]);
      } else if (Math.abs(y) < 1e-9) {
        scene.dot(base, radius * 0.7, color);
      } else {
        scene.stem(base, { x, y, z: Z_WALL }, color, width, radius);
      }
    }
  };
  if (showSurface && Math.abs(rc - 1) > 1e-9) {
    // x[n]·r^{-n}: é desta sequência que se tira a DTFT no corte |z| = r
    drawStems((n) => c.fnSeq(n) * rc ** -n, cutColor, 1.5 * strokeScale, 2.6 * strokeScale, 0.13);
  }
  drawStems(c.fnSeq, pal.x1, 2.4 * strokeScale, 3.6 * strokeScale, 0);

  // 2. Piso: plano z com a ROC (anel) sombreada
  const rocLo = Math.max(0, c.roc.min);
  const rocHi = Math.min(R_MAX, c.roc.max);
  if (rocHi > rocLo) {
    const ring = circlePts(rocHi);
    // Anel = círculo externo + círculo interno percorrido ao contrário (deixa o furo)
    if (rocLo > 1e-9) ring.push(...circlePts(rocLo).reverse());
    scene.polygon(ring, pal.convFill, null, 0);
  }
  [c.roc.min, c.roc.max].filter((v) => Number.isFinite(v) && v > 1e-9 && v <= R_MAX).forEach((edge) => {
    scene.polyline(circlePts(edge), pal.conv, 1.6 * strokeScale, [5, 4]);
  });

  if (state.layers.grid) {
    for (let r = 0.5; r <= R_MAX + 1e-9; r += 0.5) {
      if (Math.abs(r - 1) < 1e-9) continue;
      scene.polyline(circlePts(r), pal.gridSub, 0.8);
    }
    scene.polyline(circlePts(R_MAX), pal.gridSub, 0.8);
    for (let k = 0; k < 12; k++) {
      if (k % 3 === 0) continue; // os eixos são desenhados à parte
      scene.line(floorPt(0, 0), polarPt(R_MAX, (k / 12) * 2 * Math.PI), pal.gridSub, 0.8);
    }
  }
  // Eixos Re e Im
  scene.line(floorPt(-R_MAX, 0), floorPt(R_MAX, 0), pal.axis, 1.6 * strokeScale);
  scene.line(floorPt(0, -R_MAX), floorPt(0, R_MAX), pal.axis, 1.6 * strokeScale);
  // Círculo unitário: a "fronteira" da estabilidade
  scene.polyline(circlePts(1), pal.axis, 2.0 * strokeScale);

  // 3. Superfície |X(z)| em malha polar
  if (showSurface) {
    scene.alpha = 0.5;
    for (let k = 0; k < 24; k++) {
      const omega = (k / 24) * 2 * Math.PI;
      const pts = [];
      for (let i = 1; i <= 22; i++) {
        const r = (i / 22) * R_MAX;
        pts.push(polarPt(r, omega, height(c.magPolar(r, omega))));
      }
      scene.polyline(pts, pal.gridMain, 1.0 * strokeScale);
    }
    for (let r = 0.2; r <= R_MAX + 1e-9; r += 0.2) {
      const pts = [];
      for (let i = 0; i <= 72; i++) {
        const omega = (i / 72) * 2 * Math.PI;
        pts.push(polarPt(r, omega, height(c.magPolar(r, omega))));
      }
      // Dentro da ROC a soma converge: esses anéis ganham a cor de destaque
      scene.polyline(pts, c.inROC(r) ? pal.conv : pal.gridMain, (c.inROC(r) ? 1.3 : 1.0) * strokeScale);
    }
    scene.alpha = 1.0;

    // 4. Corte em |z| = r: a curva |X(r·e^{jΩ})| enrolada no cilindro e a sua "cortina"
    const M = 180;
    const cutPts = [];
    for (let i = 0; i <= M; i++) {
      const omega = -Math.PI + (i / M) * 2 * Math.PI;
      cutPts.push(polarPt(rc, omega, height(c.magPolar(rc, omega))));
    }
    scene.alpha = 0.28;
    for (let i = 0; i < M; i += 3) {
      scene.line({ ...cutPts[i], y: 0 }, cutPts[i], cutColor, 1.0 * strokeScale);
    }
    scene.alpha = 1.0;
    scene.polyline(circlePts(rc), cutColor, 1.8 * strokeScale);
    scene.polyline(cutPts, cutColor, 3.0 * strokeScale, cutOk ? [] : [6, 4]);
  }

  // 5. Polos (×) e zeros (○)
  c.zeros.forEach((z) => {
    scene.ring(floorPt(z.re, z.im), 6.5 * strokeScale, pal.x1, 2.4 * strokeScale);
  });
  c.poles.forEach((p) => {
    if (Math.hypot(p.re, p.im) > R_MAX) return;
    const base = floorPt(p.re, p.im);
    if (showSurface) scene.line(base, { ...base, y: MAG_CAP * MAG_SCALE }, pal.x2, 1.4 * strokeScale, [3, 3]);
    scene.cross(base, 6.5 * strokeScale, pal.x2, 2.8 * strokeScale);
  });

  scene.end();

  // 6. Rótulos e leitura
  const rocMid = (rocLo + rocHi) / 2;
  const rocLabel = polarPt(rocMid, -Math.PI / 2, 0.05); // na frente, perto da câmera
  const unitLabel = polarPt(1, -Math.PI / 4, 0.05);
  const cutLabel = polarPt(rc, Math.PI, height(c.magPolar(rc, Math.PI)) + 0.35);
  const onUnit = Math.abs(rc - 1) < 1e-9;
  scene.labels([
    { slot: 'lbl-tau', latex: '\\operatorname{Re}\\{z\\}', ...floorPt(R_MAX + 0.15, 0, -0.15) },
    { slot: 'lbl-t', latex: '\\operatorname{Im}\\{z\\}', ...floorPt(0, R_MAX + 0.1, -0.15) },
    { slot: 'lbl-z', latex: '|X(z)|', ...floorPt(-R_MAX, 0, 2.0), visible: showSurface },
    { slot: 'lbl-x1', latex: `x[n] = ${c.latexTime}`, x: xOfN(7), y: 2.0, z: Z_WALL },
    { slot: 'lbl-x2', latex: `x[n]\\,${num(rc)}^{-n}`, x: xOfN(-3.5), y: 1.5, z: Z_WALL, visible: showSurface && !onUnit },
    { slot: 'lbl-conv', latex: '\\text{ROC}', ...rocLabel, visible: rocHi > rocLo },
    { slot: 'lbl-b1', latex: onUnit ? 'z = e^{j\\Omega}' : `|z| = ${num(rc)}`, ...cutLabel, visible: showSurface },
    { slot: 'lbl-b2', latex: '|z| = 1', ...unitLabel, visible: !(showSurface && Math.abs(rc - 1) < 0.15) }
  ]);
  scene.livePill(`X(z) = ${c.latexX} \\quad \\text{ROC: } ${c.latexROC}`);
}

// ---- Caderno ----------------------------------------------------------------
const notebook = {
  metric(isEn) {
    const c = calc();
    if (state.step === 1) return { label: isEn ? 'Complex variable' : 'Variável complexa', latex: 'z = r\\,e^{j\\Omega}' };
    if (state.step === 2) return { label: 'ROC', latex: c.latexROC };
    if (state.step === 3) {
      const rc = cutRadius();
      const verdict = c.inROC(rc)
        ? '\\in \\text{ROC}'
        : (isEn ? '\\notin \\text{ROC (diverges)}' : '\\notin \\text{ROC (diverge)}');
      return { label: isEn ? 'Cut' : 'Corte', latex: `|z| = ${num(rc)} \\; ${verdict}` };
    }
    const txt = STABILITY_TEXT[c.stability][isEn ? 'en' : 'pt'];
    return { label: isEn ? 'System h[n] = x[n]' : 'Sistema h[n] = x[n]', latex: `\\text{${txt}}` };
  },

  lines(isEn) {
    const c = calc();
    const rc = cutRadius();

    if (state.step === 1) {
      return [
        {
          label: isEn ? '1.1 Bilateral Z-Transform Definition:' : '1.1 Definição da Transformada Z Bilateral:',
          latex: 'X(z) = \\mathcal{Z}\\{x[n]\\} = \\sum_{n=-\\infty}^{+\\infty} x[n]\\,z^{-n}, \\quad z = r\\,e^{j\\Omega}'
        },
        {
          label: isEn ? '1.2 Discrete-Time Sequence:' : '1.2 Sequência no Tempo Discreto:',
          latex: `x[n] = ${c.latexTime}`
        },
        {
          label: isEn ? '1.3 The Z-Transform is a DTFT with a Convergence Factor:' : '1.3 A Transformada Z é uma DTFT com Fator de Convergência:',
          latex: 'X(r\\,e^{j\\Omega}) = \\sum_{n=-\\infty}^{+\\infty} \\left[x[n]\\,r^{-n}\\right] e^{-j\\Omega n} = \\text{DTFT}\\{x[n]\\,r^{-n}\\}'
        }
      ];
    }

    if (state.step === 2) {
      const rocRule = {
        causal: isEn
          ? '\\text{Right-sided sequence} \\implies \\text{ROC outside the outermost pole}'
          : '\\text{Sequência causal (lateral direita)} \\implies \\text{ROC fora do polo de maior módulo}',
        anticausal: isEn
          ? '\\text{Left-sided sequence} \\implies \\text{ROC inside the innermost pole}'
          : '\\text{Sequência anticausal (lateral esquerda)} \\implies \\text{ROC dentro do polo de menor módulo}',
        bilateral: isEn
          ? '\\text{Two-sided sequence} \\implies \\text{ROC is a ring between poles}'
          : '\\text{Sequência bilateral} \\implies \\text{ROC é um anel entre polos}',
        finite: isEn
          ? '\\text{Finite-length sequence} \\implies \\text{ROC is the whole } z \\text{-plane}'
          : '\\text{Sequência de duração finita} \\implies \\text{ROC é todo o plano } z'
      }[c.causality];
      return [
        {
          label: isEn ? '2.1 Transform Pair:' : '2.1 Par de Transformada:',
          latex: `${c.latexTime} \\;\\longleftrightarrow\\; X(z) = ${c.latexX}`
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
      const inside = c.inROC(rc);
      const value = c.magPolar(rc, 0);
      return [
        {
          label: isEn ? `3.1 Circular Cut at |z| = ${num(rc)}:` : `3.1 Corte Circular em |z| = ${num(rc)}:`,
          latex: `X(${num(rc)}\\,e^{j\\Omega}) = \\sum_{n=-\\infty}^{+\\infty} \\left[x[n]\\,${num(rc)}^{-n}\\right] e^{-j\\Omega n}`
        },
        {
          label: isEn ? '3.2 Does the Sum Converge Here?' : '3.2 A Soma Converge Aqui?',
          latex: inside
            ? `|z| = ${num(rc)} \\in \\text{ROC} \\implies |X(${num(rc)})| = ${Number.isFinite(value) ? value.toFixed(3) : '\\infty'}`
            : (isEn
              ? `|z| = ${num(rc)} \\notin \\text{ROC} \\implies x[n]\\,r^{-n} \\text{ is not absolutely summable}`
              : `|z| = ${num(rc)} \\notin \\text{ROC} \\implies x[n]\\,r^{-n} \\text{ não é absolutamente somável}`)
        },
        {
          label: isEn ? '3.3 Surface Reading:' : '3.3 Leitura da Superfície:',
          latex: isEn
            ? '\\text{poles: } |X| \\to \\infty, \\quad \\text{zeros: } |X| = 0'
            : '\\text{polos: } |X| \\to \\infty, \\quad \\text{zeros: } |X| = 0'
        },
        {
          label: isEn ? '3.4 One Turn Around the Circle = 2π (periodic cut):' : '3.4 Uma Volta no Círculo = 2π (corte periódico):',
          latex: 'X(r\\,e^{j(\\Omega + 2\\pi)}) = X(r\\,e^{j\\Omega})'
        }
      ];
    }

    // Passo 4
    const dtftLine = c.hasDTFT
      ? '|z| = 1 \\in \\text{ROC} \\implies X(e^{j\\Omega}) = X(z)\\big|_{z = e^{j\\Omega}}'
      : (c.stability === 'marginal'
        ? (isEn
          ? '\\text{Pole on the unit circle} \\implies \\text{the DTFT exists only with impulses } \\delta(\\Omega - \\Omega_0)'
          : '\\text{Polo sobre o círculo unitário} \\implies \\text{a DTFT só existe com impulsos } \\delta(\\Omega - \\Omega_0)')
        : (isEn
          ? '|z| = 1 \\notin \\text{ROC} \\implies \\text{the DTFT does not exist}'
          : '|z| = 1 \\notin \\text{ROC} \\implies \\text{a DTFT não existe}'));
    const stab = STABILITY_TEXT[c.stability][isEn ? 'en' : 'pt'];
    const sumAbs = '\\sum_{n=-\\infty}^{+\\infty} |h[n]|';
    const stabLine = c.stability === 'stable'
      ? `|z| = 1 \\in \\text{ROC} \\implies ${sumAbs} < \\infty \\implies \\textbf{${stab}}`
      : c.stability === 'marginal'
      ? (isEn
        ? `\\text{Pole on the unit circle} \\implies ${sumAbs} = \\infty \\implies \\textbf{${stab}} \\text{ (not BIBO)}`
        : `\\text{Polo sobre o círculo unitário} \\implies ${sumAbs} = \\infty \\implies \\textbf{${stab}} \\text{ (não é BIBO)}`)
      : `|z| = 1 \\notin \\text{ROC} \\implies ${sumAbs} = \\infty \\implies \\textbf{${stab}}`;
    return [
      {
        label: isEn ? '4.1 Bridge to the DTFT:' : '4.1 Ponte com a DTFT:',
        latex: dtftLine
      },
      {
        label: isEn ? '4.2 BIBO Stability of a System with h[n] = x[n]:' : '4.2 Estabilidade BIBO de um Sistema com h[n] = x[n]:',
        latex: stabLine
      },
      {
        label: isEn ? '4.3 Causal Systems Shortcut:' : '4.3 Atalho para Sistemas Causais:',
        latex: isEn
          ? '\\text{Causal and stable} \\iff |p_k| < 1 \\;\\; \\forall k'
          : '\\text{Causal e estável} \\iff |p_k| < 1 \\;\\; \\forall k'
      },
      {
        label: isEn
          ? '4.4 Bridge to Laplace (jω axis ↔ unit circle):'
          : '4.4 Ponte com Laplace (eixo jω ↔ círculo unitário):',
        latex: 'z = e^{sT}: \\quad \\operatorname{Re}\\{s\\} < 0 \\iff |z| < 1'
      },
      {
        label: isEn ? '4.5 Operational Properties:' : '4.5 Propriedades Operacionais:',
        latex: '\\mathcal{Z}\\{x[n - k]\\} = z^{-k}X(z), \\quad \\mathcal{Z}\\{a^n x[n]\\} = X\\!\\left(\\tfrac{z}{a}\\right), \\quad \\mathcal{Z}\\{x * h\\} = X(z)H(z)'
      }
    ];
  },

  table(container, isEn) {
    const header = document.createElement('div');
    header.className = 'grid grid-cols-3 gap-2 px-2 py-1.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[10px] font-bold text-sec uppercase tracking-wider mb-1';
    [isEn ? 'Sequence x[n]' : 'Sequência x[n]', 'X(z)', 'ROC'].forEach((text, i) => {
      const span = document.createElement('span');
      span.textContent = text;
      if (i === 2) span.className = 'text-right';
      header.appendChild(span);
    });
    container.appendChild(header);

    Object.keys(Z_PRESETS).forEach((key) => {
      const isCurrent = state.zPresetKey === key;
      // A linha do par ativo acompanha os parâmetros atuais; as demais usam os valores padrão
      const spec = Z_PRESETS[key].params;
      const data = isCurrent ? calc() : calculateZData(key, spec.a?.def, spec.w0?.def);
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
        selectZPreset(key);
        window.dispatchEvent(new CustomEvent('module-preset-changed'));
      });
      container.appendChild(btn);
    });
  }
};

// ---- Galeria ----------------------------------------------------------------
function renderGallery(gallery, isEn, refresh) {
  Object.entries(Z_PRESETS).forEach(([key, preset]) => {
    const isActive = state.zPresetKey === key;
    const data = isActive ? calc() : calculateZData(key, preset.params.a?.def, preset.params.w0?.def);

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
    badge.textContent = CAUSALITY_TEXT[data.causality][isEn ? 'en' : 'pt'];
    head.append(title, badge);

    const math = document.createElement('div');
    math.className = 'preset-math text-[10px] pt-0.5 truncate';
    renderMath(math, `${data.latexTime} \\leftrightarrow ${data.latexX}`, false);

    card.append(head, math);
    const choose = () => {
      selectZPreset(key);
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
export const zModule = registerModule({
  id: 'ztransform',
  hash: 'z',
  i18n: { title: 'modZTitle', sub: 'modZSub', stepPrefix: 'stepZ', regionsTitle: 'regionsZTitle' },
  zenLabel: 'X(z)',
  controls: [],
  hudTargets: [],          // as sequências vêm dos pares notáveis; não há editor livre
  defaultHudTarget: null,
  defaultSliderValue: 0,
  notebookEveryFrames: 6,
  cameraTarget: { x: 0, y: 0.7, z: 3.3 },

  slider() {
    if (state.step === 3) return radiusSlider();
    return paramSlider(calc()) || radiusSlider();
  },

  onEnter() {
    recomputeZ();
  },

  onStepEnter() {},

  tick(spd) {
    const spec = this.slider();
    // Vai e volta entre os extremos do slider: o polo atravessa o círculo unitário nos dois sentidos
    let next = spec.get() + sweepDir * 0.012 * spd * (spec.max - spec.min) / 4;
    if (next >= spec.max) { next = spec.max; sweepDir = -1; }
    if (next <= spec.min) { next = spec.min; sweepDir = 1; }
    spec.set(next);
  },

  renderScene,
  notebook,
  renderGallery
});
