import { extract } from './extract.js';
import { scanInjections } from './scrub.js';

export interface StreamOpts {
  scrub?: boolean;
}

export async function* streamDigest(
  html: string,
  url = 'https://example.com/',
  opts: StreamOpts = {}
): AsyncGenerator<string> {
  const { markdown } = extract(html, url);
  if (!markdown.trim()) return;
  const blocks = markdown
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  for (const b of blocks) {
    const clean = opts.scrub === false ? b : scanInjections(b).clean;
    if (clean.trim()) yield clean + '\n\n';
  }
}

