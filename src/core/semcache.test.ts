import { describe, it, expect } from 'vitest';
import { SemanticCache } from './semcache.js';

describe('SemanticCache', () => {
  it('hits for near-identical text', () => {
    const c = new SemanticCache();
    c.put('a', 'DIGEST_A', 'The council approved the new housing plan after a long debate about the budget.');
    const r = c.get('The council approved the new housing plan after a long debate about the budget and zoning.');
    expect(r.hit).toBe(true);
    expect(r.digest).toBe('DIGEST_A');
  });

  it('misses for dissimilar text', () => {
    const c = new SemanticCache();
    c.put('a', 'DIGEST_A', 'The council approved the new housing plan after a long debate about the budget.');
    const r = c.get('A recipe for chocolate cake with vanilla frosting and sprinkles.');
    expect(r.hit).toBe(false);
  });

  it('does not reuse a digest created for another output variant', () => {
    const c = new SemanticCache();
    c.put('a', 'DIGEST_A', 'The same source text is reused here.', 'small');
    expect(c.get('The same source text is reused here.', 'aggressive').hit).toBe(false);
    expect(c.get('The same source text is reused here.', 'small').digest).toBe('DIGEST_A');
  });
});

