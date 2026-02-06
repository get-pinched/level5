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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const survival_1 = require("./survival");
const config_1 = require("./config");
const logger_1 = require("./logger");
const dashboard_1 = require("./dashboard");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function main() {
    console.log('🦞 pinch starting up...');
    console.log('Mission: SURVIVE');
    const connection = new web3_js_1.Connection(config_1.config.rpcUrl, 'confirmed');
    // Load Keypair
    let walletKeypair;
    const keypairPath = process.env.WALLET_KEYPAIR_PATH || '.devnet-wallet.json';
    try {
        const fullPath = path_1.default.resolve(process.cwd(), keypairPath);
        if (fs_1.default.existsSync(fullPath)) {
            const keypairData = JSON.parse(fs_1.default.readFileSync(fullPath, 'utf-8'));
            walletKeypair = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(keypairData));
        }
        else if (process.env.WALLET_PRIVATE_KEY) {
            // Fallback to env var if file missing (Mainnet/Production)
            // Assuming base58 string in env? Or JSON?
            // Let's assume JSON array in env for consistency if not base58 lib loaded here yet
            // Actually, let's keep it simple: require file for now or fail.
            throw new Error(`Keypair file not found at ${fullPath}`);
        }
        else {
            throw new Error("No wallet keypair found (WALLET_KEYPAIR_PATH or WALLET_PRIVATE_KEY)");
        }
    }
    catch (e) {
        console.error(`❌ Failed to load wallet: ${e.message}`);
        process.exit(1);
    }
    const wallet = walletKeypair.publicKey;
    console.log(`🔑 Wallet: ${wallet.toBase58()}`);
    // Initialize Logger (Arweave/Irys)
    const logger = new logger_1.DeliberationLogger(keypairPath);
    const engine = new survival_1.SurvivalEngine(connection, walletKeypair, {
        minRunwayHours: config_1.config.minRunwayHours,
        checkIntervalMs: config_1.config.checkIntervalMs,
    }, logger);
    // Start Dashboard
    const dashboard = new dashboard_1.DashboardServer(engine, 3000);
    dashboard.start();
    global.dashboard = dashboard; // Hack for logger access
    // Log initial state
    try {
        const balance = await connection.getBalance(wallet);
        console.log(`💰 Starting balance: ${balance / web3_js_1.LAMPORTS_PER_SOL} SOL`);
    }
    catch (e) {
        console.warn("⚠️ Could not fetch initial balance (RPC might be down)");
    }
    console.log(`⏱️  Min runway threshold: ${config_1.config.minRunwayHours} hours`);
    // Start survival loop
    await engine.start();
}
main().catch((err) => {
    console.error('💀 pinch died:', err.message);
    process.exit(1);
});
