<div align="center">

[English](./README.md) · **Português** · [Español](./README.es.md)

# Sinais e Sistemas de Forma Interativa

Laboratório interativo para convolução contínua, decomposição em séries de Fourier e transformada de Fourier de tempo contínuo (CTFT) no espaço tridimensional $(t, \tau, z)$ e $(t, \omega, z)$.

[![Live Demo](https://img.shields.io/badge/Live_Demo-joaosnet.github.io-090b10?style=flat-square&logo=github)](https://joaosnet.github.io/interactive-signals-and-systems/)
[![Motor Gráfico](https://img.shields.io/badge/Motor-Canvas_2D_%2B_Three.js-00449e?style=flat-square)](https://threejs.org/)
[![Desempenho](https://img.shields.io/badge/Render-Loop_Fixo_120_FPS-047857?style=flat-square)](https://developer.mozilla.org/pt-BR/docs/Web/API/window/requestAnimationFrame)
[![Currículo](https://img.shields.io/badge/Curr%C3%ADculo-UFPA_Telecom-be123c?style=flat-square)](https://ufpa.br/)
[![Licença](https://img.shields.io/badge/Licen%C3%A7a-MIT-gray?style=flat-square)](./LICENSE)

<br/>

<img src="./assets/demo.gif" alt="Demonstração 3D de Sinais e Sistemas Interativos" width="100%" style="border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1);" />

</div>

---

## Visão Geral

O *Sinais e Sistemas de Forma Interativa* é um ambiente de simulação computacional executado diretamente no navegador web, projetado para o ensino e aprendizado de engenharia. Ele processa e renderiza transformações de sinais em coordenadas 3D a 120 FPS por meio da API Canvas 2D nativa com projeção de câmera Three.js.

O projeto não requer etapas de compilação (*zero-build*), dispensa bibliotecas externas de plotagem e opera 100% no cliente.

- **Aplicação Online**: [joaosnet.github.io/interactive-signals-and-systems](https://joaosnet.github.io/interactive-signals-and-systems/)
- **Contexto Institucional**: Faculdade de Engenharia de Telecomunicações (FEST), Universidade Federal do Pará (UFPA).
- **Fundamentação Teórica**: Alinhado com as metodologias de B. P. Lathi (*Sinais e Sistemas Lineares*) e A. V. Oppenheim (*Sinais e Sistemas*).

---

## Módulos Principais

### 1. Convolução Contínua (`#convolution`)

Resolve numericamente e analiticamente a integral de convolução contínua:

$$y(t) = x(t) \ast h(t) = \int_{-\infty}^{+\infty} x(\tau) h(t - \tau) \, d\tau$$

A resolução visual divide o processo em quatro etapas clássicas:

1. **Substituição de Variável ($t \to \tau$)**: Mapeia as funções $x(t)$ e $h(t)$ para a variável muda de integração $\tau$.
2. **Reflexão Temporal**: Espelha horizontalmente a resposta ao impulso para obter $h(-\tau)$.
3. **Deslocamento Temporal**: Translada a função invertida pela posição $t$, gerando $h(t - \tau)$.
4. **Integração do Produto**: Calcula a área sob o produto $x(\tau) h(t - \tau)$ correspondente ao valor de $y(t)$ no instante avaliado.

Recursos do módulo:
- **Detector Automático de Suporte e Regimes**: Identifica suportes compactos $[a, b]$ e pontos de transição analítica para sinais por partes arbitrários.
- **Superfície 3D em Cascata (Waterfall)**: Projeta os cortes históricos de convolução ao longo do eixo ortogonal $z$ para visualização do acúmulo temporal.
- **Comutatividade Instantânea**: Alterna entre $x(t) \ast h(t)$ e $h(t) \ast x(t)$ com recálculo em tempo real.
- **Caderno Didático Passo a Passo**: Apresenta limites de integração, integrais definidas e frações exatas.
- **Presets de Livros-Texto**: Casos canônicos de provas e listas (pulsos retangulares, exponenciais causais, rampas e dipolos).

### 2. Analisador de Séries de Fourier (`#fourier`)

Decompõe sinais periódicos $f(t)$ de período $T_0$ e frequência fundamental $\omega_0 = 2\pi / T_0$ em três representações matemáticas:

- **Forma Trigonométrica Compacta**:
  $$f(t) \approx a_0 + \sum_{n=1}^{N} C_n \cos(n\omega_0 t + \theta_n)$$
- **Forma Trigonométrica**:
  $$f(t) \approx a_0 + \sum_{n=1}^{N} \left[ a_n \cos(n\omega_0 t) + b_n \sin(n\omega_0 t) \right]$$
- **Forma Exponencial Complexa**:
  $$f(t) \approx \sum_{n=-N}^{N} D_n e^{j n \omega_0 t}$$

Recursos do módulo:
- **Dinâmica Visual de Khutoryansky**: Propagação contínua de ondas senoidais viajantes no espaço tridimensional tempo-frequência.
- **Mapeamento Tridimensional**:
  - Plano frontal ($z = 0$): Onda periódica original ao longo de $2.5 T_0$.
  - Eixo de profundidade ($z = n$): Harmônicas individuais ordenadas por frequência.
  - Parede espectral: Espectro de linhas discretas $|C_n|$ e $|D_n|$ com marcadores de fase.
  - Curva de síntese: Soma parcial $\sum_{n=1}^N$ exibindo o fenômeno de Gibbs nas descontinuidades de salto.
- **Classificação de Simetrias**: Reconhecimento automático de simetrias Par, Ímpar, Meia-Onda ($f(t - T_0/2) = -f(t)$) e Quarto de Onda, destacando coeficientes nulos.
- **Conservação de Potência de Parseval**: Cálculo de potência média total $P_{\text{total}}$, potência acumulada $P_N$ e eficiência de captura:
  $$\eta = \frac{P_N}{P_{\text{total}}} \times 100\%$$
- **Sintetizador Web Audio**: Reprodução acústica da forma de onda sintetizada e audição isolada de harmônicas.
- **Isolamento de Harmônicas**: Ao clicar em uma linha da tabela, a harmônica correspondente é destacada no palco 3D enquanto as demais são esmaecidas.

### 3. Transformada de Fourier Contínua (`#ctft`)

Avalia o par direto e inverso da Transformada de Fourier de Tempo Contínuo:

$$X(\omega) = \int_{-\infty}^{+\infty} x(t) e^{-j\omega t} \, dt \quad \Longleftrightarrow \quad x(t) = \frac{1}{2\pi} \int_{-\infty}^{+\infty} X(\omega) e^{j\omega t} \, d\omega$$

Recursos do módulo:
- **Representação em Planos Duplos**: O sinal aperiódico $x(t)$ ocupa o plano frontal ($z = 0$), enquanto a curva contínua de magnitude espectral $|X(\omega)|$ é desenhada no plano traseiro ($z = Z_{\max}$).
- **Ponte de Khutoryansky ($T_0 \to \infty$)**: Controle interativo de expansão do período mostrando as raias discretas $T_0 D_n$ convergindo para o envelope contínuo $X(\omega)$.
- **Conservação de Energia de Rayleigh-Parseval**: Verificação numérica em tempo real da equivalência:
  $$\int_{-\infty}^{+\infty} |x(t)|^2 \, dt = \frac{1}{2\pi} \int_{-\infty}^{+\infty} |X(\omega)|^2 \, d\omega$$
- **Pares Canônicos Analíticos**: Pulso retangular, decaimento exponencial causal, pulso triangular e exponencial bilateral.
- **Dedução Analítica em Quatro Passos**: Passo 1 (Sinal e Definição), Passo 2 (Par de Transformada), Passo 3 (Espectro Contínuo) e Passo 4 (Balanço de Parseval).

---

## Fundamentos Didáticos e de Interface

- **Projeções de Câmera**: Alternância imediata entre `3D Livre`, `2D Tempo (Frontal)`, `2D Espectro (Lateral)` e `Vista Superior`.
- **Modo Projetor**: Fundo branco absoluto (`#ffffff`), eixos em preto sólido (`#000000`), traço com espessura 1.55x e curvas de alta saturação (`#00449e`, `#be123c`, `#047857`), calibrados para projetores de salas de aula e auditórios.
- **Tema Dark Technical**: Ambiente escuro de baixo brilho (`#090b10`) para trabalho prolongado em laboratório.
- **Experiência Móvel**: Layout com painel retrátil inferior (*bottom-sheet*), gestos de toque na órbita 3D e teclado matemático virtual com atalhos diretos (`u(t)`, `rect(t)`, `tri(t)`, `δ(t)`, `sinc(t)`).
- **Modo Zen (`Z`)**: Oculta barras laterais e dedica 100% da viewport ao palco 3D.
- **Interface Bilíngue**: Suporte a Inglês e Português do Brasil com armazenamento local de preferências (`localStorage`).

---

## Atalhos de Teclado

| Tecla | Função |
| :--- | :--- |
| `Espaço` | Reproduzir ou pausar o loop de simulação |
| `1`, `2`, `3`, `4` | Salto direto para as etapas 1 a 4 da Convolução |
| `Tab` | Alternar módulo: Convolução $\to$ Fourier $\to$ CTFT |
| `Z` | Alternar tela cheia / Modo Zen |
| `M` | Ligar ou desligar sintetizador de áudio Web Audio |
| `←` / `→` | Ajuste incremental do parâmetro de tempo $t$ ou frequência $\omega$ |
| `Esc` | Fechar modal ou popover ativo |

---

## Arquitetura do Repositório

```
interactive-signals-and-systems/
├── index.html          # Estrutura HTML5 semântica, metadados SEO e schema JSON-LD
├── css/
│   └── styles.css      # Sistema de design, temas (projetor, dark, light) e layout mobile
├── js/
│   ├── app.js          # Ponto de entrada e loop de animação a 120 FPS
│   ├── state.js        # Gerenciamento de estado reativo e persistência local
│   ├── i18n.js         # Dicionário de tradução e rótulos matemáticos
│   ├── math-engine.js  # Motor analítico, detector de suporte, decomposição de Fourier e CTFT
│   ├── presets.js      # Banco de sinais canônicos de provas e literatura
│   ├── stage-3d.js     # Renderizador Canvas 2D com transformações Three.js
│   ├── notebook.js     # Caderno de resolução didática passo a passo
│   ├── audio.js        # Síntese aditiva em tempo real via Web Audio API
│   └── ui.js           # Controles de navegação, HUD e teclado virtual
├── assets/
│   ├── demo.gif        # Registro em alta definição da simulação interativa
│   ├── favicon.svg     # Ícone vetorial
│   └── og-banner.svg   # Banner Open Graph para compartilhamento social (1200x630)
├── sitemap.xml         # Mapa de indexação para motores de busca
├── robots.txt          # Diretrizes para indexadores
└── manifest.json       # Manifesto de aplicação web progressiva (PWA)
```

---

## Execução Local

Servidor local via Python 3:

```bash
python -m http.server 3000
```

Servidor local via Node.js:

```bash
npx serve .
```

Acesso direto por âncoras de rota:
- `http://localhost:3000/#convolution`
- `http://localhost:3000/#fourier`
- `http://localhost:3000/#ctft`

---

## Referências Acadêmicas

- B. P. Lathi, *Sinais e Sistemas Lineares*, 2ª ed., Bookman / Oxford University Press.
- Alan V. Oppenheim, Alan S. Willsky, S. Hamid Nawab, *Sinais e Sistemas*, 2ª ed., Pearson / Prentice Hall.
- Faculdade de Engenharia de Telecomunicações (FEST), Universidade Federal do Pará (UFPA).

---

## Licença

Distribuído sob a [Licença MIT](./LICENSE).
