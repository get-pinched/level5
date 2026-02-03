/**
 * GLAM Vault Executor
 * 
 * Integrates with GLAM vaults for scoped permissions and policy enforcement.
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { TradeProposal, ExecutionResult, Policy } from '../agents/types.js';

export interface GlamConfig {
  vaultAddress: string;
  rpcUrl: string;
  // Agent wallets with scoped permissions
  wallets: {
    cio: Keypair;
    research: Keypair;
    risk: Keypair;
    ops: Keypair;
  };
}

export interface GlamVaultState {
  totalValue: number;
  positions: Map<string, number>;
  policies: Policy[];
}

export class GlamExecutor {
  private connection: Connection;
  private vaultAddress: PublicKey;
  private wallets: GlamConfig['wallets'];
  
  constructor(config: GlamConfig) {
    this.connection = new Connection(config.rpcUrl);
    this.vaultAddress = new PublicKey(config.vaultAddress);
    this.wallets = config.wallets;
  }

  /**
   * Execute a trade proposal through GLAM vault
   * Only CIO wallet has execute permissions
   */
  async executeTrade(proposal: TradeProposal): Promise<ExecutionResult> {
    console.log(`\n⚡ GLAM Executor: Processing ${proposal.action}`);
    console.log(`   From: ${proposal.fromAsset} → To: ${proposal.toAsset}`);
    console.log(`   Amount: ${proposal.amount}%`);

    try {
      // In production: Use GLAM SDK to execute
      // const glamClient = new GlamClient(this.connection, this.wallets.cio);
      // const tx = await glamClient.swap({
      //   vault: this.vaultAddress,
      //   inputMint: getMint(proposal.fromAsset),
      //   outputMint: getMint(proposal.toAsset),
      //   amount: calculateAmount(proposal.amount),
      // });

      // Mock execution for demo
      const mockTxSig = `glam_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      
      console.log(`   ✅ Executed: ${mockTxSig}`);

      return {
        success: true,
        txSignature: mockTxSig,
        executedAt: new Date(),
        executedBy: 'cio',
      };
    } catch (error) {
      console.log(`   ❌ Execution failed: ${error}`);
      return {
        success: false,
        error: String(error),
        executedAt: new Date(),
        executedBy: 'cio',
      };
    }
  }

  /**
   * Emergency pause - only Risk wallet can execute
   */
  async emergencyPause(): Promise<boolean> {
    console.log('\n🚨 GLAM Executor: EMERGENCY PAUSE triggered by Risk Manager');
    
    // In production: Use GLAM SDK to pause vault
    // const glamClient = new GlamClient(this.connection, this.wallets.risk);
    // await glamClient.pause(this.vaultAddress);
    
    return true;
  }

  /**
   * Get current vault state
   */
  async getVaultState(): Promise<GlamVaultState> {
    // In production: Fetch from GLAM SDK
    // const glamClient = new GlamClient(this.connection);
    // const vault = await glamClient.getVault(this.vaultAddress);
    
    // Mock state for demo
    return {
      totalValue: 1000,
      positions: new Map([
        ['USDC', 500],
        ['SOL', 300],
        ['JitoSOL', 150],
        ['mSOL', 50],
      ]),
      policies: [
        { name: 'Max Allocation', type: 'max_allocation', value: 40, enforced: 0 },
        { name: 'Asset Whitelist', type: 'whitelist', value: ['SOL', 'USDC', 'JitoSOL', 'mSOL'], enforced: 0 },
        { name: 'Drawdown Limit', type: 'drawdown_limit', value: 5, enforced: 0 },
      ],
    };
  }

  /**
   * Check if a trade would violate policies
   * Returns the policy that would be violated, or null if ok
   */
  checkPolicy(
    proposal: TradeProposal,
    currentPositions: Map<string, number>,
    policies: Policy[]
  ): Policy | null {
    const maxAllocPolicy = policies.find(p => p.type === 'max_allocation');
    const whitelistPolicy = policies.find(p => p.type === 'whitelist');

    // Check whitelist
    if (whitelistPolicy) {
      const whitelist = whitelistPolicy.value as string[];
      if (!whitelist.includes(proposal.toAsset)) {
        return whitelistPolicy;
      }
    }

    // Check max allocation
    if (maxAllocPolicy) {
      const maxAlloc = maxAllocPolicy.value as number;
      const currentAlloc = currentPositions.get(proposal.toAsset) || 0;
      const newAlloc = currentAlloc + proposal.amount;
      if (newAlloc > maxAlloc) {
        return maxAllocPolicy;
      }
    }

    return null;
  }
}
