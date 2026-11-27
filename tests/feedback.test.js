import test from 'node:test';
import assert from 'node:assert/strict';

import {
  REPO_URL, FEEDBACK_TYPES, MESSAGE_MAX, buildContext, buildIssueUrl, buildPayload, buildTitle,
  editUrl, moduleSourcePath, sendAnonymous, validateFeedback
} from '../js/feedback-core.js';
import worker, { buildIssue, sanitize, validate } from '../worker/src/index.js';

const ENV = {
  GITHUB_TOKEN: 'token-de-teste',
  GITHUB_REPO: 'dono/repo',
  ALLOWED_ORIGINS: 'https://exemplo.github.io, http://localhost:3000'
};
const post = (body, origin = 'https://exemplo.github.io') => new Request('https://worker.test/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: origin },
  body: typeof body === 'string' ? body : JSON.stringify(body)
});
const GOOD = { type: 'bug', message: 'O slider trava no passo 3 da convolucao.', name: 'Ana', context: '- Passo: 3' };

/** Troca o fetch global durante a chamada, para o Worker não falar com o GitHub de verdade. */
async function withFetch(fake, fn) {
  const real = globalThis.fetch;
  globalThis.fetch = fake;
  try {
    return await fn();
  } finally {
    globalThis.fetch = real;
  }
}

test('Feedback (site): validacao, titulo e contexto', () => {
  assert.deepEqual(validateFeedback({ type: 'bug', message: 'curto' }), { ok: false, error: 'short' });
  assert.deepEqual(validateFeedback({ type: 'xyz', message: 'mensagem longa o bastante' }), { ok: false, error: 'type' });
  assert.deepEqual(validateFeedback({ type: 'bug', message: 'x'.repeat(MESSAGE_MAX + 1) }), { ok: false, error: 'long' });
  assert.deepEqual(validateFeedback({ type: 'idea', message: 'mensagem longa o bastante', name: 'n'.repeat(81) }), { ok: false, error: 'name' });
  assert.deepEqual(validateFeedback({ type: 'idea', message: '  mensagem longa o bastante  ' }), { ok: true });

  assert.equal(buildTitle('bug', 'Primeira linha\nsegunda'), '[Bug] Primeira linha');
  assert.equal(buildTitle('content', 'a'.repeat(100)).length, '[Conteúdo] '.length + 70);
  const ctx = buildContext({ moduleId: 'laplace', moduleTitle: 'Transformada de Laplace', step: 3, lang: 'pt', theme: 'dark', viewport: '375x812', url: 'https://x/#laplace' });
  assert.match(ctx, /Módulo: Transformada de Laplace \(`laplace`\)/);
  assert.match(ctx, /Passo: 3/);
  assert.doesNotMatch(ctx, /Mozilla|userAgent/i); // nada que identifique o navegador ou a pessoa
});

test('Feedback (site): link de issue preenchido e links de edicao', () => {
  const url = new URL(buildIssueUrl({ type: 'content', message: 'A ROC do par 2 esta invertida & errada', context: '- Passo: 2' }));
  assert.equal(url.origin + url.pathname, `${REPO_URL}/issues/new`);
  assert.equal(url.searchParams.get('template'), 'conteudo.yml');
  assert.equal(url.searchParams.get('title'), '[Conteúdo] A ROC do par 2 esta invertida & errada');
  assert.equal(url.searchParams.get('descricao'), 'A ROC do par 2 esta invertida & errada');
  assert.equal(url.searchParams.get('contexto'), '- Passo: 2');
  // Texto longo e cortado para o link nao estourar o limite do GitHub
  assert.ok(buildIssueUrl({ type: 'bug', message: 'x'.repeat(4000), context: '' }).length < 7000);
  for (const info of Object.values(FEEDBACK_TYPES)) assert.match(info.template, /^(bug|conteudo|sugestao)\.yml$/);

  assert.equal(moduleSourcePath('laplace'), 'js/modules/laplace.js');
  assert.equal(moduleSourcePath('ztransform'), 'js/modules/z.js');
  assert.equal(moduleSourcePath('../../etc'), 'js/modules/etc.js'); // sem sair da pasta
  assert.equal(editUrl('js/i18n.js'), `${REPO_URL}/edit/main/js/i18n.js`);
});

test('Feedback (site): envio anonimo nunca lanca e respeita o endpoint desligado', async () => {
  const payload = buildPayload({ ...GOOD, name: '  Ana  ' });
  assert.equal(payload.name, 'Ana');
  assert.equal(payload.website, '');
  assert.deepEqual(await sendAnonymous(payload, { endpoint: '' }), { ok: false, error: 'disabled' });
  const okFetch = async () => new Response(JSON.stringify({ ok: true, number: 7, url: 'https://github.com/x/y/issues/7' }), { status: 201 });
  assert.deepEqual(await sendAnonymous(payload, { endpoint: 'https://w', fetchImpl: okFetch }), { ok: true, number: 7, url: 'https://github.com/x/y/issues/7' });
  const rateFetch = async () => new Response(JSON.stringify({ ok: false, error: 'rate' }), { status: 429 });
  assert.deepEqual(await sendAnonymous(payload, { endpoint: 'https://w', fetchImpl: rateFetch }), { ok: false, error: 'rate' });
  const downFetch = async () => { throw new Error('offline'); };
  assert.deepEqual(await sendAnonymous(payload, { endpoint: 'https://w', fetchImpl: downFetch }), { ok: false, error: 'network' });
});

test('Worker: texto externo e neutralizado antes de virar issue', () => {
  assert.equal(sanitize('oi @fulano veja #12 <script>', 100), 'oi @​fulano veja #​12 &lt;script>');
  assert.equal(sanitize('x'.repeat(50), 10).length, 10);
  assert.equal(validate({ ...GOOD, website: 'http://spam' }), 'spam');
  assert.equal(validate({ ...GOOD, type: 'outro' }), 'type');
  assert.equal(validate({ ...GOOD, message: 'curta' }), 'short');
  assert.equal(validate(null), 'invalid');
  assert.equal(validate(GOOD), null);
  const issue = buildIssue({ ...GOOD, message: 'Linha 1 com @alguem\nLinha 2' });
  assert.equal(issue.title, '[Bug] Linha 1 com @​alguem');
  assert.deepEqual(issue.labels, ['feedback-site', 'bug']);
  assert.match(issue.body, /por \*\*Ana\*\*/);
  assert.match(buildIssue({ ...GOOD, name: '' }).body, /\(anônimo\)/);
});

test('Worker: recusa origem, metodo e corpo invalidos sem chamar o GitHub', async () => {
  let calls = 0;
  await withFetch(async () => { calls++; return new Response('{}'); }, async () => {
    const badOrigin = await worker.fetch(post(GOOD, 'https://outro.site'), ENV);
    assert.equal(badOrigin.status, 403);
    assert.equal(badOrigin.headers.get('Access-Control-Allow-Origin'), 'null');
    assert.equal((await worker.fetch(new Request('https://worker.test/', { method: 'GET' }), ENV)).status, 405);
    assert.equal((await worker.fetch(post('{nao e json'), ENV)).status, 400);
    assert.equal((await worker.fetch(post({ ...GOOD, message: 'curta' }), ENV)).status, 400);
    assert.equal((await worker.fetch(post({ ...GOOD, message: 'x'.repeat(20000) }), ENV)).status, 413);
    assert.equal((await worker.fetch(post(GOOD), { ...ENV, GITHUB_TOKEN: '' })).status, 500);
    // Robo que preenche o campo-isca recebe "ok" e nada e criado
    const bot = await worker.fetch(post({ ...GOOD, website: 'http://spam' }), ENV);
    assert.equal(bot.status, 200);
    const limited = await worker.fetch(post(GOOD), { ...ENV, RATE_LIMITER: { limit: async () => ({ success: false }) } });
    assert.equal(limited.status, 429);
    const pre = await worker.fetch(new Request('https://worker.test/', { method: 'OPTIONS', headers: { Origin: 'http://localhost:3000' } }), ENV);
    assert.equal(pre.status, 204);
    assert.equal(pre.headers.get('Access-Control-Allow-Origin'), 'http://localhost:3000');
  });
  assert.equal(calls, 0);
});

test('Worker: relato valido cria a issue e devolve o link, sem vazar o token', async () => {
  let sent = null;
  const res = await withFetch(async (url, init) => {
    sent = { url, init };
    return new Response(JSON.stringify({ number: 42, html_url: 'https://github.com/dono/repo/issues/42' }), { status: 201 });
  }, () => worker.fetch(post(GOOD), ENV));
  assert.equal(res.status, 201);
  const out = await res.json();
  assert.deepEqual(out, { ok: true, number: 42, url: 'https://github.com/dono/repo/issues/42' });
  assert.equal(sent.url, 'https://api.github.com/repos/dono/repo/issues');
  assert.equal(sent.init.headers.Authorization, 'Bearer token-de-teste');
  assert.doesNotMatch(JSON.stringify(out), /token-de-teste/);
  const body = JSON.parse(sent.init.body);
  assert.equal(body.title, '[Bug] O slider trava no passo 3 da convolucao.');
  assert.deepEqual(body.labels, ['feedback-site', 'bug']);

  const failed = await withFetch(async () => new Response('{"message":"Bad credentials"}', { status: 401 }), () => worker.fetch(post(GOOD), ENV));
  assert.equal(failed.status, 502);
  assert.deepEqual(await failed.json(), { ok: false, error: 'github' });
});
