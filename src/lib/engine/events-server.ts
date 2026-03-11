"use server"

import { Client } from 'pg'
import { embed } from 'ai'
import { google } from '@ai-sdk/google'
import { GameEvent, GameState } from './types'

function stateToNaturalLanguage(state: GameState): string {
    const { founder, company } = state
    const entropy = founder.vector[1] / Math.max(1, founder.vector[4])
    return `
    Startup Profile:
    - Founder Background: ${founder.background}
    - Founder Age: ${founder.age}
    - Founder Core Strengths (out of 100): Marketing ${founder.vector[0].toFixed(0)}, Tech ${founder.vector[1].toFixed(0)}, Learning ${founder.vector[2].toFixed(0)}, Finance ${founder.vector[3].toFixed(0)}, Ops ${founder.vector[4].toFixed(0)}, Charisma ${founder.vector[5].toFixed(0)}
    - Stress Level: ${founder.bwStress.toFixed(0)}/100
    - Company Stage: ${company.stage}
    - Industry: ${company.industry}
    - Cash on Hand: ¥${company.cash} (Burn Rate: ¥${company.burnRate})
    - Current MRR: ¥${company.mrr}
    - Tech Debt: ${company.techDebt.toFixed(0)}/100
    - Moat: ${company.moat.toFixed(0)}/100
    - Team Size: ${company.staff.length}
    - Entropy Score (Tech/Ops ratio): ${entropy.toFixed(2)}
    `.trim()
}

export async function fetchSemanticEvents(state: GameState, topK: number = 5): Promise<GameEvent[]> {
    const textSnapshot = stateToNaturalLanguage(state)
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY in environment variables");
    }

    const { embedding } = await embed({
        model: google.textEmbeddingModel('gemini-embedding-001'),
        value: textSnapshot
    })

    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    })
    await client.connect()

    try {
        // Find topK nearest neighbor events for the given stage
        const res = await client.query(`
            SELECT id, name, stage, category, "baseProbability", "effectsJson", "narrativePrompt", "cooldownWeeks"
            FROM "GameEventTemplate"
            WHERE $1 = ANY(stage)
            ORDER BY embedding <=> $2::vector
            LIMIT $3;
        `, [state.company.stage, `[${embedding.join(',')}]`, topK])

        return res.rows.map(row => ({
            id: row.id,
            name: row.name,
            stage: row.stage,
            category: row.category,
            baseProbability: row.baseProbability,
            effects: row.effectsJson,
            narrativePrompt: row.narrativePrompt,
            cooldownWeeks: row.cooldownWeeks
        }))
    } finally {
        await client.end()
    }
}
