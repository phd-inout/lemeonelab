/**
 * Lemeone-Lab News Parser Service
 * Fetches real-time news and maps them to a Market Impact structure.
 */

// Define response shape
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
    error?: string;
}

const SYSTEM_PROMPT = `
你现在是 lemeone-lab 的首席行业分析师。
你的任务是分析当前全球发生的科技、金融、政策新闻，并将其转化为对模拟器内 DRTA 向量的扰动。

规则：
1. 扰动值（vector_perturbation）应在 [-0.2, +0.2] 之间。
2. 必须针对不同行业（如 AI_SaaS, FinTech, Web3, DTC_Ecom 等）给出影响分析。
3. 必须通过 Google Search 获取过去 24 小时的真实数据。
4. 返回严格的 JSON。
`;

export async function fetchNewsAnalysis(userQuery: string, retries: number = 3, backoff: number = 1000): Promise<NewsAnalysis> {
    const payload = {
        contents: [
            { parts: [{ text: `请分析以下行业的最新新闻或搜索当前热点：${userQuery}` }] }
        ],
        systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
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
                                        FRICTION: { type: "NUMBER" }, UNIQUE: { type: "NUMBER" },
                                        SOCIAL: { type: "NUMBER" }, CONSISTENCY: { type: "NUMBER" },
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
                    commentary: { type: "STRING" }
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

    const MODEL_NAME = "gemini-2.5-flash";
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
                return fetchNewsAnalysis(userQuery, retries - 1, backoff * 2);
            }
            throw new Error(`API Error: ${response.statusText}`);
        }

        const result = await response.json();
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) throw new Error("Empty response parts");

        return JSON.parse(textResponse) as NewsAnalysis;

    } catch (error: any) {
        console.error("Failed to fetch news analysis:", error);
        if (retries <= 0) {
            return {
                error: "系统暂时无法连接全球新闻节点，请检查网络或稍后再试。",
                headline: "节点连接超时：正在使用离线背景数据",
                industry_impacts: [],
                commentary: "Timeout or API constraints."
            };
        }
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchNewsAnalysis(userQuery, retries - 1, backoff * 2);
    }
}
