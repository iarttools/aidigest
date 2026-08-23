export interface JsonSchemaLike {
  properties?: Record<string, { type?: string; description?: string }>;
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const LINK_RE = /\[([^\]]+)]\(([^)]+)\)/g;
const PRICE_RE = /(?:[$€£]\s?\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s?(?:€|eur|usd|dollars?|pounds?))/gi;
const DATE_RE = /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;

function firstParagraph(markdown: string): string | null {
  return markdown
    .split('\n')
    .filter((line) => !/^\s*#{1,6}\s/.test(line))
    .map((line) => stripMarkdown(line).trim())
    .find((line) => line.length > 40) ?? null;
}

function firstHeading(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? stripMarkdown(match[1]).trim() : null;
}

function headings(markdown: string): string[] {
  return [...markdown.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => stripMarkdown(m[1]).trim());
}

function links(markdown: string): Array<{ text: string; url: string }> {
  return [...markdown.matchAll(LINK_RE)].map((m) => ({ text: stripMarkdown(m[1]).trim(), url: m[2].trim() }));
}

function matches(markdown: string, re: RegExp): string[] {
  return [...new Set([...markdown.matchAll(re)].map((m) => m[0].trim()))];
}

function isDateLike(value: string): boolean {
  return /^(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})$/.test(value.trim());
}

function stripMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, '$1')
    .replace(/^\s*[-*#>]+\s*/g, '')
    .replace(/[*_~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fieldTokens(key: string, description?: string): string[] {
  return `${key} ${description ?? ''}`
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function lineForField(markdown: string, key: string, description?: string): string | null {
  const tokens = fieldTokens(key, description);
  const lines = markdown.split('\n').map((line) => stripMarkdown(line)).filter(Boolean);
  return lines.find((line) => tokens.some((token) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(line);
  })) ?? null;
}

function valueForField(markdown: string, title: string | null, key: string, type = 'string', description?: string): unknown {
  const name = key.toLowerCase();
  if (/^(title|name|headline)$/.test(name)) return title ?? firstHeading(markdown);
  if (/(summary|description|excerpt|resumen)/.test(name)) return firstParagraph(markdown);
  if (/(heading|section)/.test(name)) return headings(markdown);
  if (/(link|url)/.test(name)) return links(markdown);
  if (/(email|mail)/.test(name)) return matches(markdown, EMAIL_RE);
  if (/(phone|tel|telefono|contact)/.test(name)) return matches(markdown, PHONE_RE).filter((value) => !isDateLike(value));
  if (/(price|cost|amount|precio|importe)/.test(name)) return matches(markdown, PRICE_RE);
  if (/(date|day|fecha)/.test(name)) return matches(markdown, DATE_RE);
  const line = lineForField(markdown, key, description);
  if (type === 'array') return line ? [line] : [];
  if (type === 'number') {
    const match = line?.match(/-?\d+(?:[.,]\d+)?/);
    return match ? Number(match[0].replace(',', '.')) : null;
  }
  if (type === 'boolean') return line ? true : null;
  if (type === 'object') return {};
  return line;
}

export function extractBySchema(markdown: string, title: string | null, schema: JsonSchemaLike): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(schema.properties ?? {})) {
    const definition = def && typeof def === 'object' ? def : {};
    result[key] = valueForField(markdown, title, key, definition.type, definition.description);
  }
  return result;
}

