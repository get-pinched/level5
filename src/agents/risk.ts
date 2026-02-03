/**
 * Risk Manager Agent
 * 
 * Personality: Conservative, protective, has veto authority.
 * Permissions: Approve/veto trades, emergency pause
 */

import { BaseAgent } from './base.js';
import { AgentConfig, Memo, TradeProposal, RiskReview, RiskCheck, Position, Policy } from './types.js';

export interface RiskContext {
  proposal: TradeProposal;
  positions: Position[];
  policies: Policy[];
  recentDrawdown: number; // % drawdown in current period
}

export class RiskAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: 'risk',
      name: 'Risk Manager',
      personality: 'Conservative, protective, has veto authority.',
      permissions: ['approve_trade', 'veto_trade', 'emergency_pause'],
    };
    super(config);
  }

  async think(context: RiskContext): Promise<Memo> {
    const review = this.reviewProposal(context);
    
    return this.createMemo(
      review.decision === 'VETOED' ? 'veto' : 'approval',
      `Risk Review: ${context.proposal.id}`,
      this.formatReview(review, context.proposal),
      { review }
    );
  }

  reviewProposal(context: RiskContext): RiskReview {
    const checks: RiskCheck[] = [];
    let decision: RiskReview['decision'] = 'APPROVED';
    let conditions: string | undefined;

    // Check 1: Concentration limit
    const targetAsset = context.proposal.toAsset;
    const currentPosition = context.positions.find(p => p.asset === targetAsset);
    const currentAllocation = currentPosition?.allocation ?? 0;
    const newAllocation = currentAllocation + context.proposal.amount;
    const maxAllocation = this.getPolicyValue(context.policies, 'max_allocation') as number || 40;

    checks.push({
      name: 'Concentration Limit',
      passed: newAllocation <= maxAllocation,
      value: newAllocation,
      limit: maxAllocation,
      note: newAllocation > maxAllocation ? 'EXCEEDS LIMIT' : newAllocation === maxAllocation ? 'AT CEILING' : 'OK',
    });

    if (newAllocation > maxAllocation) {
      decision = 'CONDITIONAL';
      conditions = `Reduce target to ${maxAllocation}% (policy ceiling)`;
    }

    // Check 2: Drawdown headroom
    const drawdownLimit = this.getPolicyValue(context.policies, 'drawdown_limit') as number || 5;
    const drawdownHeadroom = drawdownLimit - context.recentDrawdown;

    checks.push({
      name: 'Drawdown Headroom',
      passed: drawdownHeadroom > 1,
      value: drawdownHeadroom,
      limit: drawdownLimit,
      note: drawdownHeadroom <= 1 ? 'MINIMAL BUFFER' : 'OK',
    });

    if (drawdownHeadroom <= 0) {
      decision = 'VETOED';
    }

    // Check 3: Asset whitelist
    const whitelist = this.getPolicyValue(context.policies, 'whitelist') as string[] || ['SOL', 'USDC'];
    const isWhitelisted = whitelist.includes(targetAsset);

    checks.push({
      name: 'Asset Whitelist',
      passed: isWhitelisted,
      note: isWhitelisted ? 'OK' : 'ASSET NOT WHITELISTED',
    });

    if (!isWhitelisted) {
      decision = 'VETOED';
    }

    // Check 4: Trade size reasonableness
    const isReasonableSize = context.proposal.amount <= 15; // Max 15% change per trade

    checks.push({
      name: 'Trade Size',
      passed: isReasonableSize,
      value: context.proposal.amount,
      limit: 15,
      note: isReasonableSize ? 'OK' : 'EXCESSIVE SIZE',
    });

    if (!isReasonableSize && decision !== 'VETOED') {
      decision = 'CONDITIONAL';
      conditions = conditions 
        ? `${conditions}; Reduce trade size to max 15%`
        : 'Reduce trade size to max 15%';
    }

    return {
      proposalId: context.proposal.id,
      reviewedBy: this.role,
      timestamp: new Date(),
      decision,
      checks,
      conditions,
      rationale: this.generateRationale(checks, decision),
    };
  }

  private formatReview(review: RiskReview, proposal: TradeProposal): string {
    const lines = [
      `Evaluating CIO proposal: ${proposal.fromAsset} → ${proposal.toAsset}`,
      '',
      'CHECKS:',
    ];

    for (const check of review.checks) {
      const status = check.passed ? '✓' : '✗';
      const detail = check.value !== undefined 
        ? `${check.value.toFixed(1)}${check.limit ? `/${check.limit}` : ''}`
        : '';
      lines.push(`${status} ${check.name}: ${detail} ${check.note || ''}`);
    }

    lines.push('');
    lines.push(`DECISION: ${review.decision}`);
    
    if (review.conditions) {
      lines.push(`CONDITIONS: ${review.conditions}`);
    }
    
    lines.push('');
    lines.push(`RATIONALE: ${review.rationale}`);

    return lines.join('\n');
  }

  private generateRationale(checks: RiskCheck[], decision: RiskReview['decision']): string {
    const failed = checks.filter(c => !c.passed);
    
    if (decision === 'VETOED') {
      return `Trade blocked due to: ${failed.map(c => c.name).join(', ')}.`;
    }
    
    if (decision === 'CONDITIONAL') {
      return `Trade approved with modifications to satisfy: ${failed.map(c => c.name).join(', ')}.`;
    }
    
    return 'All risk checks passed. Trade approved.';
  }

  private getPolicyValue(policies: Policy[], type: Policy['type']): number | string[] | undefined {
    const policy = policies.find(p => p.type === type);
    return policy?.value;
  }
}
