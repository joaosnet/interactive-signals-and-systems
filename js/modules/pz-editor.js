// ============================================================================
// MODULES/PZ-EDITOR.JS — Mini-plano para montar um sinal com polos e zeros
// ----------------------------------------------------------------------------
// Cartão da galeria de Laplace (plano s) e de Z (plano z). O aluno escolhe a
// ferramenta, clica no plano para adicionar e arrasta para mover; o conjugado de
// um polo ou zero complexo acompanha sozinho. A ROC é escolhida numa lista com
// as regiões que os polos atuais permitem. O palco 3D acompanha ao vivo.
//
// O editor trabalha num rascunho (`draft`); o módulo decide o que fazer com ele
// em onChange(draft, { final }) e devolve o resultado da validação.
// ============================================================================

import { expandConj, rocText } from '../pz-engine.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SIZE = 220;                       // lado do mini-plano, em unidades do viewBox
const RANGE = { s: 4, z: 2.2 };         // o plano mostra de -RANGE a +RANGE nos dois eixos
const MAX_ITEMS = 4;                    // polos (e zeros) guardados; conjugados não contam
const SNAP = 0.1;

const TEXT = {
  pt: {
    title: { s: 'Monte o seu X(s) com polos e zeros', z: 'Monte o seu X(z) com polos e zeros' },
    active: 'em uso',
    tools: { move: 'Mover', pole: '+ Polo', zero: '+ Zero', erase: 'Apagar' },
    toolHint: {
      move: 'Arraste um polo (×) ou zero (○). Com o teclado: Tab até ele e use as setas.',
      pole: 'Clique no plano para pôr um polo. Fora do eixo real, o conjugado entra junto.',
      zero: 'Clique no plano para pôr um zero. Fora do eixo real, o conjugado entra junto.',
      erase: 'Clique num polo ou zero para apagar.'
    },
    roc: 'ROC:', gain: 'Ganho K:', reset: 'Recomeçar',
    plane: { s: 'Plano s: clique para adicionar, arraste para mover', z: 'Plano z: clique para adicionar, arraste para mover' },
    pole: 'Polo', zero: 'Zero', at: 'em',
    poles: 'Polos', zeros: 'Zeros', none: 'nenhum',
    full: `No máximo ${MAX_ITEMS} de cada tipo (os conjugados não contam).`,
    errors: {
      nopole: 'Adicione pelo menos um polo.',
      improper: 'Em Laplace o número de zeros precisa ser menor que o de polos.',
      repeated: 'Dois polos estão no mesmo lugar: afaste um do outro.',
      empty: 'Adicione pelo menos um polo ou um zero.',
      narrow: 'O anel escolhido é estreito demais: afaste os polos ou escolha outra ROC.'
    }
  },
  en: {
    title: { s: 'Build your X(s) from poles and zeros', z: 'Build your X(z) from poles and zeros' },
    active: 'in use',
    tools: { move: 'Move', pole: '+ Pole', zero: '+ Zero', erase: 'Erase' },
    toolHint: {
      move: 'Drag a pole (×) or zero (○). With the keyboard: Tab to it and use the arrow keys.',
      pole: 'Click the plane to place a pole. Off the real axis, its conjugate comes along.',
      zero: 'Click the plane to place a zero. Off the real axis, its conjugate comes along.',
      erase: 'Click a pole or zero to erase it.'
    },
    roc: 'ROC:', gain: 'Gain K:', reset: 'Start over',
    plane: { s: 's-plane: click to add, drag to move', z: 'z-plane: click to add, drag to move' },
    pole: 'Pole', zero: 'Zero', at: 'at',
    poles: 'Poles', zeros: 'Zeros', none: 'none',
    full: `At most ${MAX_ITEMS} of each kind (conjugates do not count).`,
    errors: {
      nopole: 'Add at least one pole.',
      improper: 'In Laplace the number of zeros must be smaller than the number of poles.',
      repeated: 'Two poles are in the same place: move one away.',
      empty: 'Add at least one pole or one zero.',
      narrow: 'The chosen ring is too narrow: move the poles apart or pick another ROC.'
    }
  }
};

// Ferramenta e foco sobrevivem quando a galeria é redesenhada
const toolByKind = { s: 'move', z: 'move' };
let pendingFocus = null;

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'text') node.textContent = value;
    else if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  });
  children.forEach((child) => node.append(child));
  return node;
}

function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
  return node;
}

const num = (v) => {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};
const pointText = (p) => (p.im < 0.04 ? num(p.re) : `${num(p.re)} ± j${num(p.im)}`);
const snap = (v) => Math.round(v / SNAP) * SNAP;

/**
 * @param options { kind: 's' | 'z', isEn, active, draft, onChange(draft, { final }) → resultado da validação }
 *   resultado: { ok, error?, regions, rocIndex }
 */
export function renderPZEditor(gallery, { kind, isEn, active, draft, onChange }) {
  const t = TEXT[isEn ? 'en' : 'pt'];
  const R = RANGE[kind];
  const toX = (re) => ((re + R) / (2 * R)) * SIZE;
  const toY = (im) => ((R - im) / (2 * R)) * SIZE;
  const scale = SIZE / (2 * R);

  const status = el('p', { class: 'pz-status', role: 'status', 'aria-live': 'polite' });
  const readout = el('p', { class: 'pz-readout' });
  const hint = el('p', { class: 'pz-hint' });
  const rocSelect = el('select', { class: 'pz-select', id: `pz-roc-${kind}` });
  const gainInput = el('input', { class: 'pz-gain', id: `pz-gain-${kind}`, type: 'number', step: '0.5', min: '-20', max: '20', value: String(draft.gain ?? 1) });

  const plane = svg('svg', { viewBox: `0 0 ${SIZE} ${SIZE}`, class: 'pz-plane', role: 'group', 'aria-label': t.plane[kind] });
  const rocLayer = svg('g');
  const gridLayer = svg('g');
  const markLayer = svg('g');
  plane.append(rocLayer, gridLayer, markLayer);

  // ---- Grade fixa ----
  for (let v = Math.ceil(-R); v <= R; v++) {
    gridLayer.append(svg('line', { x1: toX(v), y1: 0, x2: toX(v), y2: SIZE, class: v === 0 ? 'pz-axis' : 'pz-grid' }));
    gridLayer.append(svg('line', { x1: 0, y1: toY(v), x2: SIZE, y2: toY(v), class: v === 0 ? 'pz-axis' : 'pz-grid' }));
  }
  if (kind === 'z') gridLayer.append(svg('circle', { cx: toX(0), cy: toY(0), r: scale, class: 'pz-unit' }));
  const axisLabel = (text, x, y) => {
    const node = svg('text', { x, y, class: 'pz-axis-label' });
    node.textContent = text;
    gridLayer.append(node);
  };
  axisLabel(kind === 's' ? 'σ' : 'Re', SIZE - 16, toY(0) - 4);
  axisLabel(kind === 's' ? 'jω' : 'Im', toX(0) + 4, 10);

  let lastResult = { ok: true, regions: [], rocIndex: 0 };

  const emit = (final) => {
    lastResult = onChange(draft, { final }) || lastResult;
    paint();
  };

  // ---- Desenho que muda a cada edição ----
  function paint() {
    // ROC
    rocLayer.replaceChildren();
    const region = lastResult.ok ? lastResult.regions?.[lastResult.rocIndex] : null;
    if (region) {
      if (kind === 's') {
        const x0 = toX(Math.max(-R, region.min));
        const x1 = toX(Math.min(R, region.max));
        if (x1 > x0) rocLayer.append(svg('rect', { x: x0, y: 0, width: x1 - x0, height: SIZE, class: 'pz-roc' }));
      } else {
        const outer = Math.min(R * 1.5, region.max) * scale;
        const inner = Math.max(0, region.min) * scale;
        const cx = toX(0);
        const cy = toY(0);
        const ring = (r) => `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
        rocLayer.append(svg('path', { d: `${ring(outer)} ${inner > 0.5 ? ring(inner) : ''}`, 'fill-rule': 'evenodd', class: 'pz-roc' }));
      }
    }

    // Polos e zeros (com o conjugado, quando houver)
    markLayer.replaceChildren();
    const drawList = (type, list) => list.forEach((item, index) => {
      const copies = item.im < 0.04 ? [1] : [1, -1];
      copies.forEach((sign) => {
        const g = svg('g', {
          class: `pz-mark pz-${type}`, tabindex: sign === 1 ? 0 : -1, role: 'button',
          transform: `translate(${toX(item.re)} ${toY(sign * item.im)})`,
          'aria-label': `${type === 'pole' ? t.pole : t.zero} ${t.at} ${pointText(item)}`,
          'data-type': type, 'data-index': index, 'data-sign': sign
        });
        g.append(svg('circle', { r: 11, class: 'pz-hit' }));
        if (type === 'pole') {
          g.append(svg('line', { x1: -5, y1: -5, x2: 5, y2: 5 }), svg('line', { x1: 5, y1: -5, x2: -5, y2: 5 }));
        } else {
          g.append(svg('circle', { r: 5.5 }));
        }
        markLayer.append(g);
      });
    });
    drawList('zero', draft.zeros);
    drawList('pole', draft.poles);

    // Lista de ROCs possíveis
    const regions = lastResult.regions || [];
    rocSelect.replaceChildren(...regions.map((rg, i) => {
      const opt = el('option', { value: String(i), text: rocText(rg, kind) });
      if (i === lastResult.rocIndex) opt.selected = true;
      return opt;
    }));
    rocSelect.disabled = regions.length <= 1;

    readout.textContent = `${t.poles}: ${draft.poles.map(pointText).join('; ') || t.none}  ·  ${t.zeros}: ${draft.zeros.map(pointText).join('; ') || t.none}`;
    status.textContent = lastResult.ok ? '' : (t.errors[lastResult.error] || '');
    status.classList.toggle('is-error', !lastResult.ok);
    hint.textContent = t.toolHint[toolByKind[kind]];

    if (pendingFocus && pendingFocus.kind === kind) {
      const target = markLayer.querySelector(`[data-type="${pendingFocus.type}"][data-index="${pendingFocus.index}"][data-sign="1"]`);
      pendingFocus = null;
      target?.focus();
    }
  }

  // ---- Ponteiro ----
  const pointFromEvent = (e) => {
    const rect = plane.getBoundingClientRect();
    const re = ((e.clientX - rect.left) / rect.width) * 2 * R - R;
    const im = R - ((e.clientY - rect.top) / rect.height) * 2 * R;
    return { re: Math.max(-R, Math.min(R, snap(re))), im: Math.max(-R, Math.min(R, snap(im))) };
  };
  const place = (item, p, sign) => {
    item.re = p.re;
    const im = Math.abs(sign === -1 ? -p.im : p.im);
    // Perto do eixo real, vira polo/zero real (sem conjugado)
    item.im = (sign === -1 ? p.im > 0 : p.im < 0) || im < 0.15 ? 0 : im;
  };

  let drag = null;
  plane.addEventListener('pointerdown', (e) => {
    const mark = e.target.closest?.('.pz-mark');
    const tool = toolByKind[kind];
    if (mark) {
      const list = mark.dataset.type === 'pole' ? draft.poles : draft.zeros;
      const index = Number(mark.dataset.index);
      if (tool === 'erase') {
        list.splice(index, 1);
        draft.rocIndex = null;
        emit(true);
        return;
      }
      drag = { list, index, sign: Number(mark.dataset.sign), type: mark.dataset.type };
      plane.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }
    if (tool === 'pole' || tool === 'zero') {
      const list = tool === 'pole' ? draft.poles : draft.zeros;
      if (list.length >= MAX_ITEMS) {
        status.textContent = t.full;
        status.classList.add('is-error');
        return;
      }
      const p = pointFromEvent(e);
      const item = { re: p.re, im: 0 };
      place(item, p, 1);
      list.push(item);
      if (tool === 'pole') draft.rocIndex = null; // regiões mudaram: volta para a causal
      emit(true);
    }
  });
  plane.addEventListener('pointermove', (e) => {
    if (!drag) return;
    place(drag.list[drag.index], pointFromEvent(e), drag.sign);
    emit(false);
  });
  const endDrag = (e) => {
    if (!drag) return;
    pendingFocus = { kind, type: drag.type, index: drag.index };
    drag = null;
    if (plane.hasPointerCapture?.(e.pointerId)) plane.releasePointerCapture(e.pointerId);
    emit(true);
  };
  plane.addEventListener('pointerup', endDrag);
  plane.addEventListener('pointercancel', endDrag);

  // ---- Teclado: setas movem, Delete apaga ----
  plane.addEventListener('keydown', (e) => {
    const mark = e.target.closest?.('.pz-mark');
    if (!mark) return;
    const list = mark.dataset.type === 'pole' ? draft.poles : draft.zeros;
    const index = Number(mark.dataset.index);
    const item = list[index];
    const stepSize = e.shiftKey ? 0.5 : SNAP;
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    if (moves[e.key]) {
      e.preventDefault();
      item.re = Math.max(-R, Math.min(R, snap(item.re + moves[e.key][0] * stepSize)));
      item.im = Math.max(0, Math.min(R, snap(item.im + moves[e.key][1] * stepSize)));
      pendingFocus = { kind, type: mark.dataset.type, index };
      emit(true);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      list.splice(index, 1);
      draft.rocIndex = null;
      emit(true);
    }
  });

  // ---- Ferramentas, ROC e ganho ----
  const toolButtons = Object.keys(t.tools).map((tool) => {
    const btn = el('button', { type: 'button', class: 'pz-tool', 'aria-pressed': String(toolByKind[kind] === tool), text: t.tools[tool] });
    btn.addEventListener('click', () => {
      toolByKind[kind] = tool;
      toolButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      plane.dataset.tool = tool;
      hint.textContent = t.toolHint[tool];
    });
    return btn;
  });
  plane.dataset.tool = toolByKind[kind];
  const resetBtn = el('button', { type: 'button', class: 'pz-tool pz-reset', text: t.reset });
  resetBtn.addEventListener('click', () => {
    const fresh = kind === 's'
      ? { poles: [{ re: -1, im: 2 }], zeros: [], gain: 1, rocIndex: null }
      : { poles: [{ re: 0.6, im: 0.5 }], zeros: [{ re: 0, im: 0 }], gain: 1, rocIndex: null };
    Object.assign(draft, fresh);
    gainInput.value = '1';
    emit(true);
  });
  rocSelect.addEventListener('change', () => {
    draft.rocIndex = Number(rocSelect.value);
    emit(true);
  });
  gainInput.addEventListener('change', () => {
    const g = Number(gainInput.value);
    draft.gain = Number.isFinite(g) && Math.abs(g) > 1e-6 ? Math.max(-20, Math.min(20, g)) : 1;
    gainInput.value = String(draft.gain);
    emit(true);
  });

  const head = el('div', { class: 'seq-editor-head' }, [el('span', { class: 'seq-editor-title', text: t.title[kind] })]);
  if (active) head.append(el('span', { class: 'seq-editor-badge', text: t.active }));

  const card = el('div', { class: `pz-editor preset-create-card col-span-2 rounded-xl p-2.5 ${active ? 'is-active' : ''}` }, [
    head,
    el('div', { class: 'pz-tools', role: 'group' }, [...toolButtons, resetBtn]),
    hint,
    plane,
    el('div', { class: 'pz-fields' }, [
      el('label', { for: rocSelect.id, class: 'pz-label', text: t.roc }), rocSelect,
      el('label', { for: gainInput.id, class: 'pz-label', text: t.gain }), gainInput
    ]),
    readout,
    status
  ]);
  // Atalhos do simulador não devem agir enquanto se edita aqui
  card.addEventListener('keydown', (e) => e.stopPropagation());
  card.addEventListener('keyup', (e) => e.stopPropagation());
  gallery.appendChild(card);

  // Primeiro desenho: valida o rascunho sem alterar o que está no palco
  lastResult = onChange(draft, { final: false, dryRun: true }) || lastResult;
  paint();
  return card;
}

/** Quantos polos e zeros o plano de fato mostra (para testes e leitores de tela). */
export function countMarkers(draft) {
  return { poles: expandConj(draft.poles).length, zeros: expandConj(draft.zeros).length };
}
