// ============================================================================
// UI.JS — Manipulação de Interface, Segmented Controls, Popovers e Teclado
// ============================================================================

import { state, saveStatePreferences, saveCustomPreset, removeCustomPreset } from './state.js';
import { I18N } from './i18n.js';
import { renderMath, exprToLatex, latexToExpr, calculateFourierData, calculateCTFTData, validateSignalExpression } from './math-engine.js';
import { BUILTIN_CONV_PRESETS, BUILTIN_FOURIER_PRESETS, BUILTIN_CTFT_PRESETS } from './presets.js';
import { updateScene3D, setCameraPreset } from './stage-3d.js';
import { updateNotebookUI } from './notebook.js';
import { toggleAudio, updateAudioSynth } from './audio.js';

export function switchModule(moduleName) {
  state.activeModule = moduleName;
  const isFourier = moduleName === 'fourier';
  const isCTFT = moduleName === 'ctft';
  const isConv = moduleName === 'convolution';

  // Sincroniza hash da URL
  window.history.replaceState(null, '', isCTFT ? '#ctft' : (isFourier ? '#fourier' : '#convolution'));

  // Atualiza Segmented Control Principal
  const btnConv = document.getElementById('mod-btn-conv');
  const btnFourier = document.getElementById('mod-btn-fourier');
  const btnCTFT = document.getElementById('mod-btn-ctft');
  if (btnConv && btnFourier) {
    btnConv.classList.toggle('active', isConv);
    btnFourier.classList.toggle('active', isFourier);
    if (btnCTFT) btnCTFT.classList.toggle('active', isCTFT);
  }

  // Sincroniza Dock do Modo Zen
  const zenBtnConv = document.getElementById('zen-btn-conv');
  const zenBtnFourier = document.getElementById('zen-btn-fourier');
  const zenBtnCTFT = document.getElementById('zen-btn-ctft');
  if (zenBtnConv && zenBtnFourier) {
    zenBtnConv.classList.toggle('active', isConv);
    zenBtnFourier.classList.toggle('active', isFourier);
    if (zenBtnCTFT) zenBtnCTFT.classList.toggle('active', isCTFT);
  }

  // Controles específicos de cada módulo
  const convSliders = document.getElementById('conv-slider-row');
  const fourierSliders = document.getElementById('fourier-slider-row');
  if (convSliders && fourierSliders) {
    convSliders.classList.toggle('hidden', !isConv);
    fourierSliders.classList.toggle('hidden', !isFourier);
  }

  const btnCommute = document.getElementById('btn-commute');
  if (btnCommute) btnCommute.classList.toggle('hidden', !isConv);

  const btnAudio = document.getElementById('btn-audio-toggle');
  if (btnAudio) btnAudio.classList.toggle('hidden', !isFourier);

  const fourierFormSelector = document.getElementById('fourier-form-selector');
  if (fourierFormSelector) fourierFormSelector.classList.toggle('hidden', !isFourier);

  const dict = I18N[state.lang] || I18N.pt;
  const regTitle = document.getElementById('regions-title');
  if (regTitle) {
    regTitle.textContent = isCTFT ? 'Pares Notáveis & Ponte de Khutoryansky' : (isFourier ? dict.regionsFourierTitle : dict.regionsTitle);
  }

  // Atualiza passos (1 a 4) com os rótulos de cada módulo
  updateStepLabels();

  if (isCTFT) {
    state.ctftCalculated = calculateCTFTData(state.ctftPresetKey, state.ctftPulseWidth, state.ctftDecay, state.ctftBridgeT0);
    if (state.activeMathField) setActiveMathField('ctft');
  } else if (isFourier) {
    state.fourierCalculated = calculateFourierData(state.fourierExpr, state.fourierT0, state.fourierN);
    if (state.activeMathField) setActiveMathField('fourier');
    updateAudioSynth();
  } else {
    if (state.activeMathField) setActiveMathField('x');
  }

  // Sincroniza HUD de Modo Foco se estiver aberto
  if (state.focusHUDActive) {
    state.focusHUDTarget = isCTFT ? 'ctft' : (isFourier ? 'fourier' : 'x');
    const pillX = document.getElementById('hud-pill-x');
    const pillH = document.getElementById('hud-pill-h');
    const pillFourier = document.getElementById('hud-pill-fourier');
    const pillCTFT = document.getElementById('hud-pill-ctft');
    if (pillX && pillH && pillFourier) {
      pillX.classList.toggle('hidden', !isConv);
      pillH.classList.toggle('hidden', !isConv);
      pillFourier.classList.toggle('hidden', !isFourier);
      if (pillCTFT) pillCTFT.classList.toggle('hidden', !isCTFT);

      pillX.classList.toggle('active', isConv);
      pillH.classList.remove('active');
      pillFourier.classList.toggle('active', isFourier);
      if (pillCTFT) pillCTFT.classList.toggle('active', isCTFT);
    }
    updateHUDTitle();
    updateParametricHUDPreview();
  }

  setStep(state.step, false);
  syncInputsWithPreset();
  renderPresetGallery();
  updateNotebookUI(false);
  updateScene3D();
}

export function setStep(stepNum, restartAnim = true) {
  state.step = stepNum;
  const dict = I18N[state.lang] || I18N.pt;
  document.querySelectorAll('.step-card').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.getAttribute('data-step')) === stepNum);
  });
  document.querySelectorAll('.zen-step-btn').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.getAttribute('data-step')) === stepNum);
  });

  const slider = document.getElementById('t-slider');
  const titleEl = document.getElementById('slider-param-title');

  if (state.activeModule === 'ctft') {
    if (stepNum === 4) {
      if (titleEl) titleEl.textContent = 'Período da Ponte T₀ (T₀ → ∞)';
      if (slider) {
        slider.min = '2.0';
        slider.max = '25.0';
        slider.step = '0.5';
        slider.value = state.ctftBridgeT0;
      }
    } else if (stepNum === 3) {
      if (titleEl) titleEl.textContent = 'Frequência de Teste ω';
      if (slider) {
        slider.min = '-15.0';
        slider.max = '15.0';
        slider.step = '0.2';
        slider.value = state.t;
      }
    } else {
      if (titleEl) titleEl.textContent = 'Largura do Sinal τ₀';
      if (slider) {
        slider.min = '0.5';
        slider.max = '5.0';
        slider.step = '0.25';
        slider.value = state.ctftPulseWidth;
      }
    }
  } else if (state.activeModule === 'fourier') {
    if (titleEl) titleEl.textContent = dict.sliderEvalPoint;
    if (slider) {
      slider.min = '-4.0';
      slider.max = '4.0';
      slider.step = '0.02';
      slider.value = state.t;
    }
  } else {
    if (stepNum === 1) {
      if (titleEl) titleEl.textContent = dict.sliderSweep;
      if (slider) {
        slider.min = '-3.5';
        slider.max = '5.5';
        slider.step = '0.02';
        if (restartAnim) state.tauSweep = -3.0;
        slider.value = state.tauSweep;
      }
    } else if (stepNum === 2) {
      if (titleEl) titleEl.textContent = dict.sliderFlip;
      if (slider) {
        slider.min = '0';
        slider.max = '3.1416';
        slider.step = '0.02';
        if (restartAnim) state.flipAngle = 0;
        slider.value = state.flipAngle;
      }
    } else {
      if (titleEl) titleEl.textContent = stepNum === 3 ? dict.sliderShift3 : dict.sliderShift4;
      if (slider) {
        slider.min = '-2.0';
        slider.max = '5.8';
        slider.step = '0.02';
        state.flipAngle = Math.PI;
        slider.value = state.t;
      }
    }
  }

  updateSliderBadge();
  updateNotebookUI(true);
}

export function updateSliderBadge() {
  const badge = document.getElementById('t-readout-badge');
  const zenBadge = document.getElementById('zen-t-readout');
  let txt = '';
  if (state.activeModule === 'ctft') {
    if (state.step === 4) txt = `T₀ = ${state.ctftBridgeT0.toFixed(1)} s`;
    else if (state.step === 3) txt = `ω = ${state.t.toFixed(2)} rad/s`;
    else txt = `τ₀ = ${state.ctftPulseWidth.toFixed(2)} s`;
  } else if (state.activeModule === 'fourier') {
    txt = `t = ${state.t.toFixed(2)}`;
  } else {
    if (state.step === 1) txt = `τ = ${state.tauSweep.toFixed(2)}`;
    else if (state.step === 2) txt = `θ = ${Math.round((state.flipAngle / Math.PI) * 180)}°`;
    else txt = `t = ${state.t.toFixed(2)}`;
  }
  if (badge) badge.textContent = txt;
  if (zenBadge) zenBadge.textContent = txt;
}

export function updatePlayButtonUI() {
  const dict = I18N[state.lang] || I18N.pt;
  const isPlaying = state.isPlaying;
  document.querySelectorAll('.icon-play').forEach(el => el.classList.toggle('hidden', isPlaying));
  document.querySelectorAll('.icon-pause').forEach(el => el.classList.toggle('hidden', !isPlaying));
  const lbl = document.getElementById('lbl-play');
  if (lbl) lbl.textContent = isPlaying ? dict.btnPlayPause : dict.btnPlayPlay;
}

export function updateStepLabels() {
  const dict = I18N[state.lang] || I18N.pt;
  const isFourier = state.activeModule === 'fourier';
  const isCTFT = state.activeModule === 'ctft';
  for (let s = 1; s <= 4; s++) {
    const tagEl = document.getElementById('step-tag-' + s);
    const lblEl = document.getElementById('step-lbl-' + s);
    if (tagEl) tagEl.textContent = dict['stepTag' + s];
    if (lblEl) lblEl.textContent = isCTFT ? dict['stepCTFT' + s] : (isFourier ? dict['stepFourier' + s] : dict['stepConv' + s]);
  }
}

export function setFontScale(scale) {
  const clamped = Math.max(0.8, Math.min(1.4, Math.round(scale * 10) / 10));
  state.fontScale = clamped;
  document.documentElement.style.setProperty('--font-scale', clamped.toFixed(1));

  const resetBtn = document.getElementById('btn-font-reset');
  if (resetBtn) {
    resetBtn.textContent = `${Math.round(clamped * 100)}%`;
  }

  const decBtn = document.getElementById('btn-font-dec');
  if (decBtn) {
    const atMin = clamped <= 0.8;
    decBtn.classList.toggle('opacity-40', atMin);
    decBtn.classList.toggle('cursor-not-allowed', atMin);
    decBtn.setAttribute('aria-disabled', String(atMin));
  }

  const incBtn = document.getElementById('btn-font-inc');
  if (incBtn) {
    const atMax = clamped >= 1.4;
    incBtn.classList.toggle('opacity-40', atMax);
    incBtn.classList.toggle('cursor-not-allowed', atMax);
    incBtn.setAttribute('aria-disabled', String(atMax));
  }

  saveStatePreferences();
}

export function toggleHighContrast(forceVal = null) {
  state.a11yHighContrast = forceVal !== null ? forceVal : !state.a11yHighContrast;
  document.body.classList.toggle('a11y-high-contrast', state.a11yHighContrast);

  const btn = document.getElementById('btn-a11y-contrast');
  if (btn) {
    btn.classList.toggle('active', state.a11yHighContrast);
    btn.setAttribute('aria-pressed', String(state.a11yHighContrast));
  }

  saveStatePreferences();
  updateScene3D();
}

export function toggleReduceMotion(forceVal = null) {
  state.a11yReduceMotion = forceVal !== null ? forceVal : !state.a11yReduceMotion;
  document.body.classList.toggle('a11y-reduce-motion', state.a11yReduceMotion);

  const btn = document.getElementById('btn-a11y-motion');
  if (btn) {
    btn.classList.toggle('active', state.a11yReduceMotion);
    btn.setAttribute('aria-pressed', String(state.a11yReduceMotion));
  }

  if (state.a11yReduceMotion && state.isPlaying) {
    state.isPlaying = false;
    updatePlayButtonUI();
  }

  saveStatePreferences();
}

export function updateThemeCycleButtonUI(animateIcon = false) {
  const iconEl = document.getElementById('theme-cycle-icon');
  const lblEl = document.getElementById('lbl-theme-cycle');
  const isEn = state.lang === 'en';
  const th = state.theme || 'projector';

  const svgIcons = {
    projector: `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><circle cx="12" cy="10" r="3"/></svg>`,
    dark: `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    light: `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
  };

  const labelMap = isEn
    ? { projector: 'Projector', dark: 'Dark', light: 'Light' }
    : { projector: 'Projetor', dark: 'Escuro', light: 'Claro' };

  if (iconEl) {
    if (animateIcon) {
      iconEl.classList.remove('theme-switching');
      void iconEl.offsetWidth;
      iconEl.classList.add('theme-switching');
      setTimeout(() => iconEl.classList.remove('theme-switching'), 440);
    }
    iconEl.innerHTML = svgIcons[th] || svgIcons.projector;
  }
  if (lblEl) {
    lblEl.textContent = labelMap[th] || labelMap.projector;
  }
}

export function applyTheme(th, animateIcon = false) {
  state.theme = th;
  document.body.classList.remove('theme-dark', 'theme-light', 'theme-projector');
  document.body.classList.add('theme-' + th);
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-theme') === th);
  });
  updateThemeCycleButtonUI(animateIcon);
  saveStatePreferences();
  if (state.focusHUDActive) {
    const valRes = validateSignalExpression(hudBaseExpression || 'rect(t)');
    renderHUDOscilloscope(valRes, state.focusHUDTarget || 'x');
  }
  updateScene3D();
}

export function applyLanguage(lang) {
  state.lang = lang;
  saveStatePreferences();
  const dict = I18N[lang] || I18N.pt;
  const isEn = lang === 'en';
  document.documentElement.lang = isEn ? 'en' : 'pt-BR';

  document.title = dict.docTitle;
  const langBtnText = document.getElementById('lang-btn-text');
  if (langBtnText) langBtnText.textContent = dict.langBtn;

  document.querySelectorAll('.lang-opt-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-lang') === lang);
  });

  updateThemeCycleButtonUI(false);

  const sliderTitle =
    state.activeModule === 'fourier'
      ? dict.sliderEvalPoint
      : state.step === 1
      ? dict.sliderSweep
      : state.step === 2
      ? dict.sliderFlip
      : state.step === 3
      ? dict.sliderShift3
      : dict.sliderShift4;

  // Atualiza textos estáticos
  const elMap = {
    'app-heading': dict.appHeading,
    'mod-conv-title': dict.modConvTitle,
    'mod-conv-sub': dict.modConvSub,
    'mod-fourier-title': dict.modFourierTitle,
    'mod-fourier-sub': dict.modFourierSub,
    'lbl-view-3d': dict.view3D,
    'lbl-view-2d-time': dict.view2DTime,
    'lbl-view-2d-spec': dict.view2DSpec,
    'lbl-view-top': dict.viewTop,
    'lbl-audio-btn': isEn ? 'Audio' : 'Áudio',
    'lbl-layers-btn': isEn ? 'Layers' : 'Camadas',
    'lbl-layers-title': dict.layersTitle,
    'lbl-layer-waterfall': dict.layerWaterfall,
    'lbl-layer-spectrum': dict.layerSpectrum,
    'lbl-layer-labels': dict.layerLabels,
    'lbl-layer-grid': dict.layerGrid,
    'lbl-layer-thick': dict.layerThick,
    'lbl-zen-mode': isEn ? 'Focus' : 'Foco',
    'lbl-stage-hint': isEn ? 'Click a signal to edit • Drag: Orbit' : 'Clique no sinal para editar • Arraste: Orbitar',
    'lbl-github-contribute': isEn ? 'Contribute' : 'Contribuir',
    'lbl-customize-btn': isEn ? 'Customize' : 'Personalizar',
    'zen-exit-btn': isEn ? '✕ Panel' : '✕ Painel',
    'lbl-settings-title': isEn ? 'Customize & Settings' : 'Personalizar & Configurações',
    'lbl-theme-label': isEn ? 'Visual Theme:' : 'Tema Visual:',
    'lbl-lang-label': isEn ? 'Language:' : 'Idioma:',
    'lbl-theme-proj': isEn ? 'Projector' : 'Projetor',
    'lbl-theme-dark': isEn ? 'Dark' : 'Escuro',
    'lbl-theme-light': isEn ? 'Light' : 'Claro',
    'lbl-speed-label': dict.speedLabel,
    'lbl-shortcuts-title': dict.shortcutsTitle,
    'lbl-sc-space': isEn ? 'Space:' : 'Espaço:',
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
    'regions-title': state.activeModule === 'fourier' ? dict.regionsFourierTitle : dict.regionsTitle,
    'gallery-title': dict.galleryTitle,
    'gallery-subtitle': isEn ? 'Tap to load or create' : 'Toque para carregar ou criar',
    'lbl-seq-mode': dict.btnSeqMode,
    'lbl-play': state.isPlaying ? dict.btnPlayPause : dict.btnPlayPlay,
    'filters-title': isEn ? 'Show in Panel:' : 'Mostrar no Painel:',
    'filter-pill-notebook': isEn ? 'Steps' : 'Passo a Passo',
    'filter-pill-regions': isEn ? 'Table' : 'Tabela',
    'filter-pill-gallery': isEn ? 'Presets' : 'Exemplos',

    // Floating Signal Focus HUD
    'hud-lbl-shape-rect': dict.hudShapeRect,
    'hud-lbl-shape-tri': dict.hudShapeTri,
    'hud-lbl-shape-pulse': isEn ? 'Switch' : 'Chave',
    'hud-lbl-shape-step': dict.hudShapeStep,
    'hud-lbl-shape-exp': isEn ? 'Exp.' : 'Exp.',
    'hud-lbl-shape-ramp': dict.hudShapeRamp,
    'hud-lbl-shape-sin': dict.hudShapeSin,
    'hud-lbl-slider-a': dict.hudSliderA,
    'hud-lbl-slider-w': dict.hudSliderW,
    'hud-lbl-slider-t0': dict.hudSliderT0,
    'hud-lbl-slider-alpha': dict.hudSliderAlpha,
    'hud-lbl-btn-pin': isEn ? '+ Save' : '+ Salvar',
    'hud-key-clear': isEn ? 'Clear' : 'Limpar',
    'hud-mode-replace': isEn ? '= Replace' : '= Substituir',
    'hud-mode-add': isEn ? '+ Add' : '+ Somar',
    'hud-mode-sub': isEn ? '− Subtract' : '− Subtrair',
    'hud-btn-commit-block': isEn ? '+ Apply Block' : '+ Aplicar Bloco'
  };

  Object.entries(elMap).forEach(([id, txt]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  });

  updateHUDTitle();
  if (state.focusHUDActive) {
    updateParametricHUDPreview(false);
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

export function toggleSectionVisibility(secKey, forceVal = null) {
  state.visibleSections[secKey] = forceVal !== null ? forceVal : !state.visibleSections[secKey];
  saveStatePreferences();

  const secEl = document.getElementById(`section-${secKey}`);
  const filterPill = document.getElementById(`filter-pill-${secKey}`);
  if (secEl) {
    secEl.classList.toggle('hidden', !state.visibleSections[secKey]);
  }
  if (filterPill) {
    filterPill.classList.toggle('active', state.visibleSections[secKey]);
    filterPill.classList.toggle('opacity-50', !state.visibleSections[secKey]);
  }
}

export function renderPresetGallery() {
  const gallery = document.getElementById('preset-gallery');
  if (!gallery) return;
  gallery.innerHTML = '';
  const isEn = state.lang === 'en';
  const isCTFT = state.activeModule === 'ctft';
  const isFourier = state.activeModule === 'fourier';

  if (isCTFT) {
    // Card de Criação / Edição Direta de x(t) para CTFT
    const createCard = document.createElement('div');
    createCard.className = 'preset-create-card col-span-2 rounded-xl p-2.5 cursor-pointer flex items-center justify-between gap-2';
    createCard.innerHTML = `
      <div class="flex flex-col min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] font-bold" style="color: var(--c-x1)">${isEn ? '+ Create / Edit Aperiodic Signal x(t)' : '+ Criar / Editar Sinal Aperiódico x(t)'}</span>
          <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">MathLive</span>
        </div>
        <div class="create-card-math text-[10px] text-secondary truncate mt-0.5"></div>
      </div>
      <button type="button" id="gallery-btn-edit-ctft" class="ctrl-pill px-2.5 py-1.5 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1" style="border-color: var(--c-x1); color: var(--c-x1)">
        <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        <span>${isEn ? 'Edit x(t)' : 'Editar x(t)'}</span>
      </button>
    `;
    const mathEl = createCard.querySelector('.create-card-math');
    if (mathEl) {
      renderMath(mathEl, `x(t) = ${exprToLatex(state.ctftExpr || 'rect(t/2)', 't')}`, false);
    }
    createCard.addEventListener('click', () => openSignalHUD('ctft'));
    gallery.appendChild(createCard);

    const allCTFT = Object.values(BUILTIN_CTFT_PRESETS);
    allCTFT.forEach(p => {
      const isActive = state.ctftPresetKey === p.id;
      const card = document.createElement('div');
      card.className = `preset-pill rounded-lg p-2 cursor-pointer flex flex-col justify-between gap-1 relative ${isActive ? 'active' : ''}`;
      const pTitle = isEn ? (p.titleEn || p.title) : p.title;
      const pSub = isEn ? (p.subtitleEn || p.subtitle) : p.subtitle;

      card.innerHTML = `
        <div class="flex items-center justify-between gap-1">
          <span class="text-[11px] font-bold truncate text-primary">${pTitle}</span>
          <span class="text-[9px] font-mono-code font-semibold" style="color: var(--c-conv)">CTFT</span>
        </div>
        <div class="text-[10px] text-mut truncate">${pSub}</div>
        <div class="preset-math text-[10px] pt-0.5 truncate"></div>
      `;
      const mathPreview = card.querySelector('.preset-math');
      if (mathPreview && p.latexX) {
        renderMath(mathPreview, `${p.latexX} \\longleftrightarrow ${p.latexCTFT}`, false);
      }
      card.addEventListener('click', () => {
        state.ctftPresetKey = p.id;
        state.ctftCalculated = calculateCTFTData(p.id, p.tau0 || 2.0, p.a || 1.0, p.defaultT0 || 4.0);
        renderPresetGallery();
        updateNotebookUI(true);
        updateScene3D();
      });
      gallery.appendChild(card);
    });
    return;
  }

  if (isFourier) {
    // Card de Criação / Edição Direta de f(t)
    const createCard = document.createElement('div');
    createCard.className = 'preset-create-card col-span-2 rounded-xl p-2.5 cursor-pointer flex items-center justify-between gap-2';
    createCard.innerHTML = `
      <div class="flex flex-col min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] font-bold" style="color: var(--c-x1)">${isEn ? '+ Create / Edit Periodic Signal f(t)' : '+ Criar / Editar Sinal Periódico f(t)'}</span>
          <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">MathLive</span>
        </div>
        <div class="create-card-math text-[10px] text-secondary truncate mt-0.5"></div>
      </div>
      <button type="button" class="ctrl-pill px-2.5 py-1.5 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1" style="border-color: var(--c-x1); color: var(--c-x1)">
        <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        <span>${isEn ? 'Edit f(t)' : 'Editar f(t)'}</span>
      </button>
    `;
    const mathEl = createCard.querySelector('.create-card-math');
    if (mathEl) {
      renderMath(mathEl, `f(t) = ${exprToLatex(state.fourierExpr, 't')}\\; (T_0 = ${state.fourierT0})`, false);
    }
    createCard.addEventListener('click', () => openSignalHUD('fourier'));
    gallery.appendChild(createCard);

    const allFourier = [
      ...Object.values(BUILTIN_FOURIER_PRESETS),
      ...(state.fourierCustomPresets || []).map(cp => ({ ...cp, isCustom: true }))
    ];

    allFourier.forEach(p => {
      const isActive = state.fourierPresetKey === p.id;
      const card = document.createElement('div');
      card.className = `preset-pill rounded-lg p-2 cursor-pointer flex flex-col justify-between gap-1 relative ${isActive ? 'active' : ''}`;
      const pTitle = isEn ? (p.titleEn || p.title) : p.title;
      const pSub = isEn ? (p.subtitleEn || p.subtitle) : p.subtitle;

      card.innerHTML = `
        <div class="flex items-center justify-between gap-1">
          <span class="text-[11px] font-bold truncate text-primary">${pTitle}</span>
          <div class="flex items-center gap-1">
            <span class="text-[9px] font-mono-code font-semibold" style="color: var(--c-x1)">T₀=${p.T0}</span>
            ${p.isCustom ? `<button type="button" class="del-preset text-[10px] px-1 rounded hover:bg-red-500/20 text-rose-400">✕</button>` : ''}
          </div>
        </div>
        <div class="text-[10px] text-mut truncate">${pSub}</div>
        <div class="preset-math text-[10px] pt-0.5 truncate"></div>
      `;
      const mathPreview = card.querySelector('.preset-math');
      if (mathPreview && p.expr) {
        renderMath(mathPreview, `f(t) = ${exprToLatex(p.expr, 't')}`, false);
      }

      card.addEventListener('click', (e) => {
        if (e.target.closest('.del-preset')) return;
        state.fourierPresetKey = p.id;
        state.fourierExpr = p.expr;
        state.fourierT0 = p.T0;
        state.fourierN = p.N || 7;
        state.fourierCalculated = calculateFourierData(state.fourierExpr, state.fourierT0, state.fourierN);
        syncInputsWithPreset();
        renderPresetGallery();
        updateNotebookUI(true);
        updateScene3D();
        updateAudioSynth();
      });

      const delBtn = card.querySelector('.del-preset');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeCustomPreset(p.id, 'fourier');
          if (state.fourierPresetKey === p.id) {
            state.fourierPresetKey = 'square';
            state.fourierExpr = BUILTIN_FOURIER_PRESETS.square.expr;
            state.fourierT0 = BUILTIN_FOURIER_PRESETS.square.T0;
            state.fourierN = BUILTIN_FOURIER_PRESETS.square.N;
            state.fourierCalculated = calculateFourierData(state.fourierExpr, state.fourierT0, state.fourierN);
            syncInputsWithPreset();
          }
          renderPresetGallery();
          updateNotebookUI(true);
          updateScene3D();
          updateAudioSynth();
        });
      }

      gallery.appendChild(card);
    });
    return;
  }

  // Convolution: Card de Criação / Edição Direta de x(t) e h(t)
  const createCard = document.createElement('div');
  createCard.className = 'preset-create-card col-span-2 rounded-xl p-2.5 flex flex-col gap-2';
  createCard.innerHTML = `
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-1.5">
        <span class="text-[11px] font-bold" style="color: var(--c-x1)">${isEn ? '+ Create / Edit Signals in Simulation' : '+ Criar / Editar Sinais na Simulação'}</span>
        <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">MathLive</span>
      </div>
      <span class="text-[9px] text-mut hidden sm:inline">${isEn ? 'Or click curves in 3D' : 'Ou clique nas curvas 3D'}</span>
    </div>
    <div class="grid grid-cols-2 gap-1.5">
      <button type="button" id="gallery-btn-edit-x" class="ctrl-pill px-2 py-1.5 rounded-lg text-left flex items-center justify-between gap-1 hover:border-emerald-400/60 transition-all">
        <span class="create-math-x text-[10px] truncate"></span>
        <span class="text-[10px] font-bold shrink-0 flex items-center gap-1" style="color: var(--c-x1)">
          <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          <span>x(t)</span>
        </span>
      </button>
      <button type="button" id="gallery-btn-edit-h" class="ctrl-pill px-2 py-1.5 rounded-lg text-left flex items-center justify-between gap-1 hover:border-pink-400/60 transition-all">
        <span class="create-math-h text-[10px] truncate"></span>
        <span class="text-[10px] font-bold shrink-0 flex items-center gap-1" style="color: var(--c-x2)">
          <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          <span>h(t)</span>
        </span>
      </button>
    </div>
  `;
  const mathX = createCard.querySelector('.create-math-x');
  const mathH = createCard.querySelector('.create-math-h');
  if (mathX) renderMath(mathX, `x(t) = ${exprToLatex(state.exprX, 't')}`, false);
  if (mathH) renderMath(mathH, `h(t) = ${exprToLatex(state.exprH, 't')}`, false);
  createCard.querySelector('#gallery-btn-edit-x')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openSignalHUD('x');
  });
  createCard.querySelector('#gallery-btn-edit-h')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openSignalHUD('h');
  });
  gallery.appendChild(createCard);

  // Convolution Presets
  const allPresets = [
    ...Object.values(BUILTIN_CONV_PRESETS),
    ...(state.customPresets || []).map(cp => ({ ...cp, isCustom: true }))
  ];

  allPresets.forEach(p => {
    const isActive = state.presetKey === p.id;
    const card = document.createElement('div');
    card.className = `preset-pill rounded-lg p-2 cursor-pointer flex flex-col justify-between gap-1 relative ${isActive ? 'active' : ''}`;
    const bTitle = isEn ? (p.shortTitleEn || p.shortTitle) : p.shortTitle;
    const bSub = isEn ? (p.subtitleEn || p.subtitle) : (p.subtitle || '');

    card.innerHTML = `
      <div class="flex items-center justify-between gap-1">
        <span class="text-[11px] font-bold truncate">${bTitle}</span>
        ${p.isCustom ? `<button type="button" class="del-preset text-[10px] px-1 rounded hover:bg-red-500/20 text-rose-400">✕</button>` : ''}
      </div>
      <div class="text-[10px] text-mut truncate">${bSub}</div>
      <div class="preset-math text-[10px] pt-0.5 truncate"></div>
    `;

    const mathPreview = card.querySelector('.preset-math');
    if (mathPreview) {
      renderMath(mathPreview, `x=${p.latexX || exprToLatex(p.exprX)},\\; h=${p.latexH || exprToLatex(p.exprH)}`, false);
    }

    card.addEventListener('click', (e) => {
      if (e.target.closest('.del-preset')) return;
      state.presetKey = p.id;
      state.exprX = p.exprX;
      state.exprH = p.exprH;
      syncInputsWithPreset();
      renderPresetGallery();
      updateNotebookUI(true);
      updateScene3D();
    });

    const delBtn = card.querySelector('.del-preset');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeCustomPreset(p.id, 'convolution');
        if (state.presetKey === p.id) {
          state.presetKey = 'ex8';
          state.exprX = BUILTIN_CONV_PRESETS.ex8.exprX;
          state.exprH = BUILTIN_CONV_PRESETS.ex8.exprH;
          syncInputsWithPreset();
        }
        renderPresetGallery();
        updateNotebookUI(true);
        updateScene3D();
      });
    }

    gallery.appendChild(card);
  });
}

export function syncInputsWithPreset() {
  const isFourier = state.activeModule === 'fourier';
  if (isFourier) {
    const t0Input = document.getElementById('fourier-t0-input');
    const hudT0Input = document.getElementById('hud-fourier-t0-input');
    const w0Prev = document.getElementById('fourier-w0-preview');
    const calc = state.fourierCalculated || calculateFourierData(state.fourierExpr, state.fourierT0, state.fourierN);
    state.fourierCalculated = calc;

    if (t0Input && document.activeElement !== t0Input) t0Input.value = state.fourierT0;
    if (hudT0Input && document.activeElement !== hudT0Input) hudT0Input.value = state.fourierT0;
    if (w0Prev) w0Prev.textContent = `ω₀=${calc.w0.toFixed(2)}`;

    const fSlider = document.getElementById('fourier-n-slider');
    const badge = document.getElementById('fourier-n-badge');
    if (fSlider) fSlider.value = state.fourierN;
    if (badge) badge.textContent = `N = ${state.fourierN}`;
  }
}

export function setActiveMathField(field) {
  state.activeMathField = field;
}

export function mutateActiveExpr(mutatorFn) {
  if (state.focusHUDActive) {
    const hudInput = document.getElementById('hud-free-input');
    const cur = hudInput ? (hudInput.value || '') : '';
    const next = mutatorFn(cur);
    setHUDExpressionLive(next, true);
  }
}

// ============================================================================
// FLOATING SIGNAL HUD WITH MATHLIVE & REAL-TIME UPDATES
// ============================================================================

let hudCurrentShape = 'rect';
let isSyncingHudMathField = false;
let hudBaseExpression = 'rect(t)';
let lastValidOscResult = null;

export function renderHUDOscilloscope(valRes, target = 'x') {
  const canvas = document.getElementById('hud-oscilloscope-canvas');
  const statusPill = document.getElementById('hud-status-pill');
  const statusDot = document.getElementById('hud-status-dot');
  const statusText = document.getElementById('hud-status-text');
  const supportEl = document.getElementById('hud-osc-support');
  const energyEl = document.getElementById('hud-osc-energy');

  const isValid = Boolean(valRes && (valRes.valid || valRes.isValid));
  const isAllZero = Boolean(valRes && (valRes.isAllZero || (valRes.energy !== undefined && valRes.energy < 1e-4)));

  if (statusPill && statusDot && statusText) {
    if (isValid) {
      statusPill.className = 'inline-flex items-center gap-1 font-bold text-emerald-400';
      statusDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400';
      statusText.textContent = isAllZero ? 'Sinal nulo (0)' : 'Sinal válido';
    } else {
      statusPill.className = 'inline-flex items-center gap-1 font-bold text-amber-400';
      statusDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse';
      statusText.textContent = 'Digitando fórmula...';
    }
  }

  const drawRes = isValid ? valRes : lastValidOscResult;
  if (isValid) {
    lastValidOscResult = valRes;
  }

  if (drawRes) {
    const [sMin, sMax] = drawRes.support || [-1, 1];
    const drawAllZero = Boolean(drawRes.isAllZero || (drawRes.energy !== undefined && drawRes.energy < 1e-4));
    if (supportEl) {
      supportEl.textContent = drawAllZero
        ? 'Suporte: ∅'
        : `Suporte: [${sMin.toFixed(2)}, ${sMax.toFixed(2)}]`;
    }
    if (energyEl) {
      energyEl.textContent = `E = ${(drawRes.energy || 0).toFixed(2)} J`;
    }
  }

  if (!canvas || !drawRes || typeof drawRes.fn !== 'function') return;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(240, rect.width || 360);
  const h = Math.max(54, rect.height || 68);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const isLight = state.theme === 'light' || state.theme === 'projector';
  const gridCol = isLight ? 'rgba(100, 116, 139, 0.22)' : 'rgba(148, 163, 184, 0.16)';
  const axisCol = isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(148, 163, 184, 0.4)';
  const curveCol = target === 'h'
    ? (isLight ? '#e11d48' : '#fb7185')
    : (isLight ? '#0284c7' : '#38bdf8');
  const fillCol = target === 'h'
    ? 'rgba(251, 113, 133, 0.18)'
    : 'rgba(56, 189, 248, 0.18)';

  const T_MIN = -4.0;
  const T_MAX = 4.0;
  const samples = 160;
  let maxAbs = 1.2;
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const tVal = T_MIN + (i / samples) * (T_MAX - T_MIN);
    let yVal = 0;
    try {
      yVal = drawRes.fn(tVal);
      if (!Number.isFinite(yVal)) yVal = 0;
    } catch (_) {
      yVal = 0;
    }
    if (Math.abs(yVal) > maxAbs) maxAbs = Math.min(4.0, Math.abs(yVal) * 1.15);
    pts.push({ t: tVal, y: yVal });
  }

  const toX = (tVal) => ((tVal - T_MIN) / (T_MAX - T_MIN)) * (w - 20) + 10;
  const toY = (yVal) => h * 0.58 - (yVal / maxAbs) * (h * 0.38);
  const yZero = toY(0);

  // Shaded support window
  if (!drawRes.isAllZero && drawRes.support) {
    const sx1 = Math.max(10, toX(drawRes.support[0]));
    const sx2 = Math.min(w - 10, toX(drawRes.support[1]));
    if (sx2 > sx1) {
      ctx.fillStyle = isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.09)';
      ctx.fillRect(sx1, 4, sx2 - sx1, h - 8);
    }
  }

  // Vertical ticks
  ctx.strokeStyle = gridCol;
  ctx.lineWidth = 1;
  for (let tv = -3; tv <= 3; tv += 1) {
    const x = toX(tv);
    ctx.beginPath();
    ctx.moveTo(x, 4);
    ctx.lineTo(x, h - 4);
    ctx.stroke();
  }

  // Zero axes
  ctx.strokeStyle = axisCol;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(6, yZero);
  ctx.lineTo(w - 6, yZero);
  ctx.moveTo(toX(0), 4);
  ctx.lineTo(toX(0), h - 4);
  ctx.stroke();

  // Area fill under curve
  ctx.beginPath();
  ctx.moveTo(toX(pts[0].t), yZero);
  for (let i = 0; i < pts.length; i++) {
    ctx.lineTo(toX(pts[i].t), toY(pts[i].y));
  }
  ctx.lineTo(toX(pts[pts.length - 1].t), yZero);
  ctx.closePath();
  ctx.fillStyle = fillCol;
  ctx.fill();

  // Main signal waveform
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const px = toX(pts[i].t);
    const py = toY(pts[i].y);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = curveCol;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();
}

export function setHUDExpressionLive(exprString, syncMathField = true) {
  const cleanExpr = (exprString || '').trim() || '0';
  const freeInput = document.getElementById('hud-free-input');
  if (freeInput && freeInput.value !== cleanExpr) {
    freeInput.value = cleanExpr;
  }

  if (syncMathField) {
    const mf = document.getElementById('hud-mathfield');
    if (mf) {
      isSyncingHudMathField = true;
      const latexVal = exprToLatex(cleanExpr, 't');
      if (typeof mf.setValue === 'function') {
        mf.setValue(latexVal, { silenceNotifications: true });
      } else {
        mf.value = latexVal;
      }
      isSyncingHudMathField = false;
    }
  }

  const target = state.focusHUDTarget || (state.activeModule === 'ctft' ? 'ctft' : (state.activeModule === 'fourier' ? 'fourier' : 'x'));
  const valRes = validateSignalExpression(cleanExpr);
  renderHUDOscilloscope(valRes, target);

  // Proteção não-destrutiva: mantém o último sinal 3D válido se a expressão estiver incompleta
  if (!valRes.valid && !valRes.isValid) {
    return;
  }

  if (target === 'ctft') {
    state.ctftExpr = cleanExpr;
    state.ctftPresetKey = 'custom_ctft';
    state.ctftCalculated = calculateCTFTData('custom_ctft', state.ctftPulseWidth, state.ctftDecay, state.ctftBridgeT0, state.ctftExpr);
  } else if (target === 'fourier') {
    state.fourierExpr = cleanExpr;
    state.fourierPresetKey = 'custom_fourier';
    state.fourierCalculated = calculateFourierData(state.fourierExpr, state.fourierT0, state.fourierN);
    updateAudioSynth();
  } else if (target === 'h') {
    state.exprH = cleanExpr;
    state.presetKey = 'custom_live';
  } else {
    state.exprX = cleanExpr;
    state.presetKey = 'custom_live';
  }

  syncInputsWithPreset();
  renderPresetGallery();
  updateNotebookUI(false);
  updateScene3D();
}

export function generateParametricExpr(shape, A, W, t0, alpha) {
  const round = (val, d = 2) => {
    const factor = Math.pow(10, d);
    return Math.round(val * factor) / factor;
  };
  const rA = round(A, 2);
  const rW = round(Math.max(0.25, W), 2);
  const rt0 = round(t0, 2);
  const rAlpha = round(Math.max(0.1, alpha), 2);

  const shiftTerm = (shift) => {
    const s = round(shift, 2);
    if (Math.abs(s) < 0.001) return 't';
    return s > 0 ? `(t - ${s})` : `(t + ${-s})`;
  };

  const stepTerm = (shift) => {
    const s = round(shift, 2);
    if (Math.abs(s) < 0.001) return 'u(t)';
    return s > 0 ? `u(t - ${s})` : `u(t + ${-s})`;
  };

  const s0 = shiftTerm(rt0);

  const ampMult = (amp) => {
    if (Math.abs(amp - 1.0) < 0.001) return '';
    if (Math.abs(amp - (-1.0)) < 0.001) return '-';
    return `${amp} * `;
  };

  switch (shape) {
    case 'rect': {
      const inner = rW === 1.0 ? s0 : `${s0} / ${rW}`;
      return `${ampMult(rA)}rect(${inner})`;
    }
    case 'tri': {
      const inner = rW === 1.0 ? s0 : `${s0} / ${rW}`;
      return `${ampMult(rA)}tri(${inner})`;
    }
    case 'pulse': {
      const tEnd = round(rt0 + rW, 2);
      return `${ampMult(rA)}(${stepTerm(rt0)} - ${stepTerm(tEnd)})`;
    }
    case 'u':
    case 'step': {
      return `${ampMult(rA)}${stepTerm(rt0)}`;
    }
    case 'exp': {
      const uT = stepTerm(rt0);
      const expTerm = rAlpha === 1.0 ? `e^(-${s0})` : `e^(-${rAlpha} * ${s0})`;
      return `${ampMult(rA)}${expTerm} * ${uT}`;
    }
    case 'ramp': {
      const tEnd = round(rt0 + rW, 2);
      const slope = round(rA / rW, 2);
      const pulse = `(${stepTerm(rt0)} - ${stepTerm(tEnd)})`;
      const slopeStr = slope === 1.0 ? '' : (slope === -1.0 ? '-' : `${slope} * `);
      return `${slopeStr}${s0} * ${pulse}`;
    }
    case 'sin': {
      const tEnd = round(rt0 + rW, 2);
      const pulse = `(${stepTerm(rt0)} - ${stepTerm(tEnd)})`;
      const wFactor = round(2 / rW, 2);
      const wStr = wFactor === 1.0 ? 'pi' : (wFactor === 2.0 ? '2*pi' : `${wFactor}*pi`);
      const inner = Math.abs(rt0) < 0.001 ? `${wStr} * t` : `${wStr} * ${s0}`;
      return `${ampMult(rA)}sin(${inner}) * ${pulse}`;
    }
    default:
      return `${ampMult(rA)}rect(${s0})`;
  }
}

export function generateParametricPreview(shape, A, W, t0, alpha) {
  const round = (val, d = 2) => {
    const factor = Math.pow(10, d);
    return Math.round(val * factor) / factor;
  };
  const rA = round(A, 2);
  const rW = round(Math.max(0.25, W), 2);
  const rt0 = round(t0, 2);
  const rAlpha = round(Math.max(0.1, alpha), 2);

  const expr = generateParametricExpr(shape, A, W, t0, alpha);

  const formatShiftLatex = (shift) => {
    const s = round(shift, 2);
    if (Math.abs(s) < 0.001) return 't';
    return s > 0 ? `t - ${s}` : `t + ${-s}`;
  };

  const ampLatex = (amp) => {
    if (Math.abs(amp - 1.0) < 0.001) return '';
    if (Math.abs(amp - (-1.0)) < 0.001) return '-';
    return `${amp}\\cdot `;
  };

  let latex = '';
  let support = '';

  const s0L = formatShiftLatex(rt0);
  const s0Par = Math.abs(rt0) < 0.001 ? 't' : `(${s0L})`;

  switch (shape) {
    case 'rect': {
      latex = rW === 1.0 ? `${ampLatex(rA)}\\mathrm{rect}(${s0Par})` : `${ampLatex(rA)}\\mathrm{rect}\\left(\\frac{${s0L}}{${rW}}\\right)`;
      const a = (rt0 - rW / 2).toFixed(2);
      const b = (rt0 + rW / 2).toFixed(2);
      support = `t \\in [${a},\\, ${b}]`;
      break;
    }
    case 'tri': {
      latex = rW === 1.0 ? `${ampLatex(rA)}\\mathrm{tri}(${s0Par})` : `${ampLatex(rA)}\\mathrm{tri}\\left(\\frac{${s0L}}{${rW}}\\right)`;
      const a = (rt0 - rW).toFixed(2);
      const b = (rt0 + rW).toFixed(2);
      support = `t \\in [${a},\\, ${b}]`;
      break;
    }
    case 'pulse': {
      const tEnd = round(rt0 + rW, 2);
      const tEndL = formatShiftLatex(tEnd);
      latex = `${ampLatex(rA)}\\left[u(${s0L}) - u(${tEndL})\\right]`;
      support = `t \\in [${rt0.toFixed(2)},\\, ${tEnd.toFixed(2)}]`;
      break;
    }
    case 'u':
    case 'step': {
      latex = `${ampLatex(rA)}u(${s0L})`;
      support = `t \\ge ${rt0.toFixed(2)}`;
      break;
    }
    case 'exp': {
      const expL = rAlpha === 1.0 ? `e^{-${s0Par}}` : `e^{-${rAlpha}${s0Par}}`;
      latex = `${ampLatex(rA)}${expL}u(${s0L})`;
      support = `t \\ge ${rt0.toFixed(2)}`;
      break;
    }
    case 'ramp': {
      const tEnd = round(rt0 + rW, 2);
      const tEndL = formatShiftLatex(tEnd);
      const slope = round(rA / rW, 2);
      const slopeL = slope === 1.0 ? '' : (slope === -1.0 ? '-' : `${slope}\\cdot `);
      latex = `${slopeL}${s0Par}\\left[u(${s0L}) - u(${tEndL})\\right]`;
      support = `t \\in [${rt0.toFixed(2)},\\, ${tEnd.toFixed(2)}]`;
      break;
    }
    case 'sin': {
      const tEnd = round(rt0 + rW, 2);
      const tEndL = formatShiftLatex(tEnd);
      latex = `${ampLatex(rA)}\\sin\\left(\\frac{2\\pi}{${rW}}${s0Par}\\right)\\left[u(${s0L}) - u(${tEndL})\\right]`;
      support = `t \\in [${rt0.toFixed(2)},\\, ${tEnd.toFixed(2)}]`;
      break;
    }
    default:
      latex = `${ampLatex(rA)}\\mathrm{rect}(${s0Par})`;
      support = 't \\in [-1.00,\\, 1.00]';
  }

  return { expr, latex, support };
}

export function updateHUDTitle() {
  const dotEl = document.getElementById('hud-target-dot');
  const varPrefixEl = document.getElementById('hud-var-prefix');
  const fourierT0Wrap = document.getElementById('hud-fourier-t0-wrap');

  const target = state.focusHUDTarget || 'x';
  if (fourierT0Wrap) {
    fourierT0Wrap.classList.toggle('hidden', target !== 'fourier');
    fourierT0Wrap.classList.toggle('flex', target === 'fourier');
  }

  if (target === 'fourier') {
    if (dotEl) dotEl.style.backgroundColor = 'var(--c-x1)';
    if (varPrefixEl) {
      varPrefixEl.textContent = 'f(t) =';
      varPrefixEl.style.color = 'var(--c-x1)';
    }
  } else if (target === 'h') {
    if (dotEl) dotEl.style.backgroundColor = 'var(--c-x2)';
    if (varPrefixEl) {
      varPrefixEl.textContent = 'h(t) =';
      varPrefixEl.style.color = 'var(--c-x2)';
    }
  } else {
    if (dotEl) dotEl.style.backgroundColor = 'var(--c-x1)';
    if (varPrefixEl) {
      varPrefixEl.textContent = 'x(t) =';
      varPrefixEl.style.color = 'var(--c-x1)';
    }
  }
}

export function combineParametricExpression(baseExpr, blockExpr, mode) {
  if (mode === 'replace' || !baseExpr || baseExpr.trim() === '0') {
    return blockExpr;
  }
  const cleanBase = baseExpr.trim();
  if (mode === 'add') {
    return `${cleanBase} + ${blockExpr}`;
  }
  if (mode === 'sub') {
    return `${cleanBase} - (${blockExpr})`;
  }
  return blockExpr;
}

export function updateParametricHUDPreview(commitLive = false) {
  const aVal = parseFloat(document.getElementById('hud-slider-a')?.value || '1.0');
  const wVal = parseFloat(document.getElementById('hud-slider-w')?.value || '2.0');
  const t0Val = parseFloat(document.getElementById('hud-slider-t0')?.value || '0.0');
  const alphaVal = parseFloat(document.getElementById('hud-slider-alpha')?.value || '1.0');

  const badgeA = document.getElementById('hud-badge-a');
  const badgeW = document.getElementById('hud-badge-w');
  const badgeT0 = document.getElementById('hud-badge-t0');
  const badgeAlpha = document.getElementById('hud-badge-alpha');

  if (badgeA) badgeA.textContent = `A = ${aVal.toFixed(2)}`;
  if (badgeW) badgeW.textContent = `W = ${wVal.toFixed(2)}`;
  if (badgeT0) badgeT0.textContent = `t₀ = ${t0Val.toFixed(2)}`;
  if (badgeAlpha) badgeAlpha.textContent = `α = ${alphaVal.toFixed(2)}`;

  const rowW = document.getElementById('hud-row-w');
  const rowAlpha = document.getElementById('hud-row-alpha');
  if (rowW) {
    rowW.style.display = (hudCurrentShape === 'u' || hudCurrentShape === 'step') ? 'none' : 'flex';
  }
  if (rowAlpha) {
    rowAlpha.style.display = (hudCurrentShape === 'exp') ? 'flex' : 'none';
  }

  const { expr } = generateParametricPreview(hudCurrentShape, aVal, wVal, t0Val, alphaVal);

  if (commitLive) {
    const mode = state.hudBuildMode || 'replace';
    const nextExpr = combineParametricExpression(hudBaseExpression, expr, mode);
    setHUDExpressionLive(nextExpr, true);
  }
}

export function openSignalHUD(targetSignal) {
  const isFourier = state.activeModule === 'fourier';
  const isCTFT = state.activeModule === 'ctft';
  let target = targetSignal;
  if (!target) {
    target = isCTFT ? 'ctft' : (isFourier ? 'fourier' : 'x');
  }

  if (target === 'ctft' && state.activeModule !== 'ctft') {
    switchModule('ctft');
  } else if (target === 'fourier' && state.activeModule !== 'fourier') {
    switchModule('fourier');
  } else if ((target === 'x' || target === 'h') && state.activeModule !== 'convolution') {
    switchModule('convolution');
  }

  state.focusHUDActive = true;
  state.focusHUDTarget = target;

  const backdrop = document.getElementById('stage-focus-backdrop');
  const hud = document.getElementById('signal-focus-hud');
  if (backdrop) backdrop.classList.remove('hidden');
  if (hud) {
    hud.classList.remove('hidden');
    hud.style.transform = '';
  }

  document.body.classList.add('stage-focus-active');
  document.body.classList.add('focus-hud-open');
  document.body.classList.remove('mathlive-kb-visible');

  // Garante que o teclado virtual NÃO abra sozinho ao abrir o HUD
  if (window.mathVirtualKeyboard && typeof window.mathVirtualKeyboard.hide === 'function') {
    try {
      window.mathVirtualKeyboard.hide();
    } catch (_) {}
  }

  const pillX = document.getElementById('hud-pill-x');
  const pillH = document.getElementById('hud-pill-h');
  const pillFourier = document.getElementById('hud-pill-fourier');
  const pillCTFT = document.getElementById('hud-pill-ctft');

  const currMod = state.activeModule;
  if (pillX && pillH && pillFourier) {
    pillX.classList.toggle('hidden', currMod !== 'convolution');
    pillH.classList.toggle('hidden', currMod !== 'convolution');
    pillFourier.classList.toggle('hidden', currMod !== 'fourier');
    if (pillCTFT) pillCTFT.classList.toggle('hidden', currMod !== 'ctft');

    pillX.classList.toggle('active', target === 'x');
    pillH.classList.toggle('active', target === 'h');
    pillFourier.classList.toggle('active', target === 'fourier');
    if (pillCTFT) pillCTFT.classList.toggle('active', target === 'ctft');
  }

  const hudT0Input = document.getElementById('hud-fourier-t0-input');
  if (hudT0Input) {
    hudT0Input.value = state.fourierT0;
  }

  updateHUDTitle();

  const currentExpr = target === 'ctft'
    ? (state.ctftExpr || 'rect(t/2)')
    : (target === 'fourier'
      ? state.fourierExpr
      : (target === 'h' ? state.exprH : state.exprX));

  hudBaseExpression = currentExpr || 'rect(t)';
  const freeInput = document.getElementById('hud-free-input');
  if (freeInput) {
    freeInput.value = hudBaseExpression;
  }

  const mf = document.getElementById('hud-mathfield');
  if (mf) {
    isSyncingHudMathField = true;
    const latexStr = exprToLatex(hudBaseExpression, 't');
    if (typeof mf.setValue === 'function') {
      mf.setValue(latexStr, { silenceNotifications: true });
    } else {
      mf.value = latexStr;
    }
    isSyncingHudMathField = false;
    try {
      mf.blur();
    } catch (_) {}
  }

  const valRes = validateSignalExpression(hudBaseExpression);
  renderHUDOscilloscope(valRes, target);
  updateParametricHUDPreview(false);
  updateScene3D();
}

export function closeSignalHUD() {
  state.focusHUDActive = false;
  const backdrop = document.getElementById('stage-focus-backdrop');
  const hud = document.getElementById('signal-focus-hud');
  if (backdrop) backdrop.classList.add('hidden');
  if (hud) {
    hud.classList.add('hidden');
    hud.style.transform = '';
  }

  document.body.classList.remove('stage-focus-active');
  document.body.classList.remove('focus-hud-open');
  document.body.classList.remove('mathlive-kb-visible');

  if (window.mathVirtualKeyboard && typeof window.mathVirtualKeyboard.hide === 'function') {
    try {
      window.mathVirtualKeyboard.hide();
    } catch (_) {}
  }

  updateScene3D();
}

export function applySignalHUD() {
  const freeInput = document.getElementById('hud-free-input');
  const chosenExpr = (freeInput && freeInput.value.trim()) ? freeInput.value.trim() : 'rect(t)';
  setHUDExpressionLive(chosenExpr, true);
  updateNotebookUI(true);
  closeSignalHUD();
}

export function pinSignalHUD() {
  const target = state.focusHUDTarget || (state.activeModule === 'fourier' ? 'fourier' : 'x');
  const freeInput = document.getElementById('hud-free-input');
  const chosenExpr = (freeInput && freeInput.value.trim()) ? freeInput.value.trim() : 'rect(t)';
  setHUDExpressionLive(chosenExpr, true);

  if (target === 'fourier') {
    const id = 'custom_' + Date.now();
    const count = state.fourierCustomPresets.length + 1;
    saveCustomPreset({
      id,
      title: `${I18N.pt.savedPreset}${count}`,
      titleEn: `${I18N.en.savedPreset}${count}`,
      subtitle: I18N.pt.customSignal,
      subtitleEn: I18N.en.customSignal,
      expr: state.fourierExpr,
      T0: state.fourierT0,
      N: state.fourierN,
      isCustom: true
    }, 'fourier');
  } else {
    const id = 'custom_' + Date.now();
    const count = state.customPresets.length + 1;
    saveCustomPreset({
      id,
      shortTitle: `${I18N.pt.savedPreset}${count}`,
      shortTitleEn: `${I18N.en.savedPreset}${count}`,
      subtitle: I18N.pt.customSignal,
      subtitleEn: I18N.en.customSignal,
      exprX: state.exprX,
      exprH: state.exprH,
      isCustom: true
    }, 'convolution');
  }

  syncInputsWithPreset();
  renderPresetGallery();
  updateNotebookUI(true);
  closeSignalHUD();
}

/**
 * Rolagem horizontal fluida da barra de ferramentas/acessibilidade
 * Suporta roda do mouse (wheel -> scrollLeft) e clique-e-arrasto (drag-to-scroll).
 */
export function setupA11yBarScroll(a11yBar) {
  if (!a11yBar) return;

  // 1. Mouse Wheel: converte deltaY vertical em rolagem horizontal scrollLeft
  a11yBar.addEventListener('wheel', (e) => {
    if (a11yBar.scrollWidth > a11yBar.clientWidth) {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      a11yBar.scrollLeft += delta * 0.9;
      e.preventDefault();
    }
  }, { passive: false });

  // 2. Drag-to-scroll: clique e arraste com o mouse
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let hasDragged = false;

  a11yBar.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDown = true;
    hasDragged = false;
    startX = e.pageX - a11yBar.offsetLeft;
    scrollLeft = a11yBar.scrollLeft;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - a11yBar.offsetLeft;
    const walk = x - startX;
    if (Math.abs(walk) > 4) {
      hasDragged = true;
      a11yBar.classList.add('grabbing');
      a11yBar.scrollLeft = scrollLeft - walk;
    }
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    a11yBar.classList.remove('grabbing');
  });

  // Intercepta e previne cliques acidentais em botões caso o usuário tenha arrastado a barra
  a11yBar.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged = false;
    }
  }, true);
}

/**
 * Configuração dos layouts do Teclado Virtual MathLive Completo
 * Inclui layouts padrão ('numeric', 'functions', 'symbols', 'alphabetic')
 * mais a camada dedicada de engenharia 'Sinais'.
 */
export function setupMathLiveVirtualKeyboard() {
  if (typeof window === 'undefined') return;

  const configureMVK = () => {
    if (!window.mathVirtualKeyboard) return;
    try {
      window.mathVirtualKeyboard.layouts = [
        {
          label: 'Sinais',
          tooltip: 'Sinais & Engenharia (UFPA)',
          rows: [
            [
              { latex: 'u(t)', insert: 'u(t)' },
              { latex: '\\operatorname{rect}(t)', insert: '\\operatorname{rect}(t)' },
              { latex: '\\operatorname{tri}(t)', insert: '\\operatorname{tri}(t)' },
              { latex: '\\delta(t)', insert: '\\delta(t)' },
              { latex: '\\operatorname{sinc}(t)', insert: '\\operatorname{sinc}(t)' },
              { latex: 'r(t)', insert: 'r(t)' }
            ],
            [
              { latex: 'e^{-t}', insert: 'e^{-t}' },
              { latex: 'e^{-2t}u(t)', insert: 'e^{-2t}u(t)' },
              { latex: 't', insert: 't' },
              { latex: '\\tau', insert: '\\tau' },
              { latex: '\\omega_0', insert: '\\omega_0' },
              { latex: '\\pi', insert: '\\pi' }
            ]
          ]
        },
        'default'
      ];
    } catch (err) {
      console.warn('[MathLive] Falha ao configurar layouts personalizados:', err);
    }
  };

  if (window.mathVirtualKeyboard) {
    configureMVK();
  } else {
    window.addEventListener('DOMContentLoaded', configureMVK, { once: true });
    window.addEventListener('load', configureMVK, { once: true });
  }
}

/**
 * Gestos físicos de arrasto e flick com velocidade (Emil Kowalski)
 * para o painel inferior no mobile (.sheet-drag-handle-bar) e para o cabeçalho do HUD.
 */
export function setupMobileSheetGestures() {
  if (typeof window === 'undefined') return;

  // 1. Gaveta Inferior Mobile (#ui-panel via .sheet-drag-handle-bar)
  const handleBar = document.querySelector('.sheet-drag-handle-bar');
  const stageWrapper = document.getElementById('stage-wrapper');
  if (handleBar && stageWrapper) {
    let startY = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocityY = 0;
    let dragging = false;

    const applySheetSnap = (snap) => {
      state.mobileSheetSnap = snap;
      document.body.classList.remove('sheet-snap-peek', 'sheet-snap-expanded');
      if (snap === 'peek') document.body.classList.add('sheet-snap-peek');
      else if (snap === 'expanded') document.body.classList.add('sheet-snap-expanded');
      setTimeout(() => window.dispatchEvent(new Event('resize')), 260);
    };

    handleBar.addEventListener('pointerdown', (e) => {
      dragging = true;
      startY = e.clientY;
      lastY = e.clientY;
      lastTime = performance.now();
      velocityY = 0;
      handleBar.setPointerCapture?.(e.pointerId);
    });

    handleBar.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      velocityY = ((e.clientY - lastY) / dt) * 1000; // px/s
      lastY = e.clientY;
      lastTime = now;
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      const dy = (e.clientY || lastY) - startY;
      const cur = state.mobileSheetSnap || 'default';
      if (velocityY < -420 || dy < -50) {
        applySheetSnap(cur === 'peek' ? 'default' : 'expanded');
      } else if (velocityY > 420 || dy > 50) {
        applySheetSnap(cur === 'expanded' ? 'default' : 'peek');
      }
    };

    handleBar.addEventListener('pointerup', endDrag);
    handleBar.addEventListener('pointercancel', endDrag);
  }

  // 2. Arrasto para Baixo (Dismiss com Flick) no Cabeçalho do HUD (#hud-drag-header)
  const hudHeader = document.getElementById('hud-drag-header');
  const hudEl = document.getElementById('signal-focus-hud');
  if (hudHeader && hudEl) {
    let startY = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocityY = 0;
    let draggingHud = false;

    hudHeader.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || e.target.closest('input')) return;
      draggingHud = true;
      startY = e.clientY;
      lastY = e.clientY;
      lastTime = performance.now();
      velocityY = 0;
      hudHeader.setPointerCapture?.(e.pointerId);
    });

    hudHeader.addEventListener('pointermove', (e) => {
      if (!draggingHud) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      velocityY = ((e.clientY - lastY) / dt) * 1000;
      lastY = e.clientY;
      lastTime = now;
      const dy = Math.max(0, e.clientY - startY);
      if (window.innerWidth < 768) {
        hudEl.style.transform = `translateY(${dy * 0.65}px)`;
      }
    });

    const finishHudDrag = (e) => {
      if (!draggingHud) return;
      draggingHud = false;
      const dy = (e.clientY || lastY) - startY;
      if (velocityY > 520 || dy > 95) {
        closeSignalHUD();
      } else {
        hudEl.style.transform = '';
      }
    };

    hudHeader.addEventListener('pointerup', finishHudDrag);
    hudHeader.addEventListener('pointercancel', finishHudDrag);
  }
}

export function initUIEventListeners() {
  // 1. Segmented Control Switcher
  const btnConv = document.getElementById('mod-btn-conv');
  const btnFourier = document.getElementById('mod-btn-fourier');
  const btnCTFT = document.getElementById('mod-btn-ctft');
  if (btnConv) btnConv.addEventListener('click', () => switchModule('convolution'));
  if (btnFourier) btnFourier.addEventListener('click', () => switchModule('fourier'));
  if (btnCTFT) btnCTFT.addEventListener('click', () => switchModule('ctft'));

  const zenBtnConv = document.getElementById('zen-btn-conv');
  const zenBtnFourier = document.getElementById('zen-btn-fourier');
  const zenBtnCTFT = document.getElementById('zen-btn-ctft');
  if (zenBtnConv) zenBtnConv.addEventListener('click', () => switchModule('convolution'));
  if (zenBtnFourier) zenBtnFourier.addEventListener('click', () => switchModule('fourier'));
  if (zenBtnCTFT) zenBtnCTFT.addEventListener('click', () => switchModule('ctft'));

  // 2. Vistas de Câmera 3D/2D
  ['3d', '2d-time', '2d-spec', 'top'].forEach(presetName => {
    const btn = document.getElementById(`btn-cam-${presetName}`);
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setCameraPreset(presetName);
      });
    }
  });

  // 3. Passos 1 a 4
  document.querySelectorAll('.step-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = Number(btn.getAttribute('data-step'));
      state.isPlaying = true;
      updatePlayButtonUI();
      setStep(s, true);
    });
  });
  document.querySelectorAll('.zen-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = Number(btn.getAttribute('data-step'));
      state.isPlaying = true;
      updatePlayButtonUI();
      setStep(s, true);
    });
  });

  // 4. Play / Pause
  document.querySelectorAll('.play-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.isPlaying = !state.isPlaying;
      updatePlayButtonUI();
    });
  });

  // 5. Sliders
  const tSlider = document.getElementById('t-slider');
  if (tSlider) {
    tSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (state.activeModule === 'ctft') {
        if (state.step === 4) {
          state.ctftBridgeT0 = val;
          state.ctftCalculated = calculateCTFTData(state.ctftPresetKey, state.ctftPulseWidth, state.ctftDecay, state.ctftBridgeT0);
        } else if (state.step === 3) {
          state.t = val;
        } else {
          state.ctftPulseWidth = val;
          state.ctftCalculated = calculateCTFTData(state.ctftPresetKey, state.ctftPulseWidth, state.ctftDecay, state.ctftBridgeT0);
        }
      } else if (state.activeModule === 'fourier') {
        state.t = val;
      } else {
        if (state.step === 1) state.tauSweep = val;
        else if (state.step === 2) state.flipAngle = val;
        else state.t = val;
      }
      updateSliderBadge();
      updateNotebookUI(false);
      updateScene3D();
    });
  }

  const fourierSlider = document.getElementById('fourier-n-slider');
  if (fourierSlider) {
    fourierSlider.addEventListener('input', (e) => {
      state.fourierN = parseInt(e.target.value, 10);
      const badge = document.getElementById('fourier-n-badge');
      if (badge) badge.textContent = `N = ${state.fourierN}`;
      state.fourierCalculated = calculateFourierData(state.fourierExpr, state.fourierT0, state.fourierN);
      updateNotebookUI(false);
      updateScene3D();
      updateAudioSynth();
    });
  }

  const applyFourierT0 = (rawVal) => {
    const num = parseFloat(rawVal);
    if (!Number.isFinite(num) || num < 0.5) return;
    state.fourierT0 = num;
    state.fourierCalculated = calculateFourierData(state.fourierExpr, state.fourierT0, state.fourierN);
    syncInputsWithPreset();
    renderPresetGallery();
    updateNotebookUI(false);
    updateScene3D();
    updateAudioSynth();
  };

  const fourierT0Input = document.getElementById('fourier-t0-input');
  if (fourierT0Input) {
    fourierT0Input.addEventListener('change', (e) => applyFourierT0(e.target.value));
    fourierT0Input.addEventListener('input', (e) => applyFourierT0(e.target.value));
  }

  const hudFourierT0Input = document.getElementById('hud-fourier-t0-input');
  if (hudFourierT0Input) {
    hudFourierT0Input.addEventListener('change', (e) => applyFourierT0(e.target.value));
    hudFourierT0Input.addEventListener('input', (e) => applyFourierT0(e.target.value));
  }

  // 6. Formas de Fourier (Compacta / Trigonométrica / Exponencial)
  ['compact', 'trig', 'exp'].forEach(fKey => {
    const btn = document.getElementById(`btn-form-${fKey}`);
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.fourier-form-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.fourierForm = fKey;
        updateNotebookUI(false);
        updateScene3D();
      });
    }
  });

  // 7. Áudio Web
  const btnAudio = document.getElementById('btn-audio-toggle');
  if (btnAudio) {
    btnAudio.addEventListener('click', () => {
      const enabled = toggleAudio();
      btnAudio.classList.toggle('active', enabled);
      btnAudio.style.borderColor = enabled ? 'var(--c-conv)' : '';
      btnAudio.style.color = enabled ? 'var(--c-conv)' : '';
    });
  }

  // 8. Modo Foco / Zen
  const btnZen = document.getElementById('btn-zen-mode');
  const zenExitBtn = document.getElementById('zen-exit-btn');
  const toggleZen = () => {
    state.zenMode = !state.zenMode;
    document.body.classList.toggle('zen-mode', state.zenMode);
    if (btnZen) btnZen.classList.toggle('active', state.zenMode);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 260);
  };
  if (btnZen) btnZen.addEventListener('click', toggleZen);
  if (zenExitBtn) zenExitBtn.addEventListener('click', toggleZen);

  // 9. Popover de Camadas
  const layersBtn = document.getElementById('btn-layers-toggle');
  const layersPopover = document.getElementById('layers-popover');
  if (layersBtn && layersPopover) {
    layersBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      layersPopover.classList.toggle('hidden');
    });
    window.addEventListener('click', (e) => {
      if (!layersPopover.contains(e.target) && !layersBtn.contains(e.target)) {
        layersPopover.classList.add('hidden');
      }
    });
  }

  ['waterfall', 'labels', 'spectrumWall', 'grid', 'thickStroke'].forEach(layerKey => {
    const cb = document.getElementById(`layer-cb-${layerKey}`);
    if (cb) {
      cb.checked = state.layers[layerKey];
      cb.addEventListener('change', () => {
        state.layers[layerKey] = cb.checked;
        saveStatePreferences();
        updateScene3D();
      });
    }
  });

  // 10. Popover de Configurações (Popover API Nativo + Fallback Gracioso - Modern Web Guidance)
  const settingsBtn = document.getElementById('btn-settings-toggle');
  const settingsPopover = document.getElementById('settings-popover');
  if (settingsBtn && settingsPopover) {
    const supportsPopover = 'popover' in HTMLElement.prototype;
    if (supportsPopover) {
      settingsPopover.classList.remove('hidden');
      settingsPopover.addEventListener('beforetoggle', (e) => {
        settingsBtn.classList.toggle('active', e.newState === 'open');
      });
    } else {
      settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = settingsPopover.classList.contains('hidden');
        settingsPopover.classList.toggle('hidden', !isHidden);
        settingsBtn.classList.toggle('active', isHidden);
      });
      window.addEventListener('click', (e) => {
        if (!settingsPopover.contains(e.target) && !settingsBtn.contains(e.target)) {
          settingsPopover.classList.add('hidden');
          settingsBtn.classList.remove('active');
        }
      });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !settingsPopover.classList.contains('hidden')) {
          settingsPopover.classList.add('hidden');
          settingsBtn.classList.remove('active');
        }
      });
    }
  }

  // Temas (Popover + Botão Ciclista Animado na Barra de Acessibilidade)
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.getAttribute('data-theme'), true);
    });
  });

  const themeCycleBtn = document.getElementById('btn-theme-cycle');
  if (themeCycleBtn) {
    themeCycleBtn.addEventListener('click', () => {
      const order = ['projector', 'dark', 'light'];
      const curIdx = order.indexOf(state.theme || 'projector');
      const nextTheme = order[(curIdx + 1) % order.length];
      applyTheme(nextTheme, true);
    });
  }

  // Idioma (Barra de Acessibilidade + Popover de Configurações)
  const langBtn = document.getElementById('btn-lang-toggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      applyLanguage(state.lang === 'pt' ? 'en' : 'pt');
    });
  }
  document.querySelectorAll('.lang-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetLang = btn.getAttribute('data-lang');
      if (targetLang) applyLanguage(targetLang);
    });
  });

  // Velocidade da Animação
  ['0.5', '1.0', '2.0'].forEach(spd => {
    const btn = document.getElementById(`spd-btn-${spd}`);
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.spd-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.animSpeed = parseFloat(spd);
      });
    }
  });

  // Acessibilidade (A11y): Controles da Barra Dedicada
  document.getElementById('btn-font-dec')?.addEventListener('click', () => {
    setFontScale(state.fontScale - 0.1);
  });
  document.getElementById('btn-font-reset')?.addEventListener('click', () => {
    setFontScale(1.0);
  });
  document.getElementById('btn-font-inc')?.addEventListener('click', () => {
    setFontScale(state.fontScale + 0.1);
  });
  document.getElementById('btn-a11y-contrast')?.addEventListener('click', () => {
    toggleHighContrast();
  });
  document.getElementById('btn-a11y-motion')?.addEventListener('click', () => {
    toggleReduceMotion();
  });

  // Inicializa estado visual de Acessibilidade, Gestos e Teclado MathLive
  setFontScale(state.fontScale);
  toggleHighContrast(state.a11yHighContrast);
  toggleReduceMotion(state.a11yReduceMotion);
  setupA11yBarScroll(document.getElementById('a11y-bar'));
  setupMathLiveVirtualKeyboard();
  setupMobileSheetGestures();

  // 11. Filtros de Personalização de Seções ("Mostrar no Painel" dentro de Configurações)
  ['notebook', 'regions', 'gallery'].forEach(secKey => {
    const pill = document.getElementById(`filter-pill-${secKey}`);
    if (pill) {
      toggleSectionVisibility(secKey, state.visibleSections[secKey]);
      pill.addEventListener('click', () => {
        toggleSectionVisibility(secKey);
      });
    }
  });

  // 12. Evento Disparado ao Clicar nas Curvas 3D ou Rótulos Flutuantes na Simulação
  window.addEventListener('open-signal-hud', (e) => {
    const target = e.detail?.target;
    openSignalHUD(target);
  });

  // Alternadores de Sinal no Cabeçalho do HUD
  document.getElementById('hud-pill-x')?.addEventListener('click', () => openSignalHUD('x'));
  document.getElementById('hud-pill-h')?.addEventListener('click', () => openSignalHUD('h'));
  document.getElementById('hud-pill-fourier')?.addEventListener('click', () => openSignalHUD('fourier'));
  document.getElementById('hud-pill-ctft')?.addEventListener('click', () => openSignalHUD('ctft'));

  // Fechamento e Salvamento no Cabeçalho do HUD
  document.getElementById('hud-btn-close')?.addEventListener('click', () => closeSignalHUD());
  document.getElementById('stage-focus-backdrop')?.addEventListener('click', () => closeSignalHUD());
  document.getElementById('hud-btn-pin')?.addEventListener('click', () => pinSignalHUD());

  // Ciclo Natural de Foco do <math-field id="hud-mathfield">:
  // O teclado virtual MathLive abre SOMENTE quando o usuário foca/toca na fórmula
  const hudMathField = document.getElementById('hud-mathfield');
  if (hudMathField) {
    const handleMathFieldFocus = () => {
      document.body.classList.add('mathlive-kb-visible');
      if (window.mathVirtualKeyboard) {
        try {
          if (typeof window.mathVirtualKeyboard.show === 'function') {
            window.mathVirtualKeyboard.show();
          } else {
            window.mathVirtualKeyboard.visible = true;
          }
        } catch (err) {
          console.warn('[MathLive] Erro ao abrir teclado:', err);
        }
      }
    };

    const handleMathFieldBlur = () => {
      document.body.classList.remove('mathlive-kb-visible');
      if (window.mathVirtualKeyboard && typeof window.mathVirtualKeyboard.hide === 'function') {
        try {
          window.mathVirtualKeyboard.hide();
        } catch (_) {}
      }
    };

    hudMathField.addEventListener('focusin', handleMathFieldFocus);
    hudMathField.addEventListener('focus', handleMathFieldFocus);
    hudMathField.addEventListener('pointerdown', handleMathFieldFocus);
    hudMathField.addEventListener('click', handleMathFieldFocus);
    hudMathField.addEventListener('focusout', handleMathFieldBlur);
    hudMathField.addEventListener('blur', handleMathFieldBlur);

    hudMathField.addEventListener('input', () => {
      if (isSyncingHudMathField) return;
      const rawLatex = typeof hudMathField.getValue === 'function' ? hudMathField.getValue() : (hudMathField.value || '');
      const parsedExpr = latexToExpr(rawLatex);
      if (parsedExpr) {
        hudBaseExpression = parsedExpr;
        setHUDExpressionLive(parsedExpr, false);
      }
    });
  }

  // Interagir com o construtor paramétrico fecha o teclado virtual automaticamente
  const hudParamSection = document.getElementById('hud-parametric-section');
  if (hudParamSection) {
    hudParamSection.addEventListener('pointerdown', () => {
      document.body.classList.remove('mathlive-kb-visible');
      if (hudMathField && document.activeElement === hudMathField) {
        try {
          hudMathField.blur();
        } catch (_) {}
      }
      if (window.mathVirtualKeyboard && typeof window.mathVirtualKeyboard.hide === 'function') {
        try {
          window.mathVirtualKeyboard.hide();
        } catch (_) {}
      }
    });
  }

  // Botões de Apagar e Limpar na Linha de Equação do HUD
  document.getElementById('hud-key-backspace')?.addEventListener('click', () => {
    if (hudMathField) {
      if (typeof hudMathField.executeCommand === 'function') {
        hudMathField.executeCommand(['deleteBackward']);
      } else {
        const val = hudMathField.value || '';
        hudMathField.value = val.slice(0, -1);
      }
      const rawLatex = typeof hudMathField.getValue === 'function' ? hudMathField.getValue() : (hudMathField.value || '');
      const parsedExpr = latexToExpr(rawLatex) || '0';
      hudBaseExpression = parsedExpr;
      setHUDExpressionLive(parsedExpr, false);
    }
  });

  document.getElementById('hud-key-clear')?.addEventListener('click', () => {
    hudBaseExpression = '0';
    if (hudMathField) {
      if (typeof hudMathField.setValue === 'function') {
        hudMathField.setValue('');
      } else {
        hudMathField.value = '';
      }
      setHUDExpressionLive('0', false);
    }
  });

  // Seletor de Modo de Construção (= Substituir | + Somar | − Subtrair)
  const commitBlockBtn = document.getElementById('hud-btn-commit-block');
  document.querySelectorAll('.hud-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.hud-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode') || 'replace';
      state.hudBuildMode = mode;
      const freeInput = document.getElementById('hud-free-input');
      if (freeInput && freeInput.value.trim()) {
        hudBaseExpression = freeInput.value.trim();
      }
      if (commitBlockBtn) {
        commitBlockBtn.classList.toggle('hidden', mode === 'replace');
      }
    });
  });

  if (commitBlockBtn) {
    commitBlockBtn.addEventListener('click', () => {
      updateParametricHUDPreview(true);
      const freeInput = document.getElementById('hud-free-input');
      if (freeInput && freeInput.value.trim()) {
        hudBaseExpression = freeInput.value.trim();
      }
    });
  }

  // Pílulas de Formas Canônicas (aplicam em tempo real)
  document.querySelectorAll('.hud-shape-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.hud-shape-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      hudCurrentShape = pill.getAttribute('data-shape') || 'rect';
      updateParametricHUDPreview(true);
      if ((state.hudBuildMode || 'replace') === 'replace') {
        const freeInput = document.getElementById('hud-free-input');
        if (freeInput) hudBaseExpression = freeInput.value.trim();
      }
    });
  });

  // Sliders Paramétricos do HUD (aplicam em tempo real)
  ['hud-slider-a', 'hud-slider-w', 'hud-slider-t0', 'hud-slider-alpha'].forEach(sliderId => {
    document.getElementById(sliderId)?.addEventListener('input', () => {
      updateParametricHUDPreview(true);
      if ((state.hudBuildMode || 'replace') === 'replace') {
        const freeInput = document.getElementById('hud-free-input');
        if (freeInput) hudBaseExpression = freeInput.value.trim();
      }
    });
  });

  // Input de Equação Livre do HUD (Sincroniza com MathLive e aplica em tempo real)
  const hudFreeInput = document.getElementById('hud-free-input');
  if (hudFreeInput) {
    hudFreeInput.addEventListener('input', (e) => {
      hudBaseExpression = e.target.value || '0';
      setHUDExpressionLive(hudBaseExpression, true);
    });
  }

  // Rewatch
  document.getElementById('btn-rewatch-write')?.addEventListener('click', () => {
    updateNotebookUI(true);
  });

  // Commute
  const commBtn = document.getElementById('btn-commute');
  if (commBtn) {
    commBtn.addEventListener('click', () => {
      state.isCommuted = !state.isCommuted;
      commBtn.classList.toggle('active', state.isCommuted);
      updateNotebookUI(true);
      updateScene3D();
    });
  }

  // Seq mode
  const seqBtn = document.getElementById('btn-seq-mode');
  if (seqBtn) {
    seqBtn.addEventListener('click', () => {
      state.seqMode = !state.seqMode;
      seqBtn.classList.toggle('active', state.seqMode);
      if (state.seqMode) {
        state.isPlaying = true;
        updatePlayButtonUI();
        setStep(1, true);
      }
    });
  }

  // 13. Atalhos Globais de Teclado
  window.addEventListener('keydown', (e) => {
    // Atalho Escape e Ctrl+Enter para o HUD de Sinal Flutuante
    if (state.focusHUDActive) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSignalHUD();
        return;
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        applySignalHUD();
        return;
      }
    }

    const tag = (e.target?.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'MATH-FIELD') return;

    // Atalhos de Acessibilidade (A11y)
    if (e.altKey) {
      if (e.key === '+' || e.key === '=' || e.code === 'Equal' || e.code === 'NumpadAdd') {
        e.preventDefault();
        setFontScale(state.fontScale + 0.1);
        return;
      }
      if (e.key === '-' || e.key === '_' || e.code === 'Minus' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        setFontScale(state.fontScale - 0.1);
        return;
      }
      if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') {
        e.preventDefault();
        setFontScale(1.0);
        return;
      }
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        toggleHighContrast();
        return;
      }
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        toggleReduceMotion();
        return;
      }
    }

    if (e.key === ' ') {
      e.preventDefault();
      state.isPlaying = !state.isPlaying;
      updatePlayButtonUI();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const nextMod = state.activeModule === 'convolution' ? 'fourier' : (state.activeModule === 'fourier' ? 'ctft' : 'convolution');
      switchModule(nextMod);
    } else if (['1', '2', '3', '4'].includes(e.key)) {
      setStep(Number(e.key), true);
    } else if (e.key.toLowerCase() === 'z') {
      toggleZen();
    } else if (e.key.toLowerCase() === 'm' && state.activeModule === 'fourier') {
      btnAudio?.click();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const slider = document.getElementById('t-slider');
      if (state.activeModule === 'ctft') {
        if (state.step === 4) {
          state.ctftBridgeT0 = Math.max(2.0, Math.min(25.0, state.ctftBridgeT0 + dir * 0.5));
          state.ctftCalculated = calculateCTFTData(state.ctftPresetKey, state.ctftPulseWidth, state.ctftDecay, state.ctftBridgeT0);
          if (slider) slider.value = state.ctftBridgeT0;
        } else if (state.step === 3) {
          state.t = Math.max(-15.0, Math.min(15.0, state.t + dir * 0.2));
          if (slider) slider.value = state.t;
        } else {
          state.ctftPulseWidth = Math.max(0.5, Math.min(5.0, state.ctftPulseWidth + dir * 0.25));
          state.ctftCalculated = calculateCTFTData(state.ctftPresetKey, state.ctftPulseWidth, state.ctftDecay, state.ctftBridgeT0);
          if (slider) slider.value = state.ctftPulseWidth;
        }
      } else if (state.activeModule === 'convolution' && state.step === 1) {
        state.tauSweep = Math.max(-3.5, Math.min(5.5, state.tauSweep + dir * 0.05));
        if (slider) slider.value = state.tauSweep;
      } else if (state.activeModule === 'convolution' && state.step === 2) {
        state.flipAngle = Math.max(0, Math.min(Math.PI, state.flipAngle + dir * 0.05));
        if (slider) slider.value = state.flipAngle;
      } else {
        const minT = state.activeModule === 'fourier' ? -4.0 : -2.0;
        const maxT = state.activeModule === 'fourier' ? 4.0 : 5.8;
        state.t = Math.max(minT, Math.min(maxT, state.t + dir * 0.05));
        if (slider) slider.value = state.t;
      }
      updateSliderBadge();
      updateNotebookUI(false);
      updateScene3D();
    }
  });
}
