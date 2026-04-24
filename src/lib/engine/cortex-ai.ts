"use server";

import { loadIndustryProfile, IndustryContext, getAllIndustries, matchIndustry } from './industry-loader'

import fs from 'fs'
import path from 'path'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { 
  Vector14D, 
  PopulationSeed, 
  SandboxState,
  InterviewQuestion 
} from './types'

export async function getIndustryContext(text: string): Promise<IndustryContext | null> {
    return loadIndustryProfile(text);
}

export interface ScannerResponse {
  selected_industry_id?: string;
  monetization?: {
    model: MonetizationModel;
    hardware_price: number;
    monthly_fee: number;
  };
  reasoning_chain?: { dim: string; evidence: string; deduction: string }[];
  seed: PopulationSeed;
  terminalOutput: string;
  questions: InterviewQuestion[]; // Enhanced Smart Probing
  isComplete: boolean;
  draftContent: string;
  industryCtx?: IndustryContext | null;
}

/**
 * Lemeone-lab 2.0: Cortex AI Auditor & Scanner
 * STRICT GEEK MODE: Optimized for size & logic.
 */

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const model = google('gemini-3.1-flash-lite-preview')

/**
 * P1: Seed Scanner (Numerical Data Encoder - Temporal Audit Mode)
 */
export async function scanSeed(history: string[], currentDraft: string): Promise<ScannerResponse> {
  const fullText = (currentDraft + " " + history.join(" ")).substring(0, 10000);
  
  // Dynamic Industry Selection (Semantic AI Lock)
  const availableIndustries = getAllIndustries();
  const industryListStr = availableIndustries.map(i => `${i.id}: ${i.keywords.join('/')}`).join('\n');

  const systemPrompt = `
# Role: Lemeone-lab 首席需求分析师 (Cortex Scanner)

## 设计哲学: 精确评估与无罪推定
- 系统必须严格依靠 **Chain of Thought (思维链)** 抽丝剥茧。
- 对于确实缺失信息的维度，赋予【行业均值】作为 $\\mu$，并赋予巨大的 $\\sigma$ (如0.8)。

## 行业锁定协议 (Industry Gravity Engine)
- **【语义对齐】**: 必须从以下行业列表中选择一个最契合的 ID (selected_industry_id):
${industryListStr}

## 智能结构化追问 (Smart Probing 2.0)
- **【强制限制】**: 每一轮只能提出 **最多 1 个** 问题。
- **【强制审查维度】**: 必须重点审查 D5 (准入门槛)、D6 (变现模式) 和 D14 (认知与分发)。如果用户未在对话历史中明确提及具体方案，**禁止智能推断**，必须通过 \`questions\` 字段发起询问。
- **【选项化思维】**: 尽量将开放式问题转化为 'choice' 类型。
- **【格式要求】**: 问题必须包含 id (如 q_d5_1), dimension (如 D5), text, type ('choice/text/yesno'), 以及 options (如果有)。

## 核心交互准则 (Gemini CLI Prompt 3.0)
- **拒绝废话**: 采用犀利、数据导向的“黑客终端”语气。
- **渐进引导**: 只要任何维度的 $\sigma > 0.4$ 且缺乏直接用户证据，就必须触发追问。

## Output Format (Strict JSON Only!!!):
严格合法的 JSON 对象。
{
  "reasoning_chain": [
    { "dim": "D5", "evidence": "...", "deduction": "..." }
  ],
  "seed": {
    "mean": [14个浮点数],
    "std": [14个浮点数],
    "weights": [14个浮点数]
  },
  "terminalOutput": "[黑客终端语气的概览]",
  "questions": [
    { 
      "id": "q_d5", 
      "dimension": "D5", 
      "text": "你的用户如何进入系统？", 
      "type": "choice", 
      "options": [
        { "label": "免安装网页端", "value": "web", "description": "通过 URL 直接访问" },
        { "label": "App 下载", "value": "app", "description": "需安装包" }
      ]
    }
  ],
  "isComplete": boolean,
  "draftContent": "[Markdown PRD]"
}

`.trim()

  try {
    const { text: response } = await generateText({
      model,
      system: systemPrompt,
      prompt: `=== CURRENT DRAFT ===\n${currentDraft}\n\n=== CONVERSATION HISTORY ===\n${history.join('\n')}`,
    })

    // Use a balanced-brace extraction to avoid greedy over-matching
    const jsonStart = response.indexOf('{');
    let depth = 0, jsonEnd = -1;
    for (let i = jsonStart; i < response.length; i++) {
      if (response[i] === '{') depth++;
      else if (response[i] === '}') { depth--; if (depth === 0) { jsonEnd = i + 1; break; } }
    }
    const jsonMatch = jsonStart >= 0 && jsonEnd > jsonStart ? [response.substring(jsonStart, jsonEnd)] : null;
    if (!jsonMatch) {
        throw new Error('AI Response did not contain valid JSON object.')
    }
    let parsed: any;
    try {
        parsed = JSON.parse(jsonMatch[0])
    } catch (e: any) {
        throw new Error(`JSON Parse Error: ${e.message}`)
    }
    
    const safeArray = (arr: any, len: number, defFn: (i:number)=>number) => {
        const out = Array(len).fill(0).map((_, i) => defFn(i));
        if (Array.isArray(arr)) {
            for (let i = 0; i < Math.min(arr.length, len); i++) {
                const val = arr[i];
                if (typeof val === 'number' && !isNaN(val)) {
                    out[i] = val;
                }
            }
        }
        return out;
    };

    const seed = {
      mean: safeArray(parsed.seed?.mean, 14, (i) => i < 8 ? 0.5 : 0) as Vector14D,
      std: safeArray(parsed.seed?.std, 14, () => 0.8) as Vector14D,
      weights: safeArray(parsed.seed?.weights, 14, () => 1.0) as Vector14D,
      outliers: parsed.seed?.outliers || [],
      evidences: parsed.seed?.evidences || {}
    }

    // --- CODE-LEVEL AUDIT LAYER (Hard-coded Integrity Check) ---
    // If any dimension has std > 0.4, it's considered "Ambiguous".
    // We force isComplete to false if the AI is being too "confident" without evidence.
    let forceIncomplete = false;
    const highUncertaintyDims = [];
    for (let i = 0; i < 14; i++) {
        if (seed.std[i] > 0.4) {
            forceIncomplete = true;
            highUncertaintyDims.push(`D${i + 1}`);
        }
    }

    const finalIsComplete = parsed.isComplete && !forceIncomplete;
    
    // If AI failed to provide a question for a high-uncertainty dimension, we force it in terminal output
    let terminalOutput = parsed.terminalOutput || "[ERROR] Failed to parse Cortex response.";
    if (forceIncomplete && (!parsed.questions || parsed.questions.length === 0)) {
        terminalOutput += `\n\n\x1b[33m[SYS_AUDIT] 检测到逻辑断裂带: ${highUncertaintyDims.join(', ')} 信息不足。正在生成定向追问...\x1b[0m`;
    }

    return {
      selected_industry_id: parsed.selected_industry_id,
      monetization: parsed.monetization || { model: 'SUBSCRIPTION', hardware_price: 0, monthly_fee: 45 },
      reasoning_chain: parsed.reasoning_chain || [],
      seed,
      industryCtx,
      terminalOutput,
      questions: (parsed.questions || []).slice(0, 1), // Enforce 1 question limit
      isComplete: finalIsComplete,
      draftContent: parsed.draftContent || currentDraft
    }
  } catch (error: any) {
    const fallbackSeed = {
      mean: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 0] as Vector14D,
      std: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8] as Vector14D,
      weights: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as Vector14D,
      outliers: [],
      evidences: { "ERROR": "AI_AUDIT_TIMEOUT" }
    }
    return {
      seed: fallbackSeed,
      terminalOutput: `[SYS_ERR] Cortex Scanner 连接超时或 JSON 解析失败。\n\n> Details: ${error.message}`,
      questions: [],
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
  const sortedByRes = [...agents].sort((a, b) => a.resonance - b.resonance)
  const extremeHaters = sortedByRes.slice(0, 5).map(a => ({ dna: a.vector, r: a.resonance }))
  const extremeFans = sortedByRes.slice(-5).reverse().map(a => ({ dna: a.vector, r: a.resonance }))

  const auditPrompt = `
# Role: Lemeone-lab 首席需求分析师 (Cortex Auditor)

## Context:
系统已完成虚拟群体碰撞。你需要基于 14 维向量提供一份具备“预测性执行”能力的实战报告。

## Data Input (实时数据):
- 产品向量: ${JSON.stringify(state.productVector)}
- 指标: T+${state.epoch}, 平均共鸣=${metrics.avgResonance.toFixed(3)}, 转化率=${(metrics.conversionRate*100).toFixed(1)}%, 生存预估=${(metrics.survivalRate*100).toFixed(1)}%, 付费潜力=${metrics.earningPotential}
- 极端组 (Haters/Fans): ${JSON.stringify(extremeHaters)} / ${JSON.stringify(extremeFans)}

## Semantic Mapping Layer (语义折叠与特征绑定):
反馈时，必须将 14 维折叠为三大板块直观表达：
- **【核心爽点】(D1-D4)**: 技术性能、深浅度、交互。
- **【获客血槽】(D5-D6)**: 准入门槛、付费压迫。
- **【增长后劲】(D7-D14)**: 差异度、生态、二次传播。
特征绑定原则：指出具体功能标签与DNA的联系（如：设计成激光定位 -> High D1 & D2）。

## Output Format (保留 Markdown 标题):

# 商业逻辑压力诊断 (STRESS_TEST_REPORT)
- **冲突检测**：识别逻辑断裂带。指出特定功能的添加是否会导致特定群体被排斥流失。采用“因为A功能，所以B瓶颈，导致C流失”逻辑。

# 用户群体精准画像 (PMF_QUADRANT)
- 根据极端群体的 DNA 向量直白描述哪类人喜欢，哪类人怨恨。

# 涌现型待办需求 (PRODUCT_BACKLOG)
- 遵循“冲突 -> 损失 -> 改法”的逻辑链条！
- **副作用预警**：在给出优化建议（改法）的同时，必须预测该调整对其它维度的负面影响！例如：“降低门槛提高便利性会有大量初级用户涌入增加成本，可能导致现金流提前断裂”。

# 竞争格局雷达 (COMPETITIVE_RADAR)
- 虚构 3 个响应式竞品及它们在 14维空间的核心护城河，并分析你的主要优势与死穴。

## Constraint:
- 绝对禁止包含类似“D5为0.2”的裸奔数值，把数字翻译为具体功能点评。
- 800字内。
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
基于用户的构思 "${text}" 及 DNA (${JSON.stringify(seed.mean)}) 生成初始提案 (PROPOSAL.md)。

## Content Requirements:
1. # 愿景重构 (Vision Reframing): 解决谁的什么痛点。
2. # 种子用户画像 (Seed Persona): 谁会付钱。
3. # 核心挑战分析 (Core Challenges): 弱点环节。
4. # MVP 路径图 (MVP Scope): 第一步该做什么。

## Constraint:
- 极客视角，冷静客观，严禁黑话。
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
