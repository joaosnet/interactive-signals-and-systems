// ============================================================================
// UI/LANGUAGE.JS — Aplicação do idioma: reescreve os textos fixos da interface
// ============================================================================

import { state, saveStatePreferences } from '../state.js';
import { I18N } from '../i18n.js';
import { validateSignalExpression } from '../math-engine.js';
import { updateScene3D } from '../stage-3d.js';
import { updateNotebookUI } from '../notebook.js';
import { activeModule } from '../modules/index.js';
import { renderModuleSwitcher, stageHintText, updateStepLabels, renderPresetGallery } from '../ui.js';
import { updateThemeCycleButtonUI } from './preferences.js';
import { hudState, renderHUDOscilloscope, updateHUDTitle, updateParametricHUDPreview } from './hud.js';
import { tx } from '../lang.js';

export function applyLanguage(lang) {
  state.lang = lang;
  saveStatePreferences();
  const dict = I18N[lang] || I18N.pt;
  const isEn = lang === 'en';
  document.documentElement.lang = isEn ? 'en' : tx('pt-BR', 'es');

  document.title = dict.docTitle;
  const langBtnText = document.getElementById('lang-btn-text');
  if (langBtnText) langBtnText.textContent = dict.langBtn;

  document.querySelectorAll('.lang-opt-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-lang') === lang);
  });

  updateThemeCycleButtonUI(false);

  renderModuleSwitcher();
  const sliderTitle = dict[activeModule().slider().titleKey];

  // Atualiza textos estáticos
  const elMap = {
    'app-heading': dict.appHeading,
    'lbl-view-3d': dict.view3D,
    'lbl-view-2d-time': dict.view2DTime,
    'lbl-view-2d-spec': dict.view2DSpec,
    'lbl-view-top': dict.viewTop,
    'lbl-audio-btn': isEn ? 'Audio' : tx('Áudio', 'Audio'),
    'lbl-layers-btn': isEn ? 'Layers' : tx('Camadas', 'Capas'),
    'lbl-layers-title': dict.layersTitle,
    'lbl-layer-waterfall': dict.layerWaterfall,
    'lbl-layer-spectrum': dict.layerSpectrum,
    'lbl-layer-phase': dict.layerPhase,
    'lbl-layer-labels': dict.layerLabels,
    'lbl-layer-grid': dict.layerGrid,
    'lbl-layer-thick': dict.layerThick,
    'lbl-zen-mode': isEn ? 'Focus' : 'Foco',
    'lbl-stage-hint': stageHintText(isEn),
    'lbl-github-contribute': isEn ? 'Contribute' : 'Contribuir',
    'lbl-customize-btn': isEn ? 'Customize' : 'Personalizar',
    'zen-exit-btn': isEn ? '✕ Panel' : tx('✕ Painel', '✕ Panel'),
    'lbl-settings-title': isEn ? 'Customize & Settings' : tx('Personalizar & Configurações', 'Personalizar y Configuración'),
    'lbl-theme-label': isEn ? 'Visual Theme:' : 'Tema Visual:',
    'lbl-lang-label': isEn ? 'Language:' : 'Idioma:',
    'lbl-theme-proj': isEn ? 'Projector' : tx('Projetor', 'Proyector'),
    'lbl-theme-dark': isEn ? 'Dark' : tx('Escuro', 'Oscuro'),
    'lbl-theme-light': isEn ? 'Light' : 'Claro',
    'lbl-speed-label': dict.speedLabel,
    'lbl-shortcuts-title': dict.shortcutsTitle,
    'lbl-sc-space': isEn ? 'Space:' : tx('Espaço:', 'Espacio:'),
    'lbl-sc-tab': dict.shortcutTab,
    'lbl-sc-steps': dict.shortcutSteps,
    'lbl-sc-zen': dict.shortcutZen,
    'lbl-sc-audio': dict.shortcutAudio,
    'lbl-sc-arrows': dict.shortcutArrows,
    'lbl-sc-font': dict.shortcutFont,
    'lbl-sc-contrast': dict.shortcutContrast,
    'lbl-sc-motion': dict.shortcutMotion,
    'lbl-a11y-contrast': dict.contrastBtn,
    'lbl-a11y-motion': dict.motionBtn,
    'slider-param-title': sliderTitle,
    'lbl-fourier-harmonics': dict.sliderHarmonics,
    'lbl-fourier-form': isEn ? 'Form:' : 'Forma:',
    'notebook-title': dict.notebookTitle,
    'lbl-rewatch': dict.btnRewatch,
    'regions-title': dict[activeModule().i18n.regionsTitle],
    'gallery-title': dict.galleryTitle,
    'gallery-subtitle': isEn ? 'Tap to load or create' : tx('Toque para carregar ou criar', 'Toca para cargar o crear'),
    'lbl-seq-mode': dict.btnSeqMode,
    'lbl-play': state.isPlaying ? dict.btnPlayPause : dict.btnPlayPlay,
    'filters-title': isEn ? 'Show in Panel:' : tx('Mostrar no Painel:', 'Mostrar en el Panel:'),
    'filter-pill-notebook': isEn ? 'Steps' : tx('Passo a Passo', 'Paso a Paso'),
    'filter-pill-regions': isEn ? 'Table' : tx('Tabela', 'Tabla'),
    'filter-pill-gallery': isEn ? 'Presets' : tx('Exemplos', 'Ejemplos'),

    // Floating Signal Focus HUD
    'hud-lbl-shape-rect': dict.hudShapeRect,
    'hud-lbl-shape-tri': dict.hudShapeTri,
    'hud-lbl-shape-pulse': dict.hudShapePulse,
    'hud-lbl-shape-step': dict.hudShapeStep,
    'hud-lbl-shape-exp': isEn ? 'Exp.' : 'Exp.',
    'hud-lbl-shape-ramp': dict.hudShapeRamp,
    'hud-lbl-shape-sin': dict.hudShapeSin,
    'hud-lbl-slider-a': dict.hudSliderA,
    'hud-lbl-slider-w': dict.hudSliderW,
    'hud-lbl-slider-t0': dict.hudSliderT0,
    'hud-lbl-slider-alpha': dict.hudSliderAlpha,
    'hud-lbl-btn-pin': isEn ? '+ Save' : tx('+ Salvar', '+ Guardar'),
    'hud-key-clear': isEn ? 'Clear' : tx('Limpar', 'Limpiar'),
    'hud-mode-replace': isEn ? '= Replace' : tx('= Substituir', '= Sustituir'),
    'hud-mode-add': isEn ? '+ Add' : tx('+ Somar', '+ Sumar'),
    'hud-mode-sub': isEn ? '− Subtract' : tx('− Subtrair', '− Restar'),
    'hud-btn-commit-block': isEn ? '+ Apply Block' : tx('+ Aplicar Bloco', '+ Aplicar Bloque')
  };

  Object.entries(elMap).forEach(([id, txt]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  });

  const btnKbd = document.getElementById('hud-btn-keyboard');
  if (btnKbd) {
    btnKbd.title = dict.hudBtnKbdTitle;
    btnKbd.setAttribute('aria-label', dict.hudBtnKbdTitle);
  }
  const btnMode = document.getElementById('hud-btn-input-mode');
  if (btnMode) {
    btnMode.title = dict.hudBtnModeTitle;
    btnMode.setAttribute('aria-label', dict.hudBtnModeTitle);
  }
  const hudFreeIn = document.getElementById('hud-free-input');
  if (hudFreeIn) {
    hudFreeIn.placeholder = isEn ? 'Ex: 2*rect(t/2)' : tx('Ex: 2*rect(t/2)', 'Ej.: 2*rect(t/2)');
  }

  updateHUDTitle();
  if (state.focusHUDActive) {
    updateParametricHUDPreview(false);
    const valRes = validateSignalExpression(hudState.baseExpression || 'rect(t)');
    renderHUDOscilloscope(valRes, state.focusHUDTarget || 'x');
  } else {
    renderHUDOscilloscope(validateSignalExpression(state.exprX || 'rect(t)'), 'x');
  }

  // Atualiza tooltips e atributos ARIA da barra de acessibilidade
  const a11yBar = document.getElementById('a11y-bar');
  if (a11yBar) a11yBar.setAttribute('aria-label', dict.a11yBarLabel);

  const btnDec = document.getElementById('btn-font-dec');
  if (btnDec) {
    btnDec.title = dict.fontDecTitle;
    btnDec.setAttribute('aria-label', dict.fontDecTitle);
  }

  const btnReset = document.getElementById('btn-font-reset');
  if (btnReset) {
    btnReset.title = dict.fontResetTitle;
    btnReset.setAttribute('aria-label', dict.fontResetTitle);
  }

  const btnInc = document.getElementById('btn-font-inc');
  if (btnInc) {
    btnInc.title = dict.fontIncTitle;
    btnInc.setAttribute('aria-label', dict.fontIncTitle);
  }

  const btnContrast = document.getElementById('btn-a11y-contrast');
  if (btnContrast) {
    btnContrast.title = dict.contrastTitle;
    btnContrast.setAttribute('aria-label', dict.contrastTitle);
  }

  const btnMotion = document.getElementById('btn-a11y-motion');
  if (btnMotion) {
    btnMotion.title = dict.motionTitle;
    btnMotion.setAttribute('aria-label', dict.motionTitle);
  }

  updateStepLabels();
  renderPresetGallery();
  updateNotebookUI(false);
  updateScene3D();
}
