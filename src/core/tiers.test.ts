import { describe, it, expect } from 'vitest';
import { resolveTier, applyTier, TIERS } from './tiers.js';

describe('tiers', () => {
  it('resolves known models to tiers', () => {
    expect(resolveTier('gpt-4o-mini').tier).toBe('small');
    expect(resolveTier('gpt-4o').tier).toBe('mid');
    expect(resolveTier('claude-3-opus').tier).toBe('max');
  });

  it('falls back to mid when unknown', () => {
    expect(resolveTier('mystery-model').tier).toBe('mid');
  });

  it('honors explicit tier over model', () => {
    expect(resolveTier('gpt-4o', 'small').tier).toBe('small');
  });

  it('small tier prepends a TL;DR', () => {
    const md = 'First sentence is the lead.\n\nBody paragraph.';
    const out = applyTier(md, TIERS.small);
    expect(out.startsWith('> TL;DR:')).toBe(true);
    expect(out).toContain('First sentence is the lead.');
  });

  it('small tier finds the lead paragraph after a title', () => {
    const out = applyTier('# Title\n\nThe lead paragraph explains the important result.\n\nBody.', TIERS.small);
    expect(out).toContain('> TL;DR: The lead paragraph explains the important result.');
  });

  it('mid/max tiers do not alter output', () => {
    const md = 'Lead line.\n\nBody.';
    expect(applyTier(md, TIERS.mid)).toBe(md);
    expect(applyTier(md, TIERS.max)).toBe(md);
  });
});

