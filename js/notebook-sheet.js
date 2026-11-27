// ============================================================================
// NOTEBOOK-SHEET.JS — Caderno em foco
// ----------------------------------------------------------------------------
// Tira o caderno do painel e o põe no lugar do palco, como uma folha pautada em
// que a dedução vai sendo escrita à mão, linha por linha. O conteúdo é o mesmo
// do caderno do painel (getNotebookSnapshot); aqui muda só a apresentação.
//   - trocar de passo ou de exemplo vira "página nova" e é escrito de novo;
//   - mexer no slider atualiza os números no lugar, sem reescrever a folha.
// ============================================================================

import { state } from './state.js';
import { I18N } from './i18n.js';
import { renderMath } from './math-engine.js';
import { activeModule } from './modules/registry.js';
import { getNotebookSnapshot } from './notebook.js';
import { setStep } from './ui.js';
import { langKey } from './lang.js';

const RULE = 32;            // distância entre as pautas, em px (igual ao CSS)
const PEN_SPEED = 520;      // px por segundo com que a "caneta" percorre a linha
const TEXT = {
  pt: { open: 'Abrir caderno', openTitle: 'Abrir o caderno em foco, como uma folha', close: 'Voltar ao palco', prev: 'Passo anterior', next: 'Próximo passo', rewrite: 'Escrever de novo', step: 'Passo', sheet: 'Caderno em foco' },
  en: { open: 'Open notebook', openTitle: 'Open the notebook in focus, as a sheet of paper', close: 'Back to the stage', prev: 'Previous step', next: 'Next step', rewrite: 'Write again', step: 'Step', sheet: 'Notebook in focus' },
  es: { open: 'Abrir cuaderno', openTitle: 'Abrir el cuaderno en foco, como una hoja', close: 'Volver al escenario', prev: 'Paso anterior', next: 'Paso siguiente', rewrite: 'Escribir de nuevo', step: 'Paso', sheet: 'Cuaderno en foco' }
};
const txt = () => TEXT[langKey()];

const PEN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path></svg>';

let sheet = null;
let page = null;
let openBtn = null;
let writeToken = 0;         // invalida uma escrita em andamento quando outra começa
let pageKey = '';           // identifica a "página": módulo, passo, idioma e rótulos das linhas

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'text') node.textContent = value;
    else if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else node.setAttribute(key, value);
  });
  children.forEach((child) => node.append(child));
  return node;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Arredonda a altura da linha para um múltiplo da pauta, para a escrita "sentar" nas linhas. */
function snapToRule(row) {
  row.style.minHeight = '';
  // offsetHeight está em px de layout; getBoundingClientRect viria multiplicado pelo zoom da interface
  const h = row.offsetHeight;
  row.style.minHeight = `${Math.max(1, Math.ceil((h - 1) / RULE)) * RULE}px`;
}

function keyOf(snapshot) {
  return [activeModule().id, state.step, state.lang, ...snapshot.lines.map((l) => l.label)].join('|');
}

function headerText() {
  const dict = I18N[state.lang] || I18N.pt;
  const mod = activeModule();
  return {
    title: dict[mod.i18n.title] || mod.id,
    step: `${txt().step} ${state.step} — ${dict[`${mod.i18n.stepPrefix}${state.step}`] || ''}`
  };
}

/** Escreve a página inteira, uma linha por vez, com a caneta acompanhando o traço. */
async function writePage(snapshot) {
  const token = ++writeToken;
  const animate = !state.a11yReduceMotion;
  const head = headerText();
  page.replaceChildren();
  page.scrollTop = 0;

  const titleRow = el('div', { class: 'sheet-row sheet-title' }, [
    el('span', { class: 'sheet-ink', text: head.title }),
    el('span', { class: 'sheet-date', text: head.step })
  ]);
  page.append(titleRow);
  snapToRule(titleRow);

  const rows = snapshot.lines.map((line) => {
    const math = el('span', { class: 'sheet-math' });
    renderMath(math, line.latex, false);
    const ink = el('div', { class: 'sheet-ink sheet-formula' }, [math]);
    const row = el('div', { class: `sheet-row sheet-line${animate ? ' is-pending' : ''}` }, [
      el('div', { class: 'sheet-ink sheet-label', text: line.label }),
      ink
    ]);
    page.append(row);
    snapToRule(row);
    return { row, ink, math };
  });
  if (!animate) return;

  for (const { row, ink, math } of rows) {
    if (token !== writeToken) return;
    row.classList.remove('is-pending');
    row.classList.add('is-writing');
    const width = Math.max(60, math.offsetWidth);
    const duration = Math.min(2200, Math.max(450, (width / PEN_SPEED) * 1000));
    const pen = el('span', { class: 'sheet-pen', html: PEN_SVG });
    ink.append(pen);
    ink.style.setProperty('--write-ms', `${duration}ms`);
    ink.style.setProperty('--write-px', `${width}px`);
    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    // Uma pausa curta para o navegador registrar o estado inicial antes da transição
    // (temporizador, e não requestAnimationFrame, que para quando a aba fica em segundo plano)
    await wait(40);
    if (token !== writeToken) return;
    ink.classList.add('is-inking');
    await wait(duration + 140);
    pen.remove();
    row.classList.remove('is-writing');
    row.classList.add('is-written');
    ink.classList.remove('is-inking');
  }
}

/** Mesma página, números novos (slider ou animação): troca as fórmulas no lugar. */
function refreshPage(snapshot) {
  const rows = page.querySelectorAll('.sheet-line');
  snapshot.lines.forEach((line, i) => {
    const math = rows[i]?.querySelector('.sheet-math');
    if (!math || math.dataset.latex === line.latex) return;
    math.dataset.latex = line.latex;
    renderMath(math, line.latex, false);
    snapToRule(rows[i]);
  });
}

function sync(forceWrite = false) {
  if (!sheet || !state.notebookFocus) return;
  const snapshot = getNotebookSnapshot();
  const key = keyOf(snapshot);
  if (forceWrite || key !== pageKey) {
    pageKey = key;
    writePage(snapshot);
  } else {
    refreshPage(snapshot);
  }
  sheet.querySelector('.sheet-prev').disabled = state.step <= 1;
  sheet.querySelector('.sheet-next').disabled = state.step >= 4;
}

function syncLabels() {
  const t = txt();
  if (openBtn) {
    openBtn.querySelector('span').textContent = t.open;
    openBtn.title = t.openTitle;
  }
  if (!sheet) return;
  sheet.setAttribute('aria-label', t.sheet);
  const set = (sel, text) => {
    const node = sheet.querySelector(sel);
    node.title = text;
    node.setAttribute('aria-label', text);
  };
  set('.sheet-prev', t.prev);
  set('.sheet-next', t.next);
  set('.sheet-rewrite', t.rewrite);
  sheet.querySelector('.sheet-close span').textContent = t.close;
}

export function setNotebookFocus(on) {
  state.notebookFocus = Boolean(on);
  document.body.classList.toggle('notebook-focus', state.notebookFocus);
  sheet.hidden = !state.notebookFocus;
  if (openBtn) openBtn.setAttribute('aria-pressed', String(state.notebookFocus));
  if (state.notebookFocus) {
    syncLabels();
    pageKey = '';
    sync(true);
    sheet.querySelector('.sheet-close').focus();
  } else {
    writeToken++;
    openBtn?.focus();
  }
}

function init() {
  const host = document.getElementById('stage-wrapper');
  const lines = document.getElementById('notebook-lines');
  if (!host || !lines || sheet) return;

  page = el('div', { class: 'sheet-page', tabindex: '0' });
  const button = (cls, html) => el('button', { type: 'button', class: `sheet-btn ${cls}`, html });
  const prev = button('sheet-prev', '◀');
  const next = button('sheet-next', '▶');
  const rewrite = button('sheet-rewrite', '↻');
  const close = button('sheet-close', '<span></span> ✕');
  sheet = el('section', { id: 'notebook-sheet', class: 'notebook-sheet', role: 'region', hidden: '' }, [
    el('div', { class: 'sheet-paper' }, [page]),
    el('div', { class: 'sheet-toolbar' }, [prev, next, rewrite, close])
  ]);
  host.append(sheet);

  prev.addEventListener('click', () => { if (state.step > 1) setStep(state.step - 1); });
  next.addEventListener('click', () => { if (state.step < 4) setStep(state.step + 1); });
  rewrite.addEventListener('click', () => sync(true));
  close.addEventListener('click', () => setNotebookFocus(false));
  sheet.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setNotebookFocus(false);
    }
  });

  // Botão de abrir, no cabeçalho do caderno do painel
  const rewatch = document.getElementById('btn-rewatch-write');
  openBtn = el('button', { type: 'button', id: 'btn-notebook-focus', class: 'ui-control px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1', 'aria-pressed': 'false' }, [
    el('span', {})
  ]);
  openBtn.addEventListener('click', () => setNotebookFocus(!state.notebookFocus));
  if (rewatch) rewatch.before(openBtn);
  else lines.before(openBtn);
  syncLabels();

  window.addEventListener('notebook-updated', () => {
    syncLabels();
    sync(false);
  });
  // A largura da folha muda ao abrir, ao girar o celular e quando as fontes chegam:
  // em todos esses casos as linhas são reencaixadas na pauta.
  const resnap = () => {
    if (state.notebookFocus) page.querySelectorAll('.sheet-row').forEach(snapToRule);
  };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resnap).observe(page);
  else window.addEventListener('resize', resnap);
  document.fonts?.ready?.then(resnap);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}
