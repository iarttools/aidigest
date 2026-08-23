export interface CacheEntry {
  key: string;
  digest: string;
  text: string;
  variant?: string;
}

export class SemanticCache {
  private store = new Map<string, CacheEntry>();
  constructor(private threshold = 0.8) {}

  put(key: string, digest: string, text: string, variant = 'default'): void {
    this.store.set(key, { key, digest, text, variant });
  }

  get(text: string, variant = 'default'): { hit: boolean; digest?: string; key?: string; similarity?: number } {
    let best: { key: string; sim: number } | null = null;
    for (const e of this.store.values()) {
      if ((e.variant ?? 'default') !== variant) continue;
      const sim = similarity(e.text, text);
      if (!best || sim > best.sim) best = { key: e.key, sim };
    }
    if (best && best.sim >= this.threshold) {
      const e = this.store.get(best.key);
      if (e) return { hit: true, digest: e.digest, key: e.key, similarity: best.sim };
    }
    return { hit: false };
  }

  size(): number {
    return this.store.size;
  }

  entries(): CacheEntry[] {
    return [...this.store.values()];
  }

  load(entries: CacheEntry[]): void {
    if (!Array.isArray(entries)) return;
    for (const value of entries) {
      if (!value || typeof value !== 'object') continue;
      const e = value as Partial<CacheEntry>;
      if (typeof e.key === 'string' && typeof e.digest === 'string' && typeof e.text === 'string') {
        this.store.set(e.key, { key: e.key, digest: e.digest, text: e.text, variant: e.variant ?? 'default' });
      }
    }
  }
}

function similarity(a: string, b: string): number {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  let inter = 0;
  for (const x of ta) if (tb.has(x)) inter++;
  const union = new Set([...ta, ...tb]).size;
  return union ? inter / union : 0;
}

function tokenize(s: string): string[] {
  return s.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [];
}

