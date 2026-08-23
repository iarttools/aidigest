export interface ScoreInput {
  before: number;
  after: number;
  injections: number;
  hasLlmsTxt: boolean;
  hasStructuredData: boolean;
  hasHeadings: boolean;
  hasTables: boolean;
}

export interface ScoreFactor {
  label: string;
  points: number;
  max: number;
}

export interface ScoreResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  factors: ScoreFactor[];
}

function gradeFor(score: number): ScoreResult['grade'] {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

export function scorePage(input: ScoreInput): ScoreResult {
  const savedPct = input.before > 0 ? Math.round((1 - input.after / input.before) * 100) : 0;
  const effPoints = savedPct >= 70 ? 35 : Math.round((savedPct / 70) * 35);
  const factors: ScoreFactor[] = [
    { label: 'Token efficiency (raw -> distilled)', points: effPoints, max: 35 },
    { label: 'Provides llms.txt', points: input.hasLlmsTxt ? 20 : 0, max: 20 },
    { label: 'Structured data (JSON-LD / schema)', points: input.hasStructuredData ? 15 : 0, max: 15 },
    { label: 'Structured headings', points: input.hasHeadings ? 10 : 0, max: 10 },
    { label: 'Tables / data tables', points: input.hasTables ? 10 : 0, max: 10 },
    { label: 'Injection-free content', points: input.injections === 0 ? 10 : 0, max: 10 },
  ];
  const score = Math.min(100, factors.reduce((sum, factor) => sum + factor.points, 0));
  return { score, grade: gradeFor(score), factors };
}

export function renderScore(result: ScoreResult, url: string): string {
  const lines = result.factors.map((f) => `- ${f.label}: ${f.points}/${f.max}`);
  return [
    '# aidigest AI-Readiness Score',
    '',
    `URL: ${url}`,
    `Score: ${result.score}/100 (grade ${result.grade})`,
    '',
    '## Breakdown',
    ...lines,
    '',
    'Tip: raise your score by adding an `llms.txt`, JSON-LD structured data, clear headings,',
    'and removing hidden prompt-injection patterns.',
  ].join('\n');
}

