// ============================================================================
// WORKER DE FEEDBACK — recebe um relato do site e cria uma issue no GitHub
// ----------------------------------------------------------------------------
// O site é estático e não pode guardar um token; este Worker guarda.
// Fluxo: POST JSON { type, message, name, context, website } → issue criada.
//
// Variáveis (ver wrangler.toml e README.md desta pasta):
//   GITHUB_TOKEN     segredo; token fine-grained com permissão Issues: Read and write
//                    SOMENTE neste repositório
//   GITHUB_REPO      "dono/repositorio"
//   ALLOWED_ORIGINS  origens que podem chamar o Worker, separadas por vírgula
//   RATE_LIMITER     (opcional) binding de rate limiting da Cloudflare
//
// Nada é guardado aqui: nem o relato, nem o IP de quem enviou.
// ============================================================================

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 4000;
const NAME_MAX = 80;
const CONTEXT_MAX = 1000;
const BODY_MAX_BYTES = 12000;

const TYPES = {
  bug: { prefix: '[Bug]', label: 'bug' },
  content: { prefix: '[Conteúdo]', label: 'conteudo' },
  idea: { prefix: '[Sugestão]', label: 'enhancement' },
  question: { prefix: '[Dúvida]', label: 'question' }
};

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function corsHeaders(origin, env) {
  const ok = allowedOrigins(env).includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
  });
}

/**
 * Texto vindo de fora entra na issue como texto, não como comando:
 * sem menções (@fulano notificaria alguém), sem HTML e sem referências a issues.
 */
export function sanitize(text, max) {
  return String(text ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .slice(0, max)
    .replace(/@/g, '@​')
    .replace(/#(?=\d)/g, '#​')
    .replace(/</g, '&lt;')
    .trim();
}

export function validate(data) {
  if (!data || typeof data !== 'object') return 'invalid';
  if (data.website) return 'spam'; // campo-isca: pessoas não o veem, robôs o preenchem
  if (!TYPES[data.type]) return 'type';
  const message = String(data.message ?? '').trim();
  if (message.length < MESSAGE_MIN) return 'short';
  if (message.length > MESSAGE_MAX) return 'long';
  if (String(data.name ?? '').length > NAME_MAX) return 'name';
  return null;
}

export function buildIssue(data) {
  const type = TYPES[data.type];
  const message = sanitize(data.message, MESSAGE_MAX);
  const name = sanitize(data.name, NAME_MAX);
  const context = sanitize(data.context, CONTEXT_MAX);
  const first = message.split(/\r?\n/)[0].replace(/\s+/g, ' ');
  const title = `${type.prefix} ${first.length > 70 ? `${first.slice(0, 67).trimEnd()}...` : first}`;
  const body = [
    '### Relato',
    '',
    message,
    '',
    '### Contexto',
    '',
    context || '_não informado_',
    '',
    '---',
    `Enviado pelo formulário do site${name ? ` por **${name}**` : ' (anônimo)'}.`
  ].join('\n');
  return { title, body, labels: ['feedback-site', type.label] };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, cors);
    if (!allowedOrigins(env).includes(origin)) return json({ ok: false, error: 'origin' }, 403, cors);
    if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return json({ ok: false, error: 'config' }, 500, cors);

    // Limite por IP, quando o binding existe. O IP serve só de chave e não é guardado.
    if (env.RATE_LIMITER?.limit) {
      const key = request.headers.get('CF-Connecting-IP') || 'desconhecido';
      const { success } = await env.RATE_LIMITER.limit({ key });
      if (!success) return json({ ok: false, error: 'rate' }, 429, cors);
    }

    const raw = await request.text();
    if (raw.length > BODY_MAX_BYTES) return json({ ok: false, error: 'long' }, 413, cors);
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return json({ ok: false, error: 'invalid' }, 400, cors);
    }
    const problem = validate(data);
    // Para o robô que caiu na isca a resposta parece sucesso, para ele não insistir.
    if (problem === 'spam') return json({ ok: true }, 200, cors);
    if (problem) return json({ ok: false, error: problem }, 400, cors);

    const issue = buildIssue(data);
    const gh = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'feedback-worker',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(issue)
    });
    if (!gh.ok) return json({ ok: false, error: 'github' }, 502, cors);
    const created = await gh.json();
    return json({ ok: true, number: created.number, url: created.html_url }, 201, cors);
  }
};
