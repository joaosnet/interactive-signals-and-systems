// ============================================================================
// UI/WIDGETS.JS — Comportamentos reutilizáveis: rolagem da barra, popovers, navegação por setas e gaveta do celular
// ============================================================================

import { state } from '../state.js';
import { syncVirtualKeyboardOffset, closeSignalHUD } from './hud.js';

/**
 * Rolagem horizontal fluida da barra de ferramentas/acessibilidade
 * Suporta roda do mouse (wheel -> scrollLeft) e clique-e-arrasto (drag-to-scroll).
 */
export function setupA11yBarScroll(a11yBar) {
  if (!a11yBar) return;

  // 1. Mouse Wheel: converte deltaY vertical em rolagem horizontal scrollLeft
  a11yBar.addEventListener('wheel', (e) => {
    if (a11yBar.scrollWidth > a11yBar.clientWidth) {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      a11yBar.scrollLeft += delta * 0.9;
      e.preventDefault();
    }
  }, { passive: false });

  // 2. Drag-to-scroll: clique e arraste com o mouse
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let hasDragged = false;

  a11yBar.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDown = true;
    hasDragged = false;
    startX = e.pageX - a11yBar.offsetLeft;
    scrollLeft = a11yBar.scrollLeft;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - a11yBar.offsetLeft;
    const walk = x - startX;
    if (Math.abs(walk) > 4) {
      hasDragged = true;
      a11yBar.classList.add('grabbing');
      a11yBar.scrollLeft = scrollLeft - walk;
    }
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    a11yBar.classList.remove('grabbing');
  });

  // Intercepta e previne cliques acidentais em botões caso o usuário tenha arrastado a barra
  a11yBar.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged = false;
    }
  }, true);
}

/**
 * Configuração dos layouts do Teclado Virtual MathLive Completo
 * Inclui layouts padrão ('numeric', 'functions', 'symbols', 'alphabetic')
 * mais a camada dedicada de engenharia 'Sinais'.
 */
export function setupMathLiveVirtualKeyboard() {
  if (typeof window === 'undefined') return;
  let configured = false;

  const configureMVK = () => {
    if (!window.mathVirtualKeyboard || configured) return;
    configured = true;
    try {
      if (window.MathfieldElement) {
        window.MathfieldElement.soundsDirectory = null;
      }
      window.mathVirtualKeyboard.layouts = [
        {
          label: 'Sinais',
          tooltip: 'Sinais & Engenharia (UFPA)',
          rows: [
            [
              { latex: 'u(t)', insert: 'u(#0)' },
              { latex: '\\text{rect}', insert: '\\operatorname{rect}(#0)' },
              { latex: '\\text{tri}', insert: '\\operatorname{tri}(#0)' },
              { latex: '\\text{sinc}', insert: '\\operatorname{sinc}(#0)' }
            ],
            [
              { latex: '\\delta(t)', insert: '\\delta(#0)' },
              { latex: 'r(t)', insert: 'r(#0)' },
              { latex: 'e^{-t}', insert: 'e^{-#0}' },
              { latex: '\\sin', insert: '\\sin(#0)' }
            ],
            [
              { latex: 't', insert: 't' },
              { latex: '\\pi', insert: '\\pi' },
              { latex: '( )', insert: '(#0)' },
              { latex: '\\cos', insert: '\\cos(#0)' }
            ]
          ]
        },
        'default'
      ];
      window.mathVirtualKeyboard.addEventListener?.('geometrychange', () => {
        syncVirtualKeyboardOffset(false);
      });
    } catch (err) {
      console.warn('[MathLive] Falha ao configurar layouts personalizados:', err);
    }
  };

  if (window.mathVirtualKeyboard) {
    configureMVK();
  } else {
    window.addEventListener('DOMContentLoaded', configureMVK, { once: true });
    window.addEventListener('load', configureMVK, { once: true });
  }
}

export function wireAnchoredPopover(triggerBtn, popoverEl, { align = 'end' } = {}) {
  if (!triggerBtn || !popoverEl) return;
  const supportsPopover = 'popover' in HTMLElement.prototype;
  const supportsAnchor = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('position-area', 'block-end');

  const positionFallback = () => {
    const t = triggerBtn.getBoundingClientRect();
    const m = popoverEl.getBoundingClientRect();
    const belowFits = t.bottom + 6 + m.height <= window.innerHeight - 8;
    const topPos = belowFits ? t.bottom + 6 : Math.max(8, t.top - m.height - 6);
    const rawLeft = align === 'end' ? (t.right - m.width) : t.left;
    const leftPos = Math.max(8, Math.min(rawLeft, window.innerWidth - m.width - 8));
    popoverEl.style.top = `${Math.round(topPos)}px`;
    popoverEl.style.left = `${Math.round(leftPos)}px`;
  };

  if (supportsPopover) {
    popoverEl.classList.remove('hidden');
    popoverEl.addEventListener('toggle', (e) => {
      const isOpen = e.newState === 'open';
      triggerBtn.classList.toggle('active', isOpen);
      triggerBtn.setAttribute('aria-expanded', String(isOpen));
      if (isOpen && !supportsAnchor) {
        requestAnimationFrame(positionFallback);
      }
    });
  } else {
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = popoverEl.classList.contains('hidden');
      popoverEl.classList.toggle('hidden', !willOpen);
      triggerBtn.classList.toggle('active', willOpen);
      triggerBtn.setAttribute('aria-expanded', String(willOpen));
      if (willOpen) {
        requestAnimationFrame(positionFallback);
      }
    });
    window.addEventListener('click', (e) => {
      if (!popoverEl.contains(e.target) && !triggerBtn.contains(e.target)) {
        popoverEl.classList.add('hidden');
        triggerBtn.classList.remove('active');
        triggerBtn.setAttribute('aria-expanded', 'false');
      }
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !popoverEl.classList.contains('hidden')) {
        popoverEl.classList.add('hidden');
        triggerBtn.classList.remove('active');
        triggerBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

export function setupToolbarRovingTabindex(toolbarEl) {
  if (!toolbarEl || ('focusGroup' in HTMLElement.prototype)) return;
  const getItems = () => Array.from(toolbarEl.querySelectorAll('button')).filter((b) => b.offsetParent !== null);
  const initItems = getItems();
  initItems.forEach((b, i) => {
    b.tabIndex = i === 0 ? 0 : -1;
  });

  toolbarEl.addEventListener('focusin', (e) => {
    const items = getItems();
    const targetBtn = e.target.closest('button');
    if (targetBtn && items.includes(targetBtn)) {
      items.forEach((b) => {
        b.tabIndex = b === targetBtn ? 0 : -1;
      });
    }
  });

  toolbarEl.addEventListener('keydown', (e) => {
    const items = getItems();
    if (items.length === 0) return;
    const cur = document.activeElement;
    const idx = items.indexOf(cur);
    if (idx === -1) return;
    const rtl = getComputedStyle(toolbarEl).direction === 'rtl';
    let nextIdx = -1;
    if (e.key === 'ArrowRight') nextIdx = (idx + (rtl ? -1 : 1) + items.length) % items.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx + (rtl ? 1 : -1) + items.length) % items.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = items.length - 1;

    if (nextIdx !== -1) {
      e.preventDefault();
      items.forEach((b, i) => {
        b.tabIndex = i === nextIdx ? 0 : -1;
      });
      items[nextIdx].focus();
    }
  });
}

/**
 * Gestos físicos de arrasto e flick com velocidade (Emil Kowalski)
 * para o painel inferior no mobile (.sheet-drag-handle-bar) e para o cabeçalho do HUD.
 */
export function setupMobileSheetGestures() {
  if (typeof window === 'undefined') return;

  // 1. Gaveta Inferior Mobile (#ui-panel via .sheet-drag-handle-bar)
  const handleBar = document.querySelector('.sheet-drag-handle-bar');
  const stageWrapper = document.getElementById('stage-wrapper');
  if (handleBar && stageWrapper) {
    let startY = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocityY = 0;
    let dragging = false;

    const applySheetSnap = (snap) => {
      state.mobileSheetSnap = snap;
      document.body.classList.remove('sheet-snap-peek', 'sheet-snap-expanded');
      if (snap === 'peek') document.body.classList.add('sheet-snap-peek');
      else if (snap === 'expanded') document.body.classList.add('sheet-snap-expanded');
      setTimeout(() => window.dispatchEvent(new Event('resize')), 260);
    };

    handleBar.addEventListener('pointerdown', (e) => {
      dragging = true;
      startY = e.clientY;
      lastY = e.clientY;
      lastTime = performance.now();
      velocityY = 0;
      handleBar.setPointerCapture?.(e.pointerId);
    });

    handleBar.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      velocityY = ((e.clientY - lastY) / dt) * 1000; // px/s
      lastY = e.clientY;
      lastTime = now;
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      const dy = (e.clientY || lastY) - startY;
      const cur = state.mobileSheetSnap || 'default';
      if (velocityY < -420 || dy < -50) {
        applySheetSnap(cur === 'peek' ? 'default' : 'expanded');
      } else if (velocityY > 420 || dy > 50) {
        applySheetSnap(cur === 'expanded' ? 'default' : 'peek');
      }
    };

    handleBar.addEventListener('pointerup', endDrag);
    handleBar.addEventListener('pointercancel', endDrag);
  }

  // 2. Arrasto para Baixo (Dismiss com Flick) no Cabeçalho do HUD (#hud-drag-header)
  const hudHeader = document.getElementById('hud-drag-header');
  const hudEl = document.getElementById('signal-focus-hud');
  if (hudHeader && hudEl) {
    let startY = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocityY = 0;
    let draggingHud = false;

    hudHeader.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || e.target.closest('input')) return;
      draggingHud = true;
      startY = e.clientY;
      lastY = e.clientY;
      lastTime = performance.now();
      velocityY = 0;
      hudHeader.setPointerCapture?.(e.pointerId);
    });

    hudHeader.addEventListener('pointermove', (e) => {
      if (!draggingHud) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      velocityY = ((e.clientY - lastY) / dt) * 1000;
      lastY = e.clientY;
      lastTime = now;
      const dy = Math.max(0, e.clientY - startY);
      if (window.innerWidth < 768) {
        hudEl.style.transform = `translateY(${dy * 0.65}px)`;
      }
    });

    const finishHudDrag = (e) => {
      if (!draggingHud) return;
      draggingHud = false;
      const dy = (e.clientY || lastY) - startY;
      if (velocityY > 520 || dy > 95) {
        closeSignalHUD();
      } else {
        hudEl.style.transform = '';
      }
    };

    hudHeader.addEventListener('pointerup', finishHudDrag);
    hudHeader.addEventListener('pointercancel', finishHudDrag);
  }
}
