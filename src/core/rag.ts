export class PageRAG {
  private chunks: string[] = [];

  constructor(private topK = 3) {}

  index(markdown: string): void {
    this.chunks = markdown
      .split(/\n{2,}/)
      .map((c) => c.trim())
      .filter(Boolean);
  }

  answer(query: string): string[] {
    const terms = query.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [];
    const scored = this.chunks
      .map((text) => ({ text, score: scoreChunk(text, terms) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, this.topK).map((s) => s.text);
  }
}

function scoreChunk(text: string, terms: string[]): number {
  const t = new Set(text.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []);
  let s = 0;
  for (const term of terms) if (t.has(term)) s++;
  return s;
}

