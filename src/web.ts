export { extract } from './core/extract.js';
export { countTokens } from './core/tokens.js';
export { scanInjections, aggressiveCompress } from './core/scrub.js';
export { fitToBudget } from './core/budget.js';
export { applyTier, resolveTier, TIERS, type TierProfile, type TierName } from './core/tiers.js';
export { semanticDiff, type SemanticDiff } from './core/diff.js';
export { dedup, detectLang, type DedupItem, type DedupGroup } from './core/dedup.js';

