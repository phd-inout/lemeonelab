"use server";

import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { ProjectData, SandboxState } from '@/lib/engine/types';
import { syncUserWithPrisma } from '@/lib/auth-sync';

/**
 * Creates a new Project for the user.
 */
export async function createProjectAction(name: string, description?: string): Promise<string> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            await syncUserWithPrisma(user);
        }

        const project = await prisma.project.create({
            data: {
                name,
                description,
                userId: user?.id || null,
            }
        });
        return project.id;
    } catch (e) {
        console.error("[DB] Failed to create project:", e);
        throw e;
    }
}

/**
 * Lists all Projects for the current user.
 */
export async function listProjectsAction(): Promise<ProjectData[]> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Allow fetching for anonymous users based on session/local if needed,
        // but typically projects are tied to user ID.
        if (!user) {
            return [];
        }

        const projects = await prisma.project.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        return projects.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || undefined,
            createdAt: p.createdAt.toISOString()
        }));
    } catch (e) {
        console.error("[DB] Failed to list projects:", e);
        return [];
    }
}

/**
 * Load the latest Rehearsal (SandboxState) for a project.
 */
export async function loadLatestRehearsalAction(projectId: string): Promise<any | null> {
    try {
        const rehearsal = await prisma.rehearsal.findFirst({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });

        if (!rehearsal) return null;

        // Note: agents are not persisted, frontend must handle re-hydration or starting without agents
        return {
            id: rehearsal.id,
            projectId: rehearsal.projectId,
            epoch: rehearsal.weekNumber,
            techDebt: rehearsal.techDebt,
            currentStage: rehearsal.currentStage,
            metrics: {
                earningPotential: rehearsal.cash,
                // other metrics are not fully stored per row yet, relying on historyJson 
            },
            productVector: rehearsal.productVector,
            assets: rehearsal.assets,
        };
    } catch (e) {
        console.error("[DB] Failed to load rehearsal:", e);
        return null;
    }
}
