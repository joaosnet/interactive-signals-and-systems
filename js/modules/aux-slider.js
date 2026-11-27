// ============================================================================
// MODULES/AUX-SLIDER.JS — Segundo slider, para módulos com dois parâmetros
// ----------------------------------------------------------------------------
// O slider principal troca de papel conforme o passo. Quando um módulo tem um
// segundo parâmetro (ω₀ dos pares amortecidos, janela da DFT), ele declara
// 'aux-slider-row' em `controls` e chama syncAuxSlider(spec) dentro de slider().
//   spec = { key, titleKey, min, max, step, get(), set(v), badge() }  ou  null
// ============================================================================

import { state } from '../state.js';
import { I18N } from '../i18n.js';

export const AUX_SLIDER_ROW = 'aux-slider-row';

let bound = false;
let current = null;
let lastKey = '';
let refreshQueued = false;

function bind(input) {
  if (bound) return;
  bound = true;
  input.addEventListener('input', () => {
    if (!current) return;
    current.set(Number(input.value));
    // Um refresh por quadro basta, mesmo com muitos eventos de arrasto
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      refreshQueued = false;
      window.dispatchEvent(new CustomEvent('module-preset-changed'));
    });
  });
  // Atalhos do simulador (setas, números) não devem agir enquanto o foco está aqui
  input.addEventListener('keydown', (e) => e.stopPropagation());
}

export function syncAuxSlider(spec) {
  const row = document.getElementById(AUX_SLIDER_ROW);
  const input = document.getElementById('aux-slider');
  if (!row || !input) return;
  bind(input);
  current = spec || null;
  row.classList.toggle('hidden', !spec);
  if (!spec) {
    lastKey = '';
    return;
  }
  const dict = I18N[state.lang] || I18N.pt;
  const key = `${spec.key}|${spec.min}|${spec.max}|${spec.step}|${state.lang}`;
  if (key !== lastKey) {
    lastKey = key;
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step);
    const title = document.getElementById('aux-slider-title');
    if (title) title.textContent = dict[spec.titleKey] || spec.titleKey;
  }
  if (document.activeElement !== input) input.value = String(spec.get());
  const badge = document.getElementById('aux-slider-badge');
  const text = spec.badge();
  if (badge && badge.textContent !== text) badge.textContent = text;
}
