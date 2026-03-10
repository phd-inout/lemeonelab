import { PrismaClient } from "@prisma/client"; console.log(new PrismaClient({ datasourceUrl: process.env.DATABASE_URL }))
