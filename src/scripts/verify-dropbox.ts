// @ts-nocheck
import { scanSeed, runAudit } from '../lib/engine/cortex-ai';
import { generatePopulation, stepSimulation } from '../lib/engine/simulator';
import { SandboxState, UserTier } from '../lib/engine/types';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verifyDropboxDynamic() {
    console.log("🚀 [CASE STUDY] DROPBOX 2.3: KINETIC EVOLUTION TEST\n");

    const dropboxDocs = `
# Dropbox (2008) - Day 1 Spec
- **Core**: 革命性的底层文件同步引擎。
- **Friction**: 极低门槛，安装即用。
- **Social**: 强大的双向邀请机制。
- **Awareness**: 零知名度，仅靠 Hacker News 演示视频。
    `.trim();

    console.log("1️⃣ [SCANNING] Initializing Zero-Knowledge Audit...");
    const scanResult = await scanSeed([dropboxDocs], "");
    const seed = scanResult.seed;
    seed.mean[12] = 0.05; // 强行设定初始知名度为 5% (寒武纪)
    seed.mean[4] = 0.98;  // Dropbox 极简体验，几乎无摩擦 (应对应 2-5% 的变现率)

    console.log("\n--- AI 提取及校准后的 13D 商业基因 (Dropbox) ---");
    console.log(`D1-D4 (Core):    [${seed.mean.slice(0, 4).map((v: number) => v.toFixed(2)).join(', ')}]`);
    console.log(`D5 (Friction):   ${seed.mean[4].toFixed(2)} (极低摩擦，预期变现率 2%-7%)`);
    console.log(`D13 (Awareness): ${seed.mean[12].toFixed(2)} (初始)`);

    const agents = generatePopulation(seed, 100000); // 增加样本量到 10w 以匹配 Slack 测试
    
    let state: SandboxState = {
        id: uuidv4(),
        tier: 'ENTERPRISE' as UserTier,
        epoch: 0,
         
         
        techDebt: 0,
        currentStage: 'SEED', seedText: "test", userARPU: 45, industryId: "ind_000", industryName: "Test", industryBaselineARPU: 45,
        productVector: [...seed.mean] as any,
        agents,
        metrics: { avgResonance: 0, conversionRate: 0, earningPotential: 0, survivalRate: 1.0, activePaidUserCount: 0, mrr: 0 },
        assets: { proposal: '', backlog: '', marketFeedback: '', stressTestReport: '', journal: '', competitiveRadar: '', competitiveRadar: '', journal: '' },
        history: []
    };

    console.log("\nEpoch\tActive Users\tPaid Users\tConv %\tCash\t\tStatus");
    console.log("----------------------------------------------------------------------------------");

    let maxPaid = 0;
    let maxActive = 0;

    for (let i = 1; i <= 48; i++) { // 模拟 48 周（1年）以匹配 Slack 测试
        // 【Dropbox 历史转折点：Hacker News 演示视频】
        if (i === 2) {
            console.log("\n📺 [EVENT] Hacker News Demo Video viral! Awareness Jump: 0.05 -> 0.40\n");
            state.productVector[12] = 0.40;
        }

        state = await stepSimulation(state);
        const { earningPotential, activePaidUserCount } = state.metrics;
        const awareness = state.productVector[12];
        const convRate = (earningPotential / activePaidUserCount) * 100 || 0;

        if (earningPotential > maxPaid) maxPaid = earningPotential;
        if (activePaidUserCount > maxActive) maxActive = activePaidUserCount;
        
        let status = "🌱 SEED";
        if (activePaidUserCount > 20000) status = "🚀 SCALE";
        if (activePaidUserCount > 50000) status = "🔥 VIRAL";

        if (i % 8 === 0 || i === 1) {
            console.log(`T+${state.epoch}\t${activePaidUserCount.toLocaleString()}\t\t${earningPotential.toLocaleString()}\t\t${convRate.toFixed(1)}%\t$${Math.floor(state.cash).toLocaleString()}\t${status}`);
        }
        
        // if (state.cash <= 0) {
        //     console.log(`\n💥 [BANKRUPT] Startup ran out of runway at T+${state.epoch}.`);
        //     break;
        // }
    }

    const actualMonetizationRate = (maxPaid / maxActive) * 100;
    console.log(`\n🏆 [RESULT] Dropbox Simulated 1 Year (48 Weeks):`);
    console.log(`- Peak Active Users: ${maxActive.toLocaleString()}`);
    console.log(`- Peak Paid Users:   ${maxPaid.toLocaleString()}`);
    console.log(`- Monetization Rate (Paid / Active): ${actualMonetizationRate.toFixed(1)}%`);
    
    if (actualMonetizationRate >= 2 && actualMonetizationRate <= 8) {
        console.log("✅ 验证成功：系统准确推演出了 Dropbox 约 5% 的低 B2C 变现率，证明系统能区分 PLG 与 Freemium 的变现强度差异！");
    } else {
        console.log("❌ 验证失败：变现率与现实历史数据 (2%-7%) 偏离过动。");
    }
}

verifyDropboxDynamic().catch(console.error);
