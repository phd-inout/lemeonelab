# **lemeone-lab：硅谷神经网络名人堂 (Leaderboard System)**

排行榜在本项目中不仅是社交激励，更是**"最优经营路径"的公开索引**。它将证明谁才是真正的"超级个体"。

> **技术栈说明**：排行榜数据存储与实时同步统一使用 **Supabase**（PostgreSQL + Realtime），

---

## **1. 核心榜单维度 (Ranking Dimensions)**

我们不设置单一的财富榜，而是通过三个核心维度来评价"一人公司"的成就：

### **A. 估值天梯 (The Valuation Ladder)**

- **核心指标**：公司当前估值 `V`
- **计算逻辑**：`V = MRR × industryMultiplier + moat + cash`
- **意义**：最直观的商业成功衡量。

### **B. 效能巅峰 (The Efficiency Peak — 核心推荐)**

- **核心指标**：单位带宽价值产生率 `VpB (Value per Bandwidth)`
- **计算逻辑**：`VpB = totalValueCreated / totalBandwidthConsumed`
- **意义**：奖励那些用最少的精力、最健康的作息赚到最多钱的玩家。这是"超级个体"的最高荣誉，杜绝"暴力加班"刷榜。

### **C. 坚韧传说 (The Resilience Legend)**

- **核心指标**：处于 TITAN 阶段的总天数
- **意义**：在面对高频的"反垄断"和"黑天鹅"事件时，能活得最久的玩家。

---

## **2. 交互设计：终端美学 (Terminal Aesthetics)**

排行榜通过 `top` 或 `rank` 指令在终端中唤起。

- **视觉风格**：
  - 使用 ASCII 字符画构建奖杯和分割线
  - **动态更新**：排名变化时，终端会有类似股价波动的闪烁效果
  - **幽灵回放 (The Ghost Run)**：点击排行榜上的名字，可以调取该玩家最近 10 次的 sprint 日志快照

---

## **3. 社交博弈与演化机制：死难者名录 (The Graveyard)**

这是一个极具“寓教于乐”和**“生态演化”**意义的设计。系统不仅展示死者，更提取死者的基因来反哺整个生态。

- **功能**：记录那些破产或创始人过劳“阵亡”的存档。
- **所得 (AI 尸检)**：其他玩家可以查看这些失败案例的“尸检报告”（由 AI 结合游戏快照数据生成的复盘），了解他们在哪个决策点跌倒。**底层由 `SemanticContextService` 构建死者生前的 `JOURNAL.md` 记忆链等语义上下文喂给 AI（详见 [语义映射层设计](./SemanticMappingLayer_语义映射层设计.md)）。**
- **与 Aha-Moment 联动**：尸检报告直接复用 `hard_truth` 的 RAG 检索链路，因为两者都在 pgvector 中，可以关联分析。
- **进阶：演化博弈 (Evolutionary Game Theory) 与回归反馈**
  - **市场负向引力**：记录每一局破产玩家在触发 GameOver 那一刻的“死亡向量快照”。这些海量的失败快照将作为云端大盘的“市场负向引力”，随着特定流派（如无脑堆量）尸骨堆积，市场目标向量会自动产生物理斥力，排斥后来者进入同一片红海区。
  - **演化稳定策略 (ESS) 打压**：系统将全球玩家平均决策向量建模为策略池。若某个玩家摸索出了极其高效的策略（极高 VpB 值的模型）并霸榜，系统将自动把该套路识别为“演化稳定策略 (ESS)”，并在库中为后续跟风者衍生“抗性事件（规则打压、巨头抄袭）”，模拟真实商业中“利润被竞争摊平”的必然规律。这种机制赋予了底层数值模型真正的生命力。
- **口号**：**“吸取他人的教训，是通往 TITAN 阶段的捷径；但抄袭他人的捷径，则是前往墓地的直通车。”**

---

## **4. 技术实现路径 (Technical Implementation)**

### **4.0 为什么不用 Firestore**

原设计提及 Firestore，但与现有技术栈存在根本性冲突：

| 对比项 | Firestore | Supabase Realtime（现选择）|
|--------|-----------|--------------------------|
| 数据库类型 | NoSQL (Google Cloud) | PostgreSQL |
| 与 Prisma 兼容 | ❌ 需独立 SDK，双维护 | ✅ 原生支持 |
| 与 pgvector (RAG) 联动 | ❌ 跨库查询不可行 | ✅ 同库 JOIN |
| 实时订阅能力 | ✅ onSnapshot | ✅ Realtime Subscriptions（等价） |
| 行级权限控制 | ✅ Security Rules | ✅ Row Level Security (RLS) |
| 认证系统 | Firebase Auth（与 Clerk 冲突） | 与 Clerk 独立，不冲突 |

**结论**：Supabase 已是项目基建选型，其 Realtime 功能完全覆盖 Firestore 的使用场景，无需引入额外技术栈。

---

### **4.1 数据库设计 (Prisma Schema)**

```prisma
// 排行榜快照表（每次模拟结束时写入）
model LeaderboardEntry {
  id              String   @id @default(uuid())
  userId          String
  founderName     String
  archetype       String   // 人生背景类型
  stage           String   // 当前阶段：SEED / MVP / PMF / SCALE / IPO / TITAN
  valuation       Float    @default(0)
  efficiencyScore Float    @default(0)  // VpB 值
  daysSurvived    Int      @default(0)
  isFailed        Boolean  @default(false)
  failedReason    String?  // Graveyard 模式下存在，由 AI 生成
  rehearsalId     String   // 关联 Rehearsal 表，可 JOIN 完整快照
  createdAt       DateTime @default(now())

  rehearsal       Rehearsal @relation(fields: [rehearsalId], references: [id])
}
```

### **4.2 实时同步 (Supabase Realtime)**

使用 Supabase 的 Realtime Subscriptions 替代 Firestore 的 `onSnapshot`：

```typescript
// src/services/leaderboard-realtime.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export function subscribeToLeaderboard(onUpdate: (entry: LeaderboardEntry) => void) {
  return supabase
    .channel('leaderboard-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'LeaderboardEntry',
        filter: 'stage=eq.TITAN',  // 只推送进入 TITAN 的事件
      },
      (payload) => {
        onUpdate(payload.new as LeaderboardEntry)
        // 对应原 Firestore onSnapshot 的效果：
        // [GLOBAL] 警报：玩家 @Alex 刚刚带领公司跨入 TITAN 阶段
        terminal.writeln(`\x1b[33m[GLOBAL] 警报：玩家 @${payload.new.founderName} 刚刚跨入 TITAN 阶段\x1b[0m`)
      }
    )
    .subscribe()
}
```

### **4.3 核心查询**

```typescript
// 获取效能榜 Top 20
async function getEfficiencyLeaderboard() {
  return await prisma.leaderboardEntry.findMany({
    where: { isFailed: false },
    orderBy: { efficiencyScore: 'desc' },
    take: 20,
    include: { rehearsal: true },  // 可 JOIN 完整游戏数据
  })
}

// 获取死难者名录（Graveyard），AI 尸检报告按失败原因分类
async function getGraveyard() {
  return await prisma.leaderboardEntry.findMany({
    where: { isFailed: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}
```

---

## **5. 商业化埋点：声誉保护**

- **逻辑**：如果玩家即将破产，可以消费"算力积分"购买一次"公关紧急干预"，从而避免掉入 The Graveyard 榜单，维持自己的"不败金身"。
- **实现**：在写入 `LeaderboardEntry` 前检查用户的积分余额，若触发保护则将 `isFailed` 置为 `false` 并清除 `failedReason`。

---

## **6. 与其他模块的依赖关系**

```
LeaderboardEntry
  ├── JOIN → Rehearsal（完整游戏快照）
  ├── JOIN → pgvector（Graveyard 尸检报告的 RAG 检索）
  └── PUSH → Supabase Realtime（全球玩家终端广播）
```

所有依赖均在 Supabase (PostgreSQL) 内部完成，无跨数据库调用。