const STOPWORDS: Record<string, string[]> = {
  en: ['the', 'and', 'you', 'for', 'are', 'but', 'not', 'this', 'that', 'with', 'have', 'from'],
  es: ['que', 'los', 'las', 'una', 'por', 'con', 'para', 'pero', 'sus', 'son', 'fue', 'más'],
  fr: ['les', 'des', 'une', 'pour', 'pas', 'avec', 'que', 'son', 'sur', 'est', 'aux', 'qui'],
  de: ['und', 'der', 'die', 'das', 'nicht', 'mit', 'sich', 'ist', 'auf', 'für', 'ein', 'von'],
};

export function detectLang(text: string): string {
  const tokens = new Set(text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
  let best = 'en';
  let bestScore = 0;
  for (const [lang, stopWords] of Object.entries(STOPWORDS)) {
    const score = stopWords.reduce((acc, w) => acc + (tokens.has(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = lang;
    }
  }
  return best;
}

function shingles(text: string, k = 4): Set<string> {
  const words = text.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [];
  const set = new Set<string>();
  for (let i = 0; i + k <= words.length; i++) set.add(words.slice(i, i + k).join(' '));
  return set;
}

export interface DedupItem {
  id: string;
  text: string;
}

export interface DedupGroup {
  canonical: DedupItem;
  duplicates: DedupItem[];
}

export function dedup(items: DedupItem[], threshold = 0.5): DedupGroup[] {
  const groups: DedupGroup[] = [];
  const used = new Set<string>();
  for (const item of items) {
    if (used.has(item.id)) continue;
    const lang = detectLang(item.text);
    const sh = shingles(item.text);
    const group: DedupGroup = { canonical: item, duplicates: [] };
    used.add(item.id);
    for (const other of items) {
      if (used.has(other.id) || other.id === item.id) continue;
      if (detectLang(other.text) !== lang) continue;
      const osh = shingles(other.text);
      let inter = 0;
      for (const s of sh) if (osh.has(s)) inter++;
      const union = new Set([...sh, ...osh]).size;
      const sim = union ? inter / union : 0;
      if (sim >= threshold) {
        used.add(other.id);
        if (other.text.length > group.canonical.text.length) {
          group.duplicates.push(group.canonical);
          group.canonical = other;
        } else {
          group.duplicates.push(other);
        }
      }
    }
    groups.push(group);
  }
  return groups;
}

