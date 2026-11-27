# Graph Report - Sinais e Sistemas forma interativa  (2026-11-27)

## Corpus Check
- 50 files · ~80,566 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .css 2, .xml 1)

## Summary
- 549 nodes · 1223 edges · 22 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d2d16a5e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- stage-3d.js
- Sinais e Sistemas de Forma Interativa
- z.js
- ui.js
- ctft.js
- dft.js
- manifest.json
- math-engine.js
- server.js
- laplace.js
- package.json
- dtft.js
- dconv.js
- Módulos Principales
- feedback.js
- math-engine.js
- Interactive Signals and Systems
- bug.yml
- conteudo.yml
- body
- contact_links
- PULL_REQUEST_TEMPLATE.md

## God Nodes (most connected - your core abstractions)
1. `initUIEventListeners()` - 42 edges
2. `updateScene3D()` - 30 edges
3. `updateNotebookUI()` - 27 edges
4. `renderMath()` - 22 edges
5. `renderPresetGallery()` - 22 edges
6. `switchModule()` - 20 edges
7. `setHUDExpressionLive()` - 16 edges
8. `state` - 16 edges
9. `activeModule()` - 15 edges
10. `applyLanguage()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `rect()` --calls--> `calculateCTFTData()`  [EXTRACTED]
  tests/ctft-extras.test.js → js/math-engine.js
- `expo()` --calls--> `calculateCTFTData()`  [EXTRACTED]
  tests/ctft-extras.test.js → js/math-engine.js
- `tri()` --calls--> `calculateCTFTData()`  [EXTRACTED]
  tests/ctft-extras.test.js → js/math-engine.js
- `assertMatchesSum()` --calls--> `numericZ()`  [EXTRACTED]
  tests/z-engine.test.js → js/z-engine.js
- `animationLoop()` --indirect_call--> `setStep()`  [INFERRED]
  js/app.js → js/ui.js

## Import Cycles
- None detected.

## Communities (22 total, 0 thin omitted)

### Community 0 - "stage-3d.js"
Cohesion: 0.15
Nodes (29): renderMath(), buildCurveAreaPolygon(), camOrbit, customSignalCache, DEFAULT_CAMERA_TARGET, distToSegmentSq(), draw3DLine(), draw3DPolygon() (+21 more)

### Community 1 - "Sinais e Sistemas de Forma Interativa"
Cohesion: 0.06
Nodes (35): 1. Feedback pelo site, 2. Corrigir pelo navegador, 3. Rodar o projeto no seu computador, Como contribuir, Convenções, Cuidados com fórmulas, Dúvidas, Onde fica cada coisa (+27 more)

### Community 2 - "z.js"
Cohesion: 0.11
Nodes (31): calc(), CAUSALITY_TEXT, circlePts(), complexLatex(), cutRadius(), floorPt(), height(), listLatex() (+23 more)

### Community 3 - "ui.js"
Cohesion: 0.10
Nodes (63): animationLoop(), lastFrameTime, updateAudioSynth(), exprToLatex(), validateSignalExpression(), recomputeFourier(), activeModule(), clampToSlider() (+55 more)

### Community 4 - "ctft.js"
Cohesion: 0.08
Nodes (27): initAudioContext(), killOscillator(), stopAudio(), toggleAudio(), boundarySlowdown(), convolutionModule, SHIFT, SWEEP (+19 more)

### Community 5 - "dft.js"
Cohesion: 0.17
Nodes (20): bitReverse(), calculateDFTData(), DFT_MAX_BITS, DFT_MIN_BITS, DFT_PRESETS, dftNaive(), fft(), fmt() (+12 more)

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
Cohesion: 0.12
Nodes (24): calculateLaplaceData(), expArg(), fmt(), LAPLACE_PRESETS, numericLaplace(), rocLatex(), sPlus(), calc() (+16 more)

### Community 10 - "package.json"
Cohesion: 0.29
Nodes (6): name, scripts, start, test, type, version

### Community 11 - "dtft.js"
Cohesion: 0.11
Nodes (24): calculateDTFTData(), DTFT_PRESETS, numericDTFT(), spectralEnergy(), wrapOmega(), cached(), calc(), complexLatex() (+16 more)

### Community 12 - "dconv.js"
Cohesion: 0.21
Nodes (18): calculateDConvData(), convolveSeq(), DCONV_PRESETS, DCONV_SIGNALS, fmt(), seqAt(), seqEnd(), seqLatex() (+10 more)

### Community 13 - "Módulos Principales"
Cohesion: 0.11
Nodes (18): 1. Convolución Continua (`#convolution`), 2. Analizador de Series de Fourier (`#fourier`), 3. Transformada de Fourier Continua (`#ctft`), 4. Transformada de Laplace (`#laplace`), 5. Transformada Z (`#z`), 6. Convolución Discreta (`#dconv`), 7. Transformada de Fourier de Tiempo Discreto (`#dtft`), 8. DFT y FFT (`#dft`) (+10 more)

### Community 14 - "feedback.js"
Cohesion: 0.11
Nodes (36): buildContext(), buildIssueUrl(), buildPayload(), buildTitle(), CONTRIBUTING_URL, DEFAULT_BRANCH, editUrl(), FEEDBACK_ENDPOINT (+28 more)

### Community 15 - "math-engine.js"
Cohesion: 0.14
Nodes (24): I18N, ALLOWED_IDENTIFIERS, buildConvolutionIntegralLatex(), buildSignalEvaluator(), calculateFourierData(), compileSignalExpr(), detectSupportAndRegions(), extractBraceGroup() (+16 more)

### Community 16 - "Interactive Signals and Systems"
Cohesion: 0.11
Nodes (18): 1. Continuous Convolution (`#convolution`), 2. Fourier Series Analyzer (`#fourier`), 3. Continuous-Time Fourier Transform (`#ctft`), 4. Laplace Transform (`#laplace`), 5. Z-Transform (`#z`), 6. Discrete Convolution (`#dconv`), 7. Discrete-Time Fourier Transform (`#dtft`), 8. DFT and FFT (`#dft`) (+10 more)

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

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderMath()` connect `stage-3d.js` to `z.js`, `ui.js`, `dft.js`, `math-engine.js`, `laplace.js`, `dtft.js`, `dconv.js`, `math-engine.js`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `stage-3d.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14623655913978495 - nodes in this community are weakly interconnected._
- **Why does `state` connect `ctft.js` to `stage-3d.js`, `z.js`, `ui.js`, `dft.js`, `math-engine.js`, `laplace.js`, `dtft.js`, `dconv.js`, `feedback.js`, `math-engine.js`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `Sinais e Sistemas de Forma Interativa` be split into smaller, more focused modules?**
  _Cohesion score 0.05641025641025641 - nodes in this community are weakly interconnected._
- **Why does `registerModule()` connect `ctft.js` to `z.js`, `dft.js`, `math-engine.js`, `laplace.js`, `dtft.js`, `dconv.js`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Should `z.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10510510510510511 - nodes in this community are weakly interconnected._
- **Should `ui.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09859154929577464 - nodes in this community are weakly interconnected._