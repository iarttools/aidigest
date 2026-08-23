import { describe, it, expect } from 'vitest';
import { multimodalDigest } from './multimodal.js';

describe('multimodal', () => {
  it('extracts images with alt and captions', () => {
    const html = `<html><body>
      <h1>Title</h1>
      <p>Some text content here.</p>
      <figure><img src="/a.png" alt="A chart"><figcaption>Fig 1</figcaption></figure>
      <img src="/b.png" alt="">
      <table><tr><td>x</td></tr></table>
    </body></html>`;
    const d = multimodalDigest(html, 'https://example.com');
    expect(d.images.length).toBe(2);
    expect(d.images[0].src).toBe('https://example.com/a.png');
    expect(d.images[0].alt).toBe('A chart');
    expect(d.images[0].caption).toBe('Fig 1');
    expect(d.tables).toBe(1);
  });
});

