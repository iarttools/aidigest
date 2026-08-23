import { describe, it, expect } from 'vitest';
import { PageRAG } from './rag.js';

describe('PageRAG', () => {
  it('returns the most relevant chunk for a query', () => {
    const rag = new PageRAG();
    rag.index('# Title\n\nThe council approved the new housing plan.\n\nThe weather was sunny today.\n\nBudget debate lasted hours.');
    const ans = rag.answer('housing plan budget');
    expect(ans.length).toBeGreaterThan(0);
    expect(ans.join(' ')).toMatch(/housing plan|budget/i);
  });
});

