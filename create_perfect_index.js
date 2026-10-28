const fs = require('fs');

let src = fs.readFileSync('c:/Users/joaod/Documents/2026/Sinais e Sistemas forma interativa/convolu_o_3d_interativa.html', 'utf8');

// 1. Initial body class: theme-projector
src = src.replace('<body class="theme-dark relative', '<body class="theme-projector relative');

// 2. Header title replacement: replace static title with interactive tab buttons (Convolution / Fourier)
const oldHeaderTitle = `<div class="w-2 h-5 rounded-full flex-shrink-0" style="background: var(--c-conv)"></div>
          <div class="truncate">
            <h1 class="text-xs sm:text-sm font-bold tracking-tight truncate">Convolução 3D Passo a Passo</h1>
          </div>`;

const newHeaderTitle = `<div id="header-accent-pip" class="w-2 h-5 rounded-full flex-shrink-0" style="background: var(--c-conv)"></div>
          <div class="truncate flex items-center gap-1.5">
            <button id="btn-tab-conv" type="button" class="text-xs sm:text-sm font-bold tracking-tight truncate cursor-pointer hover:opacity-80 transition-all">Convolução 3D</button>
            <span class="text-mut text-xs">/</span>
            <button id="btn-tab-fourier" type="button" class="text-xs sm:text-sm font-bold tracking-tight truncate text-mut cursor-pointer hover:text-primary transition-all">Fourier 3D</button>
          </div>`;

src = src.replace(oldHeaderTitle, newHeaderTitle);

// 3. Header buttons: add language button and make Projector default active
const oldHeaderButtons = `<div class="ui-card p-0.5 rounded-lg border flex items-center text-[10px]">
            <button type="button" data-theme="dark" class="theme-btn seg-btn active px-1.5 py-0.5 rounded-md">Escuro</button>
            <button type="button" data-theme="light" class="theme-btn seg-btn px-1.5 py-0.5 rounded-md">Claro</button>
            <button type="button" data-theme="projector" class="theme-btn seg-btn px-1.5 py-0.5 rounded-md" title="Alto Contraste para Projetores em Salas Iluminadas">Projetor</button>
          </div>`;

const newHeaderButtons = `<button id="btn-lang-toggle" type="button" title="Switch Language / Alternar Idioma" class="ui-control px-1.5 py-0.5 rounded-md border text-[10px] font-bold font-mono-code">
            <span id="lang-btn-text">PT-BR</span>
          </button>
          <div class="ui-card p-0.5 rounded-lg border flex items-center text-[10px]">
            <button type="button" data-theme="projector" class="theme-btn seg-btn active px-1.5 py-0.5 rounded-md" title="Alto Contraste para Projetores em Salas Iluminadas">Projetor</button>
            <button type="button" data-theme="dark" class="theme-btn seg-btn px-1.5 py-0.5 rounded-md">Escuro</button>
            <button type="button" data-theme="light" class="theme-btn seg-btn px-1.5 py-0.5 rounded-md">Claro</button>
          </div>`;

src = src.replace(oldHeaderButtons, newHeaderButtons);

// 4. In controls row: add Fourier controls (N-slider and T0-button) alongside conv-slider
const oldSliderRow = `<div class="flex-1 flex flex-col gap-0.5 min-w-0">
            <div class="flex items-center justify-between text-[10px]">
              <span id="slider-param-title" class="text-sec font-medium truncate">Deslocamento t</span>
              <span id="t-readout-badge" class="font-mono-code font-semibold">t = 1.50</span>
            </div>
            <input id="t-slider" type="range" min="-2.5" max="6.0" step="0.02" value="1.50" class="w-full" />
          </div>`;

const newSliderRow = `<div id="conv-slider-group" class="flex-1 flex flex-col gap-0.5 min-w-0">
            <div class="flex items-center justify-between text-[10px]">
              <span id="slider-param-title" class="text-sec font-medium truncate">Deslocamento t</span>
              <span id="t-readout-badge" class="font-mono-code font-semibold">t = 1.50</span>
            </div>
            <input id="t-slider" type="range" min="-2.5" max="6.0" step="0.02" value="1.50" class="w-full" />
          </div>
          <div id="fourier-slider-group" class="hidden flex-1 flex flex-col gap-0.5 min-w-0">
            <div class="flex items-center justify-between text-[10px]">
              <span id="fourier-slider-title" class="text-sec font-medium truncate">Harmônicos N</span>
              <span id="fourier-readout-badge" class="font-mono-code font-semibold">N = 10 (T₀=2.0)</span>
            </div>
            <input id="fourier-n-slider" type="range" min="1" max="30" step="1" value="10" class="w-full" />
          </div>
          <button id="btn-fourier-period" type="button" title="Alterar Período Fundamental T₀" class="hidden ui-control px-2 py-1 rounded-lg border text-[10px] font-semibold flex-shrink-0">
            T₀: 2.0
          </button>`;

src = src.replace(oldSliderRow, newSliderRow);

// 5. In inputs section: add Fourier MathField box
const oldInputsHtml = `<div class="grid grid-cols-1 gap-1.5">
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
          </div>`;

const newInputsHtml = `<div id="conv-inputs-group" class="grid grid-cols-1 gap-1.5">
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
          <div id="fourier-inputs-group" class="hidden grid grid-cols-1 gap-1.5">
            <div id="mf-box-fourier" class="mathfield-box rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto custom-scroll">
                <span class="text-xs font-bold flex-shrink-0" style="color: var(--c-x1)">f(t) =</span>
                <div id="mf-render-fourier" class="text-xs truncate"></div>
                <span id="mf-caret-fourier" class="mathfield-caret hidden"></span>
              </div>
              <span class="text-[10px] font-mono-code text-mut flex-shrink-0" id="mf-raw-fourier"></span>
            </div>
          </div>`;

src = src.replace(oldInputsHtml, newInputsHtml);

// 6. In Math Keyboard: add functions
const oldKeyRow = `<button type="button" data-insert="sin(pi*t)*(u(t)-u(t-1))" class="mkb-key" data-katex="\\sin(\\pi t)p"></button>`;
const newKeyRow = `<button type="button" data-insert="sin(pi*t)" class="mkb-key" data-katex="\\sin(\\pi t)"></button>
              <button type="button" data-insert="cos(pi*t)" class="mkb-key" data-katex="\\cos(\\pi t)"></button>
              <button type="button" data-insert="sign(sin(pi*t))" class="mkb-key mkb-fn" data-katex="\\mathrm{sgn}"></button>
              <button type="button" data-insert="abs(t)" class="mkb-key mkb-fn" data-katex="|t|"></button>`;

if (src.includes(oldKeyRow)) {
  src = src.replace(oldKeyRow, newKeyRow);
}

// 6b. Upgrade compileSignalExpr to support sign/sgn
const oldCompileExpr = `      const sinc = (v) => (Math.abs(v) < 1e-6 ? 1.0 : Math.sin(Math.PI * v) / (Math.PI * v));

      let jsExpr = clean
        .replace(/\\^/g, '**')
        .replace(/\\bpi\\b/gi, 'Math.PI')
        .replace(/\\be\\b/g, 'Math.E')
        .replace(/\\bsin\\s*\\(/g, 'Math.sin(')
        .replace(/\\bcos\\s*\\(/g, 'Math.cos(')
        .replace(/\\bexp\\s*\\(/g, 'Math.exp(')
        .replace(/\\bsqrt\\s*\\(/g, 'Math.sqrt(')
        .replace(/\\babs\\s*\\(/g, 'Math.abs(');

      try {
        const fn = new Function('t', 'u', 'r', 'rect', 'tri', 'sinc', \`"use strict"; return Number(\${jsExpr}) || 0;\`);
        fn(0.5, u, r, rect, tri, sinc);
        return (tVal) => {
          try {
            const val = fn(tVal, u, r, rect, tri, sinc);`;

const newCompileExpr = `      const sinc = (v) => (Math.abs(v) < 1e-6 ? 1.0 : Math.sin(Math.PI * v) / (Math.PI * v));
      const sign = (v) => (v > 0 ? 1.0 : (v < 0 ? -1.0 : 0.0));

      let jsExpr = clean
        .replace(/\\^/g, '**')
        .replace(/\\bpi\\b/gi, 'Math.PI')
        .replace(/\\be\\b/g, 'Math.E')
        .replace(/\\bsign\\s*\\(/g, 'sign(')
        .replace(/\\bsgn\\s*\\(/g, 'sign(')
        .replace(/\\bsin\\s*\\(/g, 'Math.sin(')
        .replace(/\\bcos\\s*\\(/g, 'Math.cos(')
        .replace(/\\bexp\\s*\\(/g, 'Math.exp(')
        .replace(/\\bsqrt\\s*\\(/g, 'Math.sqrt(')
        .replace(/\\babs\\s*\\(/g, 'Math.abs(');

      try {
        const fn = new Function('t', 'u', 'r', 'rect', 'tri', 'sinc', 'sign', \`"use strict"; return Number(\${jsExpr}) || 0;\`);
        fn(0.5, u, r, rect, tri, sinc, sign);
        return (tVal) => {
          try {
            const val = fn(tVal, u, r, rect, tri, sinc, sign);`;

src = src.replace(oldCompileExpr, newCompileExpr);

// 7. Inject Fourier engine and I18N before `const BUILTIN_PRESETS =`
const fourierEngine = `
    // ============================================================================
    // I18N DICTIONARY & INITIAL DETECTOR
    // ============================================================================
    const I18N = {
      en: {
        convTab: "3D Convolution",
        fourierTab: "3D Fourier Series",
        step1Label: "1st Step",
        step1Title: "t → τ",
        step2Label: "2nd Step",
        step2Title: "Reflection",
        step3Label: "3rd Step",
        step3Title: "Shift",
        step4Label: "4th Step",
        step4Title: "Integral",
        fStep1Label: "1st Step",
        fStep1Title: "Period & Symmetry",
        fStep2Label: "2nd Step",
        fStep2Title: "DC Level a₀",
        fStep3Label: "3rd Step",
        fStep3Title: "Coefficients",
        fStep4Label: "4th Step",
        fStep4Title: "Synthesis & Spec",
        shiftT: "Time Shift t",
        harmonicsN: "Harmonics N",
        galleryConv: "Textbook Examples & Saved",
        galleryFourier: "Standard Periodic Waveforms",
        tableConv: "Summary by Time Intervals t:",
        tableFourier: "Harmonic Coefficients Table (n = 1..N):",
        langBtn: "PT-BR"
      },
      pt: {
        convTab: "Convolução 3D",
        fourierTab: "Fourier 3D",
        step1Label: "1º Passo",
        step1Title: "t → τ",
        step2Label: "2º Passo",
        step2Title: "Reflexão",
        step3Label: "3º Passo",
        step3Title: "Deslocamento",
        step4Label: "4º Passo",
        step4Title: "Integral",
        fStep1Label: "1º Passo",
        fStep1Title: "Período e Simetria",
        fStep2Label: "2º Passo",
        fStep2Title: "Nível DC a₀",
        fStep3Label: "3º Passo",
        fStep3Title: "Coeficientes",
        fStep4Label: "4º Passo",
        fStep4Title: "Síntese e Espectro",
        shiftT: "Deslocamento t",
        harmonicsN: "Harmônicos N",
        galleryConv: "Exemplos das Notas de Aula & Salvos",
        galleryFourier: "Sinais Periódicos Padrão",
        tableConv: "Síntese por Intervalos de t (Clique para inspecionar):",
        tableFourier: "Tabela de Coeficientes Harmônicos (n = 1..N):",
        langBtn: "EN"
      }
    };

    function resolveInitialLanguage() {
      try {
        const stored = localStorage.getItem('conv3d_lang_pref');
        if (stored === 'en' || stored === 'pt') return stored;
        const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
        if (nav.toLowerCase().startsWith('pt')) return 'pt';
      } catch (e) {}
      return 'en';
    }

    function resolveInitialTheme() {
      try {
        const stored = localStorage.getItem('conv3d_theme');
        if (stored && ['projector', 'dark', 'light'].includes(stored)) return stored;
      } catch (e) {}
      return 'projector';
    }

    const FOURIER_PRESETS = {
      square: {
        id: 'square',
        shortTitle: 'Onda Quadrada',
        shortTitleEn: 'Square Wave',
        subtitle: 'Simetria Ímpar, bₙ = 4/(nπ)',
        subtitleEn: 'Odd Symmetry, bₙ = 4/(nπ)',
        expr: 'sign(sin(pi*t))',
        T0: 2.0,
        defaultN: 11
      },
      triangle: {
        id: 'triangle',
        shortTitle: 'Onda Triangular',
        shortTitleEn: 'Triangle Wave',
        subtitle: 'Simetria Par, decaimento 1/n²',
        subtitleEn: 'Even Symmetry, 1/n² falloff',
        expr: '1 - 2*abs(t - 1)',
        T0: 2.0,
        defaultN: 9
      },
      sawtooth: {
        id: 'sawtooth',
        shortTitle: 'Dente de Serra',
        shortTitleEn: 'Sawtooth Wave',
        subtitle: 'Rampa Linear, todos harmônicos',
        subtitleEn: 'Linear Ramp, all harmonics',
        expr: 't - 1',
        T0: 2.0,
        defaultN: 15
      },
      halfwave: {
        id: 'halfwave',
        shortTitle: 'Retificador Meia Onda',
        shortTitleEn: 'Half-Wave Rectifier',
        subtitle: 'Senoide Truncada [0, T₀/2]',
        subtitleEn: 'Truncated Sine [0, T₀/2]',
        expr: 'sin(pi*t)*u(sin(pi*t))',
        T0: 2.0,
        defaultN: 10
      },
      fullwave: {
        id: 'fullwave',
        shortTitle: 'Retificador Onda Completa',
        shortTitleEn: 'Full-Wave Rectifier',
        subtitle: 'Módulo do Seno |sen(πt)|',
        subtitleEn: 'Absolute Sine |sin(πt)|',
        expr: 'abs(sin(pi*t))',
        T0: 1.0,
        defaultN: 8
      },
      pulseTrain: {
        id: 'pulseTrain',
        shortTitle: 'Trem de Pulsos',
        shortTitleEn: 'Pulse Train',
        subtitle: 'Pulso Estreito, envelope Sinc',
        subtitleEn: 'Narrow Pulse, Sinc envelope',
        expr: 'u(t) - u(t - 0.5)',
        T0: 2.5,
        defaultN: 14
      }
    };

    function integrate1D(fn, a, b, n = 320) {
      const h = (b - a) / n;
      let sum = fn(a) + fn(b);
      for (let i = 1; i < n; i++) {
        const x = a + i * h;
        sum += (i % 2 === 0 ? 2 : 4) * fn(x);
      }
      return (h / 3) * sum;
    }

    function calculateFourierData() {
      const T0 = Math.max(0.2, state.fourierT0);
      const w0 = (2 * Math.PI) / T0;
      const f0 = 1 / T0;
      const N = Math.max(1, Math.min(30, state.fourierHarmonics));
      const fnBase = compileSignalExpr(state.fourierExpr);

      const fPeriodic = (t) => {
        let rem = ((t % T0) + T0) % T0;
        return fnBase(rem);
      };

      let isEven = true;
      let isOdd = true;
      let isHalfWave = true;
      const testSteps = 32;
      for (let i = 0; i < testSteps; i++) {
        const tVal = ((i + 0.5) / testSteps) * T0;
        const vPos = fPeriodic(tVal);
        const vNeg = fPeriodic(-tVal);
        const vHalf = fPeriodic(tVal + T0 / 2);
        if (Math.abs(vPos - vNeg) > 1e-3) isEven = false;
        if (Math.abs(vPos + vNeg) > 1e-3) isOdd = false;
        if (Math.abs(vHalf + vPos) > 1e-3) isHalfWave = false;
      }

      let a0 = 0;
      if (isOdd) {
        a0 = 0;
      } else {
        a0 = (1 / T0) * integrate1D((t) => fPeriodic(t), 0, T0, 320);
        if (Math.abs(a0) < 1e-5) a0 = 0;
      }

      const a = [a0];
      const b = [0];
      const C = [Math.abs(a0)];
      const theta = [0];
      let harmonicPower = a0 * a0;

      for (let n = 1; n <= N; n++) {
        let an = 0;
        let bn = 0;
        if (isHalfWave && n % 2 === 0) {
          an = 0;
          bn = 0;
        } else {
          if (!isOdd) {
            an = (2 / T0) * integrate1D((t) => fPeriodic(t) * Math.cos(n * w0 * t), 0, T0, 320);
            if (Math.abs(an) < 1e-5) an = 0;
          }
          if (!isEven) {
            bn = (2 / T0) * integrate1D((t) => fPeriodic(t) * Math.sin(n * w0 * t), 0, T0, 320);
            if (Math.abs(bn) < 1e-5) bn = 0;
          }
        }
        a[n] = an;
        b[n] = bn;
        const cn = Math.sqrt(an * an + bn * bn);
        C[n] = cn;
        theta[n] = Math.abs(cn) > 1e-5 ? -Math.atan2(bn, an) : 0;
        harmonicPower += 0.5 * cn * cn;
      }

      const totalPower = Math.max(1e-6, (1 / T0) * integrate1D((t) => Math.pow(fPeriodic(t), 2), 0, T0, 400));
      const efficiency = Math.min(100, Math.max(0, (harmonicPower / totalPower) * 100));

      state.fourierCalculated = {
        T0, w0, f0, N, fPeriodic, isEven, isOdd, isHalfWave,
        a0, a, b, C, theta, totalPower, harmonicPower, efficiency
      };
      return state.fourierCalculated;
    }
`;

src = src.replace('const BUILTIN_PRESETS =', fourierEngine + '\n    const BUILTIN_PRESETS =');

// 8. Update state definition
const oldStateBlock = `const state = {
      presetKey: 'ex8',
      customPresets: [],
      step: 4,
      t: 1.5,
      tauSweep: 1.2,      // Cursor animado do Passo 1
      flipAngle: Math.PI, // Ângulo animado do Passo 2 (0 a pi)
      isPlaying: true,
      seqMode: false,     // Quando ativo, anima Passo 1 -> 2 -> 3 -> 4 automaticamente
      isCommuted: false,  // Propriedade Comutativa: false = h reflete/desloca; true = x reflete/desloca
      showWaterfall: true,// Exibe as fatias 3D históricas ao longo do eixo t
      theme: 'dark',
      thickLines: false,
      activeMathField: null, // 'x' ou 'h'
      exprX: BUILTIN_PRESETS.ex8.exprX,
      exprH: BUILTIN_PRESETS.ex8.exprH
    };`;

const newStateBlock = `const state = {
      activeModule: 'convolution', // 'convolution' ou 'fourier'
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
      theme: resolveInitialTheme(),
      thickLines: true,
      activeMathField: null,
      exprX: BUILTIN_PRESETS.ex8.exprX,
      exprH: BUILTIN_PRESETS.ex8.exprH,
      lang: resolveInitialLanguage(),
      // Fourier
      fourierPresetKey: 'square',
      fourierStep: 4,
      fourierExpr: 'sign(sin(pi*t))',
      fourierT0: 2.0,
      fourierHarmonics: 10,
      fourierCalculated: null
    };`;

src = src.replace(oldStateBlock, newStateBlock);

// 9. Update theme stored keys
src = src.replace("localStorage.getItem('conv3d_theme_v2')", "localStorage.getItem('conv3d_theme')");
src = src.replace("localStorage.setItem('conv3d_theme_v2', theme)", "localStorage.setItem('conv3d_theme', theme)");

// 10. Update buildNotebookLinesForStep to branch on state.activeModule
const oldBuildLines = `function buildNotebookLinesForStep(sig) {`;
const newBuildLines = `function buildNotebookLinesForStep(sig) {
      if (state.activeModule === 'fourier') {
        return buildNotebookLinesFourier(state.fourierCalculated || calculateFourierData());
      }`;

src = src.replace(oldBuildLines, newBuildLines);

// 11. Add buildNotebookLinesFourier
const fourierLinesCode = `
    function buildNotebookLinesFourier(data) {
      const isEn = state.lang === 'en';
      const T0 = data.T0;
      const w0 = data.w0;
      const N = data.N;
      const a0 = data.a0;

      let symDesc = isEn ? 'No elementary symmetry' : 'Sem simetria elementar detectada';
      if (data.isEven) symDesc = isEn ? 'Even Symmetry f(t)=f(-t) => b_n = 0' : 'Simetria Par f(t)=f(-t) => b_n = 0';
      else if (data.isOdd) symDesc = isEn ? 'Odd Symmetry f(t)=-f(-t) => a_0=0, a_n=0' : 'Simetria Ímpar f(t)=-f(-t) => a_0=0, a_n=0';
      else if (data.isHalfWave) symDesc = isEn ? 'Half-Wave Symmetry => only odd harmonics' : 'Simetria de Meia-Onda => apenas harmônicos ímpares';

      if (state.fourierStep === 1) {
        return [
          {
            label: isEn ? '1.1 Fundamental Period and Frequency:' : '1.1 Período Fundamental e Frequência:',
            latex: \`T_0 = \${T0.toFixed(2)}\\\\text{ s}, \\\\quad \\\\omega_0 = \\\\frac{2\\\\pi}{T_0} = \${w0.toFixed(3)}\\\\text{ rad/s}, \\\\quad f_0 = \${(1/T0).toFixed(3)}\\\\text{ Hz}\`
          },
          {
            label: isEn ? '1.2 Parity and Symmetry Deduction:' : '1.2 Dedução de Paridade e Simetrias:',
            latex: \`\\\\text{Classificação: } \\\\mathbf{\${symDesc}}\`
          },
          {
            label: isEn ? '1.3 Symmetry Consequence on Series:' : '1.3 Impacto Direto nas Integrais da Série:',
            latex: data.isOdd ? \`a_0 = 0, \\\\quad a_n = 0 \\\\;(\\\\forall n) \\\\implies \\\\text{Série exclusivamente em senos}\` : (data.isEven ? \`b_n = 0 \\\\;(\\\\forall n) \\\\implies \\\\text{Série exclusivamente em cossenos}\` : \`a_0 \\\\neq 0, \\\\; a_n \\\\neq 0, \\\\; b_n \\\\neq 0 \\\\implies \\\\text{Harmônicos completos}\`)
          }
        ];
      } else if (state.fourierStep === 2) {
        return [
          {
            label: isEn ? '2.1 Continuous Average / DC Level Formula:' : '2.1 Fórmula da Componente DC (Valor Médio):',
            latex: \`a_0 = \\\\frac{1}{T_0} \\\\int_{0}^{T_0} f(t)\\\\,dt\`
          },
          {
            label: isEn ? '2.2 Definite Integration in Period [0, T0]:' : '2.2 Integração Definida no Período [0, T₀]:',
            latex: \`a_0 = \\\\frac{1}{\${T0.toFixed(2)}} \\\\int_{0}^{\${T0.toFixed(2)}} f(t)\\\\,dt\`
          },
          {
            label: isEn ? '2.3 Computed Net DC Level:' : '2.3 Nível DC Concluído:',
            latex: \`a_0 = \\\\mathbf{\${a0.toFixed(4)}} \\\\quad (\\\\text{Linha média horizontal no espaço 3D})\`
          }
        ];
      } else if (state.fourierStep === 3) {
        let sampleTerms = [];
        const topH = Math.min(N, 4);
        for (let n = 1; n <= topH; n++) {
          sampleTerms.push(\`C_\${n} = \${data.C[n].toFixed(3)} \\\\;(\\\\theta_\${n}=\${((data.theta[n]*180)/Math.PI).toFixed(0)}^\\\\circ)\`);
        }
        return [
          {
            label: isEn ? '3.1 Trigonometric Integral Formulas:' : '3.1 Fórmulas dos Coeficientes Trigonométricos:',
            latex: \`a_n = \\\\frac{2}{T_0}\\\\int_{0}^{T_0} f(t)\\\\cos(n\\\\omega_0 t)dt, \\\\quad b_n = \\\\frac{2}{T_0}\\\\int_{0}^{T_0} f(t)\\\\sin(n\\\\omega_0 t)dt\`
          },
          {
            label: isEn ? '3.2 Compact Polar Amplitude and Phase:' : '3.2 Amplitude Compacta e Fase Polar:',
            latex: \`C_n = \\\\sqrt{a_n^2 + b_n^2}, \\\\quad \\\\theta_n = -\\\\mathrm{atan2}(b_n, a_n)\`
          },
          {
            label: isEn ? '3.3 Dominant Harmonics Sample:' : '3.3 Amostra dos Primeiros Harmônicos Calculados:',
            latex: sampleTerms.join(',\\\\; ')
          }
        ];
      } else {
        let reconFormula = \`f(t) \\\\approx \${Math.abs(a0) > 1e-4 ? a0.toFixed(3) : '0'}\`;
        const topH = Math.min(N, 3);
        for (let n = 1; n <= topH; n++) {
          if (data.C[n] > 0.01) {
            reconFormula += \` + \${data.C[n].toFixed(2)}\\\\cos(\${n === 1 ? '' : n}\\\\omega_0 t \${data.theta[n] >= 0 ? '+' : ''}\${data.theta[n].toFixed(2)})\`;
          }
        }
        if (N > 3) reconFormula += \` + \\\\dots + C_{\${N}}\\\\cos(\${N}\\\\omega_0 t + \\\\theta_{\${N}})\`;

        return [
          {
            label: isEn ? '4.1 Compact Trigonometric Fourier Series Synthesis:' : '4.1 Síntese da Série Trigonométrica Compacta:',
            latex: \`f(t) \\\\approx a_0 + \\\\sum_{n=1}^{N} C_n \\\\cos(n\\\\omega_0 t + \\\\theta_n)\`
          },
          {
            label: isEn ? \`4.2 Evaluated Sum for N = \${N} Harmonics:\` : \`4.2 Série Expandida para N = \${N} Harmônicos:\`,
            latex: reconFormula
          },
          {
            label: isEn ? '4.3 Parseval Power Distribution and Efficiency:' : '4.3 Teorema de Parseval e Taxa de Energia Capturada:',
            latex: \`P_{\\\\text{total}} = \${data.totalPower.toFixed(3)}\\\\text{ W}, \\\\quad P_{\${N}} = \${data.harmonicPower.toFixed(3)}\\\\text{ W} \\\\implies \\\\eta = \\\\mathbf{\${data.efficiency.toFixed(1)}\\\\%}\`
          }
        ];
      }
    }
`;

// 11. Add buildNotebookLinesFourier & updateNotebookUI Fourier branch
const oldNotebookUpdateStart = `function updateNotebookUI(animateHandwriting = false) {
      const sig = getEffectiveSignals();
      const tNow = state.t;
      const yNow = sig.conv(tNow);`;

const newNotebookUpdateStart = fourierLinesCode + `
    function updateNotebookUI(animateHandwriting = false) {
      if (state.activeModule === 'fourier') {
        const data = state.fourierCalculated || calculateFourierData();
        const liveMetrics = document.getElementById('live-step-metrics');
        if (liveMetrics) {
          liveMetrics.innerHTML = \`
            <div class="flex items-center gap-1.5"><span class="text-mut font-semibold">T₀:</span><span class="font-mono-code font-bold">\${data.T0.toFixed(2)}s</span></div>
            <div class="flex items-center gap-1.5"><span class="text-mut font-semibold">ω₀:</span><span class="font-mono-code font-bold">\${data.w0.toFixed(2)} rad/s</span></div>
            <div class="flex items-center gap-1.5"><span class="text-mut font-semibold">N:</span><span class="font-mono-code font-bold text-[var(--c-x1)]">\${data.N}</span></div>
            <div class="flex items-center gap-1.5"><span class="text-mut font-semibold">η:</span><span class="font-mono-code font-bold text-[var(--c-conv)]">\${data.efficiency.toFixed(1)}%</span></div>
          \`;
        }

        const lines = buildNotebookLinesForStep(null);
        const container = document.getElementById('notebook-lines');
        if (container) {
          const needsFullRebuild = animateHandwriting || container.children.length !== lines.length;
          if (!needsFullRebuild) {
            lines.forEach((item, idx) => {
              const row = container.children[idx];
              const labelEl = row ? row.querySelector('.hw-lbl') : null;
              const mathEl = row ? row.querySelector('.hw-clip') : null;
              if (labelEl) labelEl.textContent = item.label;
              if (mathEl) renderMath(mathEl, item.latex, false);
            });
          } else {
            if (handwritingTimer) {
              clearInterval(handwritingTimer);
              handwritingTimer = null;
            }
            container.innerHTML = '';
            lines.forEach((item) => {
              const div = document.createElement('div');
              div.className = 'handwriting-line py-1';
              div.innerHTML = \`
                <div class="hw-lbl text-[10px] font-medium text-mut mb-0.5">\${item.label}</div>
                <div class="flex items-center flex-wrap">
                  <span class="hw-clip"></span>
                  <span class="hw-pen-slot"></span>
                </div>
              \`;
              renderMath(div.querySelector('.hw-clip'), item.latex, false);
              container.appendChild(div);
            });

            let currentIdx = 0;
            const allRows = Array.from(container.children);
            const stepReveal = () => {
              allRows.forEach((r, i) => {
                const penSlot = r.querySelector('.hw-pen-slot');
                if (i < currentIdx) {
                  r.classList.remove('writing-now');
                  r.classList.add('written');
                  if (penSlot) penSlot.innerHTML = '';
                } else if (i === currentIdx) {
                  r.classList.add('writing-now');
                  if (penSlot) penSlot.innerHTML = PEN_SVG;
                }
              });
              currentIdx++;
              if (currentIdx > allRows.length) {
                clearInterval(handwritingTimer);
                handwritingTimer = null;
              }
            };
            stepReveal();
            handwritingTimer = setInterval(stepReveal, 260);
          }
        }

        const regionsContainer = document.getElementById('regions-table');
        if (regionsContainer) {
          regionsContainer.innerHTML = \`
            <div class="grid grid-cols-5 text-[9px] font-bold text-mut pb-1 border-b border-[var(--border-subtle)] uppercase">
              <span>n</span><span>aₙ</span><span>bₙ</span><span>Cₙ</span><span>θₙ</span>
            </div>
          \`;
          const listDiv = document.createElement('div');
          listDiv.className = 'max-h-28 overflow-y-auto custom-scroll space-y-0.5 pt-1';
          for (let n = 1; n <= data.N; n++) {
            const row = document.createElement('div');
            const isDom = data.C[n] > 0.1;
            row.className = \`grid grid-cols-5 text-[10px] font-mono-code py-0.5 px-1 rounded \${isDom ? 'bg-[var(--accent-bg)] font-bold' : 'text-sec'}\`;
            row.innerHTML = \`<span>#\${n}</span><span>\${data.a[n].toFixed(3)}</span><span>\${data.b[n].toFixed(3)}</span><span class="text-[var(--c-conv)]">\${data.C[n].toFixed(3)}</span><span>\${((data.theta[n]*180)/Math.PI).toFixed(0)}°</span>\`;
            listDiv.appendChild(row);
          }
          regionsContainer.appendChild(listDiv);
        }
        return;
      }

      const sig = getEffectiveSignals();
      const tNow = state.t;
      const yNow = sig.conv(tNow);`;

src = src.replace(oldNotebookUpdateStart, newNotebookUpdateStart);

// 13. In renderPresetGallery: branch on state.activeModule
const oldRenderPreset = `function renderPresetGallery() {
      const gallery = document.getElementById('preset-gallery');
      if (!gallery) return;
      gallery.innerHTML = '';`;

const newRenderPreset = `function renderPresetGallery() {
      const gallery = document.getElementById('preset-gallery');
      if (!gallery) return;
      gallery.innerHTML = '';

      if (state.activeModule === 'fourier') {
        Object.values(FOURIER_PRESETS).forEach((p) => {
          const card = document.createElement('div');
          const isActive = state.fourierPresetKey === p.id;
          const isEn = state.lang === 'en';
          card.className = \`preset-pill rounded-lg p-2 cursor-pointer flex flex-col justify-between gap-1 \${isActive ? 'active' : ''}\`;
          card.innerHTML = \`
            <div class="flex items-center justify-between gap-1">
              <span class="text-[11px] font-bold truncate">\${isEn ? p.shortTitleEn : p.shortTitle}</span>
              <span class="font-mono-code text-[9px] text-[var(--c-x1)]">T₀=\${p.T0}</span>
            </div>
            <div class="text-[10px] text-mut truncate">\${isEn ? p.subtitleEn : p.subtitle}</div>
          \`;
          card.addEventListener('click', () => {
            state.fourierPresetKey = p.id;
            state.fourierExpr = p.expr;
            state.fourierT0 = p.T0;
            state.fourierHarmonics = p.defaultN;
            document.getElementById('fourier-n-slider').value = p.defaultN;
            document.getElementById('btn-fourier-period').textContent = \`T₀: \${p.T0.toFixed(1)}\`;
            renderPresetGallery();
            syncInputsWithPreset();
            calculateFourierData();
            updateNotebookUI(true);
            updateScene3D();
          });
          gallery.appendChild(card);
        });
        return;
      }`;

src = src.replace(oldRenderPreset, newRenderPreset);

// 14. In syncInputsWithPreset: handle Fourier
const oldSyncInputs = `function syncInputsWithPreset() {
      renderMath(document.getElementById('mf-render-x'), exprToLatex(state.exprX, 't'), false);
      renderMath(document.getElementById('mf-render-h'), exprToLatex(state.exprH, 't'), false);
      const rawX = document.getElementById('mf-raw-x');
      const rawH = document.getElementById('mf-raw-h');
      if (rawX) rawX.textContent = state.exprX;
      if (rawH) rawH.textContent = state.exprH;
    }`;

const newSyncInputs = `function syncInputsWithPreset() {
      if (state.activeModule === 'convolution') {
        renderMath(document.getElementById('mf-render-x'), exprToLatex(state.exprX, 't'), false);
        renderMath(document.getElementById('mf-render-h'), exprToLatex(state.exprH, 't'), false);
        const rawX = document.getElementById('mf-raw-x');
        const rawH = document.getElementById('mf-raw-h');
        if (rawX) rawX.textContent = state.exprX;
        if (rawH) rawH.textContent = state.exprH;
      } else {
        renderMath(document.getElementById('mf-render-fourier'), exprToLatex(state.fourierExpr, 't'), false);
        const rawF = document.getElementById('mf-raw-fourier');
        if (rawF) rawF.textContent = state.fourierExpr;
      }
    }`;

src = src.replace(oldSyncInputs, newSyncInputs);

// 15. In updateScene3D: branch on state.activeModule
const oldUpdateSceneStart = `function updateScene3D() {
      if (!ctx3d || !stageCanvas) return;
      const sig = getEffectiveSignals();
      const pal = getThemePalette();

      const w = canvasContainer.clientWidth || 384;
      const h = canvasContainer.clientHeight || 260;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (stageCanvas.width !== Math.floor(w * dpr) || stageCanvas.height !== Math.floor(h * dpr)) {
        stageCanvas.width = Math.floor(w * dpr);
        stageCanvas.height = Math.floor(h * dpr);
      }

      updateCameraFromOrbit();`;

const newUpdateSceneStart = `function updateScene3D() {
      if (!ctx3d || !stageCanvas) return;
      const pal = getThemePalette();

      const w = canvasContainer.clientWidth || 384;
      const h = canvasContainer.clientHeight || 260;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (stageCanvas.width !== Math.floor(w * dpr) || stageCanvas.height !== Math.floor(h * dpr)) {
        stageCanvas.width = Math.floor(w * dpr);
        stageCanvas.height = Math.floor(h * dpr);
      }

      updateCameraFromOrbit();

      if (state.activeModule === 'fourier') {
        const strokeScale = state.thickLines || state.theme === 'projector' ? 1.55 : 1.0;
        renderFourierScene3D(w, h, pal, strokeScale, dpr);
        return;
      }

      const sig = getEffectiveSignals();`;

src = src.replace(oldUpdateSceneStart, newUpdateSceneStart);

// 16. Add renderFourierScene3D function
const fourierRenderCode = `
    function renderFourierScene3D(w, h, pal, strokeScale, dpr) {
      ctx3d.save();
      ctx3d.scale(dpr, dpr);
      ctx3d.fillStyle = pal.bgCss;
      ctx3d.fillRect(0, 0, w, h);

      const data = state.fourierCalculated || calculateFourierData();
      const T0 = data.T0;
      const N = data.N;
      const T_MAX = 2.5 * T0;
      const SAMPLES = 180;
      const dt = T_MAX / SAMPLES;

      // 1. Box Floor & Spectrum Wall
      draw3DPolygon([
        { x: 0, y: -1.4, z: -1.5 },
        { x: T_MAX, y: -1.4, z: -1.5 },
        { x: T_MAX, y: -1.4, z: N + 1 },
        { x: 0, y: -1.4, z: N + 1 }
      ], pal.wallFill, pal.wallStroke, 1 * strokeScale);

      draw3DPolygon([
        { x: T_MAX, y: -1.4, z: -1.5 },
        { x: T_MAX, y: 1.5, z: -1.5 },
        { x: T_MAX, y: 1.5, z: N + 1 },
        { x: T_MAX, y: -1.4, z: N + 1 }
      ], pal.wallFill, pal.wallStroke, 1 * strokeScale);

      // Floor Grid Lines
      for (let nTick = 0; nTick <= N; nTick += Math.max(1, Math.round(N / 5))) {
        draw3DLine({ x: 0, y: -1.4, z: nTick }, { x: T_MAX, y: -1.4, z: nTick }, pal.grid, 0.8 * strokeScale);
      }
      for (let tStep = 0; tStep <= T_MAX; tStep += T0 / 2) {
        draw3DLine({ x: tStep, y: -1.4, z: -1.5 }, { x: tStep, y: -1.4, z: N + 1 }, pal.grid, 0.8 * strokeScale);
      }

      // 2. Original Signal Curve at z = -1 (Front Plane)
      const origPts = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const tVal = i * dt;
        origPts.push({ x: tVal, y: data.fPeriodic(tVal), z: -1.0 });
      }
      draw3DPolyline(origPts, pal.x1, 2.8 * strokeScale, [], true);

      // 3. DC Baseline at z = 0
      draw3DLine({ x: 0, y: data.a0, z: 0 }, { x: T_MAX, y: data.a0, z: 0 }, pal.prod, 1.8 * strokeScale, [4, 3]);

      // 4. Individual Harmonic Waves at z = n (Depth Axis)
      const w0 = data.w0;
      for (let n = 1; n <= N; n++) {
        const an = data.a[n];
        const bn = data.b[n];
        if (Math.abs(an) < 1e-4 && Math.abs(bn) < 1e-4) continue;

        const hPts = [];
        for (let i = 0; i <= SAMPLES; i += 2) {
          const tVal = i * dt;
          const yH = an * Math.cos(n * w0 * tVal) + bn * Math.sin(n * w0 * tVal);
          hPts.push({ x: tVal, y: yH, z: n });
        }
        const hue = 205 + Math.round((55 * n) / N);
        const harmColor = state.theme === 'projector' ? \`hsl(\${hue}, 80%, 42%)\` : \`hsl(\${hue}, 80%, 62%)\`;
        draw3DPolyline(hPts, harmColor, 1.6 * strokeScale);

        // Discrete Spectrum Stems at x = T_MAX
        const stemTop = { x: T_MAX, y: data.C[n], z: n };
        draw3DLine({ x: T_MAX, y: 0, z: n }, stemTop, pal.conv, 2.4 * strokeScale);

        const dotProj = projectPoint3D(stemTop.x, stemTop.y, stemTop.z);
        if (dotProj) {
          ctx3d.beginPath();
          ctx3d.arc(dotProj.x, dotProj.y, 3.5 * strokeScale, 0, Math.PI * 2);
          ctx3d.fillStyle = pal.conv;
          ctx3d.fill();
        }
      }

      // DC Spectrum Stem at x = T_MAX, z = 0
      draw3DLine({ x: T_MAX, y: 0, z: 0 }, { x: T_MAX, y: data.C[0], z: 0 }, pal.conv, 2.4 * strokeScale);

      // 5. Reconstructed Signal Sum Curve at z = -0.5
      const reconPts = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const tVal = i * dt;
        let sum = data.a0;
        for (let n = 1; n <= N; n++) {
          sum += data.a[n] * Math.cos(n * w0 * tVal) + data.b[n] * Math.sin(n * w0 * tVal);
        }
        reconPts.push({ x: tVal, y: sum, z: -0.5 });
      }
      const reconColor = state.theme === 'projector' ? '#be123c' : '#ffffff';
      draw3DPolyline(reconPts, reconColor, 2.4 * strokeScale, [3, 2], true);

      ctx3d.restore();

      // Floating labels update
      const placeLbl = (id, x, y, z, vis, txt) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!vis) { el.style.opacity = '0'; return; }
        const pt = projectPoint3D(x, y, z);
        if (!pt) { el.style.opacity = '0'; return; }
        el.style.opacity = '1';
        el.style.left = \`\${pt.x}px\`;
        el.style.top = \`\${pt.y}px\`;
        if (txt) el.innerHTML = txt;
      };

      placeLbl('lbl-tau', T_MAX, -1.3, 0, true, '<b>t (Tempo)</b>');
      placeLbl('lbl-t', T_MAX, -1.3, N, true, '<b>n (Freq)</b>');
      placeLbl('lbl-z', 0, 1.4, -1, true, '<b>f(t)</b>');
      placeLbl('lbl-x1', 0.5 * T0, data.fPeriodic(0.5 * T0) + 0.15, -1, true, '<b>f(t) original</b>');
      placeLbl('lbl-conv', T_MAX, data.C[1] + 0.15, 1, true, '<b>|Cₙ| Espectro</b>');
      placeLbl('lbl-x2', 0, 0, 0, false);
      placeLbl('lbl-b1', 0, 0, 0, false);
      placeLbl('lbl-b2', 0, 0, 0, false);

      const livePill = document.getElementById('stage-live-pill');
      if (livePill) {
        livePill.innerHTML = \`
          <span class="text-mut">\${state.lang === 'en' ? 'Fourier Series' : 'Série de Fourier'}</span>
          <b class="font-mono-code text-[var(--c-x1)]">N = \${N}</b>
          <span class="mx-1 text-mut">•</span>
          <span class="text-mut">\${state.lang === 'en' ? 'Energy' : 'Energia'}:</span>
          <b class="font-mono-code text-[var(--c-conv)]">\${data.efficiency.toFixed(1)}%</b>
        \`;
      }
    }
`;

src = src.replace('function init3DStage() {', fourierRenderCode + '\n    function init3DStage() {');

// 17. Add module switcher logic and language switching to initUIEvents
const oldInitUIEvents = `function initUIEvents() {`;
const newInitUIEvents = `function switchModule(modName) {
      state.activeModule = modName;
      window.location.hash = modName;

      document.getElementById('btn-tab-conv').classList.toggle('active-tab-text', modName === 'convolution');
      document.getElementById('btn-tab-conv').classList.toggle('text-mut', modName !== 'convolution');
      document.getElementById('btn-tab-fourier').classList.toggle('active-tab-text', modName === 'fourier');
      document.getElementById('btn-tab-fourier').classList.toggle('text-mut', modName !== 'fourier');

      document.getElementById('header-accent-pip').style.background = modName === 'convolution' ? 'var(--c-conv)' : 'var(--c-x1)';

      document.getElementById('conv-slider-group').classList.toggle('hidden', modName !== 'convolution');
      document.getElementById('fourier-slider-group').classList.toggle('hidden', modName !== 'fourier');
      document.getElementById('btn-fourier-period').classList.toggle('hidden', modName !== 'fourier');
      document.getElementById('btn-seq-mode').classList.toggle('hidden', modName !== 'convolution');
      document.getElementById('btn-commute').classList.toggle('hidden', modName !== 'convolution');

      document.getElementById('conv-inputs-group').classList.toggle('hidden', modName !== 'convolution');
      document.getElementById('fourier-inputs-group').classList.toggle('hidden', modName !== 'fourier');

      // Update Step buttons labels
      const s1 = document.getElementById('step-lbl-1');
      const s2 = document.getElementById('step-lbl-2');
      const s3 = document.getElementById('step-lbl-3');
      const s4 = document.getElementById('step-lbl-4');

      if (modName === 'convolution') {
        s1.textContent = 't → τ';
        s2.textContent = 'Reflexão';
        s3.textContent = 'Deslocar';
        s4.textContent = 'Integral';
        document.getElementById('leg-fixed').textContent = 'Fixo';
        document.getElementById('leg-moving').textContent = 'Móvel';
        document.getElementById('leg-out').textContent = 'y(t)';
      } else {
        s1.textContent = 'Período';
        s2.textContent = 'Nível DC';
        s3.textContent = 'Coeficientes';
        s4.textContent = 'Síntese';
        document.getElementById('leg-fixed').textContent = 'Original';
        document.getElementById('leg-moving').textContent = 'Harmônicos';
        document.getElementById('leg-out').textContent = '|Cₙ|';
      }

      camOrbit.autoOrient = true;
      if (modName === 'convolution') {
        camOrbit.targetTheta = -0.62;
        camOrbit.targetPhi = 1.05;
        camOrbit.targetRadius = 13.2;
        camOrbit.target = { x: 1.25, y: 0.15, z: 2.0 };
      } else {
        const data = state.fourierCalculated || calculateFourierData();
        camOrbit.targetTheta = -0.72;
        camOrbit.targetPhi = 1.08;
        camOrbit.targetRadius = 15.5;
        camOrbit.target = { x: 1.25 * data.T0, y: 0.0, z: data.N * 0.4 };
      }

      renderPresetGallery();
      syncInputsWithPreset();
      updateNotebookUI(true);
      updateScene3D();
    }

    function applyTheme(th) {
      state.theme = th;
      try { localStorage.setItem('conv3d_theme', th); } catch (e) {}
      document.body.classList.remove('theme-dark', 'theme-light', 'theme-projector');
      document.body.classList.add('theme-' + th);
      document.querySelectorAll('.theme-btn').forEach((b) => b.classList.toggle('active', b.getAttribute('data-theme') === th));
      rebuildSceneHelpers();
    }

    function setLanguage(lang) {
      state.lang = lang;
      try { localStorage.setItem('conv3d_lang_pref', lang); } catch (e) {}
      document.getElementById('lang-btn-text').textContent = lang === 'en' ? 'PT-BR' : 'EN';
      const isEn = lang === 'en';
      document.getElementById('btn-tab-conv').textContent = isEn ? '3D Convolution' : 'Convolução 3D';
      document.getElementById('btn-tab-fourier').textContent = isEn ? '3D Fourier' : 'Fourier 3D';
      renderPresetGallery();
      updateNotebookUI(false);
      updateScene3D();
    }

    function initUIEvents() {
      document.getElementById('btn-tab-conv').addEventListener('click', () => switchModule('convolution'));
      document.getElementById('btn-tab-fourier').addEventListener('click', () => switchModule('fourier'));
      document.getElementById('btn-lang-toggle').addEventListener('click', () => {
        setLanguage(state.lang === 'en' ? 'pt' : 'en');
      });

      // Fourier Harmonics Slider
      const fourierSlider = document.getElementById('fourier-n-slider');
      fourierSlider.addEventListener('input', (e) => {
        state.fourierHarmonics = parseInt(e.target.value);
        document.getElementById('fourier-readout-badge').textContent = \`N = \${state.fourierHarmonics} (T₀=\${state.fourierT0.toFixed(1)})\`;
        calculateFourierData();
        updateNotebookUI(false);
        updateScene3D();
      });

      // Fourier Period Toggle Button
      document.getElementById('btn-fourier-period').addEventListener('click', () => {
        const periods = [1.0, 2.0, 3.0, 4.0];
        const curIdx = periods.indexOf(state.fourierT0);
        state.fourierT0 = periods[(curIdx + 1) % periods.length];
        document.getElementById('btn-fourier-period').textContent = \`T₀: \${state.fourierT0.toFixed(1)}\`;
        document.getElementById('fourier-readout-badge').textContent = \`N = \${state.fourierHarmonics} (T₀=\${state.fourierT0.toFixed(1)})\`;
        calculateFourierData();
        updateNotebookUI(false);
        updateScene3D();
      });

      // Fourier MathField box focus
      document.getElementById('mf-box-fourier').addEventListener('click', () => {
        setActiveMathField('fourier');
      });

      window.addEventListener('hashchange', () => {
        const h = window.location.hash.replace('#', '');
        if (h === 'fourier' && state.activeModule !== 'fourier') switchModule('fourier');
        else if (h === 'convolution' && state.activeModule !== 'convolution') switchModule('convolution');
      });
`;

src = src.replace(oldInitUIEvents, newInitUIEvents);

// 18. In setActiveMathField: handle 'fourier'
const oldSetActive = `function setActiveMathField(field) {
      state.activeMathField = field;
      const boxX = document.getElementById('mf-box-x');
      const boxH = document.getElementById('mf-box-h');
      const caretX = document.getElementById('mf-caret-x');
      const caretH = document.getElementById('mf-caret-h');
      const mkb = document.getElementById('math-keyboard');

      boxX.classList.toggle('focused', field === 'x');
      boxH.classList.toggle('focused-h', field === 'h');
      caretX.classList.toggle('hidden', field !== 'x');
      caretH.classList.toggle('hidden', field !== 'h');`;

const newSetActive = `function setActiveMathField(field) {
      state.activeMathField = field;
      const boxX = document.getElementById('mf-box-x');
      const boxH = document.getElementById('mf-box-h');
      const boxF = document.getElementById('mf-box-fourier');
      const caretX = document.getElementById('mf-caret-x');
      const caretH = document.getElementById('mf-caret-h');
      const caretF = document.getElementById('mf-caret-fourier');
      const mkb = document.getElementById('math-keyboard');

      boxX.classList.toggle('focused', field === 'x');
      boxH.classList.toggle('focused-h', field === 'h');
      if (boxF) boxF.classList.toggle('focused', field === 'fourier');
      caretX.classList.toggle('hidden', field !== 'x');
      caretH.classList.toggle('hidden', field !== 'h');
      if (caretF) caretF.classList.toggle('hidden', field !== 'fourier');`;

src = src.replace(oldSetActive, newSetActive);

// 19. In mutateActiveExpr: handle 'fourier'
const oldMutate = `function mutateActiveExpr(mutatorFn) {
      if (!state.activeMathField) setActiveMathField('x');
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
    }`;

const newMutate = `function mutateActiveExpr(mutatorFn) {
      if (!state.activeMathField) setActiveMathField(state.activeModule === 'fourier' ? 'fourier' : 'x');
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
    }`;

src = src.replace(oldMutate, newMutate);

// 20. In window.onload: apply theme, lang and hash
const oldOnload = `window.onload = function () {
      init3DStage();
      renderPresetGallery();
      syncInputsWithPreset();
      initMathKeyboard();
      initUIEvents();
      setStep(4, false);
      animateLoop();
    };`;

const newOnload = `window.onload = function () {
      init3DStage();
      applyTheme(state.theme);
      setLanguage(state.lang);
      renderPresetGallery();
      syncInputsWithPreset();
      initMathKeyboard();
      initUIEvents();
      const initH = window.location.hash.replace('#', '');
      if (initH === 'fourier') {
        switchModule('fourier');
      } else {
        switchModule('convolution');
        setStep(4, false);
      }
      animateLoop();
    };`;

src = src.replace(oldOnload, newOnload);

fs.writeFileSync('c:/Users/joaod/Documents/2026/Sinais e Sistemas forma interativa/index.html', src, 'utf8');
console.log('Successfully created pixel-perfect index.html extending original convolu_o_3d_interativa.html!');
