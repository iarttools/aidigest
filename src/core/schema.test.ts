import { describe, expect, it } from 'vitest';
import { extractBySchema } from './schema.js';

const MD = `# AI Token Report

This report explains how agents can reduce web-reading costs using structured extraction and delta fetch.

## Pricing

The starter plan costs $19.99 and the pro plan costs 49 eur.

## Contact

Email us at hello@example.com or call +34 600 123 456.

Published on 2026-08-23.

[Docs](https://example.com/docs)`;

describe('schema extraction', () => {
  it('extracts common fields requested by schema', () => {
    const out = extractBySchema(MD, 'AI Token Report', {
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        prices: { type: 'array' },
        emails: { type: 'array' },
        phones: { type: 'array' },
        dates: { type: 'array' },
        links: { type: 'array' },
        headings: { type: 'array' },
      },
    });
    expect(out.title).toBe('AI Token Report');
    expect(out.summary).toContain('reduce web-reading costs');
    expect(out.prices).toEqual(['$19.99', '49 eur']);
    expect(out.emails).toEqual(['hello@example.com']);
    expect(out.phones).toEqual(['+34 600 123 456']);
    expect(out.dates).toEqual(['2026-08-23']);
    expect(out.links).toEqual([{ text: 'Docs', url: 'https://example.com/docs' }]);
    expect(out.headings).toEqual(['AI Token Report', 'Pricing', 'Contact']);
  });

  it('does not mistake a heading for the summary or crash on malformed field definitions', () => {
    const out = extractBySchema('# A deliberately long heading that should not become the summary\n\nThe actual paragraph contains the useful description for the reader.', null, {
      properties: { summary: { type: 'string' }, broken: null as never },
    });
    expect(out.summary).toContain('actual paragraph');
    expect(out.broken).toBeNull();
  });
});

