/**
 * Yield Strategy — Passive income to survive
 * Checks Kamino, Marinade, and other yield sources
 */
import { Connection, Keypair } from '@solana/web3.js';
import { Opportunity } from './types';
/**
 * Check yield opportunities from various protocols
 */
export declare function checkYieldOpportunities(connection: Connection, wallet: Keypair, balanceSol: number): Promise<Opportunity[]>;
