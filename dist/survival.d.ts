/**
 * Survival Engine — Core loop for pinch
 */
import { Connection, PublicKey } from '@solana/web3.js';
export interface SurvivalConfig {
    minRunwayHours: number;
    checkIntervalMs: number;
}
export interface SurvivalState {
    balanceSol: number;
    runwayHours: number;
    lastCheck: Date;
    isAlive: boolean;
    daysSurvived: number;
    startedAt: Date;
}
export declare class SurvivalEngine {
    private connection;
    private wallet;
    private config;
    private state;
    private running;
    constructor(connection: Connection, wallet: PublicKey, survivalConfig: SurvivalConfig);
    start(): Promise<void>;
    stop(): void;
    private tick;
    private findAndExecuteOpportunity;
    private sleep;
    getState(): SurvivalState;
}
