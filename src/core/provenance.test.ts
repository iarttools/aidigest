import { describe, expect, it } from 'vitest';
import { buildProvenance, renderSources } from './provenance.js';

describe('provenance', () => {
  it('builds stable citations and structure metadata', () => {
    const result = buildProvenance('# Article\n\n## Facts\nSee [source](https://example.com/source).\n\n```js\nconst x = 1;\n```', 'https://example.com', 'Article');
    expect(result.sections).toEqual(['Article', 'Facts']);
    expect(result.citations[0].id).toBe('s1');
    expect(result.codeBlocks).toBe(1);
    expect(renderSources(result)).toContain('[s1] source');
  });
});

