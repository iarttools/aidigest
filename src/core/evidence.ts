import type { Provenance } from './provenance.js';

export interface EvidenceClaim {
  id: string;
  text: string;
  section: string | null;
  citationIds: string[];
  signals: string[];
}

export interface EvidenceLink {
  from: string;
  to: string;
  kind: 'supports' | 'related';
}

export interface Contradiction {
  claimA: string;
  claimB: string;
  subject: string;
  valuesA: string[];
  valuesB: string[];
}

export interface EvidenceGraph {
  claims: EvidenceClaim[];
  links: EvidenceLink[];
  contradictions: Contradiction[];
}

const SIGNAL = /(?:\$|€|£)?\b\d+(?:[.,]\d+)?\s*%?|\b\d{4}-\d{2}-\d{2}\b/g;
const WORDS = /[\p{L}]{3,}/gu;
const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'para', 'con', 'que', 'del', 'una', 'los', 'las', 'por', 'sobre']);

function cleanWords(text: string): string[] {
  return (text.toLocaleLowerCase().match(WORDS) ?? []).filter((word) => !STOP.has(word));
}

function subjectOf(text: string): string {
  return [...new Set(cleanWords(text.replace(SIGNAL, ' ')))].slice(0, 8).join(' ');
}

function paragraphClaims(markdown: string): Array<{ text: string; section: string | null }> {
  const claims: Array<{ text: string; section: string | null }> = [];
  let section: string | null = null;
  for (const chunk of markdown.split(/\n{2,}/)) {
    const text = chunk.trim();
    if (!text) continue;
    const heading = text.match(/^#{1,6}\s+(.+)$/m);
    if (heading) section = heading[1].trim();
    if (SIGNAL.test(text) && !heading) claims.push({ text, section });
    SIGNAL.lastIndex = 0;
  }
  return claims;
}

export function buildEvidenceGraph(markdown: string, provenance: Provenance): EvidenceGraph {
  const claims = paragraphClaims(markdown).map((claim, index) => {
    const citationIds = provenance.citations
      .filter((citation) => claim.text.includes(`[${citation.label}]`) || claim.text.includes(`(${citation.url})`))
      .map((citation) => citation.id);
    const signals = claim.text.match(SIGNAL) ?? [];
    SIGNAL.lastIndex = 0;
    return { id: `e${index + 1}`, text: claim.text, section: claim.section, citationIds, signals };
  });
  const links: EvidenceLink[] = [];
  for (let index = 1; index < claims.length; index++) {
    const previous = new Set(cleanWords(claims[index - 1].text));
    const shared = cleanWords(claims[index].text).filter((word) => previous.has(word));
    if (shared.length >= 2) links.push({ from: claims[index - 1].id, to: claims[index].id, kind: 'related' });
  }

  const contradictions: Contradiction[] = [];
  for (let left = 0; left < claims.length; left++) {
    for (let right = left + 1; right < claims.length; right++) {
      const leftWords = new Set(cleanWords(claims[left].text));
      const shared = [...new Set(cleanWords(claims[right].text))].filter((word) => leftWords.has(word));
      if (shared.length >= 2 && claims[left].signals.join('|') !== claims[right].signals.join('|')) {
        contradictions.push({ claimA: claims[left].id, claimB: claims[right].id, subject: shared.slice(0, 8).join(' '), valuesA: claims[left].signals, valuesB: claims[right].signals });
      }
    }
  }
  return { claims, links, contradictions };
}

export function renderEvidenceSummary(graph: EvidenceGraph): string {
  const lines = ['Evidence map:', `Claims: ${graph.claims.length}`, `Related links: ${graph.links.length}`, `Potential contradictions: ${graph.contradictions.length}`];
  for (const contradiction of graph.contradictions) lines.push(`- ${contradiction.claimA} vs ${contradiction.claimB}: ${contradiction.subject} (${contradiction.valuesA.join(', ')} / ${contradiction.valuesB.join(', ')})`);
  return lines.join('\n');
}

