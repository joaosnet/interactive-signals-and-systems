# Graph Report - Sinais e Sistemas forma interativa  (2026-11-17)

## Corpus Check
- 18 files · ~68,791 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .css 2, .xml 1)

## Summary
- 199 nodes · 497 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b8d84fc3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- stage-3d.js
- Interactive Signals and Systems
- state.js
- ui.js
- app.js
- Sinais e Sistemas de Forma Interativa
- manifest.json
- math-engine.js
- server.js
- assemble_master_index.js
- package.json
- create_perfect_index.js
- updateAudioSynth

## God Nodes (most connected - your core abstractions)
1. `initUIEventListeners()` - 40 edges
2. `updateScene3D()` - 28 edges
3. `updateNotebookUI()` - 22 edges
4. `renderPresetGallery()` - 19 edges
5. `switchModule()` - 16 edges
6. `setHUDExpressionLive()` - 16 edges
7. `applyLanguage()` - 14 edges
8. `exprToLatex()` - 13 edges
9. `openSignalHUD()` - 12 edges
10. `renderMath()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `animationLoop()` --calls--> `updateScene3D()`  [EXTRACTED]
  js/app.js → js/stage-3d.js
- `animationLoop()` --calls--> `setStep()`  [EXTRACTED]
  js/app.js → js/ui.js
- `animationLoop()` --calls--> `updateSliderBadge()`  [EXTRACTED]
  js/app.js → js/ui.js
- `updateNotebookUI()` --calls--> `renderMath()`  [EXTRACTED]
  js/notebook.js → js/math-engine.js
- `renderPresetGallery()` --calls--> `renderMath()`  [EXTRACTED]
  js/ui.js → js/math-engine.js

## Import Cycles
- None detected.

## Communities (13 total, 2 thin omitted)

### Community 0 - "stage-3d.js"
Cohesion: 0.20
Nodes (26): renderMath(), buildCurveAreaPolygon(), camOrbit, distToSegmentSq(), draw3DLine(), draw3DPolygon(), draw3DPolyline(), findHitSignalCurve() (+18 more)

### Community 1 - "Interactive Signals and Systems"
Cohesion: 0.08
Nodes (24): 1. Continuous Convolution (`#convolution`), 2. Fourier Series Analyzer (`#fourier`), 3. Continuous-Time Fourier Transform (`#ctft`), Academic References, Core Modules, 1. Convolución Continua (`#convolution`), 2. Analizador de Series de Fourier (`#fourier`), 3. Transformada de Fourier Continua (`#ctft`) (+16 more)

### Community 2 - "state.js"
Cohesion: 0.15
Nodes (12): initialA11yContrast, initialA11yMotion, initialCTFTCustomPresets, initialCustomPresets, initialFontScale, initialFourierCustomPresets, initialLang, initialLayers (+4 more)

### Community 3 - "ui.js"
Cohesion: 0.14
Nodes (46): calculateFourierData(), exprToLatex(), validateSignalExpression(), setCameraPreset(), saveStatePreferences(), applyLanguage(), applySignalHUD(), applyTheme() (+38 more)

### Community 4 - "app.js"
Cohesion: 0.26
Nodes (12): animationLoop(), computeBoundarySlowdownFactor(), lastFrameTime, I18N, calculateCTFTData(), formatSymbolic(), latexToHtml(), buildNotebookLinesConvolution() (+4 more)

### Community 5 - "Sinais e Sistemas de Forma Interativa"
Cohesion: 0.17
Nodes (12): 1. Convolução Contínua (`#convolution`), 2. Analisador de Séries de Fourier (`#fourier`), 3. Transformada de Fourier Contínua (`#ctft`), Arquitetura do Repositório, Atalhos de Teclado, Execução Local e Testes, Fundamentos Didáticos e de Interface, Licença (+4 more)

### Community 6 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 7 - "math-engine.js"
Cohesion: 0.22
Nodes (13): buildConvolutionIntegralLatex(), buildSignalEvaluator(), compileSignalExpr(), detectSupportAndRegions(), extractBraceGroup(), fmtBound(), integrateSimpson(), latexToExpr() (+5 more)

### Community 8 - "server.js"
Cohesion: 0.25
Nodes (7): __dirname, __filename, fs, http, MIME_TYPES, path, server

### Community 10 - "package.json"
Cohesion: 0.29
Nodes (6): name, scripts, start, test, type, version

### Community 12 - "updateAudioSynth"
Cohesion: 0.60
Nodes (5): initAudioContext(), stopAudio(), toggleAudio(), updateAudioSynth(), state

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `updateScene3D()` connect `stage-3d.js` to `ui.js`, `app.js`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `Interactive Signals and Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Why does `initUIEventListeners()` connect `ui.js` to `stage-3d.js`, `app.js`, `updateAudioSynth`, `math-engine.js`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `ui.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13652482269503546 - nodes in this community are weakly interconnected._