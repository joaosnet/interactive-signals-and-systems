// ============================================================================
// MODULES/DCONV.JS — Convolução discreta (soma de convolução)
// ----------------------------------------------------------------------------
// Palco: quatro "trilhos" de hastes que compartilham o mesmo eixo horizontal k.
//   fundo  → x[k]
//   2º     → h[k], depois h[-k] (reflexão) e h[n-k] (deslocamento)
//   3º     → os produtos x[k]·h[n-k]
//   frente → y[n], que nasce na posição k = n
// Passos: 1 troca n → k, 2 reflexão, 3 deslocamento e produtos, 4 somatório.
// Módulo totalmente plugável: cena, caderno e galeria vivem aqui.
// ============================================================================

import { state } from '../state.js';
import { renderMath } from '../math-engine.js';
import { DCONV_PRESETS, calculateDConvData, seqAt } from '../dconv-engine.js';
import { registerModule } from './registry.js';
import { renderSequenceEditor } from './seq-editor.js';
import { loc, tx } from '../lang.js';

// ---- Geometria do palco -----------------------------------------------------
const X_HALF = 4.5;     // o eixo k ocupa x ∈ [-4.5, 4.5]
const Z_X = 0.6;        // trilho de x[k] (fundo; a câmera fica em +z)
const Z_H = 2.4;        // trilho de h
const Z_P = 4.2;        // trilho dos produtos
const Z_Y = 6.0;        // trilho de y[n] (frente)
const AMP = 1.4;        // altura de uma amostra unitária
const Y_MAX_HEIGHT = 2.1;

let tickAcc = 0;

export function recomputeDConv() {
  state.dconvCalculated = calculateDConvData(state.dconvPresetKey, state.dconvCustom);
  const d = state.dconvCalculated;
  state.dconvPresetKey = d.presetKey;
  state.dconvN = Math.max(d.nMin, Math.min(d.nMax, Math.round(state.dconvN)));
  state.dconvK = Math.max(d.kMin, Math.min(d.kMax, Math.round(state.dconvK)));
  return d;
}

function calc() {
  return state.dconvCalculated || recomputeDConv();
}

export function selectDConvPreset(key) {
  if (!DCONV_PRESETS[key] && key !== 'custom') return;
  state.dconvPresetKey = key;
  state.dconvCalculated = calculateDConvData(key, state.dconvCustom);
  state.dconvN = state.dconvCalculated.yStart + 1;
  state.dconvK = state.dconvCalculated.x.start;
}

// ---- Formatação -------------------------------------------------------------
const num = (v, d = 2) => {
  const r = Math.round(v * 10 ** d) / 10 ** d;
  return Object.is(r, -0) ? '0' : String(r);
};
/** Número entre parênteses quando negativo, para entrar em produtos e somas. */
const paren = (v) => (v < 0 ? `(${num(v)})` : num(v));

// ---- Cena -------------------------------------------------------------------
function renderScene(scene, dt) {
  const frame = scene.begin(dt);
  if (!frame) return;
  const { pal, strokeScale } = frame;
  const d = calc();
  const n = state.dconvN;
  const step = state.step;
  const showProduct = step >= 3;

  const span = Math.max(1, d.kMax - d.kMin);
  const xOfK = (k) => -X_HALF + ((k - d.kMin) / span) * 2 * X_HALF;
  const half = (X_HALF / span) * 0.9; // meia largura de uma "casa" do eixo k
  const yScale = AMP * Math.min(1, Y_MAX_HEIGHT / (AMP * Math.max(d.maxAbsY, 1e-9)));
  const lanes = showProduct ? [Z_X, Z_H, Z_P, Z_Y] : [Z_X, Z_H];
  const zFront = lanes[lanes.length - 1];

  // 1. Piso: uma linha por inteiro k, atravessando os trilhos
  if (state.layers.grid) {
    for (let k = d.kMin; k <= d.kMax; k++) {
      scene.line({ x: xOfK(k), y: 0, z: Z_X }, { x: xOfK(k), y: 0, z: zFront }, k === 0 ? pal.gridMain : pal.gridSub, k === 0 ? 1.2 : 0.8);
    }
  }

  // 2. Faixa de sobreposição: os k em que x[k] e h[n-k] são ambos não nulos
  const range = showProduct ? d.overlapRange(n) : null;
  if (range) {
    scene.polygon([
      { x: xOfK(range.lo) - half, y: 0, z: Z_X }, { x: xOfK(range.hi) + half, y: 0, z: Z_X },
      { x: xOfK(range.hi) + half, y: 0, z: Z_P }, { x: xOfK(range.lo) - half, y: 0, z: Z_P }
    ], pal.prodSliceFill, pal.prodSliceStroke, 1);
  }
  // Guia de n: da origem de h[n-k] (k = n) até a haste de y[n]
  if (showProduct && n >= d.kMin && n <= d.kMax) {
    scene.line({ x: xOfK(n), y: 0, z: Z_H }, { x: xOfK(n), y: 0, z: Z_Y }, pal.conv, 1.6 * strokeScale, [5, 4]);
  }

  // Eixos dos trilhos
  lanes.forEach((z) => {
    scene.line({ x: -X_HALF - 0.3, y: 0, z }, { x: X_HALF + 0.3, y: 0, z }, pal.axis, 1.4 * strokeScale);
  });

  /** Hastes de fn(k) num trilho; `inSupport(k)` decide onde desenhar o ponto de valor zero. */
  const drawLane = (z, fn, inSupport, color, scale, opts = {}) => {
    for (let k = d.kMin; k <= d.kMax; k++) {
      if (!inSupport(k)) continue;
      const v = fn(k);
      const base = { x: xOfK(k), y: 0, z };
      const strong = opts.highlight === k;
      const width = (strong ? 3.4 : 2.4) * strokeScale;
      const radius = (strong ? 5.2 : 3.6) * strokeScale;
      if (Math.abs(v) < 1e-9) scene.dot(base, radius * 0.7, color);
      else scene.stem(base, { ...base, y: v * scale }, color, width, radius);
    }
  };

  // Passos 1 e 2: o slider escolhe uma amostra k, destacada nos dois trilhos
  const probeK = showProduct ? null : state.dconvK;
  if (probeK !== null) {
    scene.polygon([
      { x: xOfK(probeK) - half, y: 0, z: Z_X - 0.3 }, { x: xOfK(probeK) + half, y: 0, z: Z_X - 0.3 },
      { x: xOfK(probeK) + half, y: 0, z: Z_H + 0.3 }, { x: xOfK(probeK) - half, y: 0, z: Z_H + 0.3 }
    ], pal.prodSliceFill, pal.prodSliceStroke, 1);
  }

  // 3. Trilhos, do fundo para a frente
  drawLane(Z_X, (k) => seqAt(d.x, k), (k) => k >= d.x.start && k <= d.xEnd, pal.x1, AMP, { highlight: probeK });

  // h[k] → h[-k] → h[n-k]: o argumento de h em função de k
  const hArg = step === 1 ? (k) => k : step === 2 ? (k) => -k : (k) => n - k;
  drawLane(Z_H, (k) => seqAt(d.h, hArg(k)), (k) => hArg(k) >= d.h.start && hArg(k) <= d.hEnd, pal.x2, AMP, { highlight: probeK });

  if (showProduct) {
    drawLane(Z_P, (k) => seqAt(d.x, k) * seqAt(d.h, n - k), (k) => Boolean(range) && k >= range.lo && k <= range.hi, pal.prod, AMP);
    // No passo 3 y[n] vai sendo construído; no passo 4 aparece inteiro
    const lastShown = step === 3 ? n : d.yEnd;
    scene.alpha = 0.9;
    drawLane(Z_Y, (m) => d.yAt(m), (m) => m >= d.yStart && m <= Math.min(lastShown, d.yEnd), pal.conv, yScale, { highlight: n });
    scene.alpha = 1.0;
    if (n >= d.kMin && n <= d.kMax && (n < d.yStart || n > d.yEnd)) {
      scene.ring({ x: xOfK(n), y: 0, z: Z_Y }, 5.2 * strokeScale, pal.conv, 2.2 * strokeScale);
    }
  }

  scene.end();

  // 4. Rótulos e leitura
  const left = -X_HALF - 0.55;
  const hLatex = step === 1 ? 'h[k]' : step === 2 ? 'h[-k]' : `h[${n}-k]`.replace('[0-k]', '[-k]');
  const yNow = d.yAt(n);
  const nVisible = showProduct && n >= d.kMin && n <= d.kMax;
  scene.labels([
    { slot: 'lbl-x1', latex: 'x[k]', x: left, y: 0.75, z: Z_X },
    { slot: 'lbl-x2', latex: hLatex, x: left, y: 0.75, z: Z_H },
    { slot: 'lbl-b1', latex: `x[k]\\,${hLatex}`, x: left, y: 0.7, z: Z_P, visible: showProduct },
    { slot: 'lbl-conv', latex: 'y[n]', x: left, y: 0.6, z: Z_Y, visible: showProduct },
    { slot: 'lbl-tau', latex: 'k', x: X_HALF + 0.5, y: -0.1, z: Z_X },
    { slot: 'lbl-t', latex: 'n', x: X_HALF + 0.5, y: -0.1, z: Z_Y, visible: showProduct },
    {
      slot: 'lbl-z',
      latex: probeK === null ? '' : `x[${probeK}] = ${num(seqAt(d.x, probeK))},\\; ${step === 1 ? `h[${probeK}]` : `h[${-probeK}]`} = ${num(seqAt(d.h, hArg(probeK)))}`,
      x: probeK === null ? 0 : xOfK(probeK), y: AMP + 0.75, z: Z_X, visible: probeK !== null
    },
    {
      slot: 'lbl-b2',
      latex: `y[${n}] = ${num(yNow)}`,
      x: nVisible ? xOfK(n) : 0, y: Math.max(yNow * yScale, 0) + 0.45, z: Z_Y,
      visible: nVisible
    }
  ]);
  scene.livePill(showProduct
    ? `y[${n}] = \\sum_{k} x[k]\\,h[${n}-k] = ${num(yNow)}`
    : 'y[n] = \\sum_{k=-\\infty}^{+\\infty} x[k]\\,h[n-k]');
}

// ---- Caderno ----------------------------------------------------------------
function sumLatex(d, n) {
  const { terms, sum } = d.productAt(n);
  if (terms.length === 0) return `y[${n}] = 0`;
  const MAX = 5;
  const shown = terms.slice(0, MAX).map((t) => `${paren(t.xk)} \\cdot ${paren(t.hk)}`);
  const more = terms.length > MAX ? ' + \\cdots' : '';
  return `y[${n}] = ${shown.join(' + ')}${more} = ${num(sum)}`;
}

const notebook = {
  metric(isEn) {
    const d = calc();
    const n = state.dconvN;
    if (state.step === 1) return { label: isEn ? 'Convolution sum' : tx('Soma de convolução', 'Suma de convolución'), latex: 'y[n] = x[n] * h[n]' };
    if (state.step === 2) {
      return { label: isEn ? 'Length of y[n]' : tx('Comprimento de y[n]', 'Longitud de y[n]'), latex: d.infinite ? '\\infty' : `${d.lengthX} + ${d.lengthH} - 1 = ${d.lengthY}` };
    }
    return { label: isEn ? 'Current sample' : tx('Amostra atual', 'Muestra actual'), latex: `y[${n}] = ${num(d.yAt(n))}` };
  },

  lines(isEn) {
    const d = calc();
    const n = state.dconvN;

    if (state.step === 1) {
      return [
        {
          label: isEn ? '1.1 Convolution Sum Definition:' : tx('1.1 Definição da Soma de Convolução:', '1.1 Definición de la Suma de Convolución:'),
          latex: 'y[n] = x[n] * h[n] = \\sum_{k=-\\infty}^{+\\infty} x[k]\\,h[n-k]'
        },
        { label: isEn ? '1.2 Input Sequence:' : tx('1.2 Sequência de Entrada:', '1.2 Secuencia de Entrada:'), latex: `x[n] = ${d.latexX}` },
        { label: isEn ? '1.3 Impulse Response:' : tx('1.3 Resposta ao Impulso:', '1.3 Respuesta al Impulso:'), latex: `h[n] = ${d.latexH}` },
        {
          label: isEn ? '1.4 Change of Variable n → k (n becomes a fixed parameter):' : tx('1.4 Troca de Variável n → k (n vira um parâmetro fixo):', '1.4 Cambio de Variable n → k (n pasa a ser un parámetro fijo):'),
          latex: 'x[n] \\to x[k], \\qquad h[n] \\to h[k]'
        },
        {
          label: isEn ? `1.5 Sample Under the Slider (k = ${state.dconvK}):` : tx(`1.5 Amostra Sob o Slider (k = ${state.dconvK}):`, `1.5 Muestra Bajo el Deslizador (k = ${state.dconvK}):`),
          latex: `x[${state.dconvK}] = ${num(seqAt(d.x, state.dconvK))}, \\qquad h[${state.dconvK}] = ${num(seqAt(d.h, state.dconvK))}`
        }
      ];
    }

    if (state.step === 2) {
      return [
        {
          label: isEn ? '2.1 Time Reversal of h:' : tx('2.1 Reflexão de h no Tempo:', '2.1 Reflexión de h en el Tiempo:'),
          latex: 'h[k] \\;\\longrightarrow\\; h[-k]'
        },
        {
          label: isEn ? '2.2 Support of h[−k]:' : tx('2.2 Suporte de h[−k]:', '2.2 Soporte de h[−k]:'),
          latex: d.h.infinite
            ? `k \\le ${-d.h.start}`
            : `${-(d.h.start + d.lengthH - 1)} \\le k \\le ${-d.h.start}`
        },
        {
          label: isEn ? '2.3 Where y[n] Can Be Nonzero:' : tx('2.3 Onde y[n] Pode Ser Não Nulo:', '2.3 Dónde y[n] Puede Ser No Nulo:'),
          latex: d.infinite
            ? `n \\ge ${d.x.start} + ${paren(d.h.start)} = ${d.yStart}`
            : `${d.x.start} + ${paren(d.h.start)} \\le n \\le ${d.xEnd} + ${paren(d.hEnd)} \\implies ${d.yStart} \\le n \\le ${d.yEnd}`
        },
        {
          label: isEn ? '2.4 Length Rule (finite sequences):' : tx('2.4 Regra do Comprimento (sequências finitas):', '2.4 Regla de la Longitud (secuencias finitas):'),
          latex: 'L_y = L_x + L_h - 1'
        },
        {
          label: isEn ? `2.5 Sample Under the Slider (k = ${state.dconvK}):` : tx(`2.5 Amostra Sob o Slider (k = ${state.dconvK}):`, `2.5 Muestra Bajo el Deslizador (k = ${state.dconvK}):`),
          latex: `h[-k]\\big|_{k = ${state.dconvK}} = h[${-state.dconvK}] = ${num(seqAt(d.h, -state.dconvK))}`
        }
      ];
    }

    if (state.step === 3) {
      const range = d.overlapRange(n);
      return [
        {
          label: isEn ? `3.1 Shift by n = ${n}:` : tx(`3.1 Deslocamento de n = ${n}:`, `3.1 Desplazamiento de n = ${n}:`),
          latex: `h[-k] \\;\\longrightarrow\\; h[${n} - k] \\quad (${isEn ? '\\text{origin of } h \\text{ at } k' : tx('\\text{origem de } h \\text{ em } k', '\\text{origen de } h \\text{ en } k')} = ${n})`
        },
        {
          label: isEn ? '3.2 Overlap with x[k]:' : tx('3.2 Sobreposição com x[k]:', '3.2 Solapamiento con x[k]:'),
          latex: range
            ? `${range.lo} \\le k \\le ${range.hi}`
            : (isEn ? '\\text{no overlap} \\implies y[n] = 0' : tx('\\text{sem sobreposição} \\implies y[n] = 0', '\\text{sin solapamiento} \\implies y[n] = 0'))
        },
        {
          label: isEn ? '3.3 Multiply Sample by Sample and Add:' : tx('3.3 Multiplicar Amostra a Amostra e Somar:', '3.3 Multiplicar Muestra a Muestra y Sumar:'),
          latex: sumLatex(d, n)
        }
      ];
    }

    // Passo 4
    return [
      {
        label: isEn ? '4.1 Result (↑ marks n = 0):' : '4.1 Resultado (↑ marca n = 0):',
        latex: `y[n] = ${d.latexY}${d.infinite ? '\\;\\ldots' : ''}`
      },
      {
        label: isEn ? '4.2 Check: Sum of y = (Sum of x)·(Sum of h):' : tx('4.2 Conferência: Soma de y = (Soma de x)·(Soma de h):', '4.2 Comprobación: Suma de y = (Suma de x)·(Suma de h):'),
        latex: `\\sum_n y[n] = ${paren(d.sumX)} \\cdot ${paren(d.sumH)} = ${num(d.sumY)}`
      },
      {
        label: isEn ? '4.3 Properties:' : tx('4.3 Propriedades:', '4.3 Propiedades:'),
        latex: 'x * h = h * x, \\qquad x[n] * \\delta[n - n_0] = x[n - n_0]'
      },
      {
        label: isEn ? '4.4 Bridge to the Z-Transform (polynomial product):' : tx('4.4 Ponte com a Transformada Z (produto de polinômios):', '4.4 Puente con la Transformada Z (producto de polinomios):'),
        latex: 'y[n] = x[n] * h[n] \\;\\longleftrightarrow\\; Y(z) = X(z)\\,H(z)'
      }
    ];
  },

  table(container, isEn) {
    const d = calc();
    const header = document.createElement('div');
    header.className = 'grid grid-cols-3 gap-2 px-2 py-1.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[10px] font-bold text-sec uppercase tracking-wider mb-1';
    ['n', isEn ? 'Overlap in k' : tx('Sobreposição em k', 'Solapamiento en k'), 'y[n]'].forEach((text, i) => {
      const span = document.createElement('span');
      span.textContent = text;
      if (i === 2) span.className = 'text-right';
      header.appendChild(span);
    });
    container.appendChild(header);

    for (let n = d.yStart; n <= d.yEnd; n++) {
      const isCurrent = state.dconvN === n;
      const range = d.overlapRange(n);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `region-row w-full text-left px-2 py-1.5 rounded-lg grid grid-cols-3 items-center gap-2 ui-control ${isCurrent ? 'active font-semibold' : ''}`;
      const cells = [
        `n = ${n}`,
        range ? (range.lo === range.hi ? `k = ${range.lo}` : `${range.lo} \\le k \\le ${range.hi}`) : '-',
        num(d.yAt(n), 3)
      ].map((latex, i) => {
        const span = document.createElement('span');
        span.className = `text-[10px] truncate ${i === 2 ? 'text-right' : ''}`;
        renderMath(span, latex, false);
        return span;
      });
      btn.append(...cells);
      btn.addEventListener('click', () => {
        state.dconvN = n;
        window.dispatchEvent(new CustomEvent('module-preset-changed'));
      });
      container.appendChild(btn);
    }
  }
};

// ---- Galeria ----------------------------------------------------------------
function renderGallery(gallery, isEn, refresh) {
  renderSequenceEditor(gallery, {
    isEn,
    title: isEn ? 'Type your own x[n] and h[n]' : tx('Digite o seu x[n] e o seu h[n]', 'Escribe tu x[n] y tu h[n]'),
    active: state.dconvPresetKey === 'custom',
    fields: [
      { id: 'x', label: 'x[n]:', values: state.dconvCustom.x.values, start: state.dconvCustom.x.start, hasStart: true, maxLen: 12, startMin: -6, startMax: 6 },
      { id: 'h', label: 'h[n]:', values: state.dconvCustom.h.values, start: state.dconvCustom.h.start, hasStart: true, maxLen: 12, startMin: -6, startMax: 6 }
    ],
    onApply: (result) => {
      state.dconvCustom = { x: result.x, h: result.h };
      selectDConvPreset('custom');
      refresh();
    }
  });

  Object.entries(DCONV_PRESETS).forEach(([key, preset]) => {
    const isActive = state.dconvPresetKey === key;
    const data = isActive ? calc() : calculateDConvData(key);

    const card = document.createElement('div');
    card.className = `preset-pill rounded-lg p-2 cursor-pointer flex flex-col justify-between gap-1 relative ${isActive ? 'active' : ''}`;
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.setAttribute('aria-pressed', String(isActive));

    const title = document.createElement('span');
    title.className = 'text-[11px] font-bold truncate text-primary';
    title.textContent = loc(preset, 'title');
    const idea = document.createElement('span');
    idea.className = 'text-[9px] font-semibold truncate';
    idea.style.color = 'var(--c-conv)';
    idea.textContent = loc(preset, 'idea');

    const math = document.createElement('div');
    math.className = 'preset-math text-[10px] pt-0.5 truncate';
    renderMath(math, `h[n] = ${data.latexH}`, false);

    card.append(title, idea, math);
    const choose = () => {
      selectDConvPreset(key);
      refresh();
    };
    card.addEventListener('click', choose);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        choose();
      }
    });
    gallery.appendChild(card);
  });
}

// ---- Registro ---------------------------------------------------------------
export const dconvModule = registerModule({
  id: 'dconv',
  hash: 'dconv',
  i18n: { title: 'modDConvTitle', sub: 'modDConvSub', stepPrefix: 'stepDConv', regionsTitle: 'regionsDConvTitle' },
  zenLabel: 'y[n]',
  controls: [],
  hudTargets: [],          // as sequências vêm dos exemplos; não há editor livre
  defaultHudTarget: null,
  defaultSliderValue: 0,
  notebookEveryFrames: 6,
  cameraTarget: { x: 0, y: 0.5, z: 3.3 },
  mobileZoomOut: 1.25,   // recuo extra da câmera em telas estreitas

  slider() {
    const d = calc();
    if (state.step < 3) {
      // Antes do deslocamento, n ainda não entrou: o slider percorre as amostras k
      return {
        titleKey: 'sliderDConvK', min: d.kMin, max: d.kMax, step: 1, keyStep: 1,
        get: () => state.dconvK,
        set: (v) => { state.dconvK = Math.max(d.kMin, Math.min(d.kMax, Math.round(v))); },
        badge: () => `k = ${state.dconvK}`
      };
    }
    return {
      titleKey: 'sliderDConvN', min: d.nMin, max: d.nMax, step: 1, keyStep: 1,
      get: () => state.dconvN,
      set: (v) => { state.dconvN = Math.max(d.nMin, Math.min(d.nMax, Math.round(v))); },
      badge: () => `n = ${state.dconvN}`
    };
  },

  onEnter() {
    recomputeDConv();
  },

  onStepEnter() {},

  tick(spd) {
    // Uma amostra por vez: k nos passos 1 e 2, n a partir do deslocamento
    const d = calc();
    tickAcc += 0.03 * spd;
    if (tickAcc < 1) return;
    tickAcc = 0;
    if (state.step < 3) {
      state.dconvK = state.dconvK >= d.kMax ? d.kMin : state.dconvK + 1;
      return;
    }
    state.dconvN = state.dconvN >= d.nMax ? d.nMin : state.dconvN + 1;
  },

  renderScene,
  notebook,
  renderGallery
});
