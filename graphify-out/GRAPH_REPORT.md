# Graph Report - Sinais e Sistemas forma interativa  (2026-11-27)

## Corpus Check
- 25 files · ~48,828 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .css 2, .xml 1)

## Summary
- 266 nodes · 674 edges · 12 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1c09a071`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- stage-3d.js
- Interactive Signals and Systems
- state.js
- ui.js
- ctft.js
- Señales y Sistemas de Forma Interactiva
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
8. `activeModule()` - 14 edges
9. `openSignalHUD()` - 14 edges
10. `renderMath()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `boundarySlowdown()` --calls--> `getEffectiveSignals()`  [EXTRACTED]
  js/modules/convolution.js → js/stage-3d.js
- `animationLoop()` --calls--> `updateScene3D()`  [EXTRACTED]
  js/app.js → js/stage-3d.js
- `animationLoop()` --indirect_call--> `setStep()`  [INFERRED]
  js/app.js → js/ui.js
- `pinSignalHUD()` --calls--> `recomputeCTFT()`  [EXTRACTED]
  js/ui.js → js/modules/ctft.js
- `selectCTFTPreset()` --calls--> `recomputeCTFT()`  [EXTRACTED]
  js/ui.js → js/modules/ctft.js

## Import Cycles
- None detected.

## Communities (12 total, 0 thin omitted)

### Community 0 - "stage-3d.js"
Cohesion: 0.14
Nodes (34): compileSignalExpr(), renderMath(), getModule(), buildCurveAreaPolygon(), buildCustomSignals(), camOrbit, customSignalCache, DEFAULT_CAMERA_TARGET (+26 more)

### Community 1 - "Interactive Signals and Systems"
Cohesion: 0.07
Nodes (26): 1. Continuous Convolution (`#convolution`), 2. Fourier Series Analyzer (`#fourier`), 3. Continuous-Time Fourier Transform (`#ctft`), 4. Laplace Transform (`#laplace`), Academic References, Core Modules, Interactive Signals and Systems, Interface and Display Systems (+18 more)

### Community 2 - "state.js"
Cohesion: 0.13
Nodes (15): initialA11yContrast, initialA11yMotion, initialCTFTCustomPresets, initialCustomPresets, initialFontScale, initialFourierCustomPresets, initialLang, initialLayers (+7 more)

### Community 3 - "ui.js"
Cohesion: 0.14
Nodes (51): animationLoop(), lastFrameTime, validateSignalExpression(), activeModule(), updateNotebookUI(), setCameraPreset(), saveStatePreferences(), applyLanguage() (+43 more)

### Community 4 - "ctft.js"
Cohesion: 0.12
Nodes (21): calculateCTFTData(), calculateFourierData(), boundarySlowdown(), convolutionModule, SHIFT, SWEEP, BRIDGE, ctftModule (+13 more)

### Community 5 - "Señales y Sistemas de Forma Interactiva"
Cohesion: 0.15
Nodes (13): 1. Convolución Continua (`#convolution`), 2. Analizador de Series de Fourier (`#fourier`), 3. Transformada de Fourier Continua (`#ctft`), 4. Transformada de Laplace (`#laplace`), Arquitectura del Repositorio, Atajos de Teclado, Ejecución Local y Pruebas, Fundamentos Didácticos y de Interfaz (+5 more)

### Community 6 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 7 - "math-engine.js"
Cohesion: 0.15
Nodes (22): I18N, ALLOWED_IDENTIFIERS, buildConvolutionIntegralLatex(), buildSignalEvaluator(), detectSupportAndRegions(), exprToLatex(), extractBraceGroup(), fmtBound() (+14 more)

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

- **Why does `renderMath()` connect `stage-3d.js` to `laplace.js`, `ui.js`, `math-engine.js`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `stage-3d.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14126984126984127 - nodes in this community are weakly interconnected._
- **Why does `updateScene3D()` connect `stage-3d.js` to `ui.js`, `math-engine.js`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `Interactive Signals and Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Why does `state` connect `ctft.js` to `stage-3d.js`, `state.js`, `ui.js`, `math-engine.js`, `laplace.js`, `updateAudioSynth`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `state.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1323529411764706 - nodes in this community are weakly interconnected._
- **Should `ui.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13570391872278664 - nodes in this community are weakly interconnected._