// ============================================================================
// MODULES/CONVOLUTION.JS — Convolução contínua y(t) = (x * h)(t)
// Passos: 1 varredura em τ, 2 reflexão de h, 3 deslizamento, 4 integral.
// ============================================================================

import { state } from '../state.js';
import { getEffectiveSignals } from '../stage-3d.js';
import { registerModule } from './registry.js';

let step2PauseFrames = 0;

// Desacelera a animação perto dos instantes críticos (onde as bordas dos suportes se cruzam).
function boundarySlowdown(tVal) {
  const sig = getEffectiveSignals();
  if (!sig || !sig.supportFixed || !sig.supportMoving) return 1.0;
  const [fA, fB] = sig.supportFixed;
  const [mA, mB] = sig.supportMoving;
  const critPts = [fA + mA, fA + mB, fB + mA, fB + mB].filter(Number.isFinite);
  return critPts.some((pt) => Math.abs(tVal - pt) < 0.14) ? 0.45 : 1.0;
}

const SWEEP = { min: -3.5, max: 5.5 };
const SHIFT = { min: -2.0, max: 5.8 };

export const convolutionModule = registerModule({
  id: 'convolution',
  hash: 'convolution',
  i18n: { title: 'modConvTitle', sub: 'modConvSub', stepPrefix: 'stepConv', regionsTitle: 'regionsTitle' },
  zenLabel: 'x ∗ h',
  controls: ['conv-slider-row', 'btn-commute'],
  hudTargets: ['x', 'h'],
  defaultHudTarget: 'x',
  defaultSliderValue: 1.5,
  notebookEveryFrames: 4,

  slider() {
    if (state.step === 1) {
      return {
        titleKey: 'sliderSweep', ...SWEEP, step: 0.02, keyStep: 0.05,
        get: () => state.tauSweep,
        set: (v) => { state.tauSweep = v; },
        badge: () => `τ = ${state.tauSweep.toFixed(2)}`
      };
    }
    if (state.step === 2) {
      return {
        titleKey: 'sliderFlip', min: 0, max: 3.1416, step: 0.02, keyStep: 0.05,
        get: () => state.flipAngle,
        set: (v) => { state.flipAngle = Math.min(Math.PI, v); },
        badge: () => `θ = ${Math.round((state.flipAngle / Math.PI) * 180)}°`
      };
    }
    return {
      titleKey: state.step === 3 ? 'sliderShift3' : 'sliderShift4', ...SHIFT, step: 0.02, keyStep: 0.05,
      get: () => state.t,
      set: (v) => { state.t = v; },
      badge: () => `t = ${state.t.toFixed(2)}`
    };
  },

  onEnter() {},

  onStepEnter(stepNum, restartAnim) {
    if (stepNum === 1) {
      if (restartAnim) state.tauSweep = -3.0;
    } else if (stepNum === 2) {
      if (restartAnim) state.flipAngle = 0;
    } else {
      state.flipAngle = Math.PI;
    }
  },

  tick(spd, { setStep }) {
    if (state.step === 1) {
      state.tauSweep += 0.035 * spd;
      if (state.tauSweep > SWEEP.max) {
        if (state.seqMode) setStep(2, true);
        else state.tauSweep = -3.2;
      }
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
            state.t = SHIFT.min;
            setStep(3, true);
          } else {
            state.flipAngle = 0;
          }
        }
      }
    } else {
      // Passos 3 e 4: desliza t; no modo sequencial encadeia 3 → 4 → 1
      state.t += (state.step === 3 ? 0.022 : 0.02) * spd * boundarySlowdown(state.t);
      if (state.t > SHIFT.max) {
        state.t = SHIFT.min;
        if (state.seqMode) setStep(state.step === 3 ? 4 : 1, true);
      }
    }
  }
});
