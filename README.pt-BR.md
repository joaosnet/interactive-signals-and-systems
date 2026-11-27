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
- **Representação em Planos Duplos**: O sinal aperiódico $x(t)$ ocupa o plano frontal ($z = 0$), enquanto o espectro contínuo de magnitude $|X(\omega)|$ e a curva de fase $\angle X(\omega)$ são desenhados nos planos espectrais.
- **Convenção UFPA / Lathi**: Padronização unificada $\operatorname{sinc}(x) = \sin(x)/x$ (com atalho opcional `sincpi(x)`) e $\operatorname{tri}(t/a) \leftrightarrow a\,\operatorname{sinc}^2(\omega a / 2)$.
- **Ponte de Khutoryansky ($T_0 \to \infty$)**: Controle interativo de expansão do período mostrando as raias discretas $T_0 D_n$ convergindo para o envelope contínuo $X(\omega)$.
- **Conservação de Energia de Rayleigh-Parseval**: Verificação numérica em tempo real da equivalência:
  $$\int_{-\infty}^{+\infty} |x(t)|^2 \, dt = \frac{1}{2\pi} \int_{-\infty}^{+\infty} |X(\omega)|^2 \, d\omega$$
- **Pares Canônicos Analíticos**: Pulso retangular, decaimento exponencial causal, pulso triangular, exponencial bilateral, gaussiana (autodual) e sinc (dual do retângulo).
- **Propriedades ao Vivo (seletor "Explorar")**: Deslocamento $x(t-t_0)$, escala $x(at)$ e modulação $x(t)\cos(\omega_0 t)$. O sinal e o espectro originais ficam como "fantasmas" tracejados atrás do resultado, e o caderno mostra a regra, o caso atual e o que muda em energia e área.
- **Transformada Inversa Limitada em Banda**: $x_W(t) = \frac{1}{2\pi}\int_{-W}^{W} X(\omega)e^{j\omega t}d\omega$ é desenhada sobre $x(t)$ enquanto o slider abre a banda $W$, mostrando a fração de energia capturada e o fenômeno de Gibbs.
- **Tabela de Propriedades**: Deslocamento, escala, modulação, inversa, linearidade, dualidade, convolução, derivada e deslocamento em frequência; as quatro primeiras linhas ligam o modo correspondente no palco.
- **Dedução Analítica em Quatro Passos**: Passo 1 (Sinal e Definição), Passo 2 (Par de Transformada), Passo 3 (Espectro Contínuo) e Passo 4 (Balanço de Parseval).

---

### 4. Transformada de Laplace (`#laplace`)

Estende a Transformada de Fourier ao plano complexo $s$:

$$X(s) = \int_{-\infty}^{+\infty} x(t)\, e^{-st} \, dt, \qquad s = \sigma + j\omega$$

Recursos do módulo:
- **Plano $s$ no Piso do Palco**: $\sigma$ na horizontal e $j\omega$ na profundidade, com polos ($\times$) e zeros ($\circ$) marcados e a região de convergência (ROC) sombreada.
- **Superfície $|X(s)|$**: A magnitude vira altura; os polos aparecem como "mastros de tenda".
- **Corte Vertical em $\sigma$**: A curva $|X(\sigma + j\omega)|$ é a Transformada de Fourier de $x(t)e^{-\sigma t}$. Fora da ROC o corte fica vermelho e tracejado, pois a integral diverge.
- **Ponte com Fourier e Estabilidade**: No passo 4 o corte é o próprio eixo $j\omega$. Deslizar o polo através dele mostra quando a Transformada de Fourier deixa de existir e o sistema deixa de ser estável.
- **Mesma $X(s)$, Sinais Diferentes**: Os pares causal e anticausal compartilham $\frac{1}{s+a}$ e diferem apenas na ROC.
- **Pares Notáveis**: Degrau, rampa, exponenciais causal, anticausal e bilateral, seno e cosseno causais e amortecidos.

---

### 5. Transformada Z (`#z`)

A contraparte discreta de Laplace, no plano complexo $z$:

$$X(z) = \sum_{n=-\infty}^{+\infty} x[n]\, z^{-n}, \qquad z = r\,e^{j\Omega}$$

Recursos do módulo:
- **Plano $z$ no Piso do Palco**: $\operatorname{Re}\{z\}$ na horizontal e $\operatorname{Im}\{z\}$ na profundidade, com polos ($\times$), zeros ($\circ$), o círculo unitário e a região de convergência (ROC) sombreada como um anel.
- **Hastes de $x[n]$**: A parede do fundo mostra a sequência amostra a amostra e, no corte, a sequência $x[n]\,r^{-n}$ que de fato é somada.
- **Superfície $|X(z)|$ em Malha Polar**: A magnitude vira altura; os polos aparecem como "mastros de tenda".
- **Corte Circular em $|z| = r$**: A curva $|X(r e^{j\Omega})|$ é a DTFT de $x[n]\,r^{-n}$, enrolada em volta do círculo (por isso é periódica em $\Omega$). Fora da ROC o corte fica vermelho e tracejado, pois a soma diverge.
- **Ponte com a DTFT e Estabilidade**: No passo 4 o corte é o próprio círculo unitário. Deslizar o polo através dele mostra quando a DTFT deixa de existir e o sistema deixa de ser estável.
- **Mesma $X(z)$, Sequências Diferentes**: Os pares causal e anticausal compartilham $\frac{z}{z-a}$ e diferem apenas na ROC.
- **Pares Notáveis**: Impulso, degrau, rampa, exponenciais causal, anticausal e bilateral, seno e cosseno causais e amortecidos.

---

### 6. Convolução Discreta (`#dconv`)

A soma de convolução, amostra a amostra:

$$y[n] = x[n] * h[n] = \sum_{k=-\infty}^{+\infty} x[k]\, h[n-k]$$

Recursos do módulo:
- **Quatro Trilhos de Hastes**: $x[k]$, $h[n-k]$, os produtos $x[k]\,h[n-k]$ e $y[n]$ compartilham o mesmo eixo $k$, de modo que $y[n]$ nasce exatamente sob a origem de $h[n-k]$.
- **Passo a Passo**: Troca de variável $n \to k$, reflexão $h[-k]$, deslocamento $h[n-k]$ e somatório, com a faixa de sobreposição destacada no piso.
- **Conta Aberta no Caderno**: Para cada $n$, os produtos que entram na soma aparecem um a um, junto com a regra do comprimento $L_y = L_x + L_h - 1$.
- **Tabela Clicável de $y[n]$**: Cada linha mostra a faixa de $k$ que se sobrepõe e leva o palco direto para aquela amostra.
- **Sete Exemplos com uma Ideia Cada**: Retângulo com retângulo (triângulo), retângulo com exponencial, impulso (identidade), atraso, média móvel, primeira diferença e eco.

---

### 7. Transformada de Fourier de Tempo Discreto (`#dtft`)

O espectro contínuo e periódico de uma sequência:

$$X(e^{j\Omega}) = \sum_{n=-\infty}^{+\infty} x[n]\, e^{-j\Omega n}, \qquad x[n] = \frac{1}{2\pi}\int_{2\pi} X(e^{j\Omega})\, e^{j\Omega n}\, d\Omega$$

Recursos do módulo:
- **Três Trilhos**: Hastes de $x[n]$ ao fundo, $|X(e^{j\Omega})|$ no meio e a fase $\angle X(e^{j\Omega})$ na frente.
- **Soma Parcial $X_N(\Omega)$**: O slider escolhe quantas amostras entram na soma. Dá para ver a convergência, o fenômeno de Gibbs no passa-baixas ideal e os picos do cosseno crescendo até virarem impulsos.
- **Periodicidade $2\pi$**: O espectro é desenhado de $-3\pi$ a $3\pi$ com o período fundamental destacado.
- **Sonda em $\Omega$ e Leitura como Filtro**: Um marcador percorre a frequência e o caderno mostra o ganho, a fase e a resposta a $\cos(\Omega n)$, classificando o par como passa-baixas, passa-altas ou passa-tudo.
- **Parseval e Ponte com a Transformada Z**: A energia confere nos dois domínios, e $X(e^{j\Omega})$ é $X(z)$ sobre o círculo unitário.
- **Pares Notáveis**: Pulso retangular, exponenciais causal e bilateral, passa-baixas ideal, cosseno, média móvel, primeira diferença e impulso.

---

### 8. DFT e FFT (`#dft`)

A transformada que o computador de fato calcula, finita nos dois domínios:

$$X[k] = \sum_{n=0}^{N-1} x[n]\, e^{-j2\pi kn/N}, \qquad x[n] = \frac{1}{N}\sum_{k=0}^{N-1} X[k]\, e^{j2\pi kn/N}$$

Recursos do módulo:
- **Dois Trilhos Alinhados**: $N$ hastes de $x[n]$ ao fundo e $N$ hastes de $|X[k]|$ na frente, com $N$ de 4 a 64.
- **A DFT Amostra a DTFT**: A envoltória contínua aparece atrás das hastes, mostrando que $X[k] = X(e^{j\Omega})$ em $\Omega = 2\pi k/N$ e que a resolução é $2\pi/N$.
- **Vazamento Espectral**: Um cosseno com 2 ciclos na janela dá duas linhas limpas; com 2,5 ciclos, a energia se espalha por todos os bins.
- **Leitura de um Bin**: O slider escolhe $k$ e desenha sobre $x[n]$ o cosseno daquela frequência. O caderno mostra valor, fase, frequência e por que a metade superior corresponde às frequências negativas.
- **FFT com Diagrama de Borboletas**: No passo 4 a rede de borboletas liga $x[n]$ (em ordem de bits invertidos) a $X[k]$, e o caderno compara $N^2$ produtos com $\frac{N}{2}\log_2 N$ borboletas, contadas na execução.
- **Oito Sinais**: Cosseno no bin e fora dele, dois tons, pulso retangular, impulso, alternado, exponencial e rampa.

---

## Fundamentos Didáticos e de Interface

- **Projeções de Câmera**: Alternância imediata entre `3D Livre`, `2D Tempo (Frontal)`, `2D Espectro (Lateral)` e `Vista Superior`.
- **Modo Projetor**: Fundo branco absoluto (`#ffffff`), eixos em preto sólido (`#000000`), traço com espessura 1.55x e curvas de alta saturação (`#00449e`, `#be123c`, `#047857`), calibrados para projetores de salas de aula e auditórios.
- **Tema Dark Technical**: Ambiente escuro de baixo brilho (`#090b10`) para trabalho prolongado em laboratório.
- **Experiência Móvel**: Layout com painel retrátil inferior (*bottom-sheet*), gestos de toque na órbita 3D, teclado matemático virtual (`⌨`), barra rápida de funções (`u(t)`, `rect(t)`, `tri(t)`, `δ(t)`, `sinc(t)`) e alternância para teclado nativo (`Abc`).
- **Modo Zen (`Z`)**: Oculta barras laterais e dedica 100% da viewport ao palco 3D.
- **Interface Bilíngue**: Suporte a Inglês e Português do Brasil com armazenamento local de preferências (`localStorage`).
- **Caderno em Foco**: O botão "Abrir caderno" tira a dedução do painel e a põe no lugar do palco, como uma folha pautada em que cada linha é escrita à mão, com a caneta acompanhando o traço. Trocar de passo vira uma página nova; mexer no slider atualiza os números no lugar.

---

## Atalhos de Teclado

| Tecla | Função |
| :--- | :--- |
| `Espaço` | Reproduzir ou pausar o loop de simulação |
| `1`, `2`, `3`, `4` | Salto direto para as etapas 1 a 4 da Convolução |
| `[` / `]` | Alternar módulo: Convolução $\to$ Convolução Discreta $\to$ Fourier $\to$ CTFT $\to$ DTFT $\to$ DFT $\to$ Laplace $\to$ Z |
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
│   ├── utilities.css   # CSS utilitário estático pré-compilado (zero-build)
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
├── tests/
│   └── math-engine.test.js # Suíte de testes automatizados (Convolução, Fourier, CTFT e Parseval)
├── assets/
│   ├── demo.gif        # Registro em alta definição da simulação interativa
│   ├── favicon.svg     # Ícone vetorial
│   └── og-banner.svg   # Banner Open Graph para compartilhamento social (1200x630)
├── server.js           # Servidor estático Node.js sem dependências
├── sitemap.xml         # Mapa de indexação para motores de busca
├── robots.txt          # Diretrizes para indexadores
└── manifest.json       # Manifesto de aplicação web progressiva (PWA)
```

---

## Execução Local e Testes

Servidor local e suíte de testes via Node.js:

```bash
npm start
npm test
```

Ou servidor local via Python 3:

```bash
python -m http.server 3000
```

Acesso direto por âncoras de rota:
- `http://localhost:3000/#convolution`
- `http://localhost:3000/#fourier`
- `http://localhost:3000/#ctft`

---

## Feedback e Contribuição

- **Pelo site**: o botão **Feedback**, no canto do palco, abre um formulário que transforma o relato em uma issue, já com o módulo e o passo em que a pessoa está.
- **Pelo navegador, sem git**: a mesma janela leva ao editor web do GitHub, que cria o fork e o pull request sozinho.
- **Guia para iniciantes**: [CONTRIBUTING.md](CONTRIBUTING.md).
- **Envio sem conta no GitHub**: depende do Worker em [`worker/`](worker/README.md), que precisa ser publicado na Cloudflare.

---

## Referências Acadêmicas

- B. P. Lathi, *Sinais e Sistemas Lineares*, 2ª ed., Bookman / Oxford University Press.
- Alan V. Oppenheim, Alan S. Willsky, S. Hamid Nawab, *Sinais e Sistemas*, 2ª ed., Pearson / Prentice Hall.
- Faculdade de Engenharia de Telecomunicações (FEST), Universidade Federal do Pará (UFPA).

---

## Licença

Distribuído sob a [Licença MIT](./LICENSE).
