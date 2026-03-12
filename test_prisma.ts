import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    try {
        await prisma.rehearsal.create({
            data: {
                sessionId: "test",
                founderJson: {},
                companyJson: {},
                currentStage: "SEED",
                weekNumber: 0,
                isFailed: false,
                logsJson: []
            }
        })
        console.log("Success")
    } catch(e) {
        console.error("Error:", e)
    }
}
main()
