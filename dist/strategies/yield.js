"use strict";
/**
 * Yield Strategy — Passive income to survive
 * Checks Kamino, Marinade, and other yield sources
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkYieldOpportunities = checkYieldOpportunities;
const web3_js_1 = require("@solana/web3.js");
const klend_sdk_1 = require("@kamino-finance/klend-sdk");
// Kamino Main Market (Mainnet)
const KAMINO_MAIN_MARKET = new web3_js_1.PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF");
/**
 * Check yield opportunities from various protocols
 */
async function checkYieldOpportunities(connection, wallet, balanceSol) {
    const opportunities = [];
    // Fetch current yield rates
    const yieldSources = await fetchYieldRates(connection);
    for (const source of yieldSources) {
        if (balanceSol >= source.minDeposit) {
            // Calculate expected daily profit
            const dailyYield = (source.apr / 365 / 100) * balanceSol;
            if (dailyYield > 0.00001) { // Min threshold (0.00001 SOL/day)
                opportunities.push({
                    type: 'yield',
                    expectedProfit: dailyYield,
                    risk: source.risk,
                    execute: async () => {
                        console.log(`📈 Executing yield strategy: Deposit ${balanceSol.toFixed(4)} SOL to ${source.name}`);
                        if (source.execute) {
                            return await source.execute(connection, wallet, balanceSol * 0.5); // Invest 50% of available balance
                        }
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
async function fetchYieldRates(connection) {
    const isDevnet = connection.rpcEndpoint.includes("devnet");
    if (isDevnet) {
        // Mock data for devnet since Kamino main market isn't there
        return [
            {
                name: 'Kamino SOL (Devnet Simulation)',
                apr: 8.5,
                minDeposit: 0.1,
                risk: 'low',
                execute: async (conn, wallet, amount) => {
                    console.log("SIMULATION: Deposited " + amount + " SOL to Kamino");
                    return "tx_simulated_devnet_" + Date.now();
                }
            }
        ];
    }
    // Mainnet Logic
    try {
        // @ts-ignore: RPC type mismatch in SDK
        const market = await klend_sdk_1.KaminoMarket.load(connection, KAMINO_MAIN_MARKET, klend_sdk_1.PROGRAM_ID);
        if (!market) {
            console.warn("Kamino market loaded as null");
            return [];
        }
        // await market.loadReserves(); // Load all reserves - might be heavy
        // Get SOL reserve - trying by symbol or traversing
        let solApy = 0.04; // Fallback
        // Attempt to find reserve via internal state if public accessors fail
        // @ts-ignore
        const reserves = market.getReserves();
        for (const reserve of reserves) {
            // @ts-ignore
            if (reserve.symbol === "SOL" || reserve.tokenSymbol === "SOL" || reserve.config.tokenSymbol === "SOL") {
                // @ts-ignore
                solApy = parseFloat(reserve.stats.supplyInterestAPY);
                break;
            }
        }
        return [
            {
                name: 'Kamino SOL',
                apr: solApy * 100,
                minDeposit: 0.1,
                risk: 'low',
                execute: executeKaminoDeposit
            }
        ];
    }
    catch (e) {
        console.warn("Failed to load Kamino market:", e);
        return [];
    }
}
/**
 * Execute Kamino Deposit
 */
async function executeKaminoDeposit(connection, wallet, amount) {
    try {
        console.log(`🏦 Depositing ${amount} SOL to Kamino...`);
        // @ts-ignore: RPC type mismatch
        const market = await klend_sdk_1.KaminoMarket.load(connection, KAMINO_MAIN_MARKET, klend_sdk_1.PROGRAM_ID);
        if (!market)
            throw new Error("Market failed to load");
        const kaminoAction = await klend_sdk_1.KaminoAction.buildDepositTxns(market, (amount * 1e9).toString(), // Lamports
        "SOL", // Cast to any to satisfy branded type
        wallet.publicKey, // Cast to any (SDK might expect PublicKey or string)
        new klend_sdk_1.VanillaObligation(klend_sdk_1.PROGRAM_ID), 0, true);
        const instructions = [
            ...kaminoAction.setupIxs,
            ...kaminoAction.lendingIxs,
            ...kaminoAction.cleanupIxs,
        ].map(ix => ix); // Double cast to force it
        const tx = new web3_js_1.Transaction().add(...instructions);
        const signature = await (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [wallet]);
        console.log("✅ Deposit successful:", signature);
        return signature;
    }
    catch (e) {
        console.error("❌ Kamino deposit failed:", e);
        return null;
    }
}
