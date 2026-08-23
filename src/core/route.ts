import type { TierName } from './tiers.js';

export type Tier = TierName;

export interface ModelInfo {
  name: string;
  contextTokens: number;
  inputPer1M: number;
  outputPer1M: number;
  minTier: TierName;
}

export const MODELS: ModelInfo[] = [
  { name: 'gpt-4o-mini', contextTokens: 128000, inputPer1M: 0.15, outputPer1M: 0.6, minTier: 'small' },
  { name: 'claude-3-5-haiku', contextTokens: 200000, inputPer1M: 0.8, outputPer1M: 4, minTier: 'small' },
  { name: 'gpt-4o', contextTokens: 128000, inputPer1M: 2.5, outputPer1M: 10, minTier: 'mid' },
  { name: 'claude-3-opus', contextTokens: 200000, inputPer1M: 15, outputPer1M: 75, minTier: 'max' },
];

const TIER_RANK: Record<TierName, number> = {
  nano: 1,
  micro: 2,
  mini: 3,
  small: 4,
  mid: 5,
  max: 6,
  ultra: 7,
  // These are specialized profiles; routing still needs a model with at
  // least mid-tier capacity, rather than comparing their array position.
  research: 5,
  coding: 5,
  vision: 5,
};

export interface Recommendation {
  model: string;
  estCostPerRead: number;
  fitsContext: boolean;
  meetsTier: boolean;
}

export function recommendModel(afterTokens: number, requiredTier?: TierName): Recommendation {
  const minimumRank = requiredTier ? TIER_RANK[requiredTier] : 0;
  const eligible = MODELS.filter((m) => TIER_RANK[m.minTier] >= minimumRank);
  if (eligible.length === 0) return { model: 'none', estCostPerRead: 0, fitsContext: false, meetsTier: false };
  const fits = eligible.filter((m) => m.contextTokens >= afterTokens);
  const best = fits.length
    ? [...fits].sort((a, b) => a.inputPer1M - b.inputPer1M)[0]
    : [...eligible].sort((a, b) => b.contextTokens - a.contextTokens || a.inputPer1M - b.inputPer1M)[0];
  return {
    model: best.name,
    estCostPerRead: (best.inputPer1M * Math.max(0, afterTokens)) / 1_000_000,
    fitsContext: fits.length > 0,
    meetsTier: true,
  };
}

