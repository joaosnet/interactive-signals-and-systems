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

// Chave de localStorage dos presets salvos de cada módulo.
const PRESET_STORAGE = {
  convolution: { key: 'conv3d_custom_presets_v2', field: 'customPresets' },
  fourier: { key: 'fourier3d_custom_presets_v1', field: 'fourierCustomPresets' },
  ctft: { key: 'ctft3d_custom_presets_v1', field: 'ctftCustomPresets' }
};

// Lê a lista salva e descarta o que não for um preset bem formado
// (valor corrompido ou editado à mão não pode quebrar a galeria).
function loadCustomPresets(storageKey) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => p && typeof p === 'object' && typeof p.id === 'string');
  } catch (e) {
    return [];
  }
}

const initialCustomPresets = loadCustomPresets(PRESET_STORAGE.convolution.key);
const initialFourierCustomPresets = loadCustomPresets(PRESET_STORAGE.fourier.key);
const initialCTFTCustomPresets = loadCustomPresets(PRESET_STORAGE.ctft.key);

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
  phaseSpectrum: true,
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

const storedMotionPref = (function () {
  try {
    return localStorage.getItem('conv3d_a11y_motion');
  } catch (e) {
    return null;
  }
})();

const initialA11yMotion = (function () {
  try {
    const saved = storedMotionPref;
    if (saved !== null) return saved === 'true';
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
  } catch (e) {}
  return false;
})();

export const state = {
  activeModule: 'convolution', // 'convolution' | 'fourier' | 'ctft'
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
  focusHUDTarget: 'x', // 'x' | 'h' | 'fourier' | 'ctft'
  hudBuildMode: 'replace', // 'replace' | 'add' | 'sub'
  hudInputMode: 'mathlive', // 'mathlive' | 'text'
  mobileSheetSnap: 'default', // 'compact' | 'default' | 'expanded'

  // Acessibilidade (A11y)
  fontScale: initialFontScale,
  a11yHighContrast: initialA11yContrast,
  a11yReduceMotion: initialA11yMotion,
  a11yMotionUserSet: storedMotionPref !== null,

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
  fourierAnimMode: 'khutoryansky', // 'khutoryansky' (ondas oscilantes) | 'accumulation' (n=1..N)
  highlightedHarmonic: null,
  audioEnabled: false,

  // Transformada de Fourier Contínua (CTFT)
  ctftPresetKey: 'rect',
  ctftExpr: 'rect(t/2)',
  ctftPulseWidth: 2.0,
  ctftDecay: 1.0,
  ctftBridgeT0: 4.0,
  ctftCustomPresets: initialCTFTCustomPresets,
  ctftCalculated: null,
  ctftMode: 'none',    // modo de exploração: none | shift | scale | mod | inverse
  ctftModeValues: {},  // parâmetro de cada modo (t₀, a, ω₀, banda W)

  // Transformada de Laplace
  laplacePresetKey: 'exp',
  laplaceA: 1.0,       // decaimento: o polo real fica em s = -a
  laplaceW0: 2.0,      // frequência de oscilação dos pares senoidais
  laplaceSigma: 0.5,   // posição do corte vertical Re{s} = σ
  laplaceCalculated: null,

  // Transformada Z
  zPresetKey: 'exp',
  zA: 0.8,             // base da exponencial / raio dos polos
  zW0: 0.8,            // frequência Ω₀ (rad/amostra) dos pares senoidais
  zR: 1.3,             // raio do corte circular |z| = r
  zCalculated: null,

  // Convolução discreta
  dconvPresetKey: 'rect_rect',
  dconvN: 1,           // deslocamento n (inteiro) de h[n-k]
  dconvCalculated: null,

  // DTFT
  dtftPresetKey: 'rect',
  dtftParams: {},      // valor do parâmetro de cada par (chave = preset)
  dtftN: 5,            // termos de cada lado na soma parcial
  dtftOmega: 1.0,      // frequência de prova Ω (rad/amostra)
  dtftCalculated: null,

  // DFT / FFT
  dftPresetKey: 'cosbin',
  dftBits: 4,          // N = 2^bits amostras
  dftK: 2,             // bin em destaque no passo 3
  dftCalculated: null,

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
    if (state.a11yMotionUserSet) {
      localStorage.setItem('conv3d_a11y_motion', String(state.a11yReduceMotion));
    }
  } catch (e) {
    console.warn('Não foi possível salvar as preferências:', e);
  }
}

function persistCustomPresets(moduleType) {
  const { key, field } = PRESET_STORAGE[moduleType] || PRESET_STORAGE.convolution;
  try {
    localStorage.setItem(key, JSON.stringify(state[field]));
    return true;
  } catch (e) {
    // Cota cheia ou armazenamento bloqueado: o preset vale só até recarregar a página.
    console.warn('Não foi possível salvar os presets:', e);
    return false;
  }
}

export function saveCustomPreset(preset, moduleType = 'convolution') {
  const { field } = PRESET_STORAGE[moduleType] || PRESET_STORAGE.convolution;
  state[field].push(preset);
  return persistCustomPresets(moduleType);
}

export function removeCustomPreset(presetId, moduleType = 'convolution') {
  const { field } = PRESET_STORAGE[moduleType] || PRESET_STORAGE.convolution;
  state[field] = state[field].filter(p => p.id !== presetId);
  return persistCustomPresets(moduleType);
}
