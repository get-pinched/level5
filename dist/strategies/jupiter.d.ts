/**
 * Jupiter Integration — Find swap opportunities
 */
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
export declare const TOKENS: {
    SOL: string;
    USDC: string;
    USDT: string;
};
export interface SwapQuote {
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    priceImpactPct: number;
    routePlan: any[];
}
export interface SwapOpportunity {
    type: 'swap';
    fromToken: string;
    toToken: string;
    inputAmount: number;
    expectedOutput: number;
    profitEstimate: number;
    priceImpact: number;
    quote: SwapQuote;
}
/**
 * Get quote from Jupiter
 */
export declare function getQuote(inputMint: string, outputMint: string, amount: number, // in lamports or smallest unit
slippageBps?: number): Promise<SwapQuote | null>;
/**
 * Execute swap via Jupiter
 */
export declare function executeSwap(quote: SwapQuote, userPublicKey: PublicKey, connection: Connection, signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>): Promise<string | null>;
import { Opportunity } from './types';
/**
 * Check for swap opportunities (used by strategy registry)
 */
export declare function checkSwapOpportunities(balanceSol: number): Promise<Opportunity[]>;
/**
 * Find best swap opportunity for survival
 * Looks for ways to convert volatile assets to stable or vice versa
 */
export declare function findSwapOpportunity(currentBalanceSol: number, minProfitThreshold?: number): Promise<SwapOpportunity | null>;
