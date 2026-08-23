import { describe, expect, it } from 'vitest';
import { renderScore, scorePage } from './score.js';

describe('ai-readiness score', () => {
  it('rewards efficient, structured, injection-free pages', () => {
    const result = scorePage({
      before: 1000,
      after: 300,
      injections: 0,
      hasLlmsTxt: true,
      hasStructuredData: true,
      hasHeadings: true,
      hasTables: true,
    });
    expect(result.score).toBe(100);
    expect(result.grade).toBe('A');
    expect(renderScore(result, 'https://example.com')).toContain('Score: 100/100');
  });

  it('penalizes boilerplate-heavy, unsafe pages', () => {
    const result = scorePage({
      before: 1000,
      after: 950,
      injections: 2,
      hasLlmsTxt: false,
      hasStructuredData: false,
      hasHeadings: false,
      hasTables: false,
    });
    expect(result.score).toBeLessThan(20);
    expect(result.grade).toBe('E');
  });
});

