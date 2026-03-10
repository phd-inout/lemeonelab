require('dotenv').config({ path: '.env' })
fetch(\`https://generativelanguage.googleapis.com/v1beta/models?key=\${process.env.GOOGLE_GENERATIVE_AI_API_KEY}\`)
  .then(r => r.json())
  .then(d => d.models.filter(m => m.supportedGenerationMethods.includes('embedContent')).map(m => m.name).forEach(m => console.log(m)))
