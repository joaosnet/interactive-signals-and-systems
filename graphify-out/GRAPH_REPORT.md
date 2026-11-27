# Graph Report - Sinais e Sistemas forma interativa  (2026-11-27)

## Corpus Check
- 31 files · ~59,211 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .css 2, .xml 1)

## Summary
- 335 nodes · 823 edges · 13 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `08f6de47`
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
- dconv.js

## God Nodes (most connected - your core abstractions)
1. `initUIEventListeners()` - 42 edges
2. `updateScene3D()` - 30 edges
3. `updateNotebookUI()` - 26 edges
4. `renderPresetGallery()` - 22 edges
5. `switchModule()` - 20 edges
6. `renderMath()` - 16 edges
7. `setHUDExpressionLive()` - 16 edges
8. `applyLanguage()` - 15 edges
9. `activeModule()` - 14 edges
10. `openSignalHUD()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `assertMatchesSum()` --calls--> `numericZ()`  [EXTRACTED]
  tests/z-engine.test.js → js/z-engine.js
- `renderGallery()` --calls--> `renderMath()`  [EXTRACTED]
  js/modules/dconv.js → js/math-engine.js
- `renderGallery()` --calls--> `renderMath()`  [EXTRACTED]
  js/modules/z.js → js/math-engine.js
- `pinSignalHUD()` --calls--> `saveCustomPreset()`  [EXTRACTED]
  js/ui.js → js/state.js
- `renderPresetGallery()` --calls--> `removeCustomPreset()`  [EXTRACTED]
  js/ui.js → js/state.js

## Import Cycles
- None detected.

## Communities (13 total, 0 thin omitted)

### Community 0 - "stage-3d.js"
Cohesion: 0.15
Nodes (32): renderMath(), getModule(), buildCurveAreaPolygon(), camOrbit, customSignalCache, DEFAULT_CAMERA_TARGET, distToSegmentSq(), draw3DLine() (+24 more)

### Community 1 - "Interactive Signals and Systems"
Cohesion: 0.06
Nodes (30): 1. Continuous Convolution (`#convolution`), 2. Fourier Series Analyzer (`#fourier`), 3. Continuous-Time Fourier Transform (`#ctft`), 4. Laplace Transform (`#laplace`), 5. Z-Transform (`#z`), 6. Discrete Convolution (`#dconv`), Academic References, Core Modules (+22 more)

### Community 2 - "z.js"
Cohesion: 0.11
Nodes (31): calc(), CAUSALITY_TEXT, circlePts(), complexLatex(), cutRadius(), floorPt(), height(), listLatex() (+23 more)

### Community 3 - "ui.js"
Cohesion: 0.11
Nodes (53): animationLoop(), lastFrameTime, validateSignalExpression(), recomputeFourier(), activeModule(), listModules(), neighborModule(), updateNotebookUI() (+45 more)

### Community 4 - "ctft.js"
Cohesion: 0.08
Nodes (27): boundarySlowdown(), convolutionModule, SHIFT, SWEEP, fourierModule, RANGE, clampToSlider(), moduleFromHash() (+19 more)

### Community 5 - "Sinais e Sistemas de Forma Interativa"
Cohesion: 0.13
Nodes (15): 1. Convolução Contínua (`#convolution`), 2. Analisador de Séries de Fourier (`#fourier`), 3. Transformada de Fourier Contínua (`#ctft`), 4. Transformada de Laplace (`#laplace`), 5. Transformada Z (`#z`), 6. Convolução Discreta (`#dconv`), Arquitetura do Repositório, Atalhos de Teclado (+7 more)

### Community 6 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 7 - "math-engine.js"
Cohesion: 0.11
Nodes (31): I18N, ALLOWED_IDENTIFIERS, buildConvolutionIntegralLatex(), buildSignalEvaluator(), calculateCTFTData(), calculateFourierData(), compileSignalExpr(), detectSupportAndRegions() (+23 more)

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

### Community 12 - "dconv.js"
Cohesion: 0.21
Nodes (18): calculateDConvData(), convolveSeq(), DCONV_PRESETS, DCONV_SIGNALS, fmt(), seqAt(), seqEnd(), seqLatex() (+10 more)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderMath()` connect `stage-3d.js` to `z.js`, `ui.js`, `math-engine.js`, `laplace.js`, `dconv.js`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `stage-3d.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1497326203208556 - nodes in this community are weakly interconnected._
- **Why does `state` connect `ctft.js` to `stage-3d.js`, `z.js`, `ui.js`, `math-engine.js`, `laplace.js`, `updateAudioSynth`, `dconv.js`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Should `Interactive Signals and Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Why does `updateScene3D()` connect `stage-3d.js` to `ui.js`, `ctft.js`, `math-engine.js`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `z.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10952380952380952 - nodes in this community are weakly interconnected._
- **Should `ui.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11412429378531073 - nodes in this community are weakly interconnected._