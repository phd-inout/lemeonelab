import {
  Vector13D,
  AgentDNA,
  SandboxState,
  PopulationSeed,
} from './types'
import { v4 as uuidv4 } from 'uuid'

/**
 * System 1: DRTA Gravity Engine
 * Optimized DRTA 2.2: Stochastic 13D Conversion Funnel
 */

// Cosine Similarity with Weights
export function calculateCosineSimilarity(v1: Vector13D, v2: Vector13D, weights?: Vector13D): number {
  let dotProduct = 0
  let mag1 = 0
  let mag2 = 0
  for (let i = 0; i < 12; i++) {
    const w = weights ? weights[i] : 1
    dotProduct += (v1[i] * v2[i] * w)
    mag1 += v1[i] * v1[i]
    mag2 += v2[i] * v2[i]
  }
  const denominator = Math.sqrt(mag1) * Math.sqrt(mag2)
  return denominator === 0 ? 0 : dotProduct / denominator
}

/**
 * The Collision Loop: 10,000 agents x Product Vector
 * Now calculates Raw Resonance (R_pmf)
 */
export function runCollision(
  productVector: Vector13D,
  techDebt: number,
  population: AgentDNA[],
  previousPaidUsers: number,
  weights: Vector13D = [1,1,1,1,1,1,1,1,1,1,1,1,1]
): AgentDNA[] {
  return population.map(agent => {
    // 1. R_cos (Directional Consistency)
    const cosSim = calculateCosineSimilarity(productVector, agent.vector, weights)
    const rCos = Math.pow(Math.max(0, cosSim), 3)

    // 2. P_dist (Over-engineering Penalty)
    let magDiff = 0
    for(let i=0; i<12; i++) magDiff += Math.pow(productVector[i] - agent.vector[i], 2)
    const alpha = agent.isOutlier ? 1.5 : 0.8 
    const pDist = Math.exp(-alpha * magDiff)

    // Raw PMF Resonance
    const resonance = rCos * pDist

    return {
      ...agent,
      resonance
    }
  })
}

/**
 * Async wrapper for runCollision
 */
export async function runCollisionAsync(
  productVector: Vector13D,
  techDebt: number,
  population: AgentDNA[],
  previousPaidUsers: number,
  weights: Vector13D = [1,1,1,1,1,1,1,1,1,1,1,1,1]
): Promise<AgentDNA[]> {
  // Direct execution for simplicity in this turn
  return runCollision(productVector, techDebt, population, previousPaidUsers, weights)
}

/**
 * 13D Stochastic Conversion Engine
 * Implements the Monte Carlo funnel: Awareness -> Sigmoid -> Friction -> TechDebt
 */
export function calculateMetrics(
    population: AgentDNA[], 
    productVector: Vector13D, 
    techDebt: number, 
    teamSize: string
) {
  const R0 = 0.5; // Sweet spot midpoint
  const k = 12;   // Decision steepness
  const lambda = 0.5; // Tech debt penalty intensity

  let totalResonance = 0;
  let payingUsers = 0;

  population.forEach(agent => {
    totalResonance += agent.resonance;

    // 1. Awareness Gate (D13 - Perception)
    // If user is not aware of the product, no conversion.
    if (Math.random() > productVector[12]) return;

    // 2. Base Conversion Probability (Sigmoid)
    const pConv = 1 / (1 + Math.exp(-k * (agent.resonance - R0)));

    // 3. Apply Friction (D5) and Tech Debt Penalty
    // D5 is index 4. Higher D5 means HIGHER friction (1 - D5 is the pass rate)
    const frictionPenalty = 1 - productVector[4];
    const techPenalty = Math.exp(-lambda * (techDebt / 100));

    const finalP = pConv * frictionPenalty * techPenalty;

    // 4. Monte Carlo Decision
    if (Math.random() < finalP) {
      payingUsers++;
    }
  });

  const avgResonance = totalResonance / population.length;
  const conversionRate = payingUsers / population.length;
  
  // Adjusted Survival Rate Logic
  const costFactor = teamSize === 'ENTERPRISE' ? 0.7 : teamSize === 'STARTUP' ? 0.4 : 0.1;
  const survivalRate = Math.max(0, 1 - costFactor - (techDebt / 100)) * (conversionRate * 10);

  return {
    avgResonance,
    conversionRate,
    earningPotential: payingUsers,
    survivalRate: Math.min(1, survivalRate)
  }
}

/**
 * Population Generation (Monte Carlo + Black Swan Injection)
 */
export function generatePopulation(seed: PopulationSeed, count: number = 10000): AgentDNA[] {
  const agents: AgentDNA[] = []
  const { mean, std, outliers } = seed

  if (outliers && outliers.length > 0) {
    const outlierCount = Math.min(Math.floor(count * 0.02), outliers.length * 20)
    for (let i = 0; i < outlierCount; i++) {
        const source = outliers[i % outliers.length]
        agents.push({
            id: `outlier-${uuidv4()}`,
            vector: source,
            resonance: 0,
            isOutlier: true
        })
    }
  }

  const remainingCount = count - agents.length
  for (let i = 0; i < remainingCount; i++) {
    const vector: Vector13D = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    for (let d = 0; d < 13; d++) {
      const u1 = Math.random()
      const u2 = Math.random()
      const z0 = Math.sqrt(-2.0 * Math.log(u1 + 1e-9)) * Math.cos(2.0 * Math.PI * u2)
      const val = mean[d] + z0 * std[d]
      vector[d] = Math.max(0, Math.min(1, val))
    }
    agents.push({
      id: uuidv4(),
      vector,
      resonance: 0
    })
  }
  return agents
}

/**
 * Core Epoch-based step function
 */
export async function stepSimulation(state: SandboxState): Promise<SandboxState> {
  const nextEpoch = state.epoch + 1
  
  const techDebtBump = state.teamSize === 'SOLO' ? 2 : state.teamSize === 'STARTUP' ? 5 : 10
  const nextTechDebt = state.techDebt + techDebtBump

  const weights: Vector13D = [1,1,1,1,1,1,1,1,1,1,1,1,1]
  const previousPaidUsers = state.metrics.earningPotential
  
  const updatedAgents = await runCollisionAsync(state.productVector, nextTechDebt, state.agents, previousPaidUsers, weights)
  // New: Pass full productVector to calculateMetrics for 13D funnel
  const metrics = calculateMetrics(updatedAgents, state.productVector, nextTechDebt, state.teamSize)

  return {
    ...state,
    epoch: nextEpoch,
    techDebt: nextTechDebt,
    agents: updatedAgents,
    metrics
  }
}
