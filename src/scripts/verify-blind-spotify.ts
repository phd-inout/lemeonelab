import { scanSeed } from '../lib/engine/cortex-ai';
import { generatePopulation, stepSimulation } from '../lib/engine/simulator';
import { SandboxState, UserTier } from '../lib/engine/types';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * [BLIND TEST] PROJECT GREEN-STREAM (2011)
 * Historical Target: Spotify (Actual Conversion ~20-25% in 2011-2012)
 * Data Source: Spotify S-1 Filing / HBR Case Study
 */
async function verifySpotifyBlind() {
    console.log("🎵 [BLIND TEST] INITIATING PROJECT 'GREEN-STREAM' (2011) EMPIRICAL VALIDATION\n");
    console.log("Context: You are evaluating a music startup in 2011. Market: iTunes ($0.99/song), Pandora (Radio-style, no control).\n");

    const blindDocs = `
# Project Specs: Green-Stream Music Engine (2011)

## Technical Edge (D1-D4)
- 独有的 P2P + CDN 混合分发技术，点击播放按钮到听到音乐的延迟低于 200ms（感官上是即时的）。
- 拥有超过 1500 万首正版曲库，支持 320kbps 高音质流媒体。
- 极佳的跨平台同步，桌面端与移动端歌单实时联动。

## Product Design & Friction (D5)
- **Freemium 模式但带有强限制**: 
  - 免费版：每隔几首歌强制播放 30 秒语音广告。
  - 移动端限制：免费用户只能“随机播放”，无法指定歌曲播放，且每天跳过次数受限。
  - 离线限制：免费用户无法下载音乐，必须在线收听。
- **付费版 ($9.99/月)**: 彻底去除广告，支持高清离线下载，拥有完全的播放控制权。

## Social & Growth (D7)
- 与 Facebook 深度集成，用户正在听的歌会实时同步到社交动态（病毒式传播极强）。

## Competitive Context
- 相比于每首歌收钱的 iTunes，它是“自助餐”模式；相比于无法点播的 Pandora，它提供了更强的控制权（仅限付费）。
    `.trim();

    console.log("1️⃣ [PARSING] Scanning Specs via Cortex AI (Identity Hidden)...");
    const scanResult = await scanSeed([blindDocs], "");
    const seed = scanResult.seed;
    
    seed.mean[12] = 0.05; // 初始知名度

    console.log("\n--- AI 自动提取的 13D 商业基因 ---");
    console.log(`D1-D4 (Core/Performance): [${seed.mean.slice(0, 4).map((v: number) => v.toFixed(2)).join(', ')}]`);
    console.log(`D5 (Friction/Model):      ${seed.mean[4].toFixed(2)} (预期 0.70-0.80，因为限制很多)`);
    console.log(`D7 (Social/Viral):        ${seed.mean[6].toFixed(2)} (预期很高，社交集成)`);

    console.log("\n2️⃣ [SIMULATION] Generating 100,000 Agents & Starting 48-Week Evolution...");
    const agents = generatePopulation(seed, 100000);
    
    let state: SandboxState = {
        id: uuidv4(),
        tier: 'ENTERPRISE' as UserTier,
        epoch: 0,
        cash: 10000000, 
        burnRate: 500000, // 巨额版权支出
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
    let maxActive = 0;

    for (let i = 1; i <= 48; i++) {
        state = await stepSimulation(state);
        const { earningPotential, activePaidUserCount } = state.metrics;
        const convRate = (earningPotential / activePaidUserCount) * 100 || 0;
        
        if (convRate > maxConv) maxConv = convRate;
        if (activePaidUserCount > maxActive) maxActive = activePaidUserCount;

        if (i % 8 === 0 || i === 1) {
            console.log(`T+${state.epoch}\t${activePaidUserCount.toLocaleString()}\t\t${earningPotential.toLocaleString()}\t\t${convRate.toFixed(1)}%\t${state.currentStage}`);
        }
    }

    console.log(`\n🏆 [RESULT] Simulation Complete:`);
    console.log(`- Peak Active Users: ${maxActive.toLocaleString()}`);
    console.log(`- Max Conversion: ${maxConv.toFixed(1)}%`);
    
    console.log("\n📊 [COMPARISON WITH REALITY]");
    console.log("Target: Spotify (2011-2012) Real World Data was ~20% to 25% paid conversion.");
    if (maxConv >= 18 && maxConv <= 28) {
        console.log("✅ 验证成功：系统准确识别了 Spotify 这种“通过高摩擦驱动高转化”的 B2C 特例！");
    } else {
        console.log("❌ 验证失败：变现率与真实数据 (20%+) 偏差过大。");
    }
}

verifySpotifyBlind().catch(console.error);
