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

    const seedPath = path.join(__dirname, 'cases.json')
    const rawData = fs.readFileSync(seedPath, 'utf8')
    const cases = JSON.parse(rawData)

    console.log(`[Seed] Found ${cases.length} business cases to seed into pgvector...`)

    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`)

    for (const c of cases) {
        console.log(`[Seed] Vectorizing case: ${c.name}`)

        const title = c.name
        const content = `Industry: ${c.industry}\nSummary: ${c.summary}\nLessons: ${c.keyLessons.join(', ')}`
        const tags = c.metadata.tags

        const contentToEmbed = `Company: ${title}\n${content}\nTags: ${tags.join(', ')}`

        const { embedding } = await embed({
            model: google.textEmbeddingModel('gemini-embedding-001'),
            value: contentToEmbed
        })

        await client.query(
            `
            INSERT INTO "BusinessCase" (id, title, content, tags, embedding)
            VALUES ($1, $2, $3, $4, $5::vector)
            ON CONFLICT (id) DO UPDATE SET 
                title = EXCLUDED.title,
                content = EXCLUDED.content,
                tags = EXCLUDED.tags,
                embedding = EXCLUDED.embedding;
            `,
            [
                c.id,
                title,
                content,
                tags,
                `[${embedding.join(',')}]`
            ]
        )
    }

    console.log('[Seed] BusinessCase Seeding completed.')
    await client.end()
}

main().catch((e) => {
    console.error('[Seed Error]', e)
    process.exit(1)
})
