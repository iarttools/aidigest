# Contributing to aidigest

Thanks for helping make the web cheaper for agents. This project is intentionally small and auditable.

## Quick start

```bash
npm install
npm test          # 26 unit tests, must stay green
npm run build     # compile src/ -> dist/
npm run exe       # build the standalone Windows .exe (needs esbuild + @yao-pkg/pkg)
npm run web       # build the browser/edge bundle (dist-web/aidigest.mjs)
```

## Rules

- **Every feature needs a test.** Add `src/core/<feature>.test.ts`. Run `npm test`.
- **Every digest must print a receipt** (before/after tokens, saved %). Users trust numbers, not claims.
- **New behavior goes in `src/core/`, CLI/MCP wiring stays thin.** Keep the core importable (also from the browser bundle).
- **Ideas live in the catalog** (`DISENO-CONSTRUCCION.md`, features F01–F24). Add new ideas to the Parking Lot before implementing.
- **No breaking changes to the CLI/MCP contract** without a major version bump.

## Project shape

- `src/core/*` — pure, testable logic (extract, tokens, scrub, budget, cache, schema, stats, score, llms, tiers, stream, diff, dedup, packs, proxy).
- `src/cli.ts` — the `aidigest` command.
- `src/mcp.ts` — the `aidigest-mcp` server (discoverable by any MCP agent).
- `src/web.ts` — browser/edge entry (subset of core, bundled by esbuild).

## Releasing

Only maintainers publish. `npm publish` runs `prepublishOnly` (build) automatically.

