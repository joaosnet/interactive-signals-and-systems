// ============================================================================
// MODULES/REGISTRY.JS — Registro de Módulos Plugáveis
// ----------------------------------------------------------------------------
// Cada módulo do simulador (convolução, série de Fourier, CTFT, ...) é um objeto
// registrado aqui. A interface (ui.js), o laço de animação (app.js) e os atalhos
// consultam o registro em vez de ramificar com `if (activeModule === ...)`.
//
// Contrato de um módulo:
//   id            string única, usada em state.activeModule
//   hash          fragmento da URL (#convolution, #fourier, ...)
//   i18n          { title, sub, stepPrefix, regionsTitle } — chaves de I18N
//   zenLabel      rótulo curto do dock do modo zen
//   controls      ids de elementos do HTML visíveis só neste módulo
//   mobileZoomOut (opcional) fator de recuo da câmera em telas com menos de 520 px de largura
//   hudTargets    alvos do editor de sinal que pertencem a este módulo
//   defaultHudTarget  alvo do editor de sinal ao abrir neste módulo
//   defaultSliderValue  valor inicial de state.t ao entrar pela primeira vez
//   notebookEveryFrames cadência de atualização do caderno durante a animação
//   slider()      → { titleKey, min, max, step, keyStep, get(), set(v), badge() }
//                   descreve o que o slider principal controla AGORA (depende do
//                   passo e do preset). É a única fonte de limites e rótulos.
//   onEnter()     recalcula os dados do módulo ao entrar nele
//   onStepEnter(step, restartAnim)  efeitos colaterais ao trocar de passo
//   tick(spd, ctx)  avança a animação um frame; ctx = { setStep }
// ============================================================================

import { state } from '../state.js';

const modules = new Map();

export function registerModule(def) {
  if (!def || !def.id) throw new Error('Módulo sem id');
  if (modules.has(def.id)) throw new Error(`Módulo duplicado: ${def.id}`);
  modules.set(def.id, def);
  return def;
}

export function getModule(id) {
  return modules.get(id) || null;
}

// Ordem do seletor e dos atalhos '[' e ']'. É declarada em modules/index.js: a
// ordem de registro não serve, porque depende de qual arquivo o navegador avalia
// primeiro quando os módulos se importam entre si.
let moduleOrder = [];

export function setModuleOrder(ids) {
  moduleOrder = [...ids];
}

/** Módulos na ordem declarada; os que não constam nela vêm depois, na ordem de registro. */
export function listModules() {
  const rank = (m) => {
    const i = moduleOrder.indexOf(m.id);
    return i < 0 ? moduleOrder.length : i;
  };
  return [...modules.values()].map((m, i) => ({ m, i })).sort((a, b) => rank(a.m) - rank(b.m) || a.i - b.i).map((it) => it.m);
}

export function activeModule() {
  return modules.get(state.activeModule) || listModules()[0];
}

/** Resolve o módulo a partir do fragmento da URL; cai no primeiro registrado. */
export function moduleFromHash(hash) {
  const h = String(hash || '').toLowerCase();
  // O hash mais longo vence, para que "#dtft" não seja capturado por um "#ft" futuro.
  const match = listModules()
    .filter((m) => h.includes(m.hash))
    .sort((a, b) => b.hash.length - a.hash.length)[0];
  return match || listModules()[0];
}

/** Vizinho do módulo ativo na ordem do registro (dir = +1 ou -1), com volta. */
export function neighborModule(dir) {
  const list = listModules();
  const idx = Math.max(0, list.findIndex((m) => m.id === state.activeModule));
  return list[(idx + dir + list.length) % list.length];
}

/** Prende um valor aos limites do slider descrito por `spec`. */
export function clampToSlider(spec, value) {
  return Math.max(spec.min, Math.min(spec.max, value));
}
