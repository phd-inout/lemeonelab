import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'
config({ path: path.join(process.cwd(), '.env.local'), override: true })
config({ path: path.join(process.cwd(), '.env') })

import { Client } from 'pg'
import { embed } from 'ai'
import { google } from '@ai-sdk/google'

async function main() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    })
    await client.connect()

    // Load local seed JSON
    const seedPath = path.join(__dirname, 'seed.json')
    const rawData = fs.readFileSync(seedPath, 'utf8')
    const events = JSON.parse(rawData)

    console.log(`[Seed] Found ${events.length} events to seed into pgvector...`)

    // Ensure pgvector extension is available 
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`)

    for (const event of events) {
        console.log(`[Seed] Vectorizing event: ${event.name}`)

        // Combine name and narrative prompt for better semantic matching
        const contentToEmbed = `Event Name: ${event.name}\nDescription: ${event.narrativePrompt}`

        const { embedding } = await embed({
            model: google.textEmbeddingModel('gemini-embedding-001'),
            value: contentToEmbed
        })

        await client.query(
            `
            INSERT INTO "GameEventTemplate" (id, name, stage, category, "baseProbability", "effectsJson", "narrativePrompt", "cooldownWeeks", embedding)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9::vector)
            ON CONFLICT (id) DO UPDATE SET 
                name = EXCLUDED.name,
                stage = EXCLUDED.stage,
                category = EXCLUDED.category,
                "baseProbability" = EXCLUDED."baseProbability",
                "effectsJson" = EXCLUDED."effectsJson",
                "narrativePrompt" = EXCLUDED."narrativePrompt",
                "cooldownWeeks" = EXCLUDED."cooldownWeeks",
                embedding = EXCLUDED.embedding;
            `,
            [
                event.id,
                event.name,
                event.stage,
                event.category,
                event.baseProbability,
                JSON.stringify(event.effects),
                event.narrativePrompt,
                event.cooldownWeeks,
                `[${embedding.join(',')}]`
            ]
        )
    }

    console.log('[Seed] Seeding completed.')
    await client.end()
}

main()
    .catch((e) => {
        console.error('[Seed Error]', e)
        process.exit(1)
    })
