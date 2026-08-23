import { describe, expect, it } from 'vitest';
import { normalizeSource } from './source.js';

describe('source normalizer', () => {
  it('turns JSON into bounded markdown while preserving structure', () => {
    const result = normalizeSource('{"name":"aidigest","ok":true}', 'application/json', 'https://example.com/data.json');
    expect(result.kind).toBe('json');
    expect(result.markdown).toContain('"name": "aidigest"');
  });

  it('keeps plain text usable without a browser parser', () => {
    const result = normalizeSource('A local document for an agent.', 'text/plain', 'file:///docs/readme.txt');
    expect(result.kind).toBe('text');
    expect(result.markdown).toContain('local document');
  });
});

