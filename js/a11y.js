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

// ---- Dicas e nomes acessíveis (title / aria-label) escritos no HTML em português ----
// O dicionário principal cobre o texto visível; estes atributos ficavam fixos em
// português nos três idiomas. A chave é o texto original do HTML.
import { state } from './state.js';

const ATTR_TEXT = {
  'Visualização Gráfica 3D': ['3D Graphics View', 'Visualización Gráfica 3D'],
  'Visão 3D Livre (Órbita e Zoom)': ['Free 3D View (Orbit and Zoom)', 'Vista 3D Libre (Órbita y Zoom)'],
  'Visão 2D Frontal (Domínio do Tempo)': ['Front 2D View (Time Domain)', 'Vista 2D Frontal (Dominio del Tiempo)'],
  'Visão 2D Lateral (Resposta ou Espectro)': ['Side 2D View (Response or Spectrum)', 'Vista 2D Lateral (Respuesta o Espectro)'],
  'Visão 2D Superior (Planta)': ['Top 2D View (Plan)', 'Vista 2D Superior (Planta)'],
  'Ouvir Timbre Sonoro das Harmônicas Ativas (M)': ['Hear the Timbre of the Active Harmonics (M)', 'Escuchar el Timbre de los Armónicos Activos (M)'],
  'Alternar Camadas Visuais do Gráfico': ['Toggle the Visual Layers of the Plot', 'Alternar las Capas Visuales del Gráfico'],
  'Alternar Modo Foco no Gráfico 3D (Z)': ['Toggle Focus Mode on the 3D Plot (Z)', 'Alternar el Modo Foco en el Gráfico 3D (Z)'],
  'Expressão matemática em texto': ['Math expression as text', 'Expresión matemática en texto'],
  'Apagar último caractere': ['Delete the last character', 'Borrar el último carácter'],
  'Limpar expressão': ['Clear the expression', 'Limpiar la expresión'],
  'Atalhos de funções matemáticas': ['Math function shortcuts', 'Atajos de funciones matemáticas'],
  'Modo de Construção de Bloco': ['Block Building Mode', 'Modo de Construcción de Bloque'],
  'Substituir expressão pelo bloco': ['Replace the expression with the block', 'Sustituir la expresión por el bloque'],
  'Somar bloco à expressão': ['Add the block to the expression', 'Sumar el bloque a la expresión'],
  'Subtrair bloco da expressão': ['Subtract the block from the expression', 'Restar el bloque de la expresión'],
  'Controles e Resolução Analítica': ['Controls and Analytical Solution', 'Controles y Resolución Analítica'],
  'Idioma e configurações': ['Language and settings', 'Idioma y configuración'],
  'Configurações e Personalização': ['Settings and Customization', 'Configuración y Personalización'],
  'Módulos': ['Modules', 'Módulos'],
  'Reproduzir / Pausar (Espaço)': ['Play / Pause (Space)', 'Reproducir / Pausar (Espacio)'],
  'Apresentação Sequencial: Encadear 1º ao 4º Passo': ['Sequential Presentation: Chain Steps 1 to 4', 'Presentación Secuencial: Encadenar los Pasos 1 a 4'],
  'Editor de Sinais': ['Signal Editor', 'Editor de Señales'],
  'Repetir Escrita Manual': ['Repeat the Handwriting', 'Repetir la Escritura a Mano'],
  'Contribuir com o projeto no GitHub': ['Contribute to the project on GitHub', 'Contribuir con el proyecto en GitHub']
};

let attrLang = 'pt';

/** Reescreve title e aria-label conforme o idioma; o texto original fica em data-pt-*. */
export function applyAttrLanguage() {
  const lang = ['en', 'es'].includes(state.lang) ? state.lang : 'pt';
  if (lang === attrLang) return;
  attrLang = lang;
  const col = lang === 'en' ? 0 : 1;
  for (const attr of ['title', 'aria-label']) {
    document.querySelectorAll(`[${attr}]`).forEach((el) => {
      const key = `pt${attr === 'title' ? 'Title' : 'Label'}`;
      const original = el.dataset[key] ?? el.getAttribute(attr);
      const pair = ATTR_TEXT[original];
      if (!pair) return;
      el.dataset[key] = original;
      el.setAttribute(attr, lang === 'pt' ? original : pair[col]);
    });
  }
}

if (typeof window !== 'undefined') {
  // O caderno é reescrito sempre que o idioma muda; pega carona nesse aviso
  window.addEventListener('notebook-updated', applyAttrLanguage);
}
