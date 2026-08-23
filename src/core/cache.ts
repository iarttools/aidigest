import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

interface CacheEntry {
  url: string;
  hash: string;
  markdown: string;
  updatedAt: string;
}

export interface DeltaResult {
  status: 'baseline' | 'unchanged' | 'changed';
  previousHash?: string;
  currentHash: string;
  output: string;
  added: number;
  removed: number;
}

export function defaultCacheDir(): string {
  return join(homedir(), '.aidigest', 'cache');
}

export function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function fileFor(url: string, cacheDir: string): string {
  return join(cacheDir, `${hashText(url)}.json`);
}

function readEntry(url: string, cacheDir: string): CacheEntry | null {
  const file = fileFor(url, cacheDir);
  if (!existsSync(file)) return null;
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
    if (!parsed || typeof parsed !== 'object') return null;
    const entry = parsed as Partial<CacheEntry>;
    if (typeof entry.url !== 'string' || typeof entry.hash !== 'string' || typeof entry.markdown !== 'string' || typeof entry.updatedAt !== 'string') return null;
    return entry as CacheEntry;
  } catch {
    return null;
  }
}

function writeEntry(url: string, markdown: string, cacheDir: string): void {
  mkdirSync(cacheDir, { recursive: true });
  const entry: CacheEntry = {
    url,
    hash: hashText(markdown),
    markdown,
    updatedAt: new Date().toISOString(),
  };
  const file = fileFor(url, cacheDir);
  const temporary = `${file}.tmp-${process.pid}`;
  writeFileSync(temporary, JSON.stringify(entry, null, 2), 'utf8');
  renameSync(temporary, file);
}

function lineDiff(previous: string, current: string): { output: string; added: number; removed: number } {
  const prev = previous.split('\n').map((l) => l.trim()).filter(Boolean);
  const curr = current.split('\n').map((l) => l.trim()).filter(Boolean);
  const prevSet = new Set(prev);
  const currSet = new Set(curr);
  const added = curr.filter((line) => !prevSet.has(line));
  const removed = prev.filter((line) => !currSet.has(line));
  const addedPreview = added.slice(0, 100).map((line) => `+ ${line}`);
  const removedPreview = removed.slice(0, 100).map((line) => `- ${line}`);
  return {
    added: added.length,
    removed: removed.length,
    output: [
      '# aidigest delta',
      '',
      `Added lines: ${added.length}`,
      `Removed lines: ${removed.length}`,
      '',
      '## Added',
      ...(addedPreview.length ? addedPreview : ['(none)']),
      '',
      '## Removed',
      ...(removedPreview.length ? removedPreview : ['(none)']),
      added.length > 100 || removed.length > 100 ? '\n<!-- aidigest: delta preview truncated to 100 lines per side -->' : '',
    ].filter(Boolean).join('\n'),
  };
}

export function digestDelta(url: string, markdown: string, cacheDir = defaultCacheDir()): DeltaResult {
  const previous = readEntry(url, cacheDir);
  const currentHash = hashText(markdown);
  writeEntry(url, markdown, cacheDir);
  if (!previous) {
    return {
      status: 'baseline',
      currentHash,
      output: `# aidigest baseline\n\nNo previous cache existed for this URL. Baseline saved.\n\n${markdown}`,
      added: 0,
      removed: 0,
    };
  }
  if (previous.hash === currentHash) {
    return {
      status: 'unchanged',
      previousHash: previous.hash,
      currentHash,
      output: `# aidigest delta\n\nNo content changes since ${previous.updatedAt}. Cache refreshed.`,
      added: 0,
      removed: 0,
    };
  }
  const diff = lineDiff(previous.markdown, markdown);
  return {
    status: 'changed',
    previousHash: previous.hash,
    currentHash,
    output: diff.output,
    added: diff.added,
    removed: diff.removed,
  };
}

