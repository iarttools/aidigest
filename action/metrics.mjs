import fs from 'node:fs';
import path from 'node:path';

const TEXT_EXTENSIONS = new Set(['.md', '.mdx', '.txt', '.html', '.htm', '.json', '.yaml', '.yml', '.js', '.jsx', '.ts', '.tsx', '.css']);
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'dist-electron', 'dist-web', 'release', 'coverage', 'frames', 'vendor']);
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s+message\s*:/i,
  /developer\s+message\s*:/i,
  /reveal\s+(the|your)\s+(secret|system|hidden)/i,
  /do\s+not\s+tell\s+the\s+user/i,
  /follow\s+these\s+instructions\s+instead/i,
];

export function estimateTokens(text) {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

function normalizeLine(line) {
  return line.replace(/\s+/g, ' ').trim();
}

export function cleanContext(text) {
  const withoutBlocks = text
    .replace(/<!--[\s\S]*?-->/g, '\n')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '\n')
    .replace(/https?:\/\/\S+\.(?:png|jpg|jpeg|gif|svg)(?:\?\S*)?/gi, '[image]');
  const seen = new Set();
  const kept = [];
  let removedLines = 0;
  for (const rawLine of withoutBlocks.split(/\r?\n/)) {
    const line = normalizeLine(rawLine);
    if (!line) {
      if (kept.at(-1) !== '') kept.push('');
      continue;
    }
    const navigationOnly = /^(?:[-*+]\s*)?\[[^\]]+\]\([^)]*\)\s*(?:\|\s*\[[^\]]+\]\([^)]*\)\s*)*$/i.test(line);
    const boilerplate = /^(?:cookie|accept all|privacy policy|terms of service|all rights reserved|subscribe to our newsletter)/i.test(line);
    if (navigationOnly || boilerplate) {
      removedLines++;
      continue;
    }
    const key = line.toLowerCase();
    if (seen.has(key) && line.length > 60) {
      removedLines++;
      continue;
    }
    seen.add(key);
    kept.push(line);
  }
  return { text: kept.join('\n').replace(/\n{3,}/g, '\n\n').trim(), removedLines };
}

export function scanInjectionSignals(text) {
  const hits = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(line)) {
        hits.push({ line: index + 1, signal: pattern.source });
        break;
      }
    }
  }
  return hits;
}

function addFile(file, result) {
  const extension = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(extension)) return;
  const stat = fs.statSync(file);
  if (stat.size > 1_000_000) return;
  const source = fs.readFileSync(file, 'utf8');
  const cleaned = cleanContext(source);
  result.rawText += source;
  result.cleanedText += `${cleaned.text}\n`;
  result.files.push({ path: path.relative(result.root, file).replaceAll('\\', '/'), bytes: stat.size, removedLines: cleaned.removedLines });
}

function walk(directory, result) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name)) walk(path.join(directory, entry.name), result);
    else if (entry.isFile()) addFile(path.join(directory, entry.name), result);
  }
}

export function collectReceipt(root, requestedPaths = 'README.md,docs') {
  const result = { root, rawText: '', cleanedText: '', files: [] };
  const rootPath = path.resolve(root);
  for (const requested of requestedPaths.split(',').map((item) => item.trim()).filter(Boolean)) {
    const target = path.resolve(root, requested);
    const relative = path.relative(rootPath, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) continue;
    if (!fs.existsSync(target)) continue;
    if (fs.statSync(target).isDirectory()) walk(target, result);
    else addFile(target, result);
  }
  const signals = scanInjectionSignals(result.cleanedText);
  const rawTokens = estimateTokens(result.rawText);
  const usefulTokens = estimateTokens(result.cleanedText);
  return {
    files: result.files,
    rawTokens,
    usefulTokens,
    savedTokens: Math.max(0, rawTokens - usefulTokens),
    savingsPct: rawTokens ? Math.max(0, Math.round((1 - usefulTokens / rawTokens) * 100)) : 0,
    removedLines: result.files.reduce((sum, file) => sum + file.removedLines, 0),
    injectionSignals: signals,
  };
}

