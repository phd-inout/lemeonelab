// @ts-nocheck
import { generatePopulation, stepSimulation } from '../lib/engine/simulator';
import { SandboxState, UserTier, Vector14D, PopulationSeed } from '../lib/engine/types';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface CaseStudy {
    name: string;
    target: string;
    vector: Vector14D;
}

const cases: CaseStudy[] = [
    {
        name: "Slack (2014)",
        target: "30%",
        vector: [0.95, 0.90, 0.85, 0.90, 0.90, 0.75, 0.95, 0.90, 0.85, 0.80, 0.70, 0.60, 0.50, 0.15]
    },
    {
        name: "GitHub (2011)",
        target: "3% - 5%",
        vector: [0.85, 0.80, 0.85, 0.90, 0.90, 0.30, 0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.10]
    },
    {
        name: "Zoom (2013)",
        target: "4% - 5%",
        vector: [0.85, 0.80, 0.90, 0.85, 0.95, 0.30, 0.80, 0.70, 0.80, 0.70, 0.60, 0.50, 0.40, 0.05]
    },
    {
        name: "Discord (2015)",
        target: "~1.5%",
        vector: [0.85, 0.90, 0.88, 0.82, 0.99, 0.05, 0.95, 0.95, 0.85, 0.80, 0.80, 0.80, 0.80, 0.40]
    },
    {
        name: "Notion (2018)",
        target: "5% - 10%",
        vector: [0.85, 0.90, 0.88, 0.82, 0.30, 0.35, 0.95, 0.70, 0.80, 0.85, 0.80, 0.75, 0.70, 0.03]
    }
];

async function runRobustAudit() {
    console.log("🛡️ [ROBUST AUDIT] STARTING CROSS-CASE VALIDATION (Trimmed Mean Method)\n");
    console.log("Rule: Simulating 48 weeks. Removing top 6 and bottom 6 conversion weeks to get stable core.\n");

    for (const study of cases) {
        console.log(`\n--- Testing Case: ${study.name} (Target: ${study.target}) ---`);
        
        const seed: PopulationSeed = {
            mean: study.vector,
            std: Array(14).fill(0.15) as any,
            weights: Array(14).fill(1.0) as any,
            outliers: []
        };

        const agents = generatePopulation(seed, 100000);
        let state: SandboxState = {
            id: uuidv4(), tier: 'ENTERPRISE' as UserTier, epoch: 0,  
             techDebt: 0, currentStage: 'SEED', seedText: "test", userARPU: 45, industryId: "ind_000", industryName: "Test", industryBaselineARPU: 45,
            productVector: study.vector, agents,
            metrics: { avgResonance: 0, conversionRate: 0, earningPotential: 0, survivalRate: 1.0, activePaidUserCount: 0, mrr: 0 },
            assets: { proposal: '', backlog: '', marketFeedback: '', stressTestReport: '', journal: '', competitiveRadar: '', competitiveRadar: '', journal: '' },
            history: []
        };

        const convRates: number[] = [];

        for (let i = 1; i <= 48; i++) {
            state = await stepSimulation(state);
            const { earningPotential, activePaidUserCount } = state.metrics;
            if (activePaidUserCount > 100) { // Only count stable weeks
                convRates.push((earningPotential / activePaidUserCount) * 100);
            }
        }

        // Apply Trimmed Mean: Remove top 6 and bottom 6
        if (convRates.length >= 20) {
            convRates.sort((a, b) => a - b);
            const trimmed = convRates.slice(6, -6);
            const robustMean = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
            
            console.log(`  > Robust Mean Conversion: ${robustMean.toFixed(2)}%`);
            console.log(`  > Simulated Range (after trim): ${trimmed[0].toFixed(2)}% - ${trimmed[trimmed.length-1].toFixed(2)}%`);
            
            const targetMin = parseFloat(study.target);
            const targetMax = study.target.includes('-') ? parseFloat(study.target.split('-')[1]) : targetMin + 2;
            
            if (robustMean >= targetMin * 0.7 && robustMean <= targetMax * 1.3) {
                console.log("  ✅ MATCH: Data falls within acceptable robust window.");
            } else {
                console.log("  ❌ MISMATCH: Values deviate significantly from ground truth.");
            }
        } else {
            console.log("  ⚠️ INSUFFICIENT DATA: Growth too slow to calculate robust mean.");
        }
    }
}

runRobustAudit().catch(console.error);
