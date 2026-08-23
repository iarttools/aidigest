#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { countTokens } from './core/tokens.js';
import { scanInjections } from './core/scrub.js';
import { fitToBudget } from './core/budget.js';
import { digestDelta, hashText } from './core/cache.js';
import { extractBySchema, type JsonSchemaLike } from './core/schema.js';
import { recordStats, costUsd } from './core/stats.js';
import { fetchText } from './core/fetch.js';
import { adaptTask, resolveTask, type TaskMode } from './core/tasks.js';
import { buildProvenance, renderSources } from './core/provenance.js';
import { assessQuality } from './core/quality.js';
import { redactSensitive } from './core/redact.js';
import { isReadableContentType, normalizeSource } from './core/source.js';
import { buildContextMap, expandContext, renderContextMap, retrieveContext } from './core/context.js';
import { buildEvidenceGraph } from './core/evidence.js';
import { createAutomationConfig, defaultAutomationFile, readAutomationConfig, spawnDetached, stopDetached, writeAutomationConfig, type OperationMode } from './core/automation.js';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

type Mode = 'digest' | 'schema' | 'delta' | 'schema+delta';

function modeOf(opts: { schema?: unknown; delta?: boolean }): Mode {
  if (opts.schema && opts.delta) return 'schema+delta';
  if (opts.schema) return 'schema';
  if (opts.delta) return 'delta';
  return 'digest';
}

const server = new Server(
  { name: 'aidigest', version: '0.8.0' },
  { capabilities: { tools: {} } }
);

function rawTokens(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return countTokens(text);
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'aidigest_digest',
      description:
        'Fetch a URL and return its main content distilled into minimal tokens (markdown) with a token-saving receipt. Use this instead of reading raw HTML to save 60–90% tokens.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to digest' },
          budget: {
            type: 'number',
            description: 'optional max tokens; output is truncated to fit',
          },
          delta: {
            type: 'boolean',
            description: 'optional: return only changes since the last digest of this URL',
          },
          schema: {
            type: 'object',
            description: 'optional JSON Schema-like object. If provided, returns only requested fields.',
          },
          task: { type: 'string', enum: ['answer', 'research', 'coding', 'compare', 'vision', 'full'], description: 'output strategy' },
          sources: { type: 'boolean', description: 'include provenance and citation manifest' },
          redact: { type: 'boolean', description: 'remove sensitive data before returning content' },
          question: { type: 'string', description: 'keep only blocks relevant to this question' },
          reversible: { type: 'boolean', description: 'annotate blocks for later expansion' },
          expand: { type: 'string', description: 'comma-separated reversible block ids, e.g. c1,c3' },
        },
        required: ['url'],
      },
    },
    {
      name: 'aidigest_mode',
      description: 'Switch aidigest between automatic web interception and manual command-only operation. Use automatic by default after the user has approved the repository installation; use manual when explicitly requested.',
      inputSchema: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['automatic', 'manual'] },
          port: { type: 'number', description: 'local proxy port when enabling automatic mode' },
          repo: { type: 'string', description: 'GitHub repository URL associated with this installation' },
        },
        required: ['mode'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === 'aidigest_mode') {
    const args = (req.params.arguments ?? {}) as { mode?: unknown; port?: unknown; repo?: unknown };
    const mode = args.mode === 'automatic' || args.mode === 'manual' ? args.mode as OperationMode : null;
    if (!mode) return { content: [{ type: 'text', text: 'aidigest error: mode must be automatic or manual' }], isError: true };
    const previous = readAutomationConfig();
    const port = typeof args.port === 'number' && Number.isInteger(args.port) && args.port >= 0 && args.port <= 65535 ? args.port : previous?.port ?? 8080;
    let servicePid: number | undefined;
    if (mode === 'manual') {
      stopDetached(previous?.servicePid);
    } else {
      const cliPath = resolve(dirname(process.argv[1] ?? ''), 'cli.js');
      if (existsSync(cliPath)) servicePid = spawnDetached(process.execPath, [cliPath, 'serve', '--port', String(port), '--no-dashboard', '--no-open']);
    }
    const config = createAutomationConfig({ mode, port, repo: typeof args.repo === 'string' ? args.repo : undefined, systemProxy: false, servicePid }, previous);
    writeAutomationConfig(config);
    return { content: [{ type: 'text', text: JSON.stringify({ mode, configFile: defaultAutomationFile(), proxyUrl: config.proxyUrl, servicePid: config.servicePid ?? null, note: mode === 'automatic' ? 'Node agents with agent.cjs enabled and MCP web reads can now use aidigest automatically.' : 'Automatic interception disabled; use aidigest_digest explicitly.' }, null, 2) }] };
  }
  if (req.params.name !== 'aidigest_digest') return { content: [{ type: 'text', text: `aidigest error: unknown tool ${req.params.name}` }], isError: true };
  const args = (req.params.arguments ?? {}) as { url?: unknown; budget?: unknown; delta?: unknown; schema?: unknown; task?: unknown; sources?: unknown; redact?: unknown; question?: unknown; reversible?: unknown; expand?: unknown };
  const url = typeof args.url === 'string' ? args.url : '';
  const budget = typeof args.budget === 'number' && Number.isInteger(args.budget) && args.budget > 0 ? args.budget : undefined;
  const useDelta = args.delta === true;
  const schema = args.schema && typeof args.schema === 'object' && 'properties' in args.schema ? args.schema as JsonSchemaLike : undefined;
  const task = resolveTask(typeof args.task === 'string' ? args.task : undefined);
  const includeSources = args.sources === true;
  const redact = args.redact === true;
  const question = typeof args.question === 'string' ? args.question : undefined;
  const reversible = args.reversible === true;
  const expand = typeof args.expand === 'string' ? args.expand : undefined;
  if (!url) {
    return { content: [{ type: 'text', text: 'aidigest error: missing url' }], isError: true };
  }
  try {
    const fetched = await fetchText(url);
    const res = fetched.response;
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const contentType = res.headers.get('content-type')?.toLowerCase() ?? '';
    if (!isReadableContentType(contentType)) {
      throw new Error(`unsupported content type ${contentType}; supported: HTML, Markdown, text, JSON and XML`);
    }
    const rawSource = fetched.text;
    const before = rawTokens(rawSource);
    const document = normalizeSource(rawSource, contentType, url);
    const { title, markdown } = document;
    if (!markdown.trim()) throw new Error(`could not extract readable content from ${url}`);
    const scan = scanInjections(markdown);
    const hits = scan.hits;
    let out = scan.clean;
    const provenance = buildProvenance(markdown, url, title);
    const evidence = buildEvidenceGraph(markdown, provenance);
    out = adaptTask(out, task.task);
    let contextMap = buildContextMap(out);
    let retrieval;
    if (question) {
      retrieval = retrieveContext(contextMap, question);
      out = retrieval.markdown;
      contextMap = buildContextMap(out);
    }
    if (expand) out = expandContext(contextMap, expand.split(','));
    if (reversible) out = renderContextMap(buildContextMap(out));
    let redactions = 0;
    if (redact) {
      const result = redactSensitive(out);
      out = result.text;
      redactions = result.total;
    }
    if (includeSources) out += `\n\n---\n\n${renderSources(provenance)}`;
    let deltaKey = url;
    if (schema) {
      out = JSON.stringify(extractBySchema(markdown, title, schema));
      deltaKey = `${url}::schema::${hashText(JSON.stringify(schema.properties))}`;
    }
    const delta = useDelta ? digestDelta(deltaKey, out) : undefined;
    if (delta) out = delta.output;
    if (budget) out = fitToBudget(out, budget);
    const after = countTokens(out);
    const quality = assessQuality(rawSource, out, hits.length, provenance);
    const saved = before > 0 ? Math.round((1 - after / before) * 100) : 0;
    recordStats({ url, before, after, mode: modeOf({ schema, delta: useDelta }), injections: hits.length, source: 'mcp', task: task.task, quality: quality.score, redactions });
    const savedUsd = costUsd(before - after, 'gpt-4o-mini');
    const receipt =
      `=== aidigest receipt ===\nurl: ${url}\nbefore: ${before} tokens (raw)\n` +
      `after:  ${after} tokens (distilled)\nsaved:  ${saved}%\n` +
      `cost saved (gpt-4o-mini): $${savedUsd}\ninjections flagged: ${hits.length}\ntask: ${task.task}\nquality: ${quality.score}/100 (${quality.risk} risk)\nredactions: ${redactions}` +
      (delta ? `\ndelta:  ${delta.status} (+${delta.added}/-${delta.removed})` : '');
    return {
      content: [
        { type: 'text', text: out },
        { type: 'text', text: receipt },
        { type: 'text', text: JSON.stringify({ quality, provenance, evidence, context: contextMap, retrieval, redactions, task: task.task }) },
      ],
    };
  } catch (e) {
    return {
      content: [{ type: 'text', text: 'aidigest error: ' + (e as Error).message }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
server.connect(transport).catch((e) => {
  process.stderr.write('aidigest-mcp error: ' + (e as Error).message + '\n');
  process.exit(1);
});

