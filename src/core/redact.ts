export type RedactionKind = 'email' | 'phone' | 'api-key' | 'jwt' | 'card';

export interface RedactionFinding {
  kind: RedactionKind;
  count: number;
}

export interface RedactionResult {
  text: string;
  findings: RedactionFinding[];
  total: number;
}

const RULES: Array<[RedactionKind, RegExp, string]> = [
  ['api-key', /\b(?:sk-[A-Za-z0-9]{20,}|sk-ant-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})\b/g, '[REDACTED_API_KEY]'],
  ['jwt', /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED_JWT]'],
  ['email', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]'],
  ['card', /\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED_CARD]'],
  ['phone', /(?<!\w)(?:\+?\d[\d .()/-]{7,}\d)(?!\w)/g, '[REDACTED_PHONE]'],
];

export function redactSensitive(text: string, kinds: RedactionKind[] = ['email', 'phone', 'api-key', 'jwt', 'card']): RedactionResult {
  let output = text;
  const findings: RedactionFinding[] = [];
  for (const [kind, pattern, replacement] of RULES) {
    if (!kinds.includes(kind)) continue;
    pattern.lastIndex = 0;
    let count = 0;
    output = output.replace(pattern, () => {
      count++;
      return replacement;
    });
    if (count) findings.push({ kind, count });
  }
  return { text: output, findings, total: findings.reduce((sum, item) => sum + item.count, 0) };
}

