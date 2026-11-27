// ============================================================================
// MODULES/SEQ-EDITOR.JS — Cartão "digite a sua sequência", usado na galeria
// ----------------------------------------------------------------------------
// Convolução discreta, DTFT e DFT montam aqui o editor de amostras. Cada campo
// é uma lista de valores e, quando faz sentido, o índice n da primeira amostra.
// ============================================================================

import { parseSequence, parseStart, formatSequence } from '../seq-parse.js';

const TEXT = {
  pt: {
    apply: 'Usar esta sequência',
    applyMany: 'Usar estas sequências',
    start: 'começa em n =',
    hint: 'Separe os valores com vírgula ou espaço. Frações como 1/3 valem. Para decimal com vírgula, separe com ponto e vírgula: 0,5; 1,5.',
    active: 'em uso',
    errors: {
      empty: 'Digite pelo menos um valor.',
      long: (r) => `No máximo ${r.max} valores.`,
      invalid: (r) => `"${r.item}" não é um número.`,
      range: (r) => `"${r.item}" passa de 1000 em módulo.`,
      zero: 'A sequência não pode ser toda nula.'
    }
  },
  en: {
    apply: 'Use this sequence',
    applyMany: 'Use these sequences',
    start: 'starts at n =',
    hint: 'Separate values with commas or spaces. Fractions such as 1/3 work. For a decimal comma, separate with semicolons: 0,5; 1,5.',
    active: 'in use',
    errors: {
      empty: 'Type at least one value.',
      long: (r) => `At most ${r.max} values.`,
      invalid: (r) => `"${r.item}" is not a number.`,
      range: (r) => `"${r.item}" is over 1000 in magnitude.`,
      zero: 'The sequence cannot be all zeros.'
    }
  }
};

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

/**
 * @param gallery  contêiner da galeria (o cartão entra como primeiro item, largura total)
 * @param options  { isEn, title, active, fields: [{ id, label, values, start, hasStart, maxLen, startMin, startMax }],
 *                   onApply(result) }   result[id] = { values, start }
 */
export function renderSequenceEditor(gallery, { isEn, title, active, fields, onApply }) {
  const t = TEXT[isEn ? 'en' : 'pt'];
  const status = el('p', { class: 'seq-editor-status', role: 'status', 'aria-live': 'polite' });
  const inputs = {};

  const rows = fields.map((field) => {
    const valuesInput = el('input', {
      type: 'text', id: `seq-${field.id}`, class: 'seq-editor-input', value: formatSequence(field.values),
      autocomplete: 'off', spellcheck: 'false', inputmode: 'text'
    });
    inputs[field.id] = { values: valuesInput, field };
    const row = el('div', { class: 'seq-editor-row' }, [
      el('label', { for: valuesInput.id, class: 'seq-editor-label', text: field.label }),
      valuesInput
    ]);
    if (field.hasStart) {
      const startInput = el('input', {
        type: 'number', id: `seq-${field.id}-start`, class: 'seq-editor-start', value: String(field.start ?? 0),
        min: String(field.startMin ?? -10), max: String(field.startMax ?? 10), step: '1'
      });
      inputs[field.id].start = startInput;
      row.append(el('label', { for: startInput.id, class: 'seq-editor-startlabel', text: t.start }), startInput);
    }
    return row;
  });

  const applyBtn = el('button', { type: 'submit', class: 'seq-editor-apply', text: fields.length > 1 ? t.applyMany : t.apply });
  const head = el('div', { class: 'seq-editor-head' }, [el('span', { class: 'seq-editor-title', text: title })]);
  if (active) head.append(el('span', { class: 'seq-editor-badge', text: t.active }));

  const form = el('form', { class: `seq-editor preset-create-card col-span-2 rounded-xl p-2.5 ${active ? 'is-active' : ''}`, novalidate: '' }, [
    head, ...rows, el('p', { class: 'seq-editor-hint', text: t.hint }), el('div', { class: 'seq-editor-actions' }, [applyBtn, status])
  ]);
  // Atalhos do simulador (números, espaço, setas) não devem agir enquanto se digita aqui
  form.addEventListener('keydown', (e) => e.stopPropagation());
  form.addEventListener('keyup', (e) => e.stopPropagation());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const result = {};
    for (const { values, start, field } of Object.values(inputs)) {
      const parsed = parseSequence(values.value, { maxLen: field.maxLen ?? 32 });
      const allZero = parsed.ok && parsed.values.every((v) => v === 0);
      if (!parsed.ok || allZero) {
        const err = allZero ? t.errors.zero : t.errors[parsed.error];
        status.textContent = `${field.label} ${typeof err === 'function' ? err(parsed) : err}`;
        status.classList.add('is-error');
        values.focus();
        return;
      }
      result[field.id] = {
        values: parsed.values,
        start: start ? parseStart(start.value, { min: field.startMin ?? -10, max: field.startMax ?? 10 }) : 0
      };
    }
    status.textContent = '';
    status.classList.remove('is-error');
    onApply(result);
  });
  gallery.appendChild(form);
  return form;
}
