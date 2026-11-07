<div align="center">

[English](./README.md) · [Português](./README.pt-BR.md) · **Español**

# Señales y Sistemas de Forma Interactiva

Laboratorio interactivo para convolución continua, descomposición en series de Fourier y transformada de Fourier en tiempo continuo (CTFT) en el espacio tridimensional $(t, \tau, z)$ y $(t, \omega, z)$.

[![Live Demo](https://img.shields.io/badge/Live_Demo-joaosnet.github.io-090b10?style=flat-square&logo=github)](https://joaosnet.github.io/interactive-signals-and-systems/)
[![Motor Gráfico](https://img.shields.io/badge/Motor-Canvas_2D_%2B_Three.js-00449e?style=flat-square)](https://threejs.org/)
[![Rendimiento](https://img.shields.io/badge/Render-Bucle_Fijo_120_FPS-047857?style=flat-square)](https://developer.mozilla.org/es/docs/Web/API/window/requestAnimationFrame)
[![Plan de Estudios](https://img.shields.io/badge/Curr%C3%ADculo-UFPA_Telecom-be123c?style=flat-square)](https://ufpa.br/)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-gray?style=flat-square)](./LICENSE)

<br/>

<img src="./assets/demo.gif" alt="Demostración 3D de Señales y Sistemas Interactivos" width="100%" style="border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1);" />

</div>

---

## Visión General

*Señales y Sistemas de Forma Interactiva* es un entorno de simulación computacional ejecutado directamente en el navegador web, diseñado para la enseñanza universitaria de ingeniería. Procesa y renderiza transformaciones de señales en coordenadas 3D a 120 FPS mediante la API nativa Canvas 2D con proyección de cámara Three.js.

El proyecto no requiere pasos de compilación (*zero-build*), prescinde de librerías externas de trazado gráfico y opera 100% en el cliente.

- **Aplicación en Vivo**: [joaosnet.github.io/interactive-signals-and-systems](https://joaosnet.github.io/interactive-signals-and-systems/)
- **Contexto Institucional**: Facultad de Ingeniería de Telecomunicaciones (FEST), Universidad Federal de Pará (UFPA).
- **Fundamentación Teórica**: Alineado con la metodología de B. P. Lathi (*Señales y Sistemas Lineales*) y A. V. Oppenheim (*Señales y Sistemas*).

---

## Módulos Principales

### 1. Convolución Continua (`#convolution`)

Resuelve numérica y analíticamente la integral de convolución en tiempo continuo:

$$y(t) = x(t) \ast h(t) = \int_{-\infty}^{+\infty} x(\tau) h(t - \tau) \, d\tau$$

La resolución visual descompone el proceso en cuatro etapas didácticas:

1. **Sustitución de Variable ($t \to \tau$)**: Mapea las funciones de entrada $x(t)$ y $h(t)$ sobre el eje de integración $\tau$.
2. **Reflexión Temporal**: Invierte horizontalmente la respuesta al impulso para obtener $h(-\tau)$.
3. **Desplazamiento Temporal**: Traslada la función invertida por el parámetro $t$, produciendo $h(t - \tau)$.
4. **Integración del Producto**: Evalúa el área bajo el producto superpuesto $x(\tau) h(t - \tau)$, calculando el valor instantáneo de $y(t)$.

Capacidades operativas:
- **Detector Automático de Soporte y Regímenes**: Determina los intervalos no nulos $[a, b]$ y los puntos críticos de transición analítica para señales definidas por tramos.
- **Superficie 3D en Cascada (Waterfall)**: Proyecta los cortes históricos de evaluación a lo largo del eje ortogonal $z$ para observar la acumulación temporal de la salida.
- **Conmutatividad Inmediata**: Alterna entre $x(t) \ast h(t)$ y $h(t) \ast x(t)$ con recálculo en tiempo real.
- **Cuaderno Analítico Paso a Paso**: Presenta límites de integración, primitivas simbólicas y fracciones exactas.
- **Preajustes de Referencia**: Casos estándar de exámenes y textos guía (pulsos rectangulares, exponenciales causales, rampas y dipolos).

### 2. Analizador de Series de Fourier (`#fourier`)

Descompone señales periódicas $f(t)$ con período $T_0$ y frecuencia fundamental $\omega_0 = 2\pi / T_0$ en tres formulaciones matemáticas:

- **Forma Trigonométrica Compacta**:
  $$f(t) \approx a_0 + \sum_{n=1}^{N} C_n \cos(n\omega_0 t + \theta_n)$$
- **Forma Trigonométrica**:
  $$f(t) \approx a_0 + \sum_{n=1}^{N} \left[ a_n \cos(n\omega_0 t) + b_n \sin(n\omega_0 t) \right]$$
- **Forma Exponencial Compleja**:
  $$f(t) \approx \sum_{n=-N}^{N} D_n e^{j n \omega_0 t}$$

Capacidades operativas:
- **Dinámica Visual de Khutoryansky**: Propagación continua de ondas senoidales viajeras en el espacio tridimensional tiempo-frecuencia.
- **Mapeo Espacial 3D**:
  - Plano frontal ($z = 0$): Onda periódica original graficada en un rango de $2.5 T_0$.
  - Eje de profundidad ($z = n$): Armónicos individuales ordenados según su índice de frecuencia.
  - Pared espectral: Espectro de líneas discretas $|C_n|$ y $|D_n|$ con indicadores de ángulo de fase.
  - Curva de síntesis: Suma parcial $\sum_{n=1}^N$ evidenciando el fenómeno de Gibbs en las discontinuidades de salto.
- **Detección de Simetrías**: Reconocimiento automático de simetría Par, Impar, Media Onda ($f(t - T_0/2) = -f(t)$) y Cuarto de Onda, indicando coeficientes nulos antes del cálculo.
- **Distribución de Potencia de Parseval**: Cálculo de potencia promedio total $P_{\text{total}}$, potencia armónica acumulada $P_N$ y eficiencia de captura:
  $$\eta = \frac{P_N}{P_{\text{total}}} \times 100\%$$
- **Sintetizador Web Audio**: Reproducción sonora en tiempo real de la forma de onda sintetizada y escucha aislada de sobretonos.
- **Aislamiento de Armónicos**: La selección de cualquier fila en la tabla resalta su trayectoria espacial y línea espectral, atenuando los demás componentes.

### 3. Transformada de Fourier Continua (`#ctft`)

Calcula el par directo e inverso de la Transformada de Fourier en Tiempo Continuo:

$$X(\omega) = \int_{-\infty}^{+\infty} x(t) e^{-j\omega t} \, dt \quad \Longleftrightarrow \quad x(t) = \frac{1}{2\pi} \int_{-\infty}^{+\infty} X(\omega) e^{j\omega t} \, d\omega$$

Capacidades operativas:
- **Representación en Planos Duales**: El pulso aperiódico $x(t)$ se ubica en el plano frontal ($z = 0$), mientras que la curva continua de magnitud espectral $|X(\omega)|$ se representa en el plano posterior ($z = Z_{\max}$).
- **Puente de Khutoryansky ($T_0 \to \infty$)**: Control deslizante interactivo de período que demuestra cómo las líneas discretas $T_0 D_n$ colapsan en la envolvente continua $X(\omega)$.
- **Conservación de Energía de Rayleigh-Parseval**: Validación numérica en tiempo real del balance energético:
  $$\int_{-\infty}^{+\infty} |x(t)|^2 \, dt = \frac{1}{2\pi} \int_{-\infty}^{+\infty} |X(\omega)|^2 \, d\omega$$
- **Pares Canónicos Analíticos**: Pulso rectangular, decaimiento exponencial causal, pulso triangular y exponencial bilateral.
- **Deducción Analítica en Cuatro Pasos**: Paso 1 (Señal y Definición), Paso 2 (Par de Transformada), Paso 3 (Espectro Continuo) y Paso 4 (Balance de Parseval).

---

## Fundamentos Didácticos y de Interfaz

- **Proyecciones de Cámara**: Cambio inmediato entre `3D Libre`, `2D Tiempo (Frontal)`, `2D Espectro (Lateral)` y `Vista Superior`.
- **Modo Proyector**: Fondo blanco puro (`#ffffff`), ejes en negro sólido (`#000000`), trazo reforzado a 1.55x y curvas de alta saturación (`#00449e`, `#be123c`, `#047857`), calibrados para proyectores y pantallas de auditorio.
- **Tema Dark Technical**: Entorno oscuro antirreflejo (`#090b10`) para sesiones prolongadas de laboratorio.
- **Arquitectura Móvil**: Diseño responsivo con panel deslizable inferior (*bottom-sheet*), navegación táctil orbital 3D y teclado matemático virtual con operadores de acceso rápido (`u(t)`, `rect(t)`, `tri(t)`, `δ(t)`, `sinc(t)`).
- **Modo Zen (`Z`)**: Oculta paneles laterales para dedicar el 100% de la pantalla al escenario 3D.
- **Soporte Multilingüe**: Interfaz con conmutación en tiempo real y almacenamiento de preferencias locales (`localStorage`).

---

## Atajos de Teclado

| Tecla | Acción |
| :--- | :--- |
| `Espacio` | Reproducir o pausar simulación |
| `1`, `2`, `3`, `4` | Salto directo a los pasos 1 a 4 de Convolución |
| `Tab` | Alternar módulo: Convolución $\to$ Fourier $\to$ CTFT |
| `Z` | Alternar modo pantalla completa / Zen |
| `M` | Activar o desactivar sintetizador Web Audio |
| `←` / `→` | Ajuste fino del parámetro de tiempo $t$ o frecuencia $\omega$ |
| `Esc` | Cerrar ventana emergente o panel flotante |

---

## Arquitectura del Repositorio

```
interactive-signals-and-systems/
├── index.html          # Estructura semántica HTML5, metadatos SEO y esquema JSON-LD
├── css/
│   └── styles.css      # Sistema de diseño, temas (proyector, oscuro, claro) y vista móvil
├── js/
│   ├── app.js          # Punto de entrada principal y bucle de animación a 120 FPS
│   ├── state.js        # Gestor de estado reactivo y persistencia local
│   ├── i18n.js         # Diccionario de traducción y etiquetas matemáticas
│   ├── math-engine.js  # Motor de cálculo analítico, detector de soporte, Fourier y CTFT
│   ├── presets.js      # Biblioteca de casos canónicos y ejercicios de examen
│   ├── stage-3d.js     # Renderizado Canvas 2D con transformaciones de cámara Three.js
│   ├── notebook.js     # Generador de cuaderno didáctico paso a paso
│   ├── audio.js        # Sintetizador aditivo en tiempo real mediante Web Audio API
│   └── ui.js           # Controladores de interfaz, HUD y teclado matemático
├── assets/
│   ├── demo.gif        # Registro en alta resolución de la simulación interactiva
│   ├── favicon.svg     # Favicon vectorial
│   └── og-banner.svg   # Imagen Open Graph para enlaces sociales (1200x630)
├── sitemap.xml         # Mapa de sitio para indexación
├── robots.txt          # Reglas para rastreadores web
└── manifest.json       # Manifiesto de aplicación web progresiva (PWA)
```

---

## Ejecución Local

Con Python 3:

```bash
python -m http.server 3000
```

Con Node.js:

```bash
npx serve .
```

Enlaces directos a módulos:
- `http://localhost:3000/#convolution`
- `http://localhost:3000/#fourier`
- `http://localhost:3000/#ctft`

---

## Referencias Académicas

- B. P. Lathi, *Señales y Sistemas Lineales*, 2ª ed., Oxford University Press.
- Alan V. Oppenheim, Alan S. Willsky, S. Hamid Nawab, *Señales y Sistemas*, 2ª ed., Pearson / Prentice Hall.
- Facultad de Ingeniería de Telecomunicaciones (FEST), Universidad Federal de Pará (UFPA).

---

## Licencia

Distribuido bajo la [Licencia MIT](./LICENSE).
