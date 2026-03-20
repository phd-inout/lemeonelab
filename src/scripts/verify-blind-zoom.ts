import { scanSeed } from '../lib/engine/cortex-ai';
import { generatePopulation, stepSimulation } from '../lib/engine/simulator';
import { SandboxState, UserTier } from '../lib/engine/types';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * [BLIND TEST] PROJECT CLOUD-SYNC VIDEO (2013)
 * Historical Target: Zoom (Actual Conversion ~4-5% Freemium)
 */
async function verifyBlindTest() {
    console.log("🛡️ [BLIND TEST] INITIATING PROJECT 'CLOUD-SYNC VIDEO' (2013) EMPIRICAL VALIDATION\n");
    console.log("Context: You are evaluating a New Co in 2013. Competitive landscape: Skype (unstable), WebEx (bloated).\n");

    const blindDocs = `
# Project Specs: Cloud-Sync Video Engine (2013)

## Technical Edge (D1-D4)
- 自研专有视频编解码器，能在丟包率 25% 的复杂网络环境下保持音频同步、视频不卡顿。
- 全球分布式中继节点架构，确保跨国通话延迟低于 150ms。
- 单个会议室支持 25 人同时开启高清视频，对系统资源消耗极低。

## Product Design & Friction (D5)
- 无需下载大型客户端，浏览器插件或轻量级安装包（几秒钟搞定）。
- 一键生成会议链接，参会者无需注册即可加入（极致准入顺滑）。
- **Freemium 策略**: 
  - 1对1会议：永久免费、不限时。
  - 3人及以上会议：免费 40 分钟，超时自动断开。
  - 付费版：$14.99/月，解除时长限制，支持录像。

## Competitive Context
- 主要对手是传统的 WebEx (安装繁琐、需要 IT 预设) 和 Skype (侧重 B2C、通话经常莫名中断)。
    `.trim();

    console.log("1️⃣ [PARSING] Scanning Specs via Cortex AI (Identity Hidden)...");
    const scanResult = await scanSeed([blindDocs], "");
    const seed = scanResult.seed;
    
    // 我们手动设定 Awareness 为 0.05，模拟 2013 年初创状态
    seed.mean[12] = 0.05; 

    console.log("\n--- AI 自动提取的 13D 商业基因 ---");
    console.log(`D1-D4 (Core/Performance): [${seed.mean.slice(0, 4).map((v: number) => v.toFixed(2)).join(', ')}]`);
    console.log(`D5 (Friction/Model):      ${seed.mean[4].toFixed(2)}`);
    console.log(`D6 (Unique Value):        ${seed.mean[5].toFixed(2)}`);

    console.log("\n2️⃣ [SIMULATION] Generating 100,000 Agents & Starting 48-Week Evolution...");
    const agents = generatePopulation(seed, 100000);
    
    let state: SandboxState = {
        id: uuidv4(),
        tier: 'ENTERPRISE' as UserTier,
        epoch: 0,
        cash: 5000000, 
        burnRate: 100000, 
        techDebt: 0,
        currentStage: 'SEED',
        productVector: seed.mean,
        agents,
        metrics: { avgResonance: 0, conversionRate: 0, earningPotential: 0, survivalRate: 1.0, activePaidUserCount: 0 },
        assets: { proposal: '', backlog: '', marketFeedback: '', stressTestReport: '', journal: '' },
        history: []
    };

    console.log("\nEpoch\tActive Users\tPaid Users\tConv %\tStatus");
    console.log("----------------------------------------------------------------------------------");

    let maxConv = 0;

    for (let i = 1; i <= 48; i++) {
        state = await stepSimulation(state);
        const { earningPotential, activePaidUserCount } = state.metrics;
        const convRate = (earningPotential / activePaidUserCount) * 100 || 0;
        
        if (convRate > maxConv) maxConv = convRate;

        if (i % 12 === 0 || i === 1) {
            console.log(`T+${state.epoch}\t${activePaidUserCount.toLocaleString()}\t\t${earningPotential.toLocaleString()}\t\t${convRate.toFixed(1)}%\t${state.currentStage}`);
        }
    }

    console.log(`\n🏆 [RESULT] Simulation Complete:`);
    console.log(`- Peak Conversion Rate (Paid/Active): ${maxConv.toFixed(1)}%`);
    
    console.log("\n📊 [COMPARISON WITH REALITY]");
    console.log("Target: Zoom (2013-2014) Real World Data was ~4% to 5% freemium conversion.");
    if (maxConv >= 3 && maxConv <= 7) {
        console.log("✅ 验证成功：系统在匿名条件下，准确推演出了 2013 年 Zoom 级别的低门槛、稳健转化模型！");
    } else {
        console.log("❌ 验证失败：推演数据与历史真实偏差过大。");
    }
}

verifyBlindTest().catch(console.error);
