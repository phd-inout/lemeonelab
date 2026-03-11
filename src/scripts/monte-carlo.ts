import { createFounder, createCompany, runSprint } from '../lib/engine/simulator'
import { FounderBackground, IndustryType, BusinessModel, GameState, SprintResult } from '../lib/engine/types'
import { v4 as uuidv4 } from 'uuid'

// 随机选择辅助函数
function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

const BACKGROUNDS: FounderBackground[] = ['FRESH_GRAD', 'CORPORATE_REFUGEE', 'SERIAL_PRO', 'INDUSTRY_VETERAN', 'PLAIN_STARTER']
const INDUSTRIES: IndustryType[] = ['AI_SAAS', 'DTC_ECOM', 'WEB3_GAMING', 'BIOTECH', 'CREATOR_ECONOMY', 'B2B_ENTERPRISE']
const MODELS: BusinessModel[] = ['SUBSCRIPTION_SAAS', 'USAGE_BASED', 'MARKETPLACE', 'ONE_TIME_LICENSE', 'FREEMIUM']

const RUNS = 100
const MAX_SPRINTS = 100 // 最大 100 个 4周 sprint (400 周)
const SPRINT_WEEKS = 4

interface RunResult {
    id: string
    founderBg: FounderBackground
    industry: IndustryType
    model: BusinessModel
    finalStage: string
    weeksAlive: number
    isFailed: boolean
    failureReason?: string
    legacyPoints: number
    peakMrr: number
}

async function runMonteCarlo() {
    console.log(`🚀 开始执行 Monte Carlo 模拟... (总共 ${RUNS} 局)`)

    const results: RunResult[] = []

    for (let i = 0; i < RUNS; i++) {
        // 1. 初始化
        const bg = randomChoice(BACKGROUNDS)
        const ind = randomChoice(INDUSTRIES)
        const mod = randomChoice(MODELS)
        
        let state: GameState = {
            id: uuidv4(),
            founder: createFounder(bg, 28, `TestFounder-${i}`),
            company: createCompany(ind, mod, bg, `TestCorp-${i}`),
            isFailed: false,
            logs: []
        }

        // 临时设定一个假的 idea score 让游戏能够顺利度过早期
        state.company.moat = Math.floor(Math.random() * 40) + 10
        state.company.ideaScore = {
            painPointAcuity: 20,
            marketTiming: 15,
            founderFit: 25,
            differentiationEdge: 10,
            total: 70,
            mrrGrowthMultiplier: 1.0 + Math.random(),
            initialMoat: state.company.moat,
            attributeBonus: {}
        }

        let currentSprint = 0
        let peakMrr = 0
        let gameOverRes: any = null

        // 2. 模拟循环
        while (currentSprint < MAX_SPRINTS && !state.isFailed && state.company.stage !== 'LIFESTYLE_EMPIRE') {
            // 每四局稍微调整一下 intensity（模拟压力周期）
            const intensity = 1.0 + (Math.random() * 0.4) // 1.0 到 1.4 随机
            
            const sprintRes = await runSprint(state, SPRINT_WEEKS, intensity)
            
            if (sprintRes.finalState.company) {
                 if (sprintRes.finalState.company.mrr > peakMrr) {
                     peakMrr = sprintRes.finalState.company.mrr
                 }
            }

            if (sprintRes.gameOver) {
                gameOverRes = sprintRes.gameOver
                state = sprintRes.finalState
                break
            }
            
            state = sprintRes.finalState
            currentSprint++
        }

        // 3. 统计结果
        results.push({
            id: state.id,
            founderBg: bg,
            industry: ind,
            model: mod,
            finalStage: state.company?.stage || 'UNKNOWN',
            weeksAlive: state.company?.weekNumber || 0,
            isFailed: state.isFailed,
            failureReason: gameOverRes?.reason,
            legacyPoints: gameOverRes?.legacyPoints || 0,
            peakMrr: peakMrr
        })
        
        if (i % 10 === 0 && i !== 0) {
            console.log(`⏳ 已完成 ${i} 局...`)
        }
    }

    // 4. 分析
    console.log(`\n\n=== 🎲 MONTE CARLO 结果分析 ===`)
    
    const failedRuns = results.filter(r => r.isFailed)
    const successRuns = results.filter(r => !r.isFailed)
    
    console.log(`总局数: ${RUNS}`)
    console.log(`存活/通关: ${successRuns.length} (${(successRuns.length / RUNS * 100).toFixed(1)}%)`)
    console.log(`倒闭: ${failedRuns.length} (${(failedRuns.length / RUNS * 100).toFixed(1)}%)`)
    
    // 死因分布
    const reasonCount: Record<string, number> = {}
    failedRuns.forEach(r => {
        const p = r.failureReason || 'UNKNOWN'
        reasonCount[p] = (reasonCount[p] || 0) + 1
    })
    console.log('\n💀 死因分布:')
    Object.entries(reasonCount).sort((a,b)=>b[1]-a[1]).forEach(([reason, count]) => {
        console.log(`  - ${reason}: ${count}局 (${(count/RUNS*100).toFixed(1)}%)`)
    })
    
    // 阶段卡点
    const stageCount: Record<string, number> = {}
    results.forEach(r => {
        const s = r.finalStage
        stageCount[s] = (stageCount[s] || 0) + 1
    })
    console.log('\n🛑 最终阶段分布:')
    Object.entries(stageCount).sort((a,b)=>b[1]-a[1]).forEach(([stage, count]) => {
        console.log(`  - ${stage}: ${count}局 (${(count/RUNS*100).toFixed(1)}%)`)
    })
    
    // 平均寿命与点数
    const avgAlive = results.reduce((sum, r) => sum + r.weeksAlive, 0) / RUNS
    const avgLegacy = results.reduce((sum, r) => sum + r.legacyPoints, 0) / RUNS
    const avgMRR = results.reduce((sum, r) => sum + r.peakMrr, 0) / RUNS
    
    console.log(`\n📊 核心指标平均值:`)
    console.log(`  - 寿命: ${avgAlive.toFixed(1)} 周`)
    console.log(`  - Legacy Points: ${avgLegacy.toFixed(1)} pt`)
    console.log(`  - 峰值 MRR: ¥${avgMRR.toFixed(0)}`)
}

runMonteCarlo().catch(console.error)
