/**
 * Survival Engine — Core loop for pinch
 */
import { Connection, Keypair } from '@solana/web3.js';
import { DeliberationLogger } from './logger';
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
    private walletPubkey;
    private walletKeypair;
    private config;
    private state;
    private running;
    private logger?;
    constructor(connection: Connection, walletKeypair: Keypair, survivalConfig: SurvivalConfig, logger?: DeliberationLogger);
    start(): Promise<void>;
    stop(): void;
    private tick;
    private findAndExecuteOpportunity;
    private sleep;
    getState(): SurvivalState;
}
