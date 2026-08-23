import { describe, it, expect } from 'vitest';
import { buildPack, renderPack, type PackSource } from './packs.js';

const SRC: PackSource[] = [
  { url: 'https://example.com/a', html: '<html><head><title>A</title></head><body><h1>A</h1><p>Content about configuration and development.</p></body></html>' },
  { url: 'https://example.com/b', html: '<html><head><title>B</title></head><body><h1>B</h1><p>More info on the application documentation.</p></body></html>' },
];

describe('packs', () => {
  it('builds a pack from sources', () => {
    const pack = buildPack('demo', SRC);
    expect(pack.name).toBe('demo');
    expect(pack.version).toBe(1);
    expect(pack.entries.length).toBe(2);
    expect(pack.entries[0].tokens).toBeGreaterThan(0);
  });

  it('renders a readable concatenated pack', () => {
    const pack = buildPack('demo', SRC);
    const out = renderPack(pack);
    expect(out).toContain('source: https://example.com/a');
    expect(out).toContain('---');
  });
});

