/**
 * Strategy Types — Shared interfaces
 */
export interface Opportunity {
    type: 'swap' | 'yield' | 'arb';
    expectedProfit: number;
    risk: 'low' | 'medium' | 'high';
    execute: () => Promise<string | null>;
}
