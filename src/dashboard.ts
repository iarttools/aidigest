import { createServer, type Server } from 'node:http';
import { exec } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { readStats, summarizeStats, defaultStatsFile } from './core/stats.js';

const PAGE = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>aidigest · panel en vivo</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif; background:#0f1115; color:#e7e9ee; margin:0; padding:24px; }
  h1 { font-size:20px; margin:0 0 4px; }
  .sub { color:#8b93a7; font-size:13px; margin-bottom:20px; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-bottom:20px; }
  .card { background:#171a21; border:1px solid #232732; border-radius:12px; padding:14px; }
  .card .v { font-size:24px; font-weight:700; }
  .card .k { color:#8b93a7; font-size:12px; margin-top:4px; }
  .bar { height:8px; background:#232732; border-radius:6px; overflow:hidden; margin-top:8px; }
  .bar > span { display:block; height:100%; background:linear-gradient(90deg,#3ddc84,#1f9d55); }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th, td { text-align:left; padding:8px 10px; border-bottom:1px solid #232732; }
  th { color:#8b93a7; font-weight:600; }
  .pill { background:#232732; border-radius:999px; padding:2px 8px; font-size:11px; }
   .warn { color:#ffcc66; }
   a { color:#5aa9ff; }
   .proxy { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
   .proxy button { background:#1f9d55; color:#fff; border:0; border-radius:8px; padding:8px 14px; font-size:13px; cursor:pointer; }
   .proxy button.off { background:#444b5a; }
 </style>
</head>
<body>
   <h1>aidigest · panel en vivo</h1>
   <div class="sub">Ahorro de tokens en tiempo real para las IAs que leen la web.</div>
   <div class="proxy" id="proxyBox">
     <button id="proxyBtn" class="off" onclick="toggleProxy()">Proxy: OFF</button>
     <span class="sub" id="proxyHint">Pásale el tráfico de la IA a aidigest sin comandos.</span>
   </div>
   <div class="cards" id="cards"></div>
   <h2 style="font-size:15px">Últimas lecturas</h2>
   <table>
     <thead><tr><th>Hora</th><th>Origen</th><th>URL</th><th>Antes</th><th>Después</th><th>Ahorro</th><th>Inyecciones</th></tr></thead>
     <tbody id="rows"></tbody>
   </table>
   <p class="sub" id="foot"></p>
 <script>
   async function proxyState() {
     try { const r = await fetch('/api/proxy'); return (await r.json()).on === true; } catch { return null; }
   }
   async function toggleProxy() {
     const cur = await proxyState();
     const next = !(cur === true);
     await fetch('/api/proxy', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ on: next }) });
     await load();
   }
   async function load() {
     const r = await fetch('/api/events');
     const d = await r.json();
     const s = d.summary;
     document.getElementById('cards').innerHTML = [
       card(s.runs, 'Lecturas'),
       card(s.before.toLocaleString(), 'Tokens antes'),
       card(s.after.toLocaleString(), 'Tokens después'),
       card(s.savedPct + '%', 'Ahorro medio', s.savedPct),
       card('$' + s.estimatedSavedUsd, 'Ahorro \$ estimado'),
       card(s.injections, 'Inyecciones bloqueadas', null, s.injections > 0),
     ].join('');
     const btn = document.getElementById('proxyBtn');
     const st = await proxyState();
     if (st === true) { btn.textContent = 'Proxy: ON'; btn.className = ''; }
     else if (st === false) { btn.textContent = 'Proxy: OFF'; btn.className = 'off'; }
     else { btn.textContent = 'Proxy: —'; btn.className = 'off'; }
     document.getElementById('rows').innerHTML = d.recent.map(e => row(e)).join('') ||
       '<tr><td colspan="7" class="sub">Sin datos todavía. Cuando una IA lea una web, aparecerá aquí.</td></tr>';
     document.getElementById('foot').textContent = 'Modelo de cálculo: ' + s.model + ' ($' + s.inputUsdPerMillion + '/1M tokens). Actualizado ' + new Date().toLocaleTimeString();
   }
   function card(v, k, pct, warn) {
     const bar = pct != null ? '<div class="bar"><span style="width:' + Math.min(100,pct) + '%"></span></div>' : '';
     return '<div class="card"><div class="v' + (warn ? ' warn' : '') + '">' + esc(v) + '</div><div class="k">' + esc(k) + '</div>' + bar + '</div>';
   }
   function row(e) {
     const t = new Date(e.at).toLocaleTimeString();
     return '<tr><td>' + esc(t) + '</td><td><span class="pill">' + esc(e.source||'cli') + '</span></td><td>' + esc(e.url) + '</td><td>' + esc(e.before) + '</td><td>' + esc(e.after) + '</td><td>' + esc(e.savedPct) + '%</td><td>' + esc(e.injections||0) + '</td></tr>';
   }
   function esc(s){ return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
   load();
   setInterval(load, 2000);
 </script>
</body>
</html>`;

export interface DashboardSnapshot {
  summary: ReturnType<typeof summarizeStats>;
  recent: ReturnType<typeof readStats>;
  statsFile: string;
}

export function dashboardSnapshot(statsFile = defaultStatsFile(), model = 'gpt-4o-mini'): DashboardSnapshot {
  const entries = readStats(statsFile);
  return {
    summary: summarizeStats(entries, model),
    recent: entries.slice(-50).reverse(),
    statsFile,
  };
}

export function startDashboard(opts: { port?: number; open?: boolean; statsFile?: string; proxy?: { get: () => boolean; set: (on: boolean) => void } } = {}): Server {
  const port = opts.port ?? 8090;
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('dashboard port must be an integer from 0 to 65535');
  const statsFile = opts.statsFile ?? defaultStatsFile();
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (url.pathname === '/api/proxy') {
        if (req.method === 'POST') {
          let body = '';
          for await (const c of req) {
            body += c;
            if (body.length > 16_384) {
              res.writeHead(413, { 'content-type': 'application/json' });
              res.end('{"error":"request body too large"}');
              return;
            }
          }
          let on = true;
          try { on = JSON.parse(body || '{}').on !== false; } catch {}
          opts.proxy?.set(on);
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
          res.end(JSON.stringify({ ok: true, on: opts.proxy?.get() ?? on }));
          return;
        }
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        res.end(JSON.stringify({ on: opts.proxy?.get() ?? false }));
        return;
      }
      if (url.pathname === '/api/events') {
        const entries = readStats(statsFile);
        const model = url.searchParams.get('model') ?? 'gpt-4o-mini';
        const summary = summarizeStats(entries, model);
        const recent = entries.slice(-50).reverse();
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        res.end(JSON.stringify({ summary, recent }));
        return;
      }
      if (url.pathname === '/api/reset' && url.searchParams.get('confirm') === '1') {
        if (existsSync(statsFile)) writeFileSync(statsFile, '[]');
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end('{"reset":true}');
        return;
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(PAGE);
    } catch (e) {
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end('dashboard error: ' + (e as Error).message);
    }
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${port}`;
    process.stderr.write(`aidigest dashboard on ${url}\n`);
    if (opts.open !== false) openBrowser(url);
  });
  return server;
}

function openBrowser(url: string): void {
  const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) process.stderr.write('aidigest: no se pudo abrir el navegador; abre ' + url + ' manualmente\n');
  });
}

