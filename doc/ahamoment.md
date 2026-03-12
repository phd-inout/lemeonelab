# Aha-Moment 机制设计文档

> **定位**：本文档描述 lemeone-lab 中"顿悟时刻"的触发逻辑、技术实现与体验设计。Aha-Moment 不是彩蛋，是产品的核心留存钩子——让用户第一次感受到"这个模拟器在对着我说真话"。

---

## 一、设计目标

lemeone-lab 的核心价值主张是：**在投入真实的一分钱前，先在终端里失败 100 次**。

Aha-Moment 机制就是让"失败"变得有意义的那一层。它不是简单的 Game Over 提示，而是通过 AI 将冰冷的数值变化映射到用户能产生共鸣的真实商业经验中，完成从"游戏失败"到"认知升级"的转化。

**设计三原则：**
1. **真实痛感**：触发时机必须精准——在用户刚刚犯了一个"自以为正确"的错误之后。
2. **有据可查**：AI 输出的内容必须有真实案例背书，不能是空洞说教。
3. **仪式感**：终端的视觉反馈要配合内容，制造"灵魂被剖析"的沉浸感。

---

## 二、四类核心 Aha-Moment 场景

### 2.1 AI 毒舌复盘（The Hard Truth）

**触发时机**：`sprint` 执行结束后，进度度量 `dev_progress` 增量 < 预期的 40%，或现金流低于"生存缓冲"阈值。

**触发逻辑**：
```
if (sprintResult.progressDelta < sprint.expected * 0.4 || company.cash < company.survivalBuffer) {
  triggerAhaMoment('hard_truth', currentSnapshot)
}
```

**体验流程**：
1. 终端打字机效果输出警报（红色 ANSI 边框）
2. AI 顾问角色（Persona：刻薄但极度资深的创业老炮）发言
3. 通过 Graph-RAG 检索最匹配的真实失败案例，进行对照输出
4. 末尾提出一个**可操作的反问**，而非答案

**示例输出**：
```
╔══════════════════════════════════════════════════╗
║  ⚡ CORTEX HARD TRUTH — SPRINT #4 REVIEW         ║
╚══════════════════════════════════════════════════╝

你的研发进度只推进了预期的 31%。

这让我想起 Segway。他们花了 5 年打磨出一个
"改变世界的平衡车"，却在上市第一周发现：
没有人需要在人行道上以 20km/h 代步。

你现在的问题不是技术不够好——
你的 TEC 值已经是市场平均水平的 2.3 倍。
问题是：你还没跟任何一个真实用户对话过。

→ 下一步，你会选择继续堆砌代码，还是走出去验证假设？
```

---

### 2.2 隐形护城河觉醒（The Ops Debt Explosion）

**触发时机**：`TEC / OPS > 3.5` 且该比例持续超过 **3 个 sprint 周期**。

**触发逻辑**：
```
const entropyScore = state.founder.tec / state.founder.ops
if (entropyScore > 3.5 && state.opsDebtStreak >= 3) {
  triggerAhaMoment('ops_debt_explosion', currentSnapshot)
}
```

**体验流程**：
1. **"代码腐烂"可视化**：终端模拟一段日志流，显示系统组件逐一报错（伪造的 stack trace 风格）
2. Glitch 效果：文字出现短暂闪烁/乱码（CSS/JS 控制 `xterm.js` 渲染层）
3. 强制中断当前操作，进入"技术债清算模式"
4. AI 给出量化的损失估算：以**时间成本**和**现金成本**双维度呈现

**示例输出**：
```
[SYSTEM ALERT] ███████████ OPS ENTROPY CRITICAL

> checking /workflow/pipeline.ts .............. [CORRUPT]
> checking /infra/deploy.sh .................. [DRIFT]  
> checking /finance/billing.ts .............. [MISSING]

你的运营熵值已达到 4.2。
过去 3 个 Sprint，你堆了 14 个新功能，
但没有一个上了监控，没有一个写了部署文档。

真实代价：
  • 清理这些技术债 = 额外 6 周工期 + ¥80,000 外包成本
  • 你的 MVP 上线窗口从 Q2 滑到 Q3

管理效率也是生产力。这不是软技能，这是算法。
```

---

### 2.3 生物极限反馈（The Burnout Insight）

**触发时机**：`bw_stress`（带宽压力）> 95 持续 **2 个 sprint 周期**，且创始人年龄 ≥ 35，或使用了强制加班指令 `sprint --overtime`。

**触发逻辑**：
```
if (founder.bwStress > 95 && founder.bwStressStreak >= 2) {
  if (founder.age >= 35 || sprint.options.overtime) {
    triggerAhaMoment('burnout_insight', currentSnapshot)
  }
}
```

**永久属性惩罚机制**（区别于普通惩罚）：
- 随机选择一项属性施加 **-5 到 -15 点的永久损耗**（不可恢复）
- 系统在触发前不给任何预警——这是设计上的刻意选择

**体验流程**：
1. 正常 sprint 输出突然被打断
2. 出现一封"外部消息"（模拟短信 / 邮件 ANSI 样式）
3. 揭示永久属性损耗的事实
4. AI 用第二人称提出一个关于"极限管理"的认知框架

**示例输出**：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 MESSAGE — 来自：老妈
   "你上次回来是什么时候的事了？
    你爸说他有时候在想，你创业
    到底是为了什么。"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[CORTEX ENGINE] 永久属性变更记录：
  魅力/抗压 (CHA)  : 72 → 61  (-11) [PERMANENT]

超级个体的边界不是努力的天花板，
而是恢复力的下限。

Paul Graham 在 2024 年写道：
"那些真正走到 IPO 的创始人，
无一例外地学会了把精力当成资产来管，而非消耗品。"
```

---

### 2.4 反直觉成功（The Lucky Pivot）

**触发时机**：随机概率（基础 8%，可被 CHA 属性和当前阶段修正），在非预期的方向出现增长信号时触发。专门设计在用户即将放弃或做出"错误决策"后的第一个 sprint 周期出现。

**触发逻辑**：
```
const luckRoll = Math.random()
const luckThreshold = 0.08 * (1 + founder.cha / 200)
if (luckRoll < luckThreshold && state.isPostBadDecision) {
  triggerAhaMoment('lucky_pivot', currentSnapshot)
}
```

**设计意图**：
- 不是奖励"好决策"，而是奖励"能识别并利用意外"的能力
- 强化"适应性"比"精准预判"更重要的认知

**示例输出**：
```
[UNEXPECTED SIGNAL DETECTED]

你上周砍掉的那个"无用功能"——
有人截图发到了 X 上。

帖子互动量：47,000
新注册用户（24h）：+312

AI 分析：这不是你的功劳，但可以变成你的优势。
你能在未来 2 周内把这个"意外需求"转化为
可重复的增长引擎吗？

在 2026 年，运气是决策的一部分。
捕捉到偏差并将其沉淀为流程，才是真正的能力。
```

---

## 三、技术实现架构

### 3.1 触发层：状态感知监控器（State Monitor）

系统不监控单一数值，而是监控**数值比例与时序趋势**。

```typescript
// src/engine/insight-monitor.ts

interface InsightRule {
  id: string
  condition: (state: GameState) => boolean
  priority: number  // 数值越高越优先触发
  cooldown: number  // 同一规则的最小触发间隔（单位：sprint 数）
}

const INSIGHT_RULES: InsightRule[] = [
  {
    id: 'ops_debt_explosion',
    condition: (s) => s.founder.tec / s.founder.ops > 3.5 && s.opsDebtStreak >= 3,
    priority: 10,
    cooldown: 5,
  },
  {
    id: 'burnout_insight',
    condition: (s) => s.founder.bwStress > 95 && s.founder.bwStressStreak >= 2,
    priority: 9,
    cooldown: 4,
  },
  {
    id: 'hard_truth',
    condition: (s) => s.lastSprintProgressRatio < 0.4 || s.company.cash < s.company.survivalBuffer,
    priority: 7,
    cooldown: 2,
  },
  {
    id: 'lucky_pivot',
    condition: (s) => Math.random() < 0.08 * (1 + s.founder.cha / 200) && s.isPostBadDecision,
    priority: 5,
    cooldown: 6,
  },
]

export function checkAhaMoment(state: GameState): InsightRule | null {
  return INSIGHT_RULES
    .filter(rule => rule.condition(state) && !isOnCooldown(rule, state))
    .sort((a, b) => b.priority - a.priority)[0] ?? null
}
```

---

### 3.2 检索层：Graph-RAG 知识映射（Knowledge Mapping）

将真实商业史案例存入向量数据库，通过当前经营快照作为 Query 检索最相关案例。

```typescript
// src/ai/rag-retriever.ts

async function retrieveRelevantCase(snapshot: GameSnapshot): Promise<BusinessCase> {
  const query = buildQuery(snapshot)
  // 使用 pgvector 相似度检索
  const cases = await vectorDB.similaritySearch(query, { topK: 3 })
  // Graph 关系补充：找到"因果链"而非仅关键词匹配
  return enrichWithCausalGraph(cases[0])
}

function buildQuery(snapshot: GameSnapshot): string {
  return `
    行业阶段: ${snapshot.stage}
    技术/运营比: ${(snapshot.founder.tec / snapshot.founder.ops).toFixed(2)}
    资金状态: ${snapshot.cashStatus}
    核心瓶颈: ${snapshot.bottleneck}
  `
}
```

**语料库方向（初期）**：
| 案例 | 适配触发场景 |
|------|-------------|
| Segway | 技术过度投入、忽略市场验证 |
| WeWork | 融资狂欢后的现金流危机 |
| Quibi | 产品与市场时机错位 |
| 字节跳动早期 | 算法驱动的反直觉增长 |
| Notion 早期 | 缓慢积累 + 意外爆发 |

---

### 3.3 叙事层：Semantic Mapping 与 人格化 Prompt 引擎

> **核心机制**：在将上下文推给大模型之前，通过 `SemanticContextService` 将冰冷的数据库数值投影为 `SOUL.md`, `DASHBOARD.md`, `JOURNAL.md`（详见 [语义映射层设计](./SemanticMappingLayer_语义映射层设计.md)），消除 AI 对于数值的幻觉。

```typescript
// src/ai/cortex-ai.ts
import { SemanticContextService } from './semantic-context.service'

const PERSONA_HARD_TRUTH = `
你是一个经历过 3 次创业失败、1 次成功 IPO 的资深导师。
你说话直接、刻薄，但每句话都有数据和案例支撑。
你不给安慰，只给事实和可执行的下一步。
语气参考：Paul Graham 的 essays + 李录的价值投资框架。
`

async function generateAhaContent(
  persona: string,
  case_: BusinessCase,
  rehearsal: Rehearsal
): Promise<string> {
  const semanticMarkdownContext = SemanticContextService.generateAhaContext(rehearsal)

  return await gemini.generateContent({
    systemInstruction: persona,
    contents: \`
      \${semanticMarkdownContext}

      匹配的真实商业案例：\${case_.summary}
      
      请用 200 字以内，指出玩家正在犯的核心错误，
      引用上述案例进行类比，
      最后用一个反问句结尾，引导玩家思考。
    \`,
    generationConfig: { maxOutputTokens: 300 }
  })
}
```

---

### 3.4 表现层：终端多模态反馈（UX Feedback）

```typescript
// src/components/terminal/aha-renderer.ts

export async function renderAhaMoment(type: AhaMomentType, content: string) {
  switch (type) {
    case 'ops_debt_explosion':
      await glitchEffect(terminal, 800)     // 闪烁效果
      await fakeErrorLogStream(terminal)    // 伪造的错误日志流
      await typewriterPrint(terminal, content, { color: 'red', speed: 30 })
      break

    case 'burnout_insight':
      await smsNotificationFrame(terminal, content)  // 短信边框样式
      await typewriterPrint(terminal, content, { color: 'yellow', speed: 25 })
      break

    case 'hard_truth':
      await warningBanner(terminal, 'CORTEX HARD TRUTH')
      await typewriterPrint(terminal, content, { color: 'white', speed: 35 })
      break

    case 'lucky_pivot':
      await signalDetectedAnimation(terminal)
      await typewriterPrint(terminal, content, { color: 'green', speed: 40 })
      break
  }
}
```

**ANSI 样式规范**：
- 🔴 红色：危机/失败类触发（Hard Truth、Ops Debt）
- 🟡 黄色：生理/情感类触发（Burnout）
- 🟢 绿色：机会/反转类触发（Lucky Pivot）
- ⚪ 白色：中性分析输出

---

## 四、实现路径

### Phase 1（Pre-alpha，随引擎同步实现）
- [ ] 建立 `insight_rules.json`，定义触发条件（状态阈值硬编码版本）
- [ ] 在 `simulator.ts` 的 `sprint()` 方法末尾调用 `checkAhaMoment()`
- [ ] 实现基础的 `typewriterPrint` + 颜色渲染

### Phase 2（Alpha，接入 AI 叙事）
- [ ] 接入 Gemini，实现 `generateAhaContent()` 的四种 Persona
- [ ] 准备初期 5 条"商业史反面教材"语料（无需向量库，直接硬编码）
- [ ] 实现 `glitchEffect` 和 `smsNotificationFrame` 视觉效果

### Phase 3（Beta，接入 RAG）
- [ ] 将语料库迁移至 pgvector，实现语义检索
- [ ] 实现 `enrichWithCausalGraph()`，从关键词匹配升级为因果链检索
- [ ] 支持 DLC 注入定制语料（行业专属案例）

---

## 五、关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| AI 输出是否流式 | ✅ 是 | 流式打字机效果是仪式感的关键，等待感本身就是体验的一部分 |
| 惩罚是否可恢复 | ❌ 永久属性损耗不可恢复 | 让每次决策都有真实重量，消除"存档读档"心理 |
| Aha-Moment 是否有 CD | ✅ 有冷却期 | 避免频繁触发导致用户脱敏，降低叙事价值 |
| 是否在触发前预警 | ❌ 无预警（Burnout 类） | 模拟真实世界的突然性，增强情感冲击 |
| 语料库是否开放 | ✅ DLC 可注入 | 与 lemeone-lab 插件化架构对齐，行业剧本可带入专属案例 |