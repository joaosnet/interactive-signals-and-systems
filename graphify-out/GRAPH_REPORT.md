# Graph Report - Sinais e Sistemas forma interativa  (2026-11-07)

## Corpus Check
- 17 files · ~63,817 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .css 1, .xml 1)

## Summary
- 177 nodes · 431 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df651ef9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- stage-3d.js
- Interactive Signals and Systems
- state.js
- ui.js
- app.js
- Señales y Sistemas de Forma Interactiva
- manifest.json
- stage-3d.js
- server.js
- assemble_master_index.js
- package.json
- create_perfect_index.js
- updateAudioSynth

## God Nodes (most connected - your core abstractions)
1. `initUIEventListeners()` - 32 edges
2. `updateScene3D()` - 27 edges
3. `updateNotebookUI()` - 22 edges
4. `renderPresetGallery()` - 19 edges
5. `setHUDExpressionLive()` - 16 edges
6. `switchModule()` - 16 edges
7. `calculateCTFTData()` - 13 edges
8. `projectPoint3D()` - 11 edges
9. `applyLanguage()` - 11 edges
10. `renderMath()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `updateNotebookUI()` --calls--> `renderMath()`  [EXTRACTED]
  js/notebook.js → js/math-engine.js
- `renderPresetGallery()` --calls--> `renderMath()`  [EXTRACTED]
  js/ui.js → js/math-engine.js
- `animationLoop()` --calls--> `updateScene3D()`  [EXTRACTED]
  js/app.js → js/stage-3d.js
- `updateNotebookUI()` --calls--> `updateScene3D()`  [EXTRACTED]
  js/notebook.js → js/stage-3d.js
- `applyLanguage()` --calls--> `updateScene3D()`  [EXTRACTED]
  js/ui.js → js/stage-3d.js

## Import Cycles
- None detected.

## Communities (13 total, 2 thin omitted)

### Community 0 - "stage-3d.js"
Cohesion: 0.21
Nodes (25): renderMath(), buildCurveAreaPolygon(), camOrbit, distToSegmentSq(), draw3DLine(), draw3DPolygon(), draw3DPolyline(), findHitSignalCurve() (+17 more)

### Community 1 - "Interactive Signals and Systems"
Cohesion: 0.08
Nodes (24): 1. Continuous Convolution (`#convolution`), 2. Fourier Series Analyzer (`#fourier`), 3. Continuous-Time Fourier Transform (`#ctft`), Academic References, Core Modules, Interactive Signals and Systems, Interface and Display Systems, Keyboard Shortcuts (+16 more)

### Community 2 - "state.js"
Cohesion: 0.17
Nodes (11): initialA11yContrast, initialA11yMotion, initialCustomPresets, initialFontScale, initialFourierCustomPresets, initialLang, initialLayers, initialTheme (+3 more)

### Community 3 - "ui.js"
Cohesion: 0.18
Nodes (32): calculateFourierData(), setCameraPreset(), saveStatePreferences(), applyLanguage(), applySignalHUD(), applyTheme(), closeSignalHUD(), combineParametricExpression() (+24 more)

### Community 4 - "app.js"
Cohesion: 0.60
Nodes (5): animationLoop(), computeBoundarySlowdownFactor(), lastFrameTime, setStep(), updateSliderBadge()

### Community 5 - "Señales y Sistemas de Forma Interactiva"
Cohesion: 0.17
Nodes (12): 1. Convolución Continua (`#convolution`), 2. Analizador de Series de Fourier (`#fourier`), 3. Transformada de Fourier Continua (`#ctft`), Arquitectura del Repositorio, Atajos de Teclado, Ejecución Local, Fundamentos Didácticos y de Interfaz, Licencia (+4 more)

### Community 6 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 7 - "stage-3d.js"
Cohesion: 0.19
Nodes (20): I18N, calculateCTFTData(), compileSignalExpr(), detectSupportAndRegions(), exprToLatex(), extractBraceGroup(), formatSymbolic(), integrateSimpson() (+12 more)

### Community 8 - "server.js"
Cohesion: 0.25
Nodes (7): __dirname, __filename, fs, http, MIME_TYPES, path, server

### Community 10 - "package.json"
Cohesion: 0.50
Nodes (3): name, type, version

### Community 12 - "updateAudioSynth"
Cohesion: 0.60
Nodes (5): initAudioContext(), stopAudio(), toggleAudio(), updateAudioSynth(), state

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `updateScene3D()` connect `stage-3d.js` to `ui.js`, `app.js`, `stage-3d.js`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `Interactive Signals and Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Why does `Señales y Sistemas de Forma Interactiva` connect `Señales y Sistemas de Forma Interactiva` to `Interactive Signals and Systems`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._