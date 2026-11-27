<div align="center">

[English](./README.md) · [Português](./README.pt-BR.md) · **Español**

# Señales y Sistemas de Forma Interactiva

Laboratorio interactivo para convolución continua, descomposición en series de Fourier y transformada de Fourier en tiempo continuo (CTFT) en el espacio tridimensional $(t, \tau, z)$ y $(t, \omega, z)$.

[![Live Demo](https://img.shields.io/badge/Live_Demo-joaosnet.github.io-090b10?style=flat-square&logo=github)](https://joaosnet.github.io/interactive-signals-and-systems/)
[![Motor Gráfico](https://img.shields.io/badge/Motor-Canvas_2D-00449e?style=flat-square)](https://developer.mozilla.org/docs/Web/API/Canvas_API)
[![Rendimiento](https://img.shields.io/badge/Render-Bucle_Fijo_120_FPS-047857?style=flat-square)](https://developer.mozilla.org/es/docs/Web/API/window/requestAnimationFrame)
[![Plan de Estudios](https://img.shields.io/badge/Curr%C3%ADculo-UFPA_Telecom-be123c?style=flat-square)](https://ufpa.br/)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-gray?style=flat-square)](./LICENSE)

<br/>

<img src="./assets/demo.gif" alt="Demostración 3D de Señales y Sistemas Interactivos" width="100%" style="border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1);" />

</div>

---

## Visión General

*Señales y Sistemas de Forma Interactiva* es un entorno de simulación computacional ejecutado directamente en el navegador web, diseñado para la enseñanza universitaria de ingeniería. Procesa y renderiza transformaciones de señales en coordenadas 3D a 120 FPS mediante la API nativa Canvas 2D, con proyección de cámara en perspectiva propia (sin biblioteca 3D).

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
- **Representación en Planos Duales**: El pulso aperiódico $x(t)$ se ubica en el plano frontal ($z = 0$), mientras que tanto el espectro continuo de magnitud $|X(\omega)|$ como el espectro de fase $\angle X(\omega)$ se dibujan en los planos espectrales.
- **Convención UFPA / Lathi**: Estandarización unificada $\operatorname{sinc}(x) = \sin(x)/x$ (con atajo opcional `sincpi(x)`) y $\operatorname{tri}(t/a) \leftrightarrow a\,\operatorname{sinc}^2(\omega a / 2)$.
- **Puente de Khutoryansky ($T_0 \to \infty$)**: Control deslizante interactivo de período que demuestra cómo las líneas discretas $T_0 D_n$ colapsan en la envolvente continua $X(\omega)$.
- **Conservación de Energía de Rayleigh-Parseval**: Validación numérica en tiempo real del balance energético:
  $$\int_{-\infty}^{+\infty} |x(t)|^2 \, dt = \frac{1}{2\pi} \int_{-\infty}^{+\infty} |X(\omega)|^2 \, d\omega$$
- **Pares Canónicos Analíticos**: Pulso rectangular, decaimiento exponencial causal, pulso triangular, exponencial bilateral, gaussiana (autodual) y sinc (dual del rectángulo).
- **Propiedades en Vivo (selector "Explorar")**: Desplazamiento $x(t-t_0)$, escala $x(at)$ y modulación $x(t)\cos(\omega_0 t)$. La señal y el espectro originales quedan como "fantasmas" discontinuos detrás del resultado, y el cuaderno muestra la regla, el caso actual y qué cambia en energía y área.
- **Transformada Inversa Limitada en Banda**: $x_W(t) = \frac{1}{2\pi}\int_{-W}^{W} X(\omega)e^{j\omega t}d\omega$ se dibuja sobre $x(t)$ mientras el deslizador abre la banda $W$, mostrando la fracción de energía capturada y el fenómeno de Gibbs.
- **Tabla de Propiedades**: Desplazamiento, escala, modulación, inversa, linealidad, dualidad, convolución, derivada y desplazamiento en frecuencia; las cuatro primeras filas activan el modo correspondiente en el escenario.
- **Deducción Analítica en Cuatro Pasos**: Paso 1 (Señal y Definición), Paso 2 (Par de Transformada), Paso 3 (Espectro Continuo) y Paso 4 (Balance de Parseval).

---

### 4. Transformada de Laplace (`#laplace`)

Extiende la Transformada de Fourier al plano complejo $s$:

$$X(s) = \int_{-\infty}^{+\infty} x(t)\, e^{-st} \, dt, \qquad s = \sigma + j\omega$$

Recursos del módulo:
- **Plano $s$ en el Piso del Escenario**: $\sigma$ en horizontal y $j\omega$ en profundidad, con polos ($\times$) y ceros ($\circ$) marcados y la región de convergencia (ROC) sombreada.
- **Superficie $|X(s)|$**: La magnitud se convierte en altura; los polos aparecen como "mástiles de carpa".
- **Corte Vertical en $\sigma$**: La curva $|X(\sigma + j\omega)|$ es la Transformada de Fourier de $x(t)e^{-\sigma t}$. Fuera de la ROC el corte se vuelve rojo y discontinuo porque la integral diverge.
- **Puente con Fourier y Estabilidad**: En el paso 4 el corte es el propio eje $j\omega$. Deslizar el polo a través de él muestra cuándo la Transformada de Fourier deja de existir y el sistema deja de ser estable.
- **Misma $X(s)$, Señales Distintas**: Los pares causal y anticausal comparten $\frac{1}{s+a}$ y solo difieren en la ROC.
- **Pares Notables**: Escalón, rampa, exponenciales causal, anticausal y bilateral, seno y coseno causales y amortiguados.
- **Arma Tu Señal**: Un mini-plano en la galería permite añadir y arrastrar polos y ceros y elegir la ROC; el escenario y el cuaderno siguen en vivo.

---

### 5. Transformada Z (`#z`)

La contraparte discreta de Laplace, en el plano complejo $z$:

$$X(z) = \sum_{n=-\infty}^{+\infty} x[n]\, z^{-n}, \qquad z = r\,e^{j\Omega}$$

Recursos del módulo:
- **Plano $z$ en el Piso del Escenario**: $\operatorname{Re}\{z\}$ en horizontal e $\operatorname{Im}\{z\}$ en profundidad, con polos ($\times$), ceros ($\circ$), el círculo unitario y la región de convergencia (ROC) sombreada como un anillo.
- **Muestras de $x[n]$**: La pared del fondo muestra la secuencia muestra a muestra y, en el corte, la secuencia $x[n]\,r^{-n}$ que realmente se suma.
- **Superficie $|X(z)|$ en Malla Polar**: La magnitud se convierte en altura; los polos aparecen como "mástiles de carpa".
- **Corte Circular en $|z| = r$**: La curva $|X(r e^{j\Omega})|$ es la DTFT de $x[n]\,r^{-n}$, enrollada alrededor del círculo (por eso es periódica en $\Omega$). Fuera de la ROC el corte se vuelve rojo y discontinuo porque la suma diverge.
- **Puente con la DTFT y Estabilidad**: En el paso 4 el corte es el propio círculo unitario. Deslizar el polo a través de él muestra cuándo la DTFT deja de existir y el sistema deja de ser estable.
- **Misma $X(z)$, Secuencias Distintas**: Los pares causal y anticausal comparten $\frac{z}{z-a}$ y solo difieren en la ROC.
- **Pares Notables**: Impulso, escalón, rampa, exponenciales causal, anticausal y bilateral, seno y coseno causales y amortiguados.

---

### 6. Convolución Discreta (`#dconv`)

La suma de convolución, muestra a muestra:

$$y[n] = x[n] * h[n] = \sum_{k=-\infty}^{+\infty} x[k]\, h[n-k]$$

Recursos del módulo:
- **Cuatro Carriles de Muestras**: $x[k]$, $h[n-k]$, los productos $x[k]\,h[n-k]$ e $y[n]$ comparten el mismo eje $k$, de modo que $y[n]$ nace justo bajo el origen de $h[n-k]$.
- **Paso a Paso**: Cambio de variable $n \to k$, reflexión $h[-k]$, desplazamiento $h[n-k]$ y sumatoria, con la franja de solapamiento destacada en el piso.
- **La Suma Desarrollada**: Para cada $n$, el cuaderno muestra los productos que entran en la suma, junto con la regla de la longitud $L_y = L_x + L_h - 1$.
- **Tabla Clicable de $y[n]$**: Cada fila muestra el rango de $k$ que se solapa y lleva el escenario directamente a esa muestra.
- **Siete Ejemplos, una Idea Cada Uno**: Rectángulo con rectángulo (triángulo), rectángulo con exponencial, impulso (identidad), retardo, media móvil, primera diferencia y eco.

---

### 7. Transformada de Fourier de Tiempo Discreto (`#dtft`)

El espectro continuo y periódico de una secuencia:

$$X(e^{j\Omega}) = \sum_{n=-\infty}^{+\infty} x[n]\, e^{-j\Omega n}, \qquad x[n] = \frac{1}{2\pi}\int_{2\pi} X(e^{j\Omega})\, e^{j\Omega n}\, d\Omega$$

Recursos del módulo:
- **Tres Carriles**: Muestras de $x[n]$ al fondo, $|X(e^{j\Omega})|$ en el medio y la fase $\angle X(e^{j\Omega})$ al frente.
- **Suma Parcial $X_N(\Omega)$**: El deslizador elige cuántas muestras entran en la suma. Se ve la convergencia, el fenómeno de Gibbs en el pasa-bajos ideal y los picos del coseno creciendo hasta volverse impulsos.
- **Periodicidad $2\pi$**: El espectro se dibuja de $-3\pi$ a $3\pi$ con el período fundamental destacado.
- **Sonda en $\Omega$ y Lectura como Filtro**: Un marcador recorre la frecuencia y el cuaderno muestra la ganancia, la fase y la respuesta a $\cos(\Omega n)$, clasificando el par como pasa-bajos, pasa-altos o pasa-todo.
- **Parseval y Puente con la Transformada Z**: La energía coincide en ambos dominios, y $X(e^{j\Omega})$ es $X(z)$ sobre el círculo unitario.
- **Pares Notables**: Pulso rectangular, exponenciales causal y bilateral, pasa-bajos ideal, coseno, media móvil, primera diferencia e impulso.

---

### 8. DFT y FFT (`#dft`)

La transformada que la computadora realmente calcula, finita en ambos dominios:

$$X[k] = \sum_{n=0}^{N-1} x[n]\, e^{-j2\pi kn/N}, \qquad x[n] = \frac{1}{N}\sum_{k=0}^{N-1} X[k]\, e^{j2\pi kn/N}$$

Recursos del módulo:
- **Dos Carriles Alineados**: $N$ muestras de $x[n]$ al fondo y $N$ muestras de $|X[k]|$ al frente, con $N$ de 4 a 64.
- **La DFT Muestrea la DTFT**: La envolvente continua aparece detrás de las muestras, mostrando que $X[k] = X(e^{j\Omega})$ en $\Omega = 2\pi k/N$ y que la resolución es $2\pi/N$.
- **Fuga Espectral**: Un coseno con 2 ciclos en la ventana da dos líneas limpias; con 2,5 ciclos, la energía se reparte por todos los bins. Las ventanas de Hann y Hamming, en el segundo deslizador, contienen esa dispersión.
- **Lectura de un Bin**: El deslizador elige $k$ y dibuja sobre $x[n]$ el coseno de esa frecuencia. El cuaderno muestra valor, fase, frecuencia y por qué la mitad superior corresponde a las frecuencias negativas.
- **FFT con Diagrama de Mariposas**: En el paso 4 la red de mariposas conecta $x[n]$ (en orden de bits invertidos) con $X[k]$, y el cuaderno compara $N^2$ productos con $\frac{N}{2}\log_2 N$ mariposas, contadas durante la ejecución.
- **Ocho Señales**: Coseno en el bin y fuera de él, dos tonos, pulso rectangular, impulso, alternado, exponencial y rampa.

---

## Fundamentos Didácticos y de Interfaz

- **Proyecciones de Cámara**: Cambio inmediato entre `3D Libre`, `2D Tiempo (Frontal)`, `2D Espectro (Lateral)` y `Vista Superior`.
- **Modo Proyector**: Fondo blanco puro (`#ffffff`), ejes en negro sólido (`#000000`), trazo reforzado a 1.55x y curvas de alta saturación (`#00449e`, `#be123c`, `#047857`), calibrados para proyectores y pantallas de auditorio.
- **Tema Dark Technical**: Entorno oscuro antirreflejo (`#090b10`) para sesiones prolongadas de laboratorio.
- **Arquitectura Móvil**: Diseño responsivo con panel deslizable inferior (*bottom-sheet*), navegación táctil orbital 3D, teclado matemático virtual (`⌨`), barra rápida de funciones (`u(t)`, `rect(t)`, `tri(t)`, `δ(t)`, `sinc(t)`) y selector de teclado nativo (`Abc`).
- **Modo Zen (`Z`)**: Oculta paneles laterales para dedicar el 100% de la pantalla al escenario 3D.
- **Soporte Multilingüe**: Interfaz con conmutación en tiempo real y almacenamiento de preferencias locales (`localStorage`).
- **Cuaderno en Foco**: El botón "Abrir cuaderno" saca la deducción del panel y la pone en el lugar del escenario, como una hoja rayada en la que cada línea se escribe a mano, con el bolígrafo siguiendo el trazo. Cambiar de paso es una página nueva; mover el deslizador actualiza los números en el lugar.

---

## Atajos de Teclado

| Tecla | Acción |
| :--- | :--- |
| `Espacio` | Reproducir o pausar simulación |
| `1`, `2`, `3`, `4` | Salto directo a los pasos 1 a 4 de Convolución |
| `[` / `]` | Alternar módulo: Convolución $\to$ Convolución Discreta $\to$ Fourier $\to$ CTFT $\to$ DTFT $\to$ DFT $\to$ Laplace $\to$ Z |
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
│   ├── utilities.css   # CSS utilitario estático precompilado (zero-build)
│   └── styles.css      # Sistema de diseño, temas (proyector, oscuro, claro) y vista móvil
├── js/
│   ├── app.js          # Punto de entrada principal y bucle de animación a 120 FPS
│   ├── state.js        # Gestor de estado reactivo y persistencia local
│   ├── i18n.js         # Diccionario de traducción y etiquetas matemáticas
│   ├── math-engine.js  # Motor de cálculo analítico, detector de soporte, Fourier y CTFT
│   ├── presets.js      # Biblioteca de casos canónicos y ejercicios de examen
│   ├── stage-3d.js     # Renderizado Canvas 2D con cámara en perspectiva propia
│   ├── notebook.js     # Generador de cuaderno didáctico paso a paso
│   ├── audio.js        # Sintetizador aditivo en tiempo real mediante Web Audio API
│   └── ui.js           # Controladores de interfaz, HUD y teclado matemático
├── tests/
│   └── math-engine.test.js # Suite de pruebas automatizadas (Convolución, Fourier, CTFT, Parseval)
├── assets/
│   ├── demo.gif        # Registro en alta resolución de la simulación interactiva
│   ├── favicon.svg     # Favicon vectorial
│   └── og-banner.svg   # Imagen Open Graph para enlaces sociales (1200x630)
├── server.js           # Servidor estático Node.js sin dependencias
├── sitemap.xml         # Mapa de sitio para indexación
├── robots.txt          # Reglas para rastreadores web
└── manifest.json       # Manifiesto de aplicación web progresiva (PWA)
```

---

## Ejecución Local y Pruebas

Con Node.js:

```bash
npm start
npm test
```

Con Python 3:

```bash
python -m http.server 3000
```

Enlaces directos a módulos:
- `http://localhost:3000/#convolution`
- `http://localhost:3000/#fourier`
- `http://localhost:3000/#ctft`

---

## Comentarios y Contribución

- **Desde el sitio**: el botón **Feedback**, en la esquina del escenario, abre un formulario que convierte el reporte en una issue, ya con el módulo y el paso en que está la persona.
- **Desde el navegador, sin git**: la misma ventana lleva al editor web de GitHub, que crea el fork y el pull request por sí solo.
- **Guía para principiantes** (en portugués): [CONTRIBUTING.md](CONTRIBUTING.md).
- **Envío sin cuenta de GitHub**: depende del Worker en [`worker/`](worker/README.md), que debe publicarse en Cloudflare.

---

## Referencias Académicas

- B. P. Lathi, *Señales y Sistemas Lineales*, 2ª ed., Oxford University Press.
- Alan V. Oppenheim, Alan S. Willsky, S. Hamid Nawab, *Señales y Sistemas*, 2ª ed., Pearson / Prentice Hall.
- Facultad de Ingeniería de Telecomunicaciones (FEST), Universidad Federal de Pará (UFPA).

---

## Licencia

Distribuido bajo la [Licencia MIT](./LICENSE).
