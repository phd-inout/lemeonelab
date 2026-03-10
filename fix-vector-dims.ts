import { config } from 'dotenv'
import path from 'path'
config({ path: path.join(process.cwd(), '.env.local'), override: true })
config({ path: path.join(process.cwd(), '.env') })
import { Client } from 'pg'

async function main() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    })
    await client.connect()
    console.log('Connected. Dropping and recreating vector columns...')

    await client.query(`
        ALTER TABLE "GameEventTemplate" DROP COLUMN IF EXISTS embedding;
        ALTER TABLE "GameEventTemplate" ADD COLUMN embedding vector(3072);
        ALTER TABLE "BusinessCase" DROP COLUMN IF EXISTS embedding;
        ALTER TABLE "BusinessCase" ADD COLUMN embedding vector(3072);
    `)
    console.log('Columns recreated. ✓')
    await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
