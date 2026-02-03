/**
 * Chief Investment Officer Agent
 * 
 * Personality: Decisive, thesis-driven, accountable for returns.
 * Permissions: Execute swaps/stakes/lends, propose policy amendments
 */

import { BaseAgent } from './base.js';
import { AgentConfig, Memo, TradeProposal, RiskReview, Position } from './types.js';

export interface CIOContext {
  positions: Position[];
  researchMemo?: Memo;
  riskReview?: RiskReview;
  reserve: number;
}

export class CIOAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: 'cio',
      name: 'Chief Investment Officer',
      personality: 'Decisive, thesis-driven, accountable for returns.',
      permissions: ['execute_swap', 'execute_stake', 'execute_lend'],
    };
    super(config);
  }

  async think(context: CIOContext): Promise<Memo> {
    // If we have a research memo, evaluate it
    if (context.researchMemo && context.researchMemo.type === 'analysis') {
      return this.evaluateResearch(context);
    }

    // If we have a risk review, respond to it
    if (context.riskReview) {
      return this.respondToRiskReview(context);
    }

    // Default: report on current strategy
    return this.createMemo(
      'report',
      'Strategy Status',
      this.generateStrategyStatus(context.positions),
      { positions: context.positions }
    );
  }

  private evaluateResearch(context: CIOContext): Memo {
    const research = context.researchMemo!;
    const data = research.data as { asset: string; direction: string; currentAllocation: number };
    
    if (!data?.asset) {
      return this.createMemo(
        'report',
        'Research Review',
        'Research memo lacks actionable data. No action taken.',
        {}
      );
    }

    const targetAllocation = this.calculateTargetAllocation(
      data.currentAllocation,
      data.direction,
      research.conviction || 'LOW'
    );

    return this.createMemo(
      'proposal',
      `Allocation Change: ${data.asset}`,
      `Evaluating Research memo on ${data.asset}.\n\n` +
      `THESIS: ${data.direction === 'bullish' ? 'Momentum favors exposure' : 'Risk-off positioning warranted'}.\n\n` +
      `PROPOSAL: ${data.asset} ${data.currentAllocation.toFixed(1)}% → ${targetAllocation.toFixed(1)}%\n\n` +
      `Submitting to Risk for validation.`,
      {
        asset: data.asset,
        currentAllocation: data.currentAllocation,
        targetAllocation,
        researchMemoId: research.id,
      }
    );
  }

  private respondToRiskReview(context: CIOContext): Memo {
    const review = context.riskReview!;

    if (review.decision === 'VETOED') {
      return this.createMemo(
        'report',
        'Risk Veto Acknowledged',
        `Risk Manager vetoed proposal ${review.proposalId}.\n\n` +
        `RATIONALE: ${review.rationale}\n\n` +
        `Action: Standing down. Will reassess conditions.`,
        { vetoedProposalId: review.proposalId }
      );
    }

    if (review.decision === 'CONDITIONAL') {
      return this.createMemo(
        'execution',
        'Conditional Execution',
        `Risk Manager conditionally approved with modifications.\n\n` +
        `CONDITIONS: ${review.conditions}\n\n` +
        `Action: Executing with adjusted parameters.`,
        { proposalId: review.proposalId, conditions: review.conditions }
      );
    }

    return this.createMemo(
      'execution',
      'Trade Execution',
      `Risk Manager approved proposal ${review.proposalId}.\n\n` +
      `Action: Executing trade.`,
      { proposalId: review.proposalId }
    );
  }

  private calculateTargetAllocation(
    current: number,
    direction: string,
    conviction: Memo['conviction']
  ): number {
    const adjustments = {
      LOW: 5,
      MEDIUM: 8,
      HIGH: 12,
    };
    const adjustment = adjustments[conviction || 'LOW'];
    
    if (direction === 'bullish') {
      return Math.min(40, current + adjustment); // Cap at 40% policy limit
    } else {
      return Math.max(0, current - adjustment);
    }
  }

  private generateStrategyStatus(positions: Position[]): string {
    const lines = ['Current allocations:'];
    for (const pos of positions) {
      lines.push(`- ${pos.asset}: ${pos.allocation.toFixed(1)}% ($${pos.valueUsd.toFixed(2)})`);
    }
    return lines.join('\n');
  }

  createProposal(
    asset: string,
    currentAllocation: number,
    targetAllocation: number,
    rationale: string,
    researchMemoId?: string
  ): TradeProposal {
    return {
      id: `PROP-${Date.now()}`,
      proposedBy: this.role,
      timestamp: new Date(),
      action: 'swap',
      fromAsset: targetAllocation > currentAllocation ? 'USDC' : asset,
      toAsset: targetAllocation > currentAllocation ? asset : 'USDC',
      amount: Math.abs(targetAllocation - currentAllocation),
      rationale,
      researchMemoId,
    };
  }
}
