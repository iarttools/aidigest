import { describe, expect, it } from 'vitest';
import { buildEvidenceGraph } from './evidence.js';
import { buildProvenance } from './provenance.js';

describe('evidence graph', () => {
  it('flags different numeric claims about the same subject', () => {
    const markdown = '# Usage\n\nActive users: 100 today.\n\nThe active users count is 120 today.';
    const graph = buildEvidenceGraph(markdown, buildProvenance(markdown, 'https://example.com', 'Example'));
    expect(graph.claims).toHaveLength(2);
    expect(graph.contradictions).toHaveLength(1);
  });
});

