import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import {
    SandboxState,
    Vector14D,
    AgentDNA,
    PopulationSeed,
    DIM,
    UserTier,
    TIER_LIMITS,
    TeamSize,
    ProjectData,
    InterviewQuestion,
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
    runAudit,
    getIndustryContext
} from './engine/cortex-ai'

interface LemeoneStore {
    sandboxState: SandboxState | null
    userTier: UserTier
    isRunning: boolean
    isInterviewing: boolean
    activeQuestions: InterviewQuestion[]
    interviewHistory: string[]
    draftSpec: string
    terminalLines: string[]
    
    activeProjectId: string | null
    projectsList: ProjectData[]
    fetchedPricing: { hardwarePrice?: number; monthlyFee?: number; competitor?: string } | null

    // Project Actions
    createProject: (name: string, description?: string) => Promise<string>
    loadProject: (projectId: string) => Promise<void>

    // Core Actions
    initSimulation: (seedText: string, requestedTier?: UserTier) => Promise<void>
    answerInterview: (text: string, questionId?: string) => Promise<void>
    step: () => Promise<void>
    updateVector: (dim: keyof typeof DIM, value: number) => void
    addFeature: (description: string) => Promise<void>
    setTeamSize: (size: TeamSize) => void
    setARPU: (price: number) => void
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
            activeQuestions: [],
            interviewHistory: [],
            draftSpec: '',
            terminalLines: [],
            activeProjectId: null,
            projectsList: [],
            fetchedPricing: null,
            setARPU: (price: number) => {
                const s = get().sandboxState;
                if (!s) return;
                set({
                    sandboxState: {
                        ...s,
                        userARPU: price
                    }
                });
            },

            createProject: async (name: string, description?: string) => {
                try {
                    const { createProjectAction } = await import('@/app/actions/project');
                    const id = await createProjectAction(name, description);
                    
                    const newProject: ProjectData = {
                        id,
                        name,
                        description,
                        createdAt: new Date().toISOString()
                    };
                    
                    set(s => ({
                        projectsList: [newProject, ...s.projectsList],
                        activeProjectId: id,
                        sandboxState: null,
                        terminalLines: [...s.terminalLines.slice(-500), `\x1b[32m[PROJECT]\x1b[0m 已创建并切换至项目: ${name}`],
                        isInterviewing: false,
                        activeQuestions: [],
                        draftSpec: ''
                    }));
                    
                    return id;
                } catch (e) {
                    get().pushLine(`\x1b[31m[ERR]\x1b[0m 创建项目失败`);
                    throw e;
                }
            },
            
            loadProject: async (projectId: string) => {
                try {
                    const { loadLatestRehearsalAction } = await import('@/app/actions/project');
                    const rehearsalData = await loadLatestRehearsalAction(projectId);
                    
                    const project = get().projectsList.find(p => p.id === projectId);
                    get().pushLine(`\x1b[32m[PROJECT]\x1b[0m 切换至项目: ${project?.name || projectId}`);
                    
                    set({
                        activeProjectId: projectId,
                        sandboxState: null,
                        terminalLines: [...get().terminalLines],
                        isInterviewing: false,
                        activeQuestions: [],
                        draftSpec: ''
                    });
                    
                    if (rehearsalData) {
                        get().pushLine(`\x1b[90m[SYSTEM]\x1b[0m 发现存档的商业侧视数据。当前暂不自动恢复全量 10000 智能体快照。请重新 scan。`);
                    }
                } catch (e) {
                    get().pushLine(`\x1b[31m[ERR]\x1b[0m 切换项目失败`);
                }
            },

            pushLine: (line: string) =>
                set(s => ({ terminalLines: [...s.terminalLines.slice(-500), line] })),

            initSimulation: async (seedText: string, requestedTier?: UserTier) => {
                if (!get().activeProjectId) {
                    get().pushLine(`\x1b[31m[ERR]\x1b[0m 请先使用 \x1b[36mproject new <公司/项目名称>\x1b[0m 创建一个案卷`);
                    return;
                }

                const tier = requestedTier || get().userTier
                const limits = TIER_LIMITS[tier]
                
                get().pushLine(`\x1b[36m\x1b[1m╔═ [LEMEONE-LAB 2.0] 初始化协议启动 ═══════════════════════╗\x1b[0m`)
                get().pushLine(`\x1b[36m║\x1b[0m  \x1b[90m输入摘要:\x1b[0m "${seedText.substring(0, 60)}${seedText.length > 60 ? '...' : ''}"`) 
                get().pushLine(`\x1b[36m║\x1b[0m  \x1b[90m分辨率:\x1b[0m   ${tier} (${limits.maxAgents.toLocaleString()} Agents)`)
                // Phase 1: Industry Lock-on
                const industryCtx = await getIndustryContext(seedText);
                if (industryCtx) {
                    get().pushLine(`\x1b[36m║\x1b[0m`)
                    get().pushLine(`\x1b[36m║\x1b[0m  \x1b[35m\x1b[1m[🔬 行业锁定]\x1b[0m ${industryCtx.name}`)
                    get().pushLine(`\x1b[36m║\x1b[0m  \x1b[90m搜索关键词:\x1b[0m ${industryCtx.keywords.join(' · ')}`)
                    if (industryCtx.hardConstraints.length > 0) {
                        get().pushLine(`\x1b[36m║\x1b[0m  \x1b[31m物理死穴:\x1b[0m   ${industryCtx.hardConstraints.map((c: any) => `${c.dim}≥${c.floor}`).join(', ')}`)
                    }
                } else {
                    get().pushLine(`\x1b[36m║\x1b[0m  \x1b[33m[行业] 未匹配到特定行业，使用通用基准\x1b[0m`)
                }
                get().pushLine(`\x1b[36m╚════════════════════════════════════════════════════════╝\x1b[0m`)

                // Phase 2: Industry News Research (async, non-blocking)
                get().pushLine(`\x1b[90m[🌐 RESEARCH] 正在搜索行业实时动态...\x1b[0m`)
                import('./engine/research').then(async ({ fetchIndustryGroundedNews }) => {
                    const news = await fetchIndustryGroundedNews(seedText, industryCtx)
                    if (news.headline && !news.error) {
                        get().pushLine(`\x1b[32m[🌐 RESEARCH] 锚定成功:\x1b[0m ${news.headline}`)
                        if (news.industry_impacts?.length > 0) {
                            const impact = news.industry_impacts[0]
                            const topDims = Object.entries(impact.vector_perturbation || {})
                                .filter(([, v]) => Math.abs(v) >= 0.05)
                                .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                                .slice(0, 3)
                            if (topDims.length > 0) {
                                get().pushLine(`\x1b[90m[🌐 RESEARCH] 主要扰动: ${topDims.map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v.toFixed(2)}`).join(', ')}\x1b[0m`)
                            }
                        }
                        if (news.auditor_alert) {
                            get().pushLine(`\x1b[31m\x1b[1m[⚠️ 审计警报] ${news.auditor_alert}\x1b[0m`)
                        }
                        if (news.real_world_pricing) {
                            const { competitor, hardware_price, monthly_fee } = news.real_world_pricing;
                            get().pushLine(`\x1b[33m[💰 PRICING] 捕获真实市场定价 (${competitor}): 买断价: $${hardware_price ?? 'N/A'} | 月费: $${monthly_fee ?? 'N/A'}\x1b[0m`)
                            set({ fetchedPricing: { hardwarePrice: hardware_price || undefined, monthlyFee: monthly_fee || undefined, competitor } })
                            
                            const currentSandbox = get().sandboxState;
                            if (currentSandbox) {
                                set({ sandboxState: {
                                    ...currentSandbox,
                                    monetization: {
                                        ...currentSandbox.monetization,
                                        hardwarePrice: hardware_price ?? currentSandbox.monetization.hardwarePrice,
                                        monthlyFee: monthly_fee ?? currentSandbox.monetization.monthlyFee
                                    }
                                }})
                            }
                        }
                    } else if (news.error) {
                        get().pushLine(`\x1b[33m[🌐 RESEARCH] ${news.error}\x1b[0m`)
                    }
                })

                // Phase 3: Cortex Scanning
                get().pushLine(`\x1b[90m[📊 SCORING] 启动 14D 商业基因扫描...\x1b[0m`)
                const history = [`User: ${seedText}`]
                const { seed, terminalOutput, isComplete, draftContent, questions } = await scanSeed(history, '')
                
                terminalOutput.split('\n').forEach(line => {
                    get().pushLine(line)
                })

                if (!isComplete) {
                    set({ 
                        isInterviewing: true, 
                        activeQuestions: questions || [],
                        interviewHistory: history,
                        draftSpec: draftContent || ''
                    })
                    return
                }

                // Phase 4: Show 14D Scoring Summary
                get().pushLine(`\x1b[32m[📊 SCORING] 14D 商业基因向量已生成:\x1b[0m`)
                get().pushLine(`\x1b[90m   核心爽点 D1-D4 : [${seed.mean.slice(0,4).map(v=>v.toFixed(2)).join(', ')}]\x1b[0m`)
                get().pushLine(`\x1b[90m   获客血槽 D5-D6 : [${seed.mean.slice(4,6).map(v=>v.toFixed(2)).join(', ')}]\x1b[0m`)
                get().pushLine(`\x1b[90m   市场引擎 D7-D9 : [${seed.mean.slice(6,9).map(v=>v.toFixed(2)).join(', ')}]\x1b[0m`)
                get().pushLine(`\x1b[90m   护城壁垒 D10-D13: [${seed.mean.slice(9,13).map(v=>v.toFixed(2)).join(', ')}]\x1b[0m`)
                get().pushLine(`\x1b[90m   认知半径 D14    : [${seed.mean[13]?.toFixed(2) ?? 'N/A'}]\x1b[0m`)

                // Phase 5: Collision & Initialize
                get().pushLine(`\x1b[36m[⚡ COLLISION] 逻辑自洽检测通过，正在执行 ${limits.maxAgents.toLocaleString()} 并行碰撞...\x1b[0m`)
                const proposal = await generateProposal(seed, seedText)
                const initialPopulation = generatePopulation(seed, limits.maxAgents)
                const agents = await import('./engine/simulator').then(m => m.runCollisionAsync(seed.mean, 0, initialPopulation, 0))
                const initialMetrics = calculateMetrics(agents, seed.mean, 0, 'STARTUP', 0, industryCtx?.baselineARPU || 45)
                
                const initialState: SandboxState = {
                    id: uuidv4(),
                    tier,
                    epoch: 0,
                    teamSize: 'STARTUP',
                    techDebt: 0,
                    currentStage: 'SEED',
                    seedText,
                    userARPU: industryCtx?.baselineARPU || 45,
                    industryId: industryCtx?.id || null,
                    industryName: industryCtx?.name || null,
                    industryBaselineARPU: industryCtx?.baselineARPU || 45,
                    productVector: seed.mean,
                    agents,
                    metrics: initialMetrics,
                    assets: {
                        proposal,
                        backlog: '# PRODUCT_BACKLOG\nRun audit to generate...',
                        marketFeedback: '',
                        journal: '# STRATEGIC DRIFT JOURNAL\n\n> System Initialize [T+0]\n> Baseline recorded.\n',
                        stressTestReport: '',
                        competitiveRadar: '# COMPETITIVE RADAR\nRun audit to generate...'
                    },
                    history: [{
                        epoch: 0,
                        users: initialMetrics.earningPotential,
                        resonance: initialMetrics.avgResonance,
                        survival: initialMetrics.survivalRate,
                        conversion: initialMetrics.conversionRate,
                        mrr: initialMetrics.mrr
                    }]
                }

                set({ sandboxState: initialState, isRunning: true, isInterviewing: false })
                get().pushLine(`\x1b[32m\x1b[1m[✓ READY] 重力沙盒已就绪 (T+0)\x1b[0m — 输入 \x1b[36mdev\x1b[0m 推进周期或先设定价格`)
                get().pushLine(`\x1b[33m[💰 PRICING] 行业建议 ARPU: $${initialState.industryBaselineARPU}/月。输入 \x1b[36mprice <金额>\x1b[33m 设定你的客单价，或直接 dev 保持默认。\x1b[0m`)
            },

            answerInterview: async (text: string, questionId?: string) => {
                const { interviewHistory, draftSpec, userTier } = get()
                const newHistory = [...interviewHistory, `User: ${text}`]
                
                set({ activeQuestions: [] }) // Clear immediately to show loading state

                const { seed, terminalOutput, isComplete, draftContent, industryCtx, questions } = await scanSeed(newHistory, draftSpec)
                
                const aiResponse = terminalOutput.split('\n')
                newHistory.push(`AI: ${aiResponse.join(' ')}`)
                
                aiResponse.forEach(line => {
                    get().pushLine(line)
                })

                if (!isComplete) {
                    set({ 
                        interviewHistory: newHistory,
                        activeQuestions: questions || [],
                        draftSpec: draftContent || draftSpec
                    })
                    return
                }

                // Show 14D Scoring Summary
                get().pushLine(`\x1b[32m[📊 SCORING] 14D 商业基因向量已生成:\x1b[0m`)
                get().pushLine(`\x1b[90m   核心爽点 D1-D4 : [${seed.mean.slice(0,4).map(v=>v.toFixed(2)).join(', ')}]\x1b[0m`)
                get().pushLine(`\x1b[90m   获客血槽 D5-D6 : [${seed.mean.slice(4,6).map(v=>v.toFixed(2)).join(', ')}]\x1b[0m`)
                get().pushLine(`\x1b[90m   市场引擎 D7-D9 : [${seed.mean.slice(6,9).map(v=>v.toFixed(2)).join(', ')}]\x1b[0m`)
                get().pushLine(`\x1b[90m   护城壁垒 D10-D13: [${seed.mean.slice(9,13).map(v=>v.toFixed(2)).join(', ')}]\x1b[0m`)
                get().pushLine(`\x1b[90m   认知半径 D14    : [${seed.mean[13]?.toFixed(2) ?? 'N/A'}]\x1b[0m`)

                // Build Simulation
                const limits = TIER_LIMITS[userTier]
                get().pushLine(`\x1b[36m[⚡ COLLISION] 正在构建 ${limits.maxAgents.toLocaleString()} 并行沙盒...\x1b[0m`)
                const proposal = await generateProposal(seed, newHistory.join('\n'))
                const initialPopulation = generatePopulation(seed, limits.maxAgents)
                const agents = await import('./engine/simulator').then(m => m.runCollisionAsync(seed.mean, 0, initialPopulation, 0))
                
                const monetization = seed.monetization || { model: 'SUBSCRIPTION', hardwarePrice: 0, monthly_fee: industryCtx?.baselineARPU || 45 };
                
                const fetchedPricing = get().fetchedPricing;
                const finalHardwarePrice = fetchedPricing?.hardwarePrice ?? (monetization as any).hardware_price ?? 0;
                const finalMonthlyFee = fetchedPricing?.monthlyFee ?? (monetization as any).monthly_fee ?? industryCtx?.baselineARPU ?? 45;

                const initialMetrics = calculateMetrics(agents, seed.mean, 0, 'STARTUP', 0, {
                    model: (monetization as any).model || 'SUBSCRIPTION',
                    hardwarePrice: finalHardwarePrice,
                    monthlyFee: finalMonthlyFee
                })

                const initialState: SandboxState = {
                    id: uuidv4(),
                    projectId: get().activeProjectId || undefined,
                    tier: userTier,
                    epoch: 0,
                    teamSize: 'STARTUP',
                    techDebt: 0,
                    currentStage: 'SEED',
                    seedText: newHistory.join('\n'),
                    userARPU: finalMonthlyFee,
                    monetization: {
                        model: (monetization as any).model || 'SUBSCRIPTION',
                        hardwarePrice: finalHardwarePrice,
                        monthlyFee: finalMonthlyFee
                    },
                    industryId: industryCtx?.id || null,
                    industryName: industryCtx?.name || null,
                    industryBaselineARPU: industryCtx?.baselineARPU || 45,
                    productVector: seed.mean,
                    agents,
                    metrics: initialMetrics,
                    assets: {
                        proposal,
                        backlog: '# PRODUCT_BACKLOG\nRun audit to generate...',
                        marketFeedback: '',
                        journal: '# STRATEGIC DRIFT JOURNAL\n\n> System Initialize [T+0]\n> Baseline recorded.\n',
                        stressTestReport: '',
                        competitiveRadar: '# COMPETITIVE RADAR\nRun audit to generate...'
                    },
                    history: [{
                        epoch: 0,
                        users: initialMetrics.earningPotential,
                        resonance: initialMetrics.avgResonance,
                        survival: initialMetrics.survivalRate,
                        conversion: initialMetrics.conversionRate,
                        mrr: initialMetrics.mrr
                    }]
                }

                set({ 
                    sandboxState: initialState, 
                    isRunning: true, 
                    isInterviewing: false,
                    draftSpec: draftContent || draftSpec
                })
                get().pushLine(`\x1b[32m\x1b[1m[✓ READY] 重力沙盒已就绪 (T+0)\x1b[0m — 输入 \x1b[36mdev\x1b[0m 推进周期或先设定价格`)
                get().pushLine(`\x1b[33m[💰 PRICING] 行业建议 ARPU: $${initialState.industryBaselineARPU}/月。输入 \x1b[36mprice <金额>\x1b[33m 设定你的客单价，或直接 dev 保持默认。\x1b[0m`)
            },

            step: async () => {
                const s = get().sandboxState
                if (!s) return

                const arpu = s.userARPU
                const nextState = await stepSimulation(s, arpu)
                
                const sRate = nextState.metrics.survivalRate
                const nextJournal = s.assets.journal + `\n## [EPOCH T+${nextState.epoch}]\n- **活跃用户**: ${nextState.metrics.activePaidUserCount.toLocaleString()}\n- **付费用户**: ${nextState.metrics.earningPotential.toLocaleString()}\n- **MRR**: $${nextState.metrics.mrr.toLocaleString()}\n- **生存几率**: ${(sRate * 100).toFixed(1)}%\n- **技术债**: ${nextState.techDebt.toFixed(1)}%\n`
                
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
                const mrrColor = nextState.metrics.mrr > 0 ? g : y

                const report = [
                    `\n${g}╔═ [EPOCH T+${nextState.epoch}] ════════════════════════════════════════════╗${res}`,
                    `${g}║${res}  \x1b[90m用户增长\x1b[0m`,
                    `${g}║${res}    活跃用户:        ${c}${nextState.metrics.activePaidUserCount.toLocaleString()}${res}`,
                    `${g}║${res}    付费用户:        ${c}${nextState.metrics.earningPotential.toLocaleString()}${res}`,
                    `${g}║${res}    转化率:          ${b}${(nextState.metrics.conversionRate * 100).toFixed(2)}%${res}`,
                    `${g}║${res}    平均共鸣度:      ${nextState.metrics.avgResonance.toFixed(4)}`,
                    `${g}║${res}`,
                    `${g}║${res}  \x1b[90m营收健康\x1b[0m`,
                    `${g}║${res}    月营收 (MRR):     ${mrrColor}$${nextState.metrics.mrr.toLocaleString()}${res}  (ARPU: $${arpu})`,
                    `${g}║${res}`,
                    `${g}║${res}  \x1b[90m系统健康\x1b[0m`,
                    `${g}║${res}    技术债务:        ${y}+${diffDebt.toFixed(1)}%${res} (累计: ${nextState.techDebt.toFixed(1)}%)`,
                    `${g}║${res}    生存几率:        ${sRate > 0.5 ? g : r}${(sRate * 100).toFixed(1)}%${res}`,
                    `${g}╚════════════════════════════════════════════════════════╝${res}`
                ]
                
                report.forEach(line => get().pushLine(line))
            },

            updateVector: (dim: keyof typeof DIM, value: number) => {
                const s = get().sandboxState
                if (!s) return

                const nextVector = [...s.productVector] as Vector14D
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
                ) as Vector14D

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

                get().pushLine(`\x1b[35m[🔍 AUDIT] 启动战略一致性深度审计 (T+${s.epoch})...\x1b[0m`)
                get().pushLine(`\x1b[90m[🔍 AUDIT] 正在生成压力测试报告...\x1b[0m`)
                get().pushLine(`\x1b[90m[🔍 AUDIT] 正在扫描竞争格局雷达...\x1b[0m`)
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
                get().pushLine(`\x1b[32m[🔍 AUDIT] 审计完成！战略资产已更新。\x1b[0m`)
                // Extract summary from stress test report
                if (auditResults.stressTestReport) {
                    const summaryLines = auditResults.stressTestReport.split('\n').filter(l => l.trim()).slice(0, 3)
                    summaryLines.forEach(l => get().pushLine(`\x1b[90m   ${l.replace(/^#+\s*/, '').substring(0, 80)}\x1b[0m`))
                }
                get().pushLine(`\x1b[90m   输入 \x1b[36mstat\x1b[90m 查看完整向量 | 查看 STRESS_TEST_REPORT 和 COMPETITIVE_RADAR 文档获取详细分析\x1b[0m`)
            },

            reset: () => set({ 
                sandboxState: null, 
                terminalLines: [], 
                isRunning: false,
                isInterviewing: false,
                activeQuestions: [],
                interviewHistory: [],
                draftSpec: ''
            })
        }),
        {
            name: 'lemeone-2.0-storage',
            partialize: (state) => ({ 
                userTier: state.userTier,
                activeProjectId: state.activeProjectId,
                projectsList: state.projectsList,
                sandboxState: state.sandboxState ? { ...state.sandboxState, agents: [] } : null
            }),
        }
    )
)
