export interface SharedDigest {
  url: string;
  markdown: string;
  tokens: number;
  publishedAt: string;
  signature?: string;
}

export class DigestRegistry {
  private map = new Map<string, SharedDigest>();

  publish(d: SharedDigest): void {
    this.map.set(d.url, d);
  }

  get(url: string): SharedDigest | undefined {
    return this.map.get(url);
  }

  has(url: string): boolean {
    return this.map.has(url);
  }

  list(): string[] {
    return [...this.map.keys()];
  }

  exportJson(): string {
    return JSON.stringify([...this.map.values()], null, 2);
  }

  importJson(json: string): number {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) throw new Error('digest registry must be a JSON array');
    let n = 0;
    for (const value of parsed) {
      if (!value || typeof value !== 'object') continue;
      const d = value as Partial<SharedDigest>;
      if (typeof d.url === 'string' && /^https?:\/\//i.test(d.url) && typeof d.markdown === 'string' && d.markdown.length > 0 && Number.isFinite(d.tokens) && typeof d.publishedAt === 'string') {
        this.publish(d as SharedDigest);
        n++;
      }
    }
    return n;
  }
}

