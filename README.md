# Interactive Signals & Systems

Browser lab for continuous-time convolution and Fourier series decomposition. Renders signal transformations in interactive 3D coordinates $(t, \tau, z)$ and $(t, n, z)$ at 120 FPS using native Canvas 2D with Three.js camera projection. Zero plotting libraries, zero build steps, 100% client-side for GitHub Pages.

**Live application**: [joaosnet.github.io/interactive-signals-and-systems](https://joaosnet.github.io/interactive-signals-and-systems/)

---

## Modules

### 1. Continuous Convolution (`#convolution`)
- **Four graphical steps**:
  1. $t \to \tau$: Variable substitution and range mapping with laser sweep.
  2. Reflection: $180^\circ$ spatial flip producing $h(-\tau)$.
  3. Shift: Rigid translation by displacement $t$, giving $h(t - \tau)$.
  4. Integration: Overlap product $\int_{-\infty}^{+\infty} x(\tau) h(t - \tau) d\tau$ evaluating instantaneous $y(t)$.
- **Automatic Support & Regime Detector**: Finds support $[a, b]$ and deduce transition boundaries for any custom user signal.
- **3D waterfall history**: Slices traced along the $t$-axis illustrating accumulated convolution output.
- **Commutative switch**: Instant toggle between $x(t) \ast h(t)$ and $h(t) \ast x(t)$.
- **Analytical notebook**: Region-by-region integration bounds and exact symbolic fractions.
- **Reference presets**: Lathi and Oppenheim textbook cases (exponential decay, rectangular pulses, ramps, dipole pulses).

### 2. Fourier Series Analyzer (`#fourier`)
- **Three Mathematical Representations**:
  - Compact Polar: $f(t) \approx a_0 + \sum_{n=1}^{N} C_n \cos(n\omega_0 t + \theta_n)$
  - Trigonometric: $f(t) \approx a_0 + \sum_{n=1}^{N} \left[ a_n \cos(n\omega_0 t) + b_n \sin(n\omega_0 t) \right]$
  - Complex Exponential Bilateral: $f(t) \approx \sum_{n=-N}^{N} D_n e^{j n \omega_0 t}$
- **Eugene Khutoryansky Visual Dynamics**:
  - Continuous sinusoidal wave propagation in 3D time-frequency coordinates with zero render lags.
  - Crest alignment with discrete spectrum stems when camera turns to lateral 2D Spectrum view.
- **3D spatial decomposition**:
  - Front plane ($z = 0$): Periodic input signal $f(t)$ across $2.5 T_0$.
  - Origin ($z = 0$): DC component $a_0 = \frac{1}{T_0} \int_0^{T_0} f(t) dt$.
  - Depth ($z = n$): Individual harmonic carriers along the frequency depth axis.
  - Spectrum wall: Discrete magnitude line spectrum $|C_n|$ or $|D_n|$ with spherical markers and phase indicators.
  - Synthesis curve: Partial sum reconstruction $\sum_{n=1}^N$ showing Gibbs phenomenon.
- **Symmetry detection**: Even, Odd, Half-Wave ($f(t - T_0/2) = -f(t)$), and Quarter-Wave symmetries.
- **Parseval power ratio**: Total power $P_{\text{total}}$, harmonic power $P_N$, and capture efficiency $\eta = (P_N / P_{\text{total}}) \times 100\%$ with visual energy bar.
- **Web Audio Synthesizer**: Audibly hear the synthesized waveform timbre in real time or isolate individual overtones.
- **Harmonic isolation**: Click on any table row $n$ to highlight its wave and spectrum stem in 3D while dimming the others.

### 3. Continuous Fourier Transform — CTFT (`#ctft`)
- **Direct & Inverse CTFT**: $X(\omega) = \int_{-\infty}^{+\infty} x(t) e^{-j\omega t} dt$ and $x(t) = \frac{1}{2\pi} \int_{-\infty}^{+\infty} X(\omega) e^{j\omega t} d\omega$.
- **3D Space Representation**: Front plane ($z = 0$) shows real-time pulse $x(t)$, while back plane ($z = Z_{\max}$) renders continuous magnitude spectrum $|X(\omega)|$.
- **Eugene Khutoryansky Bridge ($T_0 \to \infty$)**: Live harmonic density slider illustrating how discrete Fourier series lines $T_0 D_n$ collapse into continuous envelope $X(\omega)$ as period $T_0$ approaches infinity.
- **Rayleigh-Parseval Energy Conservation**: Real-time energy balance $\int_{-\infty}^{+\infty} |x(t)|^2 dt = \frac{1}{2\pi} \int_{-\infty}^{+\infty} |X(\omega)|^2 d\omega$.
- **Canonical Pairs**: Rectangular pulse $\operatorname{rect}(t/\tau_0) \leftrightarrow \tau_0 \operatorname{sinc}(\omega \tau_0 / 2\pi)$, causal exponential $e^{-\alpha t} u(t) \leftrightarrow \frac{1}{\alpha + j\omega}$, triangular pulse $\operatorname{tri}(t/\tau_0) \leftrightarrow \frac{\tau_0}{2} \operatorname{sinc}^2(\omega \tau_0 / 4\pi)$, and bilateral exponential $e^{-\alpha |t|} \leftrightarrow \frac{2\alpha}{\alpha^2 + \omega^2}$.
- **UFPA 4-Step Analytical Derivation**: Step 1 (Signal & Definition), Step 2 (Transform Pair & Integrals), Step 3 (Continuous Spectrum), and Step 4 (Parseval & Khutoryansky Bridge).

---

## Design & Usability

- **Segmented Control Navigation**: Prominent top pill slider with clear icons and mathematical formulas to switch between Convolution, Fourier Series, and CTFT in 1 click.
- **Mobile First & Android AAA Experience**: Fixed 3D canvas stage (`~42dvh`) with touch orbit, collapsible bottom-sheet UI with native drag handle, and docked MathLive virtual keyboard with quick-access mathematical chips (`u(t)`, `rect(t)`, `tri(t)`, `δ(t)`, `sinc(t)`).
- **Orthographic & 3D Camera Views**: Instant toggle between `3D Free Orbit`, `2D Time (Frontal)`, `2D Spectrum (Lateral)`, and `Top Plan`.
- **Customizable UI ("View what you want")**: Toggle visibility filters for `[Passo a Passo]`, `[Tabela]`, `[Exemplos]`, and `[Editor de Sinais]` with auto-save.
- **Zen Focus Mode (`Z`)**: Collapse sidebar to dedicate 100% of the screen to the 3D stage with a floating minimal dock.
- **Projector mode by default**: Pure white background (`#ffffff`), pitch black text (`#000000`), 1.55x line weight, and saturated high-contrast curves (`#00449e`, `#be123c`, `#047857`) for classrooms, lecture halls, and HDMI beamers.
- **Dark & Light modes**: Dark Technical mode (`#090b10`) and editorial light theme switchable in Settings (`⚙️`).
- **Bilingual (EN / PT-BR)**: Automatic browser detection with manual toggle `[ EN | PT-BR ]`.
- **Keyboard shortcuts**: Space (Play/Pause), 1-4 (Steps), Tab (Cycle Convolution → Fourier → CTFT), Z (Zen mode), M (Audio), ←/→ (fine time/frequency/parameter adjust).
- **SEO & PWA**: JSON-LD Structured Data (`LearningResource` & `WebApplication`), Open Graph, Twitter Cards, `sitemap.xml`, `robots.txt`, and offline PWA `manifest.json`.

---

## Architecture

Modular native ES6 architecture (zero build step, GitHub Pages ready):
```
├── index.html          # Semantic HTML shell, SEO Meta & Schema.org JSON-LD
├── css/
│   └── styles.css      # Design system, themes (projector/dark/light), Zen mode, mobile bottom-sheet
├── js/
│   ├── app.js          # Entry point & 120 FPS animation loop
│   ├── state.js        # Reactive state & localStorage persistence
│   ├── i18n.js         # Bilingual dictionary (PT-BR / EN) & tooltips
│   ├── math-engine.js  # Signal compiler, support detector, Fourier 3-forms, CTFT engine
│   ├── presets.js      # Textbook and exam problem presets (Convolution, Fourier, CTFT)
│   ├── stage-3d.js     # Canvas 2D + Three.js projection, camera presets, Khutoryansky 3D dynamics
│   ├── notebook.js     # Didactic resolution notebook & handwriting animation
│   ├── audio.js        # Web Audio API real-time harmonic synthesizer
│   └── ui.js           # Segmented control, popovers, virtual math keyboard & mobile touch chips
├── assets/
│   ├── favicon.svg     # Vector favicon
│   └── og-banner.svg   # 1200x630 vector social sharing banner
├── sitemap.xml
├── robots.txt
└── manifest.json
```

---

## Running Locally

Serve with Python:

```bash
python -m http.server 3000
```

Deep links:
- `http://localhost:3000/#convolution`
- `http://localhost:3000/#fourier`
- `http://localhost:3000/#ctft`

---

## References

- B. P. Lathi, *Linear Systems and Signals*, 2nd ed., Oxford University Press.
- Alan V. Oppenheim, Alan S. Willsky, S. Hamid Nawab, *Signals and Systems*, 2nd ed., Prentice Hall.

---

## License

MIT
