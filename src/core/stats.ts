import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface StatsEntry {
  at: string;
  url: string;
  before: number;
  after: number;
  saved: number;
  savedPct: number;
  mode: 'digest' | 'schema' | 'delta' | 'schema+delta';
  injections: number;
  source?: string;
  tier?: string;
  model?: string;
  task?: string;
  quality?: number;
  cacheHit?: boolean;
  redactions?: number;
}

export interface StatsSummary {
  runs: number;
  before: number;
  after: number;
  saved: number;
  savedPct: number;
  estimatedSavedUsd: number;
  model: string;
  inputUsdPerMillion: number;
  byMode: Record<string, number>;
  bySource: Record<string, number>;
  injections: number;
  averageQuality: number;
  cacheHits: number;
  redactions: number;
  byTask: Record<string, number>;
}

const MODEL_PRICES: Record<string, number> = {
  'gpt-4o-mini': 0.15,
  'gpt-4o': 2.5,
  'gpt-4-turbo': 10,
  'gpt-4': 30,
  'gpt-3.5-turbo': 0.5,
  'claude-3-5-sonnet': 3,
  'claude-3-opus': 15,
  'claude-3-haiku': 0.25,
  'gemini-1.5-pro': 3.5,
  'gemini-1.5-flash': 0.15,
  'llama-3.1-70b': 0.9,
  'mistral-large': 2,
  'claude-sonnet-4-6': 3,
  'claude-sonnet-5': 3,
  'claude-opus-4-7': 5,
  'claude-haiku-4-5': 1,
};

const MODEL_OUTPUT_PRICES: Record<string, number> = {
  'gpt-4o-mini': 0.6,
  'gpt-4o': 10,
  'claude-3-5-sonnet': 15,
  'claude-sonnet-4-6': 15,
  'claude-sonnet-5': 15,
  'claude-opus-4-7': 25,
  'claude-haiku-4-5': 5,
};

export function defaultStatsFile(): string {
  return process.env.AIDIGEST_STATS ?? join(homedir(), '.aidigest', 'stats.json');
}

export function modelPrice(model = 'gpt-4o-mini'): number {
  return MODEL_PRICES[model] ?? MODEL_PRICES['gpt-4o-mini'];
}

export function listModels(): string[] {
  return Object.keys(MODEL_PRICES);
}

export function modelOutputPrice(model = 'gpt-4o-mini'): number {
  return MODEL_OUTPUT_PRICES[model] ?? 0;
}

export function costUsd(savedTokens: number, model = 'gpt-4o-mini'): number {
  return Number(((Math.max(0, savedTokens) / 1_000_000) * modelPrice(model)).toFixed(6));
}

export function readStats(file = defaultStatsFile()): StatsEntry[] {
  if (!existsSync(file)) return [];
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStatsEntry);
  } catch {
    return [];
  }
}

function isStatsEntry(value: unknown): value is StatsEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<StatsEntry>;
  return (
    typeof entry.at === 'string' &&
    typeof entry.url === 'string' &&
    Number.isFinite(entry.before) &&
    Number.isFinite(entry.after) &&
    Number.isFinite(entry.saved) &&
    Number.isFinite(entry.savedPct) &&
    typeof entry.mode === 'string' &&
    Number.isFinite(entry.injections)
  );
}

export function recordStats(entry: Omit<StatsEntry, 'at' | 'saved' | 'savedPct'>, file = defaultStatsFile()): void {
  mkdirSync(dirname(file), { recursive: true });
  const saved = Math.max(0, entry.before - entry.after);
  const savedPct = entry.before > 0 ? Math.round((saved / entry.before) * 100) : 0;
  const entries = readStats(file);
  entries.push({ ...entry, at: new Date().toISOString(), saved, savedPct });
  const temporary = `${file}.tmp-${process.pid}`;
  writeFileSync(temporary, JSON.stringify(entries, null, 2), 'utf8');
  renameSync(temporary, file);
}

export function summarizeStats(entries: StatsEntry[], model = 'gpt-4o-mini'): StatsSummary {
  const before = entries.reduce((sum, entry) => sum + entry.before, 0);
  const after = entries.reduce((sum, entry) => sum + entry.after, 0);
  const saved = entries.reduce((sum, entry) => sum + entry.saved, 0);
  const inputUsdPerMillion = modelPrice(model);
  const byMode: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byTask: Record<string, number> = {};
  let injections = 0;
  let qualityTotal = 0;
  let qualityCount = 0;
  let cacheHits = 0;
  let redactions = 0;
  for (const entry of entries) {
    byMode[entry.mode] = (byMode[entry.mode] ?? 0) + 1;
    const src = entry.source ?? 'cli';
    bySource[src] = (bySource[src] ?? 0) + 1;
    injections += entry.injections;
    if (entry.task) byTask[entry.task] = (byTask[entry.task] ?? 0) + 1;
    if (typeof entry.quality === 'number') {
      qualityTotal += entry.quality;
      qualityCount++;
    }
    if (entry.cacheHit) cacheHits++;
    redactions += entry.redactions ?? 0;
  }
  return {
    runs: entries.length,
    before,
    after,
    saved,
    savedPct: before > 0 ? Math.round((saved / before) * 100) : 0,
    estimatedSavedUsd: Number(((saved / 1_000_000) * inputUsdPerMillion).toFixed(6)),
    model,
    inputUsdPerMillion,
    byMode,
    bySource,
    injections,
    averageQuality: qualityCount ? Math.round(qualityTotal / qualityCount) : 0,
    cacheHits,
    redactions,
    byTask,
  };
}

export function renderStats(summary: StatsSummary): string {
  const modes = Object.entries(summary.byMode).map(([mode, count]) => `- ${mode}: ${count}`).join('\n') || '- none: 0';
  return [
    '# aidigest stats',
    '',
    `Runs: ${summary.runs}`,
    `Tokens before: ${summary.before}`,
    `Tokens after:  ${summary.after}`,
    `Tokens saved:  ${summary.saved} (${summary.savedPct}%)`,
    `Model: ${summary.model} ($${summary.inputUsdPerMillion}/1M input tokens)`,
    `Estimated saved: $${summary.estimatedSavedUsd}`,
    '',
    '## Runs by mode',
    modes,
  ].join('\n');
}

