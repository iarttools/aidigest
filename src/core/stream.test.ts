import { describe, it, expect } from 'vitest';
import { streamDigest } from './stream.js';

const HTML = `<html><head><title>T</title></head><body>
<h1>Hello</h1>
<p>First paragraph of content.</p>
<p>Second paragraph with more detail.</p>
</body></html>`;

describe('streamDigest', () => {
  it('yields content blocks incrementally', async () => {
    const blocks: string[] = [];
    for await (const b of streamDigest(HTML, 'https://example.com')) blocks.push(b);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.join('')).toContain('First paragraph');
    expect(blocks.join('')).toContain('Second paragraph');
  });

  it('respects scrub option without throwing', async () => {
    const blocks: string[] = [];
    for await (const b of streamDigest(HTML, 'https://example.com', { scrub: true })) blocks.push(b);
    expect(blocks.length).toBeGreaterThan(0);
  });
});

