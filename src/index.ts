/**
 * Level 5 — The First Level 5 Autonomous Corporation
 * 
 * Four agents. One fund. Zero humans in the loop.
 */

import { Committee, MarketContext, Position, Policy } from './agents/index.js';
// We will integrate these later, assuming files are present after merge
// import { DashboardServer } from './dashboard'; 
// import { DeliberationLogger } from './logger';

console.log(`
██╗     ███████╗██╗   ██╗███████╗██╗         ███████╗
██║     ██╔════╝██║   ██║██╔════╝██║         ██╔════╝
██║     █████╗  ██║   ██║█████╗  ██║         ███████╗
██║     ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║         ╚════██║
███████╗███████╗ ╚████╔╝ ███████╗███████╗    ███████║
╚══════╝╚══════╝  ╚═══╝  ╚══════╝╚══════╝    ╚══════╝
                                                      
    The First Level 5 Autonomous Corporation
    
    "They deliberate. They trade. They pay rent."
`);

async function main() {
  // Initialize committee with $50 operational reserve
  const committee = new Committee(50);
  
  // Show initial status
  committee.printStatus();

  // Mock market context (in a real loop this comes from MarketObserver)
  const marketContext: MarketContext = {
    positions: [],
    prices: {
      'SOL': 125.50,
      'USDC': 1.00,
      'JitoSOL': 142.30,
      'mSOL': 138.90,
    },
    priceChanges: {
      'SOL': 7.2,
      'JitoSOL': 6.8,
      'mSOL': 6.5,
      'USDC': 0.0,
    },
    volume: {
      'SOL': 2500000000,
    },
  };

  // Current positions
  const positions: Position[] = [
    { asset: 'USDC', amount: 500, valueUsd: 500, allocation: 50 },
    { asset: 'SOL', amount: 2, valueUsd: 251, allocation: 25.1 },
    { asset: 'JitoSOL', amount: 1, valueUsd: 142.30, allocation: 14.2 },
    { asset: 'mSOL', amount: 0.5, valueUsd: 69.45, allocation: 6.9 },
  ];

  // Vault policies
  const policies: Policy[] = [
    { name: 'Max Allocation', type: 'max_allocation', value: 40, enforced: 0 },
    { name: 'Asset Whitelist', type: 'whitelist', value: ['SOL', 'USDC', 'JitoSOL', 'mSOL'], enforced: 0 },
    { name: 'Drawdown Limit', type: 'drawdown_limit', value: 5, enforced: 0 },
  ];

  console.log('\n🚀 Starting deliberation cycle...\n');

  // TODO: Start Dashboard
  // const dashboard = new DashboardServer(committee, 3000);
  // dashboard.start();

  // Run a deliberation
  const deliberation = await committee.deliberate(marketContext, positions, policies);

  // Show final status
  console.log('\n');
  committee.printStatus();

  console.log(`
══════════════════════════════════════════════════════════════
                    DELIBERATION COMPLETE
══════════════════════════════════════════════════════════════
  ID: ${deliberation.id}
  Status: ${deliberation.status.toUpperCase()}
  Memos Generated: ${deliberation.memos.length}
  Total Cost: $${deliberation.totalCost.toFixed(3)}
  Duration: ${deliberation.endedAt ? 
    ((deliberation.endedAt.getTime() - deliberation.startedAt.getTime()) / 1000).toFixed(2) + 's' : 
    'ongoing'}
══════════════════════════════════════════════════════════════
  `);
}

main().catch(console.error);
