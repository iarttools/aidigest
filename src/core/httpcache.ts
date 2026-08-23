import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { TextFetchResult } from './fetch.js';

interface CachedPage {
  url: string;
  text: string;
  contentType: string;
  etag?: string;
  lastModified?: string;
  storedAt: string;
}

interface CacheFile {
  version: 1;
  entries: CachedPage[];
}

export interface CachedFetchResult extends TextFetchResult {
  cacheHit: boolean;
  bytes?: Uint8Array;
}

export class HttpTextCache {
  private entries = new Map<string, CachedPage>();
  private readonly file: string;
  private readonly maxEntries: number;

  constructor(file = join(process.cwd(), '.aidigest-http-cache.json'), maxEntries = 128) {
    this.file = file;
    this.maxEntries = Math.max(1, maxEntries);
    this.load();
  }

  async fetch(url: string, init: RequestInit = {}): Promise<CachedFetchResult> {
    const previous = this.entries.get(url);
    const headers = new Headers(init.headers);
    if (previous?.etag) headers.set('if-none-match', previous.etag);
    if (previous?.lastModified) headers.set('if-modified-since', previous.lastModified);
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error('URL must be absolute');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('URL must use http or https');
    const response = await fetch(url, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(30_000) });
    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > 10 * 1024 * 1024) {
      await response.body?.cancel();
      throw new Error('upstream response exceeds 10 MB');
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > 10 * 1024 * 1024) throw new Error('upstream response exceeds 10 MB');
    const responseStatus = response.status;
    const fetched: TextFetchResult & { bytes: Uint8Array } = {
      response: new Response(bytes, { status: responseStatus === 304 ? 200 : responseStatus, statusText: response.statusText, headers: response.headers }),
      text: new TextDecoder().decode(bytes),
      bytes,
    };
    if (previous && responseStatus === 304) {
      previous.storedAt = new Date().toISOString();
      this.persist();
      const previousBytes = new TextEncoder().encode(previous.text);
      return { response: new Response(previousBytes, { status: 200, headers: { 'content-type': previous.contentType } }), text: previous.text, bytes: previousBytes, cacheHit: true };
    }
    const contentType = fetched.response.headers.get('content-type') ?? '';
    const cacheableText = /(?:text\/|json|xml|javascript|svg|x-www-form-urlencoded)/i.test(contentType);
    if (fetched.response.ok && cacheableText && fetched.text && !/no-store/i.test(fetched.response.headers.get('cache-control') ?? '')) {
      this.entries.delete(url);
      this.entries.set(url, {
        url,
        text: fetched.text,
        contentType: fetched.response.headers.get('content-type') ?? 'text/plain; charset=utf-8',
        etag: fetched.response.headers.get('etag') ?? undefined,
        lastModified: fetched.response.headers.get('last-modified') ?? undefined,
        storedAt: new Date().toISOString(),
      });
      while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value as string);
      this.persist();
    }
    return { ...fetched, cacheHit: false };
  }

  clear(): void {
    this.entries.clear();
    this.persist();
  }

  size(): number {
    return this.entries.size;
  }

  private load(): void {
    if (!existsSync(this.file)) return;
    try {
      const parsed = JSON.parse(readFileSync(this.file, 'utf8')) as CacheFile;
      if (parsed.version !== 1 || !Array.isArray(parsed.entries)) return;
      for (const entry of parsed.entries) {
        if (entry && typeof entry.url === 'string' && typeof entry.text === 'string') this.entries.set(entry.url, entry);
      }
    } catch {
      this.entries.clear();
    }
  }

  private persist(): void {
    try {
      writeFileSync(this.file, JSON.stringify({ version: 1, entries: [...this.entries.values()] } satisfies CacheFile), 'utf8');
    } catch {
      /* cache is an optimization; never fail the digest because persistence is unavailable */
    }
  }
}

