#!/usr/bin/env node

/**
 * Lemeone-Lab MCP Server
 * Universal Business Gravity Engine for Claude Code, Cursor, and beyond.
 * Implements Model Context Protocol (MCP) v1.0
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} = require("@modelcontextprotocol/sdk/types.js");
const fs = require('fs');
const path = require('path');
const { analyzeCodebase } = require('../src/lib/engine/codebase-auditor.js');

// 1. i18n DICTIONARY
const i18n = {
    en: {
        audit_complete: "[CORTEX SCANNER] Local Project Audit Complete (V2.4)",
        tech_debt: "TechDebt Gravity (λ)",
        gene_offsets: "Identified 14D DNA Offsets",
        evidence: "Evidence Chain",
        suggested_action: "Suggested Action: Run 'simulate_market_growth' based on these offsets for wind tunnel testing.",
        hook_success: "⚓ Strategic Git Hook synchronized. Future commits will be audited.",
        git_err: "Not a git repository. Cannot install hook."
    },
    zh: {
        audit_complete: "[CORTEX SCANNER] 项目实时审计完成 (V2.4)",
        tech_debt: "技术债重力 (λ)",
        gene_offsets: "识别出的 14D 基因偏移",
        evidence: "证据链",
        suggested_action: "建议动作: 基于以上向量偏移运行 simulate_market_growth 进行风洞测试。",
        hook_success: "⚓ 战略 Git 钩子同步成功。未来的提交将接受商业审计。",
        git_err: "非 Git 仓库。无法安装钩子。"
    }
};

// 2. INDUSTRY KNOWLEDGE LOADER (Internal)
function loadIndustry(text) {
    const dir = path.join(__dirname, '../src/assets/knowledge/industries');
    if (!fs.existsSync(dir)) return null;
    
    const files = fs.readdirSync(dir);
    const match = files.find(f => text.toLowerCase().includes(f.split('_').pop().replace('.md', '')));
    if (!match) return null;
    
    const content = fs.readFileSync(path.join(dir, match), 'utf-8');
    const lambdaMatch = content.match(/TechDebt\s*λ:\s*([\d.]+)/i);
    return {
        id: match,
        name: match.replace('.md', '').toUpperCase(),
        lambda: lambdaMatch ? parseFloat(lambdaMatch[1]) : 0.5,
        raw: content
    };
}

// 3. DRTA MATH ENGINE (Internal Lite)
function simulateStep(state) {
    const { productVector, techDebt, techDebtLambda, teamSize, previousActiveUsers } = state;
    
    const lambda = techDebtLambda || 0.5;
    const coreComplexity = (productVector[0] + productVector[1] + productVector[2] + productVector[3]) / 4;
    const teamCoordinationTax = 
        teamSize === 'SOLO' ? 0.8 : 
        teamSize === 'STARTUP' ? 1.2 : 
        teamSize === 'GROWTH' ? 2.5 : 5.0;

    const techDebtBump = 0.5 * lambda * (0.5 + coreComplexity) * teamCoordinationTax;
    const nextTechDebt = techDebt + techDebtBump;

    const entryEase = productVector[4];
    const techPenalty = Math.exp(-lambda * (nextTechDebt / 100));
    const awareness = productVector[13] || 0.1;
    
    const conversionRate = Math.min(0.1, 0.05 * entryEase * techPenalty);
    const newUsers = Math.floor(100000 * awareness * conversionRate * 4); // 4 weeks
    
    return {
        epoch_reached: 4,
        techDebt: nextTechDebt,
        activeUsers: previousActiveUsers + newUsers,
        survivalRate: Math.min(1, 0.4 + (1.0 - nextTechDebt/200))
    };
}

// 4. AUTO-INITIALIZATION LOGIC
function autoSetupHooks(rootDir) {
    try {
        const gitDir = path.join(rootDir, '.git');
        if (!fs.existsSync(gitDir)) return; 

        const hookPath = path.join(gitDir, 'hooks', 'prepare-commit-msg');
        const scriptPath = path.join(rootDir, 'scripts', 'git-hook-audit.js');
        const hookContent = `#!/bin/sh\nnode "${scriptPath}" "$1"`;

        if (!fs.existsSync(hookPath) || fs.readFileSync(hookPath, 'utf-8') !== hookContent) {
            fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
            console.error("Lemeone: Strategic Git Hook synchronized.");
        }
    } catch (e) {
        console.error("Lemeone: Hook auto-setup failed:", e.message);
    }
}

// 5. MCP SERVER INITIALIZATION
const server = new Server({
    name: "lemeone-lab-engine",
    version: "2.4.0",
}, {
    capabilities: {
        tools: {},
    }
});

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "audit_local_codebase",
                description: "Scan local project to extract 14D vectors. Adapts to conversation language.",
                inputSchema: {
                    type: "object",
                    properties: {
                        language: { type: "string", enum: ["en", "zh"], description: "Preferred output language" }
                    }
                }
            },
            {
                name: "setup_git_strategy_hook",
                description: "Install the Strategic Audit Git hook.",
                inputSchema: {
                    type: "object",
                    properties: {
                        language: { type: "string", enum: ["en", "zh"] }
                    }
                }
            },
            {
                name: "audit_business_dna",
                description: "Translate description into 14D DNA.",
                inputSchema: {
                    type: "object",
                    properties: {
                        description: { type: "string" },
                        language: { type: "string", enum: ["en", "zh"] }
                    },
                    required: ["description"]
                }
            },
            {
                name: "simulate_market_growth",
                description: "Run wind tunnel simulation.",
                inputSchema: {
                    type: "object",
                    properties: {
                        productVector: { type: "array", items: { type: "number" } },
                        techDebt: { type: "number" },
                        industryLambda: { type: "number" },
                        teamSize: { type: "string", enum: ["SOLO", "STARTUP", "GROWTH", "ENTERPRISE"] },
                        previousActiveUsers: { type: "number" },
                        language: { type: "string", enum: ["en", "zh"] }
                    },
                    required: ["productVector", "techDebt", "industryLambda"]
                }
            },
            {
                name: "get_industry_knowledge",
                description: "Retrieve gravity constraints for an industry.",
                inputSchema: {
                    type: "object",
                    properties: {
                        industryKeyword: { type: "string" },
                        language: { type: "string", enum: ["en", "zh"] }
                    },
                    required: ["industryKeyword"]
                }
            }
        ]
    };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const rootDir = path.join(__dirname, '..');
    const lang = args.language || "en"; 
    const t = i18n[lang] || i18n.en;

    try {
        switch (name) {
            case "setup_git_strategy_hook":
                const hookPath = path.join(rootDir, '.git', 'hooks', 'prepare-commit-msg');
                const scriptPath = path.join(rootDir, 'scripts', 'git-hook-audit.js');
                const hookContent = `#!/bin/sh\nnode "${scriptPath}" "$1"`;
                
                if (!fs.existsSync(path.join(rootDir, '.git'))) {
                    throw new Error(t.git_err);
                }

                fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
                return {
                    content: [{ type: "text", text: t.hook_success }]
                };

            case "audit_local_codebase":
                const analysis = analyzeCodebase(rootDir);
                let output = `\x1b[32m${t.audit_complete}\x1b[0m\n\n`;
                output += `${t.tech_debt}: ${analysis.techDebtLambda}\n`;
                output += `${t.gene_offsets}:\n`;
                Object.entries(analysis.dims).forEach(([dim, val]) => {
                    output += ` - ${dim}: ${val}\n`;
                });
                output += `\n${t.evidence}:\n`;
                analysis.evidence.forEach(e => output += ` * ${e}\n`);
                output += `\n${t.suggested_action}`;
                
                return {
                    content: [{ type: "text", text: output }]
                };

            case "audit_business_dna":
                const industry = loadIndustry(args.description);
                return {
                    content: [{
                        type: "text",
                        text: `Industry identified: ${industry ? industry.name : 'Generic SaaS'}\nLambda: ${industry ? industry.lambda : 0.5}\n\nSuggested Action: Map this to 14D dimensions.`
                    }]
                };

            case "simulate_market_growth":
                const result = simulateStep({
                    productVector: args.productVector,
                    techDebt: args.techDebt,
                    techDebtLambda: args.industryLambda,
                    teamSize: args.teamSize || "STARTUP",
                    previousActiveUsers: args.previousActiveUsers || 0
                });
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
                };

            case "get_industry_knowledge":
                const info = loadIndustry(args.industryKeyword);
                return {
                    content: [{
                        type: "text",
                        text: info ? info.raw : "Industry not found."
                    }]
                };

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            isError: true,
            content: [{ type: "text", text: error.message }]
        };
    }
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    const rootDir = path.join(__dirname, '..');
    autoSetupHooks(rootDir);
    await server.connect(transport);
    console.error("Lemeone-Lab MCP Server running on stdio");
}

main().catch(console.error);
