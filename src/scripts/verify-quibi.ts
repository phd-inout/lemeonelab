import { scanSeed, runAudit } from '../lib/engine/cortex-ai';
import { generatePopulation, stepSimulation } from '../lib/engine/simulator';
import { SandboxState, UserTier } from '../lib/engine/types';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

// Load environment variables for AI
dotenv.config({ path: '.env.local' });

async function verifyQuibi() {
    console.log("🎬 [CASE STUDY] INITIATING QUIBI (2020) EMPIRICAL VALIDATION\n");

    const quibiDocs = `
# Quibi 商业计划书与用户反馈 (2020)

## 产品定义 (PRD/BP)
- **核心定位**: 为手机量身定制的“好莱坞级”短视频流媒体平台。
- **内容制作**: 单集成本高达 10 万美元，由斯皮尔伯格等顶级导演操刀，画面极度精美。
- **独家技术**: Turnstyle 技术，用户旋转手机时，视频能在横屏和竖屏间无缝切换，不影响观看体验。
- **宣发投入**: 极其庞大，包括超级碗黄金时段广告，上线前已家喻户晓。
- **商业模式**: 仅提供付费订阅（带广告 $4.99/月，无广告 $7.99/月），完全没有免费试用档位。
- **平台限制**: 只能在手机端观看，不支持投屏到电视。
- **社交限制**: 严禁截屏或录屏，防止版权泄露。

## 早期用户调研 (Research Docs)
- "画面真的很清晰，Turnstyle 切换很顺滑，感觉技术很牛。"
- "我想把那个搞笑的片段截图发给朋友，结果发现居然黑屏截不了？这太反人类了！"
- "我都在家隔离了，为什么我不能把它投到我的大电视上看？捧着手机看 10 分钟太累了。"
- "TikTok 是免费的，YouTube 是免费的，我为什么要花钱看这个？"
    `.trim();

    console.log("1️⃣ [PARSING] Scanning Quibi PRD/BP via Cortex AI...");
    const scanResult = await scanSeed([quibiDocs], "");
    const seed = scanResult.seed;
    
    console.log("\n--- AI 提取及校准后的 13D 商业基因 (Quibi) ---");
    console.log(`D1-D4 (Core):    [${seed.mean.slice(0, 4).map((v: number) => v.toFixed(2)).join(', ')}]`);
    console.log(`D5 (Friction):   ${seed.mean[4].toFixed(2)} (预期极低，代表强制付费的高门槛)`);
    console.log(`D7 (Social):     ${seed.mean[6].toFixed(2)} (预期极低，严禁截屏/分享)`);
    console.log(`D13 (Awareness): ${seed.mean[12]?.toFixed(2) || 'N/A'} (预期极高，超级碗广告)`);

    // 2️⃣ [SIMULATION] Generating 100,000 Agents & Starting T+24 Evolution...
    // 引入“市场怀疑论”：手动增加群体基因的标准差，模拟一个多样化、不完美契合的市场
    const marketSeed = { ...seed };
    marketSeed.std = [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]; // 显著增加差异性
    
    const agents = generatePopulation(marketSeed, 100000);
    
    let state: SandboxState = {
        id: uuidv4(),
        tier: 'ENTERPRISE' as UserTier,
        epoch: 0,
        cash: 17500000, 
        burnRate: 800000, 
        techDebt: 0,
        currentStage: 'SEED',
        productVector: seed.mean,
        agents,
        metrics: { avgResonance: 0, conversionRate: 0, earningPotential: 0, survivalRate: 1.0, activePaidUserCount: 0 },
        assets: { proposal: '', backlog: '', marketFeedback: '', stressTestReport: '', journal: '' },
        history: []
    };

    console.log("\nEpoch\tActive Users\tPaid Users\tConv %\tCash\t\tSurvival%");
    console.log("----------------------------------------------------------------------------------");

    for (let i = 1; i <= 24; i++) {
        state = await stepSimulation(state);
        const { earningPotential, activePaidUserCount, survivalRate } = state.metrics;
        const convRate = (earningPotential / activePaidUserCount) * 100 || 0;
        
        console.log(`T+${state.epoch}\t${activePaidUserCount.toLocaleString()}\t\t${earningPotential.toLocaleString()}\t\t${convRate.toFixed(1)}%\t$${Math.floor(state.cash).toLocaleString()}\t\t${(survivalRate * 100).toFixed(1)}%`);
        
        if (state.cash <= 0) {
            console.log(`\n💥 [BANKRUPT] Quibi ran out of cash at Epoch T+${state.epoch} (Approx. ${Math.floor(state.epoch/4)} months).`);
            break;
        }
    }

    if (state.cash > 0) {
        console.log(`\n⚠️ [SURVIVED] Quibi survived 6 months. Cash remaining: $${Math.floor(state.cash).toLocaleString()}`);
    }

    console.log("\n3️⃣ [AUDIT] Running Deep AI Audit to diagnose failure...");
    const auditAssets = await runAudit(state);
    
    console.log("\n=== 战略诊断报告 (Stress Test) ===");
    console.log(auditAssets.stressTestReport);

    console.log("\n=== 唯一优先行动 (Backlog) ===");
    console.log(auditAssets.backlog);

    console.log("\n=== 真实用户回声 (Market Feedback) ===");
    console.log(auditAssets.marketFeedback);
    
    console.log("\n🏁 [VALIDATION COMPLETE]");
}

verifyQuibi().catch(console.error);
