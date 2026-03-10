"use server";

import { IndustryType } from "./types"

const MODEL_NAME = "gemini-3.1-flash-preview";

export interface IndustryImpact {
    industry: IndustryType | string;
    type: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    severity: number;
    vector_perturbation: {
        mkt: number;
        tec: number;
        lrn: number;
        fin: number;
        ops: number;
        cha: number;  // The doc called it chr but our type is CHA
    };
    macro_modifiers: {
        burn_rate_multiplier: number;
        funding_difficulty: number;
    }
}

export interface NewsAnalysisResponse {
    event_id: string;
    headline: string;
    industry_impacts: IndustryImpact[];
    commentary: string;
    error?: string;
    fallback_headline?: string;
}

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
                    industry: { type: "STRING", description: "例如: 'AI_SAAS', 'DTC_ECOM', 'WEB3_GAMING', 'BIOTECH', 'CREATOR_ECONOMY', 'B2B_ENTERPRISE'" },
                    type: { type: "STRING", description: "POSITIVE, NEGATIVE, or NEUTRAL" },
                    severity: { type: "NUMBER" },
                    vector_perturbation: {
                        type: "OBJECT",
                        properties: {
                            mkt: { type: "NUMBER" },
                            tec: { type: "NUMBER" },
                            lrn: { type: "NUMBER" },
                            fin: { type: "NUMBER" },
                            ops: { type: "NUMBER" },
                            cha: { type: "NUMBER" }
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
1. 扰动值（vector_perturbation）各维度（mkt, tec, lrn, fin, ops, cha）的调整值应在 [-0.2, +0.2] 之间。
2. 必须针对不同行业给出差异化的影响分析，行业需完全贴合我们的模型: AI_SAAS, DTC_ECOM, WEB3_GAMING, BIOTECH, CREATOR_ECONOMY, B2B_ENTERPRISE。
3. 语气应专业、犀利且具有 2026 年硅谷黑客风格。
4. 必须通过 Google Search 获取过去 24 小时的真实数据。
`;

export async function fetchNewsAnalysis(userQuery: string, retries: number = 2, backoff: number = 1000): Promise<NewsAnalysisResponse> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY in environment variables");
    }

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

        if (!textResponse) {
            throw new Error("Empty response from AI");
        }

        return JSON.parse(textResponse) as NewsAnalysisResponse;

    } catch (error) {
        console.error("Failed to fetch news analysis:", error);
        if (retries <= 0) {
            return {
                event_id: 'err',
                headline: "节点连接超时：网络波动中",
                commentary: "系统暂时无法连接全球新闻节点，正在使用离线推演数据。",
                industry_impacts: [],
                error: (error as Error).message
            };
        }
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchNewsAnalysis(userQuery, retries - 1, backoff * 2);
    }
}
