import { countTokens } from './tokens.js';

function truncateToBudget(text: string, budget: number): string {
  const total = countTokens(text);
  if (total <= budget) return text;
  if (budget <= 0) return '';
  const chars = Array.from(text);
  let low = 0;
  let high = chars.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (countTokens(chars.slice(0, mid).join('')) <= budget) low = mid;
    else high = mid - 1;
  }
  return chars.slice(0, low).join('');
}

export function fitToContract(md: string, budget: number): string {
  const total = countTokens(md);
  if (total <= budget) return md;

  const sentences = md.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const parts = sentences.map((s, i) => ({ s, i, score: scoreSentence(s) }));
  parts.sort((a, b) => b.score - a.score);

  let used = 0;
  const chosen: number[] = [];
  for (const p of parts) {
    const t = countTokens(p.s + ' ');
    if (used + t > budget) break;
    used += t;
    chosen.push(p.i);
  }
  chosen.sort((a, b) => a - b);
  const res = chosen.map((i) => sentences[i]).join(' ');
  return truncateToBudget(res || sentences[0] || '', budget);
}

export function assertContract(out: string, budget: number): void {
  if (countTokens(out) > budget) throw new Error('aidigest contract violated: output exceeded budget');
}

function scoreSentence(s: string): number {
  const words = s.toLowerCase().match(/[a-z]{4,}/g) || [];
  return new Set(words).size;
}

