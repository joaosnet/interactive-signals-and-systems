# Graph Report - Sinais e Sistemas forma interativa  (2026-11-27)

## Corpus Check
- 22 files · ~42,432 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .css 2, .xml 1)

## Summary
- 229 nodes · 591 edges · 10 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `115e7cad`
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
- package.json

## God Nodes (most connected - your core abstractions)
1. `initUIEventListeners()` - 41 edges
2. `updateScene3D()` - 28 edges
3. `updateNotebookUI()` - 24 edges
4. `switchModule()` - 20 edges
5. `renderPresetGallery()` - 20 edges
6. `setHUDExpressionLive()` - 16 edges
7. `applyLanguage()` - 15 edges
8. `openSignalHUD()` - 14 edges
9. `activeModule()` - 13 edges
10. `exprToLatex()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `animationLoop()` --calls--> `updateNotebookUI()`  [EXTRACTED]
  js/app.js → js/notebook.js
- `animationLoop()` --calls--> `updateScene3D()`  [EXTRACTED]
  js/app.js → js/stage-3d.js
- `animationLoop()` --indirect_call--> `setStep()`  [INFERRED]
  js/app.js → js/ui.js
- `initUIEventListeners()` --calls--> `toggleAudio()`  [EXTRACTED]
  js/ui.js → js/audio.js
- `updateNotebookUI()` --calls--> `updateAudioSynth()`  [EXTRACTED]
  js/notebook.js → js/audio.js

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "stage-3d.js"
Cohesion: 0.19
Nodes (27): renderMath(), buildCurveAreaPolygon(), camOrbit, customSignalCache, distToSegmentSq(), draw3DLine(), draw3DPolygon(), draw3DPolyline() (+19 more)

### Community 1 - "Interactive Signals and Systems"
Cohesion: 0.08
Nodes (24): 1. Continuous Convolution (`#convolution`), 2. Fourier Series Analyzer (`#fourier`), 3. Continuous-Time Fourier Transform (`#ctft`), Academic References, Core Modules, Interactive Signals and Systems, Interface and Display Systems, Keyboard Shortcuts (+16 more)

### Community 2 - "state.js"
Cohesion: 0.11
Nodes (20): initAudioContext(), killOscillator(), stopAudio(), toggleAudio(), updateAudioSynth(), initialA11yContrast, initialA11yMotion, initialCTFTCustomPresets (+12 more)

### Community 3 - "ui.js"
Cohesion: 0.13
Nodes (45): animationLoop(), lastFrameTime, validateSignalExpression(), activeModule(), listModules(), moduleFromHash(), neighborModule(), setCameraPreset() (+37 more)

### Community 4 - "ctft.js"
Cohesion: 0.13
Nodes (18): boundarySlowdown(), convolutionModule, SHIFT, SWEEP, BRIDGE, ctftModule, FREQ, getCTFTCalcKey() (+10 more)

### Community 5 - "Señales y Sistemas de Forma Interactiva"
Cohesion: 0.17
Nodes (12): 1. Convolución Continua (`#convolution`), 2. Analizador de Series de Fourier (`#fourier`), 3. Transformada de Fourier Continua (`#ctft`), Arquitectura del Repositorio, Atajos de Teclado, Ejecución Local y Pruebas, Fundamentos Didácticos y de Interfaz, Licencia (+4 more)

### Community 6 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 7 - "math-engine.js"
Cohesion: 0.11
Nodes (34): I18N, ALLOWED_IDENTIFIERS, buildConvolutionIntegralLatex(), buildSignalEvaluator(), calculateCTFTData(), calculateFourierData(), compileSignalExpr(), detectSupportAndRegions() (+26 more)

### Community 8 - "server.js"
Cohesion: 0.22
Nodes (5): __dirname, __filename, MIME_TYPES, send(), server

### Community 10 - "package.json"
Cohesion: 0.29
Nodes (6): name, scripts, start, test, type, version

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `updateScene3D()` connect `stage-3d.js` to `ui.js`, `ctft.js`, `math-engine.js`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `Interactive Signals and Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Why does `initUIEventListeners()` connect `ui.js` to `stage-3d.js`, `state.js`, `ctft.js`, `math-engine.js`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `state.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11462450592885376 - nodes in this community are weakly interconnected._
- **Why does `updateNotebookUI()` connect `math-engine.js` to `stage-3d.js`, `state.js`, `ui.js`, `ctft.js`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `ui.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1341350601295097 - nodes in this community are weakly interconnected._
- **Should `ctft.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12681159420289856 - nodes in this community are weakly interconnected._