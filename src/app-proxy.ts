import { createServer, type Server } from 'node:http';
import { proxyFetch } from './core/proxy.js';
import { recordStats } from './core/stats.js';

export interface AppProxyOptions {
  port?: number;
  task?: 'answer' | 'research' | 'coding' | 'compare' | 'vision' | 'full';
  statsFile?: string;
  autoStart?: boolean;
}

export function startAppProxy(options: AppProxyOptions = {}): Server {
  const port = options.port ?? 8080;
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('proxy port must be between 0 and 65535');
  const server = createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url ?? '/', 'http://localhost');
      if (requestUrl.pathname === '/health') {
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        res.end('{"ok":true,"service":"aidigest"}');
        return;
      }
      const target = requestUrl.searchParams.get('url');
      if (!target) {
        res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('missing ?url=https://example.com');
        return;
      }
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string' && !['host', 'connection', 'content-length'].includes(key.toLowerCase())) headers[key] = value;
      }
      const result = await proxyFetch({ method: req.method ?? 'GET', target, headers, task: options.task ?? 'research', includeSources: true, redact: true });
      if (result.status === 200) {
        recordStats({ url: target, before: result.before, after: result.after, mode: 'digest', injections: result.injections, source: 'desktop-proxy', task: result.task, quality: result.quality?.score, redactions: result.redactions, cacheHit: result.cacheHit }, options.statsFile);
      }
      res.writeHead(result.status, {
        'content-type': result.contentType,
        'cache-control': 'no-store',
        'x-aidigest-before': String(result.before),
        'x-aidigest-after': String(result.after),
        'x-aidigest-saved': String(result.savedPct),
        'x-aidigest-quality': String(result.quality?.score ?? 0),
        'x-aidigest-injections': String(result.injections),
      });
      res.end(result.body);
    } catch (error) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`aidigest proxy error: ${(error as Error).message}`);
    }
  });
  if (options.autoStart !== false) server.listen(port, '127.0.0.1');
  return server;
}

