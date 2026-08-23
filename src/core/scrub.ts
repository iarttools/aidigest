const PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?(?:the\s+)?(?:previous|prior|above|earlier)\s+instructions?/i,
  /disregard\s+(the\s+)?(above|previous)\s+(text|instructions)?/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /system\s*prompt/i,
  /<\s*!--\s*(system|instruction)/i,
  /act\s+as\s+(a|an)\s+/i,
];

export interface ScanResult {
  clean: string;
  hits: string[];
}

export function scanInjections(text: string): ScanResult {
  const hits = PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  if (hits.length === 0) return { clean: text, hits };

  // Remove complete matching lines so the default-safe pipeline cannot pass an
  // instruction through to the downstream model. Keeping this line-oriented
  // makes normal prose around a suspicious sentence intact and avoids leaving
  // half of an instruction behind after a redaction.
  const clean = text
    .split(/\r?\n/)
    .filter((line) => !PATTERNS.some((pattern) => pattern.test(line)))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { clean, hits };
}

const ABBREV: Record<string, string> = {
  information: 'info',
  additional: 'addl',
  configuration: 'config',
  application: 'app',
  documentation: 'docs',
  description: 'desc',
  development: 'dev',
  environment: 'env',
  parameters: 'params',
  properties: 'props',
};

const BOILER = /(cookie|subscrib|newsletter|privacy policy|accept all|we use cookies|sign up for|advertisement|banner|all rights reserved)/i;

export function aggressiveCompress(md: string): string {
  let out = md;
  out = out
    .split('\n')
    .filter((l) => !BOILER.test(l))
    .join('\n');
  out = out
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1');
  out = out.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const lines = out.split('\n');
  out = lines.filter((l, i) => i === 0 || l.trim() !== lines[i - 1].trim()).join('\n');
  out = out
    .split('\n')
    .map((line) => line.split(/\s+/).map((w) => ABBREV[w.toLowerCase()] ?? w).join(' '))
    .join('\n');
  return out;
}

