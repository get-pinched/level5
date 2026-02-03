/**
 * Survival Engine — Core loop for pinch
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { config } from './config';

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
  private wallet: PublicKey;
  private config: SurvivalConfig;
  private state: SurvivalState;
  private running = false;

  constructor(connection: Connection, wallet: PublicKey, survivalConfig: SurvivalConfig) {
    this.connection = connection;
    this.wallet = wallet;
    this.config = survivalConfig;
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
    
    while (this.running && this.state.isAlive) {
      await this.tick();
      await this.sleep(this.config.checkIntervalMs);
    }
    
    if (!this.state.isAlive) {
      console.log('💀 GAME OVER — pinch has died');
      console.log(`📊 Survived ${this.state.daysSurvived.toFixed(2)} days`);
    }
  }

  stop(): void {
    this.running = false;
  }

  private async tick(): Promise<void> {
    // 1. Check balance
    const balance = await this.connection.getBalance(this.wallet);
    this.state.balanceSol = balance / LAMPORTS_PER_SOL;
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
      await this.findAndExecuteOpportunity();
    }
  }

  private async findAndExecuteOpportunity(): Promise<void> {
    const { findBestOpportunity } = await import('./strategies');
    
    const opportunity = await findBestOpportunity(
      this.state.balanceSol,
      config.minProfitThreshold
    );
    
    if (!opportunity) {
      console.log('😐 No profitable opportunities found');
      return;
    }
    
    console.log(`🎯 Found ${opportunity.type} opportunity: +${opportunity.expectedProfit.toFixed(4)} SOL`);
    
    try {
      const txid = await opportunity.execute();
      if (txid) {
        console.log(`✅ Executed: ${txid}`);
      }
    } catch (error) {
      console.error('❌ Execution failed:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getState(): SurvivalState {
    return { ...this.state };
  }
}
