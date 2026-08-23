import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readStats, recordStats, renderStats, summarizeStats } from './stats.js';

describe('stats ledger', () => {
  it('records runs and summarizes saved tokens/cost', () => {
    const dir = mkdtempSync(join(tmpdir(), 'aidigest-stats-'));
    const file = join(dir, 'stats.json');
    try {
      recordStats({ url: 'https://a.test', before: 1000, after: 250, mode: 'digest', injections: 0 }, file);
      recordStats({ url: 'https://b.test', before: 2000, after: 1000, mode: 'schema', injections: 1 }, file);
      const entries = readStats(file);
      const summary = summarizeStats(entries, 'gpt-4o');
      expect(entries).toHaveLength(2);
      expect(summary.saved).toBe(1750);
      expect(summary.savedPct).toBe(58);
      expect(summary.estimatedSavedUsd).toBe(0.004375);
      expect(summary.byMode).toEqual({ digest: 1, schema: 1 });
      expect(renderStats(summary)).toContain('Tokens saved:  1750 (58%)');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

