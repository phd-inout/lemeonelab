/**
 * Lemeone-Lab 2.0: Industry-Aware Grounding System (Cortex Researcher)
 * 
 * Architecture: Gravity (Industry Knowledge) vs Weather (Real-time News)
 * - Gravity is structural, immutable physics from industry DNA profiles.
 * - Weather is short-term perturbation bounded by ±0.2 and constrained by Gravity.
 */

import { IndustryContext } from './industry-loader'
import { DIM } from './types'

// Dimension name -> index mapping for perturbation application
const DIM_NAME_TO_INDEX: Record<string, number> = {
  PERF: DIM.PERF, DEPTH: DIM.DEPTH, INTERACT: DIM.INTERACT, STABLE: DIM.STABLE,
  ENTRY: DIM.ENTRY, MONETIZE: DIM.MONETIZE, UNIQUE: DIM.UNIQUE, SOCIAL: DIM.SOCIAL,
  CONSISTENCY: DIM.CONSISTENCY, ECO: DIM.ECO, BARRIER: DIM.BARRIER,
  GLOBAL: DIM.GLOBAL, CURVE: DIM.CURVE, AWARENESS: DIM.AWARENESS,
};

// Response types
export interface MarketImpact {
  industry: string;
  vector_perturbation: Record<string, number>;
  macro_modifiers: {
    tech_debt_multiplier?: number;
    survival_threshold?: number;
  };
}

export interface NewsAnalysis {
  headline: string;
  industry_impacts: MarketImpact[];
  commentary: string;
  real_world_pricing?: {
    competitor: string;
    hardware_price: number | null;
    monthly_fee: number | null;
    evidence: string;
  };
  auditor_alert?: string;
  error?: string;
}

/**
 * Build a targeted System Prompt based on industry context (v3.0)
 */
function buildSystemPrompt(industryCtx: IndustryContext | null): string {
  const baseRole = `你现在是 Lemeone-lab 首席行业深研分析师 (Cortex Researcher)。
你的职能是利用 Google Search 获取过去 24 小时的真实市场数据，并将其转化为对模拟器内 14D 向量空间的动态扰动值，同时抓取真实的竞品定价。`;

  if (!industryCtx) {
    // Fallback: generic research mode
    return `${baseRole}

规则：
1. 扰动值（vector_perturbation）必须严格限制在 [-0.2, +0.2] 之间。
2. 必须针对不同行业给出影响分析。
3. 必须通过 Google Search 获取过去 24 小时的真实数据。
4. 必须通过搜索获取目前市面上直接竞对的真实客单价（买断价/订阅月费）。
5. 返回严格的 JSON。`;
  }

  // Industry-Aware v3.0 prompt
  return `${baseRole}

## 预读上下文协议 (Context Protocol)
- **Industry_ID**: ${industryCtx.id}
- **Industry_Name**: ${industryCtx.name}
- **Industry_Keywords**: ${industryCtx.keywords.join(', ')}
- **Hard_Constraints (物理死穴)**: ${industryCtx.hardConstraints.map(c => `${c.dim} 生存底线=${c.floor}`).join('; ') || '无特殊约束'}

## 行业重力基准 (Gravity Baseline)
${industryCtx.rawMarkdown}

## 核心深研逻辑 (Research Logic)

### A. 定向搜索与过滤 (Targeted Search)
- **禁止泛搜**：不要搜索"科技新闻"，必须基于以下关键词搜索行业动态：${industryCtx.keywords.join('、')}。
- **竞对追踪与真实定价 (Price Grounding)**：必须搜索该行业的已知巨头和新兴挑战者的最新产品定价。提取出真实的 \`hardware_price\` (如果是买断制硬件) 和 \`monthly_fee\` (如果是订阅制)。如果只存在一种，另一种设为 null。
- **现实锚定**：抓取真实市场中该品类用户在 Reddit, X, 开发者社区的最新痛点分布。

### B. 扰动映射与约束 (Perturbation & Gravity)
- **扰动范围**：单次新闻事件对维度的影响限制在 [-0.2, +0.2] 区间内。
- **重力优先级**：新闻扰动不得推翻行业知识库定义的"硬约束"（Hard Constraints）。
  - 如果行业定义 ${industryCtx.hardConstraints.map(c => `${c.dim}>=${c.floor}`).join(', ') || '无'} 为生存死穴，即便新闻利好，也不能将其调低至生存线以下。
- **挤出效应**：如果新闻显示行业巨头发布了对标功能，必须在 D7 (唯一价值) 和 D14 (认知度) 上应用严重的负向扰动。

### C. 逻辑冲突审计 (Consistency Audit)
- 如果你发现实时新闻与行业知识库的"先验设定"存在剧烈矛盾（如：定义为蓝海但巨头突然入场），你**必须**在 auditor_alert 字段中输出 "⚠️ 现实引力撕裂" 警告并附上具体的商业审计意见。

## 输出格式 (Strict JSON)
返回严格的 JSON 对象。`;
}

/**
 * Build the user query with industry context
 */
function buildQuery(userQuery: string, industryCtx: IndustryContext | null): string {
  if (!industryCtx) {
    return `请分析以下行业的最新新闻或搜索当前热点：${userQuery}`;
  }
  return `基于 ${industryCtx.name} 行业的物理基准，分析过去 24 小时关于 ${industryCtx.keywords.join('、')} 的市场变化、政策及竞对动态。用户项目背景：${userQuery}`;
}

/**
 * Clamp perturbations against industry hard constraints.
 * Ensures that weather (news) never breaks gravity (physics laws).
 */
export function applyPerturbationWithConstraints(
  currentVector: number[],
  perturbation: Record<string, number>,
  industryCtx: IndustryContext | null
): number[] {
  const result = [...currentVector];

  for (const [dimName, delta] of Object.entries(perturbation)) {
    const idx = DIM_NAME_TO_INDEX[dimName];
    if (idx === undefined) continue;

    // Clamp delta to ±0.2
    const clampedDelta = Math.max(-0.2, Math.min(0.2, delta));
    let newVal = Math.max(0, Math.min(1, result[idx] + clampedDelta));

    // Enforce hard constraints: never push below survival floor
    if (industryCtx) {
      const constraint = industryCtx.hardConstraints.find(
        c => c.dim === `D${idx + 1}`
      );
      if (constraint && newVal < constraint.floor) {
        newVal = constraint.floor; // Gravity wins over Weather
      }
    }

    result[idx] = newVal;
  }

  return result;
}

/**
 * Core fetch function: Industry-Aware Grounded News Analysis
 */
export async function fetchIndustryGroundedNews(
  userQuery: string,
  industryCtx: IndustryContext | null = null,
  retries: number = 3,
  backoff: number = 1000
): Promise<NewsAnalysis> {
  const systemPrompt = buildSystemPrompt(industryCtx);
  const queryText = buildQuery(userQuery, industryCtx);

  const payload = {
    contents: [
      { parts: [{ text: queryText }] }
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    tools: [{ "google_search": {} }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          headline: { type: "STRING" },
          industry_impacts: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                industry: { type: "STRING" },
                vector_perturbation: {
                  type: "OBJECT",
                  properties: {
                    PERF: { type: "NUMBER" }, DEPTH: { type: "NUMBER" },
                    INTERACT: { type: "NUMBER" }, STABLE: { type: "NUMBER" },
                    ENTRY: { type: "NUMBER" }, MONETIZE: { type: "NUMBER" },
                    UNIQUE: { type: "NUMBER" }, SOCIAL: { type: "NUMBER" },
                    CONSISTENCY: { type: "NUMBER" },
                    ECO: { type: "NUMBER" }, BARRIER: { type: "NUMBER" },
                    GLOBAL: { type: "NUMBER" }, CURVE: { type: "NUMBER" },
                    AWARENESS: { type: "NUMBER" }
                  }
                },
                macro_modifiers: {
                  type: "OBJECT",
                  properties: {
                    tech_debt_multiplier: { type: "NUMBER" },
                    survival_threshold: { type: "NUMBER" }
                  }
                }
              }
            }
          },
          commentary: { type: "STRING" },
          real_world_pricing: {
            type: "OBJECT",
            properties: {
              competitor: { type: "STRING" },
              hardware_price: { type: "NUMBER", nullable: true },
              monthly_fee: { type: "NUMBER", nullable: true },
              evidence: { type: "STRING" }
            }
          },
          auditor_alert: { type: "STRING" }
        },
        required: ["headline", "industry_impacts", "commentary"]
      }
    }
  };

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return {
      error: "MISSING_API_KEY: Please set GOOGLE_GENERATIVE_AI_API_KEY in .env.local",
      headline: "OFFLINE MODE",
      industry_impacts: [],
      commentary: "Running without live internet research due to missing API key."
    }
  }

  const MODEL_NAME = "gemini-3.1-flash-lite-preview";
  const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchIndustryGroundedNews(userQuery, industryCtx, retries - 1, backoff * 2);
      }
      throw new Error(`API Error: ${response.statusText}`);
    }

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) throw new Error("Empty response parts");

    return JSON.parse(textResponse) as NewsAnalysis;

  } catch (error: any) {
    console.error("[CortexResearcher] Failed to fetch grounded news:", error);
    if (retries <= 0) {
      return {
        error: "系统暂时无法连接全球新闻节点，请检查网络或稍后再试。",
        headline: "节点连接超时：正在使用离线背景数据",
        industry_impacts: [],
        commentary: "Timeout or API constraints."
      };
    }
    await new Promise(resolve => setTimeout(resolve, backoff));
    return fetchIndustryGroundedNews(userQuery, industryCtx, retries - 1, backoff * 2);
  }
}
