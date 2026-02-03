"use strict";
/**
 * Yield Strategy — Passive income to survive
 * Checks Kamino, Marinade, and other yield sources
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkYieldOpportunities = checkYieldOpportunities;
exports.calculateOptimalAllocation = calculateOptimalAllocation;
// Kamino vault addresses (mainnet)
const KAMINO_SOL_VAULT = 'D4hGmJKzxuPNyTDYRpLHCzpGvDN7s79j8b5gFSE3gBMz';
/**
 * Check yield opportunities from various protocols
 */
async function checkYieldOpportunities(balanceSol) {
    const opportunities = [];
    // Fetch current yield rates
    const yieldSources = await fetchYieldRates();
    for (const source of yieldSources) {
        if (balanceSol >= source.minDeposit) {
            // Calculate expected daily profit
            const dailyYield = (source.apr / 365) * balanceSol;
            if (dailyYield > 0.0001) { // Min threshold
                opportunities.push({
                    type: 'yield',
                    expectedProfit: dailyYield,
                    risk: source.risk,
                    execute: async () => {
                        console.log(`📈 Would deposit ${balanceSol.toFixed(4)} SOL to ${source.name} at ${source.apr.toFixed(2)}% APR`);
                        // TODO: Implement actual Kamino deposit via SDK
                        return null;
                    }
                });
            }
        }
    }
    return opportunities;
}
/**
 * Fetch current yield rates from protocols
 */
async function fetchYieldRates() {
    // In production, fetch real-time rates from:
    // - Kamino API
    // - Marinade staking rates
    // - Lulo aggregator
    // For now, use approximate rates
    return [
        {
            name: 'Kamino SOL',
            apr: 8.5, // ~8.5% APR typical
            minDeposit: 0.1,
            risk: 'low'
        },
        {
            name: 'Marinade mSOL',
            apr: 7.8,
            minDeposit: 0.1,
            risk: 'low'
        },
        {
            name: 'Kamino JLP Vault',
            apr: 25.0, // Higher risk, higher yield
            minDeposit: 1.0,
            risk: 'medium'
        }
    ];
}
/**
 * Calculate optimal yield allocation
 */
function calculateOptimalAllocation(balanceSol, riskTolerance) {
    const allocation = new Map();
    // Keep reserve for gas + trading
    const reserve = Math.max(0.05, balanceSol * 0.1);
    const deployable = balanceSol - reserve;
    switch (riskTolerance) {
        case 'conservative':
            allocation.set('reserve', reserve);
            allocation.set('Kamino SOL', deployable * 0.7);
            allocation.set('Marinade mSOL', deployable * 0.3);
            break;
        case 'balanced':
            allocation.set('reserve', reserve);
            allocation.set('Kamino SOL', deployable * 0.5);
            allocation.set('Marinade mSOL', deployable * 0.3);
            allocation.set('Kamino JLP', deployable * 0.2);
            break;
        case 'aggressive':
            allocation.set('reserve', reserve);
            allocation.set('Kamino JLP', deployable * 0.6);
            allocation.set('Kamino SOL', deployable * 0.4);
            break;
    }
    return allocation;
}
