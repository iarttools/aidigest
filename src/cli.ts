#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Command } from 'commander';
import { extract } from './core/extract.js';
import { countTokens } from './core/tokens.js';
import { scanInjections, aggressiveCompress } from './core/scrub.js';
import { fitToBudget } from './core/budget.js';
import { digestDelta, hashText, type DeltaResult } from './core/cache.js';
import { extractBySchema, type JsonSchemaLike } from './core/schema.js';
import { recordStats, readStats, summarizeStats, renderStats, costUsd } from './core/stats.js';
import { scorePage, renderScore, type ScoreInput } from './core/score.js';
import { generateLlmsTxt } from './core/llms.js';
import { proxyFetch } from './core/proxy.js';
import { applyTier, resolveTier, type TierName } from './core/tiers.js';
import { semanticDiff } from './core/diff.js';
import { dedup, type DedupItem } from './core/dedup.js';
import { buildPack, renderPack } from './core/packs.js';
import { fetchDeclaration, sampleDeclaration, type SiteDeclaration } from './core/aidigest-txt.js';
import { fitToContract } from './core/contract.js';
import { SemanticCache } from './core/semcache.js';
import { recommendModel } from './core/route.js';
import { DigestRegistry } from './core/cdn.js';
import { multimodalDigest } from './core/multimodal.js';
import { PageRAG } from './core/rag.js';
import { spamScore } from './core/spam.js';
import { fetchText } from './core/fetch.js';
import { adaptTask, resolveTask, type TaskMode } from './core/tasks.js';
import { buildProvenance, renderSources } from './core/provenance.js';
import { assessQuality } from './core/quality.js';
import { redactSensitive } from './core/redact.js';
import { simulateSavings } from './core/savings.js';
import { HttpTextCache } from './core/httpcache.js';
import { isReadableContentType, normalizeSource } from './core/source.js';
import { buildContextMap, expandContext, renderContextMap, retrieveContext } from './core/context.js';
import { buildEvidenceGraph } from './core/evidence.js';
import { probeAcceleration } from './core/acceleration.js';
import { startDashboard } from './dashboard.js';
import * as http from 'node:http';
import * as net from 'node:net';
import { execFileSync, execSync } from 'node:child_process';
import { createAutomationConfig, defaultAutomationFile, readAutomationConfig, spawnDetached, stopDetached, writeAutomationConfig, type OperationMode } from './core/automation.js';

type Mode = 'digest' | 'schema' | 'delta' | 'schema+delta';

function modeOf(opts: Opts): Mode {
  if (opts.schema && opts.delta) return 'schema+delta';
  if (opts.schema) return 'schema';
  if (opts.delta) return 'delta';
  return 'digest';
}

interface Opts {
  budget?: number;
  scrub: boolean;
  json: boolean;
  delta: boolean;
  schema?: string;
  output?: string;
  tier?: TierName;
  model?: string;
  aggressive: boolean;
  stream: boolean;
  contract: boolean;
  semcache: boolean;
  task?: TaskMode;
  sources: boolean;
  redact: boolean;
  httpCache: boolean;
  question?: string;
  reversible: boolean;
  expand?: string;
}

function rawTextTokens(html: string): number {
  return countTokens(html);
}

const SEMCACHE_FILE = '.aidigest-semcache.json';

function loadSemCache(): SemanticCache {
  const c = new SemanticCache();
  try {
    const data = JSON.parse(readFileSync(SEMCACHE_FILE, 'utf8')) as { entries: CacheEntry[] };
    if (data.entries) c.load(data.entries);
  } catch {
    /* no cache yet */
  }
  return c;
}

function saveSemCache(c: SemanticCache): void {
  try {
    writeFileSync(SEMCACHE_FILE, JSON.stringify({ entries: c.entries() }), 'utf8');
  } catch {
    /* ignore persistence errors */
  }
}

interface CacheEntry {
  key: string;
  digest: string;
  text: string;
}

function parseBudget(value: string): number {
  const budget = Number(value);
  if (!Number.isInteger(budget) || budget <= 0) throw new Error('--budget must be a positive integer');
  return budget;
}

function parseNonNegative(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('value must be a non-negative number');
  return parsed;
}

function parseFraction(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) throw new Error('discount must be between 0 and 1');
  return parsed;
}

function assertHtmlResponse(response: Response, url: string): void {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    throw new Error(`unsupported content type ${contentType} for ${url}; aidigest currently accepts HTML pages`);
  }
}

function assertReadableResponse(response: Response, url: string): void {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!isReadableContentType(contentType)) throw new Error(`unsupported content type ${contentType} for ${url}; supported: HTML, Markdown, text, JSON and XML`);
}

function readSchema(file: string): JsonSchemaLike {
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as JsonSchemaLike;
  if (!parsed || typeof parsed !== 'object' || !parsed.properties || typeof parsed.properties !== 'object') {
    throw new Error('--schema must point to a JSON Schema-like file with a properties object');
  }
  return parsed;
}

const program = new Command();

program
  .name('aidigest')
  .description('AI-native web reader: digests any page into minimal tokens.')
  .argument('<url>', 'URL to digest')
  .option('-b, --budget <tokens>', 'max tokens; truncates if exceeded', parseBudget)
  .option('--no-scrub', 'disable prompt-injection scanning')
  .option('--json', 'machine-readable output')
  .option('--delta', 'return only changes since last digest of this URL')
  .option('--schema <file>', 'extract only fields requested by a JSON Schema-like file')
  .option('-o, --output <file>', 'write markdown to file instead of stdout')
  .option('--tier <tier>', 'model tier: nano | micro | mini | small | mid | max | ultra | research | coding | vision')
  .option('--model <model>', 'named model preset, e.g. gpt-4o, claude-3-opus')
  .option('--aggressive', 'LLMLingua-style extra compression for pure extraction')
  .option('--stream', 'emit output block-by-block (pay only what you consume)')
  .option('--contract', 'guarantee output <= budget via extractive summary (no truncation)')
  .option('--semcache', 'use a semantic cache across runs (reuse near-identical digests)')
  .option('--task <task>', 'adapt output: answer | research | coding | compare | vision | full')
  .option('--sources', 'append a provenance and citation manifest')
  .option('--redact', 'remove emails, phones, secrets, JWTs and card-like numbers')
  .option('--http-cache', 'reuse unchanged pages with ETag/Last-Modified validation')
  .option('--question <query>', 'keep only the context most relevant to a question')
  .option('--reversible', 'annotate blocks so selected context can be expanded later')
  .option('--expand <ids>', 'return selected reversible blocks, e.g. c1,c3')
  .action(async (url: string, opts: Opts) => {
    try {
      if (opts.contract && opts.budget === undefined) {
        throw new Error('--contract requires --budget <tokens>');
      }
      const httpCache = opts.httpCache ? new HttpTextCache() : undefined;
      const fetched = httpCache ? await httpCache.fetch(url) : { ...(await fetchText(url)), cacheHit: false };
      const res = fetched.response;
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      assertReadableResponse(res, url);
      const rawSource = fetched.text;
      const before = rawTextTokens(rawSource);

      let decl: SiteDeclaration | null = null;
      try {
        decl = await fetchDeclaration(new URL(url).origin);
      } catch {
        decl = null;
      }
      const profile = resolveTier(opts.model ?? decl?.tier, opts.tier ?? decl?.tier);
      const taskProfile = resolveTask(opts.task);

      const document = normalizeSource(rawSource, res.headers.get('content-type') ?? '', url);
      const { title, markdown } = document;
      if (!markdown.trim()) throw new Error(`could not extract readable content from ${url}`);
      const scan = opts.scrub === false ? { clean: markdown, hits: [] as string[] } : scanInjections(markdown);
      const hits = scan.hits;
      let out = scan.clean;
      const provenance = buildProvenance(markdown, url, title);
      const evidence = buildEvidenceGraph(markdown, provenance);
      out = adaptTask(out, taskProfile.task);
      if (opts.aggressive) out = aggressiveCompress(out);
      out = applyTier(out, profile);
      let contextMap = buildContextMap(out);
      let retrieval;
      if (opts.question) {
        retrieval = retrieveContext(contextMap, opts.question);
        out = retrieval.markdown;
        contextMap = buildContextMap(out);
      }
      if (opts.expand) out = expandContext(contextMap, opts.expand.split(','));
      if (opts.reversible) out = renderContextMap(buildContextMap(out));
      let redactions = 0;
      if (opts.redact) {
        const redacted = redactSensitive(out);
        out = redacted.text;
        redactions = redacted.total;
      }
      if (opts.sources) out += `\n\n---\n\n${renderSources(provenance)}`;

      if (opts.semcache) {
        const cache = loadSemCache();
        const cacheVariant = `${opts.scrub === false ? 'raw' : 'scrubbed'}:${profile.tier}:${opts.aggressive ? 'aggressive' : 'normal'}`;
        const hit = cache.get(markdown, cacheVariant);
        if (hit.hit && hit.digest) {
          out = hit.digest;
          process.stderr.write(`aidigest: semantic cache HIT (sim=${hit.similarity?.toFixed(2)})\n`);
        } else {
          cache.put(url, out, markdown, cacheVariant);
          saveSemCache(cache);
        }
      }

      let extracted: Record<string, unknown> | undefined;
      let deltaKey = url;
      if (opts.schema) {
        const schema = readSchema(opts.schema);
        extracted = extractBySchema(out, title, schema);
        out = JSON.stringify(extracted);
        deltaKey = `${url}::schema::${hashText(JSON.stringify(schema.properties))}`;
      }
      let delta: DeltaResult | undefined;
      if (opts.delta) {
        delta = digestDelta(deltaKey, out);
        out = delta.output;
      }
      const budget = opts.budget ?? decl?.budget ?? (opts.model || opts.tier ? profile.defaultBudget : opts.task ? taskProfile.defaultBudget : undefined);
      if (budget) out = opts.contract ? fitToContract(out, budget) : fitToBudget(out, budget);
      const after = countTokens(out);
      const saved = before > 0 ? Math.round((1 - after / before) * 100) : 0;
      const quality = assessQuality(rawSource, out, hits.length, provenance);

      recordStats({ url, before, after, mode: modeOf(opts), injections: hits.length, source: 'cli', tier: profile.tier, model: opts.model, task: taskProfile.task, quality: quality.score, redactions, cacheHit: fetched.cacheHit });

      if (opts.json) {
        process.stdout.write(
          JSON.stringify({ url, title, before, after, savedPct: saved, injections: hits, tier: profile.tier, task: taskProfile.task, model: opts.model, quality, provenance, evidence, context: contextMap, retrieval, redactions, cacheHit: fetched.cacheHit, extracted, delta, output: out }, null, 2)
        );
        return;
      }
      if (opts.stream) {
        const blocks = out.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
        for (const b of blocks) process.stdout.write(b + '\n\n');
      } else if (opts.output) {
        writeFileSync(opts.output, out + '\n', 'utf8');
        process.stderr.write(`aidigest: wrote ${opts.output}\n`);
      } else {
        process.stdout.write(out + '\n');
      }
      const model = opts.model ?? 'gpt-4o-mini';
      const savedUsd = costUsd(before - after, model);
      process.stderr.write(
        `\n=== aidigest receipt ===\nurl: ${url}\nbefore: ${before} tokens (raw)\n` +
          `after:  ${after} tokens (distilled)\nsaved:  ${saved}%\n` +
          `cost saved (${model}): $${savedUsd}\ninjections flagged: ${hits.length}\n` +
          `tier:  ${profile.tier}${opts.model ? ' (' + opts.model + ')' : ''}\ntask:  ${taskProfile.task}\nquality: ${quality.score}/100 (${quality.risk} risk)\n` +
          `cache: ${fetched.cacheHit ? 'HIT' : 'MISS'}\n` +
          (redactions ? `redactions: ${redactions}\n` : '') +
          (delta ? `delta:  ${delta.status} (+${delta.added}/-${delta.removed})\n` : '')
      );
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

const statsCommand = program
  .command('stats')
  .description('show accumulated token/cost savings from local ledger')
  .option('-m, --model <model>', 'model price to estimate savings', 'gpt-4o-mini')
  .action((opts: { model: string }) => {
    const summary = summarizeStats(readStats(), opts.model);
    process.stdout.write(renderStats(summary) + '\n');
  });

void statsCommand;

const savingsCommand = program
  .command('savings')
  .description('simulate token and cost savings for Claude, OpenAI or another model')
  .requiredOption('--raw-tokens <tokens>', 'raw input tokens per page', parseNonNegative)
  .requiredOption('--distilled-tokens <tokens>', 'digest input tokens per page', parseNonNegative)
  .option('--pages-per-day <pages>', 'pages processed per day', parseNonNegative, 100)
  .option('--days <days>', 'simulation window in days', parseNonNegative, 30)
  .option('-m, --model <model>', 'model pricing profile', 'claude-sonnet-4-6')
  .option('--output-tokens <tokens>', 'generated output tokens per page (informational)', parseNonNegative, 0)
  .option('--cache-discount <fraction>', 'input discount from cache, e.g. 0.9', parseFraction, 0)
  .option('--batch-discount <fraction>', 'input discount from batch, e.g. 0.5', parseFraction, 0)
  .option('--json', 'machine-readable output')
  .action((opts: { rawTokens: number; distilledTokens: number; pagesPerDay: number; days: number; model: string; outputTokens: number; cacheDiscount: number; batchDiscount: number; json?: boolean }, command: { opts: () => { json?: boolean }; parent?: { opts: () => { json?: boolean } } }) => {
    try {
      const result = simulateSavings({
        rawTokens: opts.rawTokens,
        distilledTokens: opts.distilledTokens,
        pagesPerDay: opts.pagesPerDay,
        days: opts.days,
        model: opts.model,
        outputTokensPerPage: opts.outputTokens,
        cacheDiscount: opts.cacheDiscount,
        batchDiscount: opts.batchDiscount,
      });
      const json = opts.json === true || command.opts().json === true || command.parent?.opts().json === true;
      if (json) {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        return;
      }
      process.stdout.write([
        '# aidigest savings lab',
        '',
        `Pages simulated: ${result.pages}`,
        `Input tokens: ${result.rawInputTokens.toLocaleString()} -> ${result.distilledInputTokens.toLocaleString()}`,
        `Tokens saved: ${result.tokensSaved.toLocaleString()} (${result.reductionPct}%)`,
        `Raw input cost: $${result.rawCostUsd}`,
        `Digest input cost: $${result.distilledCostUsd}`,
        `Estimated saving: $${result.totalSavingsUsd}`,
        '',
        ...result.assumptions.map((assumption) => `- ${assumption}`),
      ].join('\n') + '\n');
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void savingsCommand;

const accelerationCommand = program
  .command('acceleration')
  .description('detect WebGPU and run a safe hardware-acceleration probe')
  .option('--json', 'machine-readable output')
  .action(async (opts: { json?: boolean }, command: { opts: () => { json?: boolean }; parent?: { opts: () => { json?: boolean } } }) => {
    const result = await probeAcceleration();
    const json = opts.json === true || command.opts().json === true || command.parent?.opts().json === true;
    if (json) process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    else {
      process.stdout.write([
        '# aidigest acceleration',
        '',
        `Backend: ${result.backend.toUpperCase()}`,
        `Available: ${result.available ? 'yes' : 'no'}`,
        `Device: ${result.vendor} / ${result.device}`,
        `Probe: ${result.probeOk ? `${result.probeMs} ms` : 'fallback CPU'}`,
        result.reason,
      ].join('\n') + '\n');
    }
  });

void accelerationCommand;

function parseOperationMode(value: string): OperationMode {
  if (value === 'automatic' || value === 'auto') return 'automatic';
  if (value === 'manual') return 'manual';
  throw new Error('mode must be automatic or manual');
}

function validateRepository(value?: string): string | undefined {
  if (!value) return undefined;
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('--repo must be an HTTPS GitHub repository URL'); }
  if (url.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) throw new Error('--repo must point to github.com over HTTPS');
  return url.toString().replace(/\/$/, '');
}

function serveInvocation(port: number): { command: string; args: string[] } {
  const args = ['serve', '--port', String(port), '--no-dashboard', '--no-open'];
  if ((process as any).pkg) return { command: process.execPath, args };
  return { command: process.execPath, args: [process.argv[1] ?? resolve('dist', 'cli.js'), ...args] };
}

function registerAutomaticStart(port: number): void {
  if (process.platform !== 'win32') return;
  const invocation = serveInvocation(port);
  const quote = (value: string) => `"${value.replace(/"/g, '\\"')}"`;
  const command = [quote(invocation.command), ...invocation.args.map(quote)].join(' ');
  const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
  execFileSync('reg', ['add', key, '/v', 'aidigest', '/t', 'REG_SZ', '/d', command, '/f'], { stdio: 'ignore' });
}

function removeAutomaticStart(): void {
  if (process.platform !== 'win32') return;
  try { execFileSync('reg', ['delete', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', '/v', 'aidigest', '/f'], { stdio: 'ignore' }); } catch { /* already absent */ }
}

function setPersistentEnvironment(name: string, value: string): void {
  process.env[name] = value;
  if (process.platform === 'win32') {
    try { execFileSync('setx', [name, value], { stdio: 'ignore' }); } catch { process.stderr.write(`aidigest: no se pudo persistir ${name}; se mantiene solo en esta sesión\n`); }
  }
}

function clearPersistentEnvironment(name: string): void {
  delete process.env[name];
  if (process.platform === 'win32') {
    try { execFileSync('setx', [name, ''], { stdio: 'ignore' }); } catch { /* best effort */ }
  }
}

function configureAgentHook(mode: OperationMode): string | undefined {
  const agentPath = resolve(dirname(process.argv[1] ?? '.'), '..', 'agent.cjs');
  if (!existsSync(agentPath)) return undefined;
  const current = process.env.NODE_OPTIONS ?? '';
  const marker = `--require "${agentPath}"`;
  const without = current.replace(new RegExp(`\\s*--require\\s+["']?${agentPath.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}["']?`, 'g'), '').trim();
  const next = mode === 'automatic' ? `${without} ${marker}`.trim() : without;
  if (next) setPersistentEnvironment('NODE_OPTIONS', next);
  else clearPersistentEnvironment('NODE_OPTIONS');
  return agentPath;
}

function setProxyEnvironment(port: number): void {
  setPersistentEnvironment('HTTP_PROXY', `http://127.0.0.1:${port}`);
  setPersistentEnvironment('HTTPS_PROXY', `http://127.0.0.1:${port}`);
  setPersistentEnvironment('AIDIGEST_PROXY_URL', `http://127.0.0.1:${port}`);
  setPersistentEnvironment('NO_PROXY', 'localhost,127.0.0.1');
}

function clearProxyEnvironment(): void {
  for (const name of ['HTTP_PROXY', 'HTTPS_PROXY', 'AIDIGEST_PROXY_URL', 'NO_PROXY']) clearPersistentEnvironment(name);
}

function configureOperationMode(options: { mode: OperationMode; port: number; repo?: string; start?: boolean; systemProxy?: boolean }): { config: ReturnType<typeof createAutomationConfig>; agentPath?: string } {
  const file = defaultAutomationFile();
  const previous = readAutomationConfig(file);
  if (options.mode === 'manual') {
    stopDetached(previous?.servicePid);
    removeAutomaticStart();
    if (previous?.systemProxy) clearProxyEnvironment();
    configureAgentHook('manual');
    const config = createAutomationConfig({ mode: 'manual', port: options.port, repo: options.repo, systemProxy: false }, previous);
    writeAutomationConfig(config, file);
    return { config };
  }
  const invocation = serveInvocation(options.port);
  const servicePid = options.start === false ? undefined : spawnDetached(invocation.command, invocation.args);
  const config = createAutomationConfig({ mode: 'automatic', port: options.port, repo: options.repo, systemProxy: options.systemProxy !== false, servicePid }, previous);
  writeAutomationConfig(config, file);
  registerAutomaticStart(options.port);
  if (options.systemProxy !== false) setProxyEnvironment(options.port);
  const agentPath = configureAgentHook('automatic');
  return { config, agentPath };
}

const setupCommand = program
  .command('setup')
  .description('one-shot automatic onboarding for an AI agent or user')
  .option('--mode <mode>', 'automatic or manual', 'automatic')
  .option('-p, --port <port>', 'local proxy port', '8080')
  .option('--repo <url>', 'HTTPS GitHub repository URL used for this installation')
  .option('--yes', 'confirm dependency installation and automatic network setup')
  .option('--no-start', 'write configuration without starting the background proxy')
  .option('--no-system-proxy', 'do not persist HTTP_PROXY/HTTPS_PROXY for new processes')
  .option('--json', 'machine-readable output')
  .action((opts: { mode: string; port: string; repo?: string; yes?: boolean; start: boolean; systemProxy: boolean; json?: boolean }, command: { opts: () => { json?: boolean }; parent?: { opts: () => { json?: boolean } } }) => {
    try {
      const mode = parseOperationMode(opts.mode);
      const port = parsePort(opts.port, 'proxy');
      const repo = validateRepository(opts.repo);
      if (mode === 'automatic' && repo && opts.yes !== true) throw new Error('automatic GitHub setup changes dependencies and network settings; re-run with --yes after user approval');
      const result = configureOperationMode({ mode, port, repo, start: opts.start, systemProxy: opts.systemProxy });
      const payload = { mode, configFile: defaultAutomationFile(), port, proxyUrl: result.config.proxyUrl, servicePid: result.config.servicePid ?? null, systemProxy: result.config.systemProxy, agentHook: result.agentPath ?? null };
      const json = opts.json === true || command.opts().json === true || command.parent?.opts().json === true;
      if (json) process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
      else {
        process.stdout.write([
          '# aidigest setup',
          '',
          `Mode: ${mode}`,
          `Proxy: ${result.config.proxyUrl}`,
          `Config: ${defaultAutomationFile()}`,
          `Background service: ${result.config.servicePid ? 'started' : 'not started'}`,
          `System proxy: ${result.config.systemProxy ? 'enabled for new processes' : 'manual configuration'}`,
          result.agentPath ? `Node hook: ${result.agentPath}` : 'Node hook: use the proxy URL directly for non-Node agents',
          '',
          mode === 'automatic' ? 'The agent can now send every web read through aidigest.' : 'Automatic interception is disabled; use the commands explicitly.',
        ].join('\n') + '\n');
      }
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void setupCommand;

const modeCommand = program
  .command('mode [mode]')
  .description('show or switch between automatic and manual operation')
  .option('-p, --port <port>', 'proxy port when enabling automatic mode', '8080')
  .option('--repo <url>', 'repository URL to store in the configuration')
  .option('--no-system-proxy', 'do not persist HTTP_PROXY/HTTPS_PROXY when enabling automatic mode')
  .option('--json', 'machine-readable output')
  .action((value: string | undefined, opts: { port: string; repo?: string; systemProxy: boolean; json?: boolean }, command: { opts: () => { json?: boolean }; parent?: { opts: () => { json?: boolean } } }) => {
    try {
      const current = readAutomationConfig();
      if (!value) {
        const payload = current ?? { mode: 'manual', configFile: defaultAutomationFile(), reason: 'automatic mode has not been configured' };
        const json = opts.json === true || command.opts().json === true || command.parent?.opts().json === true;
        process.stdout.write((json ? JSON.stringify(payload, null, 2) : `aidigest mode: ${payload.mode}\nconfig: ${defaultAutomationFile()}\n`) + (json ? '\n' : ''));
        return;
      }
      const mode = parseOperationMode(value);
      const result = configureOperationMode({ mode, port: parsePort(opts.port, 'proxy'), repo: validateRepository(opts.repo), systemProxy: opts.systemProxy });
      process.stdout.write(`aidigest: mode ${mode}; proxy ${result.config.proxyUrl}; config ${defaultAutomationFile()}\n`);
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void modeCommand;

interface Analysis {
  before: number;
  after: number;
  injections: number;
  hasLlmsTxt: boolean;
  hasStructuredData: boolean;
  hasHeadings: boolean;
  hasTables: boolean;
  markdown: string;
  title: string | null;
}

async function analyze(url: string): Promise<Analysis> {
  const fetched = await fetchText(url);
  const res = fetched.response;
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  assertHtmlResponse(res, url);
  const html = fetched.text;
  const before = rawTextTokens(html);
  const { title, markdown } = extract(html, url);
  if (!markdown.trim()) throw new Error(`could not extract readable content from ${url}`);
  const hits = scanInjections(markdown).hits;
  const after = countTokens(markdown);
  let hasLlmsTxt = false;
  try {
    const root = new URL(url).origin + '/llms.txt';
    const llmRes = (await fetchText(root)).response;
    hasLlmsTxt = llmRes.ok;
  } catch {
    hasLlmsTxt = false;
  }
  return {
    before,
    after,
    injections: hits.length,
    hasLlmsTxt,
    hasStructuredData: /application\/ld\+json/i.test(html),
    hasHeadings: /^#{1,6}\s+/m.test(markdown),
    hasTables: /<table/i.test(html),
    markdown,
    title,
  };
}

const scoreCommand = program
  .command('score <url>')
  .description('compute the AI-Readiness Score (0-100) for a URL')
  .option('-o, --output <file>', 'write report to file instead of stdout')
  .action(async (url: string, opts: { output?: string }) => {
    try {
      const a = await analyze(url);
      const input: ScoreInput = {
        before: a.before,
        after: a.after,
        injections: a.injections,
        hasLlmsTxt: a.hasLlmsTxt,
        hasStructuredData: a.hasStructuredData,
        hasHeadings: a.hasHeadings,
        hasTables: a.hasTables,
      };
      const report = renderScore(scorePage(input), url) + '\n';
      if (opts.output) {
        writeFileSync(opts.output, report, 'utf8');
        process.stderr.write(`aidigest: wrote ${opts.output}\n`);
      } else {
        process.stdout.write(report);
      }
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void scoreCommand;

const llmsCommand = program
  .command('llms <url>')
  .description('generate an llms.txt for a URL (producer side of the standard)')
  .option('-o, --output <file>', 'write llms.txt to file instead of stdout')
  .action(async (url: string, opts: { output?: string }) => {
    try {
      const a = await analyze(url);
      const out = generateLlmsTxt(a.markdown, a.title);
      if (opts.output) {
        writeFileSync(opts.output, out, 'utf8');
        process.stderr.write(`aidigest: wrote ${opts.output}\n`);
      } else {
        process.stdout.write(out);
      }
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void llmsCommand;

const proxyCommand = program
  .command('proxy')
  .description('start a transparent digest proxy: point any agent fetch at http://localhost:PORT?url=<page>')
  .option('-p, --port <port>', 'listen port', '8080')
  .option('-b, --budget <tokens>', 'max tokens per response', parseBudget)
  .option('--no-scrub', 'disable prompt-injection scanning')
  .option('--tier <tier>', 'model tier: nano | micro | mini | small | mid | max | ultra | research | coding | vision')
  .option('--model <model>', 'named model preset')
  .option('--aggressive', 'extra compression')
  .option('--task <task>', 'adapt output: answer | research | coding | compare | vision | full')
  .option('--sources', 'append provenance and citation manifest')
  .option('--redact', 'remove sensitive data before returning content')
  .option('--http-cache', 'reuse unchanged HTML pages with ETag/Last-Modified validation')
  .action(async (opts: { port: string; budget?: number; scrub: boolean; tier?: TierName; model?: string; aggressive: boolean; task?: TaskMode; sources?: boolean; redact?: boolean; httpCache?: boolean }) => {
    const port = parsePort(opts.port, 'proxy');
    const registry = new DigestRegistry();
    const httpCache = opts.httpCache ? new HttpTextCache('.aidigest-http-cache.proxy.json') : undefined;
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const target = url.searchParams.get('url');
        if (!target) {
          res.writeHead(400, { 'content-type': 'text/plain' });
          res.end('missing ?url=');
          return;
        }
        if (url.pathname === '/digest' && registry.has(target)) {
          const d = registry.get(target)!;
          res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8', 'x-aidigest-cdn': 'hit' });
          res.end(d.markdown);
          return;
        }
        const r = await proxyFetch({
          method: req.method ?? 'GET',
          target,
          headers: requestHeaders(req),
          budget: opts.budget,
          scrub: opts.scrub !== false,
          tier: opts.tier,
          model: opts.model,
          aggressive: opts.aggressive,
          task: opts.task,
          includeSources: opts.sources,
          redact: opts.redact,
          httpCache,
        });
        if (r.status === 200 && url.pathname === '/digest' && typeof r.body === 'string' && r.contentType.includes('text/markdown')) {
          registry.publish({ url: target, markdown: r.body, tokens: r.after, publishedAt: new Date().toISOString() });
        }
        if (r.status === 200) {
          recordStats({ url: target, before: r.before, after: r.after, mode: 'digest', injections: r.injections, source: 'proxy', tier: opts.tier, task: r.task, quality: r.quality?.score, redactions: r.redactions, cacheHit: r.cacheHit });
        }
        res.writeHead(r.status, {
          'content-type': r.contentType,
          'x-aidigest-before': String(r.before),
          'x-aidigest-after': String(r.after),
          'x-aidigest-saved': String(r.savedPct),
          'x-aidigest-injections': String(r.injections),
          'x-aidigest-quality': String(r.quality?.score ?? 0),
          'x-aidigest-task': String(r.task ?? opts.task ?? 'research'),
          'x-aidigest-redactions': String(r.redactions ?? 0),
          'x-aidigest-cache': r.cacheHit ? 'HIT' : 'MISS',
        });
        res.end(r.body);
      } catch (e) {
        res.writeHead(500, { 'content-type': 'text/plain' });
        res.end('aidigest proxy error: ' + (e as Error).message);
      }
    });
    attachConnectTunnel(server);
    server.listen(port, '127.0.0.1', () => {
      process.stderr.write(`aidigest proxy listening on http://localhost:${port}?url=<page>\n`);
    });
  });

void proxyCommand;

const diffCommand = program
  .command('diff <a> <b>')
  .description('semantic diff between two text files (returns similarity + surfaced terms)')
  .action((a: string, b: string) => {
    try {
      const ta = readFileSync(a, 'utf8');
      const tb = readFileSync(b, 'utf8');
      const d = semanticDiff(ta, tb);
      process.stdout.write(
        JSON.stringify({ similarity: Number(d.similarity.toFixed(3)), added: d.added, removed: d.removed }, null, 2) + '\n'
      );
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void diffCommand;

const dedupCommand = program
  .command('dedup <items.json>')
  .description('cluster near-duplicate documents (same-language) and report canonical + duplicates')
  .action((file: string) => {
    try {
      const items = JSON.parse(readFileSync(file, 'utf8')) as DedupItem[];
      if (!Array.isArray(items)) throw new Error('items.json must be an array of {id,text}');
      const groups = dedup(items);
      const out = groups.map((g) => ({ canonical: g.canonical.id, duplicates: g.duplicates.map((d) => d.id) }));
      process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void dedupCommand;

const packCommand = program
  .command('pack <action> [args...]')
  .description('knowledge packs: build <name> <urls...> | read <file.aidigest.json>')
  .action(async (action: string, args: string[]) => {
    try {
      if (action === 'build') {
        const [name, ...urls] = args;
        if (!name || urls.length === 0) throw new Error('usage: aidigest pack build <name> <url...>');
        const sources = [];
        for (const u of urls) {
          const fetched = await fetchText(u);
          const res = fetched.response;
          if (!res.ok) throw new Error(`HTTP ${res.status} for ${u}`);
          assertHtmlResponse(res, u);
          sources.push({ url: u, html: fetched.text });
        }
        const pack = buildPack(name, sources);
        const outFile = `${name}.aidigest.json`;
        writeFileSync(outFile, JSON.stringify(pack, null, 2), 'utf8');
        process.stderr.write(`aidigest: built ${pack.entries.length} entries -> ${outFile}\n`);
        return;
      }
      if (action === 'read') {
        const [file] = args;
        if (!file) throw new Error('usage: aidigest pack read <file.aidigest.json>');
        const pack = JSON.parse(readFileSync(file, 'utf8'));
        process.stdout.write(renderPack(pack));
        return;
      }
      throw new Error('unknown pack action (use build or read)');
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void packCommand;

async function fetchPage(url: string): Promise<{ html: string; markdown: string; title: string | null }> {
  const fetched = await fetchText(url);
  const res = fetched.response;
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  assertHtmlResponse(res, url);
  const html = fetched.text;
  const { title, markdown } = extract(html, url);
  return { html, markdown, title };
}

const txtCommand = program
  .command('txt [url]')
  .description('show a site\'s aidigest.txt declaration (the robots.txt for agents)')
  .option('--make', 'print a sample aidigest.txt to adopt on your site')
  .action(async (url: string | undefined, opts: { make?: boolean }) => {
    try {
      if (opts.make) {
        process.stdout.write(sampleDeclaration());
        return;
      }
      if (!url) throw new Error('provide a <url> or use --make');
      const decl = await fetchDeclaration(new URL(url).origin);
      process.stdout.write(JSON.stringify(decl ?? {}, null, 2) + '\n');
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void txtCommand;

const routeCommand = program
  .command('route <url>')
  .description('recommend the cheapest model that can read this page within budget')
  .option('--tier <tier>', 'required minimum tier')
  .action(async (url: string, opts: { tier?: TierName }) => {
    try {
      const { markdown } = await fetchPage(url);
      const after = countTokens(markdown);
      const r = recommendModel(after, opts.tier);
      process.stdout.write(JSON.stringify({ url, afterTokens: after, ...r }, null, 2) + '\n');
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void routeCommand;

const spamCommand = program
  .command('spam <url>')
  .description('score how poisoned/SPAM-oriented a page is for AI agents')
  .action(async (url: string) => {
    try {
      const { html, markdown } = await fetchPage(url);
      const report = spamScore(html, markdown);
      process.stdout.write(JSON.stringify({ url, ...report }, null, 2) + '\n');
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void spamCommand;

const askCommand = program
  .command('ask <url> [query...]')
  .description('single-page RAG: retrieve the most relevant passages (read once, ask many)')
  .action(async (url: string, query: string[]) => {
    try {
      const { markdown } = await fetchPage(url);
      const rag = new PageRAG();
      rag.index(markdown);
      const ans = rag.answer(query.join(' '));
      process.stdout.write(ans.join('\n\n') + '\n');
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void askCommand;

const multimodalCommand = program
  .command('multimodal <url>')
  .description('multimodal digest: text plus extracted images/captions/tables for vision agents')
  .action(async (url: string) => {
    try {
      const { html } = await fetchPage(url);
      const d = multimodalDigest(html, url);
      process.stdout.write(d.markdown + '\n\n' + JSON.stringify({ images: d.images, tables: d.tables }, null, 2) + '\n');
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void multimodalCommand;

const CDN_FILE = '.aidigest-cdn.json';

function loadRegistry(): DigestRegistry {
  const reg = new DigestRegistry();
  try {
    const data = readFileSync(CDN_FILE, 'utf8');
    reg.importJson(data);
  } catch {
    /* no registry yet */
  }
  return reg;
}

function saveRegistry(reg: DigestRegistry): void {
  try {
    writeFileSync(CDN_FILE, reg.exportJson(), 'utf8');
  } catch {
    /* ignore */
  }
}

const cdnCommand = program
  .command('cdn <action> [url]')
  .description('shared digest registry (mini CDN): publish | get | list | export | import <file>')
  .action(async (action: string, url?: string) => {
    try {
      const reg = loadRegistry();
      if (action === 'publish' && url) {
        const { markdown } = await fetchPage(url);
        reg.publish({ url, markdown, tokens: countTokens(markdown), publishedAt: new Date().toISOString() });
        saveRegistry(reg);
        process.stderr.write(`aidigest: published ${url} to local CDN\n`);
        return;
      }
      if (action === 'get' && url) {
        const d = reg.get(url);
        process.stdout.write(d ? d.markdown : '');
        return;
      }
      if (action === 'list') {
        process.stdout.write(JSON.stringify(reg.list(), null, 2) + '\n');
        return;
      }
      if (action === 'export') {
        process.stdout.write(reg.exportJson() + '\n');
        return;
      }
      if (action === 'import' && url) {
        const n = reg.importJson(readFileSync(url, 'utf8'));
        saveRegistry(reg);
        process.stderr.write(`aidigest: imported ${n} digests\n`);
        return;
      }
      throw new Error('usage: cdn publish|get|list|export|import <url>');
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void cdnCommand;

const dashboardCommand = program
  .command('dashboard [port]')
  .description('open the live user panel (web dashboard) in your browser')
  .action((port?: string) => {
    try {
      startDashboard({ port: port ? Number(port) : undefined, open: true });
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void dashboardCommand;

const serveCommand = program
  .command('serve')
  .description('run the transparent proxy + live dashboard automatically (background service for the AI)')
  .option('-p, --port <port>', 'proxy listen port', '8080')
  .option('-d, --dash <port>', 'dashboard port', '8090')
  .option('--no-dashboard', 'run only the proxy service')
  .option('--no-open', 'do not open the dashboard in a browser')
  .option('--install-proxy', 'register localhost as the system HTTP proxy (revert with --uninstall-proxy)')
  .option('--uninstall-proxy', 'remove the aidigest system HTTP proxy registration')
  .action((opts: { port: string; dash: string; dashboard: boolean; open: boolean; installProxy?: boolean; uninstallProxy?: boolean }) => {
    try {
      if (opts.uninstallProxy) {
        setSystemProxy('');
        process.stderr.write('aidigest: system proxy cleared\n');
        return;
      }
      const proxyPort = parsePort(opts.port, 'proxy');
      const dashPort = parsePort(opts.dash, 'dashboard');
      const registry = new DigestRegistry();
      const proxyState = { on: false };

      const server = http.createServer(async (req, res) => {
        try {
          const u = new URL(req.url ?? '/', 'http://localhost');
          const target = u.searchParams.get('url') ?? absoluteTarget(req);
          if (!target) {
            res.writeHead(400, { 'content-type': 'text/plain' });
            res.end('missing ?url= (or use an absolute http URL through the proxy)');
            return;
          }
          if (u.pathname === '/digest' && registry.has(target)) {
            const d = registry.get(target)!;
            res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8', 'x-aidigest-cdn': 'hit' });
            res.end(d.markdown);
            return;
          }
          const r = await proxyFetch({
            method: req.method ?? 'GET',
            target,
            headers: requestHeaders(req),
            budget: undefined,
            scrub: true,
          });
          if (r.status === 200 && u.pathname === '/digest' && typeof r.body === 'string' && r.contentType.includes('text/markdown')) {
            registry.publish({ url: target, markdown: r.body, tokens: r.after, publishedAt: new Date().toISOString() });
          }
          if (r.status === 200) {
            recordStats({ url: target, before: r.before, after: r.after, mode: 'digest', injections: r.injections, source: 'proxy' });
          }
          res.writeHead(r.status, {
            'content-type': r.contentType,
            'x-aidigest-before': String(r.before),
            'x-aidigest-after': String(r.after),
            'x-aidigest-saved': String(r.savedPct),
            'x-aidigest-injections': String(r.injections),
          });
          res.end(r.body);
        } catch (e) {
          res.writeHead(500, { 'content-type': 'text/plain' });
          res.end('aidigest proxy error: ' + (e as Error).message);
        }
      });

      attachConnectTunnel(server);

      server.listen(proxyPort, '127.0.0.1', () => process.stderr.write(`aidigest proxy listening on http://localhost:${proxyPort}?url=<page>\n`));
      if (opts.dashboard) {
        startDashboard({
          port: dashPort,
          open: opts.open,
          proxy: {
            get: () => proxyState.on,
            set: (on: boolean) => {
              proxyState.on = on;
              setSystemProxy(on ? `localhost:${proxyPort}` : '');
            },
          },
        });
      }
      if (opts.installProxy) {
        proxyState.on = true;
        setSystemProxy(`localhost:${proxyPort}`);
        process.stderr.write(`aidigest: system HTTP proxy set to localhost:${proxyPort}\n`);
      }
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

function absoluteTarget(req: http.IncomingMessage): string | null {
  const u = req.url ?? '';
  return /^https?:\/\//i.test(u) ? u : null;
}

void serveCommand;

function parsePort(value: string, name: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`${name} port must be an integer from 0 to 65535`);
  return port;
}

function requestHeaders(req: http.IncomingMessage): Record<string, string> {
  const excluded = new Set(['connection', 'host', 'keep-alive', 'proxy-connection', 'transfer-encoding']);
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (!excluded.has(name) && typeof value === 'string') headers[name] = value;
  }
  return headers;
}

function attachConnectTunnel(server: http.Server): void {
  server.on('connect', (creq, clientSocket, head) => {
    const raw = creq.url ?? '';
    const match = raw.match(/^\[([^\]]+)\]:(\d{1,5})$/) ?? raw.match(/^([^:]+):(\d{1,5})$/);
    const host = match?.[1];
    const targetPort = match ? Number(match[2]) : 0;
    if (!host || !Number.isInteger(targetPort) || targetPort < 1 || targetPort > 65535) {
      clientSocket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
      return;
    }
    const upstream = net.connect({ host, port: targetPort });
    let connected = false;
    const fail = () => {
      if (!clientSocket.destroyed) {
        if (connected) clientSocket.destroy();
        else clientSocket.end('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n');
      }
      upstream.destroy();
    };
    upstream.once('connect', () => {
      connected = true;
      upstream.setTimeout(0);
      clientSocket.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: aidigest\r\n\r\n');
      if (head.length) upstream.write(head);
      upstream.pipe(clientSocket);
      clientSocket.pipe(upstream);
    });
    upstream.setTimeout(30_000, fail);
    upstream.on('error', fail);
    clientSocket.on('error', () => upstream.destroy());
  });
}

const installCommand = program
  .command('install')
  .description('install aidigest to start automatically and (optionally) intercept the AI\'s web traffic')
  .option('--proxy', 'also register localhost as the system HTTP proxy')
  .action((opts: { proxy?: boolean }) => {
    try {
      const result = configureOperationMode({ mode: 'automatic', port: 8080, start: true, systemProxy: opts.proxy === true });
      process.stderr.write('aidigest: automatic mode enabled and background service registered\n');
      process.stderr.write(`aidigest: config ${defaultAutomationFile()}\n`);
      process.stderr.write(`aidigest: proxy ${result.config.proxyUrl}\n`);
      process.stderr.write(opts.proxy ? 'aidigest: HTTP_PROXY/HTTPS_PROXY enabled for new processes\n' : 'aidigest: system proxy unchanged; use --proxy to intercept new agent processes\n');
      if (result.agentPath) process.stderr.write(`aidigest: Node hook ${result.agentPath}\n`);
      process.stderr.write('Use "aidigest mode manual" to disable automatic interception.\n');
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void installCommand;

const uninstallCommand = program
  .command('uninstall')
  .description('remove aidigest auto-start and system proxy registration')
  .action(() => {
    try {
      const current = readAutomationConfig();
      configureOperationMode({ mode: 'manual', port: current?.port ?? 8080, systemProxy: false });
      process.stderr.write('aidigest: auto-start y proxy del sistema eliminados\n');
    } catch (e) {
      process.stderr.write('aidigest error: ' + (e as Error).message + '\n');
      process.exit(1);
    }
  });

void uninstallCommand;

const pacCommand = program
  .command('pac')
  .description('print a PAC file so browsers/OS route web traffic through aidigest (HTTPS is tunneled, no MITM)')
  .option('-p, --port <port>', 'proxy port', '8080')
  .option('-w, --write', 'write the PAC to aidigest.pac in the current directory')
  .action((opts: { port: string; write?: boolean }) => {
    const port = String(parsePort(opts.port, 'proxy'));
    const pac = `function FindProxyForURL(url, host) {
  if (shExpMatch(host, 'localhost') || shExpMatch(host, '127.0.0.1') || shExpMatch(host, '[::1]')) return 'DIRECT';
  return 'PROXY 127.0.0.1:${port}; DIRECT';
}
`;
    if (opts.write) {
      writeFileSync('aidigest.pac', pac, 'utf8');
      process.stderr.write('aidigest: wrote aidigest.pac\n');
    }
    process.stdout.write(pac);
  });

void pacCommand;

function setSystemProxy(value: string): void {
  if (process.platform !== 'win32') {
    process.stderr.write('aidigest: en Windows fija HTTP_PROXY/HTTPS_PROXY. En este sistema configúralo manualmente:\n' +
      `  HTTP_PROXY=http://${value || '127.0.0.1:8080'}  HTTPS_PROXY=http://${value || '127.0.0.1:8080'}  NO_PROXY=localhost,127.0.0.1\n`);
    return;
  }
  try {
    if (!value) {
      execSync('setx HTTP_PROXY ""', { stdio: 'ignore' });
      execSync('setx HTTPS_PROXY ""', { stdio: 'ignore' });
      execSync('setx NO_PROXY ""', { stdio: 'ignore' });
    } else {
      const url = `http://${value}`;
      execSync(`setx HTTP_PROXY "${url}"`, { stdio: 'ignore' });
      execSync(`setx HTTPS_PROXY "${url}"`, { stdio: 'ignore' });
      execSync('setx NO_PROXY "localhost,127.0.0.1"', { stdio: 'ignore' });
    }
  } catch {
    process.stderr.write('aidigest: no se pudo fijar el proxy del sistema (omitiendo; configúralo manualmente)\n');
  }
}

program.parseAsync(process.argv);

