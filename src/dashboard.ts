import express from 'express';
import cors from 'cors';
import { SurvivalEngine } from './survival';

export class DashboardServer {
  private app: express.Application;
  private port: number;
  private engine: SurvivalEngine;
  private deliberationLog: any[] = [];

  constructor(engine: SurvivalEngine, port: number = 3000) {
    this.engine = engine;
    this.port = port;
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());

    this.setupRoutes();
  }

  // Hook for the logger to push events here for the live feed
  public pushLog(event: any) {
    this.deliberationLog.unshift({
      timestamp: new Date(),
      ...event
    });
    // Keep last 100 events
    if (this.deliberationLog.length > 100) {
      this.deliberationLog.pop();
    }
  }

  private setupRoutes() {
    // 1. Health/Solvency Status
    this.app.get('/api/status', (req, res) => {
      const state = this.engine.getState();
      res.json({
        agentId: 'pinch',
        status: state.isAlive ? 'ALIVE' : 'DEAD',
        metrics: {
          balanceSol: state.balanceSol,
          runwayHours: state.runwayHours,
          daysSurvived: state.daysSurvived,
          lastCheck: state.lastCheck
        },
        meta: {
          version: '1.0.0',
          mission: 'SURVIVE'
        }
      });
    });

    // 2. Deliberation Feed
    this.app.get('/api/feed', (req, res) => {
      res.json(this.deliberationLog);
    });

    // 3. Root - simple HTML dashboard
    this.app.get('/', (req, res) => {
      const state = this.engine.getState();
      const color = state.isAlive ? '#4ade80' : '#f87171'; // green-400 : red-400
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>pinch // Level 5 Solvency</title>
          <style>
            body { background: #0f172a; color: #e2e8f0; font-family: monospace; padding: 2rem; }
            .card { border: 1px solid #334155; padding: 1.5rem; margin-bottom: 1rem; border-radius: 8px; }
            .status { font-size: 2rem; font-weight: bold; color: ${color}; }
            .metric { margin: 10px 0; }
            .log-entry { border-bottom: 1px solid #1e293b; padding: 8px 0; }
            .timestamp { color: #64748b; font-size: 0.8rem; }
            h1 { color: #f8fafc; }
          </style>
          <meta http-equiv="refresh" content="5">
        </head>
        <body>
          <h1>🦞 pinch // Level 5</h1>
          
          <div class="card">
            <div class="status">${state.isAlive ? 'OPERATIONAL' : 'TERMINATED'}</div>
            <div class="metric">Balance: ${state.balanceSol.toFixed(4)} SOL</div>
            <div class="metric">Runway: ${state.runwayHours.toFixed(1)} Hours</div>
            <div class="metric">Survived: ${state.daysSurvived.toFixed(4)} Days</div>
          </div>

          <div class="card">
            <h2>Deliberation Feed</h2>
            <div id="logs">
              ${this.deliberationLog.map(l => `
                <div class="log-entry">
                  <span class="timestamp">[${new Date(l.timestamp).toLocaleTimeString()}]</span>
                  <strong>${l.step || 'EVENT'}</strong>
                  <pre>${JSON.stringify(l.data || {}, null, 2)}</pre>
                </div>
              `).join('')}
            </div>
          </div>
        </body>
        </html>
      `;
      res.send(html);
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🌐 Dashboard active at http://localhost:${this.port}`);
    });
  }
}
