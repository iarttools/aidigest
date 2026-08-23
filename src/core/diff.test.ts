import { describe, it, expect } from 'vitest';
import { semanticDiff } from './diff.js';

describe('semanticDiff', () => {
  it('reports high similarity for near-identical text', () => {
    const a = 'The quick brown fox jumps over the lazy dog near the river.';
    const b = 'The quick brown fox jumps over the lazy dog near the river.';
    const d = semanticDiff(a, b);
    expect(d.similarity).toBeGreaterThan(0.9);
  });

  it('reports low similarity and surfaced terms for different text', () => {
    const a = 'Apple released a new phone with a better camera and longer battery life.';
    const b = 'The football match ended in a surprising draw after extra time.';
    const d = semanticDiff(a, b);
    expect(d.similarity).toBeLessThan(0.5);
    expect(d.added.length).toBeGreaterThan(0);
    expect(d.removed.length).toBeGreaterThan(0);
  });
});

