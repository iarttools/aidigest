import { extractBySchema } from './schema.js';

export function generateLlmsTxt(markdown: string, title: string | null): string {
  const structured = extractBySchema(markdown, title, {
    properties: { title: { type: 'string' }, summary: { type: 'string' }, links: { type: 'array' } },
  });
  const pageTitle = (structured.title as string) || title || 'Untitled';
  const summary = (structured.summary as string) || '';
  const links = Array.isArray(structured.links) ? (structured.links as Array<{ text: string; url: string }>) : [];
  const linkLines = links
    .slice(0, 50)
    .map((link) => `- [${link.text}](<${link.url}>)`)
    .join('\n');
  return [
    `# ${pageTitle}`,
    '',
    `> ${summary}`,
    '',
    '## Links',
    linkLines || '- (no links found)',
    '',
  ].join('\n');
}

