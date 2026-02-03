/**
 * Operations Manager Agent
 * 
 * Personality: Methodical, precise, resource-conscious.
 * Permissions: Process flows, manage reserve
 */

import { BaseAgent } from './base.js';
import { AgentConfig, Memo, Deliberation, CommitteeState } from './types.js';

export interface OpsContext {
  deliberation: Deliberation;
  state: CommitteeState;
  inferenceCogsUsd: number; // Cost of this deliberation
}

export class OpsAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: 'ops',
      name: 'Operations Manager',
      personality: 'Methodical, precise, resource-conscious.',
      permissions: ['process_flows', 'manage_reserve'],
    };
    super(config);
  }

  async think(context: OpsContext): Promise<Memo> {
    // Log the deliberation cost and update state
    const updatedState = this.updateState(context);
    
    return this.createMemo(
      'report',
      `Ops Report: Deliberation #${context.state.totalDecisions + 1}`,
      this.formatReport(context, updatedState),
      { 
        deliberationId: context.deliberation.id,
        cost: context.inferenceCogsUsd,
        newRunway: updatedState.runway,
      }
    );
  }

  private updateState(context: OpsContext): CommitteeState {
    const newReserve = context.state.reserve - context.inferenceCogsUsd;
    const newTotalDecisions = context.state.totalDecisions + 1;
    
    // Recalculate average cost with exponential moving average
    const alpha = 0.1;
    const newAvgCost = context.state.avgDecisionCost * (1 - alpha) + context.inferenceCogsUsd * alpha;
    
    // Calculate new runway
    const newRunway = Math.floor(newReserve / newAvgCost);

    return {
      ...context.state,
      reserve: newReserve,
      runway: newRunway,
      avgDecisionCost: newAvgCost,
      totalDecisions: newTotalDecisions,
      totalVetos: context.state.totalVetos + (context.deliberation.status === 'vetoed' ? 1 : 0),
      totalPolicyBlocks: context.state.totalPolicyBlocks + (context.deliberation.status === 'policy_blocked' ? 1 : 0),
      lastDeliberation: context.deliberation,
    };
  }

  private formatReport(context: OpsContext, newState: CommitteeState): string {
    const lines = [
      'DELIBERATION SUMMARY',
      '─'.repeat(40),
      `Decision #${newState.totalDecisions}`,
      `Status: ${context.deliberation.status.toUpperCase()}`,
      `Cost: $${context.inferenceCogsUsd.toFixed(3)}`,
      '',
      'SOLVENCY STATUS',
      '─'.repeat(40),
      `Reserve Balance: $${newState.reserve.toFixed(2)}`,
      `Avg Decision Cost: $${newState.avgDecisionCost.toFixed(3)}`,
      `Runway: ${newState.runway} decisions`,
      '',
    ];

    // Add efficiency note if applicable
    const agentCount = context.deliberation.memos.length;
    if (agentCount === 4 && context.deliberation.status === 'executed') {
      lines.push('EFFICIENCY NOTE:');
      lines.push('Full committee used. Consider 2-agent flow for routine rebalances.');
    }

    // Warning if runway is low
    if (newState.runway < 100) {
      lines.push('');
      lines.push('⚠️  WARNING: Runway below 100 decisions');
      lines.push('   Committee must generate returns or face hibernation.');
    }

    return lines.join('\n');
  }

  generateDailyReport(state: CommitteeState, decisions: Deliberation[]): Memo {
    const todayDecisions = decisions.filter(d => 
      d.startedAt.toDateString() === new Date().toDateString()
    );

    const totalCost = todayDecisions.reduce((sum, d) => sum + d.totalCost, 0);
    const executed = todayDecisions.filter(d => d.status === 'executed').length;
    const vetoed = todayDecisions.filter(d => d.status === 'vetoed').length;

    const body = [
      'DAILY SUMMARY',
      '═'.repeat(40),
      `Decisions today: ${todayDecisions.length}`,
      `  - Executed: ${executed}`,
      `  - Vetoed: ${vetoed}`,
      `Total inference cost: $${totalCost.toFixed(2)}`,
      `Average cost/decision: $${(totalCost / todayDecisions.length || 0).toFixed(3)}`,
      '',
      'RESERVE STATUS',
      '─'.repeat(40),
      `Balance: $${state.reserve.toFixed(2)}`,
      `Burn rate (7d avg): $${(state.avgDecisionCost * 14).toFixed(2)}/day`, // ~14 decisions/day
      `Runway: ${state.runway} decisions`,
      '',
      `Lifetime stats: ${state.totalDecisions} decisions, ${state.totalVetos} vetos, ${state.totalPolicyBlocks} policy blocks`,
    ].join('\n');

    return this.createMemo('report', 'Daily Operations Report', body, {
      todayDecisions: todayDecisions.length,
      totalCost,
      runway: state.runway,
    });
  }
}
