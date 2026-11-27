// ============================================================================
// UI/PREFERENCES.JS — Preferências de exibição: tamanho da fonte, contraste, movimento, tema e seções visíveis
// ============================================================================

import { state, saveStatePreferences } from '../state.js';
import { validateSignalExpression } from '../math-engine.js';
import { updateScene3D } from '../stage-3d.js';
import { updatePlayButtonUI } from '../ui.js';
import { hudState, renderHUDOscilloscope } from './hud.js';
import { pick } from '../lang.js';

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
  // Só uma escolha explícita do usuário é persistida; na inicialização vale a preferência do sistema.
  if (forceVal === null) state.a11yMotionUserSet = true;
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

  const labelMap = pick({
    pt: { projector: 'Projetor', dark: 'Escuro', light: 'Claro' },
    en: { projector: 'Projector', dark: 'Dark', light: 'Light' },
    es: { projector: 'Proyector', dark: 'Oscuro', light: 'Claro' }
  });

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
    const valRes = validateSignalExpression(hudState.baseExpression || 'rect(t)');
    renderHUDOscilloscope(valRes, state.focusHUDTarget || 'x');
  }
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
