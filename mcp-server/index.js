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

// 1. INDUSTRY KNOWLEDGE LOADER (Internal)
function loadIndustry(text) {
    const dir = path.join(__dirname, '../src/assets/knowledge/industries');
    if (!fs.existsSync(dir)) return null;
    
    const files = fs.readdirSync(dir);
    // Simple keyword matching
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

// 2. DRTA MATH ENGINE (Internal Lite)
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

// 3. MCP SERVER INITIALIZATION
const server = new Server({
    name: "lemeone-lab-engine",
    version: "2.0.0",
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
                name: "audit_business_dna",
                description: "Translate a product description into 14D business DNA and identify industry gravity constraints.",
                inputSchema: {
                    type: "object",
                    properties: {
                        description: { type: "string", description: "Product or feature description" }
                    },
                    required: ["description"]
                }
            },
            {
                name: "simulate_market_growth",
                description: "Predict tech debt, active users, and survival rate over a 1-month market step.",
                inputSchema: {
                    type: "object",
                    properties: {
                        productVector: { type: "array", items: { type: "number" }, description: "14D vector (0.0 to 1.0)" },
                        techDebt: { type: "number", description: "Current tech debt percentage" },
                        industryLambda: { type: "number", description: "Industry gravity coefficient (0.1 to 2.0)" },
                        teamSize: { type: "string", enum: ["SOLO", "STARTUP", "GROWTH", "ENTERPRISE"] },
                        previousActiveUsers: { type: "number" }
                    },
                    required: ["productVector", "techDebt", "industryLambda"]
                }
            },
            {
                name: "get_industry_knowledge",
                description: "Retrieve specific gravity constraints and baselines for an industry (e.g., 'robotics', 'genai').",
                inputSchema: {
                    type: "object",
                    properties: {
                        industryKeyword: { type: "string" }
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

    try {
        switch (name) {
            case "audit_business_dna":
                const industry = loadIndustry(args.description);
                return {
                    content: [{
                        type: "text",
                        text: `Industry identified: ${industry ? industry.name : 'Generic SaaS'}\nLambda: ${industry ? industry.lambda : 0.5}\n\nSuggested Action: Map this to 14D dimensions and calculate initial TechDebt.`
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
                        text: info ? info.raw : "Industry not found. Fallback to generic 14D baseline."
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
    await server.connect(transport);
    console.error("Lemeone-Lab MCP Server running on stdio");
}

main().catch(console.error);
