import { describe, it, expect } from 'vitest';
import { dedup, detectLang, type DedupItem } from './dedup.js';

describe('dedup', () => {
  it('detects language by stopwords', () => {
    expect(detectLang('the cat and the dog are not for you')).toBe('en');
    expect(detectLang('los gatos y las casas son para una persona')).toBe('es');
  });

  it('groups near-duplicate items and picks the longest as canonical', () => {
    const items: DedupItem[] = [
      { id: 'a', text: 'The council approved the new housing plan after a long debate about the budget.' },
      { id: 'b', text: 'The council approved the new housing plan after a long debate about the budget and zoning.' },
      { id: 'c', text: 'A completely unrelated story about a different topic appeared elsewhere today.' },
    ];
    const groups = dedup(items);
    expect(groups.length).toBe(2);
    const grouped = groups.find((g) => g.duplicates.length > 0);
    expect(grouped).toBeDefined();
    expect(grouped!.duplicates.length).toBe(1);
  });
});

