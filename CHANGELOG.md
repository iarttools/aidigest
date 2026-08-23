# Changelog

## v0.5.0 — All pioneering ideas
- F13 Model tiers (`--tier`, `--model`): small models get a TL;DR + more structure.
- F24 Aggressive mode (`--aggressive`): LLMLingua-style extra compression.
- F20 Streaming (`--stream`): block-by-block output.
- F21 Semantic diff (`aidigest diff a.txt b.txt`).
- F22 Multilingual dedup (`aidigest dedup items.json`).
- F23 WASM/edge bundle (`npm run web` -> `dist-web/aidigest.mjs`).
- F19 Knowledge Packs (`aidigest pack build` / `pack read`).

## v0.4.0 — Transparent proxy
- `aidigest proxy --port 8080`: point any agent fetch at the proxy, get distilled HTML.

## v0.3.0 — The standard
- AI-Readiness Score (`aidigest score`).
- `llms.txt` generator (`aidigest llms`).
- Draft spec `docs/ai-ready-spec.md`.

## v0.2.0 — For any AI
- MCP server (`aidigest-mcp`) discoverable by agents.
- Delta-fetch/cache, schema extraction, cost stats ledger.

## v0.1.0 — First digest
- Distill (Readability), receipt, budget-fit, prompt-injection scrub.

