import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import {
    GameState,
    IndustryType,
    BusinessModel,
    FounderBackground,
    SprintResult,
    WeekLog,
    AhaMoment,
    AhaMomentType,
    GameOverResult,
    CompanyStage,
    DIM,
    ActionCard,
    ActionCardType
} from './engine/types'
import { createFounder, createCompany, calculateResonanceOutput, nextMarketDrift, stepTechDebt, calcMRR, calcBurnRate, checkGameOver } from './engine/simulator'
import { calibrateIdea, generateWeekNarrative, generateAhaMoment } from './engine/cortex-ai'
import { pickEventForWeek, applyEvent } from './engine/events'
import { fetchNewsAnalysis } from './engine/news-parser'
import { checkCompanyNameUnique, createRehearsal, syncRehearsal } from '../app/actions/rehearsal'

// ============================================================
// Store Interface
// ============================================================
interface LemeoneStore {
    gameState: GameState | null
    isRunning: boolean
    terminalLines: string[]

    initFounder: (background: FounderBackground, age: number, name?: string, customVector?: [number, number, number, number, number, number]) => void
    initCompany: (industry: IndustryType, businessModel: BusinessModel, ideaDescription: string, companyName: string, onLine: (line: string) => void) => Promise<void>
    sprintWeeks: (
        weeks: number,
        intensity: number,
        onLine: (line: string) => void
    ) => Promise<SprintResult | null>
    hire: (role: keyof typeof DIM, talent: number, salary: number) => void
    fire: (id: string) => void
    pivot: (newIndustry: IndustryType, newModel: BusinessModel) => { success: boolean, reason?: string }
    playCard: (cardId: string) => { success: boolean, reason?: string }
    dividend: (amount: number) => { success: boolean, reason?: string }
    parseNews: (query: string, onLine: (line: string) => void) => Promise<void>
    resetGame: () => void
    pushLine: (line: string) => void
}

// ============================================================
// Store Implementation
// ============================================================
export const useLemeoneStore = create<LemeoneStore>()(
    persist(
        (set, get) => ({
            gameState: null,
            isRunning: false,
            terminalLines: [],

            pushLine: (line: string) =>
                set(s => ({ terminalLines: [...s.terminalLines.slice(-500), line] })),

            initFounder: (background, age, name = 'Founder', customVector) => {
                const founder = createFounder(background, age, name)
                if (customVector) {
                    founder.vector = customVector
                }
                set({
                    gameState: {
                        id: uuidv4(),
                        founder,
                        company: null as any,
                        isFailed: false,
                        logs: [],
                    }
                })
            },

            initCompany: async (industry, businessModel, ideaDescription, companyName, onLine) => {
                const state = get().gameState
                if (!state?.founder) {
                    onLine('[ERROR] 请先执行 init-founder')
                    return
                }
                if (state.company) {
                    onLine('[ERROR] 公司已成立，无法再次初始化')
                    return
                }

                onLine('\n🔍 正在校验公司名称唯一性...')
                const isUnique = await checkCompanyNameUnique(companyName)
                if (!isUnique) {
                    onLine(`[ERROR] 公司名称 "${companyName}" 已被注册，请更换名称后重试。`)
                    return
                }

                onLine('\n⚡ CORTEX IDEA CALIBRATION 分析中...\n')

                const calibration = await calibrateIdea(ideaDescription, industry, businessModel)

                const company = createCompany(industry, businessModel, state.founder.background, companyName)
                company.moat = calibration.initialMoat
                company.ideaScore = calibration

                // 格式化 Calibration 输出
                const lines = [
                    `┌${'─'.repeat(50)}┐`,
                    `│  IDEA SCORE：${calibration.total} / 100`,
                    `│  痛点真实性    ${'█'.repeat(Math.round(calibration.painPointAcuity / 30 * 20)).padEnd(20, ' ')}  ${calibration.painPointAcuity}/30`,
                    `│  市场时机      ${'█'.repeat(Math.round(calibration.marketTiming / 25 * 20)).padEnd(20, ' ')}  ${calibration.marketTiming}/25`,
                    `│  创始人契合    ${'█'.repeat(Math.round(calibration.founderFit / 25 * 20)).padEnd(20, ' ')}  ${calibration.founderFit}/25`,
                    `│  差异化程度    ${'█'.repeat(Math.round(calibration.differentiationEdge / 20 * 20)).padEnd(20, ' ')}  ${calibration.differentiationEdge}/20`,
                    `│`,
                    `│  ${calibration.comment}`,
                    `│`,
                    `│  引擎参数已校准：`,
                    `│  → MRR 增长率    ${calibration.mrrGrowthMultiplier >= 1 ? `+${((calibration.mrrGrowthMultiplier - 1) * 100).toFixed(0)}%` : `${((calibration.mrrGrowthMultiplier - 1) * 100).toFixed(0)}%`}`,
                    `│  → 初始护城河    ${calibration.initialMoat}`,
                    `└${'─'.repeat(50)}┘`,
                ]
                lines.forEach(onLine)

                const finalState = { ...state, company } as GameState
                set({ gameState: finalState })

                try {
                    const sessionId = uuidv4() // Or fetch user auth session
                    const rehearsalId = await createRehearsal(sessionId, finalState)
                    set({ gameState: { ...finalState, id: rehearsalId } })
                } catch (e) {
                    onLine('[WARN] 存档写入数据库失败，本次游戏仅保存在本地缓存。')
                }
            },

            sprintWeeks: async (weeks, intensity, onLine) => {
                const state = get().gameState
                if (!state?.company) {
                    onLine('[ERROR] 请先执行 init-company')
                    return null
                }
                if (get().isRunning) {
                    onLine('[ERROR] Sprint 进行中')
                    return null
                }

                set({ isRunning: true })

                let current: GameState = JSON.parse(JSON.stringify(state))
                const weekLogs: WeekLog[] = []
                let gameOver: GameOverResult | undefined = undefined
                let ahaMoment: AhaMoment | undefined
                let promotion: { from: CompanyStage; to: CompanyStage } | undefined

                const mrrMulti = current.company.ideaScore?.mrrGrowthMultiplier ?? 1.0

                for (let week = 1; week <= weeks; week++) {
                    current.company.weekNumber++

                    // 事件选取
                    const event = await pickEventForWeek(current)
                    if (event) current = applyEvent(event, current)

                    // 数值步进
                    const outputRes = calculateResonanceOutput(
                        current.founder.vector,
                        current.company.marketVector,
                        current.company.techDebt,
                        current.founder.age,
                        current.company.staff
                    )
                    const progressDelta = outputRes.progressDelta

                    const newTechDebt = stepTechDebt(current.company.techDebt, 1.0)
                    const newMRR = calcMRR(current, mrrMulti)

                    // Receivables (应收款槽账期风险模拟)
                    const currentReceivables = current.company.receivables + newMRR
                    const collectionRate = 0.4 + Math.random() * 0.2
                    const collectedCash = Math.floor(currentReceivables * collectionRate)
                    const newReceivables = currentReceivables - collectedCash

                    const burnRate = calcBurnRate(current)
                    const cashDelta = collectedCash - burnRate

                    const newMarketVector = nextMarketDrift(current.company.marketVector, current.company.industry)

                    current = {
                        ...current,
                        company: {
                            ...current.company,
                            devProgress: Math.min(100, current.company.devProgress + progressDelta),
                            cash: current.company.cash + cashDelta,
                            mrr: newMRR,
                            receivables: newReceivables,
                            techDebt: newTechDebt,
                            marketVector: newMarketVector,
                            resonance: outputRes.resonance,
                        }
                    }

                    // Burnout update based on intensity
                    const stressDelta = intensity > 1.2 ? 25 : intensity > 1.0 ? 15 : -10
                    current.founder.bwStress = Math.min(100, Math.max(0, current.founder.bwStress + stressDelta))
                    let burnoutTriggered = false
                    if (current.founder.bwStress > 80) {
                        current.founder.bwStressStreak++
                        if (current.founder.bwStressStreak >= 4) {
                            burnoutTriggered = true
                            current.founder.bwStressStreak = 0
                            current.founder.bwStress = 50
                            const dimIndex = Math.floor(Math.random() * 6)
                            current.founder.vector[dimIndex] = Math.max(20, current.founder.vector[dimIndex] - 5)
                        }
                    } else {
                        current.founder.bwStressStreak = 0
                    }

                    // Ops Debt Entropy Tracker
                    const entropy = current.founder.vector[DIM.TEC] / Math.max(1, current.founder.vector[DIM.OPS])
                    if (entropy > 3.0 && current.company.techDebt > 60) {
                        current.company.opsDebtStreak++
                    } else {
                        current.company.opsDebtStreak = 0
                    }

                    // 发牌逻辑 (LRN 每周基础发牌率，上限 5 张)
                    let newCardReceived: ActionCard | undefined
                    if (current.company.actionCards.length < 5) {
                        const lrn = current.founder.vector[DIM.LRN]
                        if (Math.random() * 100 < (lrn * 0.5)) {
                            const types: ActionCardType[] = ['GEEK_SPRINT', 'VIRAL_MARKETING', 'TECH_REFACTOR']
                            const cType = types[Math.floor(Math.random() * types.length)]
                            const cardInfo: Record<ActionCardType, { name: string, desc: string }> = {
                                'GEEK_SPRINT': { name: '极客冲刺', desc: '下周进度提升，但积攒大量技术债并增加大量压力' },
                                'VIRAL_MARKETING': { name: '病毒式营销', desc: '强制增加账面资金与 MRR，大幅消耗带宽压力' },
                                'TECH_REFACTOR': { name: '架构重构', desc: '立即降低 20 点技术债，需占用大量带宽' }
                            }
                            newCardReceived = { id: uuidv4().substring(0, 8), type: cType, ...cardInfo[cType] }
                            current.company.actionCards.push(newCardReceived)
                        }
                    }

                    const weekLog: WeekLog = {
                        week,
                        progressDelta,
                        cashDelta,
                        techDebtDelta: newTechDebt - state.company.techDebt,
                        event: event ?? undefined,
                        narrative: '',
                    }
                    if (burnoutTriggered) {
                        weekLog.narrative += ' ⚠️ BURNOUT'
                    }

                    // AI 叙事（单独调用，失败不阻断）
                    const narrative = await generateWeekNarrative(current, weekLog, event ?? undefined)
                        .catch(() => `Week ${week}：推进中...`)
                    weekLog.narrative = narrative
                    weekLogs.push(weekLog)

                    // 终端输出
                    const cashSign = cashDelta >= 0 ? '+' : ''
                    const techDebtStr = newTechDebt > 70 ? ` ⚠️ 技术债 ${newTechDebt.toFixed(0)}` : ''
                    onLine(`\n[Week ${week}/${weeks}] 🔧`)
                    onLine(`  进度: +${progressDelta.toFixed(1)}%  →  ${current.company.devProgress.toFixed(1)}%`)
                    onLine(`  现金: ${cashSign}¥${cashDelta.toLocaleString()}  (剩余 ¥${current.company.cash.toLocaleString()})${techDebtStr}`)
                    if (burnoutTriggered) onLine(`  \x1b[31m⚠️ BURNOUT 触发！属性遭受不可逆损伤！\x1b[0m`)
                    if (event) onLine(`  [EVENT] ⚡ ${event.name}`)
                    if (newCardReceived) onLine(`  \x1b[33m[灵感] 获得行动卡：${newCardReceived.name}\x1b[0m`)
                    onLine(`  ${narrative}`)

                    // Game Over 检查
                    const go = checkGameOver(current)
                    if (go) {
                        gameOver = go
                        current.isFailed = true
                        current.failureReason = go.reason
                        break
                    }
                }

                // Sprint 总结
                const totalProg = weekLogs.reduce((s, w) => s + w.progressDelta, 0)
                const expected = weeks * 8
                const pct = ((totalProg / expected) * 100).toFixed(0)
                const under = totalProg < expected * 0.6

                onLine(`\n${'━'.repeat(40)}`)
                onLine(`Sprint 总结`)
                onLine(`  进度提升: +${totalProg.toFixed(1)}%${under ? ` ⚠️ 仅达预期 ${pct}%` : ' ✅'}`)
                onLine(`  现金余额: ¥${current.company.cash.toLocaleString()}`)
                onLine(`  应收款槽: ¥${current.company.receivables.toLocaleString()}`)
                onLine(`  技术债:   ${current.company.techDebt.toFixed(0)}/100`)
                onLine(`  MRR:      ¥${current.company.mrr.toLocaleString()}/月`)
                onLine(`  当前压力: ${current.founder.bwStress.toFixed(0)}/100 ${current.founder.bwStressStreak > 0 ? `(高压警告: 连读 ${current.founder.bwStressStreak} 周)` : ''}`)

                // 判断 Bad Decision
                if (under || (current.company.cash < current.company.burnRate * 4)) {
                    current.company.isPostBadDecision = true
                }

                const entropy = current.founder.vector[DIM.TEC] / Math.max(1, current.founder.vector[DIM.OPS])

                // Aha-Moment 优先级触发引擎
                if (!gameOver) {
                    let triggerType: AhaMomentType | null = null
                    let payload: any = null

                    if (current.company.opsDebtStreak >= 3) {
                        triggerType = 'OPS_DEBT_EXPLOSION'
                        payload = { entropy }
                    } else if (current.founder.bwStress > 95 && current.founder.bwStressStreak >= 2) {
                        triggerType = 'BURNOUT_INSIGHT'
                    } else if (under) {
                        triggerType = 'HARD_TRUTH'
                        payload = { expected, actual: totalProg }
                    } else if (current.company.isPostBadDecision && Math.random() < 0.08 * (1 + current.founder.vector[DIM.CHA] / 200)) {
                        triggerType = 'LUCKY_PIVOT'
                    }

                    if (triggerType) {
                        onLine(`\n[AHA-MOMENT] ⚡ CORTEX 分析 ${triggerType} 中...`)
                        const insight = await generateAhaMoment(triggerType, current, payload)
                            .catch(() => '分析完成：你需要立刻调整战略。')

                        let colorCode = '\x1b[31m' // Red default for harsh truth/crisis
                        if (triggerType === 'BURNOUT_INSIGHT') colorCode = '\x1b[33m' // Yellow
                        if (triggerType === 'LUCKY_PIVOT') colorCode = '\x1b[32m' // Green

                        onLine(`\n${colorCode}╔${'═'.repeat(48)}╗\x1b[0m`)
                        onLine(`${colorCode}║  AHA-MOMENT: ${triggerType.padEnd(34)}║\x1b[0m`)
                        onLine(`${colorCode}╠${'═'.repeat(48)}╣\x1b[0m`)
                        insight.split('\n').forEach(l => {
                            // simple wrap logic
                            const chunks = l.match(/.{1,44}/g) || ['']
                            chunks.forEach(chunk => onLine(`${colorCode}║\x1b[0m  ${chunk}`))
                        })
                        onLine(`${colorCode}╚${'═'.repeat(48)}╝\x1b[0m`)

                        ahaMoment = { type: triggerType, insight, referenceCase: '' }

                        // 重置触发条件
                        if (triggerType === 'OPS_DEBT_EXPLOSION') current.company.opsDebtStreak = 0
                        if (triggerType === 'LUCKY_PIVOT' || triggerType === 'HARD_TRUTH') current.company.isPostBadDecision = false
                    }
                }

                // 晋级
                if (!gameOver) {
                    if (current.company.stage === 'SEED' && current.company.devProgress >= 100) {
                        promotion = { from: 'SEED', to: 'MVP' }
                        current.company.stage = 'MVP'
                        onLine(`\n🎉 阶段晋级！SEED → MVP`)
                    } else if (current.company.stage === 'MVP' && current.company.mrr >= 5000) {
                        promotion = { from: 'MVP', to: 'PMF' }
                        current.company.stage = 'PMF'
                        onLine(`\n🎉 阶段晋级！MVP → PMF — 市场开始认可你`)
                    } else if (current.company.stage === 'PMF' && current.company.mrr >= 50000) {
                        promotion = { from: 'PMF', to: 'SCALE' }
                        current.company.stage = 'SCALE'
                        onLine(`\n🚀 阶段晋级！PMF → SCALE — 准备好起飞了吗`)
                    } else if (current.company.stage === 'SCALE' && current.company.mrr >= 500000) {
                        promotion = { from: 'SCALE', to: 'IPO' }
                        current.company.stage = 'IPO'
                        onLine(`\n🏛️ 阶段晋级！SCALE → IPO — 敲钟时刻！`)
                    } else if (current.company.stage === 'IPO' && current.company.mrr >= 5000000) {
                        promotion = { from: 'IPO', to: 'TITAN' }
                        current.company.stage = 'TITAN'
                        onLine(`\n👑 阶段晋级！IPO → TITAN — 您建造了一个商业帝国！`)
                    }
                } else {
                    onLine(`\n☠️  GAME OVER — ${gameOver.reason}`)
                    onLine(`   失败阶段：${gameOver.failedAtStage}，第 ${gameOver.failedAtWeek} 周`)
                }

                set({ gameState: current, isRunning: false })

                if (current.id) {
                    syncRehearsal(current.id, current).catch(e => console.error("Sync failed", e))
                }

                return {
                    finalState: current,
                    log: weekLogs,
                    ahaMoment,
                    promotion,
                    gameOver: gameOver ?? undefined,
                }
            },

            hire: (role, talent, salary) => {
                const state = get().gameState
                if (!state?.company) return
                const newStaff = {
                    id: uuidv4(),
                    role,
                    talent,
                    salary,
                    bwBonus: 0,
                    weeksEmployed: 0
                }
                set({
                    gameState: {
                        ...state,
                        company: {
                            ...state.company,
                            staff: [...state.company.staff, newStaff]
                        }
                    }
                })
            },

            fire: (id) => {
                const state = get().gameState
                if (!state?.company) return
                set({
                    gameState: {
                        ...state,
                        company: {
                            ...state.company,
                            staff: state.company.staff.filter(s => s.id !== id)
                        }
                    }
                })
            },

            pivot: (newIndustry, newModel) => {
                const state = get().gameState
                if (!state?.company) return { success: false, reason: '公司未成立' }

                const cost = state.company.stage === 'SEED' ? 20000 : 50000
                if (state.company.cash < cost) {
                    return { success: false, reason: `资金不足以支撑 Pivot (需要 ¥${cost.toLocaleString()})` }
                }

                set({
                    gameState: {
                        ...state,
                        company: {
                            ...state.company,
                            industry: newIndustry,
                            businessModel: newModel,
                            cash: state.company.cash - cost,
                            devProgress: Math.max(0, state.company.devProgress - 30), // Pivot 会丢失大量进度
                            techDebt: Math.min(100, state.company.techDebt + 20),     // 并产生技术债
                            mrr: Math.floor(state.company.mrr * 0.5)                  // 客户流失
                        }
                    }
                })
                return { success: true }
            },

            playCard: (cardId) => {
                const state = get().gameState
                if (!state?.company) return { success: false, reason: '未持有公司' }
                const cardIndex = state.company.actionCards.findIndex(c => c.id === cardId)
                if (cardIndex === -1) return { success: false, reason: '未找到该卡牌' }

                const card = state.company.actionCards[cardIndex]
                let s = JSON.parse(JSON.stringify(state)) as GameState

                if (card.type === 'GEEK_SPRINT') {
                    s.company.devProgress = Math.min(100, s.company.devProgress + 20)
                    s.company.techDebt += 20
                    s.founder.bwStress += 30
                } else if (card.type === 'VIRAL_MARKETING') {
                    s.company.mrr = Math.floor(s.company.mrr * 1.5) + 5000
                    s.company.cash += 20000
                    s.founder.bwStress += 20
                } else if (card.type === 'TECH_REFACTOR') {
                    s.company.techDebt = Math.max(0, s.company.techDebt - 20)
                    s.founder.bwStress += 20
                }

                s.company.actionCards.splice(cardIndex, 1)

                set({ gameState: s })
                return { success: true }
            },

            dividend: (amount) => {
                const state = get().gameState
                if (!state?.company) return { success: false, reason: '公司未成立' }
                if (amount <= 0) return { success: false, reason: '分红金额必须大于 0' }
                if (state.company.cash < amount) return { success: false, reason: '公司可动用现金不足' }

                const s = JSON.parse(JSON.stringify(state)) as GameState
                s.company.cash -= amount
                s.company.dividendsPaid = (s.company.dividendsPaid || 0) + amount
                s.founder.wealth = (s.founder.wealth || 0) + amount

                set({ gameState: s })

                if (s.id) {
                    syncRehearsal(s.id, s).catch(e => console.error("Sync failed", e))
                }

                return { success: true }
            },

            parseNews: async (query, onLine) => {
                const state = get().gameState
                if (!state?.company) {
                    onLine('[ERROR] 公司尚未成立，无法通过新闻校准市场向量')
                    return
                }

                onLine(`\\n🛰️ CORTEX 节点正在同步全球新闻与数据流: "${query}"...`)
                const analysis = await fetchNewsAnalysis(query)

                if (analysis.error) {
                    onLine(`\\x1b[31m[ERROR] ${analysis.headline}\\x1b[0m`)
                    onLine(`\\x1b[31m${analysis.commentary}\\x1b[0m`)
                    return
                }

                onLine(`\\n\\x1b[36m${'═'.repeat(40)}\\x1b[0m`)
                onLine(`\\x1b[36m新闻简报: ${analysis.headline}\\x1b[0m`)
                onLine(`\\x1b[30;1m${analysis.commentary}\\x1b[0m`)
                onLine(`\\x1b[36m${'─'.repeat(40)}\\x1b[0m`)

                let s = JSON.parse(JSON.stringify(state)) as GameState

                // We must use DIM from state correctly
                const impact = analysis.industry_impacts?.find(i => i.industry === s.company.industry)
                if (impact) {
                    const color = impact.type === 'POSITIVE' ? '\\x1b[32m' : impact.type === 'NEGATIVE' ? '\\x1b[31m' : '\\x1b[33m'
                    onLine(`\\n${color}预测影响 (${impact.type})：针对您的行业 ${s.company.industry}，市场需求发生如下重塑:\\x1b[0m`)

                    const p = impact.vector_perturbation
                    const mktDiff = p.mkt || 0
                    const tecDiff = p.tec || 0
                    const lrnDiff = p.lrn || 0
                    const finDiff = p.fin || 0
                    const opsDiff = p.ops || 0
                    const chaDiff = p.cha || 0

                    const diffs = [
                        `MKT: ${mktDiff > 0 ? '+' : ''}${mktDiff.toFixed(2)}`,
                        `TEC: ${tecDiff > 0 ? '+' : ''}${tecDiff.toFixed(2)}`,
                        `LRN: ${lrnDiff > 0 ? '+' : ''}${lrnDiff.toFixed(2)}`,
                        `FIN: ${finDiff > 0 ? '+' : ''}${finDiff.toFixed(2)}`,
                        `OPS: ${opsDiff > 0 ? '+' : ''}${opsDiff.toFixed(2)}`,
                        `CHA: ${chaDiff > 0 ? '+' : ''}${chaDiff.toFixed(2)}`
                    ].join(', ')
                    onLine(`   ${diffs}`)

                    s.company.marketVector[DIM.MKT] = Math.max(0.01, Math.min(1.0, s.company.marketVector[DIM.MKT] + mktDiff))
                    s.company.marketVector[DIM.TEC] = Math.max(0.01, Math.min(1.0, s.company.marketVector[DIM.TEC] + tecDiff))
                    s.company.marketVector[DIM.LRN] = Math.max(0.01, Math.min(1.0, s.company.marketVector[DIM.LRN] + lrnDiff))
                    s.company.marketVector[DIM.FIN] = Math.max(0.01, Math.min(1.0, s.company.marketVector[DIM.FIN] + finDiff))
                    s.company.marketVector[DIM.OPS] = Math.max(0.01, Math.min(1.0, s.company.marketVector[DIM.OPS] + opsDiff))
                    s.company.marketVector[DIM.CHA] = Math.max(0.01, Math.min(1.0, s.company.marketVector[DIM.CHA] + chaDiff))

                    set({ gameState: s })
                } else {
                    onLine(`  本次事件未对您的行业 (${s.company.industry}) 造成直接市场影响。`)
                }
            },

            resetGame: () => set({ gameState: null, terminalLines: [], isRunning: false }),
        }),
        { name: 'lemeone-v2', version: 3 }
    )
)
