# Graph Report - Sinais e Sistemas forma interativa  (2026-10-30)

## Corpus Check
- 17 files · ~54,862 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 141 nodes · 330 edges · 14 communities (10 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bc359e86`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]

## God Nodes (most connected - your core abstractions)
1. `updateScene3D()` - 24 edges
2. `updateNotebookUI()` - 15 edges
3. `switchModule()` - 14 edges
4. `setHUDExpressionLive()` - 12 edges
5. `renderMath()` - 11 edges
6. `exprToLatex()` - 11 edges
7. `applyLanguage()` - 10 edges
8. `renderPresetGallery()` - 10 edges
9. `syncInputsWithPreset()` - 10 edges
10. `pinSignalHUD()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `animationLoop()` --calls--> `updateNotebookUI()`  [EXTRACTED]
  js/app.js → js/notebook.js
- `animationLoop()` --calls--> `updateScene3D()`  [EXTRACTED]
  js/app.js → js/stage-3d.js
- `renderPresetGallery()` --calls--> `renderMath()`  [EXTRACTED]
  js/ui.js → js/math-engine.js
- `updateParametricHUDPreview()` --calls--> `renderMath()`  [EXTRACTED]
  js/ui.js → js/math-engine.js
- `syncInputsWithPreset()` --calls--> `renderMath()`  [EXTRACTED]
  js/ui.js → js/math-engine.js

## Communities (14 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.33
Nodes (7): compileSignalExpr(), extractBraceGroup(), integrateSimpson(), latexToExpr(), replaceBalancedCall(), BUILTIN_CONV_PRESETS, BUILTIN_FOURIER_PRESETS

### Community 1 - "Community 1"
Cohesion: 0.20
Nodes (23): detectSupportAndRegions(), renderMath(), buildCurveAreaPolygon(), camOrbit, distToSegmentSq(), draw3DLine(), draw3DPolygon(), draw3DPolyline() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.43
Nodes (6): I18N, formatSymbolic(), latexToHtml(), buildNotebookLinesConvolution(), buildNotebookLinesFourier(), updateNotebookUI()

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (16): initAudioContext(), stopAudio(), toggleAudio(), initialA11yContrast, initialA11yMotion, initialCustomPresets, initialFontScale, initialFourierCustomPresets (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (11): 1. Continuous Convolution (`#convolution`), 2. Fourier Series Analyzer (`#fourier`), Architecture, code:block1 (├── index.html          # Semantic HTML shell, SEO Meta & Sc), code:bash (python -m http.server 3000), Design & Usability, Interactive Signals & Systems, License (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (7): __dirname, __filename, fs, http, MIME_TYPES, path, server

### Community 8 - "Community 8"
Cohesion: 0.50
Nodes (3): name, type, version

### Community 10 - "Community 10"
Cohesion: 0.28
Nodes (19): updateAudioSynth(), calculateFourierData(), exprToLatex(), applyLanguage(), applySignalHUD(), closeSignalHUD(), generateParametricExpr(), generateParametricPreview() (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (16): animationLoop(), initHash, setCameraPreset(), saveStatePreferences(), applyTheme(), initUIEventListeners(), setFontScale(), setStep() (+8 more)

## Knowledge Gaps
- **44 isolated node(s):** `name`, `short_name`, `description`, `start_url`, `display` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `updateScene3D()` connect `Community 1` to `Community 10`, `Community 2`, `Community 11`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `updateNotebookUI()` connect `Community 2` to `Community 1`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `renderMath()` connect `Community 1` to `Community 0`, `Community 10`, `Community 2`, `Community 11`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `short_name`, `description` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.13071895424836602 - nodes in this community are weakly interconnected._