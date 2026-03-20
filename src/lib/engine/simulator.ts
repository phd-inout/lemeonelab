import {
  Vector13D,
  AgentDNA,
  SandboxState,
  PopulationSeed,
} from './types'
import { v4 as uuidv4 } from 'uuid'

/**
 * System 1: DRTA Gravity Engine
 * Optimized DRTA 2.1: Weighted Resonance & Black Swan Logic
 */

// Cosine Similarity with Weights
export function calculateCosineSimilarity(v1: Vector13D, v2: Vector13D, weights?: Vector13D): number {
  let dotProduct = 0
  let mag1 = 0
  let mag2 = 0
  // Calculate similarity based on the first 12 core semantic features
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
 * Formula: R_i = SharpenedCosSim(V_p, V_u, W) * DistancePenalty * TechDebtPenalty
 */
export function runCollision(
  productVector: Vector13D,
  techDebt: number,
  population: AgentDNA[],
  previousPaidUsers: number,
  weights: Vector13D = [1,1,1,1,1,1,1,1,1,1,1,1,1]
): AgentDNA[] {
  const lambda = 0.08
  const baseTechPenalty = Math.exp(-lambda * (techDebt / 100))
  
  // P_aware constants
  const beta = 3.0
  const gamma = 0.001
  const marketingSpend = productVector[12] * 100 // mapped from 0-1 to 0-100
  const socialFactor = productVector[6] // D7
  
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
  // Calculate Base Awareness Probability for this epoch
  // Base organic awareness floor prevents cold-start death spiral
  const baseOrganic = 0.05
  const marketingAwareness = sigmoid(((beta * marketingSpend) + (gamma * socialFactor * previousPaidUsers)) - 3)
  const pAware = Math.min(1, baseOrganic + marketingAwareness)

  return population.map(agent => {
    // 1. R_cos (Directional Consistency)
    const cosSim = calculateCosineSimilarity(productVector, agent.vector, weights)
    const rCos = Math.pow(Math.max(0, cosSim), 3)

    // 2. P_dist (Over-engineering Penalty)
    let magDiff = 0
    for(let i=0; i<12; i++) magDiff += Math.pow(productVector[i] - agent.vector[i], 2)
    const alpha = agent.isOutlier ? 1.5 : 0.8 // Damping factor
    const pDist = Math.exp(-alpha * magDiff)

    // 3. Friction (D5) 
    const pFriction = 1 - productVector[4]

    // 4. Dynamic Tech Debt Impact
    const userSensitivity = 0.5 + (rCos * 0.5) 
    const effectiveTechPenalty = Math.pow(baseTechPenalty, userSensitivity)

    // W_i Formula
    const resonance = (rCos * pDist) * pAware * pFriction * effectiveTechPenalty

    return {
      ...agent,
      resonance
    }
  })
}

/**
 * Async wrapper for runCollision using Web Workers
 */
export async function runCollisionAsync(
  productVector: Vector13D,
  techDebt: number,
  population: AgentDNA[],
  previousPaidUsers: number,
  weights: Vector13D = [1,1,1,1,1,1,1,1,1,1,1,1,1]
): Promise<AgentDNA[]> {
  if (typeof window === 'undefined' || !window.Worker) {
    // Fallback if SSR or no Worker support
    return runCollision(productVector, techDebt, population, previousPaidUsers, weights)
  }

  return new Promise((resolve) => {
    // Basic implementation: 1 worker. 
    const worker = new Worker(new URL('./collision.worker.ts', import.meta.url))
    worker.onmessage = (e) => {
      resolve(e.data)
      worker.terminate()
    }
    worker.postMessage({
      productVector, techDebt, populationChunk: population, previousPaidUsers, weights
    })
  })
}

/**
 * Population Generation (Monte Carlo + Black Swan Injection)
 */
export function generatePopulation(seed: PopulationSeed, count: number = 10000): AgentDNA[] {
  const agents: AgentDNA[] = []
  const { mean, std, outliers } = seed

  // 1. Inject Black Swans (Outliers) from Research Docs (approx 2%)
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

  // 2. Generate Regular Population
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
 * Calculate macro metrics
 */
/**
 * Calculate macro metrics based on T+X Logic
 */
export function calculateMetrics(population: AgentDNA[], techDebt: number, teamSize: string) {
  const totalResonance = population.reduce((sum, a) => sum + a.resonance, 0)
  const avgResonance = totalResonance / population.length

  // Paying Users are agents with Resonance > 0.5
  const payingUsers = population.filter(a => a.resonance > 0.5).length
  const conversionRate = payingUsers / population.length

  // Earning Potential replaces static Cash input
  const earningPotential = payingUsers

  // Survival Rate based on implicit costs linked to teamSize and techDebt
  const costFactor = teamSize === 'ENTERPRISE' ? 0.7 : teamSize === 'STARTUP' ? 0.4 : 0.1
  // If conversion is too low compared to costs, survival plummets
  const survivalRate = Math.max(0, 1 - costFactor - (techDebt / 100)) * (conversionRate * 10)

  return {
    avgResonance,
    conversionRate,
    earningPotential,
    survivalRate: Math.min(1, survivalRate)
  }
}

/**
 * Core Epoch-based step function
 */
export async function stepSimulation(state: SandboxState): Promise<SandboxState> {
  const nextEpoch = state.epoch + 1
  
  // Implicit tech debt accumulation based on team size over time
  const techDebtBump = state.teamSize === 'SOLO' ? 2 : state.teamSize === 'STARTUP' ? 5 : 10
  const nextTechDebt = state.techDebt + techDebtBump

  // Apply Epoch specific weights if needed
  const weights: Vector13D = [1,1,1,1,1,1,1,1,1,1,1,1,1]
  if (nextEpoch === 1) {
      // T+1 Market Diffusion Phase: D4(INTERACT) & D5(FRICTION) heavily weighted
      weights[2] = 2; // INT
      weights[4] = 2; // FRC
  } else if (nextEpoch >= 2) {
      // T+2 Maturity Phase: TechDebt penalty is fully exposed
  }

  const previousPaidUsers = state.metrics.earningPotential
  const updatedAgents = await runCollisionAsync(state.productVector, nextTechDebt, state.agents, previousPaidUsers, weights)
  const metrics = calculateMetrics(updatedAgents, nextTechDebt, state.teamSize)

  return {
    ...state,
    epoch: nextEpoch,
    techDebt: nextTechDebt,
    agents: updatedAgents,
    metrics
  }
}
