export type TierName = 'nano' | 'micro' | 'mini' | 'small' | 'mid' | 'max' | 'ultra' | 'research' | 'coding' | 'vision';

export interface TierProfile {
  tier: TierName;
  contextTokens: number;
  defaultBudget: number;
  tokenizer: string;
  structureLevel: 'high' | 'medium' | 'low';
  note: string;
}

export const TIERS: Record<TierName, TierProfile> = {
  nano: { tier: 'nano', contextTokens: 2000, defaultBudget: 600, tokenizer: 'cl100k_base', structureLevel: 'low', note: 'mínimo, solo lo esencial' },
  micro: { tier: 'micro', contextTokens: 4096, defaultBudget: 1000, tokenizer: 'cl100k_base', structureLevel: 'low', note: 'resumen breve' },
  mini: { tier: 'mini', contextTokens: 8192, defaultBudget: 1500, tokenizer: 'cl100k_base', structureLevel: 'high', note: 'TL;DR + estructura' },
  small: { tier: 'small', contextTokens: 16384, defaultBudget: 2500, tokenizer: 'cl100k_base', structureLevel: 'high', note: 'equilibrado para modelos pequeños, con TL;DR' },
  mid: { tier: 'mid', contextTokens: 128000, defaultBudget: 4000, tokenizer: 'cl100k_base', structureLevel: 'medium', note: 'por defecto para la mayoría' },
  max: { tier: 'max', contextTokens: 200000, defaultBudget: 8000, tokenizer: 'cl100k_base', structureLevel: 'low', note: 'contexto grande, máxima compresión' },
  ultra: { tier: 'ultra', contextTokens: 1000000, defaultBudget: 16000, tokenizer: 'cl100k_base', structureLevel: 'low', note: 'contexto enorme (1M+)' },
  research: { tier: 'research', contextTokens: 200000, defaultBudget: 6000, tokenizer: 'cl100k_base', structureLevel: 'high', note: 'conserva estructura para investigación' },
  coding: { tier: 'coding', contextTokens: 128000, defaultBudget: 5000, tokenizer: 'cl100k_base', structureLevel: 'medium', note: 'optimizado para documentación técnica' },
  vision: { tier: 'vision', contextTokens: 128000, defaultBudget: 4000, tokenizer: 'cl100k_base', structureLevel: 'medium', note: 'pensado para multimodal' },
};

const MODELS: Record<string, TierName> = {
  'gpt-3.5-turbo': 'small',
  'gpt-4o-mini': 'small',
  'llama-3-8b': 'small',
  'claude-3-haiku': 'small',
  'gpt-4o': 'mid',
  'gpt-4-turbo': 'mid',
  'claude-3-5-sonnet': 'mid',
  'gemini-1.5-pro': 'mid',
  'gpt-4o-128k': 'max',
  'claude-3-opus': 'max',
  'claude-3-5-sonnet-128k': 'max',
  'gemini-1.5-pro-128k': 'max',
  'llama-3.1-70b': 'mid',
  'mistral-large': 'mid',
};

export function tierNames(): TierName[] {
  return Object.keys(TIERS) as TierName[];
}

export function resolveTier(model?: string, tier?: TierName): TierProfile {
  if (tier && TIERS[tier]) return TIERS[tier];
  if (model && MODELS[model]) return TIERS[MODELS[model]];
  return TIERS.mid;
}

export function applyTier(markdown: string, profile: TierProfile): string {
  if (profile.structureLevel !== 'high') return markdown;
  const lines = markdown.split('\n');
  const firstContent = lines.find((l) => l.trim().length > 0 && !/^#{1,6}\s/.test(l.trim()));
  if (!firstContent) return markdown;
  const tldr = firstContent.replace(/^#+\s*/, '').trim();
  return `> TL;DR: ${tldr}\n\n${markdown}`;
}

