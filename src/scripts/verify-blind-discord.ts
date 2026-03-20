import { scanSeed } from '../lib/engine/cortex-ai';
import { generatePopulation, stepSimulation } from '../lib/engine/simulator';
import { SandboxState, UserTier, Vector14D } from '../lib/engine/types';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verifyDiscordBlind() {
    console.log("🎮 [BLIND TEST] INITIATING PROJECT 'PULSE-VOICE' (2015) 14D VERSION\n");

    const blindDocs = `
# Project Specs: Pulse-Voice Engine (2015)
## Technical Edge (D1-D4): WebRTC, 50ms Latency.
## Design: 100% Free, No limit, Browser access (D5=0.99, D6=0.05).
    `.trim();

    const scanResult = await scanSeed([blindDocs], "");
    const seed = scanResult.seed;
    
    // 14D 校准
    const discordVector: Vector14D = [
        0.85, 0.90, 0.88, 0.82, // Core
        0.99,                   // D5: Entry (网页即用)
        0.05,                   // D6: Monetize (只有 Nitro 装饰)
        0.95, 0.95, 0.85,       // Market
        0.80, 0.80, 0.80, 0.80, // Future
        0.40                    // D14: Awareness
    ];
    seed.mean = discordVector;

    const agents = generatePopulation(seed, 100000);
    let state: SandboxState = {
        id: uuidv4(), tier: 'ENTERPRISE' as UserTier, epoch: 0, cash: 2000000, 
        burnRate: 150000, techDebt: 0, currentStage: 'SEED',
        productVector: seed.mean, agents,
        metrics: { avgResonance: 0, conversionRate: 0, earningPotential: 0, survivalRate: 1.0, activePaidUserCount: 0 },
        assets: { proposal: '', backlog: '', marketFeedback: '', stressTestReport: '', journal: '' },
        history: []
    };

    console.log("\nEpoch\tActive Users\tPaid Users\tConv %\tStatus");
    for (let i = 1; i <= 24; i++) {
        state = await stepSimulation(state);
        const { earningPotential, activePaidUserCount } = state.metrics;
        const convRate = (earningPotential / activePaidUserCount) * 100 || 0;
        if (i % 8 === 0 || i === 1) {
            console.log(`T+${state.epoch}\t${activePaidUserCount.toLocaleString()}\t\t${earningPotential.toLocaleString()}\t\t${convRate.toFixed(1)}%\tSEED`);
        }
    }
}

verifyDiscordBlind().catch(console.error);
