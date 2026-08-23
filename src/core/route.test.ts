import { describe, it, expect } from 'vitest';
import { recommendModel } from './route.js';

describe('route', () => {
  it('picks the cheapest model that fits', () => {
    const r = recommendModel(1500);
    expect(r.model).toBe('gpt-4o-mini');
    expect(r.estCostPerRead).toBeGreaterThan(0);
  });

  it('honors required tier', () => {
    const r = recommendModel(1500, 'max');
    expect(r.model).toBe('claude-3-opus');
  });

  it('reports when no eligible model can fit the page', () => {
    const r = recommendModel(300_000, 'max');
    expect(r.fitsContext).toBe(false);
    expect(r.meetsTier).toBe(true);
  });
});

