export interface Citation {
  id: string;
  label: string;
  url: string;
  section?: string;
}

export interface Provenance {
  sourceUrl: string;
  title: string | null;
  sections: string[];
  citations: Citation[];
  codeBlocks: number;
  tables: number;
  wordCount: number;
}

function clean(value: string): string {
  return value.replace(/[*_~`]/g, '').replace(/\s+/g, ' ').trim();
}

export function buildProvenance(markdown: string, sourceUrl: string, title: string | null = null): Provenance {
  const sections = [...markdown.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => clean(match[1])).filter(Boolean);
  const citations: Citation[] = [];
  let section = sections[0];
  let index = 0;
  for (const line of markdown.split('\n')) {
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) section = clean(heading[1]);
    for (const match of line.matchAll(/\[([^\]]+)]\(([^)]+)\)/g)) {
      const url = match[2].trim();
      if (!url) continue;
      index++;
      citations.push({ id: `s${index}`, label: clean(match[1]), url, section });
    }
  }
  return {
    sourceUrl,
    title,
    sections,
    citations,
    codeBlocks: (markdown.match(/^```/gm) ?? []).length / 2,
    tables: (markdown.match(/^\|.*\|$/gm) ?? []).length,
    wordCount: (markdown.match(/[\p{L}\p{N}]{2,}/gu) ?? []).length,
  };
}

export function renderSources(provenance: Provenance): string {
  if (!provenance.citations.length) return `Source: ${provenance.sourceUrl}`;
  return [
    `Source: ${provenance.sourceUrl}`,
    '',
    'Sources:',
    ...provenance.citations.map((citation) => `[${citation.id}] ${citation.label} — ${citation.url}`),
  ].join('\n');
}

