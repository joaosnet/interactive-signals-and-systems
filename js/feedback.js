// ============================================================================
// FEEDBACK.JS — Janela "Feedback e contribuição"
// ----------------------------------------------------------------------------
// Pensada para quem nunca usou git: escrever o relato e apertar um botão.
// As regras (validação, links, envio) ficam em feedback-core.js; aqui só a tela.
// ============================================================================

import { state } from './state.js';
import { I18N } from './i18n.js';
import { activeModule } from './modules/registry.js';
import {
  FEEDBACK_ENDPOINT, FEEDBACK_TYPES, MESSAGE_MAX, MESSAGE_MIN, NAME_MAX, CONTRIBUTING_URL, TEXTS_SOURCE_PATH,
  buildContext, buildIssueUrl, buildPayload, editUrl, moduleSourcePath, sendAnonymous, validateFeedback
} from './feedback-core.js';

const TEXT = {
  pt: {
    open: 'Feedback',
    openTitle: 'Relatar um problema, sugerir ou corrigir',
    title: 'Feedback e contribuição',
    close: 'Fechar',
    intro: 'Achou um erro, tem uma dúvida ou uma ideia? Escreva aqui. Seu relato vira uma tarefa pública no GitHub do projeto.',
    typeLegend: 'Sobre o que é?',
    message: 'O que aconteceu ou o que você sugere?',
    messageHint: 'Se for um erro: o que você fez, o que esperava e o que apareceu.',
    name: 'Seu nome (opcional)',
    namePlaceholder: 'Deixe em branco para enviar sem nome',
    context: 'O que vai junto com o seu relato',
    sendAnon: 'Enviar sem conta',
    sendGithub: 'Abrir no GitHub',
    githubHint: 'Abre o formulário já preenchido. Precisa de conta no GitHub; você confere e confirma lá.',
    anonHint: 'Não precisa de conta. O texto fica público.',
    anonOff: 'O envio sem conta ainda não está ligado. Por enquanto, use "Abrir no GitHub".',
    sending: 'Enviando...',
    sent: 'Recebido, obrigado! Seu relato virou a tarefa',
    sentNoLink: 'Recebido, obrigado!',
    errors: {
      short: `Escreva pelo menos ${MESSAGE_MIN} caracteres.`,
      long: `O texto passou de ${MESSAGE_MAX} caracteres.`,
      name: `O nome passou de ${NAME_MAX} caracteres.`,
      type: 'Escolha o tipo do relato.',
      rate: 'Muitos envios em pouco tempo. Tente de novo em alguns minutos.',
      network: 'Sem conexão com o servidor. Tente "Abrir no GitHub".',
      generic: 'Não foi possível enviar agora. Tente "Abrir no GitHub".'
    },
    fixTitle: 'Quer corrigir você mesmo?',
    fixIntro: 'Dá para fazer pelo navegador, sem instalar nada e sem usar git:',
    fixSteps: [
      'Clique em um dos botões abaixo e entre no GitHub (a conta é gratuita).',
      'Edite o arquivo na própria página. O GitHub cria sozinho uma cópia sua do projeto.',
      'Clique em "Commit changes" e depois em "Create pull request". O professor revisa e publica.'
    ],
    editTexts: 'Editar os textos do site',
    editModule: 'Editar o módulo atual',
    guide: 'Guia passo a passo'
  },
  en: {
    open: 'Feedback',
    openTitle: 'Report a problem, suggest or fix',
    title: 'Feedback and contribution',
    close: 'Close',
    intro: 'Found a mistake, have a question or an idea? Write it here. Your report becomes a public task on the project\'s GitHub.',
    typeLegend: 'What is it about?',
    message: 'What happened, or what do you suggest?',
    messageHint: 'For a bug: what you did, what you expected and what showed up.',
    name: 'Your name (optional)',
    namePlaceholder: 'Leave blank to send without a name',
    context: 'What is sent along with your report',
    sendAnon: 'Send without an account',
    sendGithub: 'Open on GitHub',
    githubHint: 'Opens the form already filled in. Needs a GitHub account; you review and confirm there.',
    anonHint: 'No account needed. The text is public.',
    anonOff: 'Sending without an account is not switched on yet. For now, use "Open on GitHub".',
    sending: 'Sending...',
    sent: 'Received, thank you! Your report became task',
    sentNoLink: 'Received, thank you!',
    errors: {
      short: `Write at least ${MESSAGE_MIN} characters.`,
      long: `The text is over ${MESSAGE_MAX} characters.`,
      name: `The name is over ${NAME_MAX} characters.`,
      type: 'Pick the kind of report.',
      rate: 'Too many reports in a short time. Try again in a few minutes.',
      network: 'Could not reach the server. Try "Open on GitHub".',
      generic: 'Could not send right now. Try "Open on GitHub".'
    },
    fixTitle: 'Want to fix it yourself?',
    fixIntro: 'You can do it in the browser, with nothing to install and no git:',
    fixSteps: [
      'Click one of the buttons below and sign in to GitHub (accounts are free).',
      'Edit the file right on the page. GitHub makes your own copy of the project automatically.',
      'Click "Commit changes" and then "Create pull request". The professor reviews and publishes it.'
    ],
    editTexts: 'Edit the site texts',
    editModule: 'Edit the current module',
    guide: 'Step-by-step guide'
  }
};

const txt = () => TEXT[state.lang === 'en' ? 'en' : 'pt'];

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

function currentContext() {
  const mod = activeModule();
  const dict = I18N[state.lang] || I18N.pt;
  return buildContext({
    moduleId: mod.id,
    moduleTitle: dict[mod.i18n.title],
    step: state.step,
    lang: state.lang,
    theme: state.theme,
    viewport: `${window.innerWidth || document.documentElement.clientWidth}x${window.innerHeight || document.documentElement.clientHeight}`,
    url: window.location.origin + window.location.pathname + window.location.hash
  });
}

let dialog = null;

/** Monta o conteúdo no idioma atual (refeito a cada abertura). */
function render(focusFix) {
  const t = txt();
  const context = currentContext();
  const moduleFile = moduleSourcePath(activeModule().id);
  dialog.setAttribute('aria-label', t.title);
  dialog.replaceChildren();

  const closeBtn = el('button', { type: 'button', class: 'feedback-close', 'aria-label': t.close, text: '✕' });
  closeBtn.addEventListener('click', () => dialog.close());
  const header = el('div', { class: 'feedback-header' }, [el('h2', { text: t.title }), closeBtn]);

  // ---- Relato ----
  const typeGroup = el('fieldset', { class: 'feedback-types' }, [el('legend', { text: t.typeLegend })]);
  Object.entries(FEEDBACK_TYPES).forEach(([key, info], i) => {
    const input = el('input', { type: 'radio', name: 'feedback-type', value: key, id: `feedback-type-${key}` });
    if (i === 0) input.checked = true;
    typeGroup.append(el('label', { for: input.id }, [input, el('span', { text: info[state.lang === 'en' ? 'en' : 'pt'] })]));
  });

  const message = el('textarea', { id: 'feedback-message', rows: '5', maxlength: String(MESSAGE_MAX), required: '', 'aria-describedby': 'feedback-message-hint' });
  const counter = el('span', { class: 'feedback-counter', text: `0 / ${MESSAGE_MAX}` });
  message.addEventListener('input', () => { counter.textContent = `${message.value.length} / ${MESSAGE_MAX}`; });

  const name = el('input', { id: 'feedback-name', type: 'text', maxlength: String(NAME_MAX), placeholder: t.namePlaceholder, autocomplete: 'off' });
  // Campo-isca: escondido das pessoas; robôs que preenchem tudo se denunciam
  const trap = el('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true', class: 'feedback-trap' });

  const contextBox = el('details', { class: 'feedback-context' }, [
    el('summary', { text: t.context }),
    el('pre', { text: context })
  ]);

  const status = el('p', { class: 'feedback-status', role: 'status', 'aria-live': 'polite' });
  const githubBtn = el('button', { type: 'button', class: 'feedback-btn feedback-btn-secondary', text: t.sendGithub, title: t.githubHint });
  const anonBtn = el('button', { type: 'submit', class: 'feedback-btn feedback-btn-primary', text: t.sendAnon, title: t.anonHint });
  const anonEnabled = Boolean(FEEDBACK_ENDPOINT);
  if (!anonEnabled) {
    // Sem o Worker ligado, o GitHub vira o botão principal
    githubBtn.className = 'feedback-btn feedback-btn-primary';
    githubBtn.type = 'submit';
  }

  const read = () => ({
    type: dialog.querySelector('input[name="feedback-type"]:checked')?.value,
    message: message.value,
    name: name.value,
    context,
    website: trap.value
  });
  const check = () => {
    const data = read();
    const result = validateFeedback(data);
    status.classList.toggle('is-error', !result.ok);
    if (!result.ok) {
      status.textContent = t.errors[result.error] || t.errors.generic;
      message.focus();
      return null;
    }
    return data;
  };

  const openGithub = () => {
    const data = check();
    if (!data) return;
    status.textContent = '';
    window.open(buildIssueUrl(data), '_blank', 'noopener,noreferrer');
  };

  const sendAnon = async () => {
    const data = check();
    if (!data) return;
    anonBtn.disabled = true;
    status.textContent = t.sending;
    const result = await sendAnonymous(buildPayload(data));
    anonBtn.disabled = false;
    if (!result.ok) {
      status.classList.add('is-error');
      status.textContent = t.errors[result.error] || t.errors.generic;
      return;
    }
    message.value = '';
    counter.textContent = `0 / ${MESSAGE_MAX}`;
    status.replaceChildren(result.url ? `${t.sent} ` : t.sentNoLink);
    if (result.url) status.append(el('a', { href: result.url, target: '_blank', rel: 'noopener noreferrer', text: `#${result.number}` }), '.');
  };

  const form = el('form', { class: 'feedback-form', novalidate: '' }, [
    el('p', { class: 'feedback-intro', text: t.intro }),
    typeGroup,
    el('label', { for: 'feedback-message', class: 'feedback-label', text: t.message }),
    el('p', { id: 'feedback-message-hint', class: 'feedback-hint', text: t.messageHint }),
    message,
    counter,
    el('label', { for: 'feedback-name', class: 'feedback-label', text: t.name }),
    name,
    trap,
    contextBox,
    el('div', { class: 'feedback-actions' }, anonEnabled ? [anonBtn, githubBtn] : [githubBtn]),
    el('p', { class: 'feedback-hint', text: anonEnabled ? `${t.anonHint} ${t.githubHint}` : `${t.anonOff} ${t.githubHint}` }),
    status
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (anonEnabled) sendAnon();
    else openGithub();
  });
  if (anonEnabled) githubBtn.addEventListener('click', openGithub);

  // ---- Corrigir você mesmo ----
  const link = (href, text) => el('a', { href, target: '_blank', rel: 'noopener noreferrer', class: 'feedback-btn feedback-btn-secondary', text });
  const fix = el('section', { class: 'feedback-fix', id: 'feedback-fix', tabindex: '-1' }, [
    el('h3', { text: t.fixTitle }),
    el('p', { class: 'feedback-hint', text: t.fixIntro }),
    el('ol', {}, t.fixSteps.map((step) => el('li', { text: step }))),
    el('div', { class: 'feedback-actions' }, [
      link(editUrl(TEXTS_SOURCE_PATH), t.editTexts),
      link(editUrl(moduleFile), `${t.editModule} (${moduleFile.split('/').pop()})`),
      link(CONTRIBUTING_URL, t.guide)
    ])
  ]);

  dialog.append(header, form, fix);
  if (focusFix) {
    fix.scrollIntoView({ block: 'start' });
    fix.focus();
  } else {
    message.focus();
  }
}

export function openFeedback(focusFix = false) {
  if (!dialog) return;
  if (!dialog.open) dialog.showModal();
  render(focusFix);
}

function init() {
  if (dialog || typeof HTMLDialogElement === 'undefined') return;
  dialog = el('dialog', { class: 'feedback-dialog', id: 'feedback-dialog' });
  // Atalhos do simulador (1 a 4, espaço, colchetes) não devem disparar enquanto se escreve aqui
  dialog.addEventListener('keydown', (e) => e.stopPropagation());
  dialog.addEventListener('keyup', (e) => e.stopPropagation());
  // Clique fora da janela fecha
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  document.body.append(dialog);

  const contribute = document.getElementById('github-contribute-float');
  if (contribute) {
    const btn = el('button', { type: 'button', id: 'feedback-open', class: contribute.className });
    const syncLabel = () => {
      btn.textContent = txt().open;
      btn.title = txt().openTitle;
      btn.setAttribute('aria-label', txt().openTitle);
    };
    syncLabel();
    btn.addEventListener('mouseenter', syncLabel);
    btn.addEventListener('focus', syncLabel);
    btn.addEventListener('click', () => { syncLabel(); openFeedback(false); });
    contribute.before(btn);
    // "Contribuir" continua sendo um link para o repositório, mas abre antes o caminho guiado
    contribute.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      openFeedback(true);
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}
