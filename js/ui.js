// ============================================================================
// UI.JS — Manipulação de Interface, Segmented Controls, Popovers e Teclado
// ============================================================================
//
// Este arquivo guarda o núcleo: troca de módulo, passos e slider principal.
// O restante da interface está em js/ui/ e é reexportado aqui:
//   preferences.js  fonte, contraste, movimento, tema, seções visíveis
//   language.js     aplicação do idioma
//   gallery.js      galerias de convolução, série de Fourier e CTFT
//   hud.js          editor de sinais
//   widgets.js      rolagem, popovers, navegação por setas, gaveta do celular
//   events.js       ligação dos eventos às ações

import { state } from './state.js';
import { I18N } from './i18n.js';
import { BUILTIN_CTFT_PRESETS } from './presets.js';
import { updateScene3D } from './stage-3d.js';
import { updateNotebookUI } from './notebook.js';
import { updateAudioSynth } from './audio.js';
import { listModules, getModule, activeModule } from './modules/index.js';
import { recomputeCTFT } from './modules/ctft.js';
import { syncInputsWithPreset, setActiveMathField, updateHUDTitle, updateParametricHUDPreview, closeSignalHUD } from './ui/hud.js';

export * from './ui/preferences.js';
export * from './ui/language.js';
export * from './ui/gallery.js';
export * from './ui/hud.js';
export * from './ui/widgets.js';
export * from './ui/events.js';


// state.t é o tempo t na convolução e na série de Fourier e a frequência ω na CTFT.
// Cada módulo guarda o seu valor para não herdar o do módulo anterior.
const moduleSliderValue = {};

/**
 * Cria os botões do seletor de módulos e do dock do modo zen a partir do registro.
 * Um módulo novo aparece na interface só por estar registrado.
 */
export function renderModuleSwitcher() {
  const dict = I18N[state.lang] || I18N.pt;
  const nav = document.getElementById('module-switcher');
  const zen = document.getElementById('zen-module-switcher');
  const mods = listModules();

  if (nav) {
    nav.replaceChildren(...mods.map((mod) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = `mod-btn-${mod.id}`;
      btn.dataset.module = mod.id;
      btn.setAttribute('role', 'tab');
      btn.className = 'module-pill-btn py-1.5 px-1.5 rounded-lg border text-left flex flex-col justify-center';
      const title = document.createElement('span');
      title.className = 'mod-title text-xs font-bold leading-tight';
      title.textContent = dict[mod.i18n.title] || mod.id;
      const sub = document.createElement('span');
      sub.className = 'mod-sub text-[9px] font-mono-code opacity-75 truncate';
      sub.textContent = dict[mod.i18n.sub] || '';
      btn.append(title, sub);
      btn.addEventListener('click', () => switchModule(mod.id));
      return btn;
    }));
  }

  if (zen) {
    zen.replaceChildren(...mods.map((mod) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = `zen-btn-${mod.id}`;
      btn.dataset.module = mod.id;
      btn.className = 'px-2 py-0.5 rounded-md font-bold seg-btn';
      btn.textContent = mod.zenLabel;
      btn.setAttribute('aria-label', dict[mod.i18n.title] || mod.id);
      btn.addEventListener('click', () => switchModule(mod.id));
      return btn;
    }));
  }

  syncModuleSwitcher();
}

export function syncModuleSwitcher() {
  document.querySelectorAll('#module-switcher [data-module]').forEach((btn) => {
    const isActive = btn.dataset.module === state.activeModule;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
    btn.tabIndex = isActive ? 0 : -1;
  });
  document.querySelectorAll('#zen-module-switcher [data-module]').forEach((btn) => {
    const isActive = btn.dataset.module === state.activeModule;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

export function selectCTFTPreset(key) {
  const builtin = BUILTIN_CTFT_PRESETS[key];
  const custom = !builtin ? (state.ctftCustomPresets || []).find(cp => cp.id === key) : null;
  const p = builtin || custom;
  if (!p) return;

  state.ctftPresetKey = key;
  state.ctftExpr = p.expr || 'rect(t/2)';
  if (builtin) {
    state.ctftPulseWidth = p.tau0 !== undefined ? p.tau0 : (key === 'tri' || key === 'bridge' ? 1.0 : 2.0);
    state.ctftDecay = p.a !== undefined ? p.a : 1.0;
    if (p.defaultT0 !== undefined) state.ctftBridgeT0 = p.defaultT0;
  }

  recomputeCTFT();
  if (key === 'bridge' && state.step !== 4) {
    setStep(4, false);
  } else {
    setStep(state.step, false);
  }
  renderPresetGallery();
  updateNotebookUI(true);
  updateScene3D();
}

export function switchModule(moduleName) {
  const mod = getModule(moduleName) || activeModule();
  moduleName = mod.id;
  if (state.activeModule !== moduleName) {
    moduleSliderValue[state.activeModule] = state.t;
    state.t = moduleSliderValue[moduleName] ?? mod.defaultSliderValue ?? 0;
    // O editor de sinal pertence ao módulo de origem: fecha antes de trocar
    // para não gravar a expressão antiga no módulo novo.
    if (state.focusHUDActive) closeSignalHUD();
  }
  state.activeModule = moduleName;
  const isFourier = moduleName === 'fourier';
  const isCTFT = moduleName === 'ctft';
  const isConv = moduleName === 'convolution';

  // Sincroniza hash da URL, seletor principal e dock do modo zen
  window.history.replaceState(null, '', '#' + mod.hash);
  syncModuleSwitcher();

  // Controles específicos: cada módulo declara os seus; os dos demais ficam ocultos
  const ownControls = new Set(mod.controls);
  listModules().flatMap((m) => m.controls).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !ownControls.has(id));
  });

  const dict = I18N[state.lang] || I18N.pt;
  const regTitle = document.getElementById('regions-title');
  if (regTitle) regTitle.textContent = dict[mod.i18n.regionsTitle];

  // Atualiza passos (1 a 4) com os rótulos de cada módulo
  updateStepLabels();

  mod.onEnter();
  const hintEl = document.getElementById('lbl-stage-hint');
  if (hintEl) hintEl.textContent = stageHintText(state.lang === 'en');
  if (state.activeMathField) setActiveMathField(mod.defaultHudTarget);
  // Fora do módulo de Fourier isto silencia o oscilador (o botão de áudio fica oculto).
  updateAudioSynth();

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
      pillX.setAttribute('aria-selected', String(isConv));
      pillH.classList.remove('active');
      pillH.setAttribute('aria-selected', 'false');
      pillFourier.classList.toggle('active', isFourier);
      pillFourier.setAttribute('aria-selected', String(isFourier));
      if (pillCTFT) {
        pillCTFT.classList.toggle('active', isCTFT);
        pillCTFT.setAttribute('aria-selected', String(isCTFT));
      }
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

/**
 * Configura o slider principal (título, limites, passo e valor) conforme o que o
 * módulo ativo diz que ele controla agora. Única fonte dos limites do slider.
 */
export function applySliderSpec(dict = I18N[state.lang] || I18N.pt) {
  const spec = activeModule().slider();
  const slider = document.getElementById('t-slider');
  const titleEl = document.getElementById('slider-param-title');
  if (titleEl) titleEl.textContent = dict[spec.titleKey];
  if (slider) {
    slider.min = String(spec.min);
    slider.max = String(spec.max);
    slider.step = String(spec.step);
    slider.value = spec.get();
  }
  return spec;
}

/** Dica do rodapé do palco: só fala em editar o sinal nos módulos que têm editor de fórmula. */
export function stageHintText(isEn) {
  const hasEditor = (activeModule().hudTargets || []).length > 0;
  if (hasEditor) return isEn ? 'Click a signal to edit • Drag: Orbit' : 'Clique no sinal para editar • Arraste: Orbitar';
  return isEn ? 'Drag: Orbit • Examples and editor in the panel' : 'Arraste: Orbitar • Exemplos e editor no painel';
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

  activeModule().onStepEnter(stepNum, restartAnim);
  applySliderSpec(dict);

  updateSliderBadge();
  updateNotebookUI(true);
}

export function updateSliderBadge() {
  const badge = document.getElementById('t-readout-badge');
  const zenBadge = document.getElementById('zen-t-readout');
  const txt = activeModule().slider().badge();
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
  for (let s = 1; s <= 4; s++) {
    const tagEl = document.getElementById('step-tag-' + s);
    const lblEl = document.getElementById('step-lbl-' + s);
    if (tagEl) tagEl.textContent = dict['stepTag' + s];
    if (lblEl) lblEl.textContent = dict[activeModule().i18n.stepPrefix + s];
  }
}

/** Chamado por um módulo plugável depois de trocar de preset ou parâmetro. */
export function refreshAfterPresetChange() {
  setStep(state.step, false);
  renderPresetGallery();
  updateNotebookUI(true);
  updateScene3D();
}

export function renderPresetGallery() {
  const gallery = document.getElementById('preset-gallery');
  if (!gallery) return;
  gallery.innerHTML = '';
  // Cada módulo monta a própria galeria de exemplos
  activeModule().renderGallery(gallery, state.lang === 'en', refreshAfterPresetChange);
}

// ---- Galerias dos módulos de convolução, série de Fourier e CTFT ----
// (ligadas aos módulos em js/modules/*.js pelo gancho `renderGallery`)
