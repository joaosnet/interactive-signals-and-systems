# Graph Report - Sinais e Sistemas forma interativa  (2026-11-27)

## Corpus Check
- 59 files · ~92,340 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .css 2, .xml 1)

## Summary
- 625 nodes · 1458 edges · 24 communities (23 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `53285499`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- stage-3d.js
- Sinais e Sistemas de Forma Interativa
- z.js
- ui.js
- Interactive Signals and Systems
- dft.js
- manifest.json
- math-engine.js
- server.js
- laplace.js
- package.json
- dtft.js
- dconv.js
- state.js
- feedback.js
- math-engine.js
- Sinais e Sistemas de Forma Interativa
- bug.yml
- conteudo.yml
- body
- contact_links
- PULL_REQUEST_TEMPLATE.md
- notebook-sheet.js
- a11y.js

## God Nodes (most connected - your core abstractions)
1. `initUIEventListeners()` - 39 edges
2. `updateScene3D()` - 30 edges
3. `renderMath()` - 25 edges
4. `updateNotebookUI()` - 25 edges
5. `renderPresetGallery()` - 21 edges
6. `switchModule()` - 18 edges
7. `state` - 18 edges
8. `buildLaplaceCustom()` - 15 edges
9. `applyLanguage()` - 15 edges
10. `setHUDExpressionLive()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `expo()` --calls--> `calculateCTFTData()`  [EXTRACTED]
  tests/ctft-extras.test.js → js/math-engine.js
- `rect()` --calls--> `calculateCTFTData()`  [EXTRACTED]
  tests/ctft-extras.test.js → js/math-engine.js
- `tri()` --calls--> `calculateCTFTData()`  [EXTRACTED]
  tests/ctft-extras.test.js → js/math-engine.js
- `assertMatchesSum()` --calls--> `numericZ()`  [EXTRACTED]
  tests/z-engine.test.js → js/z-engine.js
- `animationLoop()` --calls--> `updateScene3D()`  [EXTRACTED]
  js/app.js → js/stage-3d.js

## Import Cycles
- None detected.

## Communities (24 total, 1 thin omitted)

### Community 0 - "stage-3d.js"
Cohesion: 0.16
Nodes (31): renderMath(), buildCurveAreaPolygon(), cam, camOrbit, customSignalCache, DEFAULT_CAMERA_TARGET, distToSegmentSq(), draw3DLine() (+23 more)

### Community 1 - "Sinais e Sistemas de Forma Interativa"
Cohesion: 0.06
Nodes (35): 1. Feedback pelo site, 2. Corrigir pelo navegador, 3. Rodar o projeto no seu computador, Como contribuir, Convenções, Cuidados com fórmulas, Dúvidas, Onde fica cada coisa (+27 more)

### Community 2 - "z.js"
Cohesion: 0.09
Nodes (38): AUX_SLIDER_ROW, bind(), syncAuxSlider(), auxSlider(), calc(), CAUSALITY_TEXT, circlePts(), clone() (+30 more)

### Community 3 - "ui.js"
Cohesion: 0.10
Nodes (58): animationLoop(), lastFrameTime, initAudioContext(), killOscillator(), stopAudio(), toggleAudio(), updateAudioSynth(), calculateFourierData() (+50 more)

### Community 4 - "Interactive Signals and Systems"
Cohesion: 0.11
Nodes (18): 1. Continuous Convolution (`#convolution`), 2. Fourier Series Analyzer (`#fourier`), 3. Continuous-Time Fourier Transform (`#ctft`), 4. Laplace Transform (`#laplace`), 5. Z-Transform (`#z`), 6. Discrete Convolution (`#dconv`), 7. Discrete-Time Fourier Transform (`#dtft`), 8. DFT and FFT (`#dft`) (+10 more)

### Community 5 - "dft.js"
Cohesion: 0.15
Nodes (23): bitReverse(), calculateDFTData(), DFT_MAX_BITS, DFT_MIN_BITS, DFT_PRESETS, DFT_WINDOW_KEYS, DFT_WINDOWS, dftNaive() (+15 more)

### Community 6 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 7 - "math-engine.js"
Cohesion: 0.11
Nodes (34): applyCTFTProperty(), bandEnergyFraction(), clampModeValue(), complexX(), CTFT_MODE_SPECS, CTFT_MODES, curveCache, fmt() (+26 more)

### Community 8 - "server.js"
Cohesion: 0.22
Nodes (5): __dirname, __filename, MIME_TYPES, send(), server

### Community 9 - "laplace.js"
Cohesion: 0.07
Nodes (53): calculateLaplaceData(), expArg(), fmt(), LAPLACE_PRESETS, numericLaplace(), rocLatex(), sPlus(), auxSlider() (+45 more)

### Community 10 - "package.json"
Cohesion: 0.29
Nodes (6): name, scripts, start, test, type, version

### Community 11 - "dtft.js"
Cohesion: 0.09
Nodes (34): calculateDTFTData(), customPreset(), DTFT_PRESETS, fmt(), numericDTFT(), spectralEnergy(), wrapOmega(), cached() (+26 more)

### Community 12 - "dconv.js"
Cohesion: 0.21
Nodes (19): calculateDConvData(), convolveSeq(), customSignal(), DCONV_PRESETS, DCONV_SIGNALS, fmt(), seqAt(), seqEnd() (+11 more)

### Community 13 - "state.js"
Cohesion: 0.08
Nodes (27): boundarySlowdown(), convolutionModule, SHIFT, SWEEP, fourierModule, RANGE, listModules(), moduleFromHash() (+19 more)

### Community 14 - "feedback.js"
Cohesion: 0.11
Nodes (36): buildContext(), buildIssueUrl(), buildPayload(), buildTitle(), CONTRIBUTING_URL, DEFAULT_BRANCH, editUrl(), FEEDBACK_ENDPOINT (+28 more)

### Community 15 - "math-engine.js"
Cohesion: 0.14
Nodes (26): ALLOWED_IDENTIFIERS, buildConvolutionIntegralLatex(), buildSignalEvaluator(), compileSignalExpr(), detectSupportAndRegions(), extractBraceGroup(), fmtBound(), formatSymbolic() (+18 more)

### Community 16 - "Sinais e Sistemas de Forma Interativa"
Cohesion: 0.11
Nodes (18): 1. Convolução Contínua (`#convolution`), 2. Analisador de Séries de Fourier (`#fourier`), 3. Transformada de Fourier Contínua (`#ctft`), 4. Transformada de Laplace (`#laplace`), 5. Transformada Z (`#z`), 6. Convolução Discreta (`#dconv`), 7. Transformada de Fourier de Tempo Discreto (`#dtft`), 8. DFT e FFT (`#dft`) (+10 more)

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

### Community 22 - "notebook-sheet.js"
Cohesion: 0.26
Nodes (15): I18N, activeModule(), el(), headerText(), init(), keyOf(), refreshPage(), setNotebookFocus() (+7 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderMath()` connect `stage-3d.js` to `z.js`, `ui.js`, `dft.js`, `math-engine.js`, `laplace.js`, `dtft.js`, `dconv.js`, `math-engine.js`, `notebook-sheet.js`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `Sinais e Sistemas de Forma Interativa` be split into smaller, more focused modules?**
  _Cohesion score 0.05641025641025641 - nodes in this community are weakly interconnected._
- **Why does `state` connect `z.js` to `stage-3d.js`, `ui.js`, `dft.js`, `math-engine.js`, `laplace.js`, `dtft.js`, `dconv.js`, `state.js`, `feedback.js`, `math-engine.js`, `notebook-sheet.js`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `z.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08985200845665962 - nodes in this community are weakly interconnected._
- **Why does `registerModule()` connect `state.js` to `z.js`, `dft.js`, `math-engine.js`, `laplace.js`, `dtft.js`, `dconv.js`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Should `ui.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09724106739032112 - nodes in this community are weakly interconnected._
- **Should `Interactive Signals and Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._