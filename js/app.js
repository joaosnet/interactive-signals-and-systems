// ============================================================================
// APP.JS — Ponto de Entrada da Aplicação e Loop de Animação 120 FPS
// ============================================================================

import { state } from './state.js';
import { init3DStage, updateScene3D } from './stage-3d.js';
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
let step2PauseFrames = 0;

function animationLoop() {
  requestAnimationFrame(animationLoop);

  if (state.isPlaying) {
    const spd = state.animSpeed || 1.0;
    const tSlider = document.getElementById('t-slider');

    if (state.activeModule === 'fourier') {
      const T0 = state.fourierT0 || 3.0;
      state.t += 0.02 * spd;
      if (state.t > T0 * 1.5) {
        state.t = -T0 * 1.5;
      }
      if (tSlider) tSlider.value = state.t;
      updateSliderBadge();

      frameCounter++;
      if (frameCounter % 4 === 0) {
        updateNotebookUI(false);
      }
    } else {
      if (state.step === 1) {
        state.tauSweep += 0.035 * spd;
        if (state.tauSweep > 5.5) {
          if (state.seqMode) setStep(2, true);
          else state.tauSweep = -3.2;
        }
        if (tSlider) tSlider.value = state.tauSweep;
      } else if (state.step === 2) {
        if (state.flipAngle < Math.PI) {
          const norm = state.flipAngle / Math.PI;
          const speed = (0.014 + 0.026 * Math.sin(Math.max(0.08, Math.min(0.92, norm)) * Math.PI)) * spd;
          state.flipAngle = Math.min(Math.PI, state.flipAngle + speed);
        } else {
          step2PauseFrames += spd;
          if (step2PauseFrames > 42) {
            step2PauseFrames = 0;
            if (state.seqMode) {
              state.t = -2.0;
              setStep(3, true);
            } else {
              state.flipAngle = 0;
            }
          }
        }
        if (tSlider) tSlider.value = state.flipAngle;
      } else if (state.step === 3) {
        state.t += 0.022 * spd;
        if (state.t > 5.8) {
          if (state.seqMode) {
            state.t = -2.0;
            setStep(4, true);
          } else {
            state.t = -2.0;
          }
        }
        if (tSlider) tSlider.value = state.t;
      } else if (state.step === 4) {
        state.t += 0.02 * spd;
        if (state.t > 5.8) {
          if (state.seqMode) {
            state.t = -2.0;
            setStep(1, true);
          } else {
            state.t = -2.0;
          }
        }
        if (tSlider) tSlider.value = state.t;
      }

      updateSliderBadge();
      frameCounter++;
      if (frameCounter % 4 === 0) {
        updateNotebookUI(false);
      }
    }
  }

  updateScene3D();
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

  const initHash = window.location.hash.toLowerCase();
  if (initHash.includes('fourier')) {
    switchModule('fourier');
  } else {
    switchModule('convolution');
    setStep(4, false);
  }

  animationLoop();
});
