import { describe, expect, it } from 'vitest';
import { buildContextMap, expandContext, parseContextMap, renderContextMap, retrieveContext } from './context.js';

describe('reversible context', () => {
  it('assigns stable blocks and can render/parse them', () => {
    const map = buildContextMap('# Intro\n\nAlpha content.\n\n# Pricing\n\nPrice is 10 EUR.');
    const parsed = parseContextMap(renderContextMap(map));
    expect(parsed.blocks.map((block) => block.id)).toEqual(['c1', 'c2', 'c3', 'c4']);
    expect(expandContext(parsed, ['c3'])).toContain('Pricing');
  });

  it('retrieves the relevant blocks for a question', () => {
    const map = buildContextMap('# Security\n\nUse SSO.\n\n# Pricing\n\nThe plan costs 20 EUR.');
    const result = retrieveContext(map, 'What is the plan price?', 1);
    expect(result.selected).toEqual(['c4']);
    expect(result.markdown).toContain('20 EUR');
  });
});

