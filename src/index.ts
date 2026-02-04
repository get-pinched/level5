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

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SurvivalEngine } from './survival';
import { config } from './config';
import { DeliberationLogger } from './logger';
import { DashboardServer } from './dashboard';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🦞 pinch starting up...');
  console.log('Mission: SURVIVE');
  
  const connection = new Connection(config.rpcUrl, 'confirmed');
  
  // Load Keypair
  let walletKeypair: Keypair;
  const keypairPath = process.env.WALLET_KEYPAIR_PATH || '.devnet-wallet.json';
  
  try {
    const fullPath = path.resolve(process.cwd(), keypairPath);
    if (fs.existsSync(fullPath)) {
      const keypairData = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      walletKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
    } else if (process.env.WALLET_PRIVATE_KEY) {
        // Fallback to env var if file missing (Mainnet/Production)
        // Assuming base58 string in env? Or JSON?
        // Let's assume JSON array in env for consistency if not base58 lib loaded here yet
        // Actually, let's keep it simple: require file for now or fail.
        throw new Error(`Keypair file not found at ${fullPath}`);
    } else {
        throw new Error("No wallet keypair found (WALLET_KEYPAIR_PATH or WALLET_PRIVATE_KEY)");
    }
  } catch (e: any) {
    console.error(`❌ Failed to load wallet: ${e.message}`);
    process.exit(1);
  }

  const wallet = walletKeypair.publicKey;
  console.log(`🔑 Wallet: ${wallet.toBase58()}`);

  // Initialize Logger (Arweave/Irys)
  const logger = new DeliberationLogger(keypairPath);
  
  const engine = new SurvivalEngine(connection, walletKeypair, {
    minRunwayHours: config.minRunwayHours,
    checkIntervalMs: config.checkIntervalMs,
  }, logger);
  
  // Start Dashboard
  const dashboard = new DashboardServer(engine, 3000);
  dashboard.start();
  (global as any).dashboard = dashboard; // Hack for logger access

  // Log initial state
  try {
    const balance = await connection.getBalance(wallet);
    console.log(`💰 Starting balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  } catch (e) {
    console.warn("⚠️ Could not fetch initial balance (RPC might be down)");
  }
  
  console.log(`⏱️  Min runway threshold: ${config.minRunwayHours} hours`);
  
  // Start survival loop
  await engine.start();
}

main().catch((err) => {
  console.error('💀 pinch died:', err.message);
  process.exit(1);
});
