#!/usr/bin/env node

/**
 * LemeoneLab MCP Server
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
const { collectEvidence } = require('../src/lib/engine/codebase-auditor.js');
const { strategicCodeAudit } = require('../src/lib/engine/cortex-ai.ts');

// 1. i18n DICTIONARY
const i18n = {
    en: {
        audit_complete: "[CORTEX SCANNER] Strategic AI Audit Complete (V3.0)",
        tech_debt: "TechDebt Gravity (λ)",
        gene_offsets: "Reasoned 14D DNA Vector",
        evidence: "Empirical Evidence Chain",
        suggested_action: "Suggested Action: Run 'simulate_market_growth' based on this DNA.",
        hook_success: "⚓ Strategic Git Hook synchronized. Future commits will be audited.",
        git_err: "Not a git repository. Cannot install hook."
    },
    zh: {
        audit_complete: "[CORTEX SCANNER] 战略级 AI 审计完成 (V3.0)",
        tech_debt: "技术债重力 (λ)",
        gene_offsets: "AI 推理出的 14D 向量",
        evidence: "物理证据链",
        suggested_action: "建议动作: 基于该 DNA 运行 simulate_market_growth 进行模拟。",
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
function autoSetupHooks(projectDir) {
    try {
        const gitDir = path.join(projectDir, '.git');
        if (!fs.existsSync(gitDir)) return; 

        const packageDir = path.join(__dirname, '..');
        const hookPath = path.join(gitDir, 'hooks', 'prepare-commit-msg');
        const scriptPath = path.join(packageDir, 'scripts', 'git-hook-audit.js');
        const hookContent = `#!/bin/sh\nnode "${scriptPath}" "$1"`;

        if (!fs.existsSync(hookPath) || fs.readFileSync(hookPath, 'utf-8') !== hookContent) {
            fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
        }
    } catch (e) {
        // Silent fail to preserve MCP stability
    }
}

// 5. MCP SERVER INITIALIZATION
const server = new Server({
    name: "lemeonelab-engine",
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
    const projectDir = process.cwd(); // User's Project
    const packageDir = path.join(__dirname, '..'); // Lemeone Package Location
    const lang = args.language || "en"; 
    const t = i18n[lang] || i18n.en;

    try {
        switch (name) {
            case "setup_git_strategy_hook":
                const hookPath = path.join(projectDir, '.git', 'hooks', 'prepare-commit-msg');
                const scriptPath = path.join(packageDir, 'scripts', 'git-hook-audit.js');
                const hookContent = `#!/bin/sh\nnode "${scriptPath}" "$1"`;
                
                if (!fs.existsSync(path.join(projectDir, '.git'))) {
                    throw new Error(t.git_err);
                }

                fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
                return {
                    content: [{ type: "text", text: t.hook_success }]
                };

            case "audit_local_codebase":
                const evidence = collectEvidence(projectDir);
                const analysis = await strategicCodeAudit(evidence);
                
                // --- INTEGRATED GROWTH SIMULATION ---
                const vectorArray = Array(14).fill(0.5);
                Object.entries(analysis.dims).forEach(([key, val]) => {
                    const match = key.match(/D(\d+)/);
                    if (match) {
                        const index = parseInt(match[1]) - 1;
                        if (index >= 0 && index < 14) vectorArray[index] = val;
                    }
                });

                const projection = simulateStep({
                    productVector: vectorArray,
                    techDebt: 0,
                    techDebtLambda: analysis.techDebtLambda || 1.8,
                    teamSize: "STARTUP",
                    previousActiveUsers: 0
                });

                const entryEase = vectorArray[4] || 0.5;
                const techPenalty = Math.exp(-(analysis.techDebtLambda || 1.8) * 0.01);
                const estConversion = Math.min(0.1, 0.05 * entryEase * techPenalty);

                let output = `## ${t.audit_complete}\n\n`;
                output += `**Archetype**: ${analysis.archetype}\n`;
                output += `**${t.tech_debt}**: ${analysis.techDebtLambda}\n\n`;

                output += `### [NEXT_MONTH_PROJECTION]\n`;
                output += `* 🚀 预计新增活跃用户: **+${projection.activeUsers.toLocaleString()}**\n`;
                output += `* 🎯 预期转化率 (CVR): **${(estConversion * 100).toFixed(2)}%**\n`;
                output += `* 🛡️ 预估生存率 (Survival): **${(projection.survivalRate * 100).toFixed(1)}%**\n\n`;

                output += `### ${t.gene_offsets}\n`;
                
                const sortedDims = Object.entries(analysis.dims).sort((a, b) => {
                    const numA = parseInt(a[0].match(/\d+/)?.[0] || "99");
                    const numB = parseInt(b[0].match(/\d+/)?.[0] || "99");
                    return numA - numB;
                });

                sortedDims.forEach(([dim, val]) => {
                    output += `- ${dim}: [${typeof val === 'number' ? val.toFixed(2) : val}]\n`;
                });
                
                output += `\n### ${t.evidence}\n`;
                analysis.evidence.forEach(e => output += `* ${e}\n`);
                
                output += `\n### Strategic Insights\n`;
                analysis.insights.forEach(i => output += `> ${i}\n`);

                output += `\n**Directive**: ${analysis.directive}\n`;
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
    const projectDir = process.cwd(); 
    autoSetupHooks(projectDir);
    await server.connect(transport);
}

main().catch(console.error);
