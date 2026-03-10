"use server";

import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { GameState } from '@/lib/engine/types'

// Use a global to prevent multiple connections during hot reloading in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Check if a company name already exists in the database.
 * We look through the companyJson objects of existing rehearsals.
 */
export async function checkCompanyNameUnique(name: string): Promise<boolean> {
    try {
        // Find if any rehearsal has this exact company name
        const existing = await prisma.rehearsal.findFirst({
            where: {
                companyJson: {
                    path: ['name'],
                    equals: name
                }
            }
        });
        return existing === null;
    } catch (e) {
        console.error("Failed to check company name uniqueness", e);
        return true; // fail open if DB is not reachable for some reason
    }
}

/**
 * Creates a brand new Rehearsal record after the company is initialized.
 */
export async function createRehearsal(sessionId: string, gameState: GameState): Promise<string> {
    try {
        const rehearsal = await prisma.rehearsal.create({
            data: {
                sessionId,
                founderJson: gameState.founder as any,
                companyJson: gameState.company as any,
                currentStage: gameState.company.stage,
                weekNumber: gameState.company.weekNumber,
                isFailed: gameState.isFailed,
                failureReason: gameState.failureReason,
                ideaScore: gameState.company.ideaScore?.total,
                ideaJson: gameState.company.ideaScore as any,
                logsJson: gameState.logs as any
            }
        });
        return rehearsal.id;
    } catch (e) {
        console.error("Failed to create rehearsal", e);
        throw e;
    }
}

/**
 * Synchronizes the running GameState to the database during sprints or dividends.
 */
export async function syncRehearsal(rehearsalId: string, gameState: GameState): Promise<void> {
    if (!rehearsalId) return;

    try {
        await prisma.rehearsal.update({
            where: { id: rehearsalId },
            data: {
                founderJson: gameState.founder as any,
                companyJson: gameState.company as any,
                currentStage: gameState.company.stage,
                weekNumber: gameState.company.weekNumber,
                isFailed: gameState.isFailed,
                failureReason: gameState.failureReason,
                logsJson: gameState.logs as any
            }
        });
    } catch (e) {
        console.error("Failed to sync rehearsal", e);
    }
}
