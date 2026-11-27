// ============================================================================
// MODULES/FOURIER.JS — Série de Fourier de sinais periódicos
// ============================================================================

import { state } from '../state.js';
import { calculateFourierData } from '../math-engine.js';
import { registerModule } from './registry.js';
import { renderFourierScene3D } from '../stage-3d.js';
import { fourierNotebookLines, fourierNotebookMetric, fourierNotebookTable } from '../notebook.js';
import { renderFourierGallery } from '../ui.js';

const RANGE = { min: -4.0, max: 4.0 };

export function recomputeFourier() {
  state.fourierCalculated = calculateFourierData(state.fourierExpr, state.fourierT0, state.fourierN);
}

export const fourierModule = registerModule({
  id: 'fourier',
  hash: 'fourier',
  i18n: { title: 'modFourierTitle', sub: 'modFourierSub', stepPrefix: 'stepFourier', regionsTitle: 'regionsFourierTitle' },
  zenLabel: '∑ Cₙ',
  controls: ['fourier-slider-row', 'btn-audio-toggle', 'fourier-form-selector'],

  // Cena, caderno e galeria vivem em stage-3d.js, notebook.js e ui.js
  renderScene: (scene, dt) => renderFourierScene3D(dt),
  notebook: {
    lines: () => fourierNotebookLines(),
    renderMetric: (el, isEn) => fourierNotebookMetric(el, isEn),
    table: (container, isEn) => fourierNotebookTable(container, isEn)
  },
  renderGallery: (gallery, isEn) => renderFourierGallery(gallery, isEn),
  hudTargets: ['fourier'],
  defaultHudTarget: 'fourier',
  defaultSliderValue: 0,
  notebookEveryFrames: 6,

  slider() {
    return {
      titleKey: 'sliderEvalPoint', ...RANGE, step: 0.02, keyStep: 0.05,
      get: () => state.t,
      set: (v) => { state.t = v; },
      badge: () => `t = ${state.t.toFixed(2)}`
    };
  },

  onEnter() {
    recomputeFourier();
  },

  onStepEnter() {},

  tick(spd) {
    // Percorre 1,5 período para cada lado, sem sair da faixa do slider
    const span = Math.min(RANGE.max, (state.fourierT0 || 3.0) * 1.5);
    state.t += 0.02 * spd;
    if (state.t > span) state.t = -span;
  }
});
