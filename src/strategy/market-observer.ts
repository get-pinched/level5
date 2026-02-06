/**
 * Market Observer
 * 
 * Monitors market conditions and feeds data to Research agent.
 * Uses Pyth for prices, Helius for on-chain data.
 */

import { MarketContext, Position } from '../agents/index.js';

// Token addresses (mainnet)
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  JitoSOL: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
  mSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
};

// Pyth price feed IDs
const PYTH_FEEDS = {
  SOL: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  USDC: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
};

export interface PriceData {
  price: number;
  confidence: number;
  timestamp: Date;
  change24h?: number;
}

export class MarketObserver {
  private priceCache: Map<string, PriceData> = new Map();
  private lastUpdate: Date = new Date(0);
  private updateInterval = 60000; // 1 minute

  /**
   * Get current market context for Research agent
   */
  async getMarketContext(positions: Position[]): Promise<MarketContext> {
    await this.updatePricesIfStale();

    const prices: Record<string, number> = {};
    const priceChanges: Record<string, number> = {};
    const volume: Record<string, number> = {};

    for (const [symbol, data] of this.priceCache) {
      prices[symbol] = data.price;
      priceChanges[symbol] = data.change24h ?? 0;
    }

    return {
      positions,
      prices,
      priceChanges,
      volume,
    };
  }

  /**
   * Update prices if cache is stale
   */
  private async updatePricesIfStale(): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastUpdate.getTime() < this.updateInterval) {
      return;
    }

    await this.fetchPrices();
    this.lastUpdate = now;
  }

  /**
   * Fetch prices from Pyth or Jupiter
   */
  private async fetchPrices(): Promise<void> {
    try {
      // Try Jupiter Price API (simpler, no API key needed)
      const response = await fetch(
        `https://price.jup.ag/v6/price?ids=${Object.values(TOKENS).join(',')}`
      );

      if (response.ok) {
        const data = await response.json() as { data: Record<string, { price: number }> };
        
        // Map back to symbols
        for (const [symbol, address] of Object.entries(TOKENS)) {
          const priceData = data.data[address];
          if (priceData) {
            this.priceCache.set(symbol, {
              price: priceData.price,
              confidence: 0.01, // Jupiter doesn't provide confidence
              timestamp: new Date(),
              change24h: this.calculateChange(symbol, priceData.price),
            });
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Price fetch failed, using cached data:', error);
      
      // Fallback for demo/devnet if API is unreachable (e.g. firewall)
      if (this.priceCache.size === 0) {
        console.log('⚠️ No cache available. Using fallback mock data for testing.');
        this.priceCache.set('SOL', { price: 145.20, confidence: 0.8, timestamp: new Date(), change24h: 5.2 });
        this.priceCache.set('USDC', { price: 1.00, confidence: 1.0, timestamp: new Date(), change24h: 0.0 });
        this.priceCache.set('JitoSOL', { price: 162.50, confidence: 0.8, timestamp: new Date(), change24h: 5.5 });
        this.priceCache.set('mSOL', { price: 158.90, confidence: 0.8, timestamp: new Date(), change24h: 5.4 });
      }
    }
  }

  /**
   * Calculate 24h price change (simplified - would need historical data)
   */
  private calculateChange(symbol: string, currentPrice: number): number {
    // In production: fetch 24h ago price from historical API
    // For demo: simulate some movement
    const cached = this.priceCache.get(symbol);
    if (cached) {
      return ((currentPrice - cached.price) / cached.price) * 100;
    }
    return 0;
  }

  /**
   * Get specific token price
   */
  async getPrice(symbol: string): Promise<PriceData | null> {
    await this.updatePricesIfStale();
    return this.priceCache.get(symbol) ?? null;
  }

  /**
   * Check if market conditions are favorable for trading
   */
  assessMarketConditions(): {
    favorable: boolean;
    reason: string;
    volatility: 'low' | 'medium' | 'high';
  } {
    const solData = this.priceCache.get('SOL');
    
    if (!solData) {
      return { favorable: false, reason: 'No price data', volatility: 'low' };
    }

    const absChange = Math.abs(solData.change24h ?? 0);
    
    if (absChange > 15) {
      return { 
        favorable: false, 
        reason: 'Extreme volatility - stand aside', 
        volatility: 'high' 
      };
    }

    if (absChange > 5) {
      return { 
        favorable: true, 
        reason: 'Moderate movement - opportunities present', 
        volatility: 'medium' 
      };
    }

    return { 
      favorable: true, 
      reason: 'Low volatility - favor yield strategies', 
      volatility: 'low' 
    };
  }
}
