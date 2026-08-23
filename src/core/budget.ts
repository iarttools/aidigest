import { countTokens } from './tokens.js';

function prefixToBudget(text: string, budget: number): string {
  if (budget <= 0 || !text) return '';
  if (countTokens(text) <= budget) return text;
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

export function fitToBudget(md: string, budget: number): string {
  if (budget <= 0) return '';
  const total = countTokens(md);
  if (total <= budget) return md;
  const note = `<!-- aidigest: truncated to ~${budget} tokens (${total} originally) -->`;
  const lines = md.split('\n');
  let out = '';
  for (const line of lines) {
    const candidate = out ? `${out}\n${line}` : line;
    if (countTokens(`${candidate}\n\n${note}`) <= budget) out = candidate;
    else break;
  }
  if (out) return `${out}\n\n${note}`;
  if (countTokens(note) <= budget) {
    const prefix = prefixToBudget(`\n\n${note}`, budget);
    return prefix.endsWith(note) ? prefix : note;
  }
  return prefixToBudget(md, budget);
}

