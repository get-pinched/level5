/**
 * Research Analyst Agent
 * 
 * Personality: Analytical, data-driven, generates hypotheses.
 * Permissions: Read-only vault access
 */

import { BaseAgent } from './base.js';
import { AgentConfig, Memo, Position } from './types.js';

export interface MarketContext {
  positions: Position[];
  prices: Record<string, number>;
  priceChanges: Record<string, number>; // 24h change %
  volume: Record<string, number>;
}

export class ResearchAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: 'research',
      name: 'Research Analyst',
      personality: 'Analytical, data-driven, generates hypotheses. Cannot execute — only propose.',
      permissions: ['read_only'],
    };
    super(config);
  }

  async think(context: MarketContext): Promise<Memo> {
    // Analyze market conditions
    const analysis = this.analyzeMarket(context);
    
    if (analysis.opportunity) {
      return this.createMemo(
        'analysis',
        analysis.subject,
        analysis.body,
        analysis.data,
        analysis.conviction
      );
    }

    return this.createMemo(
      'analysis',
      'Market Observation',
      'No significant opportunities detected. Continuing to monitor.',
      { positions: context.positions }
    );
  }

  private analyzeMarket(context: MarketContext): {
    opportunity: boolean;
    subject: string;
    body: string;
    conviction: Memo['conviction'];
    data: Record<string, unknown>;
  } {
    // Find assets with momentum
    const opportunities: string[] = [];
    
    for (const [asset, change] of Object.entries(context.priceChanges)) {
      if (change > 5) {
        opportunities.push(`${asset} up ${change.toFixed(1)}%`);
      } else if (change < -5) {
        opportunities.push(`${asset} down ${change.toFixed(1)}%`);
      }
    }

    if (opportunities.length > 0) {
      // Find the strongest signal
      const strongest = Object.entries(context.priceChanges)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
      
      const [asset, change] = strongest;
      const direction = change > 0 ? 'bullish' : 'bearish';
      const conviction = Math.abs(change) > 10 ? 'HIGH' : Math.abs(change) > 5 ? 'MEDIUM' : 'LOW';

      return {
        opportunity: true,
        subject: `${asset} Momentum Signal`,
        body: `OBSERVATION: ${asset} showing ${direction} momentum.\n` +
              `- 24h change: ${change > 0 ? '+' : ''}${change.toFixed(2)}%\n` +
              `- Current allocation: ${this.getCurrentAllocation(context.positions, asset).toFixed(1)}%\n\n` +
              `RECOMMENDATION: ${change > 0 ? 'Increase' : 'Decrease'} ${asset} allocation.\n` +
              `CONVICTION: ${conviction}\n\n` +
              `Submitted to CIO for evaluation.`,
        conviction,
        data: {
          asset,
          priceChange: change,
          direction,
          currentAllocation: this.getCurrentAllocation(context.positions, asset),
        },
      };
    }

    return {
      opportunity: false,
      subject: '',
      body: '',
      conviction: 'LOW',
      data: {},
    };
  }

  private getCurrentAllocation(positions: Position[], asset: string): number {
    const position = positions.find(p => p.asset === asset);
    return position?.allocation ?? 0;
  }
}
