import {
  Vector14D,
  AgentDNA,
  SandboxState,
  PopulationSeed,
} from './types'
import { v4 as uuidv4 } from 'uuid'
import * as drta from '@lemeone/drta-engine'

/**
 * System 1: DRTA Gravity Engine
 * Optimized DRTA 2.5: 14-Dimensional Decoupled Funnel
 * 
 * Note: Core physics logic has been moved to @lemeone/drta-engine 
 * to ensure mathematical consistency across platforms.
 */

// Wrappers for backward compatibility within the main app
export function calculateCosineSimilarity(v1: Vector14D, v2: Vector14D, weights?: Vector14D): number {
  return drta.calculateCosineSimilarity(v1, v2, weights)
}

export function runCollision(
  productVector: Vector14D,
  techDebt: number,
  population: AgentDNA[],
  previousPaidUsers: number,
  weights: Vector14D = [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
): AgentDNA[] {
  return drta.runCollision(productVector, techDebt, population, previousPaidUsers, weights) as AgentDNA[]
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
    monetization: { model: any; hardwarePrice: number; monthlyFee: number } = { model: 'SUBSCRIPTION', hardwarePrice: 0, monthlyFee: 45 }
) {
  return drta.calculateMetrics(population as any, productVector, techDebt, teamSize, previousActiveUsers, monetization as any)
}

export async function stepSimulation(state: SandboxState): Promise<SandboxState> {
  const nextEpoch = state.epoch + 1;
  const weights: Vector14D = [1,1,1,1,1,1,1,1,1,1,1,1,1,1];
  const previousActiveUsers = state.metrics.activePaidUserCount || 0;
  const userDensity = state.agents.length > 0 ? previousActiveUsers / state.agents.length : 0;

  const nextProductVector = [...state.productVector] as Vector14D;
  const performanceBonus = Math.max(0, (state.metrics.avgResonance || 0) - 0.3) * 0.01;
  nextProductVector[8] = Math.min(1.0, (nextProductVector[8] || 0) + performanceBonus); // D9 consistency
  nextProductVector[6] = Math.min(1.0, (nextProductVector[6] || 0) + (userDensity * 0.5)); // D7 Unique

  // Clone agents to avoid mutating the input state (immutability)
  let agentsClone = state.agents.map(a => ({ ...a, vector: [...a.vector] as Vector14D }));

  if (userDensity > 0.01) { 
      agentsClone.forEach(agent => {
          if (Math.random() < 0.05) { 
              for(let d=0; d<13; d++) { // Market shaping up to Curve
                  agent.vector[d] = agent.vector[d] * 0.998 + nextProductVector[d] * 0.002;
              }
          }
      });
  }

  const viralGrowth = (state.productVector[7] || 0) * userDensity * 0.8; // D8 Social
  nextProductVector[13] = Math.min(1.0, (nextProductVector[13] || 0) + viralGrowth + 0.002);

  const teamSize = (state as any).teamSize || 'STARTUP';
  const techDebtBump = teamSize === 'SOLO' ? 1 : teamSize === 'STARTUP' ? 3 : 8;
  const nextTechDebt = state.techDebt + techDebtBump;

  const updatedAgents = await runCollisionAsync(nextProductVector, nextTechDebt, agentsClone, previousActiveUsers, weights);
  const metrics = calculateMetrics(updatedAgents, nextProductVector, nextTechDebt, teamSize, previousActiveUsers, state.monetization);

  return {
    ...state,
    epoch: nextEpoch,
    techDebt: nextTechDebt,
    productVector: nextProductVector,
    agents: updatedAgents,
    metrics: metrics as any,
    history: [...(state.history || []), {
        epoch: nextEpoch,
        users: metrics.earningPotential,
        resonance: metrics.avgResonance,
        survival: metrics.survivalRate,
        conversion: metrics.conversionRate,
        mrr: metrics.mrr
    }]
  }
}

export function generatePopulation(seed: PopulationSeed, count: number = 10000): AgentDNA[] {
  return drta.generatePopulation(seed, count, uuidv4) as AgentDNA[]
}
