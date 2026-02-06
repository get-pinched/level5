/**
 * Setup script for devnet testing
 * Generates a keypair and requests airdrop
 */

import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';

async function main() {
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  
  // Check for existing keypair or generate new one
  const keypairPath = path.join(__dirname, '..', '.devnet-wallet.json');
  
  let keypair: Keypair;
  
  if (fs.existsSync(keypairPath)) {
    console.log('📂 Loading existing devnet wallet...');
    const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
    keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } else {
    console.log('🔑 Generating new devnet wallet...');
    keypair = Keypair.generate();
    fs.writeFileSync(keypairPath, JSON.stringify(Array.from(keypair.secretKey)));
    console.log('💾 Saved to .devnet-wallet.json');
  }
  
  const address = keypair.publicKey.toBase58();
  console.log(`📍 Address: ${address}`);
  
  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`💰 Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  
  // Request airdrop if low
  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.log('🚰 Requesting airdrop...');
    try {
      const sig = await connection.requestAirdrop(keypair.publicKey, 1 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, 'confirmed');
      const newBalance = await connection.getBalance(keypair.publicKey);
      console.log(`✅ Airdrop complete! New balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);
    } catch (error) {
      console.error('❌ Airdrop failed (rate limited?):', error);
    }
  }
  
  // Output env vars
  console.log('\n📝 Add to .env:');
  console.log(`WALLET_ADDRESS=${address}`);
  console.log(`RPC_URL=${DEVNET_RPC}`);
}

main().catch(console.error);
