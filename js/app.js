// ============================================================================
// APP.JS — Ponto de Entrada da Aplicação e Loop de Animação 120 FPS
// ============================================================================

import { state } from './state.js';
import { init3DStage, updateScene3D } from './stage-3d.js';
import { activeModule, moduleFromHash } from './modules/index.js';
import { updateNotebookUI } from './notebook.js';
import {
  switchModule,
  setStep,
  setFontScale,
  toggleHighContrast,
  toggleReduceMotion,
  applyTheme,
  applyLanguage,
  syncInputsWithPreset,
  renderPresetGallery,
  updateSliderBadge,
  initUIEventListeners
} from './ui.js';

let frameCounter = 0;
let lastFrameTime = performance.now();

function animationLoop(now = performance.now()) {
  requestAnimationFrame(animationLoop);

  const dt = Math.min(0.05, Math.max(0.004, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  if (state.isPlaying) {
    // Cada módulo sabe avançar a própria animação; o slider só espelha o resultado.
    const mod = activeModule();
    mod.tick(state.animSpeed || 1.0, { setStep });

    const tSlider = document.getElementById('t-slider');
    if (tSlider) tSlider.value = mod.slider().get();
    updateSliderBadge();

    frameCounter++;
    if (frameCounter % mod.notebookEveryFrames === 0) {
      updateNotebookUI(false);
    }
  }

  updateScene3D(dt);
}

// Inicialização após o DOM carregar
window.addEventListener('DOMContentLoaded', () => {
  init3DStage();
  setFontScale(state.fontScale);
  toggleHighContrast(state.a11yHighContrast);
  toggleReduceMotion(state.a11yReduceMotion);
  applyTheme(state.theme);
  applyLanguage(state.lang);
  renderPresetGallery();
  syncInputsWithPreset();
  initUIEventListeners();

  // O módulo inicial vem do fragmento da URL (#fourier, #ctft, ...)
  const initial = moduleFromHash(window.location.hash);
  switchModule(initial.id);
  if (initial.id === 'convolution') setStep(4, false);

  animationLoop();
});
