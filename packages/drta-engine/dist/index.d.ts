export type Vector14D = [number, number, number, number, number, number, number, number, number, number, number, number, number, number];
export interface AgentDNA {
    id: string;
    vector: Vector14D;
    resonance: number;
    isOutlier?: boolean;
}
export type MonetizationModel = 'ONE_TIME' | 'SUBSCRIPTION' | 'HYBRID';
export interface SimulationMetrics {
    avgResonance: number;
    conversionRate: number;
    earningPotential: number;
    activePaidUserCount: number;
    mrr: number;
    survivalRate: number;
}
export declare function calculateCosineSimilarity(v1: Vector14D, v2: Vector14D, weights?: Vector14D): number;
export declare function runCollision(productVector: Vector14D, techDebt: number, population: AgentDNA[], previousPaidUsers: number, weights?: Vector14D): AgentDNA[];
export declare function calculateMetrics(population: AgentDNA[], productVector: Vector14D, techDebt: number, teamSize: string, previousActiveUsers?: number, monetization?: {
    model: MonetizationModel;
    hardwarePrice: number;
    monthlyFee: number;
}): SimulationMetrics;
export declare function generatePopulation(seed: {
    mean: Vector14D;
    std: Vector14D;
    outliers: Vector14D[];
}, count: number | undefined, uuidv4: () => string): AgentDNA[];
