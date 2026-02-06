import express from 'express';
import cors from 'cors';
import { Committee } from './agents/committee.js';
import { CommitteeState } from './agents/types.js';

export class DashboardServer {
  private app: express.Application;
  private port: number;
  private committee: Committee;
  private deliberationLog: any[] = [];

  constructor(committee: Committee, port: number = 3000) {
    this.committee = committee;
    this.port = port;
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());

    this.setupRoutes();
  }

  private setupRoutes() {
    // 1. Health/Solvency Status
    this.app.get('/api/status', (req, res) => {
      const state: CommitteeState = this.committee.getState();
      res.json({
        agentId: 'level5',
        status: state.reserve > 0 ? 'ALIVE' : 'DEAD',
        metrics: {
          reserve: state.reserve,
          runway: state.runway,
          avgDecisionCost: state.avgDecisionCost,
          totalDecisions: state.totalDecisions,
          totalVetos: state.totalVetos
        },
        meta: {
          version: '1.0.0',
          mission: 'DELIBERATE. TRADE. PAY RENT.'
        }
      });
    });

    // 2. Deliberation Feed
    this.app.get('/api/feed', (req, res) => {
      // Use committee's internal deliberation log
      const deliberations = this.committee.getDeliberations();
      res.json(deliberations);
    });

    // 3. Root - Retro Terminal Dashboard
    this.app.get('/', (req, res) => {
      const state = this.committee.getState();
      const deliberations = this.committee.getDeliberations();
      const lastDelib = deliberations[deliberations.length - 1];
      const statusColor = state.reserve > 10 ? '#00ff00' : '#ff0000'; 
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>LEVEL 5 // SOLVENCY MONITOR</title>
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

            .delib-entry { 
              font-size: 1.1rem;
              margin-bottom: 1.5rem;
              border-left: 2px solid #003300;
              padding-left: 1rem;
              padding-bottom: 0.5rem;
            }

            .memo-entry {
                margin-left: 1rem;
                margin-top: 0.5rem;
                font-size: 0.9rem;
                color: #ccffcc;
                border-left: 1px dashed #005500;
                padding-left: 0.5rem;
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
                [ SYSTEM ${state.reserve > 0 ? 'ONLINE' : 'OFFLINE'} ]
              </div>
              
              <div class="metric-box">
                <div class="metric-label">RESERVE ($)</div>
                <div class="metric-value">$${state.reserve.toFixed(2)}</div>
              </div>
              
              <div class="metric-box">
                <div class="metric-label">RUNWAY</div>
                <div class="metric-value">${state.runway} DECISIONS</div>
              </div>
              
              <div class="metric-box">
                <div class="metric-label">DECISIONS</div>
                <div class="metric-value">${state.totalDecisions}</div>
              </div>

              <div class="ascii-art">
     .  .
    / \\/ \\
   (/ //_ \\_
    \\|/  \\/
     \\___/
   LEVEL 5
              </div>
            </div>

            <div class="main">
              <h2>>> DELIBERATION FEED</h2>
              <div id="logs">
                ${deliberations.length === 0 ? '<div class="delib-entry">Waiting for committee deliberation...</div>' : ''}
                ${deliberations.slice().reverse().map(d => `
                  <div class="delib-entry">
                    <div>
                        <span class="timestamp">[${new Date(d.startedAt).toISOString().split('T')[1].split('.')[0]}]</span>
                        <span class="step-name">${d.id}</span>
                        <span style="float:right">[${d.status.toUpperCase()}]</span>
                    </div>
                    ${d.memos.map(m => `
                        <div class="memo-entry">
                            <strong>${m.author.toUpperCase()}</strong>: ${m.subject}
                        </div>
                    `).join('')}
                    <div style="margin-top:5px; opacity: 0.7; font-size: 0.8rem;">
                        Cost: $${d.totalCost.toFixed(3)}
                    </div>
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
