"use strict";
/**
 * pinch — The Agent That Refuses to Die
 *
 * Core survival loop:
 * 1. Check wallet balance
 * 2. Calculate runway (time until death)
 * 3. If runway < threshold: find opportunity
 * 4. Execute trade/yield
 * 5. Log on-chain
 * 6. Repeat
 */
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const survival_1 = require("./survival");
const config_1 = require("./config");
async function main() {
    console.log('🦞 pinch starting up...');
    console.log('Mission: SURVIVE');
    const connection = new web3_js_1.Connection(config_1.config.rpcUrl, 'confirmed');
    const wallet = new web3_js_1.PublicKey(config_1.config.walletAddress);
    const engine = new survival_1.SurvivalEngine(connection, wallet, {
        minRunwayHours: config_1.config.minRunwayHours,
        checkIntervalMs: config_1.config.checkIntervalMs,
    });
    // Log initial state
    const balance = await connection.getBalance(wallet);
    console.log(`💰 Starting balance: ${balance / web3_js_1.LAMPORTS_PER_SOL} SOL`);
    console.log(`⏱️  Min runway threshold: ${config_1.config.minRunwayHours} hours`);
    // Start survival loop
    await engine.start();
}
main().catch((err) => {
    console.error('💀 pinch died:', err.message);
    process.exit(1);
});
