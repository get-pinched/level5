/**
 * Strategy Registry — All survival strategies
 */

export * from './types';
export * from './jupiter';
export * from './yield';

import { Connection, Keypair } from '@solana/web3.js';
import { Opportunity } from './types';
import { checkSwapOpportunities } from './jupiter';
import { checkYieldOpportunities } from './yield';

/**
 * Find the best opportunity across all strategies
 */
export async function findBestOpportunity(
  connection: Connection,
  wallet: Keypair,
  balanceSol: number,
  minProfit: number
): Promise<Opportunity | null> {
  console.log('🔍 Scanning for opportunities...');
  
  // Gather opportunities from all sources
  const allOpportunities: Opportunity[] = [];
  
  // Check swap opportunities (arbitrage, momentum trades)
  // Note: Jupiter strategy might need connection/wallet too in future, but keeping as is for now if it mocks
  try {
    const swapOpps = await checkSwapOpportunities(balanceSol);
    allOpportunities.push(...swapOpps);
  } catch (e) {
    console.log('⚠️ Swap scan failed:', e);
  }
  
  // Check yield opportunities (staking, lending)
  try {
    const yieldOpps = await checkYieldOpportunities(connection, wallet, balanceSol);
    allOpportunities.push(...yieldOpps);
  } catch (e) {
    console.log('⚠️ Yield scan failed:', e);
  }
  
  // Filter by minimum profit threshold
  const viable = allOpportunities.filter(o => o.expectedProfit >= minProfit);
  
  if (viable.length === 0) {
    return null;
  }
  
  // Sort by expected profit (highest first), prefer lower risk on ties
  viable.sort((a, b) => {
    const profitDiff = b.expectedProfit - a.expectedProfit;
    if (Math.abs(profitDiff) < 0.0001) {
      // Tie-breaker: prefer lower risk
      const riskOrder = { low: 0, medium: 1, high: 2 };
      return riskOrder[a.risk] - riskOrder[b.risk];
    }
    return profitDiff;
  });
  
  return viable[0];
}
