import { describe, expect, it } from 'vitest';
import { buildProvenance } from './provenance.js';
import { assessQuality } from './quality.js';

describe('quality report', () => {
  it('penalizes unsafe or untraceable content', () => {
    const provenance = buildProvenance('# Article\n\nA useful paragraph with enough words to be meaningful for the quality engine.', 'https://example.com', 'Article');
    const safe = assessQuality('raw content', '# Article\n\nA useful paragraph with enough words to be meaningful for the quality engine.', 0, provenance);
    const unsafe = assessQuality('raw content', '# Article\n\nA useful paragraph with enough words to be meaningful for the quality engine.', 2, provenance);
    expect(safe.score).toBeGreaterThan(unsafe.score);
    expect(unsafe.warnings).toContain('2 prompt injection pattern(s) removed');
  });
});

