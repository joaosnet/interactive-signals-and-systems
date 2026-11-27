<div align="center">

**English** · [Português](./README.pt-BR.md) · [Español](./README.es.md)

# Interactive Signals and Systems

Interactive laboratory for continuous-time convolution, Fourier series decomposition, and continuous-time Fourier transforms in three-dimensional space $(t, \tau, z)$ and $(t, \omega, z)$.

[![Live Demo](https://img.shields.io/badge/Live_Demo-joaosnet.github.io-090b10?style=flat-square&logo=github)](https://joaosnet.github.io/interactive-signals-and-systems/)
[![Engine](https://img.shields.io/badge/Engine-Canvas_2D-00449e?style=flat-square)](https://developer.mozilla.org/docs/Web/API/Canvas_API)
[![Target](https://img.shields.io/badge/Render-120_FPS_Fixed_Loop-047857?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
[![Curriculum](https://img.shields.io/badge/Curriculum-UFPA_Telecom-be123c?style=flat-square)](https://ufpa.br/)
[![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)](./LICENSE)

<br/>

<img src="./assets/demo.gif" alt="Interactive Signals and Systems 3D Demonstration" width="100%" style="border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1);" />

</div>

---

## Overview

Interactive Signals and Systems is an in-browser laboratory designed for engineering education. It renders signal transformations in 3D coordinates at 120 FPS using native HTML5 Canvas 2D with its own perspective camera projection (no 3D library).

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
- **Dual Plane Representation**: Displays time-domain pulse $x(t)$ on the front plane ($z = 0$) and both continuous magnitude spectrum $|X(\omega)|$ and phase spectrum $\angle X(\omega)$ on the spectral planes.
- **UFPA / Lathi Convention**: Unified non-normalized $\operatorname{sinc}(x) = \sin(x)/x$ (plus optional `sincpi(x)` shortcut) and $\operatorname{tri}(t/a) \leftrightarrow a\,\operatorname{sinc}^2(\omega a / 2)$.
- **The Khutoryansky Bridge ($T_0 \to \infty$)**: Interactive period expansion demonstrating discrete harmonic lines $T_0 D_n$ condensing into the continuous spectral envelope $X(\omega)$.
- **Rayleigh-Parseval Conservation**: Real-time numerical verification of energy equivalence:
  $$\int_{-\infty}^{+\infty} |x(t)|^2 \, dt = \frac{1}{2\pi} \int_{-\infty}^{+\infty} |X(\omega)|^2 \, d\omega$$
- **Standard Transform Pairs**: Canonical test cases including rectangular pulses, causal exponential decays, triangular pulses, bilateral exponentials, the Gaussian (self-dual) and the sinc (dual of the rectangle).
- **Live Properties ("Explore" selector)**: Time shift $x(t-t_0)$, scaling $x(at)$ and modulation $x(t)\cos(\omega_0 t)$. The original signal and spectrum stay as dashed "ghosts" behind the result, and the notebook shows the rule, the current case and what changes in energy and area.
- **Band-Limited Inverse Transform**: $x_W(t) = \frac{1}{2\pi}\int_{-W}^{W} X(\omega)e^{j\omega t}d\omega$ is drawn over $x(t)$ while the slider opens the band $W$, showing the captured energy fraction and the Gibbs phenomenon.
- **Property Table**: Shift, scaling, modulation, inverse, linearity, duality, convolution, differentiation and frequency shift; the first four rows switch on the matching mode on stage.
- **Four-Step Analytical Derivation**: Step-by-step breakdown covering signal definitions, transform pairs, spectrum properties, and Parseval balances.

---

### 4. Laplace Transform (`#laplace`)

Extends the Fourier Transform to the complex $s$-plane:

$$X(s) = \int_{-\infty}^{+\infty} x(t)\, e^{-st} \, dt, \qquad s = \sigma + j\omega$$

Module features:
- **$s$-Plane on the Stage Floor**: $\sigma$ runs horizontally and $j\omega$ in depth, with poles ($\times$) and zeros ($\circ$) marked and the region of convergence (ROC) shaded.
- **$|X(s)|$ Surface**: Magnitude becomes height; poles show up as "tent poles".
- **Vertical Cut at $\sigma$**: The curve $|X(\sigma + j\omega)|$ is the Fourier Transform of $x(t)e^{-\sigma t}$. Outside the ROC the cut turns red and dashed because the integral diverges.
- **Bridge to Fourier and Stability**: In step 4 the cut is the $j\omega$ axis itself. Sliding the pole across it shows when the Fourier Transform stops existing and the system stops being stable.
- **Same $X(s)$, Different Signals**: The causal and anticausal pairs share $\frac{1}{s+a}$ and differ only in the ROC.
- **Notable Pairs**: Step, ramp, causal, anticausal and two-sided exponentials, causal and damped sine and cosine.
- **Build Your Own Signal**: A mini-plane in the gallery lets you add and drag poles and zeros and pick the ROC; the stage and the notebook follow live.

---

### 5. Z-Transform (`#z`)

The discrete-time counterpart of Laplace, on the complex $z$-plane:

$$X(z) = \sum_{n=-\infty}^{+\infty} x[n]\, z^{-n}, \qquad z = r\,e^{j\Omega}$$

Module features:
- **$z$-Plane on the Stage Floor**: $\operatorname{Re}\{z\}$ runs horizontally and $\operatorname{Im}\{z\}$ in depth, with poles ($\times$), zeros ($\circ$), the unit circle and the region of convergence (ROC) shaded as a ring.
- **Stems of $x[n]$**: The back wall shows the sequence sample by sample and, at the cut, the sequence $x[n]\,r^{-n}$ that is actually summed.
- **$|X(z)|$ Surface on a Polar Mesh**: Magnitude becomes height; poles show up as "tent poles".
- **Circular Cut at $|z| = r$**: The curve $|X(r e^{j\Omega})|$ is the DTFT of $x[n]\,r^{-n}$, wrapped around the circle (which is why it is periodic in $\Omega$). Outside the ROC the cut turns red and dashed because the sum diverges.
- **Bridge to the DTFT and Stability**: In step 4 the cut is the unit circle itself. Sliding the pole across it shows when the DTFT stops existing and the system stops being stable.
- **Same $X(z)$, Different Sequences**: The causal and anticausal pairs share $\frac{z}{z-a}$ and differ only in the ROC.
- **Notable Pairs**: Impulse, step, ramp, causal, anticausal and two-sided exponentials, causal and damped sine and cosine.

---

### 6. Discrete Convolution (`#dconv`)

The convolution sum, sample by sample:

$$y[n] = x[n] * h[n] = \sum_{k=-\infty}^{+\infty} x[k]\, h[n-k]$$

Module features:
- **Four Stem Lanes**: $x[k]$, $h[n-k]$, the products $x[k]\,h[n-k]$ and $y[n]$ share the same $k$ axis, so $y[n]$ is born right under the origin of $h[n-k]$.
- **Step by Step**: Change of variable $n \to k$, reversal $h[-k]$, shift $h[n-k]$ and summation, with the overlap band highlighted on the floor.
- **The Sum Written Out**: For each $n$, the notebook lists the products being added, along with the length rule $L_y = L_x + L_h - 1$.
- **Clickable $y[n]$ Table**: Each row shows the overlapping range of $k$ and takes the stage straight to that sample.
- **Seven Examples, One Idea Each**: Rectangle with rectangle (triangle), rectangle with exponential, impulse (identity), delay, moving average, first difference and echo.

---

### 7. Discrete-Time Fourier Transform (`#dtft`)

The continuous, periodic spectrum of a sequence:

$$X(e^{j\Omega}) = \sum_{n=-\infty}^{+\infty} x[n]\, e^{-j\Omega n}, \qquad x[n] = \frac{1}{2\pi}\int_{2\pi} X(e^{j\Omega})\, e^{j\Omega n}\, d\Omega$$

Module features:
- **Three Lanes**: Stems of $x[n]$ at the back, $|X(e^{j\Omega})|$ in the middle and the phase $\angle X(e^{j\Omega})$ in front.
- **Partial Sum $X_N(\Omega)$**: The slider picks how many samples enter the sum. You can watch convergence, the Gibbs phenomenon on the ideal low-pass, and the cosine peaks growing into impulses.
- **$2\pi$ Periodicity**: The spectrum is drawn from $-3\pi$ to $3\pi$ with the fundamental period highlighted.
- **Probe at $\Omega$ and Filter Reading**: A marker sweeps the frequency while the notebook shows gain, phase and the response to $\cos(\Omega n)$, classifying the pair as low-pass, high-pass or all-pass.
- **Parseval and Bridge to the Z-Transform**: Energy matches in both domains, and $X(e^{j\Omega})$ is $X(z)$ on the unit circle.
- **Notable Pairs**: Rectangular pulse, causal and two-sided exponentials, ideal low-pass, cosine, moving average, first difference and impulse.

---

### 8. DFT and FFT (`#dft`)

The transform a computer actually computes, finite in both domains:

$$X[k] = \sum_{n=0}^{N-1} x[n]\, e^{-j2\pi kn/N}, \qquad x[n] = \frac{1}{N}\sum_{k=0}^{N-1} X[k]\, e^{j2\pi kn/N}$$

Module features:
- **Two Aligned Lanes**: $N$ stems of $x[n]$ at the back and $N$ stems of $|X[k]|$ in front, with $N$ from 4 to 64.
- **The DFT Samples the DTFT**: The continuous envelope is drawn behind the stems, showing that $X[k] = X(e^{j\Omega})$ at $\Omega = 2\pi k/N$ and that the resolution is $2\pi/N$.
- **Spectral Leakage**: A cosine with 2 cycles in the window gives two clean lines; with 2.5 cycles, the energy spreads over every bin. The Hann and Hamming windows, on the second slider, hold that spreading back.
- **Reading a Bin**: The slider picks $k$ and draws the cosine of that frequency over $x[n]$. The notebook shows value, phase, frequency and why the upper half corresponds to negative frequencies.
- **FFT with a Butterfly Diagram**: In step 4 the butterfly network connects $x[n]$ (in bit-reversed order) to $X[k]$, and the notebook compares $N^2$ products with $\frac{N}{2}\log_2 N$ butterflies, counted while running.
- **Eight Signals**: On-bin and off-bin cosine, two tones, rectangular pulse, impulse, alternating, exponential and ramp.

---

## Interface and Display Systems

- **Camera Projections**: Instant selection among `3D Free Orbit`, `2D Time (Front)`, `2D Spectrum (Lateral)`, and `Top Plan`.
- **Projector Mode**: High-contrast white background (`#ffffff`), solid black axes (`#000000`), 1.55x stroke weight, and saturated curves (`#00449e`, `#be123c`, `#047857`) calibrated for lecture hall beamers.
- **Dark Technical Theme**: Low-glare dark environment (`#090b10`) for laboratory and low-light workstation usage.
- **Mobile Architecture**: Responsive bottom-sheet layout with touch orbit gestures, a docked MathLive virtual keyboard (`⌨`), quick function chips (`u(t)`, `rect(t)`, `tri(t)`, `δ(t)`, `sinc(t)`), and native system keyboard toggle (`Abc`).
- **Zen Focus Mode (`Z`)**: Minimizes panels to leave 100% of the screen dedicated to the 3D stage.
- **Bilingual System**: English and Brazilian Portuguese interface switching with persistent preferences via `localStorage`.
- **Notebook in Focus**: The "Open notebook" button moves the derivation out of the panel and onto the stage area, as a ruled sheet where each line is handwritten with the pen following the stroke. Changing steps turns the page; moving the slider updates the numbers in place.

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Space` | Play or pause simulation loop |
| `1`, `2`, `3`, `4` | Direct jump to Convolution steps 1 through 4 |
| `[` / `]` | Cycle modules: Convolution $\to$ Discrete Convolution $\to$ Fourier $\to$ CTFT $\to$ DTFT $\to$ DFT $\to$ Laplace $\to$ Z |
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
│   ├── utilities.css   # Precompiled static utility CSS (zero-build)
│   └── styles.css      # Design system, themes (projector, dark, light), responsive bottom-sheet
├── js/
│   ├── app.js          # Main entry point and 120 FPS animation loop
│   ├── state.js        # Reactive state container and localStorage persistence
│   ├── i18n.js         # Bilingual translation dictionary and mathematical labels
│   ├── math-engine.js  # Analytic solver, support detector, Fourier decomposition, CTFT
│   ├── presets.js      # Textbook and exam signal presets
│   ├── stage-3d.js     # Canvas 2D engine with its own perspective camera
│   ├── notebook.js     # Step-by-step mathematical notebook renderer
│   ├── audio.js        # Web Audio API real-time additive synthesizer
│   └── ui.js           # Navigation controllers, HUD, and virtual math keyboard
├── tests/
│   └── math-engine.test.js # Automated Node test suite (Convolution, Fourier, CTFT, Parseval)
├── assets/
│   ├── demo.gif        # High-resolution demonstration capture
│   ├── favicon.svg     # Vector favicon
│   └── og-banner.svg   # Open Graph social sharing image (1200x630)
├── server.js           # Zero-dependency Node static development server
├── sitemap.xml         # Search engine index map
├── robots.txt          # Crawler instructions
└── manifest.json       # PWA web application manifest
```

---

## Local Execution & Tests

Run the local Node static server or automated tests:

```bash
npm start
npm test
```

Or run with Python 3:

```bash
python -m http.server 3000
```

Access the modules directly:
- `http://localhost:3000/#convolution`
- `http://localhost:3000/#fourier`
- `http://localhost:3000/#ctft`

---

## Feedback and Contributing

- **From the site**: the **Feedback** button, in the corner of the stage, opens a form that turns the report into an issue, already tagged with the module and step the person is on.
- **From the browser, no git**: the same window leads to GitHub's web editor, which creates the fork and the pull request on its own.
- **Beginner's guide** (in Portuguese): [CONTRIBUTING.md](CONTRIBUTING.md).
- **Sending without a GitHub account**: depends on the Worker in [`worker/`](worker/README.md), which has to be deployed to Cloudflare.

---

## Academic References

- B. P. Lathi, *Linear Systems and Signals*, 2nd ed., Oxford University Press, 2004.
- Alan V. Oppenheim, Alan S. Willsky, S. Hamid Nawab, *Signals and Systems*, 2nd ed., Prentice Hall, 1996.
- Faculdade de Engenharia de Telecomunicações (FEST), Universidade Federal do Pará (UFPA).

---

## License

This project is licensed under the [MIT License](./LICENSE).
