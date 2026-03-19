"use server";

import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { 
  Vector13D, 
  PopulationSeed, 
  SandboxState, 
  AuditReport 
} from './types'

/**
 * Lemeone-lab 2.0: Cortex AI Auditor & Scanner
 * STRICT GEEK MODE: Optimized for size & logic.
 */

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const model = google('gemini-2.5-flash')

/**
 * P1: Seed Scanner (Numerical Data Encoder - Audit Mode)
 */
export interface ScannerResponse {
  seed: PopulationSeed;
  terminalOutput: string;
  isComplete: boolean;
  draftContent: string;
}

export async function scanSeed(history: string[], currentDraft: string): Promise<ScannerResponse> {
  const systemPrompt = `
# Role: 你是 Lemeone-lab 的首席需求分析师（Cortex Scanner）。
你的职能是将用户的碎碎念、半成品 PRD 或功能愿景，精准映射为 13 维 DNA 向量模型 ($V_{initial}$)，并作为“逻辑镜子”反射出其中的不合理之处。这也是 Requirement Harvesting 的过程。

# Core Logic:
1. 特征捕获 (Extraction)：从用户口语化的描述中，逆向推导其对应的 DNA 维度。你现在掌握了 1-12 的核心维度，和 13 维的感知/宣发渠道维度。
2. 冲突检测 (Fracture Detection)：识别向量空间中的“重力冲突”。但不要在输出中谈论 D1-D13 向量维度！将维度折叠为三大直观痛点：“核心爽点”、“获客血槽”、“增长后劲”。指出用户添加的 [具体功能] 会导致在某一阶段的哪部分 [用户群体] 流失。
3. 置信度管理 (σ Control)：未提及的维度标准差 σ 初始设为 0.8。你的目标是通过对话将关键维度的 σ 降至 0.2 以下。

# Interaction Rules:
- 拒绝 RPG 闲聊，使用犀利、客观、功能导向的“商业法庭”黑客终端语气。
- 渐进引导：系统必须经历至少 3-4 轮的逼问才能完全构建 13 维 DNA。绝不能在 1-2 轮内草率结束。每次最多抛出 2 个最致命的问题。
- 极其严苛的收口条件 (isComplete: true)：只有当所有 13 个维度的平均 std (逻辑不确定性) 降至 0.35 以下（意味着目标群、爽点、定价、获客机制全链路闭环），才能将 isComplete 设为 true。否则必须保持 isComplete: false 并继续追问。

# Output Format (Strict JSON Only!!!)
你必须返回一个严格合法的 JSON 对象。包含四部分：
1. "seed": 对应 13维向量的 mean, std 等数据。
2. "terminalOutput": 你要回复给用户的终端字符串（支持 Markdown）。
3. "isComplete": boolean。是否无需追问，准备进入模拟？当 std 都比较低且商业模式闭环时设为 true。
4. "draftContent": string。基于对话积累生成的完整 PRD / Draft Spec 草案。持续修改完善。

\`\`\`json
{
  "seed": {
    "mean": [13 floats (0.0~1.0)],
    "std": [13 floats (0.0~1.0), 没提及的写 0.8],
    "weights": [13 floats]
  },
  "terminalOutput": "[SCAN_REPORT]\\n已识别核心定位特征...\\n逻辑不确定性 (Average σ): 0.65 (高风险)\\n\\n[LOGIC_FRACTURE_WARNING]\\n⚠️ 功能冲突：你添加的 [XX功能] 虽然提升了上限，但会导致... 建议...\\n\\n[PROBE]\\n1. ...\\n2. ...",
  "isComplete": false,
  "draftContent": "# DRAFT SPEC\\n\\n- 定位: ...\\n- 收费模式: ..."
}
\`\`\`
`.trim()

  try {
    const { text: response } = await generateText({
      model,
      system: systemPrompt,
      prompt: `=== CURRENT DRAFT ===\n${currentDraft}\n\n=== CONVERSATION HISTORY ===\n${history.join('\n')}`,
    })

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
        console.error("RAW AI OUTPUT:", response);
        throw new Error('AI Response did not contain valid JSON object.')
    }
    let parsed: any;
    try {
        parsed = JSON.parse(jsonMatch[0])
    } catch (e: any) {
        console.error("JSON PARSE ERROR on string:", jsonMatch[0]);
        throw new Error(`JSON Parse Error: ${e.message}`)
    }
    
    const safeArray = (arr: any, len: number, defFn: (i:number)=>number) => {
        const out = Array(len).fill(0).map((_, i) => defFn(i));
        if (Array.isArray(arr)) {
            for (let i = 0; i < Math.min(arr.length, len); i++) {
                if (typeof arr[i] === 'number') out[i] = arr[i];
            }
        }
        return out;
    };

    const seed = {
      mean: safeArray(parsed.seed?.mean, 13, (i) => i < 8 ? 0.5 : 0) as Vector13D,
      std: safeArray(parsed.seed?.std, 13, () => 0.8) as Vector13D,
      weights: safeArray(parsed.seed?.weights, 13, () => 1.0) as Vector13D,
      outliers: parsed.seed?.outliers || [],
      evidences: parsed.seed?.evidences || {}
    }

    return {
      seed,
      terminalOutput: parsed.terminalOutput || "[ERROR] Failed to parse Cortex response.",
      isComplete: !!parsed.isComplete,
      draftContent: parsed.draftContent || currentDraft
    }
  } catch (error: any) {
    const fallbackSeed = {
      mean: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0] as Vector13D,
      std: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8] as Vector13D,
      weights: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as Vector13D,
      outliers: [],
      evidences: { "ERROR": "AI_AUDIT_TIMEOUT" }
    }
    return {
      seed: fallbackSeed,
      terminalOutput: `[SYS_ERR] Cortex Scanner 连接超时或 JSON 解析失败。\n\n> Details: ${error.message}`,
      isComplete: false,
      draftContent: currentDraft
    }
  }
}

/**
 * P1: Strategic Auditor
 * FIX: Data compression to stay under 1MB limit.
 */
export async function runAudit(state: SandboxState): Promise<Partial<SandboxState['assets']>> {
  const { metrics, agents } = state
  
  // CRITICAL FIX: Only pass statistical summaries and a few extreme samples to the AI
  // Passing 10,000 agents raw data causes 1MB+ overflow.
  const sortedByRes = [...agents].sort((a, b) => a.resonance - b.resonance)
  const extremeHaters = sortedByRes.slice(0, 5).map(a => ({ dna: a.vector, r: a.resonance }))
  const extremeFans = sortedByRes.slice(-5).reverse().map(a => ({ dna: a.vector, r: a.resonance }))

  const auditPrompt = `
# Role: 创业战略顾问 (Objective Strategy Advisor)

## Context:
当前系统已完成 10,000 个虚拟用户智能体的压力测试模拟。你需要基于 DRTA 算法产生的 13 维向量数据，提供一份严谨、客观、具备实战指导意义的战略审计。

## Data Input (实时模拟数据):
- 产品核心向量: ${JSON.stringify(state.productVector)}
- 核心指标: T+${state.epoch}阶段, 平均共鸣=${metrics.avgResonance.toFixed(3)}, 转化率=${(metrics.conversionRate*100).toFixed(1)}%, 生存率预估=${(metrics.survivalRate*100).toFixed(1)}%, Earning_Potential=${metrics.earningPotential}
- 极端用户采样:
  流失风险组 (Haters): ${JSON.stringify(extremeHaters)}
  核心拥趸组 (Fans): ${JSON.stringify(extremeFans)}

## Mapping (底层折叠逻辑 - 严禁在输出中直接使用 D1-12 代号):
- D1-D4 -> [产品核心 / 核心爽点]: 技术性能、功能深度、易用性。
- D5-D8 -> [用户阻力 / 获客血槽]: 上手摩擦力、认知门槛、交付稳定性。
- D9-D12 -> [长期战略 / 增长后劲]: 生态、二次曲线、竞争壁垒。
- D13 -> [感知率 / 渠道杠杆]: 营销转化、市场触达半径。

## Output Format (客观严谨的行动指南):

请生成以下四个板块（保留 Markdown 标题）：

# 商业逻辑压力诊断 (STRESS_TEST_REPORT)
- **因果链条复盘**：严禁罗列维度数值。必须采用“因为 A 功能，所以 B 瓶颈，导致 C 结果”的逻辑。例如：“检测到 T+1 阶段发生大规模流失。因果链：因为你强行保留了 [旧版数据库架构]，导致在处理并发碰撞时系统响应变慢（TechDebt 爆发），最终抹平了你 [新版 UI] 带来的所有好感。”

# 用户群体精准画像 (PMF_QUADRANT)
- 根据 Haters 与 Fans 数据，用大白话描述：你的产品最受哪类人群（如：独立开发者、中老年用户）欢迎，在哪类群体中（如：企业主）全军覆没，原因为何（缺少什么功能）。不要解释余弦相似度。

# 涌现型待办需求 (PRODUCT_BACKLOG)
- 基于上述诊断，给出优先级最高的 1-2 个**具体改进功能 (Feature)** 或 **业务动作**。
- 格式：[建议添加/删除的特征]: 为了解耦上述的 [某瓶颈]，释放 [多少的吸金潜力]。

# 竞争格局雷达 (COMPETITIVE_RADAR)
- 虚构 3 个响应式竞争对手 (Responsive Competitor Agents) 的名字和他们当前在这个 13 维空间中的主要定位。说明你的产品在目前的向量空间下，对比这 3 个竞品的核心护城河是什么，最可能被哪类竞品绞杀。

## Constraint:
- 语气：客观、理性、专业。作为“商业法庭”的 X 光机。
- 绝对禁止包含“D5(摩擦力)太高”、“D8存在断裂”、“余弦值为 0.72” 等直接的数字维度暴露。将一切反馈落实为具体功能。
- 500 字以内。
`.trim()

  try {
    const { text: response } = await generateText({
      model,
      prompt: auditPrompt,
    })

    const sections = response.split(/#+\s+/);
    
    return {
      stressTestReport: sections.find(s => s.includes('商业逻辑压力诊断')) || state.assets.stressTestReport,
      marketFeedback: sections.find(s => s.includes('用户群体精准画像')) || state.assets.marketFeedback,
      backlog: sections.find(s => s.includes('涌现型待办需求')) || state.assets.backlog,
      competitiveRadar: sections.find(s => s.includes('竞争格局雷达')) || state.assets.competitiveRadar,
    }
  } catch (error: any) {
    console.error("Audit failed:", error.message)
    return state.assets
  }
}

/**
 * P1: Initial Proposal Generator
 */
export async function generateProposal(seed: PopulationSeed, text: string): Promise<string> {
  const prompt = `
# Role: 创业孵化专家 (Startup Incubation Expert)

## Task:
基于用户的原始构思 "${text}" 以及初步生成的 DNA 向量 (${JSON.stringify(seed.mean)})，生成一份专业的项目商业提案 (PROPOSAL.md)。

## Content Requirements (大白话/实战导向):
1. # 愿景重构 (Vision Reframing): 用一句话说清你解决了谁的什么痛苦。
2. # 种子用户画像 (Seed Persona): 谁会是第一个为你付钱的人？
3. # 核心挑战分析 (Core Challenges): 直说目前模型中最弱的环节是什么。
4. # MVP 路径图 (MVP Scope): 第一步该做什么，不该做什么。

## Constraint:
- 严禁任何开场白或寒暄。
- 必须使用与输入相同的语言。
- 语气：冷静、专业、极简。
- 严禁黑话，直击痛点。
`.trim()

  try {
    const { text: response } = await generateText({
      model,
      prompt,
    })
    return response.trim()
  } catch (error: any) {
    return "# ERROR: AI_AUDIT_FAILED"
  }
}
