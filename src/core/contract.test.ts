import { describe, it, expect } from 'vitest';
import { fitToContract, assertContract } from './contract.js';
import { fitToBudget } from './budget.js';
import { countTokens } from './tokens.js';

describe('contract', () => {
  it('keeps output within budget via extractive summary', () => {
    const md = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} describes a distinct and relevant fact about the topic.`).join(' ');
    const out = fitToContract(md, 30);
    expect(countTokens(out)).toBeLessThanOrEqual(30);
  });

  it('assertContract throws when violated', () => {
    const big = 'word '.repeat(200);
    expect(() => assertContract(big, 10)).toThrow();
  });

  it('keeps the normal budget mode within the requested limit, including its note', () => {
    const out = fitToBudget('A very long line that cannot fit as a complete line. '.repeat(30), 12);
    expect(countTokens(out)).toBeLessThanOrEqual(12);
  });
});

