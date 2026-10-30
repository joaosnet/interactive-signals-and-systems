// ============================================================================
// AUDIO.JS — Sintetizador Harmônico em Tempo Real via Web Audio API
// ============================================================================

import { state } from './state.js';

let audioCtx = null;
let masterGain = null;
let currentOsc = null;
let stopTimer = null;
let synthTimer = null;

export function initAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function toggleAudio() {
  state.audioEnabled = !state.audioEnabled;
  if (state.audioEnabled) {
    initAudioContext();
    updateAudioSynth();
  } else {
    stopAudio();
  }
  return state.audioEnabled;
}

export function stopAudio() {
  if (synthTimer) {
    clearTimeout(synthTimer);
    synthTimer = null;
  }
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (currentOsc) {
    const oscToStop = currentOsc;
    currentOsc = null;
    try {
      if (masterGain && audioCtx) {
        masterGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.05);
      }
      stopTimer = setTimeout(() => {
        try {
          oscToStop.stop();
          oscToStop.disconnect();
        } catch (e) {}
        stopTimer = null;
      }, 80);
    } catch (e) {}
  }
}

export function updateAudioSynth() {
  if (!state.audioEnabled || !audioCtx || state.activeModule !== 'fourier') {
    stopAudio();
    return;
  }

  const calc = state.fourierCalculated;
  if (!calc || !calc.harmonics || calc.harmonics.length === 0) return;

  // Se já há oscilador tocando, encerra suavemente antes de recriar
  stopAudio();

  synthTimer = setTimeout(() => {
    synthTimer = null;
    if (!state.audioEnabled || !audioCtx) return;

    try {
      const baseFreq = 160; // Frequência musical audível (D3)
      const N = calc.harmonics.length;

      if (state.highlightedHarmonic !== null) {
        // Toca apenas o sobretom da harmônica isolada
        const h = calc.harmonics.find(item => item.n === state.highlightedHarmonic);
        if (!h) return;

        currentOsc = audioCtx.createOscillator();
        currentOsc.type = 'sine';
        currentOsc.frequency.setValueAtTime(baseFreq * h.n, audioCtx.currentTime);

        const harmGain = audioCtx.createGain();
        const amp = Math.min(0.2, Math.max(0.02, h.cn * 0.15));
        harmGain.gain.setValueAtTime(amp, audioCtx.currentTime);

        currentOsc.connect(harmGain);
        harmGain.connect(masterGain);

        masterGain.gain.setTargetAtTime(0.12, audioCtx.currentTime, 0.04);
        currentOsc.start();
      } else {
        // Cria forma de onda periódica com todos os coeficientes Fourier
        const real = new Float32Array(N + 1);
        const imag = new Float32Array(N + 1);
        real[0] = 0;
        imag[0] = 0;

        calc.harmonics.forEach(h => {
          // Web Audio PeriodicWave: real = coeficientes cosseno (an), imag = coeficientes seno (bn)
          real[h.n] = Math.max(-1, Math.min(1, h.an));
          imag[h.n] = Math.max(-1, Math.min(1, h.bn));
        });

        const wave = audioCtx.createPeriodicWave(real, imag, { disableNormalization: false });
        currentOsc = audioCtx.createOscillator();
        currentOsc.setPeriodicWave(wave);
        currentOsc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);

        currentOsc.connect(masterGain);
        masterGain.gain.setTargetAtTime(0.1, audioCtx.currentTime, 0.05);
        currentOsc.start();
      }
    } catch (err) {}
  }, 90);
}
