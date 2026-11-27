// ============================================================================
// MODULES/CTFT.JS — Transformada de Fourier de tempo contínuo
// O slider principal muda de papel conforme o passo e o preset:
//   passo 4 → T₀ da ponte série→transformada; passo 3 ou sinal customizado → ω;
//   exponenciais → decaimento a; triângulo → base a; demais → largura τ₀.
// ============================================================================

import { state } from '../state.js';
import { calculateCTFTData } from '../math-engine.js';
import { BUILTIN_CTFT_PRESETS } from '../presets.js';
import { registerModule } from './registry.js';

export function isCTFTDecayPreset(key = state.ctftPresetKey) {
  return key === 'exp' || key === 'bilateral_exp';
}

/** Presets salvos pelo usuário são calculados como 'custom_ctft' a partir da expressão. */
export function getCTFTCalcKey(key = state.ctftPresetKey) {
  return BUILTIN_CTFT_PRESETS[key] ? key : 'custom_ctft';
}

export function recomputeCTFT() {
  state.ctftCalculated = calculateCTFTData(
    getCTFTCalcKey(state.ctftPresetKey),
    state.ctftPulseWidth,
    state.ctftDecay,
    state.ctftBridgeT0,
    state.ctftExpr
  );
}

const BRIDGE = { min: 2.0, max: 25.0 };
const FREQ = { min: -15.0, max: 15.0 };

export const ctftModule = registerModule({
  id: 'ctft',
  hash: 'ctft',
  i18n: { title: 'modCTFTTitle', sub: 'modCTFTSub', stepPrefix: 'stepCTFT', regionsTitle: 'regionsCTFTTitle' },
  zenLabel: 'X(ω)',
  controls: [],
  hudTargets: ['ctft'],
  defaultHudTarget: 'ctft',
  defaultSliderValue: 0,
  notebookEveryFrames: 6,

  slider() {
    const isCustom = !BUILTIN_CTFT_PRESETS[state.ctftPresetKey];
    if (state.step === 4) {
      return {
        titleKey: 'sliderCTFTBridge', ...BRIDGE, step: 0.5, keyStep: 0.5,
        get: () => state.ctftBridgeT0,
        set: (v) => { state.ctftBridgeT0 = v; recomputeCTFT(); },
        badge: () => `T₀ = ${state.ctftBridgeT0.toFixed(1)} s`
      };
    }
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
    return {
      titleKey: isTri ? 'sliderCTFTBase' : 'sliderCTFTWidth',
      min: 0.5, max: isTri ? 4.0 : 5.0, step: 0.25, keyStep: 0.25,
      get: () => state.ctftPulseWidth,
      set: (v) => { state.ctftPulseWidth = v; recomputeCTFT(); },
      badge: () => `${isTri ? 'a' : 'τ₀'} = ${state.ctftPulseWidth.toFixed(2)} s`
    };
  },

  onEnter() {
    recomputeCTFT();
  },

  onStepEnter() {},

  tick(spd) {
    if (state.step === 4) {
      // Ponte viva: T₀ cresce até o fim do slider e recomeça
      state.ctftBridgeT0 = (state.ctftBridgeT0 || 4.0) + 0.055 * spd;
      if (state.ctftBridgeT0 > BRIDGE.max) state.ctftBridgeT0 = BRIDGE.min;
      recomputeCTFT();
    } else {
      // Sonda de frequência varrendo ω
      state.t += 0.06 * spd;
      if (state.t > 12.0) state.t = -12.0;
    }
  }
});
