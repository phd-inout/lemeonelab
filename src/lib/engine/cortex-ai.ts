"use server";

import { generateText, streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { GameState, WeekLog, GameEvent, IdeaCalibration, IndustryType, BusinessModel, CompanyStage } from './types'

// ============================================================
// Cortex AI — Gemini Flash 叙事层
// ============================================================

const model = google('gemini-3.1-flash-lite-preview')

// Stage 专属 System Prompt
const STAGE_SYSTEM_PROMPTS: Record<CompanyStage, string> = {
    SEED: `你是一个冷静犀利的创业分析师，正在观察一个早期项目的生死挣扎。
用第三人称，简短（1-2句话，不超过60字），描述这一周发生的事。
语气带一丝紧迫感，但不煽情。如有事件，自然融入叙事。`,

    MVP: `你是一个见过无数创业故事的投资人助理，正在观察这家公司从原型走向市场。
用第三人称，简短（1-2句话），描述本周经营状态。
关注用户和产品，语气专业中带一丝好奇。`,

    PMF: `你是一个商业记者，正在追踪这家公司找到市场契合点的过程。
用第三人称，简短（1-2句话），描述本周增长动态。
语气偏兴奋，但保持客观理性。`,

    SCALE: `你是一个管理顾问，见证这家公司从混乱扩张到系统化。
用第三人称，简短（1-2句话），描述本周运营挑战。
语气严肃，关注流程和人员。`,

    IPO: `你是一个财经媒体分析师，持续跟踪这家公司的上市准备。
用第三人称，简短（1-2句话），描述本周合规和市值动态。
语气正式，偶尔带市场博弈的紧张感。`,

    TITAN: '你们赢了。现在唯一的对手是垄断法案和周期。保持冷静。',
    LIFESTYLE_EMPIRE: '“小而美”不是逃避竞争的借口，而是对自身极限的清醒认知。保持高效的共鸣与低熵。',
}

/**
 * 生成每周经营叙事
 * @param state 当前游戏状态
 * @param weekLog 本周数据
 * @param event 可选：本周触发的事件
 */
export async function generateWeekNarrative(
    state: GameState,
    weekLog: WeekLog,
    event?: GameEvent
): Promise<string> {
    const stage = state.company.stage
    const systemPrompt = STAGE_SYSTEM_PROMPTS[stage]

    const userPrompt = `
公司状态：
- 阶段：${stage}，第 ${weekLog.week} 周
- 技术进度：${state.company.devProgress.toFixed(1)}%（本周 +${weekLog.progressDelta.toFixed(1)}%）
- 现金：¥${state.company.cash.toLocaleString()}（本周 ${weekLog.cashDelta >= 0 ? '+' : ''}¥${weekLog.cashDelta.toLocaleString()}）
- 技术债：${state.company.techDebt.toFixed(0)}/100
- MRR：¥${state.company.mrr.toLocaleString()}
${event ? `- 本周事件：${event.name}` : ''}

请生成本周经营日志（50字以内）。
  `.trim()

    try {
        const { text } = await generateText({
            model,
            system: systemPrompt,
            prompt: userPrompt,
            maxOutputTokens: 100,
        })
        return text.trim()
    } catch (error) {
        // 降级：返回格式化的占位叙事
        console.error('[cortex-ai] generateWeekNarrative failed:', error)
        return `第 ${weekLog.week} 周：技术进度推进 +${weekLog.progressDelta.toFixed(1)}%，现金消耗 ¥${Math.abs(weekLog.cashDelta).toLocaleString()}。`
    }
}

// ============================================================
// Aha-Moment 核心引擎
// ============================================================

import { Client } from 'pg'
import { embed } from 'ai'

export type AhaMomentType = 'HARD_TRUTH' | 'OPS_DEBT_EXPLOSION' | 'BURNOUT_INSIGHT' | 'LUCKY_PIVOT'

const AHA_REFERENCE_CASES = {
    HARD_TRUTH: [
        { name: 'WeWork', lesson: '商业模式的华丽包装掩盖不了单位经济模型的破产' },
        { name: 'Quibi', lesson: '再好的团队，解决一个不存在的问题，也是徒劳' },
        { name: 'Segway', lesson: '技术领先不等于市场准备好了' },
    ],
    OPS_DEBT_EXPLOSION: [
        { name: 'Knight Capital', lesson: '一行未经测试的旧代码可以在 45 分钟内烧掉 4.6 亿美元' },
        { name: 'MySpace', lesson: '为了快速上线新功能而写烂的代码架构，最终让系统慢到用户无法忍受' },
    ],
    BURNOUT_INSIGHT: [
        { name: 'Uber (Travis Kalanick 时代)', lesson: '创始人精神状态的崩溃，会以最快速度传递给整个公司的每行代码' },
        { name: 'Mental Health in Silicon Valley', lesson: '超级个体的边界不是努力的天花板，而是恢复力的下限' },
    ],
    LUCKY_PIVOT: [
        { name: 'Slack', lesson: '失败的游戏项目中沉淀出的内部沟通工具，成为了千亿估值的独角兽' },
        { name: 'Instagram', lesson: '砍掉复杂的签到功能，只保留照片分享，成就了最伟大的 Pivot' },
        { name: 'Twitter', lesson: '播客目录系统的副产品，变成了改变世界的短信息平台' },
    ]
}

async function retrieveRelevantCase(state: GameState, type: AhaMomentType) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return null;

    const query = `
        商业阶段: ${state.company.stage}
        现金状态: 剩余 ¥${state.company.cash}, MRR ¥${state.company.mrr}
        技术与运营: 技术债 ${state.company.techDebt}/100, 团队规模 ${state.company.staff.length}
        问题核心: ${type}
    `
    try {
        const { embedding } = await embed({
            model: google.textEmbeddingModel('gemini-embedding-001'),
            value: query
        })

        const client = new Client({
            connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
        })
        await client.connect()

        try {
            const res = await client.query(`
                SELECT title, content, tags
                FROM "BusinessCase"
                ORDER BY embedding <=> $1::vector
                LIMIT 1;
            `, [`[${embedding.join(',')}]`])

            if (res.rows.length > 0) {
                return {
                    name: res.rows[0].title,
                    lesson: res.rows[0].content
                }
            }
        } finally {
            await client.end()
        }
    } catch (e) {
        console.error("RAG Retrieve error", e)
    }
    return null;
}

export async function generateAhaMoment(
    type: AhaMomentType,
    state: GameState,
    payload?: any
): Promise<string> {
    const ragCase = await retrieveRelevantCase(state, type)
    let ref = ragCase
    if (!ref) {
        const fallbacks = AHA_REFERENCE_CASES[type] || [{name: 'Default', lesson: '创业是残酷的'}]
        ref = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    }

    let prompt = ''

    switch (type) {
        case 'HARD_TRUTH':
            const expected = payload?.expected ?? 100
            const actual = payload?.actual ?? 0
            const deficit = ((expected - actual) / expected * 100).toFixed(0)
            prompt = `
你是一个严苛但真诚的创业导师。
这位创始人本轮 sprint 的实际进度比预期低了 ${deficit}%。

请用 2-3 句话给出"顿悟时刻"——直接指出他可能忽视的根本问题。
参考案例：${ref.name}——"${ref.lesson}"
语气：像一个凌晨 3 点不留情面的朋友，不鸡汤，不废话。
字数：120字以内。
            `.trim()
            break

        case 'OPS_DEBT_EXPLOSION':
            const entropy = payload?.entropy ?? 4.0
            const debt = state.company.techDebt.toFixed(0)
            prompt = `
你是一个曾因技术债导致公司破产的前任 CTO。
当前该公司的运营熵值(TEC/OPS)达到 ${entropy}，技术债高达 ${debt}/100 并且系统随时可能崩溃。

请用 2-3 句话给出冰冷的警告——指出管理效率和合规也是生产力。
参考案例：${ref.name}——"${ref.lesson}"
语气：充满压迫感，伪造出一点机器故障报错的质感。
字数：120字以内。
            `.trim()
            break

        case 'BURNOUT_INSIGHT':
            prompt = `
你是一位见证过无数天才创始人因过劳而送命的私人医生兼心理顾问。
这位创始人连续多周处于 ${state.founder.bwStressStreak} 周的高压状态（压力值 ${state.founder.bwStress}），刚刚触发了身体防卫机制，导致基础属性永久扣除。

请用 2-3 句话告诫他精力管理的残酷真相。
参考案例：${ref.name}——"${ref.lesson}"
语气：第二人称，平静、冷彻入骨，带一丝惋惜。
字数：120字以内。
            `.trim()
            break

        case 'LUCKY_PIVOT':
            prompt = `
你是一个相信直觉与反共识的顶级风险投资人。
这位创始人刚刚在绝境或失败的决策后，遭遇了一个随机的幸运转折或意料之外的数据增长。

请用 2-3 句话点醒他：这不是他的功劳，但适应性比精准预判更重要。
参考案例：${ref.name}——"${ref.lesson}"
语气：充满前瞻性，带一点神秘感，鼓励将偏差沉淀为流程。
字数：120字以内。
            `.trim()
            break
    }

    try {
        const { text } = await generateText({
            model,
            prompt,
            maxOutputTokens: 200,
        })
        return `[${ref.name} 案例参照]\n${text.trim()}`
    } catch (error) {
        console.error('[cortex-ai] generateAhaMoment failed:', error)
        return `[${ref.name}] ${ref.lesson}。请反思你的核心瓶颈。`
    }
}

// ============================================================
// Idea Calibration（init-company 时调用）
// ============================================================

const CALIBRATION_SYSTEM_PROMPT = `
你是一个刻薄但客观的风险投资分析师，有15年经验。

评估规则：
1. 对笼统/模糊描述（如"一个改变世界的AI工具"）的痛点直接给低分（<10/30）
2. 充满流行词但无具体用户场景的，自动扣分
3. 只奖励能一句话说清"用户是谁 + 他们现在怎么解决问题 + 你为什么更好"的描述
4. 市场时机必须参照2026年真实竞争格局，不接受自称"蓝海"
5. 对留白/跳过/敷衍（如"好产品"）打最低档

返回严格的JSON格式，无其他文字：
{
  "painPointAcuity": <0-30的整数>,
  "marketTiming": <0-25的整数>,
  "founderFit": <0-25的整数>,
  "differentiationEdge": <0-20的整数>,
  "comment": "<50字以内的一句锐评>",
  "attributeBonus": { "TEC": <0-10>, "MKT": <0-10> }
}
`

export async function calibrateIdea(
    description: string,
    industry: IndustryType,
    model_type: BusinessModel
): Promise<IdeaCalibration & { comment: string }> {
    // Lazy Tax：跳过描述时返回平均值
    if (!description.trim() || description.trim().length < 10) {
        return buildDefaultCalibration()
    }

    const userPrompt = `
产品描述：${description}
行业：${industry}
商业模式：${model_type}

请评估这个创业 idea。
  `.trim()

    try {
        const { text } = await generateText({
            model: google('gemini-3.1-flash-lite-preview'),
            system: CALIBRATION_SYSTEM_PROMPT,
            prompt: userPrompt,
            maxOutputTokens: 200,
        })

        // 提取 JSON（处理可能的 markdown 代码块）
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No JSON found in response')

        const parsed = JSON.parse(jsonMatch[0])
        const total = parsed.painPointAcuity + parsed.marketTiming + parsed.founderFit + parsed.differentiationEdge

        return {
            painPointAcuity: Number(parsed.painPointAcuity) || 15,
            marketTiming: Number(parsed.marketTiming) || 12,
            founderFit: Number(parsed.founderFit) || 12,
            differentiationEdge: Number(parsed.differentiationEdge) || 8,
            total,
            comment: parsed.comment || '无评论',
            mrrGrowthMultiplier: calcMRRMultiplier(total),
            initialMoat: calcInitialMoat(Number(parsed.differentiationEdge) || 8),
            attributeBonus: parsed.attributeBonus || {},
        }
    } catch (error) {
        console.error('[cortex-ai] calibrateIdea failed:', error)
        return buildDefaultCalibration()
    }
}

// ============================================================
// 辅助函数
// ============================================================

function calcMRRMultiplier(total: number): number {
    // 0-100 分映射到 0.7x-1.4x
    return 0.7 + (total / 100) * 0.7
}

function calcInitialMoat(differentiationEdge: number): number {
    // 差异化 0-20 → moat 0-30
    return Math.floor((differentiationEdge / 20) * 30)
}

function buildDefaultCalibration(): IdeaCalibration & { comment: string } {
    return {
        painPointAcuity: 15,
        marketTiming: 12,
        founderFit: 12,
        differentiationEdge: 8,
        total: 47,
        comment: '⚠️ 你跳过了 idea 描述，以平均水平初始化——就像大多数随波逐流的创业者。',
        mrrGrowthMultiplier: 1.0,
        initialMoat: 12,
        attributeBonus: {},
    }
}

// ============================================================
// Analyze Gap (analyze-gap指令调用)
// ============================================================

const ANALYZE_GAP_SYSTEM_PROMPT = `
你是一位C-Level战略顾问兼执行教练，负责诊断公司的晋级瓶颈。
你会收到一份公司当前状态与下一阶段晋级硬条件之间的差距报告。

任务：
1. 识别出当前最大的瓶颈（木桶的最短板）。
2. 给出一个明确、具体的下两周执行建议（如："减少研发投入，拉升MKT属性"或"必须暂停开发，全力寻找第一笔现金"）。
3. 语气：像前McKinsey合伙人，一针见血，条理清晰。不用说废话。
4. 返回格式：只需一段话（80-120字）。
`

export async function generateGapAnalysis(gapReport: string): Promise<string> {
    const prompt = `
当前差距报告：
${gapReport}

请给出战略诊断与下一步行动建议：
    `.trim()

    try {
        const { text } = await generateText({
            model: google('gemini-3.1-flash-lite-preview'),
            system: ANALYZE_GAP_SYSTEM_PROMPT,
            prompt,
            maxOutputTokens: 200,
        })
        return text.trim()
    } catch (error) {
        console.error('[cortex-ai] generateGapAnalysis failed:', error)
        return 'AI 分析失败：建议先聚焦于标记为 ❌ 的硬性瓶颈，暂缓其他扩张。'
    }
}
