// ============================================================================
// SEQ-PARSE.JS — Leitura de uma sequência digitada pelo aluno (sem DOM)
// ----------------------------------------------------------------------------
// Aceita o que as pessoas de fato digitam:
//   "1, 2, 3"        vírgula como separador
//   "1 2 3"          espaço como separador
//   "0,5; 1,5; 2"    ponto e vírgula como separador → vírgula vira decimal
//   "1/3, -2, 1e-1"  frações simples e notação científica
// Nada é avaliado como código: cada item precisa ser um número ou uma fração.
// ============================================================================

export const SEQ_MAX_ABS = 1000;

const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

function parseItem(raw) {
  const item = raw.trim();
  if (!item) return NaN;
  const parts = item.split('/');
  if (parts.length > 2) return NaN;
  if (!parts.every((p) => NUMBER.test(p.trim()))) return NaN;
  const num = Number(parts[0]);
  if (parts.length === 1) return num;
  const den = Number(parts[1]);
  return den === 0 ? NaN : num / den;
}

/**
 * @returns { ok: true, values } ou { ok: false, error, item? }
 *   error: 'empty' | 'long' | 'invalid' (item = trecho que não é número) | 'range'
 */
export function parseSequence(text, { maxLen = 32 } = {}) {
  const src = String(text ?? '').replace(/[[\]{}()]/g, ' ').trim();
  if (!src) return { ok: false, error: 'empty' };
  let items;
  if (src.includes(';')) {
    items = src.split(';').map((s) => s.replace(',', '.'));
  } else if (src.includes(',')) {
    items = src.split(',');
  } else {
    items = src.split(/\s+/);
  }
  items = items.map((s) => s.trim()).filter((s, i, arr) => s !== '' || (i > 0 && i < arr.length - 1));
  if (items.length === 0) return { ok: false, error: 'empty' };
  if (items.length > maxLen) return { ok: false, error: 'long', max: maxLen };
  const values = [];
  for (const item of items) {
    const v = parseItem(item);
    if (!Number.isFinite(v)) return { ok: false, error: 'invalid', item: item.slice(0, 12) };
    if (Math.abs(v) > SEQ_MAX_ABS) return { ok: false, error: 'range', item: item.slice(0, 12) };
    values.push(Object.is(v, -0) ? 0 : v);
  }
  return { ok: true, values };
}

/** Índice inteiro da primeira amostra, limitado à faixa permitida. */
export function parseStart(text, { min = -10, max = 10 } = {}) {
  const v = Math.round(Number(String(text ?? '').replace(',', '.')));
  if (!Number.isFinite(v)) return 0;
  return Math.max(min, Math.min(max, v));
}

/** Texto para devolver ao campo: "1, 0.5, -2". */
export function formatSequence(values) {
  return values.map((v) => String(Math.round(v * 1e4) / 1e4)).join(', ');
}
