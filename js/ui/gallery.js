// ============================================================================
// UI/GALLERY.JS — Galerias de exemplos dos módulos de convolução, série de Fourier e CTFT
// ============================================================================

import { state, removeCustomPreset } from '../state.js';
import { I18N } from '../i18n.js';
import { renderMath, exprToLatex } from '../math-engine.js';
import { BUILTIN_CONV_PRESETS, BUILTIN_FOURIER_PRESETS, BUILTIN_CTFT_PRESETS } from '../presets.js';
import { updateScene3D } from '../stage-3d.js';
import { updateNotebookUI } from '../notebook.js';
import { updateAudioSynth } from '../audio.js';
import { recomputeFourier } from '../modules/fourier.js';
import { selectCTFTPreset, renderPresetGallery } from '../ui.js';
import { syncInputsWithPreset, openSignalHUD } from './hud.js';
import { loc, tx } from '../lang.js';

// Escapa texto vindo de presets salvos (localStorage) antes de interpolar em innerHTML.
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

export function renderCTFTGallery(gallery, isEn) {
  const dict = I18N[state.lang] || I18N.pt;
  // Card de Criação / Edição Direta de x(t) para CTFT
  const createCard = document.createElement('div');
  createCard.className = 'preset-create-card col-span-2 rounded-xl p-2.5 cursor-pointer flex items-center justify-between gap-2';
  createCard.innerHTML = `
    <div class="flex flex-col min-w-0">
      <div class="flex items-center gap-1.5">
        <span class="text-[11px] font-bold" style="color: var(--c-x1)">${isEn ? '+ Create / Edit Aperiodic Signal x(t)' : tx('+ Criar / Editar Sinal Aperiódico x(t)', '+ Crear / Editar Señal Aperiódica x(t)')}</span>
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

  const allCTFT = [
    ...Object.values(BUILTIN_CTFT_PRESETS),
    ...(state.ctftCustomPresets || []).map(cp => ({ ...cp, isCustom: true }))
  ];
  allCTFT.forEach(p => {
    const isActive = state.ctftPresetKey === p.id;
    const card = document.createElement('div');
    card.className = `preset-pill rounded-lg p-2 cursor-pointer flex flex-col justify-between gap-1 relative ${isActive ? 'active' : ''}`;
    const pTitle = loc(p, 'title');
    const pSub = loc(p, 'subtitle');

    card.innerHTML = `
      <div class="flex items-center justify-between gap-1">
        <span class="text-[11px] font-bold truncate text-primary">${esc(pTitle)}</span>
        <div class="flex items-center gap-1">
          <span class="text-[9px] font-mono-code font-semibold" style="color: var(--c-conv)">CTFT</span>
          ${p.isCustom ? `<button type="button" class="del-preset text-[10px] px-1 rounded hover:bg-red-500/20 text-rose-400" aria-label="${dict.delPreset}">✕</button>` : ''}
        </div>
      </div>
      <div class="text-[10px] text-mut truncate">${esc(pSub)}</div>
      <div class="preset-math text-[10px] pt-0.5 truncate"></div>
    `;
    const mathPreview = card.querySelector('.preset-math');
    if (mathPreview && (p.latexX || p.expr)) {
      const previewLatex = p.latexCTFT
        ? `${p.latexX} \\longleftrightarrow ${p.latexCTFT}`
        : `x(t) = ${exprToLatex(p.expr, 't')}`;
      renderMath(mathPreview, previewLatex, false);
    }
    card.addEventListener('click', (e) => {
      if (e.target.closest('.del-preset')) return;
      selectCTFTPreset(p.id);
    });
    const delBtn = card.querySelector('.del-preset');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeCustomPreset(p.id, 'ctft');
        if (state.ctftPresetKey === p.id) {
          selectCTFTPreset('rect');
        } else {
          renderPresetGallery();
        }
      });
    }
    gallery.appendChild(card);
  });
}

export function renderFourierGallery(gallery, isEn) {
  const dict = I18N[state.lang] || I18N.pt;
  // Card de Criação / Edição Direta de f(t)
  const createCard = document.createElement('div');
  createCard.className = 'preset-create-card col-span-2 rounded-xl p-2.5 cursor-pointer flex items-center justify-between gap-2';
  createCard.innerHTML = `
    <div class="flex flex-col min-w-0">
      <div class="flex items-center gap-1.5">
        <span class="text-[11px] font-bold" style="color: var(--c-x1)">${isEn ? '+ Create / Edit Periodic Signal f(t)' : tx('+ Criar / Editar Sinal Periódico f(t)', '+ Crear / Editar Señal Periódica f(t)')}</span>
        <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">MathLive</span>
      </div>
      <div class="create-card-math text-[10px] text-secondary truncate mt-0.5"></div>
    </div>
    <button type="button" id="gallery-btn-edit-fourier" class="ctrl-pill px-2.5 py-1.5 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1" style="border-color: var(--c-x1); color: var(--c-x1)">
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
    const pTitle = loc(p, 'title');
    const pSub = loc(p, 'subtitle');

    card.innerHTML = `
      <div class="flex items-center justify-between gap-1">
        <span class="text-[11px] font-bold truncate text-primary">${esc(pTitle)}</span>
        <div class="flex items-center gap-1">
          <span class="text-[9px] font-mono-code font-semibold" style="color: var(--c-x1)">T₀=${esc(p.T0)}</span>
          ${p.isCustom ? `<button type="button" class="del-preset text-[10px] px-1 rounded hover:bg-red-500/20 text-rose-400" aria-label="${dict.delPreset}">✕</button>` : ''}
        </div>
      </div>
      <div class="text-[10px] text-mut truncate">${esc(pSub)}</div>
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
      recomputeFourier();
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
          recomputeFourier();
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
}

export function renderConvolutionGallery(gallery, isEn) {
  const dict = I18N[state.lang] || I18N.pt;
  // Convolution: Card de Criação / Edição Direta de x(t) e h(t)
  const createCard = document.createElement('div');
  createCard.className = 'preset-create-card col-span-2 rounded-xl p-2.5 flex flex-col gap-2';
  createCard.innerHTML = `
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-1.5">
        <span class="text-[11px] font-bold" style="color: var(--c-x1)">${isEn ? '+ Create / Edit Signals in Simulation' : tx('+ Criar / Editar Sinais na Simulação', '+ Crear / Editar Señales en la Simulación')}</span>
        <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">MathLive</span>
      </div>
      <span class="text-[9px] text-mut hidden sm:inline">${isEn ? 'Or click curves in 3D' : tx('Ou clique nas curvas 3D', 'O haz clic en las curvas 3D')}</span>
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
    const bTitle = loc(p, 'shortTitle');
    const bSub = loc(p, 'subtitle');

    card.innerHTML = `
      <div class="flex items-center justify-between gap-1">
        <span class="text-[11px] font-bold truncate">${esc(bTitle)}</span>
        ${p.isCustom ? `<button type="button" class="del-preset text-[10px] px-1 rounded hover:bg-red-500/20 text-rose-400" aria-label="${dict.delPreset}">✕</button>` : ''}
      </div>
      <div class="text-[10px] text-mut truncate">${esc(bSub)}</div>
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
