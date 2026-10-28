# Interactive Signals & Systems

Browser lab for continuous-time convolution and Fourier series decomposition. Renders signal transformations in interactive 3D coordinates $(t, \tau, z)$ and $(t, n, z)$ at 120 FPS using native Canvas 2D with Three.js camera projection. Zero plotting libraries, zero build steps.

**Live application**: [joaosnet.github.io/interactive-signals-and-systems](https://joaosnet.github.io/interactive-signals-and-systems/)

---

## Modules

### 1. Continuous Convolution (`#convolution`)
- **Four graphical steps**:
  1. $t \to \tau$: Variable substitution and range mapping.
  2. Reflection: $180^\circ$ spatial flip producing $h(-\tau)$.
  3. Shift: Rigid translation by displacement $t$, giving $h(t - \tau)$.
  4. Integration: Overlap product $\int_{-\infty}^{+\infty} x(\tau) h(t - \tau) d\tau$ evaluating instantaneous $y(t)$.
- **3D waterfall history**: Slices traced along the $t$-axis illustrating accumulated convolution output.
- **Commutative switch**: Instant toggle between $x(t) \ast h(t)$ and $h(t) \ast x(t)$.
- **Analytical notebook**: Region-by-region integration bounds and exact piecewise equations.
- **Reference presets**: Lathi and Oppenheim textbook cases (exponential decay, rectangular pulses, ramps, dipole pulses).

### 2. Fourier Series Analyzer (`#fourier`)
- **3D spatial decomposition**:
  - Front plane ($z = -1$): Input signal $f(t)$ across $2.5 T_0$.
  - Origin ($z = 0$): DC component $a_0 = \frac{1}{T_0} \int_0^{T_0} f(t) dt$.
  - Depth ($z = n$): Individual harmonic carriers $a_n \cos(n\omega_0 t) + b_n \sin(n\omega_0 t)$.
  - Spectrum wall: Discrete magnitude line spectrum $|C_n| = \sqrt{a_n^2 + b_n^2}$.
  - Synthesis curve: Partial sum reconstruction $\sum_{n=1}^N$ showing Gibbs phenomenon.
- **Symmetry detection**: Midpoint numerical parity testing for Even ($b_n = 0$), Odd ($a_0 = a_n = 0$), and Half-Wave ($a_n = b_n = 0$ for even $n$).
- **Parseval power ratio**: Total power $P_{\text{total}}$, harmonic power $P_N$, and capture efficiency $\eta = (P_N / P_{\text{total}}) \times 100\%$.
- **Standard signals**: Square, triangle, sawtooth, half-wave rectified sine, full-wave rectified sine, and pulse train.

---

## Design & Usability

- **Projector mode by default**: Pure white background (`#ffffff`), pitch black text (`#000000`), 1.55x line weight, and saturated high-contrast curves (`#00449e`, `#be123c`, `#047857`) for classrooms, lecture halls, and HDMI beamers.
- **Dark & Light modes**: Dark Technical mode (`#090b10`) and neutral slate theme switchable in the header.
- **Bilingual (EN / PT-BR)**: Default English interface with automatic Portuguese detection (`navigator.language`) and manual toggle `[ EN | PT-BR ]`.
- **Lightweight single-file architecture**: Complete application packaged into `index.html` under 140 KB with no npm dependencies.

---

## Mathematical Formulation

### Continuous Convolution
$$y(t) = (x \ast h)(t) = \int_{-\infty}^{+\infty} x(\tau) h(t - \tau) \, d\tau$$

### Compact Fourier Series
$$f(t) \approx a_0 + \sum_{n=1}^{N} C_n \cos(n\omega_0 t + \theta_n)$$

where:
$$\omega_0 = \frac{2\pi}{T_0}, \quad a_0 = \frac{1}{T_0}\int_0^{T_0} f(t)\,dt$$
$$a_n = \frac{2}{T_0}\int_0^{T_0} f(t)\cos(n\omega_0 t)\,dt, \quad b_n = \frac{2}{T_0}\int_0^{T_0} f(t)\sin(n\omega_0 t)\,dt$$
$$C_n = \sqrt{a_n^2 + b_n^2}, \quad \theta_n = -\mathrm{atan2}(b_n, a_n)$$
$$P_{\text{total}} = \frac{1}{T_0}\int_0^{T_0} |f(t)|^2 \, dt, \quad P_N = a_0^2 + \frac{1}{2}\sum_{n=1}^{N} C_n^2$$

---

## Running Locally

Open `index.html` directly in any modern browser, or serve it with Python:

```bash
python -m http.server 3000
```

Deep links:
- `http://localhost:3000/#convolution`
- `http://localhost:3000/#fourier`

---

## References

- B. P. Lathi, *Linear Systems and Signals*, 2nd ed., Oxford University Press.
- Alan V. Oppenheim, Alan S. Willsky, S. Hamid Nawab, *Signals and Systems*, 2nd ed., Prentice Hall.

---

## License

MIT
