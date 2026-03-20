import {
  Vector14D,
  AgentDNA,
  SandboxState,
  PopulationSeed,
} from './types'
import { v4 as uuidv4 } from 'uuid'

/**
 * System 1: DRTA Gravity Engine
 * Optimized DRTA 2.5: 14-Dimensional Decoupled Funnel
 */

// Cosine Similarity with Weights (Normalized)
export function calculateCosineSimilarity(v1: Vector14D, v2: Vector14D, weights?: Vector14D): number {
  let dotProduct = 0
  let mag1 = 0
  let mag2 = 0
  for (let i = 0; i < 13; i++) { // Core + Market + Future (exclude Awareness)
    const w = weights ? weights[i] : 1
    dotProduct += (v1[i] * v2[i] * w)
    mag1 += (v1[i] * v1[i] * w)
    mag2 += (v2[i] * v2[i] * w)
  }
  const denominator = Math.sqrt(mag1) * Math.sqrt(mag2)
  return denominator === 0 ? 0 : Math.min(1, dotProduct / denominator)
}

export function runCollision(
  productVector: Vector14D,
  techDebt: number,
  population: AgentDNA[],
  previousPaidUsers: number,
  weights: Vector14D = [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
): AgentDNA[] {
  return population.map(agent => {
    const cosSim = calculateCosineSimilarity(productVector, agent.vector as any, weights)
    const rCos = Math.pow(Math.max(0, cosSim), 3)

    let magDiff = 0
    for(let i=0; i<13; i++) magDiff += Math.pow(productVector[i] - agent.vector[i], 2)
    const alpha = agent.isOutlier ? 1.5 : 0.8 
    const pDist = Math.exp(-alpha * magDiff)

    return {
      ...agent,
      resonance: rCos * pDist
    }
  })
}

export async function runCollisionAsync(
  productVector: Vector14D,
  techDebt: number,
  population: AgentDNA[],
  previousPaidUsers: number,
  weights: Vector14D = [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
): Promise<AgentDNA[]> {
  return runCollision(productVector, techDebt, population, previousPaidUsers, weights)
}

export function calculateMetrics(
    population: AgentDNA[], 
    productVector: Vector14D, 
    techDebt: number, 
    teamSize: string,
    previousActiveUsers: number = 0,
    cash: number = 0
) {
  const R0 = 0.35; 
  const k = 12;   
  const lambda = 0.5; 

  let totalResonance = 0;
  population.forEach(agent => totalResonance += agent.resonance);
  const avgResonance = totalResonance / population.length;

  const retentionRate = Math.min(0.99, 1 / (1 + Math.exp(-15 * (avgResonance - 0.25))));
  const retainedActiveUsers = Math.floor(previousActiveUsers * retentionRate);

  const newAwareAgentsCount = Math.floor((population.length - previousActiveUsers) * productVector[13] * 0.2);
  let newActiveUsers = 0;

  for (let i = 0; i < newAwareAgentsCount; i++) {
      const sample = population[Math.floor(Math.random() * population.length)];
      const pConv = 1 / (1 + Math.exp(-k * (sample.resonance - R0)));
      const entryEase = productVector[4];
      const techPenalty = Math.exp(-lambda * (techDebt / 100));
      if (Math.random() < (pConv * entryEase * techPenalty)) {
          newActiveUsers++;
      }
  }

  const totalActiveUsers = retainedActiveUsers + newActiveUsers;
  
  let paidUsers = 0;
  const activeAgents = population.filter(a => a.resonance > R0); 
  const sampleSize = Math.min(activeAgents.length, 2000);
  let samplePaidCount = 0;
  const alpha = 2.2; 
  
  for (let i = 0; i < sampleSize; i++) {
      const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
      
      const resonance = agent.resonance;
      const pressure = productVector[5]; // D6 Monetize Pressure
      
      // 1. Rational Probability (The Fermi Transition)
      // Users pay when Resonance > Barrier.
      // Barrier is derived from (1.0 - Pressure).
      const barrier = 1.0 - pressure;
      const energyGap = (barrier - resonance * 0.8) * 10.0; // Sharpness
      const pRational = 1.0 / (1.0 + Math.exp(energyGap));
      
      // 2. Emotional/Entropy Probability (The Fan Constant)
      // Base non-rational conversion rate (~1.5%) scaled by resonance.
      const pEntropy = 0.015 * resonance;
      
      // 3. Final Probability Density:
      // Slack (High Pressure) is guided by pRational.
      // Discord (Low Pressure) is saved by pEntropy.
      // The 0.42 ceiling naturally handles real-world B2B/B2C drop-offs.
      const pPay = (pRational * pressure * 0.42) + pEntropy;
      
      if (Math.random() < Math.min(0.98, pPay)) {
          samplePaidCount++;
      }
  }
  
  const emergentMonetizationRate = sampleSize > 0 ? (samplePaidCount / sampleSize) : 0;
  paidUsers = Math.floor(totalActiveUsers * emergentMonetizationRate);
  
  const mrr = paidUsers * 45;
  const monthlyBurn = 20000;
  const runwayMonths = cash > 0 ? (cash / monthlyBurn) : 0;
  
  let survivalRate = 1.0;
  if (mrr < monthlyBurn) {
      const financialHealth = Math.min(1, runwayMonths / 12); 
      survivalRate = Math.max(0.1, financialHealth * 0.8 + (avgResonance * 0.2));
  } else {
      survivalRate = Math.min(1.0, 0.8 + (mrr / monthlyBurn) * 0.1);
  }

  return {
    avgResonance,
    conversionRate: paidUsers / population.length,
    earningPotential: paidUsers,
    activePaidUserCount: totalActiveUsers,
    survivalRate: Math.min(1, survivalRate)
  }
}

export async function stepSimulation(state: SandboxState): Promise<SandboxState> {
  const nextEpoch = state.epoch + 1;
  const weights: Vector14D = [1,1,1,1,1,1,1,1,1,1,1,1,1,1];
  const previousActiveUsers = state.metrics.activePaidUserCount || 0;
  const userDensity = previousActiveUsers / state.agents.length;

  const nextProductVector = [...state.productVector] as Vector14D;
  const performanceBonus = Math.max(0, state.metrics.avgResonance - 0.3) * 0.01;
  nextProductVector[8] = Math.min(1.0, nextProductVector[8] + performanceBonus); // D9 consistency
  nextProductVector[6] = Math.min(1.0, nextProductVector[6] + (userDensity * 0.5)); // D7 Unique

  if (userDensity > 0.01) { 
      state.agents.forEach(agent => {
          if (Math.random() < 0.05) { 
              for(let d=0; d<13; d++) { // Market shaping up to Curve
                  agent.vector[d] = agent.vector[d] * 0.998 + nextProductVector[d] * 0.002;
              }
          }
      });
  }

  const viralGrowth = state.productVector[7] * userDensity * 0.8; // D8 Social
  nextProductVector[13] = Math.min(1.0, nextProductVector[13] + viralGrowth + 0.002);

  const teamSize = (state as any).teamSize || 'STARTUP';
  const techDebtBump = teamSize === 'SOLO' ? 1 : teamSize === 'STARTUP' ? 3 : 8;
  const nextTechDebt = state.techDebt + techDebtBump;

  const updatedAgents = await runCollisionAsync(nextProductVector, nextTechDebt, state.agents, previousActiveUsers, weights);
  const metrics = calculateMetrics(updatedAgents, nextProductVector, nextTechDebt, teamSize, previousActiveUsers, state.cash);

  const mrr = metrics.earningPotential * 45;
  const weeklyBurn = (state.burnRate || 20000) / 4;
  const nextCash = Math.max(-10000000, state.cash + (mrr / 4) - weeklyBurn);

  return {
    ...state,
    epoch: nextEpoch,
    cash: nextCash,
    techDebt: nextTechDebt,
    productVector: nextProductVector,
    agents: updatedAgents,
    metrics,
    history: [...(state.history || []), {
        epoch: nextEpoch,
        users: metrics.earningPotential,
        resonance: metrics.avgResonance,
        survival: metrics.survivalRate,
        cash: nextCash
    }]
  }
}

export function generatePopulation(seed: PopulationSeed, count: number = 10000): AgentDNA[] {
  const agents: AgentDNA[] = []
  const { mean, std, outliers } = seed
  const dimCount = mean.length;

  if (outliers && outliers.length > 0) {
    const outlierCount = Math.min(Math.floor(count * 0.02), outliers.length * 20)
    for (let i = 0; i < outlierCount; i++) {
        const source = outliers[i % outliers.length]
        agents.push({
            id: `outlier-${uuidv4()}`,
            vector: (source as any).dna || source,
            resonance: 0,
            isOutlier: true
        })
    }
  }

  const remainingCount = count - agents.length
  for (let i = 0; i < remainingCount; i++) {
    const vector = new Array(dimCount);
    for (let d = 0; d < dimCount; d++) {
      const u1 = Math.random()
      const u2 = Math.random()
      const z0 = Math.sqrt(-2.0 * Math.log(u1 + 1e-9)) * Math.cos(2.0 * Math.PI * u2)
      const val = mean[d] + z0 * std[d]
      vector[d] = Math.max(0, Math.min(1, val))
    }
    agents.push({
      id: uuidv4(),
      vector: vector as any,
      resonance: 0
    })
  }
  return agents
}
