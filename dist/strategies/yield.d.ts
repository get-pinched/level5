/**
 * Yield Strategy — Passive income to survive
 * Checks Kamino, Marinade, and other yield sources
 */
import { Opportunity } from './types';
/**
 * Check yield opportunities from various protocols
 */
export declare function checkYieldOpportunities(balanceSol: number): Promise<Opportunity[]>;
/**
 * Calculate optimal yield allocation
 */
export declare function calculateOptimalAllocation(balanceSol: number, riskTolerance: 'conservative' | 'balanced' | 'aggressive'): Map<string, number>;
