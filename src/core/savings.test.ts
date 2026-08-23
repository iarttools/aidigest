import { describe, expect, it } from 'vitest';
import { simulateSavings } from './savings.js';

describe('savings lab', () => {
  it('simulates input savings independently from output generation', () => {
    const result = simulateSavings({ rawTokens: 2000, distilledTokens: 1000, pagesPerDay: 100, days: 30, model: 'claude-sonnet-4-6' });
    expect(result.pages).toBe(3000);
    expect(result.tokensSaved).toBe(3_000_000);
    expect(result.reductionPct).toBe(50);
    expect(result.totalSavingsUsd).toBe(9);
  });
});

