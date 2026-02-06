/**
 * Level 5 — The First Level 5 Autonomous Corporation
 * 
 * Four agents. One fund. Zero humans in the loop.
 */

import { Committee, MarketContext, Position, Policy } from './agents/index.js';
import { DashboardServer } from './dashboard.js'; 
import { MarketObserver } from './strategy/market-observer.js';

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
  const marketObserver = new MarketObserver();
  
  // Show initial status
  committee.printStatus();
  
  // Start Dashboard
  const dashboard = new DashboardServer(committee, 3000);
  dashboard.start();

  // Current positions (Mock for now, would fetch from on-chain)
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

  console.log('\n🚀 Starting deliberation cycle...');
  console.log('📡 Fetching live market data...');

  // Get real market context
  const marketContext = await marketObserver.getMarketContext(positions);

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
  
  // Keep process alive for dashboard
  // process.exit(0);
}

main().catch(console.error);
