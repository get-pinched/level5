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

    // 3. Root - Retro Terminal Dashboard
    this.app.get('/', (req, res) => {
      const state = this.engine.getState();
      const statusColor = state.isAlive ? '#00ff00' : '#ff0000'; 
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>pinch // LEVEL 5 // SOLVENCY MONITOR</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
            
            body { 
              background-color: #000; 
              color: #00ff00; 
              font-family: 'VT323', monospace; 
              padding: 2rem; 
              margin: 0;
              text-shadow: 0 0 5px #00ff00;
              height: 100vh;
              overflow: hidden;
            }
            
            /* Scanline effect */
            body::before {
              content: " ";
              display: block;
              position: absolute;
              top: 0; left: 0; bottom: 0; right: 0;
              background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
              z-index: 2;
              background-size: 100% 2px, 3px 100%;
              pointer-events: none;
            }
            
            .container {
              display: grid;
              grid-template-columns: 350px 1fr;
              gap: 2rem;
              height: calc(100vh - 4rem);
              position: relative;
              z-index: 1;
            }

            .sidebar {
              border-right: 2px solid #00ff00;
              padding-right: 2rem;
              display: flex;
              flex-direction: column;
            }

            .main {
              overflow-y: auto;
              padding-right: 1rem;
            }
            
            /* Custom scrollbar */
            ::-webkit-scrollbar { width: 10px; }
            ::-webkit-scrollbar-track { background: #001100; }
            ::-webkit-scrollbar-thumb { background: #00ff00; }

            h1 { font-size: 3rem; margin: 0 0 1rem 0; letter-spacing: 2px; }
            h2 { border-bottom: 1px dashed #00ff00; padding-bottom: 0.5rem; }
            
            .metric-box {
              border: 1px solid #00ff00;
              padding: 1rem;
              margin-bottom: 1rem;
              background: rgba(0, 20, 0, 0.8);
            }
            
            .metric-label { opacity: 0.7; font-size: 1.2rem; }
            .metric-value { font-size: 2.5rem; font-weight: bold; }
            
            .status-indicator {
              font-size: 2rem;
              color: ${statusColor};
              text-shadow: 0 0 10px ${statusColor};
              animation: blink 2s infinite;
              margin-bottom: 2rem;
            }

            .log-entry { 
              font-size: 1.1rem;
              margin-bottom: 0.8rem;
              border-left: 2px solid #003300;
              padding-left: 1rem;
              padding-bottom: 0.5rem;
            }
            
            .log-entry:hover {
              border-left: 2px solid #00ff00;
              background: rgba(0, 255, 0, 0.05);
            }

            .timestamp { opacity: 0.5; font-size: 0.9rem; }
            .step-name { font-weight: bold; color: #ccffcc; }
            
            .ascii-art {
              font-size: 10px;
              white-space: pre;
              line-height: 10px;
              margin-top: auto;
              opacity: 0.5;
            }

            @keyframes blink {
              0% { opacity: 1; }
              50% { opacity: 0.5; }
              100% { opacity: 1; }
            }
          </style>
          <meta http-equiv="refresh" content="5">
        </head>
        <body>
          <div class="container">
            <div class="sidebar">
              <h1>LEVEL 5</h1>
              <div class="status-indicator">
                [ SYSTEM ${state.isAlive ? 'ONLINE' : 'OFFLINE'} ]
              </div>
              
              <div class="metric-box">
                <div class="metric-label">RESERVE (SOL)</div>
                <div class="metric-value">${state.balanceSol.toFixed(4)}</div>
              </div>
              
              <div class="metric-box">
                <div class="metric-label">RUNWAY</div>
                <div class="metric-value">${state.runwayHours.toFixed(1)}H</div>
              </div>
              
              <div class="metric-box">
                <div class="metric-label">SURVIVED</div>
                <div class="metric-value">${state.daysSurvived.toFixed(4)} DAYS</div>
              </div>

              <div class="ascii-art">
     .  .
    / \\/ \\
   (/ //_ \\_
    \\|/  \\/
     \\___/
   pinch v1
              </div>
            </div>

            <div class="main">
              <h2>>> DELIBERATION FEED</h2>
              <div id="logs">
                ${this.deliberationLog.length === 0 ? '<div class="log-entry">Waiting for system logs...</div>' : ''}
                ${this.deliberationLog.map(l => `
                  <div class="log-entry">
                    <span class="timestamp">[${new Date(l.timestamp).toISOString().split('T')[1].split('.')[0]}]</span>
                    <span class="step-name">${l.step || 'EVENT'}</span>
                    <div style="margin-top:5px; opacity: 0.8; font-family: monospace;">${JSON.stringify(l.data || {}).replace(/{|}|"/g, '').replace(/,/g, ', ')}</div>
                  </div>
                `).join('')}
              </div>
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
