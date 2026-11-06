---
trigger: always_on
description: MANDATORY - Always consult the graphify knowledge graph at graphify-out/ or graphify-out/wiki/ before exploring or reading source files.
---

## graphify (Knowledge Graph First)

This project has a graphify knowledge graph at `graphify-out/`.

Rules:
- **ZERO SPECULATIVE CODEBASE SCANS**: NEVER scan directories (`Get-ChildItem`, `ls`), execute broad recursive greps, or read source files speculatively across the repository to locate functionality or understand architecture.
- **WIKI FIRST**: If `graphify-out/wiki/index.md` exists, ALWAYS start navigation by reading `graphify-out/wiki/index.md` and the relevant community/god node articles instead of opening raw source files.
- **MCP / CLI TRAVERSAL**: For targeted queries, relationships, and concepts, run `query_graph` (MCP) or `graphify query "<question>"` (CLI). Use `shortest_path` / `graphify path "<A>" "<B>"` for module relationships and `get_node` / `graphify explain "<concept>"` for symbol details.
- **SURGICAL FILE ACCESS**: Only open raw source files (`read_file`) after the exact target files and line ranges have been identified via the knowledge graph or wiki.
- **SUBAGENT DELEGATION**: Never instruct a subagent to "explore the codebase". Always pass the scoped files, symbols, or community wiki paths discovered from the knowledge graph in the subagent's prompt.
- **MAINTAIN GRAPH FRESHNESS**: After modifying code files in this session, run `graphify update .` to keep the graph and wiki synchronized (AST-only, fast, zero API cost).
