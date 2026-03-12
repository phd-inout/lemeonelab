'use server'

import { prisma } from '@/lib/prisma'
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'
import { ACHIEVEMENTS } from '@/lib/engine/AchievementTracker'

export async function getUnlockedAchievements() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const records = await prisma.achievement.findMany({
        where: { userId: user.id },
        select: { achieveId: true }
    })
    return records.map((r: { achieveId: string }) => r.achieveId)
}

export async function unlockAchievements(achieveIds: string[], rehearsalId?: string) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    let totalPointsAwarded = 0
    const newlyUnlockedIds: string[] = []

    for (const aid of achieveIds) {
        const def = ACHIEVEMENTS.find(a => a.id === aid)
        if (!def) continue

        try {
            await prisma.achievement.create({
                data: {
                    userId: user.id,
                    rehearsalId,
                    achieveId: def.id,
                    name: def.name,
                    category: def.category,
                    labPoints: def.labPoints
                }
            })
            totalPointsAwarded += def.labPoints
            newlyUnlockedIds.push(def.id)
        } catch (e: any) {
            // 忽略唯一约束异常 (P2002)
            if (e.code === 'P2002') {
                continue
            }
            console.error('[unlockAchievements] Error:', e)
        }
    }

    return { success: true, newlyUnlockedIds, totalPointsAwarded }
}
