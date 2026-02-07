import { Committee } from './agents/committee.js';
import { MarketContext } from './agents/research.js';

async function runDemo() {
  console.log('🚀 Level 5 Committee Demo Starting...');
  
  const committee = new Committee();
  
  // Mock positions
  const positions = [
    { asset: 'USDC', amount: 5000, valueUsd: 5000, allocation: 50 },
    { asset: 'SOL', amount: 20, valueUsd: 2904, allocation: 29 },
    { asset: 'JitoSOL', amount: 10, valueUsd: 1584, allocation: 15.8 }
  ];

  // Mock market context matching ResearchAgent expectations
  const marketContext = {
    positions: positions,
    prices: {
      SOL: 145.20,
      JitoSOL: 158.40,
      mSOL: 162.10,
      USDC: 1.00
    },
    priceChanges: {
      SOL: 7.2,
      JitoSOL: 5.5,
      mSOL: 2.1,
      USDC: 0.01
    },
    volume: {
      SOL: 1000000,
      JitoSOL: 50000,
      mSOL: 25000,
      USDC: 5000000
    }
  };

  // Mock policies
  const policies = [
    { name: 'Max Allocation', type: 'max_allocation', value: 40, enforced: 0 },
    { name: 'Asset Whitelist', type: 'whitelist', value: ['SOL', 'USDC', 'JitoSOL', 'mSOL'], enforced: 0 }
  ];

  // Run deliberation
  await committee.deliberate(marketContext, positions as any, policies as any);
  
  committee.printStatus();
}

runDemo().catch(console.error);
