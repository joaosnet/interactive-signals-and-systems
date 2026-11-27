// ============================================================================
// UI/HUD.JS — Editor de sinais (HUD): campo MathLive, blocos paramétricos, osciloscópio e teclado virtual
// ============================================================================

import { state, saveCustomPreset } from '../state.js';
import { I18N } from '../i18n.js';
import { exprToLatex, calculateFourierData, calculateCTFTData, validateSignalExpression } from '../math-engine.js';
import { updateScene3D } from '../stage-3d.js';
import { updateNotebookUI } from '../notebook.js';
import { updateAudioSynth } from '../audio.js';
import { listModules, activeModule } from '../modules/index.js';
import { recomputeCTFT } from '../modules/ctft.js';
import { recomputeFourier } from '../modules/fourier.js';
import { switchModule, renderPresetGallery } from '../ui.js';

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

// ============================================================================
// FLOATING SIGNAL HUD WITH MATHLIVE & REAL-TIME UPDATES
// ============================================================================

// Estado do editor de sinais (HUD), compartilhado com os ouvintes de eventos
export const hudState = {
  shape: 'rect',               // forma paramétrica selecionada
  syncingMathField: false,     // evita laço entre o campo MathLive e o campo de texto
  baseExpression: 'rect(t)',   // expressão sobre a qual o bloco paramétrico é combinado
  lastValidOsc: null,          // último resultado válido desenhado no osciloscópio
  lastTrigger: null            // elemento que abriu o editor, para devolver o foco ao fechar
};

export function renderHUDOscilloscope(valRes, target = 'x') {
  const canvas = document.getElementById('hud-oscilloscope-canvas');
  const statusPill = document.getElementById('hud-status-pill');
  const statusDot = document.getElementById('hud-status-dot');
  const statusText = document.getElementById('hud-status-text');
  const supportEl = document.getElementById('hud-osc-support');
  const energyEl = document.getElementById('hud-osc-energy');

  const dict = I18N[state.lang] || I18N.pt;
  const isValid = Boolean(valRes && (valRes.valid || valRes.isValid));
  const isAllZero = Boolean(valRes && (valRes.isAllZero || (valRes.energy !== undefined && valRes.energy < 1e-4)));

  if (statusPill && statusDot && statusText) {
    if (isValid) {
      statusPill.className = 'inline-flex items-center gap-1 font-bold text-emerald-400';
      statusDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400';
      statusText.textContent = isAllZero ? dict.hudStatusZero : dict.hudStatusValid;
    } else {
      statusPill.className = 'inline-flex items-center gap-1 font-bold text-amber-400';
      statusDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse';
      statusText.textContent = dict.hudStatusTyping;
    }
  }

  const drawRes = isValid ? valRes : hudState.lastValidOsc;
  if (isValid) {
    hudState.lastValidOsc = valRes;
  }

  if (drawRes) {
    const [sMin, sMax] = drawRes.support || [-1, 1];
    const drawAllZero = Boolean(drawRes.isAllZero || (drawRes.energy !== undefined && drawRes.energy < 1e-4));
    if (supportEl) {
      supportEl.textContent = drawAllZero
        ? `${dict.hudSupportPrefix}: ∅`
        : `${dict.hudSupportPrefix}: [${sMin.toFixed(2)}, ${sMax.toFixed(2)}]`;
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
  const rawTrimmed = (exprString || '').trim();
  const cleanExpr = rawTrimmed || '0';
  const freeInput = document.getElementById('hud-free-input');
  if (freeInput && document.activeElement !== freeInput && freeInput.value !== cleanExpr) {
    freeInput.value = cleanExpr;
  }

  if (syncMathField) {
    const mf = document.getElementById('hud-mathfield');
    if (mf) {
      hudState.syncingMathField = true;
      const latexVal = rawTrimmed ? exprToLatex(cleanExpr, 't') : '';
      if (typeof mf.setValue === 'function') {
        mf.setValue(latexVal, { silenceNotifications: true });
      } else {
        mf.value = latexVal;
      }
      hudState.syncingMathField = false;
    }
  }

  const target = state.focusHUDTarget || (state.activeModule === 'ctft' ? 'ctft' : (state.activeModule === 'fourier' ? 'fourier' : 'x'));
  const valRes = validateSignalExpression(rawTrimmed);
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
    recomputeFourier();
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
    rowW.style.display = (hudState.shape === 'u' || hudState.shape === 'step') ? 'none' : 'flex';
  }
  if (rowAlpha) {
    rowAlpha.style.display = (hudState.shape === 'exp') ? 'flex' : 'none';
  }

  const { expr } = generateParametricPreview(hudState.shape, aVal, wVal, t0Val, alphaVal);

  if (commitLive) {
    const mode = state.hudBuildMode || 'replace';
    const nextExpr = combineParametricExpression(hudState.baseExpression, expr, mode);
    setHUDExpressionLive(nextExpr, true);
  }
}

export function syncVirtualKeyboardOffset(forceNativeCheck = false) {
  const mvk = window.mathVirtualKeyboard;
  let kbHeight = 0;

  if (state.hudInputMode !== 'text' && mvk && mvk.visible) {
    const br = mvk.boundingRect;
    if (br && br.height > 0 && br.height < window.innerHeight * 0.85) {
      kbHeight = br.height;
    } else if (mvk.element) {
      const rect = mvk.element.getBoundingClientRect();
      if (rect.height > 0 && rect.height < window.innerHeight * 0.85) {
        kbHeight = rect.height;
      }
    }
  } else if ((state.hudInputMode === 'text' || forceNativeCheck) && window.visualViewport) {
    const diff = window.innerHeight - window.visualViewport.height;
    if (diff > 100) {
      kbHeight = diff;
    }
  }

  document.documentElement.style.setProperty('--kb-offset', `${Math.round(kbHeight)}px`);
  document.body.classList.toggle('mathlive-kb-visible', kbHeight > 20);

  const kbdBtn = document.getElementById('hud-btn-keyboard');
  if (kbdBtn) {
    const isKbdOpen = Boolean(mvk && mvk.visible && state.hudInputMode !== 'text');
    kbdBtn.setAttribute('aria-pressed', String(isKbdOpen));
  }
}

export function setHUDInputMode(mode, shouldFocus = false) {
  const mf = document.getElementById('hud-mathfield');
  const freeInput = document.getElementById('hud-free-input');
  const modeBtn = document.getElementById('hud-btn-input-mode');
  const kbdBtn = document.getElementById('hud-btn-keyboard');

  const hasMathField = Boolean(mf && window.customElements?.get('math-field'));
  const targetMode = (mode === 'text' || !hasMathField) ? 'text' : 'mathlive';
  state.hudInputMode = targetMode;

  if (targetMode === 'text') {
    if (window.mathVirtualKeyboard && typeof window.mathVirtualKeyboard.hide === 'function') {
      try { window.mathVirtualKeyboard.hide(); } catch (_) {}
    }
    if (mf) mf.classList.add('hidden');
    if (freeInput) {
      freeInput.classList.remove('hidden');
      freeInput.removeAttribute('aria-hidden');
      freeInput.value = hudState.baseExpression || '0';
      if (shouldFocus) freeInput.focus();
    }
    if (modeBtn) {
      modeBtn.setAttribute('aria-pressed', 'true');
      modeBtn.textContent = 'f(x)';
    }
    if (kbdBtn) kbdBtn.classList.add('hidden');
  } else {
    if (freeInput) {
      freeInput.classList.add('hidden');
      freeInput.setAttribute('aria-hidden', 'true');
    }
    if (mf) {
      mf.classList.remove('hidden');
      hudState.syncingMathField = true;
      const latexStr = exprToLatex(hudState.baseExpression || '0', 't');
      if (typeof mf.setValue === 'function') {
        mf.setValue(latexStr, { silenceNotifications: true });
      } else {
        mf.value = latexStr;
      }
      hudState.syncingMathField = false;
      if (shouldFocus) mf.focus();
    }
    if (modeBtn) {
      modeBtn.setAttribute('aria-pressed', 'false');
      modeBtn.textContent = 'Abc';
    }
    if (kbdBtn) kbdBtn.classList.remove('hidden');
  }

  syncVirtualKeyboardOffset(false);
}

export function openMathKeyboard() {
  const mf = document.getElementById('hud-mathfield');
  const freeInput = document.getElementById('hud-free-input');
  if (state.hudInputMode === 'text' || !window.customElements?.get('math-field')) {
    setHUDInputMode('text', true);
    return;
  }
  if (!mf) return;
  try {
    mf.focus();
  } catch (_) {}
  requestAnimationFrame(() => {
    if (window.mathVirtualKeyboard) {
      try {
        if (typeof window.mathVirtualKeyboard.show === 'function') {
          window.mathVirtualKeyboard.show();
        } else {
          window.mathVirtualKeyboard.visible = true;
        }
      } catch (_) {}
    }
    syncVirtualKeyboardOffset(false);
    setTimeout(() => syncVirtualKeyboardOffset(false), 70);
  });
}

export function hideMathKeyboard() {
  if (window.mathVirtualKeyboard && typeof window.mathVirtualKeyboard.hide === 'function') {
    try {
      window.mathVirtualKeyboard.hide();
    } catch (_) {}
  }
  syncVirtualKeyboardOffset(false);
}

export function openSignalHUD(targetSignal) {
  const target = targetSignal || activeModule().defaultHudTarget;
  if (!target) return; // módulo sem editor de sinal

  // Cada alvo do editor pertence a um módulo; abre o módulo dono se não for o ativo.
  const owner = listModules().find((m) => m.hudTargets.includes(target));
  if (owner && owner.id !== state.activeModule) switchModule(owner.id);

  if (!state.focusHUDActive && document.activeElement && document.activeElement !== document.body) {
    hudState.lastTrigger = document.activeElement;
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

  document.getElementById('ui-panel')?.setAttribute('inert', '');
  document.body.classList.add('stage-focus-active');
  document.body.classList.add('focus-hud-open');
  document.body.classList.remove('mathlive-kb-visible');
  document.documentElement.style.setProperty('--kb-offset', '0px');

  // Garante que o teclado virtual NÃO abra sozinho ao abrir o HUD
  hideMathKeyboard();

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
    pillX.setAttribute('aria-selected', String(target === 'x'));
    pillH.classList.toggle('active', target === 'h');
    pillH.setAttribute('aria-selected', String(target === 'h'));
    pillFourier.classList.toggle('active', target === 'fourier');
    pillFourier.setAttribute('aria-selected', String(target === 'fourier'));
    if (pillCTFT) {
      pillCTFT.classList.toggle('active', target === 'ctft');
      pillCTFT.setAttribute('aria-selected', String(target === 'ctft'));
    }
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

  hudState.baseExpression = currentExpr || 'rect(t)';
  const freeInput = document.getElementById('hud-free-input');
  if (freeInput) {
    freeInput.value = hudState.baseExpression;
  }

  const mf = document.getElementById('hud-mathfield');
  if (mf) {
    hudState.syncingMathField = true;
    const latexStr = exprToLatex(hudState.baseExpression, 't');
    if (typeof mf.setValue === 'function') {
      mf.setValue(latexStr, { silenceNotifications: true });
    } else {
      mf.value = latexStr;
    }
    hudState.syncingMathField = false;
    try {
      mf.blur();
    } catch (_) {}
  }

  setHUDInputMode(state.hudInputMode || 'mathlive', false);

  const valRes = validateSignalExpression(hudState.baseExpression);
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

  document.getElementById('ui-panel')?.removeAttribute('inert');
  document.body.classList.remove('stage-focus-active');
  document.body.classList.remove('focus-hud-open');
  document.body.classList.remove('mathlive-kb-visible');
  document.documentElement.style.setProperty('--kb-offset', '0px');

  hideMathKeyboard();
  updateScene3D();

  if (hudState.lastTrigger && hudState.lastTrigger.isConnected && typeof hudState.lastTrigger.focus === 'function') {
    try {
      hudState.lastTrigger.focus();
    } catch (_) {}
  }
  hudState.lastTrigger = null;
}

export function applySignalHUD() {
  const freeInput = document.getElementById('hud-free-input');
  const chosenExpr = (freeInput && freeInput.value.trim()) ? freeInput.value.trim() : 'rect(t)';
  setHUDExpressionLive(chosenExpr, true);
  updateNotebookUI(true);
  closeSignalHUD();
}

export function pinSignalHUD() {
  const target = state.focusHUDTarget || (state.activeModule === 'ctft' ? 'ctft' : (state.activeModule === 'fourier' ? 'fourier' : 'x'));
  const freeInput = document.getElementById('hud-free-input');
  const chosenExpr = (freeInput && freeInput.value.trim()) ? freeInput.value.trim() : 'rect(t)';
  // Expressão inválida não é aplicada pelo HUD; salvar aqui gravaria a expressão antiga.
  if (!validateSignalExpression(chosenExpr).valid) return;
  setHUDExpressionLive(chosenExpr, true);

  if (target === 'ctft') {
    const id = 'custom_ctft_' + Date.now();
    const count = (state.ctftCustomPresets?.length || 0) + 1;
    saveCustomPreset({
      id,
      title: `${I18N.pt.savedPreset}${count}`,
      titleEn: `${I18N.en.savedPreset}${count}`,
      subtitle: I18N.pt.customSignal,
      subtitleEn: I18N.en.customSignal,
      expr: state.ctftExpr,
      latexX: exprToLatex(state.ctftExpr, 't'),
      isCustom: true
    }, 'ctft');
    state.ctftPresetKey = id;
    recomputeCTFT();
  } else if (target === 'fourier') {
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
    state.fourierPresetKey = id;
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
    state.presetKey = id;
  }

  syncInputsWithPreset();
  renderPresetGallery();
  updateNotebookUI(true);
  closeSignalHUD();
}
