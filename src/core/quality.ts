import { countTokens } from './tokens.js';
import type { Provenance } from './provenance.js';

export interface QualityReport {
  score: number;
  coverage: number;
  structure: number;
  traceability: number;
  safety: number;
  density: number;
  risk: 'low' | 'medium' | 'high';
  warnings: string[];
}

export function assessQuality(rawText: string, markdown: string, injectionCount: number, provenance: Provenance): QualityReport {
  const warnings: string[] = [];
  const rawTokens = Math.max(1, countTokens(rawText));
  const outputTokens = countTokens(markdown);
  const coverage = Math.round(Math.min(100, (outputTokens / rawTokens) * 100));
  const structure = Math.min(100, (provenance.sections.length ? 40 : 0) + (provenance.tables ? 20 : 0) + (provenance.codeBlocks ? 20 : 0) + (provenance.wordCount > 40 ? 20 : 0));
  const traceability = Math.min(100, (provenance.citations.length ? 65 : 0) + (provenance.title ? 20 : 0) + (provenance.sections.length ? 15 : 0));
  const safety = injectionCount === 0 ? 100 : Math.max(0, 100 - injectionCount * 25);
  const density = Math.round(Math.min(100, (provenance.wordCount / Math.max(1, outputTokens)) * 100));
  if (!provenance.title) warnings.push('missing title');
  if (!provenance.sections.length) warnings.push('missing headings');
  if (!provenance.citations.length) warnings.push('no inline citations');
  if (injectionCount > 0) warnings.push(`${injectionCount} prompt injection pattern(s) removed`);
  if (coverage < 15) warnings.push('very aggressive compression may omit context');
  const score = Math.round(coverage * 0.2 + structure * 0.25 + traceability * 0.25 + safety * 0.2 + density * 0.1);
  return {
    score: Math.max(0, Math.min(100, score)),
    coverage,
    structure,
    traceability,
    safety,
    density,
    risk: score >= 75 ? 'low' : score >= 50 ? 'medium' : 'high',
    warnings,
  };
}

