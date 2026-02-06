"use strict";
/**
 * Jupiter Integration — Find swap opportunities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKENS = void 0;
exports.getQuote = getQuote;
exports.executeSwap = executeSwap;
exports.checkSwapOpportunities = checkSwapOpportunities;
exports.findSwapOpportunity = findSwapOpportunity;
const web3_js_1 = require("@solana/web3.js");
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';
// Common tokens
exports.TOKENS = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
};
/**
 * Get quote from Jupiter
 */
async function getQuote(inputMint, outputMint, amount, // in lamports or smallest unit
slippageBps = 50) {
    try {
        const url = `${JUPITER_QUOTE_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Jupiter quote error: ${response.status}`);
            return null;
        }
        return await response.json();
    }
    catch (error) {
        console.error('Jupiter quote failed:', error);
        return null;
    }
}
/**
 * Execute swap via Jupiter
 */
async function executeSwap(quote, userPublicKey, connection, signTransaction) {
    try {
        // Get swap transaction
        const swapResponse = await fetch(JUPITER_SWAP_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quoteResponse: quote,
                userPublicKey: userPublicKey.toBase58(),
                wrapAndUnwrapSol: true,
                dynamicComputeUnitLimit: true,
                prioritizationFeeLamports: 'auto',
            }),
        });
        if (!swapResponse.ok) {
            console.error(`Jupiter swap error: ${swapResponse.status}`);
            return null;
        }
        const swapData = await swapResponse.json();
        const { swapTransaction } = swapData;
        // Deserialize and sign
        const txBuf = Buffer.from(swapTransaction, 'base64');
        const tx = web3_js_1.VersionedTransaction.deserialize(txBuf);
        const signedTx = await signTransaction(tx);
        // Send transaction
        const txid = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
            maxRetries: 2,
        });
        // Confirm
        await connection.confirmTransaction(txid, 'confirmed');
        return txid;
    }
    catch (error) {
        console.error('Jupiter swap execution failed:', error);
        return null;
    }
}
/**
 * Check for swap opportunities (used by strategy registry)
 */
async function checkSwapOpportunities(balanceSol) {
    const opportunities = [];
    // For MVP: just check basic SOL/USDC rate
    const swapOpp = await findSwapOpportunity(balanceSol, 0.001);
    if (swapOpp) {
        opportunities.push({
            type: 'swap',
            expectedProfit: swapOpp.profitEstimate,
            risk: swapOpp.priceImpact < 0.5 ? 'low' : swapOpp.priceImpact < 2 ? 'medium' : 'high',
            execute: async () => {
                console.log(`🔄 Would execute swap: ${swapOpp.inputAmount.toFixed(4)} SOL → ${swapOpp.expectedOutput.toFixed(2)} USDC`);
                // TODO: Wire up actual execution with wallet signing
                return null;
            }
        });
    }
    return opportunities;
}
/**
 * Find best swap opportunity for survival
 * Looks for ways to convert volatile assets to stable or vice versa
 */
async function findSwapOpportunity(currentBalanceSol, minProfitThreshold = 0.001) {
    // For survival, we mainly care about:
    // 1. Converting SOL to stables when SOL is pumping (lock in value)
    // 2. Converting stables to SOL when SOL is cheap (accumulate)
    // For MVP, just check SOL -> USDC quote to understand current rates
    const lamports = Math.floor(currentBalanceSol * 0.1 * 1e9); // Quote for 10% of balance
    if (lamports < 1000000) { // Less than 0.001 SOL, skip
        return null;
    }
    const quote = await getQuote(exports.TOKENS.SOL, exports.TOKENS.USDC, lamports);
    if (!quote) {
        return null;
    }
    // Calculate if this is worthwhile
    // (In a real implementation, we'd track prices over time and look for deviations)
    const inputSol = lamports / 1e9;
    const outputUsdc = parseInt(quote.outAmount) / 1e6;
    const impliedPrice = outputUsdc / inputSol;
    console.log(`📊 SOL/USDC quote: ${impliedPrice.toFixed(2)} (${quote.priceImpactPct}% impact)`);
    // For now, return null - we need price history to make good decisions
    // This is a placeholder for the opportunity detection logic
    return null;
}
