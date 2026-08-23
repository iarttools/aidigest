export type DeclaredTier = 'small' | 'mid' | 'max';
export type DeclaredFormat = 'markdown' | 'schema' | 'llms';

export interface SiteDeclaration {
  tier?: DeclaredTier;
  budget?: number;
  cacheSeconds?: number;
  format?: DeclaredFormat;
  allow?: string;
}

export function parseDeclaration(text: string): SiteDeclaration {
  const d: SiteDeclaration = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z]+)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    const normalized = val.toLowerCase();
    if (key === 'tier' && (['small', 'mid', 'max'] as string[]).includes(normalized)) d.tier = normalized as DeclaredTier;
    else if (key === 'budget') {
      const n = Number(val);
      if (Number.isFinite(n) && n > 0 && n <= 1_000_000) d.budget = Math.floor(n);
    } else if (key === 'cache' || key === 'cache-seconds') {
      const n = Number(val);
      if (Number.isFinite(n) && n >= 0) d.cacheSeconds = Math.floor(n);
    } else if (key === 'format' && (['markdown', 'schema', 'llms'] as string[]).includes(normalized)) d.format = normalized as DeclaredFormat;
    else if (key === 'allow') d.allow = val;
  }
  return d;
}

export function sampleDeclaration(): string {
  return [
    '# aidigest.txt — declarations for AI agents',
    'Tier: mid',
    'Budget: 4000',
    'Cache: 3600',
    'Format: markdown',
    'Allow: *',
    '',
  ].join('\n');
}

export async function fetchDeclaration(origin: string, fetchFn: typeof fetch = fetch): Promise<SiteDeclaration | null> {
  try {
    const base = origin.replace(/\/$/, '');
    const res = await fetchFn(base + '/aidigest.txt', { headers: { Accept: 'text/plain' } });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length > 65_536) return null;
    return parseDeclaration(text);
  } catch {
    return null;
  }
}

