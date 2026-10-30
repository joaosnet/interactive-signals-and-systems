// ============================================================================
// STATE.JS — Gerenciador Central de Estado Reativo e Persistência
// ============================================================================

const initialLang = (function () {
  try {
    const hash = window.location.hash || '';
    if (hash.includes('lang=pt')) return 'pt';
    if (hash.includes('lang=en')) return 'en';
    const saved = localStorage.getItem('conv3d_lang_pref');
    if (saved === 'pt' || saved === 'en') return saved;
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    return nav.toLowerCase().startsWith('pt') ? 'pt' : 'en';
  } catch (e) {
    return 'pt';
  }
})();

const initialTheme = (function () {
  try {
    const saved = localStorage.getItem('conv3d_theme');
    if (saved && ['projector', 'dark', 'light'].includes(saved)) return saved;
  } catch (e) {}
  return 'projector';
})();

let initialCustomPresets = [];
try {
  const saved = localStorage.getItem('conv3d_custom_presets_v2');
  if (saved) initialCustomPresets = JSON.parse(saved);
} catch (e) {}

let initialFourierCustomPresets = [];
try {
  const saved = localStorage.getItem('fourier3d_custom_presets_v1');
  if (saved) initialFourierCustomPresets = JSON.parse(saved);
} catch (e) {}

let initialVisibleSections = {
  notebook: true,
  regions: true,
  gallery: true,
  inputs: true
};
try {
  const saved = localStorage.getItem('conv3d_visible_sections');
  if (saved) initialVisibleSections = { ...initialVisibleSections, ...JSON.parse(saved) };
} catch (e) {}

let initialLayers = {
  waterfall: true,
  labels: true,
  spectrumWall: true,
  grid: true,
  thickStroke: false
};
try {
  const saved = localStorage.getItem('conv3d_layers');
  if (saved) initialLayers = { ...initialLayers, ...JSON.parse(saved) };
} catch (e) {}

const initialFontScale = (function () {
  try {
    const saved = localStorage.getItem('conv3d_font_scale');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.8 && parsed <= 1.4) {
        return Math.round(parsed * 10) / 10;
      }
    }
  } catch (e) {}
  return 1.0;
})();

const initialA11yContrast = (function () {
  try {
    return localStorage.getItem('conv3d_a11y_contrast') === 'true';
  } catch (e) {
    return false;
  }
})();

const initialA11yMotion = (function () {
  try {
    const saved = localStorage.getItem('conv3d_a11y_motion');
    if (saved !== null) return saved === 'true';
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
  } catch (e) {}
  return false;
})();

export const state = {
  activeModule: 'convolution', // 'convolution' | 'fourier'
  step: 4,
  t: 1.5,
  tauSweep: 1.2,
  flipAngle: Math.PI,
  isPlaying: true,
  seqMode: false,
  isCommuted: false,
  animSpeed: 1.0, // 0.5 | 1.0 | 2.0
  cameraPreset: '3d', // '3d' | '2d-time' | '2d-spec' | 'top'
  waterfallCycles: 2,
  theme: initialTheme,
  zenMode: false,
  activeMathField: null,
  lang: initialLang,

  // Floating Signal Focus HUD
  focusHUDActive: false,
  focusHUDTarget: 'x', // 'x' | 'h' | 'fourier'

  // Acessibilidade (A11y)
  fontScale: initialFontScale,
  a11yHighContrast: initialA11yContrast,
  a11yReduceMotion: initialA11yMotion,

  // Sinais de Convolução
  presetKey: 'ex8',
  exprX: 'e^(-t)*u(t)',
  exprH: 'u(t)-u(t-3)',
  customPresets: initialCustomPresets,

  // Sinais de Fourier
  fourierPresetKey: 'square',
  fourierExpr: '(u(t) - u(t-1.5)) - (u(t-1.5) - u(t-3))',
  fourierT0: 3.0,
  fourierN: 7,
  fourierForm: 'compact', // 'compact' | 'trig' | 'exp'
  fourierCustomPresets: initialFourierCustomPresets,
  fourierCalculated: null,
  highlightedHarmonic: null,
  audioEnabled: false,

  // Customização de Interface (ver apenas o que quer)
  visibleSections: initialVisibleSections,
  layers: initialLayers
};

export function saveStatePreferences() {
  try {
    localStorage.setItem('conv3d_theme', state.theme);
    localStorage.setItem('conv3d_lang_pref', state.lang);
    localStorage.setItem('conv3d_visible_sections', JSON.stringify(state.visibleSections));
    localStorage.setItem('conv3d_layers', JSON.stringify(state.layers));
    localStorage.setItem('conv3d_font_scale', state.fontScale.toFixed(1));
    localStorage.setItem('conv3d_a11y_contrast', String(state.a11yHighContrast));
    localStorage.setItem('conv3d_a11y_motion', String(state.a11yReduceMotion));
  } catch (e) {}
}

export function saveCustomPreset(preset, moduleType = 'convolution') {
  try {
    if (moduleType === 'fourier') {
      state.fourierCustomPresets.push(preset);
      localStorage.setItem('fourier3d_custom_presets_v1', JSON.stringify(state.fourierCustomPresets));
    } else {
      state.customPresets.push(preset);
      localStorage.setItem('conv3d_custom_presets_v2', JSON.stringify(state.customPresets));
    }
  } catch (e) {}
}

export function removeCustomPreset(presetId, moduleType = 'convolution') {
  try {
    if (moduleType === 'fourier') {
      state.fourierCustomPresets = state.fourierCustomPresets.filter(p => p.id !== presetId);
      localStorage.setItem('fourier3d_custom_presets_v1', JSON.stringify(state.fourierCustomPresets));
    } else {
      state.customPresets = state.customPresets.filter(p => p.id !== presetId);
      localStorage.setItem('conv3d_custom_presets_v2', JSON.stringify(state.customPresets));
    }
  } catch (e) {}
}
