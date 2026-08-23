import { describe, expect, it } from 'vitest';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startAppProxy } from './app-proxy.js';

describe('desktop proxy', () => {
  it('serves a local health endpoint', async () => {
    const server = startAppProxy({ port: 0 });
    await once(server, 'listening');
    const address = server.address() as { port: number };
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, service: 'aidigest' });
    server.close();
  });

  it('distills upstream HTML through the embedded bridge', async () => {
    const upstream = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end('<html><head><title>Bridge</title></head><body><nav>noise</nav><article><h1>Bridge title</h1><p>Useful content for the agent.</p></article></body></html>');
    });
    upstream.listen(0, '127.0.0.1');
    await once(upstream, 'listening');
    const upstreamPort = (upstream.address() as { port: number }).port;
    const statsFile = join(mkdtempSync(join(tmpdir(), 'aidigest-app-proxy-')), 'stats.json');
    const server = startAppProxy({ port: 0, statsFile });
    await once(server, 'listening');
    const port = (server.address() as { port: number }).port;
    const target = `http://127.0.0.1:${upstreamPort}/page`;
    const response = await fetch(`http://127.0.0.1:${port}/?url=${encodeURIComponent(target)}`);
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get('x-aidigest-quality')).not.toBeNull();
    expect(body).toContain('Bridge title');
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
  });
});

