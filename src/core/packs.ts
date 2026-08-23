import { extract } from './extract.js';
import { countTokens } from './tokens.js';
import { aggressiveCompress, scanInjections } from './scrub.js';
import { applyTier, resolveTier, type TierProfile } from './tiers.js';

export interface PackSource {
  url: string;
  html: string;
}

export interface PackEntry {
  url: string;
  title: string | null;
  markdown: string;
  tokens: number;
  fetchedAt: string;
}

export interface Pack {
  name: string;
  version: 1;
  createdAt: string;
  entries: PackEntry[];
}

export function digestForPack(src: PackSource, profile: TierProfile = resolveTier()): PackEntry {
  const { title, markdown } = extract(src.html, src.url);
  let md = scanInjections(markdown).clean;
  md = applyTier(md, profile);
  md = aggressiveCompress(md);
  return {
    url: src.url,
    title: title ?? null,
    markdown: md,
    tokens: countTokens(md),
    fetchedAt: new Date().toISOString(),
  };
}

export function buildPack(name: string, sources: PackSource[]): Pack {
  return {
    name,
    version: 1,
    createdAt: new Date().toISOString(),
    entries: sources.map((s) => digestForPack(s)),
  };
}

export function renderPack(pack: Pack): string {
  return pack.entries
    .map((e) => `# ${e.title ?? e.url}\n\n${e.markdown}\n\n<!-- source: ${e.url} -->`)
    .join('\n\n---\n\n');
}

