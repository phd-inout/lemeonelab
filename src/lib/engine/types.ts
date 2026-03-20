/**
 * Lemeone-lab 2.0: Core DNA & Vector Types
 // 14-D Normalized Vector (0.0 - 1.0)
 export type Vector14D = [
   number, number, number, number, // Product Core: D1-D4
   number,                         // D5: Entry Ease (1.0 = Smooth, 0.0 = Hard)
   number,                         // D6: Monetization Pressure (1.0 = Mandatory, 0.0 = Optional)
   number, number, number,         // Market: Unique, Social, Consistency (D7-D9)
   number, number, number, number, // Future: Ecosystem, Barriers, Global, Curve (D10-D13)
   number                          // D14: Awareness
 ]

 export const DIM = {
   PERF: 0, DEPTH: 1, INTERACT: 2, STABLE: 3,
   ENTRY: 4,      // D5
   MONETIZE: 5,   // D6
   UNIQUE: 6,     // D7
   SOCIAL: 7,     // D8
   CONSISTENCY: 8, // D9
   ECO: 9, BARRIER: 10, GLOBAL: 11, CURVE: 12,
   AWARENESS: 13  // D14
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
    earningPotential: number // 本周付费用户总数
    survivalRate: number
    activePaidUserCount: number // 持久化留存用户数
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
