import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HttpTextCache } from './httpcache.js';

describe('conditional HTTP cache', () => {
  it('reuses a cached body after a 304 response', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'aidigest-http-cache-'));
    const file = join(dir, 'cache.json');
    let calls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      calls++;
      if (calls === 1) return new Response('<article>cached</article>', { status: 200, headers: { 'content-type': 'text/html', etag: 'v1' } });
      expect(new Headers(init?.headers).get('if-none-match')).toBe('v1');
      return new Response(null, { status: 304 });
    }) as typeof fetch;
    try {
      const cache = new HttpTextCache(file);
      expect((await cache.fetch('https://example.com/page')).cacheHit).toBe(false);
      const second = await cache.fetch('https://example.com/page');
      expect(second.cacheHit).toBe(true);
      expect(second.text).toBe('<article>cached</article>');
    } finally {
      globalThis.fetch = originalFetch;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

