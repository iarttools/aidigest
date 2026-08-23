export type TaskMode = 'answer' | 'research' | 'coding' | 'compare' | 'vision' | 'full';

export interface TaskProfile {
  task: TaskMode;
  defaultBudget: number;
  preserve: string[];
  description: string;
}

export const TASKS: Record<TaskMode, TaskProfile> = {
  answer: {
    task: 'answer',
    defaultBudget: 1200,
    preserve: ['title', 'first paragraphs', 'lists', 'key facts', 'links'],
    description: 'Respuesta directa con el contexto mínimo útil.',
  },
  research: {
    task: 'research',
    defaultBudget: 6000,
    preserve: ['headings', 'citations', 'tables', 'dates', 'qualifiers'],
    description: 'Investigación trazable conservando estructura y matices.',
  },
  coding: {
    task: 'coding',
    defaultBudget: 8000,
    preserve: ['headings', 'code', 'commands', 'api names', 'links'],
    description: 'Documentación técnica sin sacrificar ejemplos ejecutables.',
  },
  compare: {
    task: 'compare',
    defaultBudget: 5000,
    preserve: ['headings', 'tables', 'numbers', 'dates', 'differences'],
    description: 'Comparativa con datos y diferencias explícitas.',
  },
  vision: {
    task: 'vision',
    defaultBudget: 4500,
    preserve: ['headings', 'image alt text', 'captions', 'tables', 'layout'],
    description: 'Texto preparado para acompañar un modelo multimodal.',
  },
  full: {
    task: 'full',
    defaultBudget: 12000,
    preserve: ['all available structure', 'links', 'code', 'tables', 'qualifiers'],
    description: 'Máxima fidelidad con compresión conservadora.',
  },
};

export function taskNames(): TaskMode[] {
  return Object.keys(TASKS) as TaskMode[];
}

export function resolveTask(task?: string): TaskProfile {
  if (task && task in TASKS) return TASKS[task as TaskMode];
  return TASKS.research;
}

function compactAnswer(markdown: string): string {
  const lines = markdown.split('\n');
  const kept: string[] = [];
  let paragraphCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (kept.length && kept[kept.length - 1] !== '') kept.push('');
      continue;
    }
    if (/^#{1,3}\s/.test(trimmed) || /^[-*+]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed) || /^```/.test(trimmed)) {
      kept.push(line);
      continue;
    }
    if (paragraphCount < 3) {
      kept.push(line);
      paragraphCount++;
    }
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function preserveTechnical(markdown: string): string {
  return markdown
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function adaptTask(markdown: string, task: TaskMode): string {
  switch (task) {
    case 'answer':
      return compactAnswer(markdown);
    case 'coding':
    case 'vision':
    case 'research':
    case 'compare':
    case 'full':
    default:
      return preserveTechnical(markdown);
  }
}

