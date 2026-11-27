# Graph Report - Sinais e Sistemas forma interativa  (2026-11-27)

## Corpus Check
- 69 files · ~98,202 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .css 2, .xml 1)

## Summary
- 663 nodes · 1801 edges · 27 communities (26 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eecc7b4f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- stage-3d.js
- Como contribuir
- z.js
- events.js
- Interactive Signals and Systems
- dft.js
- manifest.json
- Señales y Sistemas de Forma Interactiva
- server.js
- laplace.js
- package.json
- dtft.js
- dconv.js
- notebook-sheet.js
- feedback.js
- notebook.js
- Módulos Principais
- bug.yml
- conteudo.yml
- body
- contact_links
- PULL_REQUEST_TEMPLATE.md
- Módulos Principales
- state.js
- Worker de feedback (envio sem conta)
- Sinais e Sistemas de Forma Interativa

## God Nodes (most connected - your core abstractions)
1. `initUIEventListeners()` - 42 edges
2. `renderMath()` - 30 edges
3. `tx()` - 29 edges
4. `updateScene3D()` - 26 edges
5. `state` - 26 edges
6. `updateNotebookUI()` - 25 edges
7. `switchModule()` - 23 edges
8. `activeModule()` - 22 edges
9. `langKey()` - 19 edges
10. `loc()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `expo()` --calls--> `calculateCTFTData()`  [EXTRACTED]
  tests/ctft-extras.test.js → js/math-engine.js
- `rect()` --calls--> `calculateCTFTData()`  [EXTRACTED]
  tests/ctft-extras.test.js → js/math-engine.js
- `tri()` --calls--> `calculateCTFTData()`  [EXTRACTED]
  tests/ctft-extras.test.js → js/math-engine.js
- `assertMatchesSum()` --calls--> `numericZ()`  [EXTRACTED]
  tests/z-engine.test.js → js/z-engine.js
- `renderGallery()` --calls--> `tx()`  [EXTRACTED]
  js/modules/dconv.js → js/lang.js

## Import Cycles
- 2-file cycle: `js/modules/ctft.js -> js/notebook.js -> js/modules/ctft.js`
- 2-file cycle: `js/modules/ctft.js -> js/ui.js -> js/modules/ctft.js`
- 3-file cycle: `js/modules/ctft.js -> js/ui.js -> js/modules/index.js -> js/modules/ctft.js`
- 3-file cycle: `js/modules/ctft.js -> js/ui.js -> js/notebook.js -> js/modules/ctft.js`
- 3-file cycle: `js/modules/convolution.js -> js/ui.js -> js/modules/index.js -> js/modules/convolution.js`
- 3-file cycle: `js/modules/fourier.js -> js/ui.js -> js/modules/index.js -> js/modules/fourier.js`
- 3-file cycle: `js/ui.js -> js/ui/widgets.js -> js/ui/hud.js -> js/ui.js`
- 4-file cycle: `js/modules/ctft.js -> js/ui.js -> js/ui/widgets.js -> js/ui/hud.js -> js/modules/ctft.js`
- 4-file cycle: `js/modules/fourier.js -> js/ui.js -> js/ui/widgets.js -> js/ui/hud.js -> js/modules/fourier.js`
- 5-file cycle: `js/modules/convolution.js -> js/notebook.js -> js/modules/ctft.js -> js/ui.js -> js/modules/index.js -> js/modules/convolution.js`
- 5-file cycle: `js/modules/ctft.js -> js/ui.js -> js/modules/index.js -> js/modules/fourier.js -> js/notebook.js -> js/modules/ctft.js`
- 5-file cycle: `js/modules/ctft.js -> js/ui.js -> js/ui/widgets.js -> js/ui/hud.js -> js/modules/index.js -> js/modules/ctft.js`
- 5-file cycle: `js/modules/ctft.js -> js/ui.js -> js/ui/widgets.js -> js/ui/hud.js -> js/notebook.js -> js/modules/ctft.js`
- 5-file cycle: `js/modules/convolution.js -> js/ui.js -> js/ui/widgets.js -> js/ui/hud.js -> js/modules/index.js -> js/modules/convolution.js`
- 5-file cycle: `js/modules/fourier.js -> js/ui.js -> js/ui/widgets.js -> js/ui/hud.js -> js/modules/index.js -> js/modules/fourier.js`

## Communities (27 total, 1 thin omitted)

### Community 0 - "stage-3d.js"
Cohesion: 0.15
Nodes (30): buildCurveAreaPolygon(), cam, camOrbit, customSignalCache, DEFAULT_CAMERA_TARGET, distToSegmentSq(), draw3DLine(), draw3DPolygon() (+22 more)

### Community 1 - "Como contribuir"
Cohesion: 0.22
Nodes (9): 1. Feedback pelo site, 2. Corrigir pelo navegador, 3. Rodar o projeto no seu computador, Como contribuir, Convenções, Cuidados com fórmulas, Dúvidas, Onde fica cada coisa (+1 more)

### Community 2 - "z.js"
Cohesion: 0.07
Nodes (60): countMarkers(), el(), num(), pointText(), RANGE, renderPZEditor(), paint(), snap() (+52 more)

### Community 3 - "events.js"
Cohesion: 0.09
Nodes (72): animationLoop(), lastFrameTime, initAudioContext(), killOscillator(), stopAudio(), toggleAudio(), updateAudioSynth(), ES (+64 more)

### Community 4 - "Interactive Signals and Systems"
Cohesion: 0.11
Nodes (18): 1. Continuous Convolution (`#convolution`), 2. Fourier Series Analyzer (`#fourier`), 3. Continuous-Time Fourier Transform (`#ctft`), 4. Laplace Transform (`#laplace`), 5. Z-Transform (`#z`), 6. Discrete Convolution (`#dconv`), 7. Discrete-Time Fourier Transform (`#dtft`), 8. DFT and FFT (`#dft`) (+10 more)

### Community 5 - "dft.js"
Cohesion: 0.15
Nodes (24): bitReverse(), calculateDFTData(), DFT_MAX_BITS, DFT_MIN_BITS, DFT_PRESETS, DFT_WINDOW_KEYS, DFT_WINDOWS, dftNaive() (+16 more)

### Community 6 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 7 - "Señales y Sistemas de Forma Interactiva"
Cohesion: 0.22
Nodes (9): Arquitectura del Repositorio, Atajos de Teclado, Comentarios y Contribución, Ejecución Local y Pruebas, Fundamentos Didácticos y de Interfaz, Licencia, Referencias Académicas, Señales y Sistemas de Forma Interactiva (+1 more)

### Community 8 - "server.js"
Cohesion: 0.22
Nodes (5): __dirname, __filename, MIME_TYPES, send(), server

### Community 9 - "laplace.js"
Cohesion: 0.08
Nodes (34): calculateLaplaceData(), expArg(), fmt(), LAPLACE_PRESETS, numericLaplace(), rocLatex(), sPlus(), AUX_SLIDER_ROW (+26 more)

### Community 10 - "package.json"
Cohesion: 0.29
Nodes (6): name, scripts, start, test, type, version

### Community 11 - "dtft.js"
Cohesion: 0.08
Nodes (38): calculateDTFTData(), customPreset(), DTFT_PRESETS, fmt(), numericDTFT(), spectralEnergy(), wrapOmega(), HTML_LANG (+30 more)

### Community 12 - "dconv.js"
Cohesion: 0.21
Nodes (19): calculateDConvData(), convolveSeq(), customSignal(), DCONV_PRESETS, DCONV_SIGNALS, fmt(), seqAt(), seqEnd() (+11 more)

### Community 13 - "notebook-sheet.js"
Cohesion: 0.30
Nodes (14): getNotebookSnapshot(), el(), headerText(), init(), keyOf(), refreshPage(), setNotebookFocus(), snapToRule() (+6 more)

### Community 14 - "feedback.js"
Cohesion: 0.11
Nodes (36): buildContext(), buildIssueUrl(), buildPayload(), buildTitle(), CONTRIBUTING_URL, DEFAULT_BRANCH, editUrl(), FEEDBACK_ENDPOINT (+28 more)

### Community 15 - "notebook.js"
Cohesion: 0.06
Nodes (79): applyCTFTProperty(), bandEnergyFraction(), clampModeValue(), complexX(), CTFT_MODE_SPECS, CTFT_MODES, curveCache, fmt() (+71 more)

### Community 16 - "Módulos Principais"
Cohesion: 0.22
Nodes (9): 1. Convolução Contínua (`#convolution`), 2. Analisador de Séries de Fourier (`#fourier`), 3. Transformada de Fourier Contínua (`#ctft`), 4. Transformada de Laplace (`#laplace`), 5. Transformada Z (`#z`), 6. Convolução Discreta (`#dconv`), 7. Transformada de Fourier de Tempo Discreto (`#dtft`), 8. DFT e FFT (`#dft`) (+1 more)

### Community 17 - "bug.yml"
Cohesion: 0.14
Nodes (13): description, label, placeholder, body, attributes, id, type, validations (+5 more)

### Community 18 - "conteudo.yml"
Cohesion: 0.14
Nodes (13): description, label, placeholder, body, attributes, id, type, validations (+5 more)

### Community 19 - "body"
Cohesion: 0.15
Nodes (12): description, label, placeholder, body, attributes, id, type, validations (+4 more)

### Community 20 - "contact_links"
Cohesion: 0.33
Nodes (5): blank_issues_enabled, contact_links, about, name, url

### Community 21 - "PULL_REQUEST_TEMPLATE.md"
Cohesion: 0.40
Nodes (4): Antes de enviar, Como conferir, O que mudou, Por quê

### Community 24 - "Módulos Principales"
Cohesion: 0.22
Nodes (9): 1. Convolución Continua (`#convolution`), 2. Analizador de Series de Fourier (`#fourier`), 3. Transformada de Fourier Continua (`#ctft`), 4. Transformada de Laplace (`#laplace`), 5. Transformada Z (`#z`), 6. Convolución Discreta (`#dconv`), 7. Transformada de Fourier de Tiempo Discreto (`#dtft`), 8. DFT y FFT (`#dft`) (+1 more)

### Community 25 - "state.js"
Cohesion: 0.10
Nodes (18): ATTR_TEXT, decorate(), init(), initialA11yContrast, initialA11yMotion, initialCTFTCustomPresets, initialCustomPresets, initialFontScale (+10 more)

### Community 26 - "Worker de feedback (envio sem conta)"
Cohesion: 0.25
Nodes (8): 1. Criar o token do GitHub, 2. Publicar o Worker, 3. Ligar o botão no site, 4. Testar, O que você precisa, Proteções que já estão no código, Testes, Worker de feedback (envio sem conta)

### Community 28 - "Sinais e Sistemas de Forma Interativa"
Cohesion: 0.22
Nodes (9): Arquitetura do Repositório, Atalhos de Teclado, Execução Local e Testes, Feedback e Contribuição, Fundamentos Didáticos e de Interface, Licença, Referências Acadêmicas, Sinais e Sistemas de Forma Interativa (+1 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `state` connect `events.js` to `stage-3d.js`, `z.js`, `dft.js`, `laplace.js`, `dtft.js`, `dconv.js`, `notebook-sheet.js`, `feedback.js`, `notebook.js`, `state.js`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `z.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06905370843989769 - nodes in this community are weakly interconnected._
- **Why does `renderMath()` connect `notebook.js` to `stage-3d.js`, `z.js`, `events.js`, `dft.js`, `laplace.js`, `dtft.js`, `dconv.js`, `notebook-sheet.js`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `events.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09401709401709402 - nodes in this community are weakly interconnected._
- **Why does `langKey()` connect `dtft.js` to `z.js`, `dft.js`, `laplace.js`, `notebook-sheet.js`, `feedback.js`, `notebook.js`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `Interactive Signals and Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `dft.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1477832512315271 - nodes in this community are weakly interconnected._