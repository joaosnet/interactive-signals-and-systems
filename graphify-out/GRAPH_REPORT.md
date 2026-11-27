# Graph Report - Sinais e Sistemas forma interativa  (2026-11-27)

## Corpus Check
- 28 files · ~55,041 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .css 2, .xml 1)

## Summary
- 310 nodes · 761 edges · 12 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f8ba960d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- stage-3d.js
- Interactive Signals and Systems
- z.js
- ui.js
- ctft.js
- Sinais e Sistemas de Forma Interativa
- manifest.json
- math-engine.js
- server.js
- laplace.js
- package.json
- updateAudioSynth

## God Nodes (most connected - your core abstractions)
1. `initUIEventListeners()` - 42 edges
2. `updateScene3D()` - 30 edges
3. `updateNotebookUI()` - 26 edges
4. `renderPresetGallery()` - 22 edges
5. `switchModule()` - 20 edges
6. `setHUDExpressionLive()` - 16 edges
7. `applyLanguage()` - 15 edges
8. `openSignalHUD()` - 14 edges
9. `renderMath()` - 14 edges
10. `activeModule()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `assertMatchesSum()` --calls--> `numericZ()`  [EXTRACTED]
  tests/z-engine.test.js → js/z-engine.js
- `renderGallery()` --calls--> `renderMath()`  [EXTRACTED]
  js/modules/laplace.js → js/math-engine.js
- `renderGallery()` --calls--> `renderMath()`  [EXTRACTED]
  js/modules/z.js → js/math-engine.js
- `updateNotebookUI()` --calls--> `updateAudioSynth()`  [EXTRACTED]
  js/notebook.js → js/audio.js
- `updateNotebookUI()` --calls--> `isZeroRegion()`  [EXTRACTED]
  js/notebook.js → js/math-engine.js

## Import Cycles
- None detected.

## Communities (12 total, 0 thin omitted)

### Community 0 - "stage-3d.js"
Cohesion: 0.16
Nodes (31): renderMath(), getModule(), buildCurveAreaPolygon(), camOrbit, customSignalCache, DEFAULT_CAMERA_TARGET, distToSegmentSq(), draw3DLine() (+23 more)

### Community 1 - "Interactive Signals and Systems"
Cohesion: 0.07
Nodes (28): 1. Continuous Convolution (`#convolution`), 2. Fourier Series Analyzer (`#fourier`), 3. Continuous-Time Fourier Transform (`#ctft`), 4. Laplace Transform (`#laplace`), 5. Z-Transform (`#z`), Academic References, Core Modules, 1. Convolución Continua (`#convolution`) (+20 more)

### Community 2 - "z.js"
Cohesion: 0.11
Nodes (31): calc(), CAUSALITY_TEXT, circlePts(), complexLatex(), cutRadius(), floorPt(), height(), listLatex() (+23 more)

### Community 3 - "ui.js"
Cohesion: 0.11
Nodes (54): animationLoop(), lastFrameTime, exprToLatex(), recomputeFourier(), activeModule(), clampToSlider(), buildNotebookLinesConvolution(), updateNotebookUI() (+46 more)

### Community 4 - "ctft.js"
Cohesion: 0.07
Nodes (33): boundarySlowdown(), convolutionModule, SHIFT, SWEEP, BRIDGE, ctftModule, FREQ, getCTFTCalcKey() (+25 more)

### Community 5 - "Sinais e Sistemas de Forma Interativa"
Cohesion: 0.14
Nodes (14): 1. Convolução Contínua (`#convolution`), 2. Analisador de Séries de Fourier (`#fourier`), 3. Transformada de Fourier Contínua (`#ctft`), 4. Transformada de Laplace (`#laplace`), 5. Transformada Z (`#z`), Arquitetura do Repositório, Atalhos de Teclado, Execução Local e Testes (+6 more)

### Community 6 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 7 - "math-engine.js"
Cohesion: 0.14
Nodes (25): I18N, ALLOWED_IDENTIFIERS, buildConvolutionIntegralLatex(), buildSignalEvaluator(), calculateCTFTData(), calculateFourierData(), compileSignalExpr(), detectSupportAndRegions() (+17 more)

### Community 8 - "server.js"
Cohesion: 0.22
Nodes (5): __dirname, __filename, MIME_TYPES, send(), server

### Community 9 - "laplace.js"
Cohesion: 0.11
Nodes (24): calculateLaplaceData(), expArg(), fmt(), LAPLACE_PRESETS, numericLaplace(), rocLatex(), sPlus(), calc() (+16 more)

### Community 10 - "package.json"
Cohesion: 0.29
Nodes (6): name, scripts, start, test, type, version

### Community 11 - "updateAudioSynth"
Cohesion: 0.67
Nodes (5): initAudioContext(), killOscillator(), stopAudio(), toggleAudio(), updateAudioSynth()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderMath()` connect `stage-3d.js` to `laplace.js`, `z.js`, `ui.js`, `math-engine.js`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `Interactive Signals and Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Why does `state` connect `ctft.js` to `stage-3d.js`, `z.js`, `ui.js`, `math-engine.js`, `laplace.js`, `updateAudioSynth`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `z.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10952380952380952 - nodes in this community are weakly interconnected._
- **Why does `updateScene3D()` connect `stage-3d.js` to `ui.js`, `ctft.js`, `math-engine.js`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `ui.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1092896174863388 - nodes in this community are weakly interconnected._
- **Should `ctft.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07317073170731707 - nodes in this community are weakly interconnected._