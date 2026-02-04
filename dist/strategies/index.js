"use strict";
/**
 * Strategy Registry — All survival strategies
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBestOpportunity = findBestOpportunity;
__exportStar(require("./types"), exports);
__exportStar(require("./jupiter"), exports);
__exportStar(require("./yield"), exports);
const jupiter_1 = require("./jupiter");
const yield_1 = require("./yield");
/**
 * Find the best opportunity across all strategies
 */
async function findBestOpportunity(connection, wallet, balanceSol, minProfit) {
    console.log('🔍 Scanning for opportunities...');
    // Gather opportunities from all sources
    const allOpportunities = [];
    // Check swap opportunities (arbitrage, momentum trades)
    // Note: Jupiter strategy might need connection/wallet too in future, but keeping as is for now if it mocks
    try {
        const swapOpps = await (0, jupiter_1.checkSwapOpportunities)(balanceSol);
        allOpportunities.push(...swapOpps);
    }
    catch (e) {
        console.log('⚠️ Swap scan failed:', e);
    }
    // Check yield opportunities (staking, lending)
    try {
        const yieldOpps = await (0, yield_1.checkYieldOpportunities)(connection, wallet, balanceSol);
        allOpportunities.push(...yieldOpps);
    }
    catch (e) {
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
