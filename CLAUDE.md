# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is an **npm workspaces** monorepo. Run all commands from the repo root.

- `npm install` — install all workspace deps (run once after clone)
- `npm run build` — build every package (`tsc` per workspace); required before `dev` for the server
- `npm run clean` — remove all `packages/*/dist`
- `npm run release` - clean, build and public
- `npm run dev:mcp` — run the MCP server via `tsx`. The script is literally `tsx dist/server.ts`, so it requires a prior `build` (it reads the `.ts` from `dist/` only because `tsc` copies it). To run straight from source without building, invoke `tsx packages/bt820-mcp-server/src/server.ts -- --core ...` directly.
- `npm run dev:cli` — run the CLI workspace (currently a placeholder, see below)
- `npm run link:mcp` — `npm link` the server for use as `bt820-mcp-server`

Per-package builds: `npm run build -w eveapps-core` (etc.). There is no test runner configured.

### Running the server

```
bt820-mcp-server --core <workspace-or-eveapps-core-path> [--eveapps <local-EveApps-repo>]
```

- `--eveapps` is optional but unlocks live source-file search inside the user's EveApps-BT82X checkout.

All diagnostic logging **must** go to `stderr` (`console.error`). `stdout` is owned by the MCP `StdioServerTransport`; writing to it corrupts the protocol stream.

## Architecture

Three packages connected via TypeScript project references (`tsconfig.json` at root):

1. **`eveapps-core`** — pure logic + data. Owns all retrieval, ranking, and tool implementations. Ships static JSON indexes in `data/` (`commands.json`, `samples.json`, `registers.json`, `build_matrix.json`, `feature_graph.json`). Build copies `data/` into `dist/data/` so the published package is self-contained. **Edit indexes in `packages/eveapps-core/data/`, never in `dist/data/`** — the latter is regenerated on every build.
2. **`bt820-mcp-server`** — thin MCP adapter. `src/server.ts` parses CLI args, constructs a `WorkspaceContext`, and registers each exported core tool with `McpServer`. Every handler is wrapped in `safeTool()` to convert exceptions into structured JSON `content` blocks instead of crashing the transport.
3. **`bt820-cli`** — declared in workspaces and referenced from root `tsconfig.json`, but currently has no `src/`. Treat as a placeholder; do not assume it builds.

### Retrieval pipeline (`ask_bt820`)

The primary tool routes a natural-language query through:

```
retrieveAnswer
  → searchCore(context, query)              // metadata over data/*.json
  → analyzeQuery(query)                     // intent classification
  → routeQuery(...)                         // picks "core" | "eveapps" | "both"
  → searchEveApps(eveappsRoot, query)       // ranked samples + searchSourceFiles grep
  → mergeResults(...)                       // when both
```

Live source search (`searchEveApps` / `searchSourceFiles`) requires `--eveapps`; without it the router falls back to `core` only. Sample ranking (`lib/rank.ts`) combines `samples.json` metadata with `feature_graph.json` adjacency.

### Registered MCP tools

Currently exposed by `packages/bt820-mcp-server/src/server.ts`:

- `ask_bt820` — primary natural-language entry point; routes through `retrieveAnswer` (see pipeline above). Prefer extending this over adding new top-level tools.
- `generate_build_command`, `find_relevant_sample`, `explain_eve_symbol`, `generate_screen_scaffold`, `validate_bt820_code`, `trace_feature_to_commands` — legacy structured tools that wrap the corresponding `packages/eveapps-core/src/tools/*.ts` handlers.
- `bt820_read_file` — raw file read inside `eveappsRoot`. Requires `--eveapps`.

### Adding a tool

1. Implement in `packages/eveapps-core/src/tools/<name>.ts`, exporting both the handler and a `zod` input schema named `<name>Input`.
2. Re-export from `packages/eveapps-core/src/index.ts`.
3. Register in `packages/bt820-mcp-server/src/server.ts` with `server.registerTool(name, { ..., inputSchema: <name>Input.shape }, safeTool(handler))`. Wrap with `safeTool` — never pass a raw handler.

Tools that need filesystem access against the user's repo (e.g. `readSourceFile`) must accept and use the `WorkspaceContext`'s `eveappsRoot`; they should not read from `process.cwd()`.

### TypeScript conventions

- ESM only (`"type": "module"`), `NodeNext` module resolution. Internal imports use the `.js` extension even in `.ts` source (e.g. `from "./router/index.js"`).
- `strict` + `noUncheckedIndexedAccess` are on; array/object index access returns `T | undefined` and must be narrowed.
- The server workspace uses a `paths` alias mapping `eveapps-core` → `../eveapps-core/src/index.ts` so the TS language server resolves to source while the published build still resolves to `dist/`.
