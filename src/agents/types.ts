/**
 * Level 5 Agent Types
 */

export type AgentRole = 'cio' | 'research' | 'risk' | 'ops';

export interface AgentConfig {
  role: AgentRole;
  name: string;
  personality: string;
  permissions: Permission[];
}

export type Permission = 
  | 'execute_swap'
  | 'execute_stake'
  | 'execute_lend'
  | 'approve_trade'
  | 'veto_trade'
  | 'emergency_pause'
  | 'process_flows'
  | 'manage_reserve'
  | 'read_only';

export interface Memo {
  id: string;
  timestamp: Date;
  author: AgentRole;
  type: 'analysis' | 'proposal' | 'review' | 'veto' | 'approval' | 'execution' | 'report';
  subject: string;
  body: string;
  conviction?: 'LOW' | 'MEDIUM' | 'HIGH';
  data?: Record<string, unknown>;
}

export interface TradeProposal {
  id: string;
  proposedBy: AgentRole;
  timestamp: Date;
  action: 'swap' | 'stake' | 'lend' | 'withdraw';
  fromAsset: string;
  toAsset: string;
  amount: number;
  rationale: string;
  researchMemoId?: string;
}

export interface RiskReview {
  proposalId: string;
  reviewedBy: AgentRole;
  timestamp: Date;
  decision: 'APPROVED' | 'CONDITIONAL' | 'VETOED';
  checks: RiskCheck[];
  conditions?: string;
  rationale: string;
}

export interface RiskCheck {
  name: string;
  passed: boolean;
  value?: number;
  limit?: number;
  note?: string;
}

export interface Deliberation {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  trigger: string;
  memos: Memo[];
  proposal?: TradeProposal;
  riskReview?: RiskReview;
  execution?: ExecutionResult;
  totalCost: number;
  status: 'in_progress' | 'executed' | 'vetoed' | 'policy_blocked';
}

export interface ExecutionResult {
  success: boolean;
  txSignature?: string;
  error?: string;
  executedAt: Date;
  executedBy: AgentRole;
}

export interface CommitteeState {
  reserve: number;        // USD value of operational reserve
  runway: number;         // Estimated decisions remaining
  avgDecisionCost: number;
  totalDecisions: number;
  totalVetos: number;
  totalPolicyBlocks: number;
  lastDeliberation?: Deliberation;
}

export interface VaultState {
  totalValue: number;
  positions: Position[];
  policies: Policy[];
}

export interface Position {
  asset: string;
  amount: number;
  valueUsd: number;
  allocation: number; // percentage
}

export interface Policy {
  name: string;
  type: 'max_allocation' | 'whitelist' | 'drawdown_limit' | 'timelock';
  value: number | string[];
  enforced: number; // times this policy blocked an action
}
