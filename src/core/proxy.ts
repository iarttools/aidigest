import { extract } from './extract.js';
import { countTokens } from './tokens.js';
import { scanInjections, aggressiveCompress } from './scrub.js';
import { fitToBudget } from './budget.js';
import { applyTier, resolveTier, type TierName } from './tiers.js';
import { adaptTask, resolveTask, type TaskMode } from './tasks.js';
import { buildProvenance, renderSources, type Provenance } from './provenance.js';
import { assessQuality, type QualityReport } from './quality.js';
import { redactSensitive } from './redact.js';
import { HttpTextCache } from './httpcache.js';

export interface ProxyRequest {
  method: string;
  target: string;
  headers?: Record<string, string>;
  budget?: number;
  scrub?: boolean;
  tier?: TierName;
  model?: string;
  aggressive?: boolean;
  task?: TaskMode;
  includeSources?: boolean;
  redact?: boolean;
  httpCache?: HttpTextCache;
  fetchFn?: typeof fetch;
}

export interface ProxyResponse {
  status: number;
  contentType: string;
  body: string | Uint8Array;
  before: number;
  after: number;
  savedPct: number;
  injections: number;
  task?: TaskMode;
  quality?: QualityReport;
  provenance?: Provenance;
  redactions?: number;
  cacheHit?: boolean;
}

function rawTextTokens(html: string): number {
  return countTokens(html);
}

const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;
const RESPONSE_TIMEOUT_MS = 30_000;

class ResponseTooLargeError extends Error {}

function validateTarget(target: string): URL {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    throw new Error('target must be an absolute http(s) URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('target must use http or https');
  }
  return url;
}

function isTextResponse(contentType: string): boolean {
  const ct = contentType.toLowerCase();
  return ct.startsWith('text/') || /(?:json|xml|javascript|svg|x-www-form-urlencoded)/.test(ct);
}

async function readLimitedText(res: Awaited<ReturnType<typeof fetch>>): Promise<string> {
  if (!res.body) {
    const text = await res.text();
    if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new ResponseTooLargeError('upstream response exceeds 10 MB');
    return text;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new ResponseTooLargeError('upstream response exceeds 10 MB');
      }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function readLimitedBytes(res: Awaited<ReturnType<typeof fetch>>): Promise<Uint8Array> {
  if (!res.body) {
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > MAX_RESPONSE_BYTES) throw new ResponseTooLargeError('upstream response exceeds 10 MB');
    return bytes;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new ResponseTooLargeError('upstream response exceeds 10 MB');
      }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function proxyFetch(req: ProxyRequest): Promise<ProxyResponse> {
  const doFetch = req.fetchFn ?? fetch;
  if (req.method.toUpperCase() !== 'GET') {
    return { status: 405, contentType: 'text/plain', body: 'method not supported', before: 0, after: 0, savedPct: 0, injections: 0 };
  }
  let target: URL;
  try {
    target = validateTarget(req.target);
  } catch (e) {
    return { status: 400, contentType: 'text/plain', body: 'invalid target: ' + (e as Error).message, before: 0, after: 0, savedPct: 0, injections: 0 };
  }
  let res: Awaited<ReturnType<typeof doFetch>>;
  let cachedText: string | undefined;
  let cachedBytes: Uint8Array | undefined;
  let cacheHit = false;
  try {
    if (req.httpCache && !req.fetchFn) {
      const cached = await req.httpCache.fetch(target.href, { method: 'GET', headers: req.headers, signal: AbortSignal.timeout(RESPONSE_TIMEOUT_MS) });
      res = cached.response as Awaited<ReturnType<typeof doFetch>>;
      cachedText = cached.text;
      cachedBytes = cached.bytes;
      cacheHit = cached.cacheHit;
    } else {
      res = await doFetch(target.href, { method: 'GET', headers: req.headers, signal: AbortSignal.timeout(RESPONSE_TIMEOUT_MS) });
    }
  } catch (e) {
    return { status: 502, contentType: 'text/plain', body: 'fetch error: ' + (e as Error).message, before: 0, after: 0, savedPct: 0, injections: 0 };
  }
  const ct = res.headers.get('content-type') ?? '';
  if (!res.ok) {
    try {
      const body = await readLimitedText(res);
      return { status: res.status, contentType: ct || 'text/plain', body, before: 0, after: 0, savedPct: 0, injections: 0 };
    } catch (e) {
      const status = e instanceof ResponseTooLargeError ? 413 : 502;
      return { status, contentType: 'text/plain', body: (e as Error).message, before: 0, after: 0, savedPct: 0, injections: 0 };
    }
  }
  if (!ct.toLowerCase().includes('text/html') && !ct.toLowerCase().includes('application/xhtml+xml')) {
    try {
      const body = isTextResponse(ct) ? (cachedText ?? await readLimitedText(res)) : (cachedBytes ?? await readLimitedBytes(res));
      return { status: 200, contentType: ct || 'application/octet-stream', body, before: 0, after: 0, savedPct: 0, injections: 0 };
    } catch (e) {
      const status = e instanceof ResponseTooLargeError ? 413 : 502;
      return { status, contentType: 'text/plain', body: (e as Error).message, before: 0, after: 0, savedPct: 0, injections: 0 };
    }
  }
  let raw: string;
  try {
    raw = cachedText ?? await readLimitedText(res);
  } catch (e) {
    const status = e instanceof ResponseTooLargeError ? 413 : 502;
    return { status, contentType: 'text/plain', body: (e as Error).message, before: 0, after: 0, savedPct: 0, injections: 0 };
  }
  const { title, markdown } = extract(raw, target.href);
  const scan = req.scrub === false ? { clean: markdown, hits: [] as string[] } : scanInjections(markdown);
  const hits = scan.hits;
  let out = scan.clean;
  const task = resolveTask(req.task).task;
  const provenance = buildProvenance(markdown, target.href, title);
  out = adaptTask(out, task);
  if (req.aggressive) out = aggressiveCompress(out);
  out = applyTier(out, resolveTier(req.model, req.tier));
  let redactions = 0;
  if (req.redact) {
    const redacted = redactSensitive(out);
    out = redacted.text;
    redactions = redacted.total;
  }
  if (req.includeSources) out += `\n\n---\n\n${renderSources(provenance)}`;
  if (req.budget) out = fitToBudget(out, req.budget);
  const before = rawTextTokens(raw);
  const after = countTokens(out);
  const savedPct = before > 0 ? Math.round((1 - after / before) * 100) : 0;
  const quality = assessQuality(raw, out, hits.length, provenance);
  return { status: 200, contentType: 'text/markdown; charset=utf-8', body: out, before, after, savedPct, injections: hits.length, task, quality, provenance, redactions, cacheHit };
}

