import { describe, it, expect } from 'vitest';
import { parseDeclaration, fetchDeclaration, sampleDeclaration } from './aidigest-txt.js';

describe('aidigest-txt', () => {
  it('parses a declaration', () => {
    const d = parseDeclaration('Tier: small\nBudget: 2000\nCache: 3600\nFormat: llms\nAllow: *');
    expect(d.tier).toBe('small');
    expect(d.budget).toBe(2000);
    expect(d.cacheSeconds).toBe(3600);
    expect(d.format).toBe('llms');
    expect(d.allow).toBe('*');
  });

  it('ignores invalid values', () => {
    const d = parseDeclaration('Tier: huge\nBudget: abc');
    expect(d.tier).toBeUndefined();
    expect(d.budget).toBeUndefined();
  });

  it('normalizes declaration values and bounds oversized budgets', () => {
    const d = parseDeclaration('tier: SMALL\nformat: MARKDOWN\nbudget: 999999999');
    expect(d.tier).toBe('small');
    expect(d.format).toBe('markdown');
    expect(d.budget).toBeUndefined();
  });

  it('fetches a declaration via injectable fetch', async () => {
    const fakeFetch = (async () => ({ ok: true, text: async () => sampleDeclaration() })) as unknown as typeof fetch;
    const d = await fetchDeclaration('https://example.com', fakeFetch);
    expect(d?.tier).toBe('mid');
  });

  it('returns null when not found', async () => {
    const fakeFetch = (async () => ({ ok: false, text: async () => '' })) as unknown as typeof fetch;
    const d = await fetchDeclaration('https://example.com', fakeFetch);
    expect(d).toBeNull();
  });
});

