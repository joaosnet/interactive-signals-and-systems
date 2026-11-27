// ============================================================================
// MODULES/CTFT.JS — Transformada de Fourier de tempo contínuo
// O slider principal muda de papel conforme o passo, o modo e o preset:
//   passo 4 → T₀ da ponte série→transformada;
//   modo de exploração ativo → parâmetro do modo (t₀, a, ω₀ ou banda W);
//   passo 3 ou sinal customizado → ω; exponenciais → decaimento a;
//   triângulo → base a; sinc → banda W; demais → largura τ₀.
// Modos de exploração (seletor "Explorar"): propriedades de deslocamento,
// escala e modulação, e a transformada inversa limitada em banda.
// ============================================================================

import { state } from '../state.js';
import { calculateCTFTData, renderMath } from '../math-engine.js';
import { BUILTIN_CTFT_PRESETS } from '../presets.js';
import {
  CTFT_MODE_SPECS, applyCTFTProperty, clampModeValue, bandEnergyFraction
} from '../ctft-extras.js';
import { registerModule } from './registry.js';
import { renderCTFTScene3D } from '../stage-3d.js';
import { ctftNotebookLines, ctftNotebookMetric, ctftNotebookTable } from '../notebook.js';
import { renderCTFTGallery } from '../ui.js';
import { langKey, pick, tx } from '../lang.js';

export function isCTFTDecayPreset(key = state.ctftPresetKey) {
  return key === 'exp' || key === 'bilateral_exp';
}

/** Presets salvos pelo usuário são calculados como 'custom_ctft' a partir da expressão. */
export function getCTFTCalcKey(key = state.ctftPresetKey) {
  return BUILTIN_CTFT_PRESETS[key] ? key : 'custom_ctft';
}

/**
 * Modo de exploração em vigor. A ponte de Khutoryansky (passo 4 ou preset
 * 'bridge') trabalha com o trem periódico, então ali os modos ficam suspensos.
 */
export function activeCTFTMode() {
  if (!CTFT_MODE_SPECS[state.ctftMode]) return 'none';
  if (state.step === 4 || state.ctftPresetKey === 'bridge') return 'none';
  return state.ctftMode;
}

export function ctftModeValue(mode = activeCTFTMode()) {
  return clampModeValue(mode, state.ctftModeValues[mode]);
}

export function recomputeCTFT() {
  const base = calculateCTFTData(
    getCTFTCalcKey(state.ctftPresetKey),
    state.ctftPulseWidth,
    state.ctftDecay,
    state.ctftBridgeT0,
    state.ctftExpr
  );
  const mode = activeCTFTMode();
  const derived = applyCTFTProperty(base, mode, ctftModeValue(mode));
  if (derived) {
    // Par transformado pela propriedade; `base` guarda o x(t) original para comparação
    state.ctftCalculated = {
      ...base,
      ...derived,
      base,
      bridgeHarmonics: base.bridgeHarmonics.map((bh) => ({
        ...bh,
        scaledDn: derived.fnMag(bh.wn),
        dnMagnitude: derived.fnMag(bh.wn) / base.T0,
        phase: derived.fnPhase(bh.wn)
      }))
    };
  } else if (mode === 'inverse') {
    state.ctftCalculated = { ...base, mode, value: ctftModeValue(mode) };
  } else {
    state.ctftCalculated = base;
  }
}

export function setCTFTMode(mode) {
  state.ctftMode = CTFT_MODE_SPECS[mode] && state.ctftMode !== mode ? mode : 'none';
  recomputeCTFT();
  syncModeUI(true);
  window.dispatchEvent(new CustomEvent('module-preset-changed'));
}

// ---- Seletor "Explorar" -----------------------------------------------------
const MODE_TITLES = {
  none: { pt: 'Transformada direta, sem propriedade aplicada', en: 'Forward transform, no property applied', es: 'Transformada directa, sin propiedad aplicada' },
  shift: { pt: 'Deslocamento no tempo: x(t − t₀)', en: 'Time shift: x(t − t₀)', es: 'Desplazamiento en el tiempo: x(t − t₀)' },
  scale: { pt: 'Escala no tempo: x(at)', en: 'Time scaling: x(at)', es: 'Escala en el tiempo: x(at)' },
  mod: { pt: 'Modulação: x(t)·cos(ω₀t)', en: 'Modulation: x(t)·cos(ω₀t)', es: 'Modulación: x(t)·cos(ω₀t)' },
  inverse: { pt: 'Transformada inversa limitada à banda |ω| ≤ W', en: 'Inverse transform limited to the band |ω| ≤ W', es: 'Transformada inversa limitada a la banda |ω| ≤ W' }
};

let modeUIBound = false;
let modeUIKey = '';

function bindModeUI() {
  if (modeUIBound) return;
  const buttons = document.querySelectorAll('.ctft-mode-btn');
  if (buttons.length === 0) return;
  modeUIBound = true;
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => setCTFTMode(btn.dataset.mode));
  });
}

function syncModeUI(force = false) {
  bindModeUI();
  const suspended = state.step === 4 || state.ctftPresetKey === 'bridge';
  const key = `${state.ctftMode}|${suspended}|${state.lang}`;
  if (!force && key === modeUIKey) return;
  modeUIKey = key;
  const lang = langKey();
  const label = document.getElementById('lbl-ctft-mode');
  if (label) label.textContent = lang === 'en' ? 'Explore:' : 'Explorar:';
  document.querySelectorAll('.ctft-mode-btn').forEach((btn) => {
    const mode = btn.dataset.mode;
    const isActive = (CTFT_MODE_SPECS[state.ctftMode] ? state.ctftMode : 'none') === mode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
    btn.title = MODE_TITLES[mode][lang];
    btn.setAttribute('aria-label', MODE_TITLES[mode][lang]);
    btn.disabled = suspended && mode !== 'none';
    btn.style.opacity = btn.disabled ? '0.45' : '';
  });
}

window.addEventListener('set-ctft-mode', (e) => {
  if (state.activeModule === 'ctft' && e.detail?.mode) setCTFTMode(e.detail.mode);
});

// ---- Caderno: linhas e tabela dos modos -------------------------------------
const num = (v, d = 2) => {
  const r = Math.round(v * 10 ** d) / 10 ** d;
  return Object.is(r, -0) ? '0' : String(r);
};

/** Linhas que entram no topo do caderno quando há um modo de exploração ativo. */
export function ctftModeNotebookLines(isEn) {
  const calc = state.ctftCalculated;
  const mode = activeCTFTMode();
  if (!calc || mode === 'none') return [];

  if (mode === 'inverse') {
    const W = calc.value;
    const pct = (100 * bandEnergyFraction(calc, W)).toFixed(1);
    return [
      {
        label: isEn ? 'I.1 Synthesis (inverse transform):' : tx('I.1 Síntese (transformada inversa):', 'I.1 Síntesis (transformada inversa):'),
        latex: 'x(t) = \\mathcal{F}^{-1}\\{X(\\omega)\\} = \\frac{1}{2\\pi}\\int_{-\\infty}^{+\\infty} X(\\omega)\\,e^{j\\omega t}\\,d\\omega'
      },
      {
        label: isEn ? `I.2 Using Only the Band |ω| ≤ ${num(W)} rad/s:` : tx(`I.2 Usando Só a Banda |ω| ≤ ${num(W)} rad/s:`, `I.2 Usando Solo la Banda |ω| ≤ ${num(W)} rad/s:`),
        latex: `x_W(t) = \\frac{1}{2\\pi}\\int_{-${num(W)}}^{${num(W)}} X(\\omega)\\,e^{j\\omega t}\\,d\\omega`
      },
      {
        label: isEn ? 'I.3 Energy Inside the Band (Parseval):' : tx('I.3 Energia Dentro da Banda (Parseval):', 'I.3 Energía Dentro de la Banda (Parseval):'),
        latex: `\\frac{1}{2\\pi}\\int_{-W}^{W} |X(\\omega)|^2\\,d\\omega = ${pct}\\%\\ \\text{${isEn ? 'of' : 'de'}}\\ E_x`
      },
      {
        label: isEn ? 'I.4 At a Jump of x(t):' : tx('I.4 Num Salto de x(t):', 'I.4 En un Salto de x(t):'),
        latex: isEn
          ? '\\text{midpoint value and} \\approx 9\\% \\text{ overshoot (Gibbs), for any finite } W'
          : tx('\\text{valor médio do salto e sobressinal de} \\approx 9\\% \\text{ (Gibbs), para qualquer } W \\text{ finito}', '\\text{valor medio del salto y sobreimpulso de} \\approx 9\\% \\text{ (Gibbs), para cualquier } W \\text{ finito}')
      }
    ];
  }

  const base = calc.base;
  const effectText = {
    shift: isEn
      ? '|Y(\\omega)| = |X(\\omega)|, \\qquad \\angle Y = \\angle X - \\omega t_0 \\;(\\text{linear phase})'
      : tx('|Y(\\omega)| = |X(\\omega)|, \\qquad \\angle Y = \\angle X - \\omega t_0 \\;(\\text{fase linear})', '|Y(\\omega)| = |X(\\omega)|, \\qquad \\angle Y = \\angle X - \\omega t_0 \\;(\\text{fase lineal})'),
    compress: isEn
      ? 'a > 1: \\text{ narrower in time} \\implies \\text{wider and lower in frequency}'
      : tx('a > 1: \\text{ mais estreito no tempo} \\implies \\text{mais largo e mais baixo na frequência}', 'a > 1: \\text{ más estrecho en el tiempo} \\implies \\text{más ancho y más bajo en frecuencia}'),
    expand: isEn
      ? 'a < 1: \\text{ wider in time} \\implies \\text{narrower and taller in frequency}'
      : tx('a < 1: \\text{ mais largo no tempo} \\implies \\text{mais estreito e mais alto na frequência}', 'a < 1: \\text{ más ancho en el tiempo} \\implies \\text{más estrecho y más alto en frecuencia}'),
    same: 'a = 1: \\; y(t) = x(t)',
    reflect: isEn
      ? 'a < 0: \\text{ time reversal} \\implies Y(\\omega) \\text{ mirrored: } |Y| \\text{ scaled, phase negated}'
      : tx('a < 0: \\text{ reflexão no tempo} \\implies Y(\\omega) \\text{ espelhado: } |Y| \\text{ escalado, fase invertida}', 'a < 0: \\text{ reflexión en el tiempo} \\implies Y(\\omega) \\text{ espejado: } |Y| \\text{ escalado, fase invertida}'),
    mod: isEn
      ? '\\text{two copies of } X \\text{ at } \\pm\\omega_0 \\text{ with half the height (AM)}'
      : tx('\\text{duas cópias de } X \\text{ em } \\pm\\omega_0 \\text{ com metade da altura (AM)}', '\\text{dos copias de } X \\text{ en } \\pm\\omega_0 \\text{ con la mitad de la altura (AM)}')
  }[calc.effect];
  const title = {
    shift: isEn ? 'P.1 Time-Shift Property:' : tx('P.1 Propriedade do Deslocamento no Tempo:', 'P.1 Propiedad del Desplazamiento en el Tiempo:'),
    scale: isEn ? 'P.1 Time-Scaling Property:' : tx('P.1 Propriedade da Escala no Tempo:', 'P.1 Propiedad de la Escala en el Tiempo:'),
    mod: isEn ? 'P.1 Modulation Property:' : tx('P.1 Propriedade da Modulação:', 'P.1 Propiedad de la Modulación:')
  }[mode];
  return [
    { label: title, latex: calc.ruleLatex },
    { label: isEn ? 'P.2 This Case:' : tx('P.2 Neste Caso:', 'P.2 En Este Caso:'), latex: calc.caseLatex },
    { label: isEn ? 'P.3 What Changes:' : tx('P.3 O Que Muda:', 'P.3 Qué Cambia:'), latex: effectText },
    {
      label: isEn ? 'P.4 Energy and Area of y(t):' : tx('P.4 Energia e Área de y(t):', 'P.4 Energía y Área de y(t):'),
      latex: `E_y = ${num(calc.energyTime, 3)}\\ (E_x = ${num(base.energyTime, 3)}), \\qquad Y(0) = ${num(calc.valX0, 3)}\\ (X(0) = ${num(base.valX0, 3)})`
    }
  ];
}

/** Tabela de propriedades: as quatro primeiras linhas ligam o modo correspondente no palco. */
export function renderCTFTPropertyTable(container, isEn) {
  const header = document.createElement('div');
  header.className = 'grid grid-cols-2 gap-2 px-2 py-1.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[10px] font-bold text-sec uppercase tracking-wider mt-2 mb-1';
  [isEn ? 'Property' : tx('Propriedade', 'Propiedad'), isEn ? 'Pair' : 'Par'].forEach((text, i) => {
    const span = document.createElement('span');
    span.textContent = text;
    if (i === 1) span.className = 'text-right';
    header.appendChild(span);
  });
  container.appendChild(header);

  const rows = [
    { mode: 'shift', pt: 'Deslocamento no tempo', en: 'Time shift', es: 'Desplazamiento en el tiempo', latex: 'x(t - t_0) \\leftrightarrow X(\\omega)e^{-j\\omega t_0}' },
    { mode: 'scale', pt: 'Escala no tempo', en: 'Time scaling', es: 'Escala en el tiempo', latex: 'x(at) \\leftrightarrow \\tfrac{1}{|a|}X(\\tfrac{\\omega}{a})' },
    { mode: 'mod', pt: 'Modulação', en: 'Modulation', es: 'Modulación', latex: 'x(t)\\cos\\omega_0 t \\leftrightarrow \\tfrac{1}{2}[X(\\omega \\mp \\omega_0)]' },
    { mode: 'inverse', pt: 'Transformada inversa', en: 'Inverse transform', es: 'Transformada inversa', latex: 'x(t) = \\tfrac{1}{2\\pi}\\int X(\\omega)e^{j\\omega t}d\\omega' },
    { pt: 'Linearidade', en: 'Linearity', es: 'Linealidad', latex: 'a x_1 + b x_2 \\leftrightarrow aX_1 + bX_2' },
    { pt: 'Dualidade', en: 'Duality', es: 'Dualidad', latex: 'X(t) \\leftrightarrow 2\\pi\\,x(-\\omega)' },
    { pt: 'Convolução', en: 'Convolution', es: 'Convolución', latex: 'x * h \\leftrightarrow X(\\omega)H(\\omega)' },
    { pt: 'Derivada', en: 'Differentiation', es: 'Derivada', latex: '\\tfrac{dx}{dt} \\leftrightarrow j\\omega X(\\omega)' },
    { pt: 'Deslocamento em frequência', en: 'Frequency shift', es: 'Desplazamiento en frecuencia', latex: 'x(t)e^{j\\omega_0 t} \\leftrightarrow X(\\omega - \\omega_0)' }
  ];
  const suspended = state.step === 4 || state.ctftPresetKey === 'bridge';
  rows.forEach((row) => {
    const clickable = Boolean(row.mode) && !suspended;
    const el = document.createElement(clickable ? 'button' : 'div');
    if (clickable) el.type = 'button';
    const isCurrent = Boolean(row.mode) && activeCTFTMode() === row.mode;
    el.className = `${clickable ? 'region-row ui-control' : ''} w-full text-left px-2 py-1.5 rounded-lg grid grid-cols-2 items-center gap-2 ${isCurrent ? 'active font-semibold' : ''}`;
    const name = document.createElement('span');
    name.className = 'text-[10px] font-mono-code truncate';
    name.textContent = `${clickable ? '▸ ' : ''}${pick(row)}`;
    const math = document.createElement('span');
    math.className = 'text-[10px] truncate text-right';
    renderMath(math, row.latex, false);
    el.append(name, math);
    if (clickable) el.addEventListener('click', () => setCTFTMode(row.mode));
    container.appendChild(el);
  });
}

// ---- Slider -----------------------------------------------------------------
const BRIDGE = { min: 2.0, max: 25.0 };
const FREQ = { min: -15.0, max: 15.0 };
const MODE_SLIDER_TITLE = {
  shift: 'sliderCTFTShift', scale: 'sliderCTFTScale', mod: 'sliderCTFTMod', inverse: 'sliderCTFTBand'
};
let sweepDir = 1;

function modeSlider(mode) {
  const spec = CTFT_MODE_SPECS[mode];
  return {
    titleKey: MODE_SLIDER_TITLE[mode], min: spec.min, max: spec.max, step: spec.step, keyStep: spec.step,
    get: () => ctftModeValue(mode),
    set: (v) => { state.ctftModeValues[mode] = clampModeValue(mode, v); recomputeCTFT(); },
    badge: () => `${spec.symbol} = ${ctftModeValue(mode).toFixed(2)}${spec.unit ? ` ${spec.unit}` : ''}`
  };
}

export const ctftModule = registerModule({
  id: 'ctft',
  hash: 'ctft',
  i18n: { title: 'modCTFTTitle', sub: 'modCTFTSub', stepPrefix: 'stepCTFT', regionsTitle: 'regionsCTFTTitle' },
  zenLabel: 'X(ω)',
  controls: ['ctft-mode-selector'],

  // Cena, caderno e galeria vivem em stage-3d.js, notebook.js e ui.js
  renderScene: (scene, dt) => renderCTFTScene3D(dt),
  notebook: {
    lines: () => ctftNotebookLines(),
    renderMetric: (el, isEn) => ctftNotebookMetric(el, isEn),
    table: (container, isEn) => ctftNotebookTable(container, isEn)
  },
  renderGallery: (gallery, isEn) => renderCTFTGallery(gallery, isEn),
  hudTargets: ['ctft'],
  defaultHudTarget: 'ctft',
  defaultSliderValue: 0,
  notebookEveryFrames: 6,

  slider() {
    syncModeUI();
    const isCustom = !BUILTIN_CTFT_PRESETS[state.ctftPresetKey];
    if (state.step === 4) {
      return {
        titleKey: 'sliderCTFTBridge', ...BRIDGE, step: 0.5, keyStep: 0.5,
        get: () => state.ctftBridgeT0,
        set: (v) => { state.ctftBridgeT0 = v; recomputeCTFT(); },
        badge: () => `T₀ = ${state.ctftBridgeT0.toFixed(1)} s`
      };
    }
    const mode = activeCTFTMode();
    if (mode !== 'none') return modeSlider(mode);
    if (state.step === 3 || isCustom) {
      return {
        titleKey: 'sliderCTFTFreq', ...FREQ, step: 0.2, keyStep: 0.2,
        get: () => state.t,
        set: (v) => { state.t = v; },
        badge: () => `ω = ${state.t.toFixed(2)} rad/s`
      };
    }
    if (isCTFTDecayPreset()) {
      return {
        titleKey: 'sliderCTFTDecay', min: 0.2, max: 4.0, step: 0.1, keyStep: 0.1,
        get: () => state.ctftDecay,
        set: (v) => { state.ctftDecay = v; recomputeCTFT(); },
        badge: () => `a = ${state.ctftDecay.toFixed(2)}`
      };
    }
    const isTri = state.ctftPresetKey === 'tri';
    const isSinc = state.ctftPresetKey === 'sinc';
    return {
      titleKey: isTri ? 'sliderCTFTBase' : (isSinc ? 'sliderCTFTSincBand' : 'sliderCTFTWidth'),
      min: 0.5, max: isTri ? 4.0 : 5.0, step: 0.25, keyStep: 0.25,
      get: () => state.ctftPulseWidth,
      set: (v) => { state.ctftPulseWidth = v; recomputeCTFT(); },
      badge: () => (isSinc
        ? `W = ${state.ctftPulseWidth.toFixed(2)} rad/s`
        : `${isTri ? 'a' : 'τ₀'} = ${state.ctftPulseWidth.toFixed(2)} s`)
    };
  },

  onEnter() {
    recomputeCTFT();
    syncModeUI(true);
  },

  onStepEnter() {
    // O passo 4 (ponte) suspende os modos; ao sair dele o modo escolhido volta a valer
    recomputeCTFT();
    syncModeUI(true);
  },

  tick(spd) {
    if (state.step === 4) {
      // Ponte viva: T₀ cresce até o fim do slider e recomeça
      state.ctftBridgeT0 = (state.ctftBridgeT0 || 4.0) + 0.055 * spd;
      if (state.ctftBridgeT0 > BRIDGE.max) state.ctftBridgeT0 = BRIDGE.min;
      recomputeCTFT();
      return;
    }
    const mode = activeCTFTMode();
    if (mode !== 'none') {
      // O parâmetro do modo vai e volta entre os extremos do slider
      const spec = CTFT_MODE_SPECS[mode];
      let next = ctftModeValue(mode) + sweepDir * 0.004 * spd * (spec.max - spec.min);
      if (next >= spec.max) { next = spec.max; sweepDir = -1; }
      if (next <= spec.min) { next = spec.min; sweepDir = 1; }
      // Escala: a faixa |a| < minAbs não existe; a varredura salta para o outro lado
      if (spec.minAbs && Math.abs(next) < spec.minAbs) next = sweepDir < 0 ? -spec.minAbs : spec.minAbs;
      state.ctftModeValues[mode] = next;
      recomputeCTFT();
      return;
    }
    // Sonda de frequência varrendo ω
    state.t += 0.06 * spd;
    if (state.t > 12.0) state.t = -12.0;
  }
});
