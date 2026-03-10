/**
 * Lemeone-Lab News Parser Service
 * 职能：抓取实时新闻并将其向量化为 DRTA 扰动参数
 */

const apiKey = ""; // 运行环境会自动注入，保持为空字符串
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

/**
 * 结构化响应架构定义
 * 确保 AI 输出符合 lemeone-lab 的行业映射逻辑
 */
const RESPONSE_SCHEMA = {
    type: "OBJECT",
    properties: {
        event_id: { type: "STRING" },
        headline: { type: "STRING" },
        industry_impacts: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    industry: { type: "STRING" }, // 例如: "AI_SaaS", "FinTech", "Web3"
                    vector_perturbation: {
                        type: "OBJECT",
                        properties: {
                            mkt: { type: "NUMBER" },
                            tec: { type: "NUMBER" },
                            lrn: { type: "NUMBER" },
                            fin: { type: "NUMBER" },
                            ops: { type: "NUMBER" },
                            chr: { type: "NUMBER" }
                        }
                    },
                    macro_modifiers: {
                        type: "OBJECT",
                        properties: {
                            burn_rate_multiplier: { type: "NUMBER" },
                            funding_difficulty: { type: "NUMBER" }
                        }
                    }
                }
            }
        },
        commentary: { type: "STRING" }
    },
    required: ["headline", "industry_impacts", "commentary"]
};

const SYSTEM_PROMPT = `
你现在是 lemeone-lab 的首席行业分析师。
你的任务是分析当前全球发生的科技、金融、政策新闻，并将其转化为对模拟器内 DRTA 向量的扰动。

规则：
1. 扰动值（vector_perturbation）应在 [-0.2, +0.2] 之间。
2. 必须针对不同行业（AI_SaaS, FinTech, Web3, DTC_Ecom）给出差异化的影响分析。
3. 语气应专业、犀利且具有 2026 年硅谷黑客风格。
4. 必须通过 Google Search 获取过去 24 小时的真实数据。
`;

/**
 * 带有指数退避重试的 API 调用函数
 */
async function fetchNewsAnalysis(userQuery: string, retries: number = 5, backoff: number = 1000) {
    const payload = {
        contents: [
            { parts: [{ text: `请分析以下新闻或搜索当前热点：${userQuery}` }] }
        ],
        systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
        },
        tools: [{ "google_search": {} }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA
        }
    };

    try {
        const response = await fetch(BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 429 && retries > 0) {
                // 触发重试逻辑
                await new Promise(resolve => setTimeout(resolve, backoff));
                return fetchNewsAnalysis(userQuery, retries - 1, backoff * 2);
            }
            throw new Error(`API Error: ${response.statusText}`);
        }

        const result = await response.json();
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

        // 解析 JSON
        return JSON.parse(textResponse);

    } catch (error) {
        console.error("Failed to fetch news analysis:", error);
        if (retries <= 0) {
            return {
                error: "系统暂时无法连接全球新闻节点，请检查网络或稍后再试。",
                fallback_headline: "节点连接超时：正在使用离线背景数据"
            };
        }
        // 递归重试
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchNewsAnalysis(userQuery, retries - 1, backoff * 2);
    }
}

// --- 使用示例 ---
/**
 * 示例：模拟器触发每日新闻同步
 */
async function syncDailyMarketDrift() {
    const query = "过去 24 小时内关于 Nvidia, OpenAI 以及美联储利率的核心新闻摘要";
    const analysis = await fetchNewsAnalysis(query);

    if (analysis.error) {
        console.log(analysis.error);
        return;
    }

    console.log("--- 2026 晨间简报已送达 ---");
    console.log(`标题: ${analysis.headline}`);
    console.log(`深度点评: ${analysis.commentary}`);

    // 遍历行业影响
    analysis.industry_impacts.forEach((impact: any) => console.log(`- 行业: ${impact.industry}, 类型: ${impact.type}, 影响值: ${impact.severity}`));
}

// syncDailyMarketDrift();