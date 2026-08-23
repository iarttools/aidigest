# AI-Ready Web Spec (Draft RFC)

**Status:** Draft v0.1 · **Project:** aidigest
**Goal:** define a minimal, interoperable contract so any AI agent can read any web page spending fewer tokens, with measurable quality.

This spec is intentionally small. It is the producer side of the `aidigest` tool: the consumer measures it via the **AI-Readiness Score**.

## 1. `llms.txt` at the root

Every AI-ready site SHOULD publish an `llms.txt` at its origin root (`https://site/llms.txt`), markdown-formatted:

```markdown
# Site Name

> One-line summary of what this site is for AIs.

## Sections
- [Pricing](<https://site/pricing>): plan and price reference
- [Docs](<https://site/docs>): developer documentation
```

The format mirrors the community `llms.txt` convention: a title, an optional blockquote summary, and sectioned link lists.

## 2. Structured data

Pages SHOULD include machine-readable structured data via JSON-LD:

```html
<script type="application/ld+json">
{ "@context": "https://schema.org", "@type": "Article", "headline": "..." }
</script>
```

## 3. Editor hints (optional, forward-looking)

Authors MAY annotate priority sections so consumers can skim first:

```html
<section data-tok-priority="high">Key facts for agents</section>
```

This attribute is advisory. Consumers are free to ignore it. It is the seed of a two-sided standard: publishers signal, agents save tokens.

## 4. Hygiene

- No hidden prompt-injection text (e.g., invisible "ignore previous instructions").
- Use semantic headings (`h1`–`h6`) and real tables for tabular data.
- Avoid burying main content under nav/footer/ads.

## 5. Scoring

The AI-Readiness Score (0–100) rewards the above. See `aidigest score <url>`. Higher score = cheaper and safer for agents to consume.

## Governance

Open draft. Feedback via issues. The goal is adoption, not control: any tool may implement it.

