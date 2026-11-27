// ============================================================================
// FEEDBACK-CORE.JS — Regras do feedback e da contribuição (sem DOM)
// ----------------------------------------------------------------------------
// Dois caminhos para um relato virar issue no GitHub:
//   1. "Abrir no GitHub": link para o formulário de issue já preenchido
//      (a pessoa precisa de conta no GitHub e confirma o envio lá).
//   2. "Enviar sem conta": POST para um Cloudflare Worker (pasta worker/), que
//      cria a issue com um token guardado no servidor. Só fica disponível
//      quando FEEDBACK_ENDPOINT está preenchido.
// E os links para corrigir um arquivo pelo editor web do GitHub, que cria o
// fork e o pull request sem a pessoa precisar usar git.
// ============================================================================

export const REPO = 'joaosnet/interactive-signals-and-systems';
export const REPO_URL = `https://github.com/${REPO}`;
export const DEFAULT_BRANCH = 'main';

/**
 * URL do Worker de feedback anônimo (ver worker/README.md).
 * Vazio = caminho "sem conta" desligado; o site mostra só o caminho do GitHub.
 */
export const FEEDBACK_ENDPOINT = '';

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 4000;
export const NAME_MAX = 80;
// Formulários de issue recebem o texto pela URL; acima disso o GitHub recusa o link.
const URL_MESSAGE_MAX = 3000;

/** Tipos de relato: cada um aponta para um formulário de issue em .github/ISSUE_TEMPLATE. */
export const FEEDBACK_TYPES = {
  bug: { template: 'bug.yml', label: 'bug', prefix: '[Bug]', pt: 'Algo não funciona', en: 'Something is broken', es: 'Algo no funciona' },
  content: { template: 'conteudo.yml', label: 'conteudo', prefix: '[Conteúdo]', pt: 'Erro na matemática ou no texto', en: 'Mistake in the math or text', es: 'Error en la matemática o en el texto' },
  idea: { template: 'sugestao.yml', label: 'enhancement', prefix: '[Sugestão]', pt: 'Sugestão ou pedido', en: 'Suggestion or request', es: 'Sugerencia o pedido' },
  question: { template: 'sugestao.yml', label: 'question', prefix: '[Dúvida]', pt: 'Dúvida', en: 'Question', es: 'Duda' }
};

/** Arquivo de cada módulo (o id nem sempre é o nome do arquivo). */
const MODULE_FILE = { ztransform: 'z' };
export function moduleSourcePath(moduleId) {
  const safe = String(moduleId || '').replace(/[^a-z0-9_-]/gi, '');
  return `js/modules/${MODULE_FILE[safe] || safe || 'registry'}.js`;
}
export const TEXTS_SOURCE_PATH = 'js/i18n.js';

/** Link do editor web do GitHub: ao salvar, o GitHub cria o fork e propõe o pull request. */
export function editUrl(path) {
  return `${REPO_URL}/edit/${DEFAULT_BRANCH}/${path.split('/').map(encodeURIComponent).join('/')}`;
}
export const CONTRIBUTING_URL = `${REPO_URL}/blob/${DEFAULT_BRANCH}/CONTRIBUTING.md`;

/**
 * Contexto técnico anexado ao relato. Só o que ajuda a reproduzir: nada de
 * identificação da pessoa nem do aparelho além do tamanho da tela.
 */
export function buildContext({ moduleId, moduleTitle, step, lang, theme, viewport, url } = {}) {
  return [
    `- Módulo: ${moduleTitle || moduleId || '?'} (\`${moduleId || '?'}\`)`,
    `- Passo: ${step ?? '?'}`,
    `- Idioma: ${lang || '?'} · Tema: ${theme || '?'}`,
    `- Tela: ${viewport || '?'}`,
    `- Endereço: ${url || '?'}`
  ].join('\n');
}

export function validateFeedback({ type, message, name } = {}) {
  const text = String(message || '').trim();
  if (!FEEDBACK_TYPES[type]) return { ok: false, error: 'type' };
  if (text.length < MESSAGE_MIN) return { ok: false, error: 'short' };
  if (text.length > MESSAGE_MAX) return { ok: false, error: 'long' };
  if (String(name || '').trim().length > NAME_MAX) return { ok: false, error: 'name' };
  return { ok: true };
}

/** Título da issue: prefixo do tipo + primeira linha do relato, encurtada. */
export function buildTitle(type, message) {
  const first = String(message || '').trim().split(/\r?\n/)[0].replace(/\s+/g, ' ');
  const short = first.length > 70 ? `${first.slice(0, 67).trimEnd()}...` : first;
  return `${FEEDBACK_TYPES[type]?.prefix || '[Feedback]'} ${short}`;
}

/** Link do formulário de issue já preenchido (campos `descricao` e `contexto` dos templates). */
export function buildIssueUrl({ type, message, context }) {
  const info = FEEDBACK_TYPES[type] || FEEDBACK_TYPES.idea;
  const text = String(message || '').trim();
  const body = text.length > URL_MESSAGE_MAX ? `${text.slice(0, URL_MESSAGE_MAX)}\n\n(texto cortado: complete aqui)` : text;
  const params = new URLSearchParams({
    template: info.template,
    title: buildTitle(type, text),
    descricao: body,
    contexto: context || ''
  });
  return `${REPO_URL}/issues/new?${params.toString()}`;
}

/** Corpo enviado ao Worker no caminho sem conta. `website` é o campo-isca contra robôs. */
export function buildPayload({ type, message, name, context, website = '' }) {
  return {
    type,
    message: String(message || '').trim(),
    name: String(name || '').trim().slice(0, NAME_MAX),
    context: String(context || '').slice(0, 1000),
    website
  };
}

/** Envia o relato ao Worker. Resolve com { ok, url?, number?, error? } e nunca lança. */
export async function sendAnonymous(payload, { endpoint = FEEDBACK_ENDPOINT, fetchImpl = fetch } = {}) {
  if (!endpoint) return { ok: false, error: 'disabled' };
  try {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) return { ok: false, error: data.error || `http_${res.status}` };
    return { ok: true, url: data.url, number: data.number };
  } catch {
    return { ok: false, error: 'network' };
  }
}
