import { GameState, GameEvent, CompanyStage, DIM } from './types'

// 事件冷却追踪（内存级，Per session）
const eventCooldowns: Map<string, number> = new Map()

async function loadEventsForStage(stage: CompanyStage): Promise<GameEvent[]> {
    const stageMap: Record<CompanyStage, string> = {
        SEED: 'seed',
        MVP: 'mvp',
        PMF: 'pmf',
        SCALE: 'scale',
        IPO: 'ipo',
        TITAN: 'titan',
        LIFESTYLE_EMPIRE: 'lifestyle_empire',
    }
    const file = stageMap[stage] ?? 'seed'

    try {
        // 动态 import JSON（Next.js 兼容）
        const events = await import(`./events/${file}.json`)
        return events.default as GameEvent[]
    } catch {
        // fallback：SEED 事件兜底
        const seed = await import('./events/seed.json')
        return seed.default as GameEvent[]
    }
}

/**
 * 每周事件选取（V1 概率池）
 */
export async function pickEventForWeek(
    state: GameState
): Promise<GameEvent | null> {
    const events = await loadEventsForStage(state.company.stage)
    const currentWeek = state.company.weekNumber

    // 过滤：冷却期内的事件跳过
    const available = events.filter(event => {
        const lastTriggered = eventCooldowns.get(event.id)
        if (!lastTriggered) return true
        return currentWeek - lastTriggered >= event.cooldownWeeks
    })

    // 概率随机选取（每个事件独立判定）
    for (const event of available) {
        let finalProb = event.baseProbability

        if (event.probabilityModifiers) {
            for (const mod of event.probabilityModifiers) {
                const dimIdx = DIM[mod.targetDim] as number
                if (state.founder.vector[dimIdx] >= mod.threshold) {
                    finalProb *= mod.multiplier
                }
            }
        }

        if (Math.random() < finalProb) {
            eventCooldowns.set(event.id, currentWeek)
            return event
        }
    }

    return null
}

/**
 * 将事件效果应用到游戏状态
 */
export function applyEvent(event: GameEvent, state: GameState): GameState {
    const newState = JSON.parse(JSON.stringify(state)) as GameState

    for (const effect of event.effects) {
        const target = effect.target

        if (target === 'bwStress') {
            newState.founder.bwStress = Math.min(100, Math.max(0,
                newState.founder.bwStress + effect.delta
            ))
        } else if (target === 'founderAttr' && effect.attrIndex !== undefined) {
            newState.founder.vector[effect.attrIndex] = Math.min(100, Math.max(20,
                newState.founder.vector[effect.attrIndex] + effect.delta
            ))
        } else if (target in newState.company) {
            const key = target as keyof typeof newState.company
            const current = newState.company[key]
            if (typeof current === 'number') {
                // @ts-ignore
                newState.company[key] = Math.max(0, current + effect.delta)
            }
        }
    }

    return newState
}
