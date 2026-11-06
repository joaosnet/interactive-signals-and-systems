# Graph Report - Sinais e Sistemas forma interativa  (2026-11-06)

## Corpus Check
- 15 files · ~61,049 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .css 1, .xml 1)

## Summary
- 149 nodes · 402 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e27e02b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- stage-3d.js
- Interactive Signals & Systems
- state.js
- ui.js
- app.js
- manifest.json
- stage-3d.js
- server.js
- assemble_master_index.js
- package.json
- create_perfect_index.js

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
- `openSignalHUD()` --calls--> `exprToLatex()`  [EXTRACTED]
  js/ui.js → js/math-engine.js
- `renderPresetGallery()` --calls--> `exprToLatex()`  [EXTRACTED]
  js/ui.js → js/math-engine.js
- `setHUDExpressionLive()` --calls--> `exprToLatex()`  [EXTRACTED]
  js/ui.js → js/math-engine.js

## Import Cycles
- None detected.

## Communities (11 total, 2 thin omitted)

### Community 0 - "stage-3d.js"
Cohesion: 0.21
Nodes (25): renderMath(), buildCurveAreaPolygon(), camOrbit, distToSegmentSq(), draw3DLine(), draw3DPolygon(), draw3DPolyline(), findHitSignalCurve() (+17 more)

### Community 1 - "Interactive Signals & Systems"
Cohesion: 0.18
Nodes (10): 1. Continuous Convolution (`#convolution`), 2. Fourier Series Analyzer (`#fourier`), 3. Continuous Fourier Transform — CTFT (`#ctft`), Architecture, Design & Usability, Interactive Signals & Systems, License, Modules (+2 more)

### Community 2 - "state.js"
Cohesion: 0.16
Nodes (14): initAudioContext(), stopAudio(), toggleAudio(), updateAudioSynth(), initialA11yContrast, initialA11yMotion, initialCustomPresets, initialFontScale (+6 more)

### Community 3 - "ui.js"
Cohesion: 0.17
Nodes (34): calculateFourierData(), setCameraPreset(), removeCustomPreset(), saveCustomPreset(), saveStatePreferences(), applyLanguage(), applySignalHUD(), applyTheme() (+26 more)

### Community 4 - "app.js"
Cohesion: 0.60
Nodes (5): animationLoop(), computeBoundarySlowdownFactor(), lastFrameTime, setStep(), updateSliderBadge()

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

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `updateScene3D()` connect `stage-3d.js` to `ui.js`, `app.js`, `stage-3d.js`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `initUIEventListeners()` connect `ui.js` to `stage-3d.js`, `state.js`, `app.js`, `stage-3d.js`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `updateNotebookUI()` connect `stage-3d.js` to `stage-3d.js`, `ui.js`, `app.js`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._