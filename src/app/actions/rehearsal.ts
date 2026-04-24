"use server";

import { v4 as uuidv4 } from 'uuid'
import { SandboxState } from '@/lib/engine/types'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { syncUserWithPrisma } from '@/lib/auth-sync'

/**
 * Creates a brand new Rehearsal record for the 2.0 Gravity Sandbox.
 */
export async function createRehearsal(sessionId: string, projectId: string, state: SandboxState): Promise<string> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            await syncUserWithPrisma(user);
        }

        const rehearsal = await prisma.rehearsal.create({
            data: {
                sessionId,
                userId: user?.id || null,
                projectId,
                productVector: state.productVector as any,
                assets: state.assets as any,
                cash: state.metrics.earningPotential,
                techDebt: state.techDebt,
                weekNumber: state.epoch,
                currentStage: state.currentStage,
                isFailed: false
            }
        });
        return rehearsal.id;
    } catch (e) {
        console.error("[DB] Failed to create rehearsal:", e);
        throw e;
    }
}

/**
 * Synchronizes the SandboxState to Supabase.
 */
export async function syncRehearsal(rehearsalId: string, state: SandboxState): Promise<void> {
    if (!rehearsalId) return;

    try {
        await prisma.rehearsal.update({
            where: { id: rehearsalId },
            data: {
                productVector: state.productVector as any,
                assets: state.assets as any,
                cash: state.metrics.earningPotential,
                techDebt: state.techDebt,
                weekNumber: state.epoch,
                currentStage: state.currentStage,
            }
        });
    } catch (e) {
        console.error("[DB] Failed to sync rehearsal:", e);
    }
}
