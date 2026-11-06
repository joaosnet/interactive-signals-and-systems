// ============================================================================
// NOTEBOOK.JS — Caderno Analítico Didático Passo a Passo (Escrita Progressiva)
// ============================================================================

import { state } from './state.js';
import { I18N } from './i18n.js';
import { renderMath, latexToHtml, exprToLatex, formatSymbolic, calculateCTFTData } from './math-engine.js';
import { BUILTIN_CTFT_PRESETS } from './presets.js';
import { getEffectiveSignals, updateScene3D } from './stage-3d.js';

let handwritingTimer = null;
const PEN_SVG = `<span class="pen-nib"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path></svg></span>`;

function buildNotebookLinesFourier(calc) {
  const isEn = state.lang === 'en';
  const tNow = state.t;
  const recVal = calc.reconstruct(tNow);
  const origVal = calc.fPeriodic(tNow);
  const T0Str = calc.T0.toFixed(2);
  const w0Str = calc.w0.toFixed(3);
  const a0Str = formatSymbolic(calc.a0);

  if (state.step === 1) {
    let repLatex = '';
    if (state.fourierForm === 'trig') {
      repLatex = 'f(t) = a_0 + \\sum_{n=1}^{\\infty} \\left[ a_n \\cos(n\\omega_0 t) + b_n \\sin(n\\omega_0 t) \\right]';
    } else if (state.fourierForm === 'exp') {
      repLatex = 'f(t) = \\sum_{n=-\\infty}^{\\infty} D_n e^{j n \\omega_0 t}, \\quad D_n = \\frac{1}{T_0} \\int_{0}^{T_0} f(t) e^{-j n \\omega_0 t} dt';
    } else {
      repLatex = 'f(t) = C_0 + \\sum_{n=1}^{\\infty} C_n \\cos(n\\omega_0 t + \\theta_n), \\quad C_0 = a_0';
    }

    return [
      {
        label: isEn ? '1.1 Fourier Series Representation:' : '1.1 Representação em Série de Fourier:',
        latex: repLatex
      },
      {
        label: isEn ? '1.2 Fundamental Period and Frequency:' : '1.2 Período e Frequência Fundamental:',
        latex: `T_0 = ${T0Str}\\text{ s}, \\quad \\omega_0 = \\frac{2\\pi}{T_0} = ${w0Str}\\text{ rad/s}, \\quad f_0 = ${(1.0 / calc.T0).toFixed(2)}\\text{ Hz}`
      },
      {
        label: isEn ? '1.3 DC Level (Average a₀):' : '1.3 Nível Médio Contínuo a₀:',
        latex: `a_0 = \\frac{1}{T_0} \\int_{0}^{T_0} f(t)\\,dt = ${a0Str}`
      }
    ];
  }

  if (state.step === 2) {
    let symLatex = '';
    let symExpl = '';
    if (calc.symmetryType === 'quarter_even') {
      symLatex = isEn
        ? 'f(-t)=f(t) \\text{ and } f(t - T_0/2)=-f(t) \\implies \\text{Quarter-Wave Even}'
        : 'f(-t)=f(t) \\text{ e } f(t - T_0/2)=-f(t) \\implies \\text{Quarto de Onda Par}';
      symExpl = isEn
        ? '\\text{Only odd cosine harmonics: } b_n = 0, \\; a_n = 0 \\text{ for even } n.'
        : '\\text{Apenas cossenos ímpares: } b_n = 0, \\; a_n = 0 \\text{ para } n \\text{ par}.';
    } else if (calc.symmetryType === 'quarter_odd') {
      symLatex = isEn
        ? 'f(-t)=-f(t) \\text{ and } f(t - T_0/2)=-f(t) \\implies \\text{Quarter-Wave Odd}'
        : 'f(-t)=-f(t) \\text{ e } f(t - T_0/2)=-f(t) \\implies \\text{Quarto de Onda Ímpar}';
      symExpl = isEn
        ? '\\text{Only odd sine harmonics: } a_0 = a_n = 0, \\; b_n = 0 \\text{ for even } n.'
        : '\\text{Apenas senos ímpares: } a_0 = a_n = 0, \\; b_n = 0 \\text{ para } n \\text{ par}.';
    } else if (calc.symmetryType === 'half_wave') {
      symLatex = isEn
        ? 'f(t - T_0/2) = -f(t) \\implies \\text{Half-Wave Symmetry}'
        : 'f(t - T_0/2) = -f(t) \\implies \\text{Simetria de Meia-Onda (Half-Wave)}';
      symExpl = isEn
        ? '\\text{All even harmonics vanish: } a_n = b_n = 0 \\text{ for } n = 2, 4, 6\\dots'
        : '\\text{Todas as harmônicas pares se anulam: } a_n = b_n = 0 \\text{ para } n \\text{ par}.';
    } else if (calc.symmetryType === 'even') {
      symLatex = isEn
        ? 'f(-t) = f(t) \\implies \\text{Even Symmetry: } b_n = 0'
        : 'f(-t) = f(t) \\implies \\text{Simetria Par: } b_n = 0';
      symExpl = isEn
        ? '\\text{Only cosine harmonics are present: } b_n = 0.'
        : '\\text{Somente coeficientes em cosseno: } a_n \\text{ ativos, } b_n = 0.';
    } else if (calc.symmetryType === 'odd') {
      symLatex = isEn
        ? 'f(-t) = -f(t) \\implies \\text{Odd Symmetry: } a_0 = 0, \\; a_n = 0'
        : 'f(-t) = -f(t) \\implies \\text{Simetria Ímpar: } a_0 = 0, \\; a_n = 0';
      symExpl = isEn
        ? '\\text{DC level is zero; only sine harmonics } b_n \\text{ exist.}'
        : '\\text{Nível DC nulo; apenas harmônicas em seno } b_n \\text{ existem.}';
    } else {
      symLatex = isEn
        ? 'f(-t) \\ne \\pm f(t) \\implies \\text{No Pure Symmetry}'
        : 'f(-t) \\ne \\pm f(t) \\implies \\text{Sem Simetria Pura}';
      symExpl = isEn
        ? '\\text{General waveform: both } a_n \\text{ and } b_n \\text{ active.}'
        : '\\text{Forma geral: ambos coeficientes } a_n \\text{ e } b_n \\text{ estão ativos.}';
    }

    return [
      {
        label: isEn ? '2.1 Symmetry Classification:' : '2.1 Classificação de Simetria:',
        latex: symLatex
      },
      {
        label: isEn ? '2.2 Harmonic Vanishing:' : '2.2 Coeficientes Nulos:',
        latex: symExpl
      },
      {
        label: isEn ? '2.3 Dirichlet Conditions:' : '2.3 Condições de Dirichlet:',
        latex: isEn
          ? '\\int_0^{T_0} |f(t)|\\,dt < \\infty \\quad (\\text{Abs. integrable in period})'
          : '\\int_0^{T_0} |f(t)|\\,dt < \\infty \\quad (\\text{Absolutamente integrável no período})'
      }
    ];
  }

  if (state.step === 3) {
    const topH = calc.harmonics.slice(0, 4);
    let sampleRows = '';
    if (state.fourierForm === 'exp') {
      sampleRows = topH.map(h => `n=${h.n}: \\; |D_${h.n}|=${h.dnMagnitude.toFixed(3)}, \\; \\angle D_${h.n}=${(h.dnAngle/Math.PI).toFixed(2)}\\pi`).join(' \\\\ ');
    } else if (state.fourierForm === 'trig') {
      sampleRows = topH.map(h => `n=${h.n}: \\; a_${h.n}=${h.an.toFixed(3)}, \\; b_${h.n}=${h.bn.toFixed(3)}`).join(' \\\\ ');
    } else {
      sampleRows = topH.map(h => `n=${h.n}: \\; C_${h.n}=${h.cn.toFixed(3)}, \\; \\theta_${h.n}=${(h.theta/Math.PI).toFixed(2)}\\pi`).join(' \\\\ ');
    }

    return [
      {
        label: isEn ? '3.1 Harmonic Spectrum Sample:' : '3.1 Amostra do Espectro Harmônico:',
        latex: `\\begin{aligned} ${sampleRows} \\end{aligned}`
      },
      {
        label: isEn ? '3.2 Form Conversions:' : '3.2 Relação entre Formas:',
        latex: 'C_n = \\sqrt{a_n^2 + b_n^2}, \\quad \\theta_n = \\operatorname{atan2}(-b_n, a_n), \\quad D_n = \\frac{a_n - j b_n}{2} = \\frac{C_n}{2}e^{j\\theta_n}'
      },
      {
        label: isEn ? '3.3 Parseval Power & Efficiency:' : '3.3 Potência e Eficiência de Parseval:',
        latex: `P_{\\text{total}} = ${calc.totalPower.toFixed(3)}\\text{ W}, \\; P_N = ${calc.harmonicPower.toFixed(3)}\\text{ W} \\implies \\eta = \\mathbf{${calc.efficiency.toFixed(1)}\\%}`
      }
    ];
  }

  // Step 4
  return [
    {
      label: isEn ? '4.1 Truncated Series S_N(t):' : '4.1 Série Truncada S_N(t):',
      latex: `S_N(t) = a_0 + \\sum_{n=1}^{${calc.harmonics.length}} C_n \\cos(n\\omega_0 t + \\theta_n)`
    },
    {
      label: isEn ? '4.2 Instantaneous Value at t:' : '4.2 Valor Instantâneo em t:',
      latex: `t = ${tNow.toFixed(2)} \\implies S_{${calc.harmonics.length}}(${tNow.toFixed(2)}) = ${recVal.toFixed(4)}, \\quad f(${tNow.toFixed(2)}) = ${origVal.toFixed(4)}`
    },
    {
      label: isEn ? '4.3 Mean Squared Error (MSE):' : '4.3 Erro Médio Quadrático (MSE):',
      latex: `\\text{MSE}_N = \\frac{1}{T_0}\\int_0^{T_0} |f(t) - S_N(t)|^2 dt \\approx ${calc.mse.toFixed(5)}`
    }
  ];
}

function buildNotebookLinesConvolution(sig) {
  const isEn = state.lang === 'en';
  const fSym = sig.fixedSym;
  const mSym = sig.movingSym;
  const tNow = state.t;
  const tauNow = state.tauSweep;
  const degNow = Math.round((state.flipAngle / Math.PI) * 180);
  const yNow = sig.conv(tNow);

  const [fA, fB] = sig.supportFixed;
  const [mA, mB] = sig.supportMoving;
  const fAStr = Number.isFinite(fA) ? String(fA) : '-\\infty';
  const fBStr = Number.isFinite(fB) ? String(fB) : '+\\infty';
  const mAStr = Number.isFinite(mA) ? String(mA) : '-\\infty';
  const mBStr = Number.isFinite(mB) ? String(mB) : '+\\infty';

  if (state.step === 1) {
    const valF = sig.fnFixed(tauNow);
    const valM = sig.fnMoving(tauNow);
    return [
      {
        label: isEn ? '1.1 Convolution Integral:' : '1.1 Integral de Convolução:',
        latex: `y(t) = ${fSym}(t) \\ast ${mSym}(t) = \\int_{-\\infty}^{+\\infty} ${fSym}(\\tau)\\,${mSym}(t-\\tau)\\,d\\tau`
      },
      {
        label: isEn ? '1.2 Domain Transformation (t → τ):' : '1.2 Mudança de Domínio (t → τ):',
        latex: `${fSym}(\\tau) = ${exprToLatex(sig.preset.exprX, '\\tau')}, \\quad \\tau \\in [${fAStr},\\, ${fBStr}]`
      },
      {
        label: isEn ? '1.3 Moving Kernel in τ:' : '1.3 Segundo Sinal no Domínio τ:',
        latex: `${mSym}(\\tau) = ${exprToLatex(sig.preset.exprH, '\\tau')}, \\quad \\tau \\in [${mAStr},\\, ${mBStr}]`
      },
      {
        label: isEn ? `1.4 Value at τ = ${tauNow.toFixed(2)}:` : `1.4 Valor no Instante τ = ${tauNow.toFixed(2)}:`,
        latex: `${fSym}(${tauNow.toFixed(2)}) = ${valF.toFixed(3)}, \\quad ${mSym}(${tauNow.toFixed(2)}) = ${valM.toFixed(3)}`
      }
    ];
  }

  if (state.step === 2) {
    const negA = Number.isFinite(mB) ? String(-mB) : '-\\infty';
    const negB = Number.isFinite(mA) ? String(-mA) : '+\\infty';
    return [
      {
        label: isEn ? '2.1 Time Reflection:' : '2.1 Reflexão Temporal:',
        latex: isEn
          ? `\\text{Keep } ${fSym}(\\tau) \\text{ fixed and mirror } ${mSym}(\\tau) \\to ${mSym}(-\\tau)`
          : `\\text{Mantemos } ${fSym}(\\tau) \\text{ fixo e espelhamos } ${mSym}(\\tau) \\to ${mSym}(-\\tau)`
      },
      {
        label: isEn ? '2.2 Argument Inversion (τ → -τ):' : '2.2 Inversão de Sinal (τ → -τ):',
        latex: `${mSym}(-\\tau) = ${exprToLatex(sig.preset.exprH, '(-\\tau)')}`
      },
      {
        label: isEn ? '2.3 Domain Inversion:' : '2.3 Inversão do Suporte Temporal:',
        latex: `${mAStr} \\le -\\tau \\le ${mBStr} \\iff ${negA} \\le \\tau \\le ${negB}`
      },
      {
        label: isEn ? '2.4 Rotation Phase:' : '2.4 Rotação de Reflexão:',
        latex: `\\theta = ${degNow}^\\circ \\; (${(state.flipAngle / Math.PI).toFixed(2)}\\pi\\text{ rad})`
      }
    ];
  }

  if (state.step === 3) {
    const bLeft = Number.isFinite(mB) ? (tNow - mB).toFixed(2) : '-\\infty';
    const bRight = Number.isFinite(mA) ? (tNow - mA).toFixed(2) : '+\\infty';
    const symLeft = Number.isFinite(mB) ? (mB === 0 ? 't' : `${-mB}+t`) : '-\\infty';
    const symRight = Number.isFinite(mA) ? (mA === 0 ? 't' : `${-mA}+t`) : '+\\infty';
    return [
      {
        label: isEn ? '3.1 Time Shift by t:' : '3.1 Translação Temporal por t:',
        latex: `${mSym}(-\\tau) \\to ${mSym}(t-\\tau) = ${exprToLatex(sig.preset.exprH, '(t-\\tau)')}`
      },
      {
        label: isEn ? '3.2 Mobile Boundaries in τ:' : '3.2 Limites Móveis em Função de t:',
        latex: `${mAStr} \\le t - \\tau \\le ${mBStr} \\iff ${symLeft} \\le \\tau \\le ${symRight}`
      },
      {
        label: isEn ? `3.3 Numerical Edge Positions (t = ${tNow.toFixed(2)}):` : `3.3 Posição dos Limites (t = ${tNow.toFixed(2)}):`,
        latex: `\\tau_{\\text{inf}} = ${bLeft}, \\quad \\tau_{\\text{sup}} = ${bRight}`
      }
    ];
  }

  // Step 4 — Template Oficial UFPA (Prof. Agostinho Castro / MA2)
  const lowNum = Math.max(Number.isFinite(fA) ? fA : -99, Number.isFinite(mB) ? tNow - mB : -99);
  const highNum = Math.min(Number.isFinite(fB) ? fB : 99, Number.isFinite(mA) ? tNow - mA : 99);
  const hasOverlap = highNum > lowNum;

  const lowStr = hasOverlap ? lowNum.toFixed(2) : '-';
  const highStr = hasOverlap ? highNum.toFixed(2) : '-';

  const activeRegion =
    (sig.regions || []).find((r) => r.test(tNow)) ||
    (sig.regions && sig.regions[0]) || { range: 't \\in \\mathbb{R}', latex: 'y(t) = (x\\ast h)(t)' };

  // Montagem da Expressão Final em Chaves Canônicas
  let piecewiseLatex = 'y(t) = \\begin{cases} ';
  if (sig.regions && sig.regions.length > 0) {
    piecewiseLatex += sig.regions
      .map((r) => {
        const body = (isEn && r.latexEn ? r.latexEn : r.latex).replace(/^y\(t\)\s*=\s*/, '');
        return `${body}, & ${r.range}`;
      })
      .join(' \\\\[4pt] ');
  } else {
    piecewiseLatex += `(x \\ast h)(t), & t \\in \\mathbb{R}`;
  }
  piecewiseLatex += ' \\end{cases}';

  // Teste de Fronteira Formal (Conferência de Erro Zero)
  let boundaryProof = isEn
    ? '\\text{Boundary Continuity: } y(t) \\text{ is continuous across all interval junctions } (\\Delta y = 0).'
    : '\\text{Continuidade de Fronteiras: } y_i(t_k) = y_{i+1}(t_k) \\implies \\text{Sem impulsos nas transições.}';

  return [
    {
      label: isEn ? `4.1 Active Region at Current t = ${tNow.toFixed(2)}:` : `4.1 Região Ativa para t = ${tNow.toFixed(2)}:`,
      latex: `\\text{${isEn ? 'Current Interval: ' : 'Intervalo: '}} ${activeRegion.range}`
    },
    {
      label: isEn ? '4.2 Product Integral in τ:' : '4.2 Integral do Produto em τ:',
      latex: hasOverlap
        ? `y(${tNow.toFixed(2)}) = \\int_{${lowStr}}^{${highStr}} ${fSym}(\\tau)\\,${mSym}(${tNow.toFixed(2)}-\\tau)\\,d\\tau = ${yNow.toFixed(4)}`
        : (isEn ? `\\text{Empty intersection } (\\emptyset) \\implies y(${tNow.toFixed(2)}) = 0` : `\\text{Interseção vazia } (\\emptyset) \\implies y(${tNow.toFixed(2)}) = 0`)
    },
    {
      label: isEn ? '4.3 Boundary Continuity Check (UFPA Zero-Error Test):' : '4.3 Teste de Fronteira (Conferência de Erro Zero da UFPA):',
      latex: boundaryProof
    },
    {
      label: isEn ? '4.4 Canonical Piecewise Solution y(t):' : '4.4 Expressão Sintetizada por Ramos (Conclusão):',
      latex: piecewiseLatex
    }
  ];
}

function buildNotebookLinesCTFT(calc) {
  if (!calc) return [];
  const isEn = state.lang === 'en';

  if (state.step === 1) {
    return [
      {
        label: isEn ? '1.1 Continuous-Time Fourier Transform (CTFT) Definition:' : '1.1 Definição Canônica da Transformada de Fourier:',
        latex: 'X(\\omega) = \\mathcal{F}\\{x(t)\\} = \\int_{-\\infty}^{+\\infty} x(t) e^{-j\\omega t}\\,dt'
      },
      {
        label: isEn ? '1.2 Time-Domain Signal x(t):' : '1.2 Sinal de Entrada no Domínio do Tempo x(t):',
        latex: `x(t) = ${calc.latexTime}`
      },
      {
        label: isEn ? '1.3 Signal Energy in Time Domain (Rayleigh):' : '1.3 Energia Total no Domínio do Tempo (Rayleigh):',
        latex: `E_x = \\int_{-\\infty}^{+\\infty} |x(t)|^2\\,dt = ${calc.energyTime.toFixed(4)}\\text{ J}`
      }
    ];
  }

  if (state.step === 2) {
    return [
      {
        label: isEn ? '2.1 Integral Formulation:' : '2.1 Montagem da Integral da Transformada:',
        latex: `X(\\omega) = \\int_{-\\infty}^{+\\infty} \\left[ ${calc.latexTime} \\right] e^{-j\\omega t}\\,dt`
      },
      {
        label: isEn ? '2.2 Analytical Transform Result:' : '2.2 Resolução Analítica Fechada:',
        latex: `X(\\omega) = ${calc.latexCTFT}`
      },
      {
        label: isEn ? '2.3 DC Level / Net Area X(0):' : '2.3 Nível Médio Contínuo / Área Líquida X(0):',
        latex: `X(0) = \\int_{-\\infty}^{+\\infty} x(t)\\,dt = ${calc.fnMag(0).toFixed(4)}`
      }
    ];
  }

  if (state.step === 3) {
    return [
      {
        label: isEn ? '3.1 Continuous Magnitude Spectrum |X(ω)|:' : '3.1 Espectro Contínuo de Magnitude |X(ω)|:',
        latex: `|X(\\omega)| = \\sqrt{\\operatorname{Re}\\{X\\}^2 + \\operatorname{Im}\\{X\\}^2}`
      },
      {
        label: isEn ? '3.2 Continuous Phase Spectrum ∠X(ω):' : '3.2 Espectro Contínuo de Fase \\angle X(\\omega):',
        latex: `\\angle X(\\omega) = \\operatorname{atan2}\\left(\\operatorname{Im}\\{X\\},\\, \\operatorname{Re}\\{X\\}\\right)`
      },
      {
        label: isEn ? '3.3 Spectral Properties & Nulls:' : '3.3 Largura de Faixa e Nulos Espectrais:',
        latex: calc.presetKey === 'rect'
          ? `\\omega_{\\text{nulo}} = \\pm \\frac{2\\pi}{\\tau_0} = \\pm ${( (2 * Math.PI) / calc.tau ).toFixed(2)}\\text{ rad/s}`
          : `|X(0)| = ${calc.fnMag(0).toFixed(2)}, \\quad |X(10)| = ${calc.fnMag(10).toFixed(4)}`
      }
    ];
  }

  // Step 4
  return [
    {
      label: isEn ? '4.1 Khutoryansky Bridge (T₀ → ∞ Limit):' : '4.1 Ponte Didática de Khutoryansky (T₀ → ∞):',
      latex: `\\lim_{T_0 \\to \\infty} T_0 \\cdot D_n = X(\\omega), \\quad \\Delta\\omega = \\frac{2\\pi}{T_0} \\to 0`
    },
    {
      label: isEn ? `4.2 Discrete Harmonics Density at T₀ = ${calc.T0.toFixed(1)}s:` : `4.2 Densidade Espectral Discreta em T₀ = ${calc.T0.toFixed(1)}s:`,
      latex: `\\omega_0 = \\frac{2\\pi}{T_0} = ${calc.w0.toFixed(2)}\\text{ rad/s}, \\quad N_{\\text{raias}} = ${calc.bridgeHarmonics.length}`
    },
    {
      label: isEn ? '4.3 Parseval-Rayleigh Energy Conservation:' : '4.3 Teorema de Conservação de Energia (Parseval / Rayleigh):',
      latex: `\\int_{-\\infty}^{+\\infty} |x(t)|^2 dt = \\frac{1}{2\\pi} \\int_{-\\infty}^{+\\infty} |X(\\omega)|^2 d\\omega \\approx ${calc.energyFreq.toFixed(4)}\\text{ J}`
    },
    {
      label: isEn ? '4.4 Fundamental CTFT Property for Exams:' : '4.4 Propriedade Operacional de Prova (Lathi):',
      latex: `\\mathcal{F}\\{x(t - t_0)\\} = X(\\omega) e^{-j\\omega t_0}, \\quad \\mathcal{F}\\{x(at)\\} = \\frac{1}{|a|} X\\left(\\frac{\\omega}{a}\\right)`
    }
  ];
}

export function updateNotebookUI(animateHandwriting = false) {
  const dict = I18N[state.lang] || I18N.pt;
  const isFourier = state.activeModule === 'fourier';
  const isCTFT = state.activeModule === 'ctft';
  const isEn = state.lang === 'en';

  // 1. Barra de Métricas Instantâneas
  const metricsEl = document.getElementById('live-step-metrics');
  if (metricsEl) {
    if (isCTFT) {
      const calc = state.ctftCalculated;
      if (calc) {
        if (state.step === 1) {
          metricsEl.innerHTML = `<span class="font-semibold text-sec">${isEn ? 'Energy' : 'Energia'}</span><span>${latexToHtml(`E_x = ${calc.energyTime.toFixed(3)}\\text{ J}`)}</span>`;
        } else if (state.step === 2) {
          metricsEl.innerHTML = `<span class="font-semibold text-sec">DC X(0)</span><span>${latexToHtml(`X(0) = ${calc.fnMag(0).toFixed(3)}`)}</span>`;
        } else if (state.step === 3) {
          metricsEl.innerHTML = `<span class="font-semibold text-sec">|X(0)|</span><span>${latexToHtml(`|X(0)| = ${calc.fnMag(0).toFixed(2)}, \\; \\angle X(0) = 0`)}</span>`;
        } else {
          metricsEl.innerHTML = `<span class="font-semibold text-sec">Ponte T₀</span><span>${latexToHtml(`T_0 = ${calc.T0.toFixed(1)}\\text{s} \\implies \\Delta\\omega = ${calc.w0.toFixed(2)}`)}</span>`;
        }
      }
    } else if (isFourier) {
      const calc = state.fourierCalculated;
      if (calc) {
        if (state.step === 1) {
          metricsEl.innerHTML = `<span class="font-semibold text-sec">${dict.fundFreq}</span><span>${latexToHtml(`\\omega_0 = ${calc.w0.toFixed(2)}\\text{ rad/s}, \\; f_0 = ${calc.f0.toFixed(2)}\\text{ Hz}`)}</span>`;
        } else if (state.step === 2) {
          const symBadge =
            calc.symmetryType === 'quarter_even'
              ? isEn ? '\\text{Quarter-Wave Even } (b_n=0)' : '\\text{Quarto de Onda Par } (b_n=0)'
              : calc.symmetryType === 'quarter_odd'
              ? isEn ? '\\text{Quarter-Wave Odd } (a_n=0)' : '\\text{Quarto de Onda Ímpar } (a_n=0)'
              : calc.symmetryType === 'even'
              ? isEn ? '\\text{Even } (b_n=0)' : '\\text{Par } (b_n=0)'
              : calc.symmetryType === 'odd'
              ? isEn ? '\\text{Odd } (a_0=a_n=0)' : '\\text{Ímpar } (a_0=a_n=0)'
              : calc.symmetryType.includes('half')
              ? isEn ? '\\text{Half-Wave}' : '\\text{Meia-Onda}'
              : isEn ? '\\text{General}' : '\\text{Geral}';
          metricsEl.innerHTML = `<span class="font-semibold text-sec">${dict.symmClass}</span><span>${latexToHtml(symBadge)}</span>`;
        } else if (state.step === 3) {
          metricsEl.innerHTML = `<span class="font-semibold text-sec">${dict.activeHarm}</span><span>${latexToHtml(`N = ${calc.harmonics.length}, \\; \\eta = ${calc.efficiency.toFixed(1)}\\%`)}</span>`;
        } else {
          metricsEl.innerHTML = `<span class="font-semibold text-sec">${dict.approxAtT}</span><span>${latexToHtml(`S_N(${state.t.toFixed(2)}) = ${calc.reconstruct(state.t).toFixed(4)}`)}</span>`;
        }
      }
    } else {
      const sig = getEffectiveSignals();
      if (state.step === 1) {
        metricsEl.innerHTML = `<span class="font-semibold text-sec">${dict.sampleTau}</span><span>${latexToHtml(`\\tau = ${state.tauSweep.toFixed(2)}`)}</span>`;
      } else if (state.step === 2) {
        metricsEl.innerHTML = `<span class="font-semibold text-sec">${dict.reflection}</span><span>${latexToHtml(`\\theta = ${Math.round((state.flipAngle / Math.PI) * 180)}^\\circ`)}</span>`;
      } else {
        metricsEl.innerHTML = `<span class="font-semibold text-sec">${dict.currentParam}</span><span>${latexToHtml(`t = ${state.t.toFixed(2)} \\implies y(t) = ${sig.conv(state.t).toFixed(4)}`)}</span>`;
      }
    }
  }

  // 2. Linhas do Caderno
  const container = document.getElementById('notebook-lines');
  if (container) {
    const lines = isCTFT
      ? buildNotebookLinesCTFT(state.ctftCalculated)
      : (isFourier
        ? buildNotebookLinesFourier(state.fourierCalculated)
        : buildNotebookLinesConvolution(getEffectiveSignals()));

    if (!animateHandwriting && container.children.length === lines.length) {
      lines.forEach((item, idx) => {
        const row = container.children[idx];
        const labelEl = row.querySelector('.hw-lbl');
        const mathEl = row.querySelector('.hw-clip');
        if (labelEl) labelEl.textContent = item.label;
        if (mathEl) renderMath(mathEl, item.latex, false);
      });
    } else {
      if (handwritingTimer) {
        clearTimeout(handwritingTimer);
        handwritingTimer = null;
      }
      container.innerHTML = '';
      lines.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'handwriting-line written py-1 notebook-cascade-in';
        div.style.setProperty('--line-idx', String(idx));
        div.innerHTML = `
          <div class="hw-lbl text-[10px] font-medium text-mut mb-0.5">${item.label}</div>
          <div class="flex items-center flex-wrap">
            <span class="hw-clip"></span>
            <span class="hw-pen-slot"></span>
          </div>
        `;
        renderMath(div.querySelector('.hw-clip'), item.latex, false);
        container.appendChild(div);
      });
    }
  }

  // 3. Tabela de Regiões / Espectro
  const regContainer = document.getElementById('regions-table');
  if (regContainer) {
    regContainer.innerHTML = '';
    if (isCTFT) {
      // Header UFPA da Tabela de Transformadas Notáveis
      const tableHeader = document.createElement('div');
      tableHeader.className = 'grid grid-cols-3 gap-2 px-2 py-1.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[10px] font-bold text-sec uppercase tracking-wider mb-1';
      tableHeader.innerHTML = `
        <span>${isEn ? 'Signal x(t)' : 'Sinal x(t)'}</span>
        <span>${isEn ? 'Transform X(ω)' : 'Transformada X(ω)'}</span>
        <span class="text-right">${isEn ? 'Pair / Bridge' : 'Par Notável'}</span>
      `;
      regContainer.appendChild(tableHeader);

      Object.entries(BUILTIN_CTFT_PRESETS).forEach(([key, p]) => {
        const isCurrent = state.ctftPresetKey === key;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `region-row w-full text-left px-2 py-1.5 rounded-lg grid grid-cols-3 items-center gap-2 ui-control ${isCurrent ? 'active font-semibold' : ''}`;
        btn.innerHTML = `
          <span class="text-[10px] font-mono-code">${isEn ? p.titleEn : p.title}</span>
          <span class="ctft-formula text-[10px] truncate"></span>
          <span class="text-[9px] text-mut text-right truncate">${key === 'bridge' ? 'Eugene Khutoryansky' : 'Par Notável'}</span>
        `;
        renderMath(btn.querySelector('.ctft-formula'), p.latexX, false);
        btn.addEventListener('click', () => {
          state.ctftPresetKey = key;
          state.ctftCalculated = calculateCTFTData(state.ctftPresetKey, state.ctftPulseWidth, state.ctftDecay, state.ctftBridgeT0);
          updateNotebookUI(false);
          updateScene3D();
        });
        regContainer.appendChild(btn);
      });
    } else if (isFourier) {
      const calc = state.fourierCalculated;
      if (calc) {
        // Barra de Eficiência de Parseval
        const pBar = document.createElement('div');
        pBar.className = 'mb-2 p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-col gap-1';
        pBar.innerHTML = `
          <div class="flex items-center justify-between text-[10px]">
            <span class="font-medium text-sec">${dict.parsevalEfficiency}: <b>${calc.efficiency.toFixed(1)}%</b></span>
            <span class="font-mono-code text-mut">P_N = ${calc.harmonicPower.toFixed(2)}W / ${calc.totalPower.toFixed(2)}W</span>
          </div>
          <div class="w-full bg-[var(--slider-track)] h-1.5 rounded-full overflow-hidden">
            <div class="bg-[var(--c-conv)] h-full transition-all" style="width: ${calc.efficiency}%"></div>
          </div>
        `;
        regContainer.appendChild(pBar);

        // Tabela de Harmônicas
        calc.harmonics.slice(0, 10).forEach((h) => {
          const isHighlighted = state.highlightedHarmonic === h.n;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `region-row w-full text-left px-2 py-1 rounded flex items-center justify-between gap-2 ui-control ${isHighlighted ? 'active font-bold' : ''}`;
          const thetaPi = (h.theta / Math.PI).toFixed(2);
          const valStr = state.fourierForm === 'exp'
            ? `|D_{${h.n}}| = ${h.dnMagnitude.toFixed(3)}, \\; \\angle D = ${thetaPi}\\pi`
            : state.fourierForm === 'trig'
            ? `a_{${h.n}} = ${h.an.toFixed(3)}, \\; b_{${h.n}} = ${h.bn.toFixed(3)}`
            : `C_{${h.n}} = ${h.cn.toFixed(3)}, \\; \\theta_{${h.n}} = ${thetaPi}\\pi`;

          btn.innerHTML = `
            <span class="reg-range text-[10px] font-mono-code">n = ${h.n}</span>
            <span class="reg-expr text-[10px]"></span>
          `;
          renderMath(btn.querySelector('.reg-expr'), valStr, false);

          btn.addEventListener('click', () => {
            state.highlightedHarmonic = state.highlightedHarmonic === h.n ? null : h.n;
            updateNotebookUI(false);
            updateScene3D();
          });
          regContainer.appendChild(btn);
        });
      }
    } else {
      // Header UFPA da Tabela de Convolução com 3 colunas claras
      const tableHeader = document.createElement('div');
      tableHeader.className = 'table-header-ufpa grid grid-cols-3 gap-2 px-2 py-1.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[10px] font-bold text-sec uppercase tracking-wider mb-1';
      tableHeader.innerHTML = `
        <span>${isEn ? 'Regime / Overlap' : 'Regime / Sobreposição'}</span>
        <span>${isEn ? 'Interval of t' : 'Intervalo de t'}</span>
        <span class="text-right">${isEn ? 'Result y(t)' : 'Expressão y(t)'}</span>
      `;
      regContainer.appendChild(tableHeader);

      const sig = getEffectiveSignals();
      const regionsList = sig.regions || [];
      regionsList.forEach((reg, idx, arr) => {
        const isCurrent = state.step >= 3 && reg.test(state.t);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `region-row w-full text-left px-2 py-1.5 rounded-lg grid grid-cols-3 items-center gap-2 ui-control ${isCurrent ? 'active font-semibold' : ''}`;

        let regimeLabel = isEn ? 'Total Overlap' : 'Sobreposição Total';
        if (reg.latex.includes('y(t) = 0')) {
          regimeLabel = idx === 0 
            ? (isEn ? 'No Overlap (t < tin)' : 'Sem Sobreposição (t < tin)')
            : (isEn ? 'No Overlap (t > tout)' : 'Sem Sobreposição (t > tout)');
        } else if (idx === 1) {
          regimeLabel = isEn ? 'Partial Entrance' : 'Entrada Parcial';
        } else if (idx === arr.length - 2) {
          regimeLabel = isEn ? 'Partial Exit' : 'Saída Parcial';
        }

        btn.innerHTML = `
          <span class="text-[10px] font-medium text-mut truncate">${regimeLabel}</span>
          <span class="reg-range text-[11px] font-mono-code font-bold"></span>
          <span class="reg-expr text-[11px] text-right font-medium truncate"></span>
        `;
        renderMath(btn.querySelector('.reg-range'), reg.range, false);
        renderMath(btn.querySelector('.reg-expr'), isEn && reg.latexEn ? reg.latexEn : reg.latex, false);
        btn.addEventListener('click', () => {
          state.isPlaying = false;
          state.t = reg.sampleT;
          if (state.step < 3) state.step = 4;
          document.querySelectorAll('.step-card, .zen-step-btn').forEach((b) => {
            b.classList.toggle('active', Number(b.getAttribute('data-step')) === state.step);
          });
          const slider = document.getElementById('t-slider');
          if (slider) {
            slider.min = '-2.5';
            slider.max = '6.0';
            slider.step = '0.02';
            slider.value = state.t;
          }
          const titleEl = document.getElementById('slider-param-title');
          if (titleEl) titleEl.textContent = state.step === 3 ? dict.sliderShift3 : dict.sliderShift4;
          const badge = document.getElementById('t-readout-badge');
          if (badge) badge.textContent = `t = ${state.t.toFixed(2)}`;
          const zenBadge = document.getElementById('zen-t-readout');
          if (zenBadge) zenBadge.textContent = `t = ${state.t.toFixed(2)}`;
          document.querySelectorAll('.play-toggle-btn').forEach((pb) => {
            const pIcon = pb.querySelector('.icon-play');
            const paIcon = pb.querySelector('.icon-pause');
            if (pIcon) pIcon.classList.remove('hidden');
            if (paIcon) paIcon.classList.add('hidden');
          });
          const lblPlay = document.getElementById('lbl-play');
          if (lblPlay) lblPlay.textContent = dict.btnPlayPlay;
          updateNotebookUI(false);
          updateScene3D();
        });
        regContainer.appendChild(btn);
      });
    }
  }
}
