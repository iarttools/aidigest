import { modelOutputPrice, modelPrice } from './stats.js';

export interface SavingsInput {
  rawTokens: number;
  distilledTokens: number;
  pagesPerDay: number;
  days: number;
  model: string;
  outputTokensPerPage?: number;
  cacheDiscount?: number;
  batchDiscount?: number;
}

export interface SavingsResult {
  pages: number;
  rawInputTokens: number;
  distilledInputTokens: number;
  tokensSaved: number;
  reductionPct: number;
  rawCostUsd: number;
  distilledCostUsd: number;
  inputSavingsUsd: number;
  rawTotalCostUsd: number;
  distilledTotalCostUsd: number;
  totalSavingsUsd: number;
  assumptions: string[];
}

function priceAfterDiscount(price: number, cacheDiscount = 0, batchDiscount = 0): number {
  return price * Math.max(0, 1 - Math.min(1, cacheDiscount) - Math.min(1, batchDiscount));
}

export function simulateSavings(input: SavingsInput): SavingsResult {
  const pages = Math.max(0, Math.floor(input.pagesPerDay * input.days));
  const rawInputTokens = Math.max(0, Math.floor(input.rawTokens * pages));
  const distilledInputTokens = Math.max(0, Math.floor(input.distilledTokens * pages));
  const tokensSaved = Math.max(0, rawInputTokens - distilledInputTokens);
  const inputPrice = priceAfterDiscount(modelPrice(input.model), input.cacheDiscount, input.batchDiscount);
  const outputPrice = modelOutputPrice(input.model);
  const rawCostUsd = (rawInputTokens / 1_000_000) * inputPrice;
  const distilledCostUsd = (distilledInputTokens / 1_000_000) * inputPrice;
  const outputCostUsd = (Math.max(0, input.outputTokensPerPage ?? 0) * pages / 1_000_000) * outputPrice;
  const assumptions = [`${input.pagesPerDay} pages/day for ${input.days} days`, `${input.model}: $${modelPrice(input.model)}/1M input, $${outputPrice}/1M output`];
  if (input.cacheDiscount) assumptions.push(`${Math.round(input.cacheDiscount * 100)}% cache discount applied to input`);
  if (input.batchDiscount) assumptions.push(`${Math.round(input.batchDiscount * 100)}% batch discount applied to input`);
  return {
    pages,
    rawInputTokens,
    distilledInputTokens,
    tokensSaved,
    reductionPct: rawInputTokens > 0 ? Math.round((tokensSaved / rawInputTokens) * 100) : 0,
    rawCostUsd: Number(rawCostUsd.toFixed(6)),
    distilledCostUsd: Number(distilledCostUsd.toFixed(6)),
    inputSavingsUsd: Number((rawCostUsd - distilledCostUsd).toFixed(6)),
    rawTotalCostUsd: Number((rawCostUsd + outputCostUsd).toFixed(6)),
    distilledTotalCostUsd: Number((distilledCostUsd + outputCostUsd).toFixed(6)),
    totalSavingsUsd: Number((rawCostUsd - distilledCostUsd).toFixed(6)),
    assumptions,
  };
}

