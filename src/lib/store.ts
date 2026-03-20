import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import {
    SandboxState,
    Vector13D,
    AgentDNA,
    PopulationSeed,
    DIM,
    UserTier,
    TIER_LIMITS,
    TeamSize
} from './engine/types'
import { 
    generatePopulation, 
    stepSimulation, 
    runCollision,
    calculateMetrics 
} from './engine/simulator'
import { 
    scanSeed, 
    generateProposal, 
    runAudit 
} from './engine/cortex-ai'

interface LemeoneStore {
    sandboxState: SandboxState | null
    userTier: UserTier
    isRunning: boolean
    isInterviewing: boolean
    interviewHistory: string[]
    draftSpec: string
    terminalLines: string[]
    
    // Core Actions
    initSimulation: (seedText: string, requestedTier?: UserTier) => Promise<void>
    answerInterview: (text: string) => Promise<void>
    step: () => Promise<void>
    updateVector: (dim: keyof typeof DIM, value: number) => void
    addFeature: (description: string) => Promise<void>
    setTeamSize: (size: TeamSize) => void
    audit: () => Promise<void>
    upgradeTier: (newTier: UserTier) => void
    
    // UI
    pushLine: (line: string) => void
    reset: () => void
}

export const useLemeoneStore = create<LemeoneStore>()(
    persist(
        (set, get) => ({
            sandboxState: null,
            userTier: 'FREE',
            isRunning: false,
            isInterviewing: false,
            interviewHistory: [],
            draftSpec: '',
            terminalLines: [],

            pushLine: (line: string) =>
                set(s => ({ terminalLines: [...s.terminalLines.slice(-500), line] })),

            initSimulation: async (seedText: string, requestedTier?: UserTier) => {
                const tier = requestedTier || get().userTier
                const limits = TIER_LIMITS[tier]
                
                get().pushLine(`[SYSTEM] Initializing scan protocol...`)
                get().pushLine(`[SYSTEM] Scanning seed text: "${seedText.substring(0, 40)}..."`)
                
                // Fetch live news impact for grounding
                import('./engine/research').then(async ({ fetchNewsAnalysis }) => {
                    const news = await fetchNewsAnalysis(seedText)
                    if (news.headline) {
                        get().pushLine(`[RESEARCH] 锚定成功: ${news.headline}`)
                        if (news.error) {
                            get().pushLine(`[RESEARCH_ERR] ${news.error}`)
                        }
                    }
                })

                const history = [`User: ${seedText}`]
                const { seed, terminalOutput, isComplete, draftContent } = await scanSeed(history, '')
                
                terminalOutput.split('\n').forEach(line => {
                    get().pushLine(line)
                })

                if (!isComplete) {
                    set({ 
                        isInterviewing: true, 
                        interviewHistory: history,
                        draftSpec: draftContent || ''
                    })
                    return
                }

                // If complete on first try (e.g. detailed PRD)
                get().pushLine(`[SYSTEM] 逻辑自洽检测通过，准备执行万次碰撞...`)
                const proposal = await generateProposal(seed, seedText)
                const initialPopulation = generatePopulation(seed, limits.maxAgents)
                const agents = await import('./engine/simulator').then(m => m.runCollisionAsync(seed.mean, 0, initialPopulation, 0))
                const initialMetrics = calculateMetrics(agents, 0, 'STARTUP')
                
                const initialState: SandboxState = {
                    id: uuidv4(),
                    tier,
                    epoch: 0,
                    teamSize: 'STARTUP',
                    techDebt: 0,
                    currentStage: 'SEED',
                    productVector: seed.mean,
                    agents,
                    metrics: initialMetrics,
                    assets: {
                        proposal,
                        backlog: '# PRODUCT_BACKLOG\nRun audit to generate...',
                        journal: '# STRATEGIC DRIFT JOURNAL\n\n> System Initialize [T+0]\n> Baseline recorded.\n',
                        stressTestReport: '',
                        competitiveRadar: '# COMPETITIVE RADAR\nRun audit to generate...'
                    }
                }

                set({ sandboxState: initialState, isRunning: true, isInterviewing: false })
                get().pushLine(`[SYSTEM] Gravity Sandbox Initialized. Execute 'dev' to step.`)
            },

            answerInterview: async (text: string) => {
                const { interviewHistory, draftSpec, userTier } = get()
                const newHistory = [...interviewHistory, `User: ${text}`]
                // NOTE: Don't pushLine the user input here — xterm already echoes it
                
                const { seed, terminalOutput, isComplete, draftContent } = await scanSeed(newHistory, draftSpec)
                
                const aiResponse = terminalOutput.split('\n')
                newHistory.push(`AI: ${aiResponse.join(' ')}`)
                
                aiResponse.forEach(line => {
                    get().pushLine(line)
                })

                if (!isComplete) {
                    set({ 
                        interviewHistory: newHistory,
                        draftSpec: draftContent || draftSpec
                    })
                    return
                }

                // Transition to Simulation
                get().pushLine(`[SYSTEM] $V_{product}$ 扫描完毕。正在构建 10,000 并行沙盒...`)
                const limits = TIER_LIMITS[userTier]
                const proposal = await generateProposal(seed, newHistory.join('\n'))
                const initialPopulation = generatePopulation(seed, limits.maxAgents)
                const agents = await import('./engine/simulator').then(m => m.runCollisionAsync(seed.mean, 0, initialPopulation, 0))
                const initialMetrics = calculateMetrics(agents, 0, 'STARTUP')

                const initialState: SandboxState = {
                    id: uuidv4(),
                    tier: userTier,
                    epoch: 0,
                    teamSize: 'STARTUP',
                    techDebt: 0,
                    currentStage: 'SEED',
                    productVector: seed.mean,
                    agents,
                    metrics: initialMetrics,
                    assets: {
                        proposal,
                        backlog: '# PRODUCT_BACKLOG\nRun audit to generate...',
                        journal: '# STRATEGIC DRIFT JOURNAL\n\n> System Initialize [T+0]\n> Baseline recorded.\n',
                        stressTestReport: '',
                        competitiveRadar: '# COMPETITIVE RADAR\nRun audit to generate...'
                    }
                }

                set({ 
                    sandboxState: initialState, 
                    isRunning: true, 
                    isInterviewing: false,
                    draftSpec: draftContent || draftSpec
                })
                get().pushLine(`[SYSTEM] Sandbox Active. Input 'dev' to start epoch collision.`)
            },

            step: async () => {
                const s = get().sandboxState
                if (!s) return

                const nextState = await stepSimulation(s)
                
                const sRate = nextState.metrics.survivalRate
                const nextJournal = s.assets.journal + `\n## [EPOCH T+${nextState.epoch}]\n- **Active Paid Users**: ${nextState.metrics.earningPotential.toLocaleString()}\n- **Survival Rate**: ${(sRate * 100).toFixed(1)}%\n- **Tech Debt**: ${nextState.techDebt.toFixed(1)}%\n- **Projected MRR**: $${(nextState.metrics.earningPotential * 15).toLocaleString()}\n`
                nextState.assets.journal = nextJournal

                set({ sandboxState: nextState })
                
                // ANSI colors for report
                const res = '\x1b[0m'
                const g = '\x1b[32m'
                const c = '\x1b[36m'
                const y = '\x1b[33m'
                const r = '\x1b[31m'
                const b = '\x1b[1m'

                const diffDebt = nextState.techDebt - s.techDebt

                const report = [
                    `\n${g}╔═ [EPOCH ADVANCED TO T+${nextState.epoch}] ═════════════════════════════════╗${res}`,
                    `${g}║${res}  ACTIVE_USERS (R>0.5): ${c}${nextState.metrics.earningPotential.toLocaleString()}${res} / ${nextState.agents.length.toLocaleString()}`,
                    `${g}║${res}  CONVERSION_CR:        ${b}${(nextState.metrics.conversionRate * 100).toFixed(2)}%${res}`,
                    `${g}║${res}  AVG_RESONANCE:        ${nextState.metrics.avgResonance.toFixed(4)}`,
                    `${g}║${res}  TECH_DEBT_PENALTY:    ${y}+${diffDebt.toFixed(1)}%${res} (TOTAL: ${nextState.techDebt.toFixed(1)}%)`,
                    `${g}║${res}  SURVIVAL_CHANCE:      ${sRate > 0.5 ? g : r}${(sRate * 100).toFixed(1)}%${res}`,
                    `${g}╚═══════════════════════════════════════════════════════╝${res}`
                ]
                
                report.forEach(line => get().pushLine(line))
            },

            updateVector: (dim: keyof typeof DIM, value: number) => {
                const s = get().sandboxState
                if (!s) return

                const nextVector = [...s.productVector] as Vector13D
                nextVector[DIM[dim]] = Math.max(0, Math.min(1, value))
                const updatedAgents = runCollision(nextVector, s.techDebt, s.agents, s.metrics.earningPotential)
                const nextJournal = s.assets.journal + `\n> **[CMD]** Explicitly adjusted parameter \`${String(dim)}\` to \`${value.toFixed(2)}\` at T+${s.epoch}.\n`

                set({
                    sandboxState: {
                        ...s,
                        productVector: nextVector,
                        agents: updatedAgents,
                        assets: { ...s.assets, journal: nextJournal }
                    }
                })
                get().pushLine(`[CMD] Parameter ${dim} adjusted to ${value.toFixed(2)}`)
            },

            addFeature: async (description: string) => {
                const s = get().sandboxState
                if (!s) return

                get().pushLine(`[SYSTEM] Analyzing feature logic: "${description}"`)
                const perturbationResp = await scanSeed([`Feature impact: ${description}`], get().draftSpec)
                const perturbation = perturbationResp.seed
                
                const nextVector = s.productVector.map((v, i) => 
                    Math.max(0, Math.min(1, v * 0.8 + perturbation.mean[i] * 0.2))
                ) as Vector13D

                const updatedAgents = runCollision(nextVector, s.techDebt + 5, s.agents, s.metrics.earningPotential)

                const nextJournal = s.assets.journal + `\n> **[CMD]** Added new feature: "${description}" at T+${s.epoch}. (Tech Debt +5%)\n`

                set({
                    sandboxState: {
                        ...s,
                        productVector: nextVector,
                        agents: updatedAgents,
                        techDebt: s.techDebt + 5,
                        assets: { ...s.assets, journal: nextJournal }
                    }
                })
                get().pushLine(`[CMD] Feature "${description}" integrated. TechDebt +5.`)
            },

            setTeamSize: (size: TeamSize) => {
                const s = get().sandboxState
                if (!s) return

                const nextJournal = s.assets.journal + `\n> **[CMD]** Resized team to \`${size}\` at T+${s.epoch}.\n`

                set({
                    sandboxState: {
                        ...s,
                        teamSize: size,
                        assets: { ...s.assets, journal: nextJournal }
                    }
                })
                get().pushLine(`[CMD] Team size adjusted to ${size}.`)
            },

            upgradeTier: (newTier: UserTier) => {
                set({ userTier: newTier })
                get().pushLine(`[LICENSE] System upgraded to ${newTier} resolution.`)
            },

            audit: async () => {
                const s = get().sandboxState
                if (!s) return

                get().pushLine("[SYSTEM] Triggering Deep AI Audit...")
                const auditResults = await runAudit(s)
                const nextJournal = s.assets.journal + `\n> **[CMD]** Triggered deep AI Audit at T+${s.epoch}.\n`

                set({ 
                    sandboxState: {
                        ...s,
                        assets: {
                            ...s.assets,
                            ...auditResults,
                            journal: nextJournal
                        }
                    }
                })
                get().pushLine("[SYSTEM] Strategic Assets updated.")
            },

            reset: () => set({ 
                sandboxState: null, 
                terminalLines: [], 
                isRunning: false,
                isInterviewing: false,
                interviewHistory: [],
                draftSpec: ''
            })
        }),
        {
            name: 'lemeone-2.0-storage',
            partialize: (state) => ({ 
                userTier: state.userTier,
                sandboxState: state.sandboxState ? { ...state.sandboxState, agents: [] } : null
            }),
        }
    )
)
