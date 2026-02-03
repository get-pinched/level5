/**
 * Deliberation Logger
 * 
 * Captures and formats committee deliberations for permanent storage.
 * Every memo, proposal, veto, and execution is logged.
 */

import { Deliberation, Memo, TradeProposal, RiskReview, CommitteeState } from '../agents/types.js';

export interface DeliberationRecord {
  id: string;
  timestamp: string;
  duration_ms: number;
  trigger: string;
  status: string;
  cost_usd: number;
  
  // Full memo chain
  memos: MemoRecord[];
  
  // Structured data
  proposal?: ProposalRecord;
  risk_review?: RiskReviewRecord;
  execution?: ExecutionRecord;
  
  // Committee state at time of deliberation
  state_snapshot: StateSnapshot;
}

export interface MemoRecord {
  id: string;
  timestamp: string;
  author: string;
  type: string;
  subject: string;
  body: string;
  conviction?: string;
}

export interface ProposalRecord {
  id: string;
  action: string;
  from_asset: string;
  to_asset: string;
  amount_pct: number;
  rationale: string;
}

export interface RiskReviewRecord {
  decision: string;
  checks: { name: string; passed: boolean; note?: string }[];
  conditions?: string;
  rationale: string;
}

export interface ExecutionRecord {
  success: boolean;
  tx_signature?: string;
  error?: string;
}

export interface StateSnapshot {
  reserve_usd: number;
  runway_decisions: number;
  total_decisions: number;
  total_vetos: number;
}

export class DeliberationLogger {
  private records: DeliberationRecord[] = [];

  /**
   * Convert a Deliberation to a permanent record
   */
  logDeliberation(deliberation: Deliberation, state: CommitteeState): DeliberationRecord {
    const record: DeliberationRecord = {
      id: deliberation.id,
      timestamp: deliberation.startedAt.toISOString(),
      duration_ms: deliberation.endedAt 
        ? deliberation.endedAt.getTime() - deliberation.startedAt.getTime()
        : 0,
      trigger: deliberation.trigger,
      status: deliberation.status,
      cost_usd: deliberation.totalCost,
      
      memos: deliberation.memos.map(this.formatMemo),
      
      state_snapshot: {
        reserve_usd: state.reserve,
        runway_decisions: state.runway,
        total_decisions: state.totalDecisions,
        total_vetos: state.totalVetos,
      },
    };

    if (deliberation.proposal) {
      record.proposal = this.formatProposal(deliberation.proposal);
    }

    if (deliberation.riskReview) {
      record.risk_review = this.formatRiskReview(deliberation.riskReview);
    }

    if (deliberation.execution) {
      record.execution = {
        success: deliberation.execution.success,
        tx_signature: deliberation.execution.txSignature,
        error: deliberation.execution.error,
      };
    }

    this.records.push(record);
    return record;
  }

  private formatMemo(memo: Memo): MemoRecord {
    return {
      id: memo.id,
      timestamp: memo.timestamp.toISOString(),
      author: memo.author,
      type: memo.type,
      subject: memo.subject,
      body: memo.body,
      conviction: memo.conviction,
    };
  }

  private formatProposal(proposal: TradeProposal): ProposalRecord {
    return {
      id: proposal.id,
      action: proposal.action,
      from_asset: proposal.fromAsset,
      to_asset: proposal.toAsset,
      amount_pct: proposal.amount,
      rationale: proposal.rationale,
    };
  }

  private formatRiskReview(review: RiskReview): RiskReviewRecord {
    return {
      decision: review.decision,
      checks: review.checks.map(c => ({
        name: c.name,
        passed: c.passed,
        note: c.note,
      })),
      conditions: review.conditions,
      rationale: review.rationale,
    };
  }

  /**
   * Get all records (for Arweave upload)
   */
  getRecords(): DeliberationRecord[] {
    return [...this.records];
  }

  /**
   * Format for human-readable output
   */
  formatForDisplay(record: DeliberationRecord): string {
    const lines = [
      `╔${'═'.repeat(68)}╗`,
      `║ DELIBERATION ${record.id.padEnd(52)} ║`,
      `╠${'═'.repeat(68)}╣`,
      `║ Time: ${record.timestamp.padEnd(60)} ║`,
      `║ Status: ${record.status.toUpperCase().padEnd(58)} ║`,
      `║ Cost: $${record.cost_usd.toFixed(3).padEnd(59)} ║`,
      `╠${'═'.repeat(68)}╣`,
    ];

    for (const memo of record.memos) {
      lines.push(`║ ${memo.author.toUpperCase()}: ${memo.subject.slice(0, 50).padEnd(50)} ║`);
    }

    if (record.risk_review) {
      lines.push(`╠${'═'.repeat(68)}╣`);
      lines.push(`║ RISK DECISION: ${record.risk_review.decision.padEnd(51)} ║`);
    }

    if (record.execution) {
      lines.push(`╠${'═'.repeat(68)}╣`);
      const execStatus = record.execution.success ? '✅ EXECUTED' : '❌ FAILED';
      lines.push(`║ ${execStatus.padEnd(66)} ║`);
      if (record.execution.tx_signature) {
        lines.push(`║ TX: ${record.execution.tx_signature.slice(0, 61).padEnd(62)} ║`);
      }
    }

    lines.push(`╚${'═'.repeat(68)}╝`);
    return lines.join('\n');
  }

  /**
   * Generate JSON for Arweave storage
   */
  toJSON(): string {
    return JSON.stringify({
      version: '1.0',
      committee: 'Level 5',
      generated_at: new Date().toISOString(),
      deliberation_count: this.records.length,
      records: this.records,
    }, null, 2);
  }
}
