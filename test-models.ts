import { config } from 'dotenv'
config({ path: '.env' })
async function main() {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`)
    const d = await r.json()
    if (!d.models) {
        console.error(d)
        return
    }
    const em = d.models.filter((m: any) => m.supportedGenerationMethods.includes('embedContent')).map((m: any) => m.name)
    console.log("Embedding models:", em)
}
main()
