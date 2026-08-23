import { describe, expect, it } from 'vitest';
import { runDemo } from './demo.js';

describe('first-run demo', () => {
  it('runs the real extraction and safety pipeline locally', () => {
    const result = runDemo();
    expect(result.before).toBeGreaterThan(result.after);
    expect(result.savedPct).toBeGreaterThan(0);
    expect(result.injections).toBeGreaterThan(0);
    expect(result.title).toContain('Acme API');
  });
});

