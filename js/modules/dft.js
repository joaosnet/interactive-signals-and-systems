// ============================================================================
// MODULES/DFT.JS — Transformada Discreta de Fourier e FFT
// ----------------------------------------------------------------------------
// Palco: dois trilhos de N hastes alinhadas — x[n] ao fundo e |X[k]| na frente.
// Passos: 1 definição, 2 a DFT como amostras da DTFT (resolução e vazamento),
//         3 leitura de um bin k (frequência, base cossenoidal, frequências
//         negativas), 4 FFT: o diagrama de borboletas entre os dois trilhos e
//         a comparação de custo N² × (N/2)·log₂N.
// Módulo totalmente plugável: cena, caderno e galeria vivem aqui.
// ============================================================================

import { state } from '../state.js';
import { renderMath } from '../math-engine.js';
import {
  DFT_PRESETS, DFT_MIN_BITS, DFT_MAX_BITS, DFT_WINDOWS, DFT_WINDOW_KEYS, calculateDFTData, bitReverse
} from '../dft-engine.js';
import { registerModule } from './registry.js';
import { AUX_SLIDER_ROW, syncAuxSlider } from './aux-slider.js';
import { renderSequenceEditor } from './seq-editor.js';

// ---- Geometria do palco -----------------------------------------------------
const X_HALF = 4.5;
const Z_T = 0.4;          // trilho do tempo (fundo; a câmera fica em +z)
const Z_S = 3.4;          // trilho do espectro nos passos 1 a 3
const Z_S_FFT = 6.6;      // no passo 4 o espectro vai para a frente e abre espaço às borboletas
const Z_BF0 = 1.3;        // primeira coluna de nós da FFT
const Z_BF1 = 5.7;        // última coluna de nós da FFT
const AMP_T = 1.4;
const AMP_S = 2.0;

let sweepDir = 1;
let tickAcc = 0;

export function recomputeDFT() {
  state.dftCalculated = calculateDFTData(state.dftPresetKey, state.dftBits, state.dftWindow, state.dftCustom);
  state.dftWindow = state.dftCalculated.windowKey;
  const d = state.dftCalculated;
  state.dftPresetKey = d.presetKey;
  state.dftBits = d.bits;
  state.dftK = Math.max(0, Math.min(d.N - 1, Math.round(state.dftK)));
  return d;
}

function calc() {
  return state.dftCalculated || recomputeDFT();
}

export function selectDFTPreset(key) {
  if (!DFT_PRESETS[key] && key !== 'custom') return;
  state.dftPresetKey = key;
  recomputeDFT();
}

// ---- Formatação -------------------------------------------------------------
const num = (v, d = 2) => {
  const r = Math.round(v * 10 ** d) / 10 ** d;
  return Object.is(r, -0) ? '0' : String(r);
};
const thousands = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');

function complexLatex(re, im) {
  if (Math.abs(im) < 5e-3) return num(re);
  if (Math.abs(re) < 5e-3) return `${im < 0 ? '-' : ''}j${num(Math.abs(im))}`;
  return `${num(re)} ${im < 0 ? '-' : '+'} j${num(Math.abs(im))}`;
}

// ---- Slider -----------------------------------------------------------------
function sizeSlider() {
  return {
    // Em sinais do aluno, N não fica menor que o número de amostras digitadas
    titleKey: 'sliderDftN', min: calc().minBits, max: DFT_MAX_BITS, step: 1, keyStep: 1,
    get: () => state.dftBits,
    set: (v) => { state.dftBits = Math.round(v); recomputeDFT(); },
    badge: () => `N = ${2 ** state.dftBits}`
  };
}

function binSlider(d) {
  return {
    titleKey: 'sliderDftK', min: 0, max: d.N - 1, step: 1, keyStep: 1,
    get: () => state.dftK,
    set: (v) => { state.dftK = Math.max(0, Math.min(d.N - 1, Math.round(v))); },
    badge: () => `k = ${state.dftK}`
  };
}

/** Janela aplicada a x[n]: três posições no slider auxiliar. */
function windowSlider() {
  const isEn = state.lang === 'en';
  return {
    key: 'dft-window', titleKey: 'sliderDftWindow', min: 0, max: DFT_WINDOW_KEYS.length - 1, step: 1,
    get: () => Math.max(0, DFT_WINDOW_KEYS.indexOf(state.dftWindow)),
    set: (v) => { state.dftWindow = DFT_WINDOW_KEYS[Math.round(v)] || 'rect'; recomputeDFT(); },
    badge: () => (isEn ? DFT_WINDOWS[state.dftWindow].titleEn : DFT_WINDOWS[state.dftWindow].title)
  };
}

// ---- Cena -------------------------------------------------------------------
function renderScene(scene, dt) {
  const frame = scene.begin(dt);
  if (!frame) return;
  const { pal, strokeScale } = frame;
  const d = calc();
  const step = state.step;
  const N = d.N;
  const k = state.dftK;
  const zS = step === 4 ? Z_S_FFT : Z_S;
  const xOf = (i) => -X_HALF + ((i + 0.5) / N) * 2 * X_HALF;
  const tScale = AMP_T / Math.max(1, d.maxAbsRaw);
  const sScale = AMP_S / Math.max(d.peakMag, 1e-9);
  const thin = N > 32 ? 0.7 : 1;                  // hastes mais finas quando há muitas
  const radius = (N > 32 ? 2.2 : N > 16 ? 2.8 : 3.6) * strokeScale;

  // 1. Piso: uma linha por índice (até N = 32) e a marca de Nyquist em k = N/2
  if (state.layers.grid && N <= 32 && step !== 4) {
    for (let i = 0; i < N; i++) {
      scene.line({ x: xOf(i), y: 0, z: Z_T }, { x: xOf(i), y: 0, z: zS }, pal.gridSub, 0.7);
    }
  }
  scene.line({ x: xOf(N / 2), y: 0, z: zS - 0.5 }, { x: xOf(N / 2), y: 0, z: zS + 0.5 }, pal.gridMain, 1.4 * strokeScale, [4, 3]);

  // 2. Trilho do tempo
  scene.line({ x: -X_HALF - 0.3, y: 0, z: Z_T }, { x: X_HALF + 0.3, y: 0, z: Z_T }, pal.axis, 1.4 * strokeScale);
  if (step === 3) {
    // A "régua" do bin k: cos(2πkn/N), a frequência com que x[n] é comparado
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const t = (i / 240) * N - 0.5;
      pts.push({ x: -X_HALF + ((t + 0.5) / N) * 2 * X_HALF, y: Math.cos((2 * Math.PI * k * t) / N) * tScale, z: Z_T });
    }
    scene.alpha = 0.55;
    scene.polyline(pts, pal.x2, 1.6 * strokeScale, [5, 4]);
    scene.alpha = 1.0;
  }
  if (d.windowKey !== 'rect') {
    // Com janela: o x[n] original fica apagado atrás e a forma da janela aparece tracejada
    scene.alpha = 0.3;
    for (let n = 0; n < N; n++) {
      const base = { x: xOf(n), y: 0, z: Z_T };
      if (Math.abs(d.rawX[n]) > 1e-9) scene.line(base, { ...base, y: d.rawX[n] * tScale }, pal.x1, 1.6 * thin * strokeScale);
    }
    scene.alpha = 0.7;
    scene.polyline(d.window.map((wv, n) => ({ x: xOf(n), y: wv * tScale * Math.max(1, d.maxAbsRaw), z: Z_T })), pal.prod, 1.6 * strokeScale, [5, 4]);
    scene.alpha = 1.0;
  }
  for (let n = 0; n < N; n++) {
    const base = { x: xOf(n), y: 0, z: Z_T };
    if (Math.abs(d.x[n]) < 1e-9) scene.dot(base, radius * 0.7, pal.x1);
    else scene.stem(base, { ...base, y: d.x[n] * tScale }, pal.x1, 2.2 * thin * strokeScale, radius);
  }

  // 3. Passo 4: diagrama de borboletas da FFT entre os dois trilhos
  if (step === 4) {
    const zStage = (s) => Z_BF0 + (s / d.stages) * (Z_BF1 - Z_BF0);
    const dense = N > 16;
    // Reordenação por inversão de bits: x[n] entra na posição bitReverse(n)
    scene.alpha = dense ? 0.25 : 0.45;
    for (let n = 0; n < N; n++) {
      scene.line({ x: xOf(n), y: 0, z: Z_T }, { x: xOf(bitReverse(n, d.bits)), y: 0, z: Z_BF0 }, pal.x1, 1.0 * strokeScale);
    }
    for (let s = 0; s < d.stages; s++) {
      const half = 2 ** s;
      const span = 2 * half;
      const z0 = zStage(s);
      const z1 = zStage(s + 1);
      for (let i = 0; i < N; i++) {
        const partner = i % span < half ? i + half : i - half;
        scene.alpha = dense ? 0.3 : 0.6;
        scene.line({ x: xOf(i), y: 0, z: z0 }, { x: xOf(i), y: 0, z: z1 }, pal.gridMain, 1.0 * strokeScale);
        scene.alpha = dense ? 0.3 : 0.7;
        scene.line({ x: xOf(i), y: 0, z: z0 }, { x: xOf(partner), y: 0, z: z1 }, pal.prod, 1.1 * strokeScale);
      }
    }
    scene.alpha = 1.0;
    if (!dense) {
      for (let s = 0; s <= d.stages; s++) {
        for (let i = 0; i < N; i++) scene.dot({ x: xOf(i), y: 0, z: zStage(s) }, 2.6 * strokeScale, pal.prod);
      }
    }
    for (let i = 0; i < N; i++) {
      scene.line({ x: xOf(i), y: 0, z: Z_BF1 }, { x: xOf(i), y: 0, z: zS }, pal.conv, 0.9 * strokeScale);
    }
  }

  // 4. Trilho do espectro: envoltória (DTFT da janela) e as N amostras |X[k]|
  scene.line({ x: -X_HALF - 0.3, y: 0, z: zS }, { x: X_HALF + 0.3, y: 0, z: zS }, pal.axis, 1.4 * strokeScale);
  if (step === 2 || step === 3) {
    const pts = [];
    const M = 320;
    for (let i = 0; i <= M; i++) {
      const pos = (i / M) * N - 0.5;                 // posição contínua no eixo k
      const m = d.envelope((2 * Math.PI * pos) / N);
      pts.push({ x: -X_HALF + ((pos + 0.5) / N) * 2 * X_HALF, y: Math.min(m * sScale, AMP_S * 1.15), z: zS });
    }
    scene.alpha = 0.45;
    scene.polygon([{ ...pts[0], y: 0 }, ...pts, { ...pts[pts.length - 1], y: 0 }], pal.convFill, null, 0);
    scene.polyline(pts, pal.conv, 1.4 * strokeScale);
    scene.alpha = 1.0;
  }
  for (let i = 0; i < N; i++) {
    const base = { x: xOf(i), y: 0, z: zS };
    const picked = step === 3 && (i === k || (k !== 0 && i === N - k));
    const color = step === 3 && i === k ? pal.x2 : pal.conv;
    if (d.mag[i] < 1e-9) scene.dot(base, radius * 0.7, color);
    else scene.stem(base, { ...base, y: d.mag[i] * sScale }, color, (picked ? 3.2 : 2.2) * thin * strokeScale, picked ? radius * 1.35 : radius);
  }

  scene.end();

  // 5. Rótulos e leitura
  const left = -X_HALF - 0.6;
  scene.labels([
    { slot: 'lbl-x1', latex: d.windowKey === 'rect' ? `x[n] = ${d.latexTime}` : `x[n]\\,w[n],\\; x[n] = ${d.latexTime}`, x: -X_HALF * 0.55, y: AMP_T + 0.55, z: Z_T },
    { slot: 'lbl-tau', latex: 'n', x: X_HALF + 0.55, y: -0.1, z: Z_T },
    { slot: 'lbl-conv', latex: '|X[k]|', x: left, y: 0.9, z: zS },
    { slot: 'lbl-t', latex: 'k', x: X_HALF + 0.55, y: -0.1, z: zS },
    { slot: 'lbl-z', latex: `k = ${N / 2}\\;(\\Omega = \\pi)`, x: xOf(N / 2), y: -0.4, z: zS + 0.5 },
    { slot: 'lbl-x2', latex: `\\cos\\!\\left(2\\pi \\cdot ${k}\\,\\tfrac{n}{${N}}\\right)`, x: X_HALF * 0.6, y: AMP_T + 0.55, z: Z_T, visible: step === 3 },
    { slot: 'lbl-b2', latex: `|X[${k}]| = ${num(d.mag[k])}`, x: xOf(k), y: d.mag[k] * sScale + 0.45, z: zS, visible: step === 3 },
    {
      slot: 'lbl-b1',
      latex: `\\log_2 ${N} = ${d.stages}`,
      x: left, y: 0.3, z: (Z_BF0 + Z_BF1) / 2, visible: step === 4
    }
  ]);
  scene.livePill(step === 4
    ? `N^2 = ${thousands(d.naiveMults)} \\quad \\text{vs.} \\quad \\tfrac{N}{2}\\log_2 N = ${thousands(d.butterflies)}`
    : `X[k] = \\sum_{n=0}^{${N - 1}} x[n]\\,e^{-j2\\pi kn/${N}}`);
}

// ---- Caderno ----------------------------------------------------------------
const notebook = {
  metric(isEn) {
    const d = calc();
    if (state.step === 1) return { label: isEn ? 'Samples' : 'Amostras', latex: `N = ${d.N}` };
    if (state.step === 2) return { label: isEn ? 'Resolution' : 'Resolução', latex: `\\Delta\\Omega = ${d.resolutionLatex}` };
    if (state.step === 3) return { label: isEn ? 'Bin' : 'Bin', latex: `|X[${state.dftK}]| = ${num(d.mag[state.dftK], 3)}` };
    return { label: isEn ? 'FFT speedup' : 'Ganho da FFT', latex: `\\times\\,${num(d.speedup, 1)}` };
  },

  lines(isEn) {
    const d = calc();
    const N = d.N;
    const k = state.dftK;

    if (state.step === 1) {
      return [
        {
          label: isEn ? '1.1 Analysis (DFT):' : '1.1 Análise (DFT):',
          latex: 'X[k] = \\sum_{n=0}^{N-1} x[n]\\,e^{-j2\\pi kn/N}, \\quad k = 0, \\ldots, N-1'
        },
        {
          label: isEn ? '1.2 Synthesis (inverse DFT):' : '1.2 Síntese (DFT inversa):',
          latex: 'x[n] = \\frac{1}{N}\\sum_{k=0}^{N-1} X[k]\\,e^{j2\\pi kn/N}'
        },
        {
          label: isEn ? '1.3 Sequence:' : '1.3 Sequência:',
          latex: `x[n] = ${d.latexTime}, \\quad N = ${N}${d.zeroPadded > 0 ? `\\;(${d.zeroPadded}\\ \\text{${isEn ? 'zeros appended' : 'zeros acrescentados'}})` : ''}`
        },
        {
          label: isEn ? '1.4 Finite on Both Sides (what a computer can store):' : '1.4 Finita nos Dois Lados (o que um computador consegue guardar):',
          latex: isEn
            ? `${N} \\text{ time samples} \\;\\longleftrightarrow\\; ${N} \\text{ frequency samples}`
            : `${N} \\text{ amostras no tempo} \\;\\longleftrightarrow\\; ${N} \\text{ amostras na frequência}`
        }
      ];
    }

    if (state.step === 2) {
      let window;
      if (d.leaks === true) {
        window = isEn
          ? `${num(d.cycles)} \\text{ cycles in the window (not an integer)} \\implies \\textbf{leakage}`
          : `${num(d.cycles)} \\text{ ciclos na janela (não inteiro)} \\implies \\textbf{vazamento}`;
      } else if (d.leaks === false) {
        window = isEn
          ? `${num(d.cycles)} \\text{ whole cycles in the window} \\implies \\text{clean lines}`
          : `${num(d.cycles)} \\text{ ciclos inteiros na janela} \\implies \\text{linhas limpas}`;
      } else {
        window = isEn
          ? '\\text{the DFT sees } x[n] \\text{ repeated with period } N'
          : '\\text{a DFT enxerga } x[n] \\text{ repetido com período } N';
      }
      const winInfo = DFT_WINDOWS[d.windowKey];
      const windowLines = [
        {
          label: isEn ? `2.5 Window: ${winInfo.titleEn} (try the second slider):` : `2.5 Janela: ${winInfo.title} (experimente o segundo slider):`,
          latex: winInfo.latex
        },
        {
          label: isEn ? '2.6 Energy Outside the Main Lobe:' : '2.6 Energia Fora do Lóbulo Principal:',
          latex: `${(100 * d.spread).toFixed(2)}\\% \\quad (${isEn ? '\\text{main lobe: } \\pm' : '\\text{lóbulo principal: } \\pm'}${winInfo.mainHalf}\\ \\text{bin${winInfo.mainHalf > 1 ? 's' : ''}})`
        }
      ];
      return [
        {
          label: isEn ? '2.1 The DFT Samples the DTFT:' : '2.1 A DFT Amostra a DTFT:',
          latex: 'X[k] = X(e^{j\\Omega})\\big|_{\\Omega = 2\\pi k/N}'
        },
        {
          label: isEn ? '2.2 Frequency Resolution:' : '2.2 Resolução em Frequência:',
          latex: `\\Delta\\Omega = ${d.resolutionLatex}\\ \\text{rad}, \\qquad \\Delta f = \\tfrac{f_s}{${N}}`
        },
        { label: isEn ? '2.3 The Window Matters:' : '2.3 A Janela Importa:', latex: window },
        {
          label: isEn ? '2.4 Parseval:' : '2.4 Parseval:',
          latex: `\\sum_n |x[n]|^2 = \\frac{1}{N}\\sum_k |X[k]|^2 = ${num(d.energyTime, 3)}`
        },
        ...windowLines
      ];
    }

    if (state.step === 3) {
      const ph = d.phase[k];
      const lines = [
        {
          label: isEn ? `3.1 Bin k = ${k}:` : `3.1 Bin k = ${k}:`,
          latex: `X[${k}] = ${complexLatex(d.re[k], d.im[k])}`
        },
        {
          label: isEn ? '3.2 Magnitude and Phase:' : '3.2 Magnitude e Fase:',
          latex: `|X[${k}]| = ${num(d.mag[k], 3)}, \\qquad \\angle X[${k}] = ${Number.isNaN(ph) ? (isEn ? '\\text{undefined}' : '\\text{indefinida}') : `${num(ph, 3)}\\ \\text{rad}`}`
        },
        {
          label: isEn ? '3.3 Frequency of This Bin:' : '3.3 Frequência Deste Bin:',
          latex: `\\Omega_{${k}} = \\tfrac{2\\pi \\cdot ${k}}{${N}} = ${num(d.binOmega(k), 3)}\\ \\text{rad}, \\qquad f_{${k}} = \\tfrac{${k}}{${N}}\\,f_s`
        }
      ];
      if (k > N / 2) {
        lines.push({
          label: isEn ? '3.4 Upper Half = Negative Frequencies:' : '3.4 Metade Superior = Frequências Negativas:',
          latex: `k = ${k} \\equiv ${k} - ${N} = ${k - N}, \\qquad X[${k}] = X^*[${N - k}]`
        });
      } else if (k === N / 2) {
        lines.push({
          label: isEn ? '3.4 Nyquist Bin (fastest oscillation):' : '3.4 Bin de Nyquist (oscilação mais rápida):',
          latex: `\\Omega_{${k}} = \\pi, \\qquad e^{j\\pi n} = (-1)^n, \\qquad f = \\tfrac{f_s}{2}`
        });
      } else {
        lines.push({
          label: isEn ? '3.4 Conjugate Symmetry (real x[n]):' : '3.4 Simetria Conjugada (x[n] real):',
          latex: k === 0
            ? (isEn ? 'X[0] = \\sum_n x[n] \\quad (\\text{DC value})' : 'X[0] = \\sum_n x[n] \\quad (\\text{valor médio} \\times N)')
            : `X[${N - k}] = X^*[${k}] \\implies |X[${N - k}]| = |X[${k}]|`
        });
      }
      return lines;
    }

    // Passo 4
    return [
      {
        label: isEn ? '4.1 Direct Sum:' : '4.1 Soma Direta:',
        latex: `N^2 = ${N}^2 = ${thousands(d.naiveMults)}\\ ${isEn ? '\\text{complex products}' : '\\text{produtos complexos}'}`
      },
      {
        label: isEn ? '4.2 Radix-2 FFT (counted while running):' : '4.2 FFT Radix-2 (contado na execução):',
        latex: `\\tfrac{N}{2}\\log_2 N = ${N / 2} \\cdot ${d.stages} = ${thousands(d.butterflies)}\\ ${isEn ? '\\text{butterflies}' : '\\text{borboletas}'}`
      },
      {
        label: isEn ? '4.3 Speedup (and at N = 1024):' : '4.3 Ganho (e em N = 1024):',
        latex: `\\times\\,${num(d.speedup, 1)} \\qquad \\left(1\\,048\\,576 \\;\\text{vs.}\\; 5\\,120 \\implies \\times\\,204.8\\right)`
      },
      {
        label: isEn ? '4.4 The Butterfly (split into even and odd samples):' : '4.4 A Borboleta (divide em amostras pares e ímpares):',
        latex: 'X[k] = E[k] + W_N^k\\,O[k], \\quad X[k + \\tfrac{N}{2}] = E[k] - W_N^k\\,O[k], \\quad W_N = e^{-j2\\pi/N}'
      },
      {
        label: isEn ? '4.5 Check: Same Answer as the Direct Sum:' : '4.5 Conferência: Mesma Resposta da Soma Direta:',
        latex: `\\max_k \\left|X_{\\text{FFT}}[k] - X_{\\text{DFT}}[k]\\right| = ${d.fftError < 1e-15 ? '0' : d.fftError.toExponential(1).replace('e', '\\times 10^{') + '}'}`
      }
    ];
  },

  table(container, isEn) {
    const d = calc();
    const header = document.createElement('div');
    header.className = 'grid grid-cols-3 gap-2 px-2 py-1.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[10px] font-bold text-sec uppercase tracking-wider mb-1';
    ['k', isEn ? 'Ω (rad)' : 'Ω (rad)', '|X[k]|'].forEach((text, i) => {
      const span = document.createElement('span');
      span.textContent = text;
      if (i === 2) span.className = 'text-right';
      header.appendChild(span);
    });
    container.appendChild(header);

    // Metade inferior (0 a N/2): a superior é o espelho conjugado
    const last = Math.min(d.N / 2, 16);
    for (let k = 0; k <= last; k++) {
      const isCurrent = state.dftK === k;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `region-row w-full text-left px-2 py-1.5 rounded-lg grid grid-cols-3 items-center gap-2 ui-control ${isCurrent ? 'active font-semibold' : ''}`;
      const cells = [`k = ${k}`, num(d.binOmega(k), 3), num(d.mag[k], 3)].map((latex, i) => {
        const span = document.createElement('span');
        span.className = `text-[10px] truncate ${i === 2 ? 'text-right' : ''}`;
        renderMath(span, latex, false);
        return span;
      });
      btn.append(...cells);
      btn.addEventListener('click', () => {
        state.dftK = k;
        window.dispatchEvent(new CustomEvent('module-preset-changed'));
      });
      container.appendChild(btn);
    }
  }
};

// ---- Galeria ----------------------------------------------------------------
function renderGallery(gallery, isEn, refresh) {
  renderSequenceEditor(gallery, {
    isEn,
    title: isEn ? 'Type your own samples (from n = 0)' : 'Digite as suas amostras (a partir de n = 0)',
    active: state.dftPresetKey === 'custom',
    fields: [{ id: 'x', label: 'x[n]:', values: state.dftCustom, hasStart: false, maxLen: 64 }],
    onApply: (result) => {
      state.dftCustom = result.x.values;
      selectDFTPreset('custom');
      refresh();
    }
  });

  Object.entries(DFT_PRESETS).forEach(([key, preset]) => {
    const isActive = state.dftPresetKey === key;

    const card = document.createElement('div');
    card.className = `preset-pill rounded-lg p-2 cursor-pointer flex flex-col justify-between gap-1 relative ${isActive ? 'active' : ''}`;
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.setAttribute('aria-pressed', String(isActive));

    const title = document.createElement('span');
    title.className = 'text-[11px] font-bold truncate text-primary';
    title.textContent = isEn ? preset.titleEn : preset.title;
    const idea = document.createElement('span');
    idea.className = 'text-[9px] font-semibold truncate';
    idea.style.color = 'var(--c-conv)';
    idea.textContent = isEn ? preset.ideaEn : preset.idea;
    const math = document.createElement('div');
    math.className = 'preset-math text-[10px] pt-0.5 truncate';
    renderMath(math, `x[n] = ${preset.latex()}`, false);

    card.append(title, idea, math);
    const choose = () => {
      selectDFTPreset(key);
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
export const dftModule = registerModule({
  id: 'dft',
  hash: 'dft',
  i18n: { title: 'modDftTitle', sub: 'modDftSub', stepPrefix: 'stepDft', regionsTitle: 'regionsDftTitle' },
  zenLabel: 'X[k]',
  controls: [AUX_SLIDER_ROW],
  hudTargets: [],          // os sinais vêm dos exemplos; não há editor livre
  defaultHudTarget: null,
  defaultSliderValue: 0,
  notebookEveryFrames: 6,
  cameraTarget: { x: 0, y: 0.6, z: 3.3 },

  slider() {
    syncAuxSlider(windowSlider());
    return state.step === 3 ? binSlider(calc()) : sizeSlider();
  },

  onEnter() {
    recomputeDFT();
  },

  onStepEnter() {},

  tick(spd) {
    const spec = this.slider();
    // Sliders inteiros: anda um passo por vez, em vai e volta
    tickAcc += 0.02 * spd * (state.step === 3 ? 1.6 : 0.5);
    if (tickAcc < 1) return;
    tickAcc = 0;
    let next = spec.get() + sweepDir;
    if (next >= spec.max) { next = spec.max; sweepDir = -1; }
    if (next <= spec.min) { next = spec.min; sweepDir = 1; }
    spec.set(next);
  },

  renderScene,
  notebook,
  renderGallery
});
