import { Vector13D, AgentDNA } from './types'

function calculateCosineSimilarity(v1: Vector13D, v2: Vector13D, weights?: Vector13D): number {
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

self.onmessage = (e: MessageEvent) => {
  const { productVector, techDebt, populationChunk, previousPaidUsers, weights } = e.data
  
  const lambda = 0.08
  const baseTechPenalty = Math.exp(-lambda * (techDebt / 100))
  const beta = 5.0
  const gamma = 0.0001
  const marketingSpend = productVector[12] * 100 
  const socialFactor = productVector[6] 
  
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
  const pAware = sigmoid(((beta * marketingSpend) + (gamma * socialFactor * previousPaidUsers)) - 5)

  const updatedChunk = populationChunk.map((agent: AgentDNA) => {
    const cosSim = calculateCosineSimilarity(productVector, agent.vector, weights)
    const rCos = Math.pow(Math.max(0, cosSim), 3)

    let magDiff = 0
    for(let i=0; i<12; i++) magDiff += Math.pow(productVector[i] - agent.vector[i], 2)
    const alpha = agent.isOutlier ? 1.5 : 0.8 
    const pDist = Math.exp(-alpha * magDiff)

    const pFriction = 1 - productVector[4]

    const userSensitivity = 0.5 + (rCos * 0.5) 
    const effectiveTechPenalty = Math.pow(baseTechPenalty, userSensitivity)

    const resonance = (rCos * pDist) * pAware * pFriction * effectiveTechPenalty

    return {
      ...agent,
      resonance
    }
  })

  self.postMessage(updatedChunk)
}
