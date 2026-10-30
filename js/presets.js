// ============================================================================
// PRESETS.JS — Casos Clássicos das Notas de Aula, Provas UFPA e Livro Lathi
// ============================================================================

import { exprToLatex, integrateSimpson } from './math-engine.js';

export const BUILTIN_CONV_PRESETS = {
  ex8: {
    id: 'ex8',
    shortTitle: 'Exemplo #8',
    shortTitleEn: 'Example #8',
    subtitle: 'Exponencial e Pulso [0, 3]',
    subtitleEn: 'Exponential & Pulse [0, 3]',
    exprX: 'e^(-t)*u(t)',
    exprH: 'u(t)-u(t-3)',
    latexX: 'e^{-t}u(t)',
    latexH: 'u(t) - u(t-3)',
    fnX: (tau) => (tau >= 0 ? Math.exp(-tau) : 0),
    fnH: (tau) => (tau >= 0 && tau <= 3 ? 1.0 : 0),
    supportX: [0, 6],
    supportH: [0, 3],
    conv: (t) => {
      if (t < 0) return 0;
      if (t <= 3) return 1 - Math.exp(-t);
      return Math.exp(-(t - 3)) - Math.exp(-t);
    },
    regions: [
      { range: 't < 0', test: (t) => t < 0, sampleT: -0.8, latex: 'y(t) = 0' },
      { range: '0 \\le t \\le 3', test: (t) => t >= 0 && t <= 3, sampleT: 1.6, latex: 'y(t) = 1 - e^{-t}' },
      { range: 't > 3', test: (t) => t > 3, sampleT: 4.2, latex: 'y(t) = e^{-(t-3)} - e^{-t}' }
    ]
  },
  ex1: {
    id: 'ex1',
    shortTitle: 'Exemplo #1 / #2',
    shortTitleEn: 'Example #1 / #2',
    subtitle: 'Exponencial e Degrau u(t)',
    subtitleEn: 'Exponential & Step u(t)',
    exprX: 'e^(-t)*u(t)',
    exprH: 'u(t)',
    latexX: 'e^{-t}u(t)',
    latexH: 'u(t)',
    fnX: (tau) => (tau >= 0 ? Math.exp(-tau) : 0),
    fnH: (tau) => (tau >= 0 ? 1.0 : 0),
    supportX: [0, 6],
    supportH: [0, 6],
    conv: (t) => (t >= 0 ? 1 - Math.exp(-t) : 0),
    regions: [
      { range: 't < 0', test: (t) => t < 0, sampleT: -1.0, latex: 'y(t) = 0' },
      { range: 't \\ge 0', test: (t) => t >= 0, sampleT: 1.8, latex: 'y(t) = 1 - e^{-t}' }
    ]
  },
  two_rect: {
    id: 'two_rect',
    shortTitle: 'Dois Pulsos (Prova)',
    shortTitleEn: 'Two Pulses (Exam)',
    subtitle: 'Dois Pulsos [0, 2] → Triângulo',
    subtitleEn: 'Two Pulses [0, 2] → Triangle',
    exprX: 'u(t)-u(t-2)',
    exprH: 'u(t)-u(t-2)',
    latexX: 'p_{[0,2]}(t)',
    latexH: 'p_{[0,2]}(t)',
    fnX: (tau) => (tau >= 0 && tau <= 2 ? 1.0 : 0),
    fnH: (tau) => (tau >= 0 && tau <= 2 ? 1.0 : 0),
    supportX: [0, 2],
    supportH: [0, 2],
    conv: (t) => {
      if (t < 0) return 0;
      if (t <= 2) return t;
      if (t <= 4) return 4 - t;
      return 0;
    },
    regions: [
      { range: 't < 0', test: (t) => t < 0, sampleT: -0.6, latex: 'y(t) = 0' },
      { range: '0 \\le t < 2', test: (t) => t >= 0 && t < 2, sampleT: 1.0, latex: 'y(t) = t' },
      { range: '2 \\le t \\le 4', test: (t) => t >= 2 && t <= 4, sampleT: 3.0, latex: 'y(t) = 4 - t' },
      { range: 't > 4', test: (t) => t > 4, sampleT: 4.8, latex: 'y(t) = 0' }
    ]
  },
  lathi25: {
    id: 'lathi25',
    shortTitle: 'Lathi Ex. 2.5',
    shortTitleEn: 'Lathi Ex. 2.5',
    subtitle: 'Duas Exponenciais Causais',
    subtitleEn: 'Two Causal Exponentials',
    exprX: 'e^(-t)*u(t)',
    exprH: 'e^(-2*t)*u(t)',
    latexX: 'e^{-t}u(t)',
    latexH: 'e^{-2t}u(t)',
    fnX: (tau) => (tau >= 0 ? Math.exp(-tau) : 0),
    fnH: (tau) => (tau >= 0 ? Math.exp(-2 * tau) : 0),
    supportX: [0, 6],
    supportH: [0, 4],
    conv: (t) => (t >= 0 ? Math.exp(-t) - Math.exp(-2 * t) : 0),
    regions: [
      { range: 't < 0', test: (t) => t < 0, sampleT: -0.8, latex: 'y(t) = 0' },
      { range: 't \\ge 0', test: (t) => t >= 0, sampleT: 1.2, latex: 'y(t) = e^{-t} - e^{-2t}' }
    ]
  },
  ex5: {
    id: 'ex5',
    shortTitle: 'Exemplo #5',
    shortTitleEn: 'Example #5',
    subtitle: 'Pulso [-1,1] e Rampa t/3',
    subtitleEn: 'Pulse [-1,1] & Ramp t/3',
    exprX: 'u(t+1)-u(t-1)',
    exprH: '(t/3)*(u(t)-u(t-3))',
    latexX: 'u(t+1)-u(t-1)',
    latexH: '\\frac{t}{3}[u(t)-u(t-3)]',
    fnX: (tau) => (tau >= -1 && tau <= 1 ? 1.0 : 0),
    fnH: (tau) => (tau >= 0 && tau <= 3 ? tau / 3.0 : 0),
    supportX: [-1, 1],
    supportH: [0, 3],
    conv: (t) => {
      const a = Math.max(0, t - 1);
      const b = Math.min(3, t + 1);
      if (b <= a) return 0;
      return (b * b - a * a) / 6.0;
    },
    regions: [
      { range: 't < -1', test: (t) => t < -1, sampleT: -1.6, latex: 'y(t) = 0' },
      { range: '-1 \\le t < 1', test: (t) => t >= -1 && t < 1, sampleT: 0.2, latex: 'y(t) = \\frac{(t+1)^2}{6}' },
      { range: '1 \\le t < 2', test: (t) => t >= 1 && t < 2, sampleT: 1.5, latex: 'y(t) = \\frac{2t}{3}' },
      { range: '2 \\le t \\le 4', test: (t) => t >= 2 && t <= 4, sampleT: 2.8, latex: 'y(t) = \\frac{9 - (t-1)^2}{6}' },
      { range: 't > 4', test: (t) => t > 4, sampleT: 4.6, latex: 'y(t) = 0' }
    ]
  },
  ex7: {
    id: 'ex7',
    shortTitle: 'Exemplo #7',
    shortTitleEn: 'Example #7',
    subtitle: 'Pulso Dipolo e Rampa t/2',
    subtitleEn: 'Dipole Pulse & Ramp t/2',
    exprX: '2*(u(t+1)-u(t)) - 2*(u(t)-u(t-1))',
    exprH: '(t/2)*(u(t)-u(t-2))',
    latexX: '2p_{[-1,0]}(t) - 2p_{[0,1]}(t)',
    latexH: '\\frac{t}{2}[u(t)-u(t-2)]',
    fnX: (tau) => {
      if (tau >= -1 && tau < 0) return 2.0;
      if (tau >= 0 && tau <= 1) return -2.0;
      return 0;
    },
    fnH: (tau) => (tau >= 0 && tau <= 2 ? tau / 2.0 : 0),
    supportX: [-1, 1],
    supportH: [0, 2],
    conv: (t) => {
      if (t < -1 || t > 3) return 0;
      if (t < 0) return 0.5 * (t + 1) * (t + 1);
      if (t < 1) return -0.5 * t * t + t + 0.5;
      if (t < 2) return -0.5 * t * t - t + 2.5;
      return 0.5 * (t - 1) * (t - 1) - 2.0;
    },
    regions: [
      { range: 't < -1', test: (t) => t < -1, sampleT: -1.5, latex: 'y(t) = 0' },
      { range: '-1 \\le t < 0', test: (t) => t >= -1 && t < 0, sampleT: -0.4, latex: 'y(t) = \\frac{(t+1)^2}{2}' },
      { range: '0 \\le t < 1', test: (t) => t >= 0 && t < 1, sampleT: 0.5, latex: 'y(t) = -\\frac{t^2}{2} + t + \\frac{1}{2}' },
      { range: '1 \\le t < 2', test: (t) => t >= 1 && t < 2, sampleT: 1.5, latex: 'y(t) = -\\frac{t^2}{2} - t + \\frac{5}{2}' },
      { range: '2 \\le t \\le 3', test: (t) => t >= 2 && t <= 3, sampleT: 2.5, latex: 'y(t) = \\frac{(t-1)^2}{2} - 2' },
      { range: 't > 3', test: (t) => t > 3, sampleT: 3.6, latex: 'y(t) = 0' }
    ]
  }
};

export const BUILTIN_FOURIER_PRESETS = {
  square: {
    id: 'square',
    title: 'Onda Quadrada',
    titleEn: 'Square Wave',
    subtitle: 'Simetria Ímpar e Meia-Onda, harmônicas 1/n',
    subtitleEn: 'Odd & Half-Wave Symmetry, 1/n odd harmonics',
    expr: '(u(t) - u(t-1.5)) - (u(t-1.5) - u(t-3))',
    T0: 3.0,
    N: 7
  },
  sawtooth: {
    id: 'sawtooth',
    title: 'Dente de Serra',
    titleEn: 'Sawtooth Wave',
    subtitle: 'Rampa periódica linear por partes',
    subtitleEn: 'Piecewise linear periodic ramp',
    expr: '(2*t/2.0 - 1) * (u(t) - u(t-2.0))',
    T0: 2.0,
    N: 9
  },
  triangular: {
    id: 'triangular',
    title: 'Onda Triangular',
    titleEn: 'Triangular Wave',
    subtitle: 'Simetria Par e Meia-Onda, decaimento 1/n²',
    subtitleEn: 'Even & Half-Wave Symmetry, fast 1/n² decay',
    expr: '(2*tri((t - 1.5) / 1.5) - 1) * (u(t) - u(t-3))',
    T0: 3.0,
    N: 5
  },
  half_wave: {
    id: 'half_wave',
    title: 'Retificada Meia Onda',
    titleEn: 'Half-Wave Rectified',
    subtitle: 'Senoide truncada no semiciclo positivo',
    subtitleEn: 'Truncated sine on positive half-cycle',
    expr: 'sin(pi*t) * (u(t) - u(t-1.0))',
    T0: 2.0,
    N: 8
  },
  full_wave: {
    id: 'full_wave',
    title: 'Retificada Onda Completa',
    titleEn: 'Full-Wave Rectified',
    subtitle: '|sin(πt)| com período duplicado T₀ = 1',
    subtitleEn: '|sin(πt)| with doubled period T₀ = 1',
    expr: 'abs(sin(pi*t)) * (u(t) - u(t-1.0))',
    T0: 1.0,
    N: 6
  },
  pulse_train: {
    id: 'pulse_train',
    title: 'Trem de Pulsos (Duty 25%)',
    titleEn: 'Pulse Train (Duty 25%)',
    subtitle: 'Pulso retangular simétrico de largura T₀/4',
    subtitleEn: 'Symmetric rectangular pulse of width T₀/4',
    expr: 'u(t-0.75) - u(t-1.25)',
    T0: 2.0,
    N: 11
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
