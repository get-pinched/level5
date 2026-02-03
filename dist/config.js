"use strict";
/**
 * pinch configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.config = {
    // RPC
    rpcUrl: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
    // Wallet (the survival wallet)
    walletAddress: process.env.WALLET_ADDRESS || '',
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || '',
    // Survival parameters
    minRunwayHours: parseInt(process.env.MIN_RUNWAY_HOURS || '24'),
    checkIntervalMs: parseInt(process.env.CHECK_INTERVAL_MS || '60000'), // 1 min
    // Cost estimates (in SOL)
    estimatedHourlyCost: parseFloat(process.env.HOURLY_COST || '0.001'), // inference + tx fees
    // GLAM vault (optional, for treasury management)
    glamVaultAddress: process.env.GLAM_VAULT_ADDRESS || '',
    // Strategy settings
    minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD || '0.001'),
    maxSlippageBps: parseInt(process.env.MAX_SLIPPAGE_BPS || '100'), // 1%
};
