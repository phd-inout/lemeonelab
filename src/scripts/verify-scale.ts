// @ts-nocheck
import { generatePopulation, stepSimulation } from '../lib/engine/simulator';
import { SandboxState, UserTier, PopulationSeed } from '../lib/engine/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Scale Test: 10,000 (PRO) vs 100,000 (ENTERPRISE)
 * Validates the Decoupled Funnel and Law of Large Numbers.
 */
async function verifyScale() {
    console.log("⚖️  [SCALE TEST] 10k vs 100k Population Conversion Audit\n");

    // Dropbox-like DNA: High Core, High Friction-Pass (Easy), High Social, Low Initial Awareness
    const seed: PopulationSeed = {
        mean: [0.9,0.9,0.8,0.9,0.95,0.7,0.8,0.9,0.5,0.5,0.5,0.5,0.05,0.5],
        std: [0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1],
        weights: [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        outliers: []
    };

    async function runScenario(populationSize: number, tier: UserTier, weeks: number) {
        console.log(`\n--- Running Scenario: ${tier} (${populationSize.toLocaleString()} Agents) ---`);
        const agents = generatePopulation(seed, populationSize);
        
        let state: SandboxState = {
            id: uuidv4(),
            tier,
            epoch: 0,
             
             
            techDebt: 0,
            currentStage: 'SEED', seedText: "test", userARPU: 45, industryId: "ind_000", industryName: "Test", industryBaselineARPU: 45,
            productVector: [...seed.mean] as any,
            agents,
            metrics: { avgResonance: 0, conversionRate: 0, earningPotential: 0, survivalRate: 1.0, activePaidUserCount: 0, mrr: 0 },
            assets: { proposal: '', backlog: '', marketFeedback: '', stressTestReport: '', journal: '', competitiveRadar: '', competitiveRadar: '', journal: '' },
            history: []
        };

        let maxPaid = 0;
        let maxActive = 0;

        console.log("Epoch\tActive Users\tPaid Users\tPaid Conv %\tAwareness");
        console.log("------------------------------------------------------------------");

        for (let i = 1; i <= weeks; i++) {
            // Hacker News viral moment
            if (i === 2) state.productVector[12] = 0.40;

            state = await stepSimulation(state);
            
            const activeUsers = state.metrics.activePaidUserCount;
            const paidUsers = state.metrics.earningPotential;
            const paidConvRate = (paidUsers / populationSize) * 100;
            const awareness = state.productVector[12] * 100;

            if (paidUsers > maxPaid) maxPaid = paidUsers;
            if (activeUsers > maxActive) maxActive = activeUsers;

            if (i % 12 === 0 || i === 2) {
                console.log(`T+${state.epoch}\t${activeUsers.toLocaleString()}\t\t${paidUsers.toLocaleString()}\t\t${paidConvRate.toFixed(2)}%\t\t${awareness.toFixed(1)}%`);
            }
        }
        
        console.log(`\n✅ [RESULT ${tier}] Peak Active: ${maxActive.toLocaleString()} (${((maxActive/populationSize)*100).toFixed(1)}%) | Peak Paid: ${maxPaid.toLocaleString()} (${((maxPaid/populationSize)*100).toFixed(1)}%)`);
    }

    // Run 10k PRO
    await runScenario(10000, 'PRO', 48);

    // Run 100k ENTERPRISE
    await runScenario(100000, 'ENTERPRISE', 48);
    
    console.log("\n🏁 [SCALE VALIDATION COMPLETE]");
}

verifyScale().catch(console.error);
