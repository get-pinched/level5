/**
 * Strategy Registry — All survival strategies
 */
export * from './types';
export * from './jupiter';
export * from './yield';
import { Connection, Keypair } from '@solana/web3.js';
import { Opportunity } from './types';
/**
 * Find the best opportunity across all strategies
 */
export declare function findBestOpportunity(connection: Connection, wallet: Keypair, balanceSol: number, minProfit: number): Promise<Opportunity | null>;
