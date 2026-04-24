import { Vector14D, AgentDNA } from './types'

function calculateCosineSimilarity(v1: Vector14D, v2: Vector14D, weights?: Vector14D): number {
  let dotProduct = 0
  let mag1 = 0
  let mag2 = 0
  for (let i = 0; i < 14; i++) {
    const w = weights ? weights[i] : 1
    dotProduct += (v1[i] * v2[i] * w)
    mag1 += (v1[i] * v1[i] * w)
    mag2 += (v2[i] * v2[i] * w)
  }
  const denominator = Math.sqrt(mag1) * Math.sqrt(mag2)
  return denominator === 0 ? 0 : Math.min(1, dotProduct / denominator)
}

self.onmessage = (e: MessageEvent) => {
  const { productVector, techDebt, populationChunk, previousPaidUsers, weights } = e.data
  
  const lambda = 0.08
  const baseTechPenalty = Math.exp(-lambda * (techDebt / 100))
  const beta = 3.0
  const gamma = 0.001
  const marketingSpend = productVector[13] * 100 
  const socialFactor = productVector[7] 
  
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
  const baseOrganic = 0.05
  const marketingAwareness = sigmoid(((beta * marketingSpend) + (gamma * socialFactor * previousPaidUsers)) - 3)
  const pAware = Math.min(1, baseOrganic + marketingAwareness)

  const updatedChunk = populationChunk.map((agent: AgentDNA) => {
    const cosSim = calculateCosineSimilarity(productVector, agent.vector as any, weights)
    const rCos = Math.pow(Math.max(0, cosSim), 3)

    let magDiff = 0
    for(let i=0; i<13; i++) magDiff += Math.pow(productVector[i] - agent.vector[i], 2)
    const alpha = agent.isOutlier ? 1.5 : 0.8 
    const pDist = Math.exp(-alpha * magDiff)

    const entryEase = productVector[4]

    const userSensitivity = 0.5 + (rCos * 0.5) 
    const effectiveTechPenalty = Math.pow(baseTechPenalty, userSensitivity)

    const resonance = (rCos * pDist) * pAware * entryEase * effectiveTechPenalty

    return {
      ...agent,
      resonance
    }
  })

  self.postMessage(updatedChunk)
}
