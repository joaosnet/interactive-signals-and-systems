// ============================================================================
// LANG.JS — Escolha de texto por idioma (português, inglês, espanhol)
// ----------------------------------------------------------------------------
// O código nasceu bilíngue, com `isEn ? 'texto em inglês' : 'texto em português'`.
// O espanhol entra sem reescrever cada ponto:
//   isEn ? 'Signal' : tx('Sinal', 'Señal')
// tx() devolve o texto em espanhol quando o idioma é 'es' e o português nos demais
// casos (o inglês é resolvido antes, pelo próprio ternário).
// ============================================================================

import { state } from './state.js';

export const LANGS = ['pt', 'en', 'es'];
export const LANG_NAMES = { pt: 'Português', en: 'English', es: 'Español' };
export const HTML_LANG = { pt: 'pt-BR', en: 'en', es: 'es' };

/** Texto em português ou, com o site em espanhol, a tradução. */
export const tx = (pt, es) => (state.lang === 'es' ? es : pt);

/** Idioma atual, sempre um dos três suportados. Serve de chave em { pt, en, es }. */
export const langKey = () => (LANGS.includes(state.lang) ? state.lang : 'pt');

/** Próximo idioma na ordem do botão de troca: pt → en → es → pt. */
export const nextLang = (lang = state.lang) => LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length] || 'pt';

/**
 * Campo de um objeto com variantes por sufixo: title / titleEn / titleEs.
 * Se a variante do idioma não existe, cai no português.
 */
export function loc(obj, field) {
  if (!obj) return '';
  const lang = langKey();
  if (lang === 'en') return obj[`${field}En`] ?? obj[field] ?? '';
  if (lang === 'es') return obj[`${field}Es`] ?? obj[field] ?? '';
  return obj[field] ?? '';
}

/** Escolhe entre { pt, en, es }, caindo no português quando falta a tradução. */
export const pick = (dict) => dict?.[langKey()] ?? dict?.pt;
