import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { digestDelta } from './cache.js';

describe('delta cache', () => {
  it('creates a baseline, detects unchanged content, then returns only changed lines', () => {
    const dir = mkdtempSync(join(tmpdir(), 'aidigest-cache-'));
    try {
      const url = 'https://example.com/article';
      const baseline = digestDelta(url, '# Title\n\nOld fact', dir);
      expect(baseline.status).toBe('baseline');
      expect(baseline.output).toContain('Baseline saved');

      const unchanged = digestDelta(url, '# Title\n\nOld fact', dir);
      expect(unchanged.status).toBe('unchanged');
      expect(unchanged.output).toContain('No content changes');

      const changed = digestDelta(url, '# Title\n\nNew fact', dir);
      expect(changed.status).toBe('changed');
      expect(changed.output).toContain('+ New fact');
      expect(changed.output).toContain('- Old fact');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

