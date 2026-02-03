/**
 * Solvency Tracker
 * 
 * Tracks operational reserve, runway, and cost metrics.
 * The committee's survival depends on this.
 */

import { CommitteeState, Deliberation } from '../agents/types.js';

export interface SolvencyMetrics {
  reserve: number;
  runway: number;
  avgCostPerDecision: number;
  burnRateDaily: number;
  daysUntilHibernation: number;
  healthStatus: 'healthy' | 'warning' | 'critical' | 'hibernating';
}

export interface CostBreakdown {
  research: number;
  cio: number;
  risk: number;
  ops: number;
  total: number;
}

export class SolvencyTracker {
  private reserve: number;
  private costHistory: number[] = [];
  private decisionsPerDay = 14; // Target decisions per day
  
  constructor(initialReserve: number) {
    this.reserve = initialReserve;
  }

  /**
   * Record a deliberation cost
   */
  recordCost(cost: number): void {
    this.reserve -= cost;
    this.costHistory.push(cost);
    
    // Keep last 100 decisions for averaging
    if (this.costHistory.length > 100) {
      this.costHistory.shift();
    }
  }

  /**
   * Add yield to reserve (from fund returns)
   */
  addYield(amount: number): void {
    this.reserve += amount;
    console.log(`💰 Reserve topped up: +$${amount.toFixed(2)} → $${this.reserve.toFixed(2)}`);
  }

  /**
   * Get current solvency metrics
   */
  getMetrics(): SolvencyMetrics {
    const avgCost = this.getAverageCost();
    const runway = Math.floor(this.reserve / avgCost);
    const burnRateDaily = avgCost * this.decisionsPerDay;
    const daysUntilHibernation = this.reserve / burnRateDaily;

    return {
      reserve: this.reserve,
      runway,
      avgCostPerDecision: avgCost,
      burnRateDaily,
      daysUntilHibernation,
      healthStatus: this.getHealthStatus(runway),
    };
  }

  /**
   * Get average cost per decision
   */
  private getAverageCost(): number {
    if (this.costHistory.length === 0) return 0.06; // Default estimate
    return this.costHistory.reduce((a, b) => a + b, 0) / this.costHistory.length;
  }

  /**
   * Determine health status based on runway
   */
  private getHealthStatus(runway: number): SolvencyMetrics['healthStatus'] {
    if (runway <= 0) return 'hibernating';
    if (runway < 50) return 'critical';
    if (runway < 200) return 'warning';
    return 'healthy';
  }

  /**
   * Check if committee can afford a deliberation
   */
  canAffordDeliberation(estimatedCost: number = 0.08): boolean {
    return this.reserve >= estimatedCost;
  }

  /**
   * Format solvency status for display
   */
  formatStatus(): string {
    const metrics = this.getMetrics();
    const statusEmoji = {
      healthy: '🟢',
      warning: '🟡',
      critical: '🔴',
      hibernating: '💀',
    };

    return `
╔════════════════════════════════════════════════════════════╗
║                   SOLVENCY STATUS ${statusEmoji[metrics.healthStatus]}                       ║
╠════════════════════════════════════════════════════════════╣
║  Reserve Balance:     $${metrics.reserve.toFixed(2).padStart(8)}                       ║
║  Avg Cost/Decision:   $${metrics.avgCostPerDecision.toFixed(3).padStart(8)}                       ║
║  Runway:              ${metrics.runway.toString().padStart(8)} decisions               ║
║  Daily Burn Rate:     $${metrics.burnRateDaily.toFixed(2).padStart(8)}                       ║
║  Days to Hibernation: ${metrics.daysUntilHibernation.toFixed(1).padStart(8)} days                  ║
╚════════════════════════════════════════════════════════════╝
    `.trim();
  }

  /**
   * Generate efficiency report
   */
  generateEfficiencyReport(deliberations: Deliberation[]): string {
    const recent = deliberations.slice(-20);
    
    const byAgentCount = new Map<number, number[]>();
    for (const d of recent) {
      const count = d.memos.length;
      if (!byAgentCount.has(count)) byAgentCount.set(count, []);
      byAgentCount.get(count)!.push(d.totalCost);
    }

    const lines = ['EFFICIENCY ANALYSIS', '═'.repeat(40)];
    
    for (const [agents, costs] of byAgentCount) {
      const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
      lines.push(`${agents}-agent deliberations: ${costs.length}x, avg $${avgCost.toFixed(3)}`);
    }

    const fullCommittee = recent.filter(d => d.memos.length >= 4).length;
    const minimal = recent.filter(d => d.memos.length <= 2).length;
    
    if (fullCommittee > minimal * 2) {
      lines.push('');
      lines.push('⚠️  High full-committee usage. Consider 2-agent flows for routine decisions.');
    }

    return lines.join('\n');
  }
}
