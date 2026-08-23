import { extract } from './extract.js';

export type SourceKind = 'html' | 'markdown' | 'text' | 'json' | 'xml';

export interface SourceDocument {
  kind: SourceKind;
  title: string | null;
  markdown: string;
}

export function isReadableContentType(contentType: string): boolean {
  const ct = contentType.toLowerCase();
  return !ct || ct.includes('text/html') || ct.includes('application/xhtml+xml') || ct.includes('text/markdown') || ct.includes('text/plain') || ct.includes('application/json') || ct.includes('application/xml') || ct.includes('text/xml');
}

function titleFromMarkdown(markdown: string): string | null {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? null;
}

export function normalizeSource(body: string, contentType: string, url: string): SourceDocument {
  const ct = contentType.toLowerCase();
  if (ct.includes('json') || (!ct && /^\s*[\[{]/.test(body))) {
    try {
      const parsed = JSON.parse(body);
      const pretty = JSON.stringify(parsed, null, 2);
      return { kind: 'json', title: 'JSON document', markdown: `# JSON document\n\n\`\`\`json\n${pretty}\n\`\`\`` };
    } catch {
      return { kind: 'text', title: null, markdown: body.trim() };
    }
  }
  if (ct.includes('markdown') || /(^|\n)#{1,6}\s/.test(body)) return { kind: 'markdown', title: titleFromMarkdown(body), markdown: body.trim() };
  if (ct.includes('xml') || /^\s*<\?xml/i.test(body)) {
    const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return { kind: 'xml', title: null, markdown: text ? `# XML document\n\n${text}` : '' };
  }
  if (ct.includes('html') || /<html[\s>]/i.test(body) || /<article[\s>]/i.test(body)) {
    const result = extract(body, url);
    return { kind: 'html', title: result.title, markdown: result.markdown };
  }
  return { kind: 'text', title: null, markdown: body.trim() };
}

