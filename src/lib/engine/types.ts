/**
 * Lemeone-lab 2.0: Core DNA & Vector Types
 * 12-Dimensional Gravity Sandbox Model
 */

// 12-D Normalized Vector (0.0 - 1.0)
export type Vector12D = [
  number, number, number, number, // Product Core: Performance, Depth, Interaction, Stability
  number, number, number, number, // Market: Friction, Unique, Social, Consistency
  number, number, number, number  // Future: Ecosystem, Barriers, Global, Curve
]

export type Vector13D = [
  ...Vector12D,
  number // D13: Perception / Awareness
]

export const DIM = {
  // Product Core (D1-D4)
  PERF: 0,
  DEPTH: 1,
  INTERACT: 2,
  STABLE: 3,
  // Market (D5-D8)
  FRICTION: 4,
  UNIQUE: 5,
  SOCIAL: 6,
  CONSISTENCY: 7,
  // Future (D9-D12)
  ECO: 8,
  BARRIER: 9,
  GLOBAL: 10,
  CURVE: 11,
  // Awareness (D13)
  AWARENESS: 12
} as const

/**
 * Agent DNA: The atomic unit of the 10,000 population
 */
export interface AgentDNA {
  id: string
  vector: Vector12D
  resonance: number // Cached result from last collision
  isOutlier?: boolean // 黑天鹅样本标记
}

/**
 * Product & Competition
 */
export interface ProductVector {
  name: string
  vector: Vector12D
  price: number 
}

export type CompanyStage = 'SEED' | 'MVP' | 'PMF' | 'SCALE' | 'IPO' | 'TITAN'
export type UserTier = 'FREE' | 'PRO' | 'ULTRA' | 'ENTERPRISE'

export const TIER_LIMITS: Record<UserTier, { maxAgents: number; maxAuditsPerWeek: number }> = {
  FREE: { maxAgents: 100, maxAuditsPerWeek: 1 },
  PRO: { maxAgents: 10000, maxAuditsPerWeek: 10 },
  ULTRA: { maxAgents: 50000, maxAuditsPerWeek: 50 },
  ENTERPRISE: { maxAgents: 200000, maxAuditsPerWeek: 999 },
}

/**
 * Rehearsal State (System 1)
 */
export interface SandboxState {
  id: string
  tier: UserTier 
  epoch: number
  cash: number
  burnRate: number 
  techDebt: number
  currentStage: CompanyStage
  productVector: Vector13D
  agents: AgentDNA[] 
  
  metrics: {
    avgResonance: number
    conversionRate: number
    earningPotential: number // Paying Users (Int)
    survivalRate: number
  }

  assets: {
    proposal: string
    backlog: string
    marketFeedback: string
    stressTestReport: string
    journal: string
  }

  // Historical Timeline for Charts
  history: {
    epoch: number
    users: number
    resonance: number
    survival: number
  }[]
}

/**
 * Seed Definition for Population Generation (Dual-Track)
 */
export interface PopulationSeed {
  mean: Vector13D     
  std: Vector13D      
  weights: Vector13D  
  outliers: Vector12D[] 
  evidences?: Record<string, string> 
}

export interface AuditReport {
  stressPoint: string
  dominantDNA: string
  backlogDraft: string
}
