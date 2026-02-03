/**
 * Strategy Registry — All survival strategies
 */

export * from './jupiter';

export interface Opportunity {
  type: 'swap' | 'yield' | 'arb';
  expectedProfit: number;
  risk: 'low' | 'medium' | 'high';
  execute: () => Promise<string | null>;
}

/**
 * Find the best opportunity across all strategies
 */
export async function findBestOpportunity(
  balanceSol: number,
  minProfit: number
): Promise<Opportunity | null> {
  // TODO: Aggregate opportunities from all strategies
  // - Jupiter swaps
  // - Kamino yields
  // - Drift funding rates
  // - Arbitrage between DEXs
  
  console.log('🔍 Scanning for opportunities...');
  
  // For MVP, just log that we're looking
  // Real implementation will check multiple sources
  
  return null;
}
