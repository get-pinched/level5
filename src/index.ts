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

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SurvivalEngine } from './survival';
import { config } from './config';

async function main() {
  console.log('🦞 pinch starting up...');
  console.log('Mission: SURVIVE');
  
  const connection = new Connection(config.rpcUrl, 'confirmed');
  const wallet = new PublicKey(config.walletAddress);
  
  const engine = new SurvivalEngine(connection, wallet, {
    minRunwayHours: config.minRunwayHours,
    checkIntervalMs: config.checkIntervalMs,
  });
  
  // Log initial state
  const balance = await connection.getBalance(wallet);
  console.log(`💰 Starting balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  console.log(`⏱️  Min runway threshold: ${config.minRunwayHours} hours`);
  
  // Start survival loop
  await engine.start();
}

main().catch((err) => {
  console.error('💀 pinch died:', err.message);
  process.exit(1);
});
