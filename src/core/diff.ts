function tokenize(s: string): string[] {
  return s.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [];
}

function freq(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

function topDiff(a: Map<string, number>, b: Map<string, number>, n: number): string[] {
  const out: { term: string; d: number }[] = [];
  for (const [term, count] of a) {
    const other = b.get(term) ?? 0;
    const d = count - other;
    if (d > 0) out.push({ term, d });
  }
  out.sort((x, y) => y.d - x.d);
  return out.slice(0, n).map((x) => x.term);
}

export interface SemanticDiff {
  similarity: number;
  added: string[];
  removed: string[];
}

export function semanticDiff(a: string, b: string): SemanticDiff {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const sa = new Set(ta);
  const sb = new Set(tb);
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  const union = new Set([...sa, ...sb]).size;
  const similarity = union ? inter / union : 1;
  const fa = freq(ta);
  const fb = freq(tb);
  return { similarity, added: topDiff(fb, fa, 10), removed: topDiff(fa, fb, 10) };
}

