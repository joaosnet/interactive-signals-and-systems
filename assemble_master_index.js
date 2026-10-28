const fs = require('fs');

let src = fs.readFileSync('convolu_o_3d_interativa.html', 'utf8');

function replaceExact(target, replacement, desc) {
  const idx = src.indexOf(target);
  if (idx === -1) {
    throw new Error(`Target not found for [${desc}]: "${target.substring(0, 60)}"`);
  }
  src = src.replace(target, replacement);
  console.log(`[OK] ${desc}`);
}

function replaceBetween(startAnchor, endAnchor, replacement, desc) {
  const startIdx = src.indexOf(startAnchor);
  if (startIdx === -1) {
    throw new Error(`Start anchor not found for [${desc}]: "${startAnchor.substring(0, 60)}"`);
  }
  const endIdx = src.indexOf(endAnchor, startIdx + startAnchor.length);
  if (endIdx === -1) {
    throw new Error(`End anchor not found for [${desc}]: "${endAnchor.substring(0, 60)}"`);
  }
  src = src.substring(0, startIdx) + replacement + src.substring(endIdx + endAnchor.length);
  console.log(`[OK] ${desc}`);
}

console.log('--- 1. HTML REPLACEMENTS ---');

// 0. RenderMath and latexToHtml with strict: 'ignore'
replaceBetween(
  'function renderMath(el, latex, displayMode = false) {',
  'return window.katex.renderToString(latex, { throwOnError: false, displayMode });',
  `function renderMath(el, latex, displayMode = false) {
      if (!el) return;
      if (window.katex) {
        try {
          window.katex.render(latex, el, { throwOnError: false, displayMode, strict: 'ignore' });
          return;
        } catch (err) {
          // fallback silencioso
        }
      }
      el.textContent = latex;
    }

    function latexToHtml(latex, displayMode = false) {
      if (window.katex) {
        try {
          return window.katex.renderToString(latex, { throwOnError: false, displayMode, strict: 'ignore' });`,
  'renderMath and latexToHtml strict ignore'
);

// 1. Initial body theme: projector
replaceExact(
  '<body class="theme-dark relative',
  '<body class="theme-projector relative',
  'Body theme projector'
);

// 1b. Document title
replaceExact(
  '<title>Convolução 3D — Análise no Domínio do Tempo</title>',
  '<title>3D Signals & Systems — Interactive Convolution & Fourier Analysis</title>',
  'Document title'
);

// 1c. Legends in Stage
replaceExact(
  '<span id="leg-fixed">Fixo</span>',
  '<span id="leg-fixed">Fixed</span>',
  'Legend fixed'
);
replaceExact(
  '<span id="leg-moving">Móvel</span>',
  '<span id="leg-moving">Moving</span>',
  'Legend moving'
);

// 1d. Button titles
replaceExact(
  'title="Alternar Espessura Forte para Projetor"',
  'title="High Contrast Stroke for Projectors"',
  'Thick button title'
);
replaceExact(
  'title="Tela Cheia"',
  'title="Fullscreen (F)"',
  'Fullscreen button title'
);
replaceExact(
  'title="Expandir/Reduzir Palco 3D no Mobile"',
  'title="Expand / Collapse 3D Stage on Mobile"',
  'Expand stage button title'
);

// 2. Header tabs
const oldHeaderTitle = `<div class="w-2 h-5 rounded-full flex-shrink-0" style="background: var(--c-conv)"></div>
          <div class="truncate">
            <h1 class="text-xs sm:text-sm font-bold tracking-tight truncate">Convolução 3D Passo a Passo</h1>
          </div>`;

const newHeaderTitle = `<div id="header-accent-pip" class="w-2 h-5 rounded-full flex-shrink-0" style="background: var(--c-conv)"></div>
          <div class="truncate flex items-center gap-1.5">
            <button id="btn-tab-conv" type="button" class="text-xs sm:text-sm font-bold tracking-tight truncate cursor-pointer hover:opacity-80 transition-all">3D Convolution</button>
            <span class="text-mut text-xs">/</span>
            <button id="btn-tab-fourier" type="button" class="text-xs sm:text-sm font-bold tracking-tight truncate text-mut cursor-pointer hover:text-primary transition-all">3D Fourier</button>
          </div>`;

replaceExact(oldHeaderTitle, newHeaderTitle, 'Header tabs');

// 3. Header theme buttons + language toggle
const oldHeaderButtons = `<div class="ui-card p-0.5 rounded-lg border flex items-center text-[10px]">
            <button type="button" data-theme="dark" class="theme-btn seg-btn active px-1.5 py-0.5 rounded-md">Escuro</button>
            <button type="button" data-theme="light" class="theme-btn seg-btn px-1.5 py-0.5 rounded-md">Claro</button>
            <button type="button" data-theme="projector" class="theme-btn seg-btn px-1.5 py-0.5 rounded-md" title="Alto Contraste para Projetores em Salas Iluminadas">Projetor</button>
          </div>`;

const newHeaderButtons = `<button id="btn-lang-toggle" type="button" title="Switch Language / Alternar Idioma" class="ui-control px-1.5 py-0.5 rounded-md border text-[10px] font-bold font-mono-code">
            <span id="lang-btn-text">PT-BR</span>
          </button>
          <div class="ui-card p-0.5 rounded-lg border flex items-center text-[10px]">
            <button type="button" data-theme="projector" id="btn-th-projector" class="theme-btn seg-btn active px-1.5 py-0.5 rounded-md" title="High Contrast for Classroom Projectors">Projector</button>
            <button type="button" data-theme="dark" id="btn-th-dark" class="theme-btn seg-btn px-1.5 py-0.5 rounded-md" title="Dark Theme">Dark</button>
            <button type="button" data-theme="light" id="btn-th-light" class="theme-btn seg-btn px-1.5 py-0.5 rounded-md" title="Light Theme">Light</button>
          </div>`;

replaceExact(oldHeaderButtons, newHeaderButtons, 'Header theme buttons and lang toggle');

// 4. In 3D Stage Overlay: Product legend
replaceExact(
  `          <span class="inline-flex items-center gap-1 font-medium">
            <span class="w-2.5 h-2 rounded-sm opacity-80" style="background: var(--c-prod)"></span>
            <span>Produto</span>
          </span>`,
  `          <span class="inline-flex items-center gap-1 font-medium">
            <span class="w-2.5 h-2 rounded-sm opacity-80" style="background: var(--c-prod)"></span>
            <span id="leg-prod">Product</span>
          </span>`,
  'Legend Product ID'
);

// 5. In 3D Stage Overlay: Waterfall button
replaceBetween(
  '<button id="btn-waterfall"',
  '<span>Cascata 3D</span>\n          </button>',
  `<button id="btn-waterfall" type="button" class="ui-surface backdrop-blur-md px-2 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1 shadow-sm hover:opacity-90" title="Toggle 3D Surface / Waterfall">
            <span id="lbl-waterfall">3D Waterfall</span>
          </button>
          <button id="btn-waterfall-period" type="button" class="ui-surface backdrop-blur-md px-1.5 py-1 rounded-lg border text-[10px] font-mono-code font-semibold hidden" title="Waterfall Window Duration (1 to 8 T0)">
            <span id="lbl-wf-period">2 T₀</span>
          </button>`,
  'Waterfall button ID and duration pill'
);

// 6. In 3D Stage Overlay: Camera reset button
replaceBetween(
  '<button id="btn-reset-cam"',
  '<span>Enquadrar</span>\n          </button>',
  `<button id="btn-reset-cam" type="button" title="Center 3D Camera" class="ui-surface backdrop-blur-md px-2 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1 shadow-sm hover:opacity-90">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            <span id="lbl-reset-cam">Center</span>
          </button>`,
  'Reset camera button ID'
);

// 7. Stage drag tip
replaceExact(
  `        <div class="ui-surface backdrop-blur-md px-2 py-0.5 rounded-md border text-[10px] text-mut hidden sm:block">
          Arraste: Orbitar • Pinça/Scroll: Zoom
        </div>`,
  `        <div id="stage-drag-tip" class="ui-surface backdrop-blur-md px-2 py-0.5 rounded-md border text-[10px] text-mut hidden sm:block">
          Drag: Orbit • Pinch/Scroll: Zoom
        </div>`,
  'Drag tip ID'
);

// 8. Step cards: add IDs for step-tag-1..4
replaceBetween(
  '<div class="grid grid-cols-4 gap-1">',
  'Integral</div>\n          </button>\n        </div>',
  `<div class="grid grid-cols-4 gap-1">
          <button type="button" data-step="1" class="step-card rounded-lg px-1.5 py-1 text-left">
            <div id="step-tag-1" class="text-[9px] uppercase font-bold tracking-wider opacity-75">1st Step</div>
            <div id="step-lbl-1" class="text-[11px] font-semibold truncate">t → τ</div>
          </button>
          <button type="button" data-step="2" class="step-card rounded-lg px-1.5 py-1 text-left">
            <div id="step-tag-2" class="text-[9px] uppercase font-bold tracking-wider opacity-75">2nd Step</div>
            <div id="step-lbl-2" class="text-[11px] font-semibold truncate">Reflection</div>
          </button>
          <button type="button" data-step="3" class="step-card rounded-lg px-1.5 py-1 text-left">
            <div id="step-tag-3" class="text-[9px] uppercase font-bold tracking-wider opacity-75">3rd Step</div>
            <div id="step-lbl-3" class="text-[11px] font-semibold truncate">Shift</div>
          </button>
          <button type="button" data-step="4" class="step-card active rounded-lg px-1.5 py-1 text-left">
            <div id="step-tag-4" class="text-[9px] uppercase font-bold tracking-wider opacity-75">4th Step</div>
            <div id="step-lbl-4" class="text-[11px] font-semibold truncate">Integral</div>
          </button>
        </div>`,
  'Step cards IDs'
);

// 9. Slider Row
replaceBetween(
  '<!-- Linha do Slider t + Botão Play/Pause + Modo Sequência 1->4 + Comutar -->',
  '</section>\n\n      <!-- Área Rolável Principal',
  `<!-- Linha do Slider t + Botão Play/Pause + Modo Sequência 1->4 + Comutar -->
        <div id="conv-slider-row" class="flex items-center gap-1.5">
          <button id="btn-play" type="button" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 flex-shrink-0 text-white shadow-sm" style="background: var(--c-conv)" title="Play / Pause (Space)">
            <svg id="icon-play" class="w-3 h-3 hidden" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <svg id="icon-pause" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            <span id="lbl-play">Pause</span>
          </button>

          <div class="flex-1 flex flex-col gap-0.5 min-w-0">
            <div class="flex items-center justify-between text-[10px]">
              <span id="slider-param-title" class="text-sec font-medium truncate">Time Shift t</span>
              <span id="t-readout-badge" class="font-mono-code font-semibold">t = 1.50</span>
            </div>
            <input id="t-slider" type="range" min="-2.5" max="6.0" step="0.02" value="1.50" class="w-full" />
          </div>

          <button id="btn-seq-mode" type="button" title="Sequential Presentation: 1st to 4th Step" class="ui-control px-2 py-1 rounded-lg border text-[10px] font-semibold flex-shrink-0">
            <span id="lbl-seq-mode">1st→4th</span>
          </button>

          <button id="btn-commute" type="button" title="Commutative Property: Swap x(t) and h(t)" class="ui-control px-2 py-1 rounded-lg border text-[10px] font-semibold flex-shrink-0">
            x∗h ⇄ h∗x
          </button>
        </div>

        <div id="fourier-harmonics-row" class="hidden flex items-center gap-1.5">
          <div class="flex-1 flex flex-col gap-0.5 min-w-0">
            <div class="flex items-center justify-between text-[10px]">
              <span id="lbl-fourier-slider-title" class="text-sec font-medium truncate">Harmonics N</span>
              <span id="fourier-n-badge" class="font-mono-code font-semibold">N = 7</span>
            </div>
            <input id="fourier-n-slider" type="range" min="1" max="25" step="1" value="7" class="w-full" />
          </div>
        </div>`,
  'Sliders row'
);

// 10. Notebook header title & rewatch
replaceExact(
  '<h2 class="text-[11px] font-bold uppercase tracking-wider">Resolução Analítica Manual</h2>',
  '<h2 id="notebook-title" class="text-[11px] font-bold uppercase tracking-wider">Step-by-Step Analytical Resolution</h2>',
  'Notebook title ID'
);
replaceExact(
  `<button id="btn-rewatch-write" type="button" class="ui-control px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
              <span>Reescrever Passo</span>
            </button>`,
  `<button id="btn-rewatch-write" type="button" class="ui-control px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1" title="Rewatch Step Animation">
              <span id="lbl-rewatch">Rewatch Step</span>
            </button>`,
  'Notebook rewatch ID'
);

// 11. Regions card title
replaceExact(
  'Síntese por Intervalos de t (Clique para inspecionar):',
  '<span id="regions-title">Synthesis by t Intervals (Click to inspect):</span>',
  'Regions title ID'
);

// 12. Preset gallery header
replaceExact(
  '<span class="text-[10px] font-bold uppercase tracking-wider text-sec">Exemplos das Notas de Aula & Salvos</span>',
  '<span id="gallery-title" class="text-[10px] font-bold uppercase tracking-wider text-sec">Lecture Notes Presets & Saved</span>',
  'Gallery title ID'
);
replaceExact(
  '<span class="text-[10px] text-mut">Toque para carregar</span>',
  '<span id="gallery-subtitle" class="text-[10px] text-mut">Tap to load</span>',
  'Gallery subtitle ID'
);

// 13. Inputs Header & Pin button
replaceExact(
  '<span class="text-[10px] font-bold uppercase tracking-wider text-sec">Sinais de Entrada (Toque para Editar)</span>',
  '<span id="inputs-title" class="text-[10px] font-bold uppercase tracking-wider text-sec">Input Signals (Tap to Edit)</span>',
  'Inputs title ID'
);
replaceExact(
  '+ Fixar na Galeria',
  '<span id="lbl-save-custom">+ Pin to Gallery</span>',
  'Save custom button ID'
);

// 14. Inputs blocks
replaceBetween(
  '<!-- Caixas MathField Interativas para x(t) e h(t) -->',
  '<!-- Teclado Matemático Dedicado (Abre ao focar x(t) ou h(t)) -->',
  `<!-- Caixas MathField Interativas para x(t) e h(t) -->
          <div id="conv-inputs-block" class="grid grid-cols-1 gap-1.5">
            <div id="mf-box-x" class="mathfield-box rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto custom-scroll">
                <span class="text-xs font-bold flex-shrink-0" style="color: var(--c-x1)">x(t) =</span>
                <div id="mf-render-x" class="text-xs truncate"></div>
                <span id="mf-caret-x" class="mathfield-caret hidden"></span>
              </div>
              <span class="text-[10px] font-mono-code text-mut flex-shrink-0" id="mf-raw-x"></span>
            </div>

            <div id="mf-box-h" class="mathfield-box rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto custom-scroll">
                <span class="text-xs font-bold flex-shrink-0" style="color: var(--c-x2)">h(t) =</span>
                <div id="mf-render-h" class="text-xs truncate"></div>
                <span id="mf-caret-h" class="mathfield-caret hidden"></span>
              </div>
              <span class="text-[10px] font-mono-code text-mut flex-shrink-0" id="mf-raw-h"></span>
            </div>
          </div>

          <div id="fourier-inputs-block" class="hidden grid grid-cols-1 gap-1.5">
            <div id="mf-box-fourier" class="mathfield-box rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto custom-scroll">
                <span class="text-xs font-bold flex-shrink-0" style="color: var(--c-fourier-orig)">f(t) =</span>
                <div id="mf-render-fourier" class="text-xs truncate"></div>
                <span id="mf-caret-fourier" class="mathfield-caret hidden"></span>
              </div>
              <span class="text-[10px] font-mono-code text-mut flex-shrink-0" id="mf-raw-fourier"></span>
            </div>
            <div class="flex items-center justify-between px-1 text-[11px] font-mono-code">
              <div class="flex items-center gap-1">
                <span class="text-sec font-semibold" id="lbl-fourier-t0">T₀ =</span>
                <input id="fourier-t0-input" type="number" step="0.5" min="0.5" max="10" value="3.0" class="w-16 bg-[var(--bg-card)] border rounded px-1.5 py-0.5 text-xs font-mono-code">
              </div>
              <span class="text-accent" id="fourier-w0-preview">ω₀ = 2.09 rad/s</span>
            </div>
          </div>

          `,
  'Inputs blocks'
);

// 15. Math Keyboard tabs
replaceBetween(
  '<div class="flex items-center justify-between gap-1">\n              <div class="flex items-center gap-1">',
  'Concluir\n              </button>',
  `<div class="flex items-center justify-between gap-1">
              <div class="flex items-center gap-1">
                <button type="button" data-mkb-tab="signals" id="mkb-tab-signals-btn" class="mkb-tab seg-btn active px-2 py-0.5 rounded text-[10px]">Signals & Functions</button>
                <button type="button" data-mkb-tab="algebra" id="mkb-tab-algebra-btn" class="mkb-tab seg-btn px-2 py-0.5 rounded text-[10px]">Algebra & Numbers</button>
              </div>
              <button id="btn-close-mkb" type="button" class="ui-control px-2 py-0.5 rounded text-[10px] font-semibold">
                <span id="mkb-btn-done">Done</span>
              </button>`,
  'Mkb tabs IDs'
);

// 16. Math Keyboard keys
replaceBetween(
  '<button type="button" data-insert="sin(pi*t)*(u(t)-u(t-1))"',
  'data-katex="\\sin(\\pi t)p"></button>',
  `<button type="button" data-insert="sin(pi*t)" class="mkb-key" data-katex="\\sin(\\pi t)"></button>
              <button type="button" data-insert="cos(pi*t)" class="mkb-key" data-katex="\\cos(\\pi t)"></button>
              <button type="button" data-insert="sign(t)" class="mkb-key" data-katex="\\text{sgn}(t)"></button>
              <button type="button" data-insert="sinc(t)" class="mkb-key" data-katex="\\text{sinc}(t)"></button>`,
  'Math Keyboard keys'
);

// 17. compileSignalExpr: add sign/sgn and pass to runtime fn
replaceBetween(
  'const sinc = (v) =>',
  'return Number.isFinite(val) ? val : 0;',
  `const sinc = (v) => (Math.abs(v) < 1e-6 ? 1.0 : Math.sin(Math.PI * v) / (Math.PI * v));
      const sign = (v) => (v > 0 ? 1.0 : v < 0 ? -1.0 : 0.0);
      const sgn = sign;

      let jsExpr = clean
        .replace(/\\^/g, '**')
        .replace(/\\bpi\\b/gi, 'Math.PI')
        .replace(/\\be\\b/g, 'Math.E')
        .replace(/\\bsin\\s*\\(/g, 'Math.sin(')
        .replace(/\\bcos\\s*\\(/g, 'Math.cos(')
        .replace(/\\bexp\\s*\\(/g, 'Math.exp(')
        .replace(/\\bsqrt\\s*\\(/g, 'Math.sqrt(')
        .replace(/\\babs\\s*\\(/g, 'Math.abs(')
        .replace(/\\bsign\\s*\\(/g, 'sign(')
        .replace(/\\bsgn\\s*\\(/g, 'sgn(');

      try {
        const fn = new Function('t', 'u', 'r', 'rect', 'tri', 'sinc', 'sign', 'sgn', \`"use strict"; return Number(\${jsExpr}) || 0;\`);
        fn(0.5, u, r, rect, tri, sinc, sign, sgn);
        return (tVal) => {
          try {
            const val = fn(tVal, u, r, rect, tri, sinc, sign, sgn);
            return Number.isFinite(val) ? val : 0;`,
  'compileSignalExpr sign/sgn'
);

// 17b. exprToLatex: add sign, sgn, abs formatting
replaceExact(
  ".replace(/\\*/g, '\\\\cdot ');",
  ".replace(/sign\\(([^)]+)\\)/g, '\\\\mathrm{sgn}($1)').replace(/sgn\\(([^)]+)\\)/g, '\\\\mathrm{sgn}($1)').replace(/abs\\(([^)]+)\\)/g, '|$1|').replace(/\\*/g, '\\\\cdot ');",
  'exprToLatex math functions'
);

console.log('--- 2. JS ENGINE INJECTIONS ---');

// 18. Add shortTitleEn and subtitleEn to BUILTIN_PRESETS
replaceExact(
  `      ex8: {
        id: 'ex8',
        shortTitle: 'Exemplo #8',
        subtitle: 'Exponencial e Pulso [0, 3]',`,
  `      ex8: {
        id: 'ex8',
        shortTitle: 'Exemplo #8',
        shortTitleEn: 'Example #8',
        subtitle: 'Exponencial e Pulso [0, 3]',
        subtitleEn: 'Exponential & Pulse [0, 3]',`,
  'Preset ex8 bilingual'
);

replaceExact(
  `      ex1: {
        id: 'ex1',
        shortTitle: 'Exemplo #1 / #2',
        subtitle: 'Exponencial e Degrau u(t)',`,
  `      ex1: {
        id: 'ex1',
        shortTitle: 'Exemplo #1 / #2',
        shortTitleEn: 'Example #1 / #2',
        subtitle: 'Exponencial e Degrau u(t)',
        subtitleEn: 'Exponential & Step u(t)',`,
  'Preset ex1 bilingual'
);

replaceExact(
  `      lathi25: {
        id: 'lathi25',
        shortTitle: 'Lathi Ex. 2.5',
        subtitle: 'Duas Exponenciais Causais',`,
  `      lathi25: {
        id: 'lathi25',
        shortTitle: 'Lathi Ex. 2.5',
        shortTitleEn: 'Lathi Ex. 2.5',
        subtitle: 'Duas Exponenciais Causais',
        subtitleEn: 'Two Causal Exponentials',`,
  'Preset lathi25 bilingual'
);

replaceExact(
  `      ex5: {
        id: 'ex5',
        shortTitle: 'Exemplo #5',
        subtitle: 'Pulso [-1,1] e Rampa t/3',`,
  `      ex5: {
        id: 'ex5',
        shortTitle: 'Exemplo #5',
        shortTitleEn: 'Example #5',
        subtitle: 'Pulso [-1,1] e Rampa t/3',
        subtitleEn: 'Pulse [-1,1] & Ramp t/3',`,
  'Preset ex5 bilingual'
);

replaceExact(
  `      ex7: {
        id: 'ex7',
        shortTitle: 'Exemplo #7',
        subtitle: 'Pulso Dipolo e Rampa t/2',`,
  `      ex7: {
        id: 'ex7',
        shortTitle: 'Exemplo #7',
        shortTitleEn: 'Example #7',
        subtitle: 'Pulso Dipolo e Rampa t/2',
        subtitleEn: 'Dipole Pulse & Ramp t/2',`,
  'Preset ex7 bilingual'
);

// 19. State block & I18N dictionary & Fourier Presets & Math Engine
const stateRepl = `    const I18N = {
      en: {
        langBtn: 'PT-BR',
        tabConv: '3D Convolution',
        tabFourier: '3D Fourier',
        thProjector: 'Projector',
        thDark: 'Dark',
        thLight: 'Light',
        thProjectorTitle: 'High Contrast for Classroom Projectors',
        thDarkTitle: 'Dark Theme',
        thLightTitle: 'Light Theme',
        btnThickTitle: 'High Contrast Stroke for Projectors',
        btnFullscreenTitle: 'Fullscreen (F)',
        legFixed: 'Fixed',
        legMoving: 'Moving',
        legProd: 'Product',
        legFourierOrig: 'f(t) Periodic',
        legFourierHarm: 'Harmonics',
        legFourierRecon: 'Reconstruction SN(t)',
        waterfall: '3D Waterfall',
        waterfallTitle: 'Toggle 3D Surface / Waterfall',
        resetCam: 'Center',
        resetCamTitle: 'Reset 3D Camera',
        dragTip: 'Drag: Orbit • Pinch/Scroll: Zoom',
        stepTag1: '1st Step',
        stepTag2: '2nd Step',
        stepTag3: '3rd Step',
        stepTag4: '4th Step',
        stepConv1: 't → τ',
        stepConv2: 'Reflection',
        stepConv3: 'Shift',
        stepConv4: 'Integral',
        stepFourier1: 'Signal & Definition',
        stepFourier2: 'Symmetry & Parity',
        stepFourier3: 'Harmonics Table',
        stepFourier4: 'Reconstruction',
        btnPlayPlay: 'Play',
        btnPlayPause: 'Pause',
        btnPlayTitle: 'Play / Pause (Space)',
        sliderTime: 'Time Shift t',
        sliderHarmonics: 'Harmonics N',
        sliderEvalPoint: 'Evaluation Point t',
        btnSeqTitle: 'Sequential Presentation: 1st to 4th Step',
        btnSeqMode: '1st→4th',
        btnCommuteTitle: 'Commutative Property: Swap x(t) and h(t)',
        notebookTitle: 'Step-by-Step Analytical Resolution',
        btnRewatch: 'Rewatch Step',
        btnRewatchTitle: 'Rewatch Step Animation',
        regionsTitle: 'Synthesis by t Intervals (Click to inspect):',
        regionsFourierTitle: 'Fourier Harmonic Spectrum (First N Terms):',
        galleryTitle: 'Lecture Notes Presets & Saved',
        gallerySubtitle: 'Tap to load',
        inputsTitle: 'Input Signals (Tap to Edit)',
        btnPin: '+ Pin to Gallery',
        mkbSignals: 'Signals & Functions',
        mkbAlgebra: 'Algebra & Numbers',
        mkbDone: 'Done',
        lblInputX: 'x(t) [Fixed]',
        lblInputH: 'h(t) [Moving]',
        lblInputF: 'f(t) [Periodic]',
        lblPeriodT0: 'Period T₀ =',
        sampleTau: 'Sample at τ:',
        reflection: 'Spatial Reflection:',
        currentParam: 'Current Parameter:',
        fundFreq: 'Fundamental Frequency:',
        symmClass: 'Symmetry Classification:',
        activeHarm: 'Active Harmonics:',
        approxAtT: 'Approximation at t:',
        noOverlap: 'No overlap',
        fullOverlap: 'Active overlap',
        docTitle: '3D Signals & Systems — Interactive Convolution & Fourier Analysis',
        sliderSweep: 'Tau Sweep τ (Step 1)',
        sliderFlip: 'Reflection Rotation θ (Step 2)',
        sliderShift3: 'Time Shift t (Step 3)',
        sliderShift4: 'Time Shift t (Step 4)',
        btnExpandStage: 'Expand / Collapse 3D Stage on Mobile',
        delPreset: 'Remove',
        customSignal: 'Custom Signal',
        savedPreset: 'Saved #'
      },
      pt: {
        langBtn: 'EN',
        tabConv: 'Convolução 3D',
        tabFourier: 'Fourier 3D',
        thProjector: 'Projetor',
        thDark: 'Escuro',
        thLight: 'Claro',
        thProjectorTitle: 'Alto Contraste para Projetores em Salas Iluminadas',
        thDarkTitle: 'Tema Escuro',
        thLightTitle: 'Tema Claro',
        btnThickTitle: 'Alternar Espessura Forte para Projetor',
        btnFullscreenTitle: 'Tela Cheia (F)',
        legFixed: 'Fixo',
        legMoving: 'Móvel',
        legProd: 'Produto',
        legFourierOrig: 'f(t) Periódica',
        legFourierHarm: 'Harmônicas',
        legFourierRecon: 'Reconstrução SN(t)',
        waterfall: 'Cascata 3D',
        waterfallTitle: 'Alternar Cascata 3D (Superfície Contínua)',
        resetCam: 'Enquadrar',
        resetCamTitle: 'Centralizar Câmera 3D',
        dragTip: 'Arraste: Orbitar • Pinça/Scroll: Zoom',
        stepTag1: '1º Passo',
        stepTag2: '2º Passo',
        stepTag3: '3º Passo',
        stepTag4: '4º Passo',
        stepConv1: 't → τ',
        stepConv2: 'Reflexão',
        stepConv3: 'Deslocar',
        stepConv4: 'Integral',
        stepFourier1: 'Sinal & Definição',
        stepFourier2: 'Simetria & Paridade',
        stepFourier3: 'Tabela Harmônica',
        stepFourier4: 'Reconstrução',
        btnPlayPlay: 'Reproduzir',
        btnPlayPause: 'Pausar',
        btnPlayTitle: 'Reproduzir / Pausar (Espaço)',
        sliderTime: 'Deslocamento t',
        sliderHarmonics: 'Harmônicas N',
        sliderEvalPoint: 'Ponto de Avaliação t',
        btnSeqTitle: 'Encadear Animação Completa do 1º ao 4º Passo',
        btnSeqMode: '1º→4º',
        btnCommuteTitle: 'Propriedade Comutativa: Alternar quem fica fixo e quem reflete',
        notebookTitle: 'Resolução Analítica Manual',
        btnRewatch: 'Reescrever Passo',
        btnRewatchTitle: 'Reescrever Passo da Animação',
        regionsTitle: 'Síntese por Intervalos de t (Clique para inspecionar):',
        regionsFourierTitle: 'Espectro Harmônico de Fourier (Primeiros N Termos):',
        galleryTitle: 'Exemplos das Notas de Aula & Salvos',
        gallerySubtitle: 'Toque para carregar',
        inputsTitle: 'Sinais de Entrada (Toque para Editar)',
        btnPin: '+ Fixar na Galeria',
        mkbSignals: 'Sinais & Funções',
        mkbAlgebra: 'Álgebra & Números',
        mkbDone: 'Concluir',
        lblInputX: 'x(t) [Fixo]',
        lblInputH: 'h(t) [Móvel]',
        lblInputF: 'f(t) [Periódica]',
        lblPeriodT0: 'Período T₀ =',
        sampleTau: 'Amostra em τ:',
        reflection: 'Reflexão Espacial:',
        currentParam: 'Parâmetro Atual:',
        fundFreq: 'Frequência Fundamental:',
        symmClass: 'Classificação de Simetria:',
        activeHarm: 'Harmônicas Ativas:',
        approxAtT: 'Aproximação em t:',
        noOverlap: 'Sem sobreposição',
        fullOverlap: 'Sobreposição ativa',
        docTitle: 'Sinais & Sistemas 3D — Convolução e Fourier Interativos',
        sliderSweep: 'Varredura τ (Passo 1)',
        sliderFlip: 'Giro de Reflexão θ (Passo 2)',
        sliderShift3: 'Deslocamento t (Passo 3)',
        sliderShift4: 'Deslocamento t (Passo 4)',
        btnExpandStage: 'Expandir / Reduzir Palco 3D no Mobile',
        delPreset: 'Remover',
        customSignal: 'Sinal Personalizado',
        savedPreset: 'Salvo #'
      }
    };

    const initialLang = (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en';

    const FOURIER_PRESETS = {
      square: {
        id: 'square',
        title: 'Onda Quadrada',
        titleEn: 'Square Wave',
        subtitle: 'Simetria Ímpar, harmônicas ímpares 1/n',
        subtitleEn: 'Odd Symmetry, 1/n odd harmonics',
        expr: '(u(t) - u(t-1.5)) - (u(t-1.5) - u(t-3))',
        T0: 3.0,
        N: 7
      },
      sawtooth: {
        id: 'sawtooth',
        title: 'Dente de Serra',
        titleEn: 'Sawtooth Wave',
        subtitle: 'Rampa periódica contínua por partes',
        subtitleEn: 'Piecewise linear periodic ramp',
        expr: '(2*t/2.0 - 1) * (u(t) - u(t-2.0))',
        T0: 2.0,
        N: 9
      },
      triangular: {
        id: 'triangular',
        title: 'Onda Triangular',
        titleEn: 'Triangular Wave',
        subtitle: 'Simetria Par, decaimento rápido 1/n²',
        subtitleEn: 'Even Symmetry, rapid 1/n² decay',
        expr: 'tri((t - 1.5) / 1.5) * (u(t) - u(t-3))',
        T0: 3.0,
        N: 5
      },
      half_wave: {
        id: 'half_wave',
        title: 'Retificada Meia Onda',
        titleEn: 'Half-Wave Rectified',
        subtitle: 'Seno retificado no semiciclo positivo',
        subtitleEn: 'Rectified sine on positive half-cycle',
        expr: 'sin(pi*t) * (u(t) - u(t-1.0))',
        T0: 2.0,
        N: 8
      },
      full_wave: {
        id: 'full_wave',
        title: 'Retificada Onda Completa',
        titleEn: 'Full-Wave Rectified',
        subtitle: '|sin(πt)| com período duplicado T0=1',
        subtitleEn: '|sin(πt)| with doubled period T0=1',
        expr: 'abs(sin(pi*t)) * (u(t) - u(t-1.0))',
        T0: 1.0,
        N: 6
      },
      sinc_train: {
        id: 'sinc_train',
        title: 'Trem de Pulsos Sinc',
        titleEn: 'Sinc Pulse Train',
        subtitle: 'Pulsos limitados em banda periódicos',
        subtitleEn: 'Periodic bandlimited sinc pulses',
        expr: 'sinc(2*t - 2) * (u(t) - u(t-2))',
        T0: 2.0,
        N: 11
      }
    };

    function calculateFourierData() {
      const T0 = Math.max(0.2, Number(state.fourierT0) || 3.0);
      const w0 = (2 * Math.PI) / T0;
      const fn = compileSignalExpr(state.fourierExpr);
      const N = Math.min(25, Math.max(1, Math.round(state.fourierN) || 7));

      const numSamples = 240;
      const dt = T0 / numSamples;
      let a0Sum = 0;
      for (let i = 0; i < numSamples; i++) {
        const tSample = (i + 0.5) * dt;
        a0Sum += fn(tSample);
      }
      const a0 = (a0Sum * dt) / T0;

      const harmonics = [];
      let parsevalPower = a0 * a0;

      for (let n = 1; n <= N; n++) {
        let anSum = 0;
        let bnSum = 0;
        for (let i = 0; i < numSamples; i++) {
          const tSample = (i + 0.5) * dt;
          const val = fn(tSample);
          anSum += val * Math.cos(n * w0 * tSample);
          bnSum += val * Math.sin(n * w0 * tSample);
        }
        let an = (2 / T0) * anSum * dt;
        let bn = (2 / T0) * bnSum * dt;
        if (Math.abs(an) < 1e-4) an = 0;
        if (Math.abs(bn) < 1e-4) bn = 0;
        const cn = Math.sqrt(an * an + bn * bn);
        const theta = cn > 1e-4 ? Math.atan2(-bn, an) : 0;
        harmonics.push({ n, nw0: n * w0, an, bn, cn, theta });
        parsevalPower += 0.5 * (an * an + bn * bn);
      }

      let evenDiff = 0;
      let oddDiff = 0;
      let totalEnergy = 0;
      const testSteps = 40;
      for (let i = 0; i < testSteps; i++) {
        const tVal = ((i + 0.5) / testSteps) * T0;
        const fPlus = fn(tVal);
        const fMinus = fn(T0 - tVal);
        evenDiff += Math.abs(fPlus - fMinus);
        oddDiff += Math.abs(fPlus + fMinus);
        totalEnergy += Math.abs(fPlus);
      }
      const norm = totalEnergy || 1.0;
      const isEven = (evenDiff / norm) < 0.05;
      const isOdd = !isEven && (oddDiff / norm) < 0.05;
      const symmetryType = isEven ? 'even' : isOdd ? 'odd' : 'none';

      const reconstruct = (t) => {
        let sum = a0;
        for (let i = 0; i < harmonics.length; i++) {
          const h = harmonics[i];
          sum += h.an * Math.cos(h.nw0 * t) + h.bn * Math.sin(h.nw0 * t);
        }
        return sum;
      };

      let mseSum = 0;
      for (let i = 0; i < numSamples; i++) {
        const tSample = (i + 0.5) * dt;
        const orig = fn(tSample);
        const rec = reconstruct(tSample);
        const diff = orig - rec;
        mseSum += diff * diff;
      }
      const mse = (mseSum * dt) / T0;

      state.fourierCalculated = {
        T0,
        w0,
        f0: 1.0 / T0,
        a0,
        harmonics,
        symmetryType,
        reconstruct,
        fn,
        parsevalPower,
        mse
      };
      return state.fourierCalculated;
    }

    function setLanguage(lang) {
      state.lang = lang;
      const dict = I18N[lang] || I18N.en;

      const langBtnText = document.getElementById('lang-btn-text');
      if (langBtnText) langBtnText.textContent = dict.langBtn;

      const btnConv = document.getElementById('btn-tab-conv');
      const btnFourier = document.getElementById('btn-tab-fourier');
      if (btnConv) btnConv.textContent = dict.tabConv;
      if (btnFourier) btnFourier.textContent = dict.tabFourier;

      const thProj = document.getElementById('btn-th-projector');
      const thDark = document.getElementById('btn-th-dark');
      const thLight = document.getElementById('btn-th-light');
      if (thProj) { thProj.textContent = dict.thProjector; thProj.title = dict.thProjectorTitle; }
      if (thDark) { thDark.textContent = dict.thDark; thDark.title = dict.thDarkTitle; }
      if (thLight) { thLight.textContent = dict.thLight; thLight.title = dict.thLightTitle; }

      const btnThick = document.getElementById('btn-thick');
      if (btnThick) btnThick.title = dict.btnThickTitle;
      const btnFs = document.getElementById('btn-fullscreen');
      if (btnFs) btnFs.title = dict.btnFullscreenTitle;

      const legProd = document.getElementById('leg-prod');
      if (legProd) legProd.textContent = state.activeModule === 'fourier' ? dict.legFourierHarm : dict.legProd;
      const lblWaterfall = document.getElementById('lbl-waterfall');
      if (lblWaterfall) lblWaterfall.textContent = dict.waterfall;
      const btnWaterfall = document.getElementById('btn-waterfall');
      if (btnWaterfall) btnWaterfall.title = dict.waterfallTitle;

      const lblResetCam = document.getElementById('lbl-reset-cam');
      if (lblResetCam) lblResetCam.textContent = dict.resetCam;
      const btnResetCam = document.getElementById('btn-reset-cam');
      if (btnResetCam) btnResetCam.title = dict.resetCamTitle;

      const dragTip = document.getElementById('stage-drag-tip');
      if (dragTip) dragTip.textContent = dict.dragTip;

      for (let s = 1; s <= 4; s++) {
        const tagEl = document.getElementById('step-tag-' + s);
        if (tagEl) tagEl.textContent = dict['stepTag' + s];
        const lblEl = document.getElementById('step-lbl-' + s);
        if (lblEl) {
          lblEl.textContent = state.activeModule === 'fourier' ? dict['stepFourier' + s] : dict['stepConv' + s];
        }
      }

      const lblPlay = document.getElementById('lbl-play');
      if (lblPlay) lblPlay.textContent = state.isPlaying ? dict.btnPlayPause : dict.btnPlayPlay;
      const btnPlay = document.getElementById('btn-play');
      if (btnPlay) btnPlay.title = dict.btnPlayTitle;

      const sliderTitle = document.getElementById('slider-param-title');
      if (sliderTitle) sliderTitle.textContent = state.activeModule === 'fourier' ? dict.sliderEvalPoint : dict.sliderTime;
      const fourierSliderTitle = document.getElementById('lbl-fourier-slider-title');
      if (fourierSliderTitle) fourierSliderTitle.textContent = dict.sliderHarmonics;

      const btnSeq = document.getElementById('btn-seq-mode');
      if (btnSeq) {
        btnSeq.title = dict.btnSeqTitle;
        const lblSeq = document.getElementById('lbl-seq-mode');
        if (lblSeq) lblSeq.textContent = dict.btnSeqMode;
      }
      const btnCommute = document.getElementById('btn-commute');
      if (btnCommute) btnCommute.title = dict.btnCommuteTitle;

      const notebookTitle = document.getElementById('notebook-title');
      if (notebookTitle) notebookTitle.textContent = dict.notebookTitle;
      const lblRewatch = document.getElementById('lbl-rewatch');
      if (lblRewatch) lblRewatch.textContent = dict.btnRewatch;
      const btnRewatch = document.getElementById('btn-rewatch-write');
      if (btnRewatch) btnRewatch.title = dict.btnRewatchTitle;

      const regionsTitle = document.getElementById('regions-title');
      if (regionsTitle) {
        regionsTitle.textContent = state.activeModule === 'fourier' ? dict.regionsFourierTitle : dict.regionsTitle;
      }

      const galTitle = document.getElementById('gallery-title');
      if (galTitle) galTitle.textContent = dict.galleryTitle;
      const galSub = document.getElementById('gallery-subtitle');
      if (galSub) galSub.textContent = dict.gallerySubtitle;

      const inputsTitle = document.getElementById('inputs-title');
      if (inputsTitle) inputsTitle.textContent = dict.inputsTitle;
      const lblSave = document.getElementById('lbl-save-custom');
      if (lblSave) lblSave.textContent = dict.btnPin;

      const mkbSig = document.getElementById('mkb-tab-signals-btn');
      if (mkbSig) mkbSig.textContent = dict.mkbSignals;
      const mkbAlg = document.getElementById('mkb-tab-algebra-btn');
      if (mkbAlg) mkbAlg.textContent = dict.mkbAlgebra;
      const mkbDone = document.getElementById('mkb-btn-done');
      if (mkbDone) mkbDone.textContent = dict.mkbDone;

      document.title = dict.docTitle;
      const btnExp = document.getElementById('btn-expand-stage');
      if (btnExp) btnExp.title = dict.btnExpandStage;

      if (sliderTitle) {
        if (state.activeModule === 'fourier') {
          sliderTitle.textContent = dict.sliderEvalPoint;
        } else {
          if (state.step === 1) sliderTitle.textContent = dict.sliderSweep;
          else if (state.step === 2) sliderTitle.textContent = dict.sliderFlip;
          else if (state.step === 3) sliderTitle.textContent = dict.sliderShift3;
          else sliderTitle.textContent = dict.sliderShift4;
        }
      }

      renderPresetGallery();
      updateNotebookUI(false);
      updateScene3D();
    }

    function switchModule(moduleName) {
      state.activeModule = moduleName;
      const isFourier = moduleName === 'fourier';
      const dict = I18N[state.lang] || I18N.en;

      const btnConv = document.getElementById('btn-tab-conv');
      const btnFourier = document.getElementById('btn-tab-fourier');
      const pip = document.getElementById('header-accent-pip');
      if (btnConv && btnFourier) {
        if (isFourier) {
          btnConv.classList.remove('text-primary');
          btnConv.classList.add('text-mut');
          btnFourier.classList.remove('text-mut');
          btnFourier.classList.add('text-primary');
          if (pip) pip.style.background = 'var(--c-fourier-orig)';
        } else {
          btnFourier.classList.remove('text-primary');
          btnFourier.classList.add('text-mut');
          btnConv.classList.remove('text-mut');
          btnConv.classList.add('text-primary');
          if (pip) pip.style.background = 'var(--c-conv)';
        }
      }

      const convSlider = document.getElementById('conv-slider-row');
      const fourierSlider = document.getElementById('fourier-harmonics-row');
      if (convSlider && fourierSlider) {
        convSlider.classList.toggle('hidden', isFourier);
        fourierSlider.classList.toggle('hidden', !isFourier);
      }

      if (!isFourier) {
        const sliderTitle = document.getElementById('slider-param-title');
        if (sliderTitle) {
          if (state.step === 1) sliderTitle.textContent = dict.sliderSweep;
          else if (state.step === 2) sliderTitle.textContent = dict.sliderFlip;
          else if (state.step === 3) sliderTitle.textContent = dict.sliderShift3;
          else sliderTitle.textContent = dict.sliderShift4;
        }
      }

      const convInputs = document.getElementById('conv-inputs-block');
      const fourierInputs = document.getElementById('fourier-inputs-block');
      if (convInputs && fourierInputs) {
        convInputs.classList.toggle('hidden', isFourier);
        fourierInputs.classList.toggle('hidden', !isFourier);
      }

      const wfPeriodBtn = document.getElementById('btn-waterfall-period');
      if (wfPeriodBtn) wfPeriodBtn.classList.toggle('hidden', !isFourier || !state.showWaterfall);

      const btnCommute = document.getElementById('btn-commute');
      if (btnCommute) btnCommute.classList.toggle('hidden', isFourier);

      for (let s = 1; s <= 4; s++) {
        const lblEl = document.getElementById('step-lbl-' + s);
        if (lblEl) lblEl.textContent = isFourier ? dict['stepFourier' + s] : dict['stepConv' + s];
      }

      const legProd = document.getElementById('leg-prod');
      if (legProd) legProd.textContent = isFourier ? dict.legFourierHarm : dict.legProd;

      const regionsTitle = document.getElementById('regions-title');
      if (regionsTitle) regionsTitle.textContent = isFourier ? dict.regionsFourierTitle : dict.regionsTitle;

      if (isFourier) {
        calculateFourierData();
        setActiveMathField('fourier');
      } else {
        setActiveMathField('x');
      }

      syncInputsWithPreset();
      renderPresetGallery();
      updateNotebookUI(false);
      updateScene3D();
    }

    const state = {
      presetKey: 'ex8',
      customPresets: [],
      step: 4,
      t: 1.5,
      tauSweep: 1.2,
      flipAngle: Math.PI,
      isPlaying: true,
      seqMode: false,
      isCommuted: false,
      showWaterfall: true,
      theme: 'projector',
      thickLines: false,
      activeMathField: null,
      exprX: BUILTIN_PRESETS.ex8.exprX,
      exprH: BUILTIN_PRESETS.ex8.exprH,
      lang: initialLang,
      activeModule: 'convolution',
      fourierN: 7,
      fourierT0: 3.0,
      fourierCustomPresets: [],
      fourierExpr: '(u(t) - u(t-1.5)) - (u(t-1.5) - u(t-3))',
      fourierPresetKey: 'square',
      fourierCalculated: null
    };`;

replaceBetween(
  '// ============================================================================\n    // 3. ESTADO GLOBAL DA APLICAÇÃO\n    // ============================================================================\n    const state = {',
  'exprH: BUILTIN_PRESETS.ex8.exprH\n    };',
  `// ============================================================================
    // 3. ESTADO GLOBAL DA APLICAÇÃO & I18N
    // ============================================================================
` + stateRepl,
  'State block and I18N'
);

// 20. buildNotebookLinesForStep (Bilingual for both Convolution & Fourier)
const nbLinesCode = `    function buildNotebookLinesFourier(calc) {
      const isEn = state.lang === 'en';
      const tNow = state.t;
      const recVal = calc.reconstruct(tNow);
      const origVal = calc.fn(tNow);
      const T0Str = calc.T0.toFixed(2);
      const w0Str = calc.w0.toFixed(3);
      const f0Str = calc.f0.toFixed(3);
      const a0Str = calc.a0.toFixed(4);

      if (state.step === 1) {
        return [
          {
            label: isEn ? '1.1 Fourier Series Representation:' : '1.1 Representação em Série de Fourier:',
            latex: \`f(t) = a_0 + \\\\sum_{n=1}^{\\\\infty} \\\\left[ a_n \\\\cos(n\\\\omega_0 t) + b_n \\\\sin(n\\\\omega_0 t) \\\\right] = C_0 + \\\\sum_{n=1}^{\\\\infty} C_n \\\\cos(n\\\\omega_0 t + \\\\theta_n)\`
          },
          {
            label: isEn ? '1.2 Fundamental Period and Angular Frequency:' : '1.2 Período Fundamental e Frequência Angular:',
            latex: \`T_0 = \${T0Str}\\\\text{ s}, \\\\quad \\\\omega_0 = \\\\frac{2\\\\pi}{T_0} = \${w0Str}\\\\text{ rad/s}, \\\\quad f_0 = \${f0Str}\\\\text{ Hz}\`
          },
          {
            label: isEn ? '1.3 Average Value (DC Component a₀):' : '1.3 Valor Médio (Componente DC a₀):',
            latex: \`a_0 = \\\\frac{1}{T_0} \\\\int_{0}^{T_0} f(t)\\\\,dt = \${a0Str}\`
          }
        ];
      }

      if (state.step === 2) {
        let symLatex = '';
        let symExpl = '';
        if (calc.symmetryType === 'even') {
          symLatex = isEn
            ? 'f(-t) = f(t) \\\\implies \\\\text{Even Symmetry: } b_n = 0, \\\\; a_n = \\\\frac{4}{T_0} \\\\int_0^{T_0/2} f(t)\\\\cos(n\\\\omega_0 t)\\\\,dt'
            : 'f(-t) = f(t) \\\\implies \\\\text{Simetria Par: } b_n = 0, \\\\; a_n = \\\\frac{4}{T_0} \\\\int_0^{T_0/2} f(t)\\\\cos(n\\\\omega_0 t)\\\\,dt';
          symExpl = isEn ? 'Only cosine harmonics are present.' : 'Somente harmônicas em cosseno estão presentes.';
        } else if (calc.symmetryType === 'odd') {
          symLatex = isEn
            ? 'f(-t) = -f(t) \\\\implies \\\\text{Odd Symmetry: } a_0 = 0, \\\\; a_n = 0, \\\\; b_n = \\\\frac{4}{T_0} \\\\int_0^{T_0/2} f(t)\\\\sin(n\\\\omega_0 t)\\\\,dt'
            : 'f(-t) = -f(t) \\\\implies \\\\text{Simetria Ímpar: } a_0 = 0, \\\\; a_n = 0, \\\\; b_n = \\\\frac{4}{T_0} \\\\int_0^{T_0/2} f(t)\\\\sin(n\\\\omega_0 t)\\\\,dt';
          symExpl = isEn ? 'DC value is zero; only sine harmonics exist.' : 'Valor DC é nulo; apenas harmônicas em seno existem.';
        } else {
          symLatex = isEn
            ? 'f(-t) \\\\ne \\\\pm f(t) \\\\implies \\\\text{General Asymmetry: Both } a_n \\\\text{ and } b_n \\\\text{ are present}'
            : 'f(-t) \\\\ne \\\\pm f(t) \\\\implies \\\\text{Sem Simetria Pura: Coeficientes } a_n \\\\text{ e } b_n \\\\text{ ativos}';
          symExpl = isEn ? 'Both trigonometric terms required.' : 'Ambos os termos trigonométricos são necessários.';
        }

        return [
          {
            label: isEn ? '2.1 Even / Odd Parity Verification:' : '2.1 Análise de Paridade (Simetria Par / Ímpar):',
            latex: symLatex
          },
          {
            label: isEn ? '2.2 Symmetry-Induced Simplifications:' : '2.2 Simplificações de Simetria nos Coeficientes:',
            latex: \`\\\\text{\${symExpl}}\`
          },
          {
            label: isEn ? '2.3 Dirichlet Conditions Verification:' : '2.3 Verificação das Condições de Dirichlet:',
            latex: isEn
              ? '\\\\int_0^{T_0} |f(t)|\\\\,dt < \\\\infty \\\\quad \\\\text{(Absolutely Integrable, finite extrema and discontinuities per period)}'
              : '\\\\int_0^{T_0} |f(t)|\\\\,dt < \\\\infty \\\\quad \\\\text{(Absolutamente integrável, extremos e descontinuidades finitas)}'
          }
        ];
      }

      if (state.step === 3) {
        const topH = calc.harmonics.slice(0, 4);
        const rows = topH.map(h => \`n=\${h.n}: \\\\; a_\${h.n}=\${h.an.toFixed(3)}, \\\\; b_\${h.n}=\${h.bn.toFixed(3)}, \\\\; C_\${h.n}=\${h.cn.toFixed(3)}, \\\\; \\\\theta_\${h.n}=\${(h.theta/Math.PI).toFixed(2)}\\\\pi\`).join(' \\\\\\\\ ');
        return [
          {
            label: isEn ? '3.1 Harmonic Spectrum Synthesis Table (n = 1..N):' : '3.1 Tabela de Síntese Harmônica (n = 1..N):',
            latex: \`\\\\begin{aligned} \${rows} \\\\end{aligned}\`
          },
          {
            label: isEn ? '3.2 Trigonometric to Compact Polar Form:' : '3.2 Conversão Trigonométrica → Polar Compacta:',
            latex: 'C_n = \\\\sqrt{a_n^2 + b_n^2}, \\\\quad \\\\theta_n = \\\\operatorname{atan2}(-b_n, a_n), \\\\quad C_0 = a_0'
          },
          {
            label: isEn ? '3.3 Parseval\\'s Power Distribution:' : '3.3 Potência Média Total e Teorema de Parseval:',
            latex: \`P_{\\\\text{total}} = C_0^2 + \\\\frac{1}{2}\\\\sum_{n=1}^{\${calc.harmonics.length}} C_n^2 \\\\approx \${calc.parsevalPower.toFixed(4)}\\\\text{ W}\`
          }
        ];
      }

      return [
        {
          label: isEn ? '4.1 Truncated Fourier Reconstruction Formula:' : '4.1 Fórmula de Reconstrução com N Harmônicas:',
          latex: \`S_N(t) = a_0 + \\\\sum_{n=1}^{\${calc.harmonics.length}} \\\\left[ a_n \\\\cos(n\\\\omega_0 t) + b_n \\\\sin(n\\\\omega_0 t) \\\\right]\`
        },
        {
          label: isEn ? '4.2 Active Harmonic Evaluation at Current t:' : '4.2 Avaliação Instantânea no Ponto t:',
          latex: \`t = \${tNow.toFixed(2)} \\\\implies S_{\${calc.harmonics.length}}(\${tNow.toFixed(2)}) = \${recVal.toFixed(4)}, \\\\quad f(\${tNow.toFixed(2)}) = \${origVal.toFixed(4)}\`
        },
        {
          label: isEn ? '4.3 Gibbs Phenomenon and Mean Square Error:' : '4.3 Fenômeno de Gibbs e Erro Médio Quadrático (MSE):',
          latex: \`\\\\text{MSE}_N = \\\\frac{1}{T_0}\\\\int_0^{T_0} |f(t) - S_N(t)|^2\\\\,dt \\\\approx \${calc.mse.toFixed(5)} \\\\quad (\${isEn ? '\\\\text{approx } 9\\\\% \\\\text{ overshoot near jumps}' : '\\\\text{sobressinal } \\\\approx 9\\\\% \\\\text{ em descontinuidades}'})\`
        }
      ];
    }

    function buildNotebookLinesForStep(sig) {
      if (state.activeModule === 'fourier') {
        return buildNotebookLinesFourier(state.fourierCalculated || calculateFourierData());
      }

      const isEn = state.lang === 'en';
      const fSym = sig.fixedSym;
      const mSym = sig.movingSym;
      const tNow = state.t;
      const tauNow = state.tauSweep;
      const degNow = Math.round((state.flipAngle / Math.PI) * 180);
      const yNow = sig.conv(tNow);

      const [fA, fB] = sig.supportFixed;
      const [mA, mB] = sig.supportMoving;
      const fAStr = Number.isFinite(fA) ? String(fA) : '-\\\\infty';
      const fBStr = Number.isFinite(fB) ? String(fB) : '+\\\\infty';
      const mAStr = Number.isFinite(mA) ? String(mA) : '-\\\\infty';
      const mBStr = Number.isFinite(mB) ? String(mB) : '+\\\\infty';

      if (state.step === 1) {
        const valF = sig.fnFixed(tauNow);
        const valM = sig.fnMoving(tauNow);
        return [
          {
            label: isEn ? '1.1 Definition of Convolution Integral:' : '1.1 Definição da Integral de Convolução:',
            latex: \`y(t) = \${fSym}(t) \\\\ast \${mSym}(t) = \\\\int_{-\\\\infty}^{+\\\\infty} \${fSym}(\\\\tau)\\\\,\${mSym}(t-\\\\tau)\\\\,d\\\\tau\`
          },
          {
            label: isEn ? '1.2 Change of Independent Variable (t → τ):' : '1.2 Mudança de Variável Independente (t → τ):',
            latex: \`\${fSym}(\\\\tau) = \${sig.fixedLatexTau}, \\\\quad \\\\tau \\\\in [\${fAStr},\\\\, \${fBStr}]\`
          },
          {
            label: isEn ? '1.3 Moving Kernel Preparation in τ:' : '1.3 Segundo Sinal no Domínio Auxiliar τ:',
            latex: \`\${mSym}(\\\\tau) = \${sig.movingLatexTau}, \\\\quad \\\\tau \\\\in [\${mAStr},\\\\, \${mBStr}]\`
          },
          {
            label: isEn ? \`1.4 Instantaneous Sweep Point at τ = \${tauNow.toFixed(2)}:\` : \`1.4 Amostragem Instantânea em τ = \${tauNow.toFixed(2)}:\`,
            latex: \`\${fSym}(\${tauNow.toFixed(2)}) = \${valF.toFixed(3)}, \\\\quad \${mSym}(\${tauNow.toFixed(2)}) = \${valM.toFixed(3)}\`
          }
        ];
      }

      if (state.step === 2) {
        const negA = Number.isFinite(mB) ? String(-mB) : '-\\\\infty';
        const negB = Number.isFinite(mA) ? String(-mA) : '+\\\\infty';
        return [
          {
            label: isEn ? '2.1 Time-Inversion Choice for Moving Signal:' : '2.1 Escolha do Sinal que Sofre Reflexão Temporal:',
            latex: isEn
              ? \`\\\\text{Keep } \${fSym}(\\\\tau) \\\\text{ fixed and mirror } \${mSym}(\\\\tau) \\\\to \${mSym}(-\\\\tau)\`
              : \`\\\\text{Mantemos } \${fSym}(\\\\tau) \\\\text{ fixo e espelhamos } \${mSym}(\\\\tau) \\\\to \${mSym}(-\\\\tau)\`
          },
          {
            label: isEn ? '2.2 Algebraic Substitution (τ → -τ):' : '2.2 Substituição Algébrica (τ → -τ):',
            latex: \`\${mSym}(-\\\\tau) = \${sig.movingLatexNegTau}\`
          },
          {
            label: isEn ? '2.3 Inversion of Boundary Inequality:' : '2.3 Inversão dos Limites da Desigualdade:',
            latex: \`\${mAStr} \\\\le -\\\\tau \\\\le \${mBStr} \\\\iff \${negA} \\\\le \\\\tau \\\\le \${negB}\`
          },
          {
            label: isEn ? '2.4 3D Spatial Rotation Phase (τ = 0):' : '2.4 Rotação Espacial no Eixo Vertical (τ = 0):',
            latex: \`\\\\theta_{\\\\text{giro}} = \${degNow}^\\\\circ \\\\; (\${(state.flipAngle / Math.PI).toFixed(2)}\\\\pi\\\\text{ rad})\`
          }
        ];
      }

      if (state.step === 3) {
        const bLeft = Number.isFinite(mB) ? (tNow - mB).toFixed(2) : '-\\\\infty';
        const bRight = Number.isFinite(mA) ? (tNow - mA).toFixed(2) : '+\\\\infty';
        const symLeft = Number.isFinite(mB) ? (mB === 0 ? 't' : \`\${-mB}+t\`) : '-\\\\infty';
        const symRight = Number.isFinite(mA) ? (mA === 0 ? 't' : \`\${-mA}+t\`) : '+\\\\infty';
        return [
          {
            label: isEn ? '3.1 Time-Shift by Parameter t:' : '3.1 Deslocamento Temporal por t segundos:',
            latex: \`\${mSym}(-\\\\tau) \\\\xrightarrow{\\\\text{\${isEn ? 'shift ' : 'desloca '}} t} \${mSym}(t-\\\\tau) = \${sig.movingLatexShifted}\`
          },
          {
            label: isEn ? '3.2 Mobile Parameterized Boundaries in τ:' : '3.2 Dedução dos Limites Móveis em Função de t:',
            latex: \`\${mAStr} \\\\le t - \\\\tau \\\\le \${mBStr} \\\\iff \${symLeft} \\\\le \\\\tau \\\\le \${symRight}\`
          },
          {
            label: isEn ? \`3.3 Current Numerical Edge Positions (for t = \${tNow.toFixed(2)}):\` : \`3.3 Posição Numérica Atual das Bordas (para t = \${tNow.toFixed(2)}):\`,
            latex: \`\\\\tau_{\\\\text{inf}} = \${symLeft} = \${bLeft}, \\\\quad \\\\tau_{\\\\text{sup}} = \${symRight} = \${bRight}\`
          }
        ];
      }

      // Step 4
      const lowNum = Math.max(Number.isFinite(fA) ? fA : -99, Number.isFinite(mB) ? tNow - mB : -99);
      const highNum = Math.min(Number.isFinite(fB) ? fB : 99, Number.isFinite(mA) ? tNow - mA : 99);
      const hasOverlap = highNum > lowNum;

      const lowStr = hasOverlap ? lowNum.toFixed(2) : (isEn ? '\\\\text{no overlap}' : '\\\\text{sem sobreposição}');
      const highStr = hasOverlap ? highNum.toFixed(2) : '-';

      const activeRegion =
        (sig.regions || []).find((r) => r.test(tNow)) ||
        (sig.regions && sig.regions[0]) || { range: 't \\\\in \\\\mathbb{R}', latex: 'y(t) = (x\\\\ast h)(t)' };

      return [
        {
          label: isEn ? \`4.1 Active Interval for t = \${tNow.toFixed(2)}:\` : \`4.1 Intervalo Ativo para t = \${tNow.toFixed(2)}:\`,
          latex: \`\\\\text{\${isEn ? 'Current region: ' : 'Região atual: '}} \${activeRegion.range}\`
        },
        {
          label: isEn ? '4.2 Integration Limits of Non-Zero Product in τ:' : '4.2 Limites de Integração da Interseção em τ:',
          latex: hasOverlap
            ? \`y(\${tNow.toFixed(2)}) = \\\\int_{\${lowStr}}^{\${highStr}} \${fSym}(\\\\tau)\\\\,\${mSym}(\${tNow.toFixed(2)}-\\\\tau)\\\\,d\\\\tau\`
            : (isEn ? \`\\\\text{Empty intersection } (\\\\emptyset) \\\\implies y(\${tNow.toFixed(2)}) = 0\` : \`\\\\text{Interseção vazia } (\\\\emptyset) \\\\implies y(\${tNow.toFixed(2)}) = 0\`)
        },
        {
          label: isEn ? '4.3 Analytical Closed-Form Expression in Interval:' : '4.3 Expressão Analítica Resolvida no Intervalo:',
          latex: \`\${activeRegion.latex}\`
        },
        {
          label: isEn ? '4.4 Numerical Evaluation of Shaded Area:' : '4.4 Avaliação Numérica da Área Sombreada:',
          latex: \`\\\\implies y(\${tNow.toFixed(2)}) = \${yNow.toFixed(4)}\`
        }
      ];
    }`;

replaceBetween(
  'function buildNotebookLinesForStep(sig) {',
  'function updateNotebookUI(animateHandwriting = false) {',
  nbLinesCode + '\n\n    function updateNotebookUI(animateHandwriting = false) {',
  'buildNotebookLinesForStep and Fourier notebook lines'
);

// 21. Live metrics bar in updateNotebookUI
const metricsCode = `      // 1. Barra de Métricas Instantâneas
      const metricsEl = document.getElementById('live-step-metrics');
      const isEn = state.lang === 'en';
      const dict = I18N[state.lang] || I18N.en;

      if (metricsEl) {
        if (state.activeModule === 'fourier') {
          const calc = state.fourierCalculated || calculateFourierData();
          if (state.step === 1) {
            metricsEl.innerHTML = \`
              <span class="font-semibold text-sec">\${dict.fundFreq}</span>
              <span>\${latexToHtml(\`\\\\omega_0 = \${calc.w0.toFixed(3)}\\\\text{ rad/s}, \\\\; f_0 = \${calc.f0.toFixed(2)}\\\\text{ Hz}, \\\\; a_0 = \${calc.a0.toFixed(3)}\`)}</span>
            \`;
          } else if (state.step === 2) {
            metricsEl.innerHTML = \`
              <span class="font-semibold text-sec">\${dict.symmClass}</span>
              <span>\${latexToHtml(calc.symmetryType === 'even' ? '\\\\text{Par (Even)}: b_n=0' : calc.symmetryType === 'odd' ? '\\\\text{Ímpar (Odd)}: a_n=0, a_0=0' : '\\\\text{Geral (General)}') }</span>
            \`;
          } else if (state.step === 3) {
            metricsEl.innerHTML = \`
              <span class="font-semibold text-sec">\${dict.activeHarm}</span>
              <span>\${latexToHtml(\`N = \${calc.harmonics.length}, \\\\; P_{\\\\text{total}} = \${calc.parsevalPower.toFixed(3)}\\\\text{ W}\`)}</span>
            \`;
          } else {
            metricsEl.innerHTML = \`
              <span class="font-semibold text-sec">\${dict.approxAtT}</span>
              <span>\${latexToHtml(\`t = \${tNow.toFixed(2)} \\\\implies S_N(\${tNow.toFixed(2)}) = \${calc.reconstruct(tNow).toFixed(4)}, \\\\; \\\\text{MSE} = \${calc.mse.toFixed(4)}\`)}</span>
            \`;
          }
        } else {
          if (state.step === 1) {
            const tauNow = state.tauSweep;
            metricsEl.innerHTML = \`
              <span class="font-semibold text-sec">\${dict.sampleTau}</span>
              <span>\${latexToHtml(\`\\\\tau = \${tauNow.toFixed(2)} \\\\implies \${sig.fixedSym}(\\\\tau)=\${sig.fnFixed(tauNow).toFixed(2)},\\\\; \${sig.movingSym}(\\\\tau)=\${sig.fnMoving(tauNow).toFixed(2)}\`)}</span>
            \`;
          } else if (state.step === 2) {
            const deg = Math.round((state.flipAngle / Math.PI) * 180);
            metricsEl.innerHTML = \`
              <span class="font-semibold text-sec">\${dict.reflection}</span>
              <span>\${latexToHtml(\`\\\\theta = \${deg}^\\\\circ \\\\implies \${sig.movingSym}(\\\\tau) \\\\to \${sig.movingSym}(-\\\\tau)\`)}</span>
            \`;
          } else {
            metricsEl.innerHTML = \`
              <span class="font-semibold text-sec">\${dict.currentParam}</span>
              <span>\${latexToHtml(\`t = \${tNow.toFixed(2)} \\\\implies y(\${tNow.toFixed(2)}) = \${yNow.toFixed(4)}\`)}</span>
            \`;
          }
        }
      }

      // 2. Linhas Manuscritas do Caderno`;

replaceBetween(
  '// 1. Barra de Métricas Instantâneas',
  '// 2. Linhas Manuscritas do Caderno',
  metricsCode,
  'Live metrics bar bilingual'
);

// 22. renderPresetGallery bilingual for both modules
const galleryCode = `    function renderPresetGallery() {
      const gallery = document.getElementById('preset-gallery');
      if (!gallery) return;
      gallery.innerHTML = '';
      const isEn = state.lang === 'en';

      if (state.activeModule === 'fourier') {
        const allFourier = [
          ...Object.values(FOURIER_PRESETS),
          ...(state.fourierCustomPresets || []).map((cp) => ({ ...cp, isCustom: true }))
        ];
        allFourier.forEach((p) => {
          const isActive = state.fourierPresetKey === p.id;
          const card = document.createElement('div');
          card.className = \`preset-pill rounded-lg p-2 cursor-pointer flex flex-col justify-between gap-1 relative \${
            isActive ? 'active' : ''
          }\`;
          const pTitle = isEn ? (p.titleEn || p.title) : p.title;
          const pSub = isEn ? (p.subtitleEn || p.subtitle) : p.subtitle;
          card.innerHTML = \`
            <div class="flex items-center justify-between gap-1">
              <span class="text-[11px] font-bold truncate text-primary">\${pTitle}</span>
              <div class="flex items-center gap-1">
                <span class="text-[9px] font-mono-code text-accent font-semibold">T₀ = \${p.T0}</span>
                \${
                  p.isCustom
                    ? \`<button type="button" class="del-preset text-[10px] px-1 rounded hover:bg-red-500/20 text-rose-400" title="\\\${isEn ? 'Remove' : 'Remover'}">✕</button>\`
                    : ''
                }
              </div>
            </div>
            <div class="text-[10px] text-mut truncate">\${pSub}</div>
            <div class="preset-math text-[10px] pt-0.5 truncate"></div>
          \`;
          const mathPreview = card.querySelector('.preset-math');
          if (mathPreview && p.expr) {
            renderMath(mathPreview, \`f(t) = \${exprToLatex(p.expr, 't')}\`, false);
          }
          card.addEventListener('click', (e) => {
            if (e.target.closest('.del-preset')) return;
            state.fourierPresetKey = p.id;
            state.fourierExpr = p.expr;
            state.fourierT0 = p.T0;
            state.fourierN = p.N;
            calculateFourierData();
            syncInputsWithPreset();
            renderPresetGallery();
            updateNotebookUI(true);
            updateScene3D();
          });
          const delBtn = card.querySelector('.del-preset');
          if (delBtn) {
            delBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              state.fourierCustomPresets = (state.fourierCustomPresets || []).filter((item) => item.id !== p.id);
              try {
                localStorage.setItem('fourier3d_custom_presets_v1', JSON.stringify(state.fourierCustomPresets));
              } catch (err) {}
              if (state.fourierPresetKey === p.id) {
                state.fourierPresetKey = 'square';
                state.fourierExpr = FOURIER_PRESETS.square.expr;
                state.fourierT0 = FOURIER_PRESETS.square.T0;
                state.fourierN = FOURIER_PRESETS.square.N;
                calculateFourierData();
                syncInputsWithPreset();
              }
              renderPresetGallery();
              updateNotebookUI(true);
              updateScene3D();
            });
          }
          gallery.appendChild(card);
        });
        return;
      }

      const allPresets = [
        ...Object.values(BUILTIN_PRESETS),
        ...state.customPresets.map((cp) => ({ ...cp, isCustom: true }))
      ];

      allPresets.forEach((p) => {
        const card = document.createElement('div');
        const isActive = state.presetKey === p.id;
        card.className = \`preset-pill rounded-lg p-2 cursor-pointer flex flex-col justify-between gap-1 relative \${
          isActive ? 'active' : ''
        }\`;

        const bTitle = isEn ? (p.shortTitleEn || p.shortTitle) : p.shortTitle;
        const bSub = isEn ? (p.subtitleEn || p.subtitle) : (p.subtitle || '');

        card.innerHTML = \`
          <div class="flex items-center justify-between gap-1">
            <span class="text-[11px] font-bold truncate">\${bTitle}</span>
            \${
              p.isCustom
                ? \`<button type="button" class="del-preset text-[10px] px-1 rounded hover:bg-red-500/20 text-rose-400" title="\${isEn ? 'Remove' : 'Remover'}">✕</button>\`
                : ''
            }
          </div>
          <div class="text-[10px] text-mut truncate">\${bSub}</div>
          <div class="preset-math text-[10px] pt-0.5 truncate"></div>
        \`;

        const mathPreview = card.querySelector('.preset-math');
        renderMath(mathPreview, \`x=\${p.latexX || exprToLatex(p.exprX)},\\\\; h=\${p.latexH || exprToLatex(p.exprH)}\`, false);

        card.addEventListener('click', (e) => {
          if (e.target.closest('.del-preset')) return;
          state.presetKey = p.id;
          state.exprX = p.exprX;
          state.exprH = p.exprH;
          syncInputsWithPreset();
          renderPresetGallery();
          updateNotebookUI(true);
        });

        const delBtn = card.querySelector('.del-preset');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.customPresets = state.customPresets.filter((item) => item.id !== p.id);
            try {
              localStorage.setItem('conv3d_custom_presets_v2', JSON.stringify(state.customPresets));
            } catch (err) {}
            if (state.presetKey === p.id) {
              state.presetKey = 'ex8';
              state.exprX = BUILTIN_PRESETS.ex8.exprX;
              state.exprH = BUILTIN_PRESETS.ex8.exprH;
              syncInputsWithPreset();
            }
            renderPresetGallery();
          });
        }

        gallery.appendChild(card);
      });
    }
`;

replaceBetween(
  'function renderPresetGallery() {',
  'function syncInputsWithPreset() {',
  galleryCode + '\n    function syncInputsWithPreset() {',
  'renderPresetGallery bilingual'
);

// 23. updateScene3D delegate to Fourier & 3D labels bilingual
replaceExact(
  '    function updateScene3D() {\n      if (!ctx3d || !stageCanvas) return;\n      const sig = getEffectiveSignals();',
  `    function updateScene3D() {
      if (!ctx3d || !stageCanvas) return;
      if (state.activeModule === 'fourier') {
        renderFourierScene3D();
        return;
      }
      const sig = getEffectiveSignals();`,
  'updateScene3D delegate to Fourier'
);

replaceBetween(
  'let lastLabelSignature = \'\';\n    function updateFloatingLabels3D(sig, effectiveT, yNow, WALL_X) {\n      const fSym = sig.fixedSym;\n      const mSym = sig.movingSym;\n      const movArg = state.step === 1 ? \'\\\\tau\' : state.step === 2 ? \'-\\\\tau\' : \'t-\\\\tau\';\n      const sigKey = `${fSym}_${mSym}_${movArg}_${state.step}`;',
  'const placeLabel = (id, x, y, z, visible = true) => {',
  `let lastLabelSignature = '';
    let lastLangSig = '';
    function updateFloatingLabels3D(sig, effectiveT, yNow, WALL_X) {
      const fSym = sig.fixedSym;
      const mSym = sig.movingSym;
      const movArg = state.step === 1 ? '\\\\tau' : state.step === 2 ? '-\\\\tau' : 't-\\\\tau';
      const sigKey = \`\${fSym}_\${mSym}_\${movArg}_\${state.step}\`;

      if (sigKey !== lastLabelSignature || state.lang !== lastLangSig) {
        lastLabelSignature = sigKey;
        lastLangSig = state.lang;
        const isEn = state.lang === 'en';
        renderMath(document.getElementById('lbl-tau'), isEn ? '\\\\text{Axis } \\\\tau' : '\\\\text{Eixo } \\\\tau', false);
        renderMath(document.getElementById('lbl-t'), isEn ? '\\\\text{Time } t' : '\\\\text{Tempo } t', false);
        renderMath(document.getElementById('lbl-z'), '\\\\text{Amplitude}', false);
        renderMath(document.getElementById('lbl-x1'), \`\${fSym}(\\\\tau)\`, false);
        renderMath(document.getElementById('lbl-x2'), \`\${mSym}(\${movArg})\`, false);
        renderMath(document.getElementById('lbl-conv'), \`y(t) = (\${fSym}\\\\ast \${mSym})(t)\`, false);
        document.getElementById('leg-fixed').textContent = \`\${fSym}(τ) \${isEn ? 'Fixed' : 'Fixo'}\`;
        document.getElementById('leg-moving').textContent = \`\${mSym}(\${state.step === 1 ? 'τ' : state.step === 2 ? '-τ' : 't-τ'})\`;
      }

      const placeLabel = (id, x, y, z, visible = true) => {`,
  'updateFloatingLabels3D bilingual'
);

replaceBetween(
  '// Atualiza Pílula Instantânea no Palco 3D\n      const livePill = document.getElementById(\'stage-live-pill\');',
  'renderMath(livePill, `y(${effectiveT.toFixed(2)}) = ${yNow.toFixed(4)}`, false);\n      }',
  `// Atualiza Pílula Instantânea no Palco 3D
      const livePill = document.getElementById('stage-live-pill');
      const isEn = state.lang === 'en';
      if (state.step === 1) {
        renderMath(livePill, \`\${isEn ? '\\\\text{Step 1 } (t \\\\to \\\\tau)' : '\\\\text{Passo 1 } (t \\\\to \\\\tau)'}: \\\\quad \\\\tau = \${state.tauSweep.toFixed(2)}\`, false);
      } else if (state.step === 2) {
        const deg = Math.round((state.flipAngle / Math.PI) * 180);
        renderMath(livePill, \`\${isEn ? '\\\\text{Step 2 (Reflection)}' : '\\\\text{Passo 2 (Reflexão)}'}: \\\\quad \\\\theta = \${deg}^\\\\circ\`, false);
      } else if (state.step === 3) {
        renderMath(livePill, \`\${isEn ? '\\\\text{Step 3 (Shift)}' : '\\\\text{Passo 3 (Deslocamento)}'}: \\\\quad t = \${effectiveT.toFixed(2)}\`, false);
      } else {
        renderMath(livePill, \`y(\${effectiveT.toFixed(2)}) = \${yNow.toFixed(4)}\`, false);
      }`,
  'Live pill bilingual'
);

// 24. Render Fourier Scene 3D
const fourierRendererCode = `
    function renderFourierScene3D() {
      if (!ctx3d || !stageCanvas) return;
      const isEn = state.lang === 'en';
      const calc = state.fourierCalculated || calculateFourierData();
      const pal = getThemePalette();

      const w = canvasContainer.clientWidth || 384;
      const h = canvasContainer.clientHeight || 260;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (stageCanvas.width !== Math.floor(w * dpr) || stageCanvas.height !== Math.floor(h * dpr)) {
        stageCanvas.width = Math.floor(w * dpr);
        stageCanvas.height = Math.floor(h * dpr);
      }

      updateCameraFromOrbit();

      ctx3d.save();
      ctx3d.scale(dpr, dpr);
      ctx3d.fillStyle = pal.bgCss;
      ctx3d.fillRect(0, 0, w, h);

      const T0 = calc.T0;
      const tNow = state.t;
      const strokeScale = state.thickLines || state.theme === 'projector' ? 1.55 : 1.0;
      const cycles = state.waterfallCycles || 2;

      const T_MIN = -T0 * (cycles * 0.5);
      const T_MAX = T0 * (cycles * 0.5);
      const AMP_MAX = 1.35;
      const N_HARM = calc.harmonics.length;
      const Z_MAX = Math.max(4.0, N_HARM * 0.5);

      draw3DPolygon(
        [
          { x: T_MIN, y: 0, z: Z_MAX },
          { x: T_MAX, y: 0, z: Z_MAX },
          { x: T_MAX, y: AMP_MAX, z: Z_MAX },
          { x: T_MIN, y: AMP_MAX, z: Z_MAX }
        ],
        pal.wallFill,
        pal.wallBorder,
        1
      );

      for (let tv = Math.ceil(T_MIN); tv <= Math.floor(T_MAX); tv += 1) {
        draw3DLine(
          { x: tv, y: 0, z: 0 },
          { x: tv, y: 0, z: Z_MAX },
          tv === 0 ? pal.axis : pal.gridMain,
          tv === 0 ? 1.6 * strokeScale : 0.75
        );
      }

      const origPts = [];
      const steps = 180;
      for (let i = 0; i <= steps; i++) {
        const tv = T_MIN + (i / steps) * (T_MAX - T_MIN);
        const yVal = calc.fn(((tv % T0) + T0) % T0);
        origPts.push({ x: tv, y: yVal, z: 0 });
      }
      draw3DPolyline(origPts, pal.x1, 2.5 * strokeScale);

      const recPts = [];
      for (let i = 0; i <= steps; i++) {
        const tv = T_MIN + (i / steps) * (T_MAX - T_MIN);
        const yVal = calc.reconstruct(tv);
        recPts.push({ x: tv, y: yVal, z: 0.1 });
      }
      draw3DPolyline(recPts, pal.conv, 2.8 * strokeScale);

      calc.harmonics.forEach((hItem, idx) => {
        const zPos = (idx + 1) * 0.45;
        const harmPts = [];
        for (let i = 0; i <= steps; i++) {
          const tv = T_MIN + (i / steps) * (T_MAX - T_MIN);
          const yVal = hItem.an * Math.cos(hItem.nw0 * tv) + hItem.bn * Math.sin(hItem.nw0 * tv);
          harmPts.push({ x: tv, y: yVal, z: zPos });
        }
        draw3DPolyline(harmPts, pal.prod, 1.4 * strokeScale, [], false);
      });

      // Cursor indicator at tNow
      const recNow = calc.reconstruct(tNow);
      draw3DLine(
        { x: tNow, y: 0, z: 0.1 },
        { x: tNow, y: recNow, z: 0.1 },
        pal.conv,
        1.5 * strokeScale
      );
      const ptRec = projectPoint3D(tNow, recNow, 0.1);
      if (ptRec) {
        ctx3d.fillStyle = pal.conv;
        ctx3d.beginPath();
        ctx3d.arc(ptRec.x, ptRec.y, 4.5 * strokeScale, 0, Math.PI * 2);
        ctx3d.fill();
        ctx3d.strokeStyle = '#ffffff';
        ctx3d.lineWidth = 1.5;
        ctx3d.stroke();
      }

      if (state.showWaterfall) {
        for (let idx = 0; idx < calc.harmonics.length - 1; idx++) {
          const z1 = (idx + 1) * 0.45;
          const z2 = (idx + 2) * 0.45;
          const h1 = calc.harmonics[idx];
          const h2 = calc.harmonics[idx + 1];
          for (let i = 0; i < steps; i += 6) {
            const t1 = T_MIN + (i / steps) * (T_MAX - T_MIN);
            const t2 = T_MIN + ((i + 6) / steps) * (T_MAX - T_MIN);
            const y11 = h1.an * Math.cos(h1.nw0 * t1) + h1.bn * Math.sin(h1.nw0 * t1);
            const y12 = h1.an * Math.cos(h1.nw0 * t2) + h1.bn * Math.sin(h1.nw0 * t2);
            const y21 = h2.an * Math.cos(h2.nw0 * t1) + h2.bn * Math.sin(h2.nw0 * t1);
            const y22 = h2.an * Math.cos(h2.nw0 * t2) + h2.bn * Math.sin(h2.nw0 * t2);
            draw3DPolygon(
              [
                { x: t1, y: y11, z: z1 },
                { x: t2, y: y12, z: z1 },
                { x: t2, y: y22, z: z2 },
                { x: t1, y: y21, z: z2 }
              ],
              pal.waterfallFill || 'rgba(56, 189, 248, 0.12)',
              null
            );
          }
        }
      }

      ctx3d.restore();

      const placeLabel = (id, x, y, z, visible = true) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!visible) {
          el.style.opacity = '0';
          return;
        }
        const pt = projectPoint3D(x, y, z);
        const wBox = canvasContainer.clientWidth || 384;
        const hBox = canvasContainer.clientHeight || 260;
        if (!pt || pt.x < 15 || pt.x > wBox - 15 || pt.y < 15 || pt.y > hBox - 15) {
          el.style.opacity = '0';
          return;
        }
        el.style.opacity = '1';
        el.style.left = \`\${pt.x}px\`;
        el.style.top = \`\${pt.y}px\`;
      };

      renderMath(document.getElementById('lbl-tau'), isEn ? '\\\\text{Time } t' : '\\\\text{Tempo } t', false);
      renderMath(document.getElementById('lbl-t'), isEn ? '\\\\text{Harmonics } (n\\\\omega_0)' : '\\\\text{Harmônicas } (n\\\\omega_0)', false);
      renderMath(document.getElementById('lbl-z'), '\\\\text{Amplitude}', false);
      renderMath(document.getElementById('lbl-x1'), 'f(t)', false);
      renderMath(document.getElementById('lbl-x2'), \`S_{\${calc.harmonics.length}}(t)\`, false);
      renderMath(document.getElementById('lbl-conv'), \`S_N(t) \\\\approx f(t)\`, false);

      document.getElementById('leg-fixed').textContent = isEn ? 'f(t) Periodic' : 'f(t) Periódica';
      document.getElementById('leg-moving').textContent = \`S_{\${calc.harmonics.length}}(t) \${isEn ? 'Reconstruction' : 'Reconstrução'}\`;

      placeLabel('lbl-tau', 1.8, -0.22, 0, true);
      placeLabel('lbl-t', 0.0, -0.2, Z_MAX * 0.7, true);
      placeLabel('lbl-z', -2.5, 1.45, 0, true);
      placeLabel('lbl-x1', 0.5, calc.fn(0.5) + 0.25, 0, true);
      placeLabel('lbl-x2', tNow, calc.reconstruct(tNow) + 0.25, 0.1, true);
      placeLabel('lbl-conv', -1.2, calc.reconstruct(-1.2) + 0.25, 0.1, true);
      placeLabel('lbl-b1', 0, 0, 0, false);
      placeLabel('lbl-b2', 0, 0, 0, false);

      const livePill = document.getElementById('stage-live-pill');
      if (livePill) {
        if (state.step === 1) {
          renderMath(livePill, \`\${isEn ? '\\\\text{Step 1: } T_0' : '\\\\text{Passo 1: } T_0'} = \${T0.toFixed(2)}\\\\text{ s}, \\\\; \\\\omega_0 = \${calc.w0.toFixed(2)}\\\\text{ rad/s}\`, false);
        } else if (state.step === 2) {
          renderMath(livePill, \`\${isEn ? '\\\\text{Step 2: }' : '\\\\text{Passo 2: }'} \${calc.symmetryType === 'even' ? (isEn ? 'Even Parity' : 'Simetria Par') : calc.symmetryType === 'odd' ? (isEn ? 'Odd Parity' : 'Simetria Ímpar') : (isEn ? 'No Parity' : 'Sem Simetria')}\`, false);
        } else if (state.step === 3) {
          renderMath(livePill, \`\${isEn ? '\\\\text{Step 3: } N' : '\\\\text{Passo 3: } N'} = \${calc.harmonics.length}\\\\text{ harmonics}\`, false);
        } else {
          renderMath(livePill, \`S_N(\${tNow.toFixed(2)}) = \${calc.reconstruct(tNow).toFixed(4)}, \\\\; \\\\text{MSE}=\${calc.mse.toFixed(4)}\`, false);
        }
      }
    }
`;

replaceExact(
  '    function initPointerOrbitControls() {',
  fourierRendererCode + '\n    function initPointerOrbitControls() {',
  'renderFourierScene3D injection'
);

replaceBetween(
  'function setActiveMathField(field) {',
  'setTimeout(handleResize, 220);\n    }',
  `function setActiveMathField(field) {
      state.activeMathField = field;
      const boxX = document.getElementById('mf-box-x');
      const boxH = document.getElementById('mf-box-h');
      const boxF = document.getElementById('mf-box-fourier');
      const caretX = document.getElementById('mf-caret-x');
      const caretH = document.getElementById('mf-caret-h');
      const caretF = document.getElementById('mf-caret-fourier');
      const mkb = document.getElementById('math-keyboard');

      if (boxX) boxX.classList.toggle('focused', field === 'x');
      if (boxH) boxH.classList.toggle('focused-h', field === 'h');
      if (boxF) boxF.classList.toggle('focused', field === 'fourier');
      if (caretX) caretX.classList.toggle('hidden', field !== 'x');
      if (caretH) caretH.classList.toggle('hidden', field !== 'h');
      if (caretF) caretF.classList.toggle('hidden', field !== 'fourier');
      if (mkb) mkb.classList.toggle('hidden', !field);
      document.body.classList.toggle('mkb-open', Boolean(field));
      setTimeout(handleResize, 220);
    }`,
  'setActiveMathField Fourier support'
);

replaceBetween(
  'function mutateActiveExpr(mutatorFn) {',
  'updateNotebookUI(false);\n    }',
  `function mutateActiveExpr(mutatorFn) {
      if (!state.activeMathField) {
        setActiveMathField(state.activeModule === 'fourier' ? 'fourier' : 'x');
      }
      if (state.activeMathField === 'fourier') {
        state.fourierExpr = mutatorFn(state.fourierExpr || '');
        state.fourierPresetKey = 'custom';
        calculateFourierData();
        syncInputsWithPreset();
        renderPresetGallery();
        updateNotebookUI(false);
        updateScene3D();
        return;
      }
      const current = state.activeMathField === 'x' ? state.exprX : state.exprH;
      const next = mutatorFn(current || '');
      if (state.activeMathField === 'x') {
        state.exprX = next;
      } else {
        state.exprH = next;
      }
      state.presetKey = 'custom_live';
      syncInputsWithPreset();
      renderPresetGallery();
      updateNotebookUI(false);
      updateScene3D();
    }`,
  'mutateActiveExpr Fourier support'
);

// 26. syncInputsWithPreset
replaceBetween(
  'function syncInputsWithPreset() {',
  'if (rawH) rawH.textContent = state.exprH;\n    }',
  `function syncInputsWithPreset() {
      const isFourier = state.activeModule === 'fourier';
      if (isFourier) {
        const renderF = document.getElementById('mf-render-fourier');
        const rawF = document.getElementById('mf-raw-fourier');
        const t0Input = document.getElementById('fourier-t0-input');
        const w0Prev = document.getElementById('fourier-w0-preview');
        const calc = state.fourierCalculated || calculateFourierData();
        if (renderF) renderMath(renderF, exprToLatex(state.fourierExpr, 't'), false);
        if (rawF) rawF.textContent = state.fourierExpr;
        if (t0Input) t0Input.value = state.fourierT0;
        if (w0Prev) w0Prev.textContent = \`ω₀ = \${calc.w0.toFixed(2)} rad/s\`;
        const fSlider = document.getElementById('fourier-n-slider');
        const badge = document.getElementById('fourier-n-badge');
        if (fSlider) fSlider.value = state.fourierN;
        if (badge) badge.textContent = \`N = \${state.fourierN}\`;
        return;
      }
      renderMath(document.getElementById('mf-render-x'), exprToLatex(state.exprX, 't'), false);
      renderMath(document.getElementById('mf-render-h'), exprToLatex(state.exprH, 't'), false);
      const rawX = document.getElementById('mf-raw-x');
      const rawH = document.getElementById('mf-raw-h');
      if (rawX) rawX.textContent = state.exprX;
      if (rawH) rawH.textContent = state.exprH;
    }`,
  'syncInputsWithPreset Fourier support'
);


// 26b. Regions table Fourier and Convolution bilingual
replaceBetween(
  '// 3. Tabela de Intervalos Analíticos de t\n      const regContainer = document.getElementById(\'regions-table\');',
  'regContainer.appendChild(btn);\n        });\n      }\n    }',
  `// 3. Tabela de Intervalos Analíticos de t ou Espectro Harmônico Fourier
      const regContainer = document.getElementById('regions-table');
      if (regContainer) {
        regContainer.innerHTML = '';
        if (state.activeModule === 'fourier') {
          const calc = state.fourierCalculated || calculateFourierData();
          calc.harmonics.slice(0, 8).forEach((h) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = \`region-row w-full text-left px-2 py-1 rounded flex items-center justify-between gap-2 ui-control\`;
            btn.innerHTML = \`
              <span class="reg-range text-[10px] font-mono-code">n = \${h.n}</span>
              <span class="reg-expr text-[10px]"></span>
            \`;
            const thetaStr = (h.theta / Math.PI).toFixed(2);
            renderMath(btn.querySelector('.reg-expr'), \`C_{\${h.n}} = \${h.cn.toFixed(3)}, \\\\; \\\\theta_{\${h.n}} = \${thetaStr}\\\\pi\`, false);
            btn.addEventListener('click', () => {
              state.fourierN = h.n;
              const fSlider = document.getElementById('fourier-n-slider');
              if (fSlider) fSlider.value = h.n;
              const badge = document.getElementById('fourier-n-badge');
              if (badge) badge.textContent = \`N = \${h.n}\`;
              calculateFourierData();
              updateNotebookUI(false);
              updateScene3D();
            });
            regContainer.appendChild(btn);
          });
        } else {
          (sig.regions || []).forEach((reg) => {
            const isCurrent = state.step >= 3 && reg.test(tNow);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = \`region-row w-full text-left px-2 py-1 rounded flex items-center justify-between gap-2 ui-control \${
              isCurrent ? 'active font-semibold' : ''
            }\`;
            btn.innerHTML = \`
              <span class="reg-range"></span>
              <span class="reg-expr"></span>
            \`;
            renderMath(btn.querySelector('.reg-range'), reg.range, false);
            renderMath(btn.querySelector('.reg-expr'), reg.latex, false);
            btn.addEventListener('click', () => {
              state.isPlaying = false;
              updatePlayButtonUI();
              state.t = reg.sampleT;
              if (state.step < 3) setStep(4, false);
              document.getElementById('t-slider').value = state.t;
              updateSliderBadge();
              updateNotebookUI(false);
            });
            regContainer.appendChild(btn);
          });
        }
      }
    }`,
  'Regions table Fourier and Convolution bilingual'
);

// 26c. btn-save-custom bilingual
replaceBetween(
  "document.getElementById('btn-save-custom').addEventListener('click', () => {",
  'renderPresetGallery();\n      });',
  `document.getElementById('btn-save-custom').addEventListener('click', () => {
        const id = 'custom_' + Date.now();
        const isFourier = state.activeModule === 'fourier';
        if (isFourier) {
          if (!state.fourierCustomPresets) state.fourierCustomPresets = [];
          const count = state.fourierCustomPresets.length + 1;
          const newPreset = {
            id,
            title: \`\${I18N.pt.savedPreset}\${count}\`,
            titleEn: \`\${I18N.en.savedPreset}\${count}\`,
            subtitle: I18N.pt.customSignal,
            subtitleEn: I18N.en.customSignal,
            expr: state.fourierExpr,
            T0: state.fourierT0,
            N: state.fourierN,
            isCustom: true
          };
          state.fourierCustomPresets.push(newPreset);
          state.fourierPresetKey = id;
          try {
            localStorage.setItem('fourier3d_custom_presets_v1', JSON.stringify(state.fourierCustomPresets));
          } catch (err) {}
          renderPresetGallery();
        } else {
          const count = state.customPresets.length + 1;
          const newPreset = {
            id,
            shortTitle: \`\${I18N.pt.savedPreset}\${count}\`,
            shortTitleEn: \`\${I18N.en.savedPreset}\${count}\`,
            subtitle: I18N.pt.customSignal,
            subtitleEn: I18N.en.customSignal,
            exprX: state.exprX,
            exprH: state.exprH,
            latexX: exprToLatex(state.exprX, 't'),
            latexH: exprToLatex(state.exprH, 't'),
            isCustom: true
          };
          state.customPresets.push(newPreset);
          state.presetKey = id;
          try {
            localStorage.setItem('conv3d_custom_presets_v2', JSON.stringify(state.customPresets));
          } catch (err) {}
          renderPresetGallery();
        }
      });`,
  'btn-save-custom bilingual'
);

// 26d. setStep bilingual
replaceBetween(
  'function setStep(stepNum, restartAnim = true) {',
  'updateSliderBadge();\n      updateNotebookUI(true);\n    }',
  `function setStep(stepNum, restartAnim = true) {
      state.step = stepNum;
      const dict = I18N[state.lang] || I18N.en;
      document.querySelectorAll('.step-card').forEach((btn) => {
        btn.classList.toggle('active', Number(btn.getAttribute('data-step')) === stepNum);
      });

      const slider = document.getElementById('t-slider');
      const titleEl = document.getElementById('slider-param-title');

      camOrbit.autoOrient = true;
      if (state.activeModule === 'fourier') {
        if (titleEl) titleEl.textContent = dict.sliderEvalPoint;
        slider.min = '-4.0';
        slider.max = '4.0';
        slider.value = state.t;
      } else {
        if (stepNum === 1) {
          camOrbit.targetTheta = -0.48;
          camOrbit.targetPhi = 1.10;
          camOrbit.targetRadius = 12.6;
          if (titleEl) titleEl.textContent = dict.sliderSweep;
          slider.min = '-3.5';
          slider.max = '5.5';
          if (restartAnim) state.tauSweep = -3.0;
          slider.value = state.tauSweep;
        } else if (stepNum === 2) {
          camOrbit.targetTheta = -0.38;
          camOrbit.targetPhi = 0.96;
          camOrbit.targetRadius = 12.6;
          if (titleEl) titleEl.textContent = dict.sliderFlip;
          slider.min = '0';
          slider.max = '3.1416';
          if (restartAnim) {
            state.flipAngle = 0;
            step2PauseFrames = 0;
          }
          slider.value = state.flipAngle;
        } else if (stepNum === 3) {
          camOrbit.targetTheta = -0.56;
          camOrbit.targetPhi = 1.06;
          camOrbit.targetRadius = 13.0;
          if (titleEl) titleEl.textContent = dict.sliderShift3;
          slider.min = '-2.0';
          slider.max = '5.8';
          state.flipAngle = Math.PI;
          slider.value = state.t;
        } else {
          camOrbit.targetTheta = -0.62;
          camOrbit.targetPhi = 1.05;
          camOrbit.targetRadius = 13.2;
          if (titleEl) titleEl.textContent = dict.sliderShift4;
          slider.min = '-2.0';
          slider.max = '5.8';
          state.flipAngle = Math.PI;
          slider.value = state.t;
        }
      }

      updateSliderBadge();
      updateNotebookUI(true);
    }`,
  'setStep bilingual'
);

// 26e. updatePlayButtonUI bilingual
replaceBetween(
  'function updatePlayButtonUI() {',
  "document.getElementById('lbl-play').textContent = state.isPlaying ? 'Pausar' : 'Animar';\n    }",
  `function updatePlayButtonUI() {
      const dict = I18N[state.lang] || I18N.en;
      document.getElementById('icon-play').classList.toggle('hidden', state.isPlaying);
      document.getElementById('icon-pause').classList.toggle('hidden', !state.isPlaying);
      document.getElementById('lbl-play').textContent = state.isPlaying ? dict.btnPlayPause : dict.btnPlayPlay;
    }`,
  'updatePlayButtonUI bilingual'
);

// 27. Complete initUIEvents with applyTheme and all 17 controls
replaceBetween(
  'function initUIEvents() {',
  'window.addEventListener(\'resize\', handleResize);\n    }',
  `function applyTheme(th) {
      state.theme = th;
      document.body.classList.remove('theme-dark', 'theme-light', 'theme-projector');
      document.body.classList.add('theme-' + th);
      document.querySelectorAll('.theme-btn').forEach((b) => b.classList.toggle('active', b.getAttribute('data-theme') === th));
      rebuildSceneHelpers();
    }

    function initUIEvents() {
      // 1. Language Toggle
      const langToggle = document.getElementById('btn-lang-toggle');
      if (langToggle) {
        langToggle.addEventListener('click', () => {
          setLanguage(state.lang === 'en' ? 'pt' : 'en');
        });
      }

      // 2. Module Switcher Tabs
      const tabConv = document.getElementById('btn-tab-conv');
      const tabFourier = document.getElementById('btn-tab-fourier');
      if (tabConv) tabConv.addEventListener('click', () => switchModule('convolution'));
      if (tabFourier) tabFourier.addEventListener('click', () => switchModule('fourier'));

      // 3. Step Cards
      document.querySelectorAll('.step-card').forEach((btn) => {
        btn.addEventListener('click', () => {
          const s = Number(btn.getAttribute('data-step'));
          state.isPlaying = true;
          updatePlayButtonUI();
          setStep(s, true);
        });
      });

      // 4. Play / Pause Button
      document.getElementById('btn-play').addEventListener('click', () => {
        state.isPlaying = !state.isPlaying;
        updatePlayButtonUI();
      });

      // 5. Sequence Mode
      const seqBtn = document.getElementById('btn-seq-mode');
      if (seqBtn) {
        seqBtn.addEventListener('click', () => {
          state.seqMode = !state.seqMode;
          seqBtn.style.borderColor = state.seqMode ? 'var(--c-conv)' : '';
          seqBtn.style.backgroundColor = state.seqMode ? 'var(--accent-bg)' : '';
          if (state.seqMode) {
            state.isPlaying = true;
            updatePlayButtonUI();
            setStep(1, true);
          }
        });
      }

      // 6. Commutative Property (x * h <-> h * x)
      const commBtn = document.getElementById('btn-commute');
      if (commBtn) {
        commBtn.addEventListener('click', () => {
          state.isCommuted = !state.isCommuted;
          commBtn.style.borderColor = state.isCommuted ? 'var(--c-x1)' : '';
          updateNotebookUI(true);
        });
      }

      // 7. Time / Parameter Slider
      const slider = document.getElementById('t-slider');
      if (slider) {
        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          if (state.activeModule === 'fourier') {
            state.t = val;
          } else {
            if (state.step === 1) {
              state.tauSweep = val;
            } else if (state.step === 2) {
              state.flipAngle = val;
            } else {
              state.t = val;
            }
          }
          updateSliderBadge();
          updateNotebookUI(false);
          updateScene3D();
        });
      }

      // 8. Fourier N Harmonics Slider
      const fourierSlider = document.getElementById('fourier-n-slider');
      if (fourierSlider) {
        fourierSlider.addEventListener('input', (e) => {
          state.fourierN = parseInt(e.target.value, 10);
          const badge = document.getElementById('fourier-n-badge');
          if (badge) badge.textContent = \`N = \${state.fourierN}\`;
          calculateFourierData();
          updateNotebookUI(false);
          updateScene3D();
        });
      }

      // 9. Fourier T0 Input
      const fourierT0Input = document.getElementById('fourier-t0-input');
      if (fourierT0Input) {
        fourierT0Input.addEventListener('change', (e) => {
          state.fourierT0 = parseFloat(e.target.value) || 3.0;
          calculateFourierData();
          syncInputsWithPreset();
          updateNotebookUI(false);
          updateScene3D();
        });
      }

      // 10. Fourier Mathfield Focus
      const boxF = document.getElementById('mf-box-fourier');
      if (boxF) boxF.addEventListener('click', () => setActiveMathField('fourier'));

      // 11. Rewatch Step Button
      const rewatchBtn = document.getElementById('btn-rewatch-write');
      if (rewatchBtn) {
        rewatchBtn.addEventListener('click', () => {
          updateNotebookUI(true);
        });
      }

      // 12. Theme Switcher
      document.querySelectorAll('.theme-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          applyTheme(btn.getAttribute('data-theme'));
        });
      });

      // 13. Thick Lines
      const thickBtn = document.getElementById('btn-thick');
      if (thickBtn) {
        thickBtn.addEventListener('click', () => {
          state.thickLines = !state.thickLines;
          thickBtn.style.borderColor = state.thickLines ? 'var(--c-conv)' : '';
        });
      }

      // 14. Expand Stage on Mobile
      const expBtn = document.getElementById('btn-expand-stage');
      if (expBtn) {
        expBtn.addEventListener('click', () => {
          const expanded = document.body.classList.toggle('stage-expanded');
          document.getElementById('expand-stage-lbl').textContent = expanded ? '3D-' : '3D+';
          setTimeout(handleResize, 260);
        });
      }

      // 15. Waterfall Toggle & Window Duration
      const wfBtn = document.getElementById('btn-waterfall');
      const wfPeriodBtn = document.getElementById('btn-waterfall-period');
      if (wfBtn) {
        wfBtn.addEventListener('click', () => {
          state.showWaterfall = !state.showWaterfall;
          wfBtn.style.borderColor = state.showWaterfall ? 'var(--c-prod)' : 'var(--border-subtle)';
          wfBtn.style.opacity = state.showWaterfall ? '1' : '0.6';
          if (wfPeriodBtn) wfPeriodBtn.classList.toggle('hidden', state.activeModule !== 'fourier' || !state.showWaterfall);
          updateScene3D();
        });
      }
      if (wfPeriodBtn) {
        wfPeriodBtn.addEventListener('click', () => {
          state.waterfallCycles = (state.waterfallCycles || 2) + 1;
          if (state.waterfallCycles > 4) state.waterfallCycles = 1;
          const lblWf = document.getElementById('lbl-wf-period');
          if (lblWf) lblWf.textContent = \`\${state.waterfallCycles} T₀\`;
          updateScene3D();
        });
      }

      // 16. Reset 3D Camera
      const resetCamBtn = document.getElementById('btn-reset-cam');
      if (resetCamBtn) {
        resetCamBtn.addEventListener('click', () => {
          camOrbit.autoOrient = true;
          camOrbit.targetTheta = -0.62;
          camOrbit.targetPhi = 1.05;
          camOrbit.targetRadius = 13.2;
        });
      }

      // 17. Fullscreen Toggle
      const fsBtn = document.getElementById('btn-fullscreen');
      if (fsBtn) {
        fsBtn.addEventListener('click', () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        });
      }

      window.addEventListener('resize', handleResize);
    }`,
  'initUIEvents full replacement'
);

// 27b. animateLoop with Fourier support
replaceBetween(
  'if (state.isPlaying) {\n        const slider = document.getElementById(\'t-slider\');',
  'updateSliderBadge();\n        frameCounter++;\n        if (frameCounter % 4 === 0 && !handwritingTimer) {\n          updateNotebookUI(false);\n        }\n      }',
  `if (state.isPlaying) {
        const slider = document.getElementById('t-slider');

        if (state.activeModule === 'fourier') {
          const T0 = state.fourierT0 || 3.0;
          state.t += 0.022;
          if (state.t > T0 * 1.5) {
            state.t = -T0 * 1.5;
          }
          const badge = document.getElementById('t-readout-badge');
          if (badge) badge.textContent = \`t = \${state.t.toFixed(2)}\`;
          frameCounter++;
          if (frameCounter % 4 === 0 && !handwritingTimer) {
            updateNotebookUI(false);
          }
        } else {
          if (state.step === 1) {
            state.tauSweep += 0.038;
            if (state.tauSweep > 5.5) {
              if (state.seqMode) {
                setStep(2, true);
              } else {
                state.tauSweep = -3.2;
              }
            }
            slider.value = state.tauSweep;
          } else if (state.step === 2) {
            if (state.flipAngle < Math.PI) {
              const norm = state.flipAngle / Math.PI;
              const speed = 0.014 + 0.026 * Math.sin(Math.max(0.08, Math.min(0.92, norm)) * Math.PI);
              state.flipAngle = Math.min(Math.PI, state.flipAngle + speed);
            } else {
              step2PauseFrames++;
              if (step2PauseFrames > 42) {
                step2PauseFrames = 0;
                if (state.seqMode) {
                  state.t = -2.2;
                  setStep(3, true);
                } else {
                  state.flipAngle = 0;
                }
              }
            }
            slider.value = state.flipAngle;
          } else if (state.step === 3) {
            state.t += 0.024;
            if (state.t > 5.8) {
              if (state.seqMode) {
                state.t = -2.2;
                setStep(4, true);
              } else {
                state.t = -2.2;
              }
            }
            slider.value = state.t;
          } else if (state.step === 4) {
            state.t += 0.022;
            if (state.t > 5.8) {
              if (state.seqMode) {
                setStep(1, true);
              } else {
                state.t = -2.2;
              }
            }
            slider.value = state.t;
          }

          updateSliderBadge();
          frameCounter++;
          if (frameCounter % 4 === 0 && !handwritingTimer) {
            updateNotebookUI(false);
          }
        }
      }`,
  'animateLoop Fourier animation support'
);

// 28. window.onload
replaceBetween(
  'window.onload = function () {',
  'animateLoop();\n    };',
  `window.onload = function () {
      init3DStage();
      applyTheme(state.theme);
      setLanguage(state.lang);
      renderPresetGallery();
      syncInputsWithPreset();
      initMathKeyboard();
      initUIEvents();
      try {
        state.fourierCustomPresets = JSON.parse(localStorage.getItem('fourier3d_custom_presets_v1') || '[]');
      } catch (e) {}
      const initH = window.location.hash.replace('#', '');
      if (initH === 'fourier') {
        switchModule('fourier');
      } else {
        switchModule('convolution');
        setStep(4, false);
      }
      animateLoop();
    };`,
  'window.onload initialization'
);

console.log('--- MASTER BILINGUAL INDEX GENERATED SUCCESSFULLY ---');
fs.writeFileSync('index.html', src, 'utf8');
