/**
 * Strategy Registry — All survival strategies
 */
export * from './types';
export * from './jupiter';
export * from './yield';
import { Opportunity } from './types';
/**
 * Find the best opportunity across all strategies
 */
export declare function findBestOpportunity(balanceSol: number, minProfit: number): Promise<Opportunity | null>;
