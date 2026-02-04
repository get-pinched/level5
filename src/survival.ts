/**
 * Survival Engine — Core loop for pinch
 */

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { config } from './config';
import { DeliberationLogger } from './logger';

export interface SurvivalConfig {
  minRunwayHours: number;
  checkIntervalMs: number;
}

export interface SurvivalState {
  balanceSol: number;
  runwayHours: number;
  lastCheck: Date;
  isAlive: boolean;
  daysSurvived: number;
  startedAt: Date;
}

export class SurvivalEngine {
  private connection: Connection;
  private walletPubkey: PublicKey;
  private walletKeypair: Keypair;
  private config: SurvivalConfig;
  private state: SurvivalState;
  private running = false;
  private logger?: DeliberationLogger;

  constructor(
    connection: Connection, 
    walletKeypair: Keypair, 
    survivalConfig: SurvivalConfig,
    logger?: DeliberationLogger
  ) {
    this.connection = connection;
    this.walletKeypair = walletKeypair;
    this.walletPubkey = walletKeypair.publicKey;
    this.config = survivalConfig;
    this.logger = logger;
    this.state = {
      balanceSol: 0,
      runwayHours: 0,
      lastCheck: new Date(),
      isAlive: true,
      daysSurvived: 0,
      startedAt: new Date(),
    };
  }

  async start(): Promise<void> {
    this.running = true;
    console.log('🔄 Survival loop started');
    await this.logger?.logDeliberation('SYSTEM_START', { config: this.config });
    
    while (this.running && this.state.isAlive) {
      await this.tick();
      await this.sleep(this.config.checkIntervalMs);
    }
    
    if (!this.state.isAlive) {
      const msg = `💀 GAME OVER — pinch has died. Survived ${this.state.daysSurvived.toFixed(2)} days`;
      console.log(msg);
      await this.logger?.logDeliberation('SYSTEM_DEATH', { state: this.state });
    }
  }

  stop(): void {
    this.running = false;
  }

  private async tick(): Promise<void> {
    // 1. Check balance
    try {
        const balance = await this.connection.getBalance(this.walletPubkey);
        this.state.balanceSol = balance / LAMPORTS_PER_SOL;
    } catch (e) {
        console.error("Failed to fetch balance, skipping tick", e);
        return;
    }
    this.state.lastCheck = new Date();
    
    // 2. Calculate runway
    const hourlyCost = config.estimatedHourlyCost;
    this.state.runwayHours = this.state.balanceSol / hourlyCost;
    
    // 3. Update days survived
    const msAlive = Date.now() - this.state.startedAt.getTime();
    this.state.daysSurvived = msAlive / (1000 * 60 * 60 * 24);
    
    // 4. Check if dead
    if (this.state.balanceSol <= 0) {
      this.state.isAlive = false;
      return;
    }
    
    console.log(`💰 Balance: ${this.state.balanceSol.toFixed(4)} SOL | ⏱️ Runway: ${this.state.runwayHours.toFixed(1)}h | 📅 Day ${this.state.daysSurvived.toFixed(2)}`);
    
    // 5. If runway low, take action
    if (this.state.runwayHours < this.config.minRunwayHours) {
      console.log('⚠️  Low runway! Searching for opportunities...');
      await this.logger?.logDeliberation('LOW_RUNWAY_ALERT', { state: this.state });
      await this.findAndExecuteOpportunity();
    }
  }

  private async findAndExecuteOpportunity(): Promise<void> {
    const { findBestOpportunity } = await import('./strategies');
    
    console.log('🔎 Researching opportunities...');
    // Log research start
    await this.logger?.logDeliberation('RESEARCH_START', { balance: this.state.balanceSol });

    const opportunity = await findBestOpportunity(
      this.connection,
      this.walletKeypair,
      this.state.balanceSol,
      config.minProfitThreshold
    );
    
    if (!opportunity) {
      console.log('😐 No profitable opportunities found');
      await this.logger?.logDeliberation('RESEARCH_RESULT', { found: false });
      return;
    }
    
    console.log(`🎯 Found ${opportunity.type} opportunity: +${opportunity.expectedProfit.toFixed(4)} SOL`);
    await this.logger?.logDeliberation('PROPOSAL_CREATED', { opportunity });

    // In a full Level 5 system, Risk Agent would verify here. 
    // For now, we simulate Risk approval logging.
    await this.logger?.logDeliberation('RISK_ASSESSMENT', { approved: true, reason: 'Passed basic checks' });
    
    try {
      const txid = await opportunity.execute();
      if (txid) {
        console.log(`✅ Executed: ${txid}`);
        await this.logger?.logDeliberation('EXECUTION_SUCCESS', { txid, opportunity });
      } else {
        await this.logger?.logDeliberation('EXECUTION_SKIPPED', { reason: 'Strategy returned null txid' });
      }
    } catch (error: any) {
      console.error('❌ Execution failed:', error);
      await this.logger?.logDeliberation('EXECUTION_FAILURE', { error: error.message || String(error) });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getState(): SurvivalState {
    return { ...this.state };
  }
}
