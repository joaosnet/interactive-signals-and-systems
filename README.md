# Interactive Signals & Systems — 3D Convolution & Fourier Series Web Lab

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-emerald?style=flat-square&logo=github)](https://joaod.github.io/interactive-signals-and-systems/)
[![Engine](https://img.shields.io/badge/Engine-120%20FPS%20Canvas%20%2B%20Three.js-blue?style=flat-square)](https://threejs.org/)
[![Math](https://img.shields.io/badge/Math-KaTeX%200.16.8-rose?style=flat-square)](https://katex.org/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS-sky?style=flat-square)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-neutral?style=flat-square)](LICENSE)

> Interactive computational laboratory for time-domain and frequency-domain signal analysis. Features real-time 3D continuous convolution and 3D Fourier series decomposition with textbook-grade KaTeX typography, progressive handwriting animation, and an ultra-high-contrast Projector Mode designed for classrooms and auditoriums.

**Live Application**: [https://joaod.github.io/interactive-signals-and-systems/](https://joaod.github.io/interactive-signals-and-systems/)

---

## Features

### 1. 3D Continuous Convolution Lab (`#convolution`)
- **4 Methodical Graphical Steps**:
  1. **Step 1 ($t \to \tau$)**: Variable change and continuous sweep along $\tau$.
  2. **Step 2 (Reflection)**: Continuous $180^\circ$ spatial rotation around $\tau = 0$ yielding $h(-\tau)$.
  3. **Step 3 (Shift)**: Rigid displacement $h(t - \tau)$ by offset $t$.
  4. **Step 4 (Integral)**: Definite product overlap $\int_{-\infty}^{+\infty} x_1(\tau) x_2(t - \tau) d\tau$ computing instantaneous $y(t)$.
- **3D Waterfall Slices**: Dynamic historical slices tracing the product overlap across time $t$.
- **Commutative Property Toggle**: Switch between $x(t) \ast h(t)$ and $h(t) \ast x(t)$ with a single click.
- **Analytical Notebook**: Progressive handwriting animation detailing step-by-step calculus and region intervals.
- **Textbook Presets (B. P. Lathi / Oppenheim)**: Exponential with pulse, unit step, causal exponentials, linear ramps, and dipole pulses.

### 2. 3D Fourier Series Analyzer (`#fourier`)
- **3D Spatial Decomposition $(t, n, z)$**:
  - **Front Plane ($z = -1$)**: Original periodic signal $f(t)$ across $2.5 T_0$.
  - **Baseline ($z = 0$)**: DC offset component $a_0 = \frac{1}{T_0} \int_0^{T_0} f(t) dt$.
  - **Frequency Depth ($z = n$)**: Individual harmonic sinusoidal waves $y_n(t) = a_n \cos(n\omega_0 t) + b_n \sin(n\omega_0 t)$.
  - **Spectrum Boundary ($t = 2.5 T_0$)**: Discrete magnitude line spectrum $|C_n| = \sqrt{a_n^2 + b_n^2}$ with peak markers.
  - **Synthesis Curve ($z = -0.5$)**: Compact series reconstruction $\sum_{n=1}^N$ with Gibbs phenomenon inspection.
- **Automatic Symmetry Detection**: Numerical parity testing classifying Even ($b_n = 0$), Odd ($a_0 = a_n = 0$), and Half-Wave ($a_n = b_n = 0$ for even $n$).
- **Parseval Energy Capture**: Direct calculation of total power $P_{\text{total}}$, harmonic power $P_N$, and capture efficiency ratio $\eta = (P_N / P_{\text{total}}) \times 100\%$.
- **Standard Waveforms**: Square wave, triangle wave, sawtooth ramp, half-wave rectified sine, full-wave rectified sine, and rectangular pulse train.

### 3. Display Modes & Accessibility
- **Projector Mode (Default)**: Pure white `#ffffff` canvas, ink-black typography `#000000`, 1.55x stroke thickness, and saturated high-contrast lines (`#00449e`, `#be123c`, `#047857`) engineered for beamers, HDMI projectors, and illuminated lecture halls.
- **Dark Technical Mode**: Jet obsidian `#090b10` and carbon panels with hairline borders (`border-white/[0.08]`) and soft glowing traces.
- **Light Slate Mode**: Clean neutral palette (`#f1f5f9`).
- **2x Stroke Toggle**: Instant line thickening for low-resolution displays.

### 4. Internationalization (i18n)
- **English Default**: Worldwide discovery and English-first nomenclature.
- **Automatic Brazilian Portuguese Detection**: Detects `pt-BR` from browser headers and adjusts UI and mathematical descriptions automatically.
- **Manual Toggle**: `[ EN | PT-BR ]` header button with persistent storage in `localStorage`.

### 5. High Performance & Zero Heavy Dependencies
- Renders at **120 FPS** via native Canvas 2D with Three.js camera projection matrices.
- Zero reliance on bulky WebGL bundles or external plotting suites (completely eliminated Plotly's ~3.5 MB footprint).
- Instant cold load under 150 KB total asset weight.

---

## Quick Start / Local Development

No Node.js build step or bundling required. Run using any local HTTP server:

```bash
# Using Python
python -m http.server 3000

# Using Node / npx
npx serve .
```

Open `http://localhost:3000` in your browser.

Direct module linking:
- `http://localhost:3000/#convolution`
- `http://localhost:3000/#fourier`

---

## Mathematical Foundations

### Convolution Integral
$$y(t) = (x \ast h)(t) = \int_{-\infty}^{+\infty} x(\tau) h(t - \tau) \, d\tau$$

### Compact Trigonometric Fourier Series
$$f(t) \approx a_0 + \sum_{n=1}^{N} C_n \cos(n\omega_0 t + \theta_n)$$

where:
- Fundamental frequency: $\omega_0 = \frac{2\pi}{T_0}$
- DC component: $a_0 = \frac{1}{T_0}\int_0^{T_0} f(t)\,dt$
- Cosine coefficient: $a_n = \frac{2}{T_0}\int_0^{T_0} f(t)\cos(n\omega_0 t)\,dt$
- Sine coefficient: $b_n = \frac{2}{T_0}\int_0^{T_0} f(t)\sin(n\omega_0 t)\,dt$
- Polar magnitude: $C_n = \sqrt{a_n^2 + b_n^2}$
- Polar phase: $\theta_n = -\mathrm{atan2}(b_n, a_n)$
- Parseval identity: $P = a_0^2 + \frac{1}{2}\sum_{n=1}^{\infty} C_n^2 = \frac{1}{T_0}\int_0^{T_0} |f(t)|^2 \, dt$

---

## References

1. **B. P. Lathi**, *Linear Systems and Signals*, 2nd Edition, Oxford University Press.
2. **Alan V. Oppenheim, Alan S. Willsky, S. Hamid Nawab**, *Signals and Systems*, 2nd Edition, Prentice Hall.
3. Universidade Federal do Pará (UFPA), *Notas de Aula de Sinais e Sistemas*.

---

## License

MIT License. Open educational resource.
