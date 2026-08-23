import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const upstream = http.createServer((_, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><html><head><title>Example Domain</title></head><body><article><h1>Example Domain</h1><p>This local MCP smoke fixture verifies that aidigest can fetch and distill a page without depending on the public internet.</p></article></body></html>`);
});
await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
const upstreamPort = upstream.address().port;
const smokeStats = fileURLToPath(new URL('../.smoke-stats.json', import.meta.url));

const p = spawn('node', ['dist/mcp.js'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, AIDIGEST_STATS: smokeStats },
});
let out = '';

function cleanup() {
  upstream.close();
  rmSync(smokeStats, { force: true });
  p.kill();
}

p.stdout.on('data', (d) => {
  out += d.toString();
  if (out.includes('Example Domain') && out.includes('aidigest receipt') && out.includes('quality:')) {
    console.log('MCP CALL OK');
    cleanup();
    process.exit(0);
  }
});

p.stderr.on('data', (d) => process.stderr.write(d));

function send(message) {
  p.stdin.write(JSON.stringify(message) + '\n');
}

send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'aidigest-smoke', version: '1' } } });
send({ jsonrpc: '2.0', method: 'notifications/initialized' });
send({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'aidigest_digest',
    arguments: {
      url: `http://127.0.0.1:${upstreamPort}/`,
      schema: { properties: { title: { type: 'string' }, summary: { type: 'string' }, links: { type: 'array' } } },
      task: 'research',
      sources: true,
      redact: true,
    },
  },
});

setTimeout(() => {
  console.error('MCP CALL TIMEOUT');
  console.error(out);
  cleanup();
  process.exit(1);
}, 10000);

