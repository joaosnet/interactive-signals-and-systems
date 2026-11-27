// ============================================================================
// UI/EVENTS.JS — Ligação dos eventos da interface (cliques, teclado, sliders) às ações
// ============================================================================

import { state, saveStatePreferences } from '../state.js';
import { latexToExpr } from '../math-engine.js';
import { updateScene3D, setCameraPreset } from '../stage-3d.js';
import { updateNotebookUI } from '../notebook.js';
import { toggleAudio, updateAudioSynth } from '../audio.js';
import { activeModule, neighborModule, clampToSlider } from '../modules/index.js';
import { recomputeFourier } from '../modules/fourier.js';
import { selectCTFTPreset, switchModule, setStep, updateSliderBadge, updatePlayButtonUI, refreshAfterPresetChange, renderPresetGallery } from '../ui.js';
import { setFontScale, toggleHighContrast, toggleReduceMotion, applyTheme, toggleSectionVisibility } from './preferences.js';
import { applyLanguage } from './language.js';
import { syncInputsWithPreset, hudState, setHUDExpressionLive, updateParametricHUDPreview, syncVirtualKeyboardOffset, setHUDInputMode, openMathKeyboard, hideMathKeyboard, openSignalHUD, closeSignalHUD, applySignalHUD, pinSignalHUD } from './hud.js';
import { setupA11yBarScroll, setupMathLiveVirtualKeyboard, wireAnchoredPopover, setupToolbarRovingTabindex, setupMobileSheetGestures } from './widgets.js';

export function initUIEventListeners() {
  // 1. Segmented Control Switcher
  // Setas esquerda/direita percorrem as abas do seletor (padrão ARIA de tablist)
  const moduleNav = document.getElementById('module-switcher');
  if (moduleNav) {
    moduleNav.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      e.stopPropagation();
      switchModule(neighborModule(e.key === 'ArrowRight' ? 1 : -1).id);
      document.getElementById(`mod-btn-${state.activeModule}`)?.focus();
    });
  }

  // 2. Vistas de Câmera 3D/2D
  ['3d', '2d-time', '2d-spec', 'top'].forEach(presetName => {
    const btn = document.getElementById(`btn-cam-${presetName}`);
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setCameraPreset(presetName);
      });
    }
  });

  // 3. Passos 1 a 4
  document.querySelectorAll('.step-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = Number(btn.getAttribute('data-step'));
      state.isPlaying = true;
      updatePlayButtonUI();
      setStep(s, true);
    });
  });
  document.querySelectorAll('.zen-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = Number(btn.getAttribute('data-step'));
      state.isPlaying = true;
      updatePlayButtonUI();
      setStep(s, true);
    });
  });

  // 4. Play / Pause
  document.querySelectorAll('.play-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.isPlaying = !state.isPlaying;
      updatePlayButtonUI();
      updateNotebookUI(false);
    });
  });

  // 5. Sliders
  const tSlider = document.getElementById('t-slider');
  if (tSlider) {
    tSlider.addEventListener('input', (e) => {
      activeModule().slider().set(parseFloat(e.target.value));
      updateSliderBadge();
      updateNotebookUI(false);
      updateScene3D();
    });
  }

  const fourierSlider = document.getElementById('fourier-n-slider');
  if (fourierSlider) {
    fourierSlider.addEventListener('input', (e) => {
      state.fourierN = parseInt(e.target.value, 10);
      const badge = document.getElementById('fourier-n-badge');
      if (badge) badge.textContent = `N = ${state.fourierN}`;
      recomputeFourier();
      updateNotebookUI(false);
      updateScene3D();
      updateAudioSynth();
    });
  }

  const applyFourierT0 = (rawVal) => {
    const num = parseFloat(rawVal);
    if (!Number.isFinite(num) || num < 0.5) return;
    state.fourierT0 = num;
    recomputeFourier();
    syncInputsWithPreset();
    renderPresetGallery();
    updateNotebookUI(false);
    updateScene3D();
    updateAudioSynth();
  };

  const fourierT0Input = document.getElementById('fourier-t0-input');
  if (fourierT0Input) {
    fourierT0Input.addEventListener('change', (e) => applyFourierT0(e.target.value));
    fourierT0Input.addEventListener('input', (e) => applyFourierT0(e.target.value));
  }

  const hudFourierT0Input = document.getElementById('hud-fourier-t0-input');
  if (hudFourierT0Input) {
    hudFourierT0Input.addEventListener('change', (e) => applyFourierT0(e.target.value));
    hudFourierT0Input.addEventListener('input', (e) => applyFourierT0(e.target.value));
  }

  // 6. Formas de Fourier (Compacta / Trigonométrica / Exponencial)
  ['compact', 'trig', 'exp'].forEach(fKey => {
    const btn = document.getElementById(`btn-form-${fKey}`);
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.fourier-form-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.fourierForm = fKey;
        updateNotebookUI(false);
        updateScene3D();
      });
    }
  });

  // 7. Áudio Web
  const btnAudio = document.getElementById('btn-audio-toggle');
  if (btnAudio) {
    btnAudio.addEventListener('click', () => {
      const enabled = toggleAudio();
      btnAudio.classList.toggle('active', enabled);
      btnAudio.style.borderColor = enabled ? 'var(--c-conv)' : '';
      btnAudio.style.color = enabled ? 'var(--c-conv)' : '';
    });
  }

  // 8. Modo Foco / Zen
  const btnZen = document.getElementById('btn-zen-mode');
  const zenExitBtn = document.getElementById('zen-exit-btn');
  const toggleZen = () => {
    state.zenMode = !state.zenMode;
    document.body.classList.toggle('zen-mode', state.zenMode);
    if (btnZen) btnZen.classList.toggle('active', state.zenMode);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 260);
  };
  if (btnZen) btnZen.addEventListener('click', toggleZen);
  if (zenExitBtn) zenExitBtn.addEventListener('click', toggleZen);

  // 9. Popover de Camadas (Popover API Nativo + Âncora Responsiva)
  const layersBtn = document.getElementById('btn-layers-toggle');
  const layersPopover = document.getElementById('layers-popover');
  wireAnchoredPopover(layersBtn, layersPopover, { align: 'end' });

  ['waterfall', 'labels', 'spectrumWall', 'phaseSpectrum', 'grid', 'thickStroke'].forEach(layerKey => {
    const cb = document.getElementById(`layer-cb-${layerKey}`);
    if (cb) {
      cb.checked = state.layers[layerKey] !== false;
      cb.addEventListener('change', () => {
        state.layers[layerKey] = cb.checked;
        saveStatePreferences();
        updateScene3D();
      });
    }
  });

  // 10. Popover de Configurações (Popover API Nativo + Fallback Ancorado - Modern Web Guidance)
  const settingsBtn = document.getElementById('btn-settings-toggle');
  const settingsPopover = document.getElementById('settings-popover');
  wireAnchoredPopover(settingsBtn, settingsPopover, { align: 'end' });

  // Temas (Popover + Botão Ciclista Animado na Barra de Acessibilidade)
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.getAttribute('data-theme'), true);
    });
  });

  const themeCycleBtn = document.getElementById('btn-theme-cycle');
  if (themeCycleBtn) {
    themeCycleBtn.addEventListener('click', () => {
      const order = ['projector', 'dark', 'light'];
      const curIdx = order.indexOf(state.theme || 'projector');
      const nextTheme = order[(curIdx + 1) % order.length];
      applyTheme(nextTheme, true);
    });
  }

  // Idioma (Barra de Acessibilidade + Popover de Configurações)
  const langBtn = document.getElementById('btn-lang-toggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      applyLanguage(state.lang === 'pt' ? 'en' : 'pt');
    });
  }
  document.querySelectorAll('.lang-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetLang = btn.getAttribute('data-lang');
      if (targetLang) applyLanguage(targetLang);
    });
  });

  // Velocidade da Animação
  ['0.5', '1.0', '2.0'].forEach(spd => {
    const btn = document.getElementById(`spd-btn-${spd}`);
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.spd-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.animSpeed = parseFloat(spd);
      });
    }
  });

  // Acessibilidade (A11y): Controles da Barra Dedicada
  const btnFontDec = document.getElementById('btn-font-dec');
  btnFontDec?.addEventListener('click', () => {
    if (btnFontDec.getAttribute('aria-disabled') === 'true') return;
    setFontScale(state.fontScale - 0.1);
  });
  document.getElementById('btn-font-reset')?.addEventListener('click', () => {
    setFontScale(1.0);
  });
  const btnFontInc = document.getElementById('btn-font-inc');
  btnFontInc?.addEventListener('click', () => {
    if (btnFontInc.getAttribute('aria-disabled') === 'true') return;
    setFontScale(state.fontScale + 0.1);
  });
  document.getElementById('btn-a11y-contrast')?.addEventListener('click', () => {
    toggleHighContrast();
  });
  document.getElementById('btn-a11y-motion')?.addEventListener('click', () => {
    toggleReduceMotion();
  });

  // Inicializa estado visual de Acessibilidade, Toolbar, Gestos e Teclado MathLive
  setFontScale(state.fontScale);
  toggleHighContrast(state.a11yHighContrast);
  toggleReduceMotion(state.a11yReduceMotion);
  setupA11yBarScroll(document.getElementById('a11y-scroll-strip'));
  setupA11yBarScroll(document.getElementById('hud-fn-quickbar'));
  setupToolbarRovingTabindex(document.getElementById('a11y-bar'));
  setupMathLiveVirtualKeyboard();
  setupMobileSheetGestures();

  // 11. Filtros de Personalização de Seções ("Mostrar no Painel" dentro de Configurações)
  ['notebook', 'regions', 'gallery'].forEach(secKey => {
    const pill = document.getElementById(`filter-pill-${secKey}`);
    if (pill) {
      toggleSectionVisibility(secKey, state.visibleSections[secKey]);
      pill.addEventListener('click', () => {
        toggleSectionVisibility(secKey);
      });
    }
  });

  // 12. Evento Disparado ao Clicar nas Curvas 3D, Rótulos Flutuantes ou Tabela CTFT
  // Módulos plugáveis avisam quando o preset muda por fora da galeria (ex.: tabela de pares)
  window.addEventListener('module-preset-changed', () => refreshAfterPresetChange());

  window.addEventListener('open-signal-hud', (e) => {
    const target = e.detail?.target;
    openSignalHUD(target);
  });
  window.addEventListener('select-ctft-preset', (e) => {
    const key = e.detail?.key;
    if (key) selectCTFTPreset(key);
  });

  // Alternadores de Sinal no Cabeçalho do HUD
  document.getElementById('hud-pill-x')?.addEventListener('click', () => openSignalHUD('x'));
  document.getElementById('hud-pill-h')?.addEventListener('click', () => openSignalHUD('h'));
  document.getElementById('hud-pill-fourier')?.addEventListener('click', () => openSignalHUD('fourier'));
  document.getElementById('hud-pill-ctft')?.addEventListener('click', () => openSignalHUD('ctft'));

  // Fechamento e Salvamento no Cabeçalho do HUD
  document.getElementById('hud-btn-close')?.addEventListener('click', () => closeSignalHUD());
  document.getElementById('stage-focus-backdrop')?.addEventListener('click', () => closeSignalHUD());
  document.getElementById('hud-btn-pin')?.addEventListener('click', () => pinSignalHUD());

  // Ciclo Mobile-Safe do Teclado Virtual (<math-field>, Botão ⌨, Modo Abc e Barra Rápida)
  const hudMathField = document.getElementById('hud-mathfield');
  const hudFreeInput = document.getElementById('hud-free-input');
  const syncFromMathField = () => {
    if (!hudMathField || hudState.syncingMathField) return;
    const rawLatex = typeof hudMathField.getValue === 'function' ? hudMathField.getValue() : (hudMathField.value || '');
    const parsedExpr = latexToExpr(rawLatex) || '0';
    hudState.baseExpression = parsedExpr;
    setHUDExpressionLive(parsedExpr, false);
  };

  if (hudMathField) {
    // IMPORTANTE: NUNCA colapsar layout no pointerdown para não mover o alvo sob o dedo no mobile!
    hudMathField.addEventListener('click', () => {
      openMathKeyboard();
    });
    hudMathField.addEventListener('input', syncFromMathField);
  }

  // Monitora visualViewport para teclado nativo Android/iOS quando em modo Abc
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (state.focusHUDActive && state.hudInputMode === 'text') {
        syncVirtualKeyboardOffset(true);
      }
    });
  }

  // Botão explícito ⌨ para abrir/fechar o teclado matemático sem perder o foco
  const kbdToggleBtn = document.getElementById('hud-btn-keyboard');
  if (kbdToggleBtn) {
    kbdToggleBtn.addEventListener('pointerdown', (e) => e.preventDefault());
    kbdToggleBtn.addEventListener('click', () => {
      if (state.hudInputMode === 'text') {
        setHUDInputMode('mathlive', true);
        openMathKeyboard();
        return;
      }
      if (window.mathVirtualKeyboard?.visible) {
        hideMathKeyboard();
      } else {
        openMathKeyboard();
      }
    });
  }

  // Botão alternador Abc (Teclado Matemático MathLive <-> Input Nativo Gboard/iOS)
  const modeToggleBtn = document.getElementById('hud-btn-input-mode');
  if (modeToggleBtn) {
    modeToggleBtn.addEventListener('pointerdown', (e) => e.preventDefault());
    modeToggleBtn.addEventListener('click', () => {
      const nextMode = state.hudInputMode === 'text' ? 'mathlive' : 'text';
      setHUDInputMode(nextMode, true);
    });
  }

  // Barra Rápida de Funções (#hud-fn-quickbar): inserção direta sem fechar o teclado
  document.querySelectorAll('.hud-fn-chip').forEach((chip) => {
    chip.addEventListener('pointerdown', (e) => e.preventDefault());
    chip.addEventListener('click', () => {
      const latexSnippet = chip.getAttribute('data-latex') || '';
      const textSnippet = chip.getAttribute('data-text') || '';
      if (state.hudInputMode === 'text' || !window.customElements?.get('math-field')) {
        if (hudFreeInput) {
          const cur = hudFreeInput.value === '0' ? '' : hudFreeInput.value;
          const start = typeof hudFreeInput.selectionStart === 'number' ? hudFreeInput.selectionStart : cur.length;
          const end = typeof hudFreeInput.selectionEnd === 'number' ? hudFreeInput.selectionEnd : cur.length;
          const next = cur.slice(0, start) + textSnippet + cur.slice(end);
          hudFreeInput.value = next || '0';
          const caret = start + textSnippet.length;
          hudFreeInput.focus();
          hudFreeInput.setSelectionRange?.(caret, caret);
          hudState.baseExpression = hudFreeInput.value;
          setHUDExpressionLive(hudState.baseExpression, false);
        }
      } else if (hudMathField) {
        if (typeof hudMathField.insert === 'function') {
          hudMathField.insert(latexSnippet, { focus: true, feedback: true });
        } else {
          hudMathField.value = (hudMathField.value || '') + latexSnippet;
        }
        syncFromMathField();
      }
    });
  });

  // Interagir com o construtor paramétrico fecha o teclado virtual suavemente
  const hudParamSection = document.getElementById('hud-parametric-section');
  if (hudParamSection) {
    hudParamSection.addEventListener('pointerdown', () => {
      if (hudMathField && document.activeElement === hudMathField) {
        try { hudMathField.blur(); } catch (_) {}
      }
      hideMathKeyboard();
    });
  }

  // Botões de Apagar e Limpar na Linha de Equação do HUD (mantém foco e teclado abertos)
  const backspaceBtn = document.getElementById('hud-key-backspace');
  if (backspaceBtn) {
    backspaceBtn.addEventListener('pointerdown', (e) => e.preventDefault());
    backspaceBtn.addEventListener('click', () => {
      if (state.hudInputMode === 'text' || !window.customElements?.get('math-field')) {
        if (hudFreeInput) {
          const cur = hudFreeInput.value || '';
          const start = typeof hudFreeInput.selectionStart === 'number' ? hudFreeInput.selectionStart : cur.length;
          const end = typeof hudFreeInput.selectionEnd === 'number' ? hudFreeInput.selectionEnd : cur.length;
          let next;
          let caret = start;
          if (end > start) {
            next = cur.slice(0, start) + cur.slice(end);
          } else if (start > 0) {
            next = cur.slice(0, start - 1) + cur.slice(end);
            caret = start - 1;
          } else {
            next = cur;
          }
          hudFreeInput.value = next || '0';
          hudFreeInput.focus();
          hudFreeInput.setSelectionRange?.(caret, caret);
          hudState.baseExpression = hudFreeInput.value;
          setHUDExpressionLive(hudState.baseExpression, false);
        }
      } else if (hudMathField) {
        if (typeof hudMathField.executeCommand === 'function') {
          hudMathField.executeCommand(['deleteBackward']);
        } else {
          const val = hudMathField.value || '';
          hudMathField.value = val.slice(0, -1);
        }
        syncFromMathField();
      }
    });
  }

  const clearBtn = document.getElementById('hud-key-clear');
  if (clearBtn) {
    clearBtn.addEventListener('pointerdown', (e) => e.preventDefault());
    clearBtn.addEventListener('click', () => {
      hudState.baseExpression = '0';
      if (state.hudInputMode === 'text' || !window.customElements?.get('math-field')) {
        if (hudFreeInput) {
          hudFreeInput.value = '';
          hudFreeInput.focus();
        }
        setHUDExpressionLive('0', false);
      } else if (hudMathField) {
        if (typeof hudMathField.setValue === 'function') {
          hudMathField.setValue('');
        } else {
          hudMathField.value = '';
        }
        setHUDExpressionLive('0', false);
      }
    });
  }

  // Seletor de Modo de Construção (= Substituir | + Somar | − Subtrair)
  const commitBlockBtn = document.getElementById('hud-btn-commit-block');
  document.querySelectorAll('.hud-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.hud-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode') || 'replace';
      state.hudBuildMode = mode;
      const freeInput = document.getElementById('hud-free-input');
      if (freeInput && freeInput.value.trim()) {
        hudState.baseExpression = freeInput.value.trim();
      }
      if (commitBlockBtn) {
        commitBlockBtn.classList.toggle('hidden', mode === 'replace');
      }
    });
  });

  if (commitBlockBtn) {
    commitBlockBtn.addEventListener('click', () => {
      updateParametricHUDPreview(true);
      const freeInput = document.getElementById('hud-free-input');
      if (freeInput && freeInput.value.trim()) {
        hudState.baseExpression = freeInput.value.trim();
      }
    });
  }

  // Pílulas de Formas Canônicas (aplicam em tempo real)
  document.querySelectorAll('.hud-shape-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.hud-shape-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      hudState.shape = pill.getAttribute('data-shape') || 'rect';
      updateParametricHUDPreview(true);
      if ((state.hudBuildMode || 'replace') === 'replace') {
        const freeInput = document.getElementById('hud-free-input');
        if (freeInput) hudState.baseExpression = freeInput.value.trim();
      }
    });
  });

  // Sliders Paramétricos do HUD (aplicam em tempo real)
  ['hud-slider-a', 'hud-slider-w', 'hud-slider-t0', 'hud-slider-alpha'].forEach(sliderId => {
    document.getElementById(sliderId)?.addEventListener('input', () => {
      updateParametricHUDPreview(true);
      if ((state.hudBuildMode || 'replace') === 'replace') {
        const freeInput = document.getElementById('hud-free-input');
        if (freeInput) hudState.baseExpression = freeInput.value.trim();
      }
    });
  });

  // Input de Equação Livre do HUD (aplica em tempo real sem sobrescrever enquanto digita)
  if (hudFreeInput) {
    hudFreeInput.addEventListener('input', (e) => {
      const rawVal = e.target.value;
      hudState.baseExpression = rawVal || '0';
      setHUDExpressionLive(rawVal, false);
    });
  }

  // Rewatch
  document.getElementById('btn-rewatch-write')?.addEventListener('click', () => {
    updateNotebookUI(true);
  });

  // Commute
  const commBtn = document.getElementById('btn-commute');
  if (commBtn) {
    commBtn.addEventListener('click', () => {
      state.isCommuted = !state.isCommuted;
      commBtn.classList.toggle('active', state.isCommuted);
      updateNotebookUI(true);
      updateScene3D();
    });
  }

  // Seq mode
  const seqBtn = document.getElementById('btn-seq-mode');
  if (seqBtn) {
    seqBtn.addEventListener('click', () => {
      state.seqMode = !state.seqMode;
      seqBtn.classList.toggle('active', state.seqMode);
      if (state.seqMode) {
        state.isPlaying = true;
        updatePlayButtonUI();
        setStep(1, true);
      }
    });
  }

  // 13. Atalhos Globais de Teclado
  window.addEventListener('keydown', (e) => {
    // Atalho Escape e Ctrl+Enter para o HUD de Sinal Flutuante
    if (state.focusHUDActive) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSignalHUD();
        return;
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        applySignalHUD();
        return;
      }
      // Com o editor de sinal aberto, os atalhos globais ficam desligados.
      return;
    }

    const tag = (e.target?.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'MATH-FIELD' || tag === 'SELECT') return;
    if (e.ctrlKey || e.metaKey) return;
    // Espaço/Enter em um botão focado devem ativar o botão, não o atalho global.
    const onControl = tag === 'BUTTON' || tag === 'A' || e.target?.getAttribute?.('role') === 'button';

    // Atalhos de Acessibilidade (A11y)
    if (e.altKey) {
      if (e.key === '+' || e.key === '=' || e.code === 'Equal' || e.code === 'NumpadAdd') {
        e.preventDefault();
        setFontScale(state.fontScale + 0.1);
        return;
      }
      if (e.key === '-' || e.key === '_' || e.code === 'Minus' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        setFontScale(state.fontScale - 0.1);
        return;
      }
      if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') {
        e.preventDefault();
        setFontScale(1.0);
        return;
      }
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        toggleHighContrast();
        return;
      }
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        toggleReduceMotion();
        return;
      }
    }

    if (e.key === ' ') {
      if (onControl) return;
      e.preventDefault();
      state.isPlaying = !state.isPlaying;
      updatePlayButtonUI();
    } else if (e.key === ']' || e.key === '[') {
      // Tab fica livre para a navegação por teclado; '[' e ']' percorrem os módulos.
      e.preventDefault();
      switchModule(neighborModule(e.key === ']' ? 1 : -1).id);
    } else if (['1', '2', '3', '4'].includes(e.key)) {
      setStep(Number(e.key), true);
    } else if (e.key.toLowerCase() === 'z') {
      toggleZen();
    } else if (e.key.toLowerCase() === 'm' && state.activeModule === 'fourier') {
      btnAudio?.click();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const spec = activeModule().slider();
      spec.set(clampToSlider(spec, spec.get() + dir * spec.keyStep));
      const slider = document.getElementById('t-slider');
      if (slider) slider.value = spec.get();
      updateSliderBadge();
      updateNotebookUI(false);
      updateScene3D();
    }
  });
}
