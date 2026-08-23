import { describe, it, expect } from 'vitest';
import { spamScore } from './spam.js';

describe('spamScore', () => {
  it('flags hidden text and keyword stuffing', () => {
    const html = '<div style="display:none">hidden spam hidden spam hidden spam</div><p>buy buy buy buy buy buy buy buy now now now</p>';
    const r = spamScore(html, 'buy buy buy buy buy buy buy buy now now now hidden spam hidden spam hidden spam');
    expect(r.score).toBeGreaterThan(0);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it('returns zero for clean content', () => {
    const html = '<p>The council approved a reasonable plan after debate.</p>';
    const r = spamScore(html, 'The council approved a reasonable plan after debate.');
    expect(r.score).toBe(0);
    expect(r.reasons.length).toBe(0);
  });
});

