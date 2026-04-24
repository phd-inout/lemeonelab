/**
 * Lemeone-lab 2.0: Shared Industry Knowledge Loader
 * Provides unified industry detection & profile loading for both
 * Cortex Scanner (Gravity) and Research System (Weather).
 */

import fs from 'fs'
import path from 'path'

export interface IndustryContext {
  id: string;          // e.g. "ind_001_robotics"
  filename: string;    // e.g. "ind_001_robotics.md"
  name: string;        // e.g. "垂直领域专业机器人 (Specialized Robotics)"
  keywords: string[];  // search keywords extracted from the industry profile
  rawMarkdown: string; // full MD content for prompt injection
  hardConstraints: { dim: string; floor: number }[]; // Physics Laws survival floors
  baselineARPU: number; // Monthly ARPU in USD for MRR calculation
}

// Industry keyword routing table
const INDUSTRY_ROUTES: { pattern: RegExp; file: string; keywords: string[]; defaultARPU: number }[] = [
  { pattern: /机器人|robotics|划线|无人机|硬件/, file: 'ind_001_robotics.md', keywords: ['机器人', '工业自动化', 'SLAM', '激光雷达', 'RTK-GPS'], defaultARPU: 5000 },
  { pattern: /电池|能源|储能|电源|移动电源/, file: 'ind_002_energy.md', keywords: ['电池', '储能', 'BMS', '电芯', '充电桩'], defaultARPU: 2000 },
  { pattern: /iot|穿戴|智能家居|耳机|路由器/, file: 'ind_003_iot.md', keywords: ['IoT', '智能家居', '穿戴设备', '蓝牙', 'Matter协议'], defaultARPU: 15 },
  { pattern: /农业|农田|户外|测绘|拖拉机/, file: 'ind_004_agritech.md', keywords: ['农业科技', '精准农业', '无人机喷洒', '卫星遥感'], defaultARPU: 3000 },
  { pattern: /独立开发|小微|个体|个人企业|记账|待办/, file: 'ind_005_solopreneur.md', keywords: ['独立开发者', '小微企业', 'SaaS工具', '生产力'], defaultARPU: 15 },
  { pattern: /医疗saas|法律saas|建筑|垂直b2b/, file: 'ind_006_vertical_b2b.md', keywords: ['垂直SaaS', '医疗信息化', '法律科技', 'ERP'], defaultARPU: 200 },
  { pattern: /api|开发者|中间件|云原生|服务器/, file: 'ind_007_devtools.md', keywords: ['开发者工具', 'API', '云原生', '基础设施', 'DevOps'], defaultARPU: 50 },
  { pattern: /协同|文档|项目管理|聊天/, file: 'ind_008_collaboration.md', keywords: ['协同办公', '在线文档', '项目管理', '即时通讯'], defaultARPU: 12 },
  { pattern: /投顾|决策模型|风控|量化/, file: 'ind_009_ai_decision.md', keywords: ['AI决策', '量化交易', '风控模型', '智能投顾'], defaultARPU: 500 },
  { pattern: /生成|视频生成|发帖|ai作图/, file: 'ind_010_gen_ai.md', keywords: ['生成式AI', 'AI绘画', '视频生成', 'AIGC'], defaultARPU: 25 },
  { pattern: /web3|dao|加密|区块链|token/, file: 'ind_011_web3.md', keywords: ['Web3', '区块链', 'DeFi', 'DAO', '智能合约'], defaultARPU: 100 },
  { pattern: /创作者|粉丝|知识付费|社区/, file: 'ind_012_creator.md', keywords: ['创作者经济', '知识付费', '粉丝社区', '内容变现'], defaultARPU: 10 },
  { pattern: /交易平台|专家|挂号|双边/, file: 'ind_013_marketplaces.md', keywords: ['双边市场', '撮合平台', '专业服务', 'O2O'], defaultARPU: 80 },
  { pattern: /鞋服|消费品|直销|d2c/, file: 'ind_014_d2c.md', keywords: ['D2C品牌', '新零售', '消费品', '私域流量'], defaultARPU: 45 },
  { pattern: /支付|结算|钱包|跨境汇款/, file: 'ind_015_fintech.md', keywords: ['支付', 'FinTech', '跨境汇款', '数字钱包', '合规'], defaultARPU: 30 },
];

/** Match input text to an industry file name */
export function matchIndustry(text: string): string {
  const textLower = text.toLowerCase();
  for (const route of INDUSTRY_ROUTES) {
    if (textLower.match(route.pattern)) return route.file;
  }
  return 'ind_005_solopreneur.md'; // Fallback
}

/** Get all available industries for AI selection */
export function getAllIndustries() {
  return INDUSTRY_ROUTES.map(r => ({
    id: r.file.replace('.md', ''),
    keywords: r.keywords,
    file: r.file
  }));
}

/** Extract hard constraint floors from Physics Laws in the raw MD */
function parseHardConstraints(markdown: string): { dim: string; floor: number }[] {
  const constraints: { dim: string; floor: number }[] = [];
  // Match patterns like: IF D9 < 0.85 -> TRIGGER ...
  const regex = /IF\s+(D\d+)\s*<\s*([\d.]+)\s*->\s*TRIGGER/gi;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    constraints.push({ dim: match[1].toUpperCase(), floor: parseFloat(match[2]) });
  }
  return constraints;
}

/** Extract ARPU_Baseline from industry MD (e.g. "ARPU_Baseline: $5000") */
function parseARPU(markdown: string): number | null {
  const match = markdown.match(/ARPU_Baseline:\s*\$?([\d,]+)/i);
  return match ? parseInt(match[1].replace(/,/g, ''), 10) : null;
}

/** Extract industry display name from "# Industry DNA: <name>" header */
function parseIndustryName(markdown: string): string {
  const match = markdown.match(/^#\s*Industry DNA:\s*(.+)$/m);
  return match ? match[1].trim() : 'Unknown Industry';
}

/**
 * Load a complete IndustryContext from the user's text.
 * Returns null if the industry knowledge directory doesn't exist.
 */
export function loadIndustryProfile(text: string): IndustryContext | null {
  try {
    const dir = path.join(process.cwd(), 'src/assets/knowledge/industries');
    if (!fs.existsSync(dir)) return null;

    const filename = matchIndustry(text);
    const fullPath = path.join(dir, filename);
    if (!fs.existsSync(fullPath)) return null;

    const rawMarkdown = fs.readFileSync(fullPath, 'utf-8');
    const id = filename.replace('.md', '');

    // Find the matching route to get keywords
    const textLower = text.toLowerCase();
    const matchedRoute = INDUSTRY_ROUTES.find(r => textLower.match(r.pattern));
    const keywords = matchedRoute?.keywords || [];

    const parsedARPU = parseARPU(rawMarkdown);
    const fallbackARPU = matchedRoute?.defaultARPU || 45;

    return {
      id,
      filename,
      name: parseIndustryName(rawMarkdown),
      keywords,
      rawMarkdown,
      hardConstraints: parseHardConstraints(rawMarkdown),
      baselineARPU: parsedARPU ?? fallbackARPU,
    };
  } catch (e) {
    console.error('[IndustryLoader] Failed to load profile:', e);
    return null;
  }
}
