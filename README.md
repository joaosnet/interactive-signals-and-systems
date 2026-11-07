<div align="center">

**English** · [Português](./README.pt-BR.md) · [Español](./README.es.md)

# Interactive Signals and Systems

Interactive laboratory for continuous-time convolution, Fourier series decomposition, and continuous-time Fourier transforms in three-dimensional space $(t, \tau, z)$ and $(t, \omega, z)$.

[![Live Demo](https://img.shields.io/badge/Live_Demo-joaosnet.github.io-090b10?style=flat-square&logo=github)](https://joaosnet.github.io/interactive-signals-and-systems/)
[![Engine](https://img.shields.io/badge/Engine-Canvas_2D_%2B_Three.js-00449e?style=flat-square)](https://threejs.org/)
[![Target](https://img.shields.io/badge/Render-120_FPS_Fixed_Loop-047857?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
[![Curriculum](https://img.shields.io/badge/Curriculum-UFPA_Telecom-be123c?style=flat-square)](https://ufpa.br/)
[![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)](./LICENSE)

<br/>

<img src="./assets/demo.gif" alt="Interactive Signals and Systems 3D Demonstration" width="100%" style="border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1);" />

</div>

---

## Overview

Interactive Signals and Systems is an in-browser laboratory designed for engineering education. It renders signal transformations in 3D coordinates at 120 FPS using native HTML5 Canvas 2D with Three.js camera projection.

The application requires zero build tools, zero external plotting libraries, and runs entirely on the client side.

- **Live Application**: [joaosnet.github.io/interactive-signals-and-systems](https://joaosnet.github.io/interactive-signals-and-systems/)
- **Academic Context**: Faculty of Telecommunications Engineering, Federal University of Pará (UFPA).
- **Theoretical Basis**: Aligned with B. P. Lathi (*Linear Systems and Signals*) and A. V. Oppenheim (*Signals and Systems*).

---

## Core Modules

### 1. Continuous Convolution (`#convolution`)

Evaluates the continuous-time convolution integral:

$$y(t) = x(t) \ast h(t) = \int_{-\infty}^{+\infty} x(\tau) h(t - \tau) \, d\tau$$

The solver breaks execution into four distinct analytical and graphical steps:

1. **Coordinate Substitution ($t \to \tau$)**: Maps input signals $x(t)$ and $h(t)$ onto the dummy integration axis $\tau$.
2. **Time Reflection**: Generates $h(-\tau)$ via horizontal inversion across $\tau = 0$.
3. **Time Displacement**: Translates the inverted impulse response to position $t$, forming $h(t - \tau)$.
4. **Integration**: Evaluates the overlap product area $x(\tau)h(t - \tau)$ to determine the instantaneous output $y(t)$.

Key operational capabilities:
- **Support and Regime Detector**: Automatically calculates non-zero supports $[a, b]$ and critical transition boundaries for arbitrary piecewise functions.
- **3D Waterfall Surface**: Traces historic evaluation slices along the orthogonal $z$-axis to visualize cumulative energy.
- **Commutative Switch**: Toggles between $x(t) \ast h(t)$ and $h(t) \ast x(t)$ with instantaneous recomputation.
- **Analytical Notebook**: Computes regional integration bounds with exact fractional arithmetic.
- **Textbook Presets**: Standard configurations from Lathi and Oppenheim (single and double exponential, rectangular pulses, ramps, and dipole pulses).

### 2. Fourier Series Analyzer (`#fourier`)

Decomposes arbitrary periodic signals $f(t)$ with period $T_0$ and fundamental frequency $\omega_0 = 2\pi / T_0$ into three mathematical representations:

- **Compact Trigonometric Form**:
  $$f(t) \approx a_0 + \sum_{n=1}^{N} C_n \cos(n\omega_0 t + \theta_n)$$
- **Trigonometric Form**:
  $$f(t) \approx a_0 + \sum_{n=1}^{N} \left[ a_n \cos(n\omega_0 t) + b_n \sin(n\omega_0 t) \right]$$
- **Complex Exponential Form**:
  $$f(t) \approx \sum_{n=-N}^{N} D_n e^{j n \omega_0 t}$$

Key operational capabilities:
- **Khutoryansky Traveling Wave Dynamics**: Continuous sinusoidal wave propagation in 3D time-frequency coordinates.
- **Spatial Plane Mapping**:
  - Front plane ($z = 0$): Periodic input signal $f(t)$ rendered over $2.5 T_0$.
  - Depth axis ($z = n$): Individual harmonic carriers along the frequency axis.
  - Spectrum wall: Discrete line spectrum stems for $|C_n|$ and $|D_n|$ with phase indicators.
  - Synthesis curve: Partial sum reconstruction illustrating Gibbs phenomenon at jump discontinuities.
- **Symmetry Detection**: Automatic detection of Even, Odd, Half-Wave ($f(t - T_0/2) = -f(t)$), and Quarter-Wave symmetries to show eliminated coefficients.
- **Parseval Energy Distribution**: Computes total average power $P_{\text{total}}$, harmonic sum $P_N$, and capture efficiency:
  $$\eta = \frac{P_N}{P_{\text{total}}} \times 100\%$$
- **Web Audio Engine**: Generates audible composite waveforms and allows isolating individual overtones.
- **Harmonic Selection**: Clicking any harmonic row isolates its spatial wave and spectrum stem while dimming non-selected components.

### 3. Continuous-Time Fourier Transform (`#ctft`)

Evaluates the direct and inverse Fourier transform pair:

$$X(\omega) = \int_{-\infty}^{+\infty} x(t) e^{-j\omega t} \, dt \quad \Longleftrightarrow \quad x(t) = \frac{1}{2\pi} \int_{-\infty}^{+\infty} X(\omega) e^{j\omega t} \, d\omega$$

Key operational capabilities:
- **Dual Plane Representation**: Displays time-domain pulse $x(t)$ on the front plane ($z = 0$) and continuous magnitude spectrum $|X(\omega)|$ on the back plane ($z = Z_{\max}$).
- **The Khutoryansky Bridge ($T_0 \to \infty$)**: Interactive period expansion demonstrating discrete harmonic lines $T_0 D_n$ condensing into the continuous spectral envelope $X(\omega)$.
- **Rayleigh-Parseval Conservation**: Real-time numerical verification of energy equivalence:
  $$\int_{-\infty}^{+\infty} |x(t)|^2 \, dt = \frac{1}{2\pi} \int_{-\infty}^{+\infty} |X(\omega)|^2 \, d\omega$$
- **Standard Transform Pairs**: Canonical test cases including rectangular pulses, causal exponential decays, triangular pulses, and bilateral exponentials.
- **Four-Step Analytical Derivation**: Step-by-step breakdown covering signal definitions, transform pairs, spectrum properties, and Parseval balances.

---

## Interface and Display Systems

- **Camera Projections**: Instant selection among `3D Free Orbit`, `2D Time (Front)`, `2D Spectrum (Lateral)`, and `Top Plan`.
- **Projector Mode**: High-contrast white background (`#ffffff`), solid black axes (`#000000`), 1.55x stroke weight, and saturated curves (`#00449e`, `#be123c`, `#047857`) calibrated for lecture hall beamers.
- **Dark Technical Theme**: Low-glare dark environment (`#090b10`) for laboratory and low-light workstation usage.
- **Mobile Architecture**: Responsive bottom-sheet layout with touch orbit gestures and a docked virtual math keyboard with single-tap function inputs (`u(t)`, `rect(t)`, `tri(t)`, `δ(t)`, `sinc(t)`).
- **Zen Focus Mode (`Z`)**: Minimizes panels to leave 100% of the screen dedicated to the 3D stage.
- **Bilingual System**: English and Brazilian Portuguese interface switching with persistent preferences via `localStorage`.

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Space` | Play or pause simulation loop |
| `1`, `2`, `3`, `4` | Direct jump to Convolution steps 1 through 4 |
| `Tab` | Cycle modules: Convolution $\to$ Fourier $\to$ CTFT |
| `Z` | Toggle Zen full-screen mode |
| `M` | Toggle Web Audio synthesizer |
| `←` / `→` | Incremental step of time parameter $t$ or frequency $\omega$ |
| `Esc` | Close active modal dialog or popover |

---

## Repository Architecture

```
interactive-signals-and-systems/
├── index.html          # Semantic HTML5 shell, SEO metadata, JSON-LD schema
├── css/
│   └── styles.css      # Design system, themes (projector, dark, light), responsive bottom-sheet
├── js/
│   ├── app.js          # Main entry point and 120 FPS animation loop
│   ├── state.js        # Reactive state container and localStorage persistence
│   ├── i18n.js         # Bilingual translation dictionary and mathematical labels
│   ├── math-engine.js  # Analytic solver, support detector, Fourier decomposition, CTFT
│   ├── presets.js      # Textbook and exam signal presets
│   ├── stage-3d.js     # Canvas 2D engine with Three.js camera transformations
│   ├── notebook.js     # Step-by-step mathematical notebook renderer
│   ├── audio.js        # Web Audio API real-time additive synthesizer
│   └── ui.js           # Navigation controllers, HUD, and virtual math keyboard
├── assets/
│   ├── demo.gif        # High-resolution demonstration capture
│   ├── favicon.svg     # Vector favicon
│   └── og-banner.svg   # Open Graph social sharing image (1200x630)
├── sitemap.xml         # Search engine index map
├── robots.txt          # Crawler instructions
└── manifest.json       # PWA web application manifest
```

---

## Local Execution

Run with Python 3:

```bash
python -m http.server 3000
```

Run with Node.js:

```bash
npx serve .
```

Access the modules directly:
- `http://localhost:3000/#convolution`
- `http://localhost:3000/#fourier`
- `http://localhost:3000/#ctft`

---

## Academic References

- B. P. Lathi, *Linear Systems and Signals*, 2nd ed., Oxford University Press, 2004.
- Alan V. Oppenheim, Alan S. Willsky, S. Hamid Nawab, *Signals and Systems*, 2nd ed., Prentice Hall, 1996.
- Faculdade de Engenharia de Telecomunicações (FEST), Universidade Federal do Pará (UFPA).

---

## License

This project is licensed under the [MIT License](./LICENSE).
