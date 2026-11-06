// ============================================================================
// APP.JS — Ponto de Entrada da Aplicação e Loop de Animação 120 FPS
// ============================================================================

import { state } from './state.js';
import { init3DStage, updateScene3D, getEffectiveSignals } from './stage-3d.js';
import { calculateCTFTData } from './math-engine.js';
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
let lastFrameTime = performance.now();

function computeBoundarySlowdownFactor(tVal) {
  try {
    const sig = getEffectiveSignals();
    if (!sig || !sig.supportFixed || !sig.supportMoving) return 1.0;
    const [fA, fB] = sig.supportFixed;
    const [mA, mB] = sig.supportMoving;
    const critPts = [fA + mA, fA + mB, fB + mA, fB + mB].filter(Number.isFinite);
    for (let i = 0; i < critPts.length; i++) {
      if (Math.abs(tVal - critPts[i]) < 0.14) {
        return 0.45;
      }
    }
  } catch (_) {}
  return 1.0;
}

function animationLoop(now = performance.now()) {
  requestAnimationFrame(animationLoop);

  const dt = Math.min(0.05, Math.max(0.004, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  if (state.isPlaying) {
    const spd = state.animSpeed || 1.0;
    const tSlider = document.getElementById('t-slider');

    if (state.activeModule === 'ctft') {
      if (state.step === 4) {
        // Ponte de Khutoryansky viva: expansão contínua T0 de 2.0s até 22.0s
        state.ctftBridgeT0 = (state.ctftBridgeT0 || 4.0) + 0.055 * spd;
        if (state.ctftBridgeT0 > 22.0) {
          state.ctftBridgeT0 = 2.0;
        }
        state.ctftCalculated = calculateCTFTData(
          state.ctftPresetKey,
          state.ctftPulseWidth,
          state.ctftDecay,
          state.ctftBridgeT0,
          state.ctftExpr
        );
        if (tSlider) tSlider.value = state.ctftBridgeT0;
      } else {
        // Sonda de frequência ativa varrendo w de -12 a +12 rad/s
        state.t += 0.06 * spd;
        if (state.t > 12.0) state.t = -12.0;
        if (tSlider) tSlider.value = state.t;
      }
      updateSliderBadge();
      frameCounter++;
      if (frameCounter % 6 === 0) {
        updateNotebookUI(false);
      }
    } else if (state.activeModule === 'fourier') {
      const T0 = state.fourierT0 || 3.0;
      state.t += 0.02 * spd;
      if (state.t > T0 * 1.5) {
        state.t = -T0 * 1.5;
      }
      if (tSlider) tSlider.value = state.t;
      updateSliderBadge();
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
        const slowFactor = computeBoundarySlowdownFactor(state.t);
        state.t += 0.022 * spd * slowFactor;
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
        const slowFactor = computeBoundarySlowdownFactor(state.t);
        state.t += 0.02 * spd * slowFactor;
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

  const initHash = window.location.hash.toLowerCase();
  if (initHash.includes('ctft')) {
    switchModule('ctft');
  } else if (initHash.includes('fourier')) {
    switchModule('fourier');
  } else {
    switchModule('convolution');
    setStep(4, false);
  }

  animationLoop();
});
