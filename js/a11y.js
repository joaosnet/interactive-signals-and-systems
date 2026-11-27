// ============================================================================
// A11Y.JS — Acessibilidade dos cartões de exemplo
// ----------------------------------------------------------------------------
// Os cartões da galeria são <div> clicáveis. Aqui eles ganham papel de botão,
// entram na ordem do Tab, anunciam qual está em uso e respondem a Enter e
// Espaço. Vale para qualquer cartão novo, porque a galeria é observada.
// ============================================================================

function decorate(gallery) {
  gallery.querySelectorAll('.preset-pill').forEach((card) => {
    if (!card.hasAttribute('role')) card.setAttribute('role', 'button');
    if (!card.hasAttribute('tabindex')) card.tabIndex = 0;
    card.setAttribute('aria-pressed', String(card.classList.contains('active')));
  });
}

function init() {
  const gallery = document.getElementById('preset-gallery');
  if (!gallery) return;
  decorate(gallery);
  new MutationObserver(() => decorate(gallery)).observe(gallery, { childList: true });
  gallery.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest?.('.preset-pill');
    // Botões dentro do cartão (ex.: apagar exemplo salvo) cuidam do próprio teclado
    if (!card || e.target !== card) return;
    e.preventDefault();
    e.stopPropagation();
    card.click();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}
