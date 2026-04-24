import { prisma } from './prisma';
import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Ensures that a Supabase user exists in the Prisma User table.
 * If the user exists, it updates their email.
 * If not, it creates a new record.
 */
export async function syncUserWithPrisma(user: SupabaseUser | null) {
    if (!user) return null;

    return await prisma.user.upsert({
        where: { id: user.id },
        update: { 
            email: user.email!,
        },
        create: {
            id: user.id,
            email: user.email!,
            username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            tier: 'FREE' // Default tier
        }
    });
}
