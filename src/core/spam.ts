export interface SpamReport {
  score: number;
  reasons: string[];
}

export function spamScore(html: string, markdown: string): SpamReport {
  const reasons: string[] = [];
  let score = 0;

  const hidden = (html.match(/display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0/i) || []).length;
  if (hidden > 0) {
    score += 20;
    reasons.push(`hidden elements: ${hidden}`);
  }

  const words = markdown.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  const top = Math.max(0, ...[...freq.values()]);
  if (words.length > 20 && top / words.length > 0.08) {
    score += 25;
    reasons.push('keyword stuffing');
  }

  const links = (html.match(/<a\s/gi) || []).length;
  const textLen = markdown.length || 1;
  if (links > 30 && links / (textLen / 200) > 5) {
    score += 20;
    reasons.push('excessive links');
  }

  score = Math.min(100, score);
  return { score, reasons };
}

