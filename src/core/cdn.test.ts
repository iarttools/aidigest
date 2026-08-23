import { describe, it, expect } from 'vitest';
import { DigestRegistry } from './cdn.js';

describe('DigestRegistry (mini CDN)', () => {
  it('publishes and retrieves by url', () => {
    const reg = new DigestRegistry();
    reg.publish({ url: 'https://example.com/a', markdown: '# A', tokens: 3, publishedAt: 'now' });
    expect(reg.has('https://example.com/a')).toBe(true);
    expect(reg.get('https://example.com/a')?.markdown).toBe('# A');
  });

  it('exports and re-imports', () => {
    const reg = new DigestRegistry();
    reg.publish({ url: 'https://example.com/a', markdown: '# A', tokens: 3, publishedAt: 'now' });
    const json = reg.exportJson();
    const reg2 = new DigestRegistry();
    const n = reg2.importJson(json);
    expect(n).toBe(1);
    expect(reg2.get('https://example.com/a')?.markdown).toBe('# A');
  });
});

