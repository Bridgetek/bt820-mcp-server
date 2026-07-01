# @bridgetek/bt820-eveapps-core

Core runtime library for BT820 and EveApps development workflows.

`@bridgetek/bt820-eveapps-core` provides the retrieval engine, ranking logic, indexed data access, and reusable tool implementations used by the `@bridgetek/bt820-mcp-server`.

It includes:

- Programmatic APIs and utilities for BT820/EveApps knowledge retrieval
- Sample, command, register, and feature indexing support
- Runtime data files required for search and ranking operations
- Core functionality shared by MCP-based developer tools

## Installation

From npm (public scoped package):

```bash
npm install @bridgetek/bt820-eveapps-core
```

When using this monorepo locally, prefer building from source and referencing the package via workspace path or local import.

## Quick usage

Import the primary helpers and tools:

```ts
import {
  createWorkspaceContext,
  retrieveAnswer,
  findRelevantSample,
  // ...other exports
} from "@bridgetek/bt820-eveapps-core";

const context = createWorkspaceContext("/path/to/EveApps-repo");
const result = await retrieveAnswer({ query: "display list of commands" }, { context });
```

Check the `src/index.ts` exports for a complete list of exported symbols.

## Data files

The package includes indexed JSON files used at runtime:

```
data/
 ├── commands.json
 ├── samples.json
 ├── registers.json
 ├── build_matrix.json
 └── feature_graph.json
```

During the build process these files are included in:

`dist/data/`

and published with the npm package.

## Relationship with BT820 MCP Server

This package is the core library layer used by:

`@bridgetek/bt820-mcp-server`

The MCP server provides the AI integration layer, while this package provides the underlying:

- knowledge retrieval
- sample discovery
- API lookup
- ranking and indexing capabilities

## Development

From the repo root (monorepo):

```bash
# install deps
npm install
# build this package
npm --prefix packages/bt820-eveapps-core run build
# or build all packages from root
npm run build
```

TypeScript path mapping in `packages/bt820-mcp-server/tsconfig.json` points at the local `src/index.ts` for fast development.

## Publishing

This package is scoped to the `@bridgetek` org. To publish:

```bash
cd packages/bt820-eveapps-core
# ensure version bumped if needed
npm version patch
npm publish --access public
```

Then publish dependent packages (for example `@bridgetek/bt820-mcp-server`) after the core package is available.

> [!NOTE]
> - The package is configured as a public scoped npm package.
> - If npm account security requires two-factor authentication, an OTP may be required during publishing.
> - Dependent packages such as `@bridgetek/bt820-mcp-server` should be updated after publishing a new core version.

## License

See the repository `LICENSE.md` for licensing details.

## Maintainers

BridgeTek internal team
