# Graph Report - Sinais e Sistemas forma interativa  (2026-11-06)

## Corpus Check
- 15 files · ~54,642 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .css 1, .xml 1)

## Summary
- 144 nodes · 340 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7d95eaa4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- stage-3d.js
- renderPresetGallery
- state.js
- initUIEventListeners
- Interactive Signals & Systems
- ui.js
- manifest.json
- notebook.js
- server.js
- assemble_master_index.js
- package.json
- create_perfect_index.js
- switchModule

## God Nodes (most connected - your core abstractions)
1. `initUIEventListeners()` - 31 edges
2. `updateScene3D()` - 25 edges
3. `renderPresetGallery()` - 18 edges
4. `updateNotebookUI()` - 16 edges
5. `switchModule()` - 15 edges
6. `setHUDExpressionLive()` - 13 edges
7. `applyLanguage()` - 11 edges
8. `renderMath()` - 10 edges
9. `exprToLatex()` - 9 edges
10. `renderFourierScene3D()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `switchModule()` --calls--> `updateAudioSynth()`  [EXTRACTED]
  js/ui.js → js/audio.js
- `switchModule()` --calls--> `calculateFourierData()`  [EXTRACTED]
  js/ui.js → js/math-engine.js
- `switchModule()` --calls--> `updateNotebookUI()`  [EXTRACTED]
  js/ui.js → js/notebook.js
- `switchModule()` --calls--> `updateScene3D()`  [EXTRACTED]
  js/ui.js → js/stage-3d.js
- `setStep()` --calls--> `updateNotebookUI()`  [EXTRACTED]
  js/ui.js → js/notebook.js

## Import Cycles
- None detected.

## Communities (13 total, 2 thin omitted)

### Community 0 - "stage-3d.js"
Cohesion: 0.18
Nodes (24): integrateSimpson(), renderMath(), BUILTIN_CONV_PRESETS, BUILTIN_FOURIER_PRESETS, buildCurveAreaPolygon(), camOrbit, distToSegmentSq(), draw3DLine() (+16 more)

### Community 1 - "renderPresetGallery"
Cohesion: 0.46
Nodes (8): calculateFourierData(), applySignalHUD(), closeSignalHUD(), mutateActiveExpr(), pinSignalHUD(), renderPresetGallery(), setHUDExpressionLive(), syncInputsWithPreset()

### Community 2 - "state.js"
Cohesion: 0.13
Nodes (17): initAudioContext(), stopAudio(), toggleAudio(), updateAudioSynth(), initialA11yContrast, initialA11yMotion, initialCustomPresets, initialFontScale (+9 more)

### Community 3 - "initUIEventListeners"
Cohesion: 0.35
Nodes (12): animationLoop(), initHash, saveStatePreferences(), applyTheme(), initUIEventListeners(), setFontScale(), setStep(), toggleHighContrast() (+4 more)

### Community 4 - "Interactive Signals & Systems"
Cohesion: 0.17
Nodes (11): 1. Continuous Convolution (`#convolution`), 2. Fourier Series Analyzer (`#fourier`), Architecture, code:block1 (├── index.html          # Semantic HTML shell, SEO Meta & Sc), code:bash (python -m http.server 3000), Design & Usability, Interactive Signals & Systems, License (+3 more)

### Community 5 - "ui.js"
Cohesion: 0.17
Nodes (5): setCameraPreset(), generateParametricExpr(), generateParametricPreview(), setupA11yBarScroll(), setupMathLiveVirtualKeyboard()

### Community 6 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 7 - "notebook.js"
Cohesion: 0.26
Nodes (13): I18N, compileSignalExpr(), detectSupportAndRegions(), exprToLatex(), extractBraceGroup(), formatSymbolic(), latexToExpr(), latexToHtml() (+5 more)

### Community 8 - "server.js"
Cohesion: 0.25
Nodes (7): __dirname, __filename, fs, http, MIME_TYPES, path, server

### Community 10 - "package.json"
Cohesion: 0.50
Nodes (3): name, type, version

### Community 12 - "switchModule"
Cohesion: 0.39
Nodes (8): applyLanguage(), openSignalHUD(), setActiveMathField(), switchModule(), updateHUDTitle(), updateParametricHUDPreview(), updateStepLabels(), updateThemeCycleButtonUI()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `updateScene3D()` connect `stage-3d.js` to `renderPresetGallery`, `initUIEventListeners`, `ui.js`, `notebook.js`, `switchModule`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `state.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13450292397660818 - nodes in this community are weakly interconnected._
- **Why does `initUIEventListeners()` connect `initUIEventListeners` to `stage-3d.js`, `renderPresetGallery`, `state.js`, `ui.js`, `notebook.js`, `switchModule`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `updateNotebookUI()` connect `notebook.js` to `renderPresetGallery`, `initUIEventListeners`, `switchModule`, `ui.js`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._