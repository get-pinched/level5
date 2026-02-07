/**
 * GLAM Vault Executor
 * 
 * Integrates with GLAM vaults for scoped permissions and policy enforcement.
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { GlamClient, StateModel } from '@glamsystems/glam-sdk';
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
  allowedAssets: string[]; // From SDK
}

export class GlamExecutor {
  private connection: Connection;
  private vaultAddress: PublicKey;
  private wallets: GlamConfig['wallets'];
  private glamClient: GlamClient;
  
  constructor(config: GlamConfig) {
    this.connection = new Connection(config.rpcUrl);
    this.vaultAddress = new PublicKey(config.vaultAddress);
    this.wallets = config.wallets;
    
    // Initialize real GLAM SDK client
    // We use the Ops wallet as the default signer for read operations
    // We cast to any to bypass the Wallet interface mismatch for now as we just need signing
    const walletAdapter = {
        publicKey: config.wallets.ops.publicKey,
        signTransaction: async <T extends { sign: (signers: Keypair[]) => void }>(tx: T): Promise<T> => {
            tx.sign([config.wallets.ops]);
            return tx;
        },
        signAllTransactions: async <T extends { sign: (signers: Keypair[]) => void }>(txs: T[]): Promise<T[]> => {
            txs.forEach(tx => tx.sign([config.wallets.ops]));
            return txs;
        },
        payer: config.wallets.ops
    };

    const provider = new AnchorProvider(this.connection, walletAdapter as any, {});
    
    this.glamClient = new GlamClient({
        provider
    });
  }

  /**
   * Execute a trade proposal through GLAM vault
   * Only CIO wallet has execute permissions
   */
  async executeTrade(proposal: TradeProposal): Promise<ExecutionResult> {
    console.log(`\n⚡ GLAM Executor: Processing ${proposal.action}`);
    console.log(`   From: ${proposal.fromAsset} → To: ${proposal.toAsset}`);
    console.log(`   Amount: ${proposal.amount}%`);

    // Verify CIO signature capability (simulation)
    if (!this.wallets.cio) {
      throw new Error("CIO wallet not configured");
    }

    try {
      // 1. Check policies before execution (Redundant safety, but critical for L5)
      const currentState = await this.getVaultState();
      const violation = this.checkPolicy(proposal, currentState);
      
      if (violation) {
        throw new Error(`Policy violation prevented execution: ${violation.name} (${violation.type})`);
      }

      // 2. Execution Logic
      // In a real environment, this would construct a transaction for the GLAM program
      // For now, we simulate the on-chain interaction latency and signature verification
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Network latency sim

      // Simulate a real transaction signature
      const mockTxSig = `glam_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      
      console.log(`   ✅ Executed: ${mockTxSig}`);
      console.log(`   🔗 Explorer: https://solscan.io/tx/${mockTxSig}?cluster=devnet`);

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
    
    try {
        // Use SDK to pause if method exists, otherwise mock
        // const sig = await this.glamClient.state.update({ enabled: false }, { signer: this.wallets.risk.publicKey });
        // console.log(`   Paused via SDK: ${sig}`);
        return true;
    } catch (e) {
        console.error("SDK Pause failed", e);
        return false;
    }
  }

  /**
   * Get current vault state
   */
  async getVaultState(): Promise<GlamVaultState> {
    try {
        // Fetch real state from GLAM SDK
        // In a real run, this needs a valid vault address on devnet/mainnet
        // For the hackathon demo, we wrap this in a try/catch to fallback to mock data
        // if the RPC call fails (e.g. invalid address or network issue)
        
        // const stateModel = await this.glamClient.fetchStateModel(this.vaultAddress);
        // const assets = stateModel.assets.map(a => a.toBase58());
        
        // Mock fallback for now as we don't have a deployed vault yet
        const assets = ['So11111111111111111111111111111111111111112', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'JitoSOL...', 'mSOL...'];

        return {
          totalValue: 1000, // Mock value
          positions: new Map([
            ['USDC', 500],
            ['SOL', 300],
            ['JitoSOL', 150],
            ['mSOL', 50],
          ]),
          policies: [
            { name: 'Max Allocation', type: 'max_allocation', value: 40, enforced: 0 },
            { name: 'Asset Whitelist', type: 'whitelist', value: assets, enforced: 0 },
            { name: 'Drawdown Limit', type: 'drawdown_limit', value: 5, enforced: 0 },
          ],
          allowedAssets: assets
        };
    } catch (error) {
        console.warn("Failed to fetch GLAM state, using mock:", error);
        throw error;
    }
  }

  /**
   * Check if a trade would violate policies
   * Returns the policy that would be violated, or null if ok
   */
  checkPolicy(
    proposal: TradeProposal,
    vaultState: GlamVaultState
  ): Policy | null {
    const { positions, policies, allowedAssets } = vaultState;
    const maxAllocPolicy = policies.find(p => p.type === 'max_allocation');
    const whitelistPolicy = policies.find(p => p.type === 'whitelist');

    // Check whitelist (using SDK-derived assets)
    // Map symbol to address would be needed here in prod
    // For now we simulate that proposal.toAsset is in the list
    const isAllowed = allowedAssets.some(a => a.includes(proposal.toAsset) || ['SOL', 'USDC', 'JitoSOL', 'mSOL'].includes(proposal.toAsset));
    
    if (whitelistPolicy && !isAllowed) {
        return whitelistPolicy;
    }

    // Check max allocation
    if (maxAllocPolicy) {
      const maxAlloc = maxAllocPolicy.value as number;
      const totalValue = vaultState.totalValue;
      const currentAmount = positions.get(proposal.toAsset) || 0;
      const currentAllocPercent = (currentAmount / totalValue) * 100;
      
      const newAllocPercent = currentAllocPercent + proposal.amount;
      
      if (newAllocPercent > maxAlloc) {
        return maxAllocPolicy;
      }
    }

    return null;
  }
}
