"use server";

import { CompanyState } from "./types"

const MODEL_NAME = "gemini-3.1-flash-preview";

export type RecognizedIntent = 
    | "PR_CAMPAIGN" 
    | "ACQUIRE_COMPANY" 
    | "SELL_COMPANY" 
    | "IGNORE_OR_CHAT"

export interface IntentResponse {
    intent: RecognizedIntent;
    confidence: number;
    // Parameter if applicable (e.g. name of the rival to acquire)
    target_name?: string; 
    // Response text for the terminal
    cortex_reply: string;
}

const RESPONSE_SCHEMA = {
    type: "OBJECT",
    properties: {
        intent: { 
            type: "STRING", 
            description: "Must be one of: PR_CAMPAIGN, ACQUIRE_COMPANY, SELL_COMPANY, IGNORE_OR_CHAT" 
        },
        confidence: { type: "NUMBER" },
        target_name: { type: "STRING" },
        cortex_reply: { type: "STRING" }
    },
    required: ["intent", "confidence", "cortex_reply"]
};

const SYSTEM_PROMPT = `
你现在是 lemeone-lab 系统的意图解析器。
用户在终端输入了无法识别的一段自然语言口语指令。你的任务是分析他们的意图，并映射到以下核心战略行为：

1. PR_CAMPAIGN：用户想搞营销、发公关稿、做活动、提高行业声誉等。
2. ACQUIRE_COMPANY：用户想收购、吃掉某家竞争对手或投资别的公司。如果是这样，在 target_name 中提取出对方公司的名字（如果有）。
3. SELL_COMPANY：用户想把自己的公司卖掉、套现离场、接受并购。
4. IGNORE_OR_CHAT：以上都不是，只是在感叹、聊天或输入无意义文本。

规则：
- cortex_reply 必须符合 2026 硅谷黑客风格，简短、赛博朋克、冷酷。
  - 对于 PR：要提示“声誉行动需要消耗巨额资金”。
  - 对于 收购：要提示“兼并需要海量现金”。
  - 对于 卖掉：要问“确认要终结这个循环吗？”
  - 对于 聊天：可以讽刺他不好好干活。
- 根据提供的上下文（公司状态、现金、对手），给出的 reply 可以结合实际游戏信息。
`;

export async function parseIntent(userInput: string, stateContext: string): Promise<IntentResponse> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY in environment variables");
    }

    const payload = {
        contents: [
            { parts: [{ text: `公司当前上下文数据：\n${stateContext}\n\n终端捕获到未注册指令："${userInput}"` }] }
        ],
        systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
        },
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
            throw new Error(`API Error: ${response.statusText}`);
        }

        const result = await response.json();
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            // fallback
            return {
                intent: "IGNORE_OR_CHAT",
                confidence: 1.0,
                cortex_reply: "认知模块暂时离线，无法解析该自然语言。"
            };
        }

        return JSON.parse(textResponse) as IntentResponse;
    } catch (e) {
        console.error(e);
        return {
            intent: "IGNORE_OR_CHAT",
            confidence: 1.0,
            cortex_reply: "终端协议错误。无法解析自然语言。"
        };
    }
}
