/**
 * Yield Strategy — Passive income to survive
 * Checks Kamino, Marinade, and other yield sources
 */

import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import { KaminoMarket, KaminoAction, VanillaObligation, PROGRAM_ID } from "@kamino-finance/klend-sdk";
import Decimal from "decimal.js";
import { Opportunity } from './types';

// Kamino Main Market (Mainnet)
const KAMINO_MAIN_MARKET = new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF");

interface YieldSource {
  name: string;
  apr: number;
  minDeposit: number;
  risk: 'low' | 'medium' | 'high';
  execute?: (connection: Connection, wallet: Keypair, amount: number) => Promise<string | null>;
}

/**
 * Check yield opportunities from various protocols
 */
export async function checkYieldOpportunities(
  connection: Connection,
  wallet: Keypair,
  balanceSol: number
): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = [];
  
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
async function fetchYieldRates(connection: Connection): Promise<YieldSource[]> {
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
      const market = await KaminoMarket.load(connection, KAMINO_MAIN_MARKET, PROGRAM_ID);
      
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

  } catch (e) {
      console.warn("Failed to load Kamino market:", e);
      return [];
  }
}


/**
 * Execute Kamino Deposit
 */
async function executeKaminoDeposit(connection: Connection, wallet: Keypair, amount: number): Promise<string | null> {
    try {
        console.log(`🏦 Depositing ${amount} SOL to Kamino...`);
        // @ts-ignore: RPC type mismatch
        const market = await KaminoMarket.load(connection, KAMINO_MAIN_MARKET, PROGRAM_ID);
        
        if (!market) throw new Error("Market failed to load");

        const kaminoAction = await KaminoAction.buildDepositTxns(
            market,
            (amount * 1e9).toString(), // Lamports
            "SOL" as any, // Cast to any to satisfy branded type
            wallet.publicKey as any, // Cast to any (SDK might expect PublicKey or string)
            new VanillaObligation(PROGRAM_ID),
            0 as any,
            true as any
        );

        const instructions = [
            ...kaminoAction.setupIxs,
            ...kaminoAction.lendingIxs,
            ...kaminoAction.cleanupIxs,
        ].map(ix => ix as any as TransactionInstruction); // Double cast to force it

        const tx = new Transaction().add(...instructions);
        const signature = await sendAndConfirmTransaction(connection, tx, [wallet]);
        console.log("✅ Deposit successful:", signature);
        return signature;

    } catch (e) {
        console.error("❌ Kamino deposit failed:", e);
        return null;
    }
}
