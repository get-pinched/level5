/**
 * Committee Orchestrator
 * 
 * Coordinates deliberation between the four agents.
 */

import { ResearchAgent, MarketContext } from './research.js';
import { CIOAgent, CIOContext } from './cio.js';
import { RiskAgent, RiskContext } from './risk.js';
import { OpsAgent, OpsContext } from './ops.js';
import { GlamExecutor } from '../execution/glam-executor.js';
import { Keypair } from '@solana/web3.js';

const INFERENCE_COST_PER_AGENT = 0.02; // $0.02 per agent call

export class Committee {
  private research: ResearchAgent;
  private cio: CIOAgent;
  private risk: RiskAgent;
  private ops: OpsAgent;
  private executor: GlamExecutor;
  
  private state: CommitteeState;
  private deliberations: Deliberation[] = [];
  private deliberationCount = 0;

  constructor(initialReserve: number = 50) {
    this.research = new ResearchAgent();
    this.cio = new CIOAgent();
    this.risk = new RiskAgent();
    this.ops = new OpsAgent();
    
    // Initialize GlamExecutor with dummy config for now (simulation mode)
    this.executor = new GlamExecutor({
      rpcUrl: process.env.RPC_URL || 'https://api.devnet.solana.com',
      // Using a dummy base58 address for initialization if env var is missing
      vaultAddress: process.env.GLAM_VAULT_ADDRESS || '11111111111111111111111111111111', 
      wallets: {
        cio: Keypair.generate(),
        research: Keypair.generate(),
        risk: Keypair.generate(),
        ops: Keypair.generate(),
      }
    });

    this.state = {
      reserve: initialReserve,
      runway: Math.floor(initialReserve / 0.06), // ~$0.06 per deliberation
      avgDecisionCost: 0.06,
      totalDecisions: 0,
      totalVetos: 0,
      totalPolicyBlocks: 0,
    };
  }

  async deliberate(
    marketContext: MarketContext,
    positions: Position[],
    policies: Policy[]
  ): Promise<Deliberation> {
    this.deliberationCount++;
    const deliberation: Deliberation = {
      id: `DELIB-${Date.now()}-${this.deliberationCount}`,
      startedAt: new Date(),
      trigger: 'market_observation',
      memos: [],
      totalCost: 0,
      status: 'in_progress',
    };

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`DELIBERATION #${this.deliberationCount} | ${new Date().toISOString()}`);
    console.log('═'.repeat(60));

    // Step 1: Research observes
    console.log('\n📊 RESEARCH ANALYST observing market...');
    const researchMemo = await this.research.think(marketContext);
    deliberation.memos.push(researchMemo);
    deliberation.totalCost += INFERENCE_COST_PER_AGENT;
    this.logMemo(researchMemo);

    // If no opportunity, short-circuit
    if (researchMemo.type === 'analysis' && !researchMemo.data?.asset) {
      console.log('\n💤 No opportunities detected. Deliberation complete.');
      deliberation.status = 'executed';
      deliberation.endedAt = new Date();
      await this.recordDeliberation(deliberation);
      return deliberation;
    }

    // Step 2: CIO evaluates
    console.log('\n💼 CIO evaluating research...');
    const cioContext: CIOContext = {
      positions,
      researchMemo,
      reserve: this.state.reserve,
    };
    const cioMemo = await this.cio.think(cioContext);
    deliberation.memos.push(cioMemo);
    deliberation.totalCost += INFERENCE_COST_PER_AGENT;
    this.logMemo(cioMemo);

    // If CIO doesn't propose, end
    if (cioMemo.type !== 'proposal') {
      deliberation.status = 'executed';
      deliberation.endedAt = new Date();
      await this.recordDeliberation(deliberation);
      return deliberation;
    }

    // Create formal proposal
    const proposalData = cioMemo.data as { 
      asset: string; 
      currentAllocation: number; 
      targetAllocation: number;
      researchMemoId: string;
    };
    const proposal: TradeProposal = this.cio.createProposal(
      proposalData.asset,
      proposalData.currentAllocation,
      proposalData.targetAllocation,
      cioMemo.body,
      proposalData.researchMemoId
    );
    deliberation.proposal = proposal;

    // Step 3: Risk validates
    console.log('\n🛡️  RISK MANAGER validating...');
    const riskContext: RiskContext = {
      proposal,
      positions,
      policies,
      recentDrawdown: 2.1, // Mock: 2.1% drawdown this period
    };
    const riskMemo = await this.risk.think(riskContext);
    deliberation.memos.push(riskMemo);
    deliberation.totalCost += INFERENCE_COST_PER_AGENT;
    this.logMemo(riskMemo);

    const riskReview = (riskMemo.data as { review: any }).review;
    deliberation.riskReview = riskReview;

    // Handle veto
    if (riskReview.decision === 'VETOED') {
      console.log('\n❌ RISK VETO — Trade blocked');
      deliberation.status = 'vetoed';
      deliberation.endedAt = new Date();
      await this.recordDeliberation(deliberation);
      return deliberation;
    }

    // Step 4: CIO executes (or acknowledges conditions)
    console.log('\n⚡ CIO responding to risk review...');
    const executionContext: CIOContext = {
      positions,
      riskReview,
      reserve: this.state.reserve,
    };
    const executionMemo = await this.cio.think(executionContext);
    deliberation.memos.push(executionMemo);
    deliberation.totalCost += INFERENCE_COST_PER_AGENT;
    this.logMemo(executionMemo);

    // Mock execution replaced with GlamExecutor
    try {
      const executionResult = await this.executor.executeTrade(proposal);
      deliberation.execution = executionResult;
      deliberation.status = executionResult.success ? 'executed' : 'failed';
    } catch (e) {
      console.error("Execution error:", e);
      deliberation.status = 'failed';
    }

    // Step 5: Ops logs
    console.log('\n📋 OPS logging deliberation...');
    const opsContext: OpsContext = {
      deliberation,
      state: this.state,
      inferenceCogsUsd: deliberation.totalCost,
    };
    const opsMemo = await this.ops.think(opsContext);
    deliberation.memos.push(opsMemo);
    // Ops cost included in deliberation
    this.logMemo(opsMemo);

    deliberation.endedAt = new Date();
    await this.recordDeliberation(deliberation);

    return deliberation;
  }

  private async recordDeliberation(deliberation: Deliberation): Promise<void> {
    this.deliberations.push(deliberation);
    
    // Update state
    this.state.reserve -= deliberation.totalCost;
    this.state.totalDecisions++;
    this.state.avgDecisionCost = 
      this.state.avgDecisionCost * 0.9 + deliberation.totalCost * 0.1;
    this.state.runway = Math.floor(this.state.reserve / this.state.avgDecisionCost);
    
    if (deliberation.status === 'vetoed') {
      this.state.totalVetos++;
    }
    if (deliberation.status === 'policy_blocked') {
      this.state.totalPolicyBlocks++;
    }
    
    this.state.lastDeliberation = deliberation;
  }

  private logMemo(memo: Memo): void {
    console.log(`\n${memo.author.toUpperCase()} | ${memo.subject}`);
    console.log('─'.repeat(50));
    console.log(memo.body);
  }

  getState(): CommitteeState {
    return { ...this.state };
  }

  getDeliberations(): Deliberation[] {
    return [...this.deliberations];
  }

  printStatus(): void {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                    LEVEL 5 STATUS                          ║
╠════════════════════════════════════════════════════════════╣
║  Autonomy Level: 5 (Economic)                              ║
║  Committee: 4 agents active                                ║
╠════════════════════════════════════════════════════════════╣
║  Operational Reserve: $${this.state.reserve.toFixed(2).padStart(6)}                          ║
║  Average Decision Cost: $${this.state.avgDecisionCost.toFixed(3).padStart(5)}                        ║
║  Runway: ${this.state.runway.toString().padStart(4)} decisions                            ║
╠════════════════════════════════════════════════════════════╣
║  Total Decisions: ${this.state.totalDecisions.toString().padStart(4)}                                ║
║  Total Vetos: ${this.state.totalVetos.toString().padStart(4)}                                     ║
║  Policy Blocks: ${this.state.totalPolicyBlocks.toString().padStart(4)}                                  ║
╚════════════════════════════════════════════════════════════╝
    `);
  }
}
