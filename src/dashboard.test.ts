import { describe, it, expect } from 'vitest';
import { once } from 'node:events';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dashboardSnapshot, startDashboard } from './dashboard.js';
import { recordStats } from './core/stats.js';

describe('dashboard', () => {
  it('serves live events from the stats ledger', async () => {
    const file = join(mkdtempSync(join(tmpdir(), 'aid-')), 'stats.json');
    const server = startDashboard({ port: 0, open: false, statsFile: file });
    if (!server.listening) await once(server, 'listening');
    const addr = server.address() as { port: number };
    recordStats({ url: 'https://x.test/a', before: 100, after: 40, mode: 'digest', injections: 0, source: 'proxy' }, file);
    const res = await fetch(`http://127.0.0.1:${addr.port}/api/events`);
    const data = (await res.json()) as { summary: { runs: number; bySource: Record<string, number> } };
    expect(data.summary.runs).toBeGreaterThanOrEqual(1);
    expect(data.summary.bySource.proxy).toBeGreaterThanOrEqual(1);
    server.close();
  });

  it('builds the desktop snapshot from the same ledger', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'aid-')), 'stats.json');
    recordStats({ url: 'https://desktop.test/a', before: 200, after: 80, mode: 'digest', injections: 1, source: 'proxy' }, file);
    const snapshot = dashboardSnapshot(file);
    expect(snapshot.summary.runs).toBe(1);
    expect(snapshot.summary.savedPct).toBe(60);
    expect(snapshot.summary.injections).toBe(1);
    expect(snapshot.recent[0].url).toBe('https://desktop.test/a');
  });
});

