import { countTokens } from './tokens.js';

export type ContextBlockKind = 'heading' | 'paragraph' | 'code' | 'table' | 'list';

export interface ContextBlock {
  id: string;
  kind: ContextBlockKind;
  heading: string | null;
  text: string;
  tokens: number;
}

export interface ContextMap {
  version: 1;
  blocks: ContextBlock[];
  totalTokens: number;
}

export interface ContextRetrieval {
  query: string;
  selected: string[];
  scores: Record<string, number>;
  markdown: string;
}

const WORDS = /[\p{L}\p{N}]{3,}/gu;

function terms(text: string): string[] {
  return text.toLocaleLowerCase().match(WORDS) ?? [];
}

function kindOf(text: string): ContextBlockKind {
  if (/^```/m.test(text)) return 'code';
  if (/^\|.*\|$/m.test(text)) return 'table';
  if (/^(?:[-*+] |\d+\. )/m.test(text)) return 'list';
  if (/^#{1,6}\s+/.test(text)) return 'heading';
  return 'paragraph';
}

function headingOf(text: string, current: string | null): string | null {
  return text.match(/^#{1,6}\s+(.+)$/m)?.[1]?.trim() ?? current;
}

export function buildContextMap(markdown: string): ContextMap {
  const blocks: ContextBlock[] = [];
  let currentHeading: string | null = null;
  const chunks = markdown
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    currentHeading = headingOf(chunk, currentHeading);
    blocks.push({
      id: `c${blocks.length + 1}`,
      kind: kindOf(chunk),
      heading: currentHeading,
      text: chunk,
      tokens: countTokens(chunk),
    });
  }

  return {
    version: 1,
    blocks,
    totalTokens: blocks.reduce((sum, block) => sum + block.tokens, 0),
  };
}

export function renderContextMap(map: ContextMap): string {
  return map.blocks
    .map((block) => `<!-- aidigest-context:${block.id} -->\n${block.text}`)
    .join('\n\n');
}

export function parseContextMap(markdown: string): ContextMap {
  const blocks: ContextBlock[] = [];
  const pattern = /<!--\s*aidigest-context:(c\d+)\s*-->\s*([\s\S]*?)(?=\n\s*<!--\s*aidigest-context:c\d+\s*-->|$)/gi;
  for (const match of markdown.matchAll(pattern)) {
    const text = match[2].trim();
    if (!text) continue;
    blocks.push({
      id: match[1],
      kind: kindOf(text),
      heading: headingOf(text, null),
      text,
      tokens: countTokens(text),
    });
  }
  return { version: 1, blocks, totalTokens: blocks.reduce((sum, block) => sum + block.tokens, 0) };
}

function blockScore(block: ContextBlock, queryTerms: Set<string>): number {
  const blockTerms = new Set(terms(`${block.heading ?? ''} ${block.text}`));
  let score = 0;
  for (const term of queryTerms) if (blockTerms.has(term)) score += block.heading?.toLocaleLowerCase().includes(term) ? 3 : 1;
  return score;
}

export function retrieveContext(map: ContextMap, query: string, topK = 5): ContextRetrieval {
  const safeTopK = Math.max(1, Math.min(20, Math.floor(topK)));
  const queryTerms = new Set(terms(query));
  const ranked = map.blocks
    .map((block, index) => ({ block, index, score: queryTerms.size ? blockScore(block, queryTerms) : 0 }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const matching = ranked.filter((item) => item.score > 0);
  const selected = (matching.length ? matching : ranked).slice(0, safeTopK);
  const selectedIds = selected.map((item) => item.block.id);
  return {
    query,
    selected: selectedIds,
    scores: Object.fromEntries(selected.map((item) => [item.block.id, item.score])),
    markdown: selected.map((item) => item.block.text).join('\n\n'),
  };
}

export function expandContext(map: ContextMap, ids: string[]): string {
  const wanted = new Set(ids.map((id) => id.trim()).filter(Boolean));
  return map.blocks.filter((block) => wanted.has(block.id)).map((block) => block.text).join('\n\n');
}

