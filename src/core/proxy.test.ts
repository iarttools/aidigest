import { describe, expect, it } from 'vitest';
import { proxyFetch, type ProxyRequest } from './proxy.js';

function fakeHtmlFetch(body: string, contentType = 'text/html; charset=utf-8', ok = true, status = 200) {
  return async (): Promise<any> => ({
    ok,
    status,
    headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? contentType : null) },
    text: async () => body,
  });
}

describe('transparent proxy', () => {
  it('distills HTML responses to markdown and reports savings', async () => {
    const html =
      '<html><head><title>Page</title></head><body>' +
      '<nav>home about services blog contact login signup support faq terms privacy cookies settings account logout search menu</nav>' +
      '<article><h1>Real content</h1><p>This is the main content that agents should read.</p><p>More useful details here.</p></article>' +
      '<footer>copyright 2099 all rights reserved newsletter subscribe cookies policy privacy terms sitemap social links legal disclaimer</footer>' +
      '</body></html>';
    const req: ProxyRequest = { method: 'GET', target: 'https://example.com', fetchFn: fakeHtmlFetch(html) as unknown as typeof fetch };
    const res = await proxyFetch(req);
    expect(res.status).toBe(200);
    expect(res.contentType).toContain('text/markdown');
    expect(res.body).toContain('Real content');
    expect(res.body).not.toContain('copyright');
    expect(res.savedPct).toBeGreaterThan(0);
  });

  it('passes through non-HTML responses untouched', async () => {
    const req: ProxyRequest = { method: 'GET', target: 'https://example.com/a.json', fetchFn: fakeHtmlFetch('{"a":1}', 'application/json') as unknown as typeof fetch };
    const res = await proxyFetch(req);
    expect(res.contentType).toBe('application/json');
    expect(res.body).toBe('{"a":1}');
  });

  it('preserves binary non-HTML responses as bytes', async () => {
    const bytes = new Uint8Array([0, 255, 1, 2]);
    const req: ProxyRequest = {
      method: 'GET',
      target: 'https://example.com/file.bin',
      fetchFn: (async () => ({
        ok: true,
        status: 200,
        headers: { get: () => 'application/octet-stream' },
        body: null,
        arrayBuffer: async () => bytes.buffer,
      })) as unknown as typeof fetch,
    };
    const res = await proxyFetch(req);
    expect(res.body).toBeInstanceOf(Uint8Array);
    expect(Array.from(res.body as Uint8Array)).toEqual([0, 255, 1, 2]);
  });

  it('adds task adaptation, provenance, quality and redaction metadata', async () => {
    const html = '<html><head><title>Secure page</title></head><body><article><h1>Secure page</h1><p>Contact ana@example.com for the deployment guide.</p><p>See <a href="https://example.com/guide">the guide</a> for details.</p></article></body></html>';
    const res = await proxyFetch({
      method: 'GET',
      target: 'https://example.com/secure',
      task: 'answer',
      redact: true,
      includeSources: true,
      fetchFn: fakeHtmlFetch(html) as unknown as typeof fetch,
    });
    expect(res.quality?.score).toBeGreaterThan(0);
    expect(res.provenance?.citations).toHaveLength(1);
    expect(res.redactions).toBe(1);
    expect(res.body).toContain('[REDACTED_EMAIL]');
    expect(res.body).toContain('Source: https://example.com/secure');
  });

  it('rejects non-http targets before fetching', async () => {
    const res = await proxyFetch({ method: 'GET', target: 'file:///etc/passwd' });
    expect(res.status).toBe(400);
    expect(res.body).toMatch(/http or https/i);
  });

  it('rejects unsupported methods', async () => {
    const res = await proxyFetch({ method: 'POST', target: 'https://example.com' });
    expect(res.status).toBe(405);
  });
});

