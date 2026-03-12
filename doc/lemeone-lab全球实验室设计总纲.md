# **lemeone-lab：AI 超级个体极致模拟引擎设计总纲**

## **1\. 项目定义 (Project Definition)**

**lemeone-lab** 已从单纯的“数值小游戏”升维为一款**AI 首席运营官（COO）兼战略推演沙盒**。它不仅是经营压力测试工具，更是创业者的“飞行模拟器”。

* **核心口号**：在投入真实的一分钱前，先与 AI COO 完成 100 次推演。
* **产品定位**：从数值模拟（Numerical Sim）升维到决策协同（Decision Copilot）。它彻底解决了“看戏感”，让用户在模拟中获得真实的**项目建议书 (PROPOSAL)**、**需求池 (BACKLOG)** 和 **市场画像 (MARKET_FEEDBACK)**。


## **2\. 核心逻辑引擎设计 (Engine Design)**

模拟引擎（Cortex Engine）是系统的“心脏”，负责处理从“初始向量”到“经营结果”的非线性演化。

### **2.1 创始人能力建模 (The Hexagon Model)**

为了实现“人的建模”的合理性，系统将人的能力拆解为**静态属性点 (Static Attributes)** 与 **动态效能系数 (Dynamic Performance)** 两个维度。

#### **2.1.1 六维属性向量 (The Hexagon Vector)**

基础属性值设定在 ![][image1] 之间，代表创始人的“天赋”与“积累”：

1.  ![][image2] **(营销能力)**：影响品牌溢价及获客成本（CAC）。  
2.  ![][image3] **(技术/AI 驾驭)**：决定研发任务的基准产出速度。  
3.  ![][image4] **(基础学习力)**：影响新科技树解锁及属性点升级的速率。  
4.  ![][image5] **(财务感知)**：决定资金利用率及对现金流危机的预警精度。  
5.  ![][image6] **(运营/流程)**：影响行政内耗的减免及技术债的积累速度。  
6.  ![][image7] **(魅力/抗压)**：决定融资成功率、人脉获取及团队关系度（Bonding）的稳定性。

#### **2.1.2 初始人生背景 (Life Backgrounds)**

在初始化阶段，用户选择不同的背景，将决定初始属性点的分配倾向及启动资金：

*   **学院派黑客 (Fresh Grad)**：高 ![][image8]，低 ![][image9]，资金匮乏。  
*   **大厂逃离者 (Corporate Refugee)**：高 ![][image10]，由于长期职业倦怠初始 ![][image7] 较低，资金充足。  
*   **中年连续创业者 (Serial Pro)**：高 ![][image11]，初始人脉丰富，![][image3] 敏感度一般。  
*   **行业老兵 (Industry Veteran)**：极高 ![][image9]，高资产，但 ![][image12] 效能随年龄衰减严重。  
*   **白手起家 (Plain Starter)**：各属性处于均值（60），适合追求纯粹公平模拟的用户。  
*   **自定义 (Custom Vector)**：允许用户自由分配 360 个基础属性点（平均 60 分）。玩家可以通过“透支初始资金”换取额外点数（最高补足至 450 点），但每增加 1 点属性将导致初始现金大幅下降。这体现了“为约束设计”：你无法在开局就拥有满分 600 点的“完美超人”。

#### **2.1.3 年龄与生理约束 (Biological Constraints)**

年龄不改变属性值，但会改变执行任务时的“效能乘数”：

*   **20-29 岁**：研发/学习 效能 1.2x，带宽 (BW) 恢复速度极快，具备![][image13]  
    特质（降低决策失败的心理打击）。  
*   **30-39 岁**：执行 效能 1.1x，各领域表现均衡。  
*   **40-49 岁**：管理/营销 效能 1.2x，研发 效能下降，拥有![][image14]  
    特质（初始人脉点数加成）。  
*   **50 岁以上**：决策/融资 效能 1.3x，学习 效能大幅下降，带宽 上限较低，高强度工作有![][image15]  
    惩罚。

## **2.2 愿景定义与战略对齐 (Vision & Strategic Alignment)**

这是从骨架引擎注入"灵魂"的核心步骤。在 `init-company` 指令中，AI 不再只是评分员，而是你的**资深创始合伙人**，负责将你的 Idea 拆解为可落地的战略文档。

#### **2.2.1 行业选择与商业模式 (Industry & Model)**

行业与模式决定了市场环境的波动率、属性权重及现金流结构。在完成选择后，AI COO 将基于你的 Idea 生成初始文档。

#### **2.2.2 Idea Calibration 2.0：从评分到“现实的重击”**
> **核心哲学**：输入一个点子，AI COO 会给你一份涉及预算、人力需求和风险预警的**项目建议书 (PROPOSAL.md)**。

**评估反馈将包含：**
1. **预算与工作量评估**：不再是抽象的分数，而是：“首版 MVP 需要研发 12 周，月支出约 ¥50,000，当前资金仅够支撑 8 周。”
2. **风险对齐**：AI 会指出核心矛盾点（如：法律红线、人才缺口）。
3. **决策选择**：AI 会询问用户：“是按‘修仙强度’硬上，还是调整方向（Pivot）？”

#### **2.2.3 语义化的工作产出 (Semantic Deliverables)**
模拟过程不再仅仅产生数字，而是不断充实以下 Markdown 文档：
*   **PROPOSAL.md (项目建议书)**：包含预算、人力需求和风险评估。
*   **BACKLOG.md (需求任务池)**：随着研发推进，AI 自动填入具体的开发任务、逻辑架构和交互细节。
*   **MARKET_FEEDBACK.md (市场画像)**：存储 AI 模拟出的用户原声、Reddit 社区反馈及调研结论。
 `pivot --to <新模式>`，代价是消耗 30% 当前现金 + OPS 属性临时下降（团队重组混乱期）。这是最真实的创业写照。

### **2.2.3 产品进度双轨制 (The Product Gap)**

技术进度（Tech Progress）≠ 产品成熟度（Product Maturity），两者必须分开追踪：

```typescript
interface ProductState {
  techProgress: number    // 0-100，代码/功能完成度
  productMaturity: number // 0-100，用户体验/PMF程度
  conversionRate: number  // 收入转化率 = f(productMaturity, moat)
}

```typescript
// 收入公式：高 techProgress 但低 productMaturity = 高技术、低变现
function calcRevenue(product: ProductState, productMarket: ProductMarketContext): number {
  const gap = product.techProgress - product.productMaturity
  const gapPenalty = Math.max(0, gap * 0.3)  // 技术/产品脱节惩罚
  return product.productMaturity * product.conversionRate * (1 - gapPenalty / 100)
}
```

> **架构注：** 从 V1 开始，公司支持**多条产品线（ProductLines）并行**。每次执行 `dev` 和 `test` 指令时，效果仅施加于当前被标记为 `isFocal: true` 的主力产品线。通过 `prod` 指令，玩家可以随时切换研发聚焦，或关停持续失血的次要产品线（`isClosed: true`），及时止损释放算力。

**The Product Gap 的 Aha-Moment**：当 `techProgress - productMaturity > 40` 时，系统触发"工程师思维陷阱"事件，AI 点评："你造了一辆兰博基尼，但用户要的是一辆自行车。"

### **2.2.4 Idea Calibration System（点子校准引擎）**

> **核心哲学**：一个好点子，事半功倍。`init-company` 不只是选行业和商业模式，
> 玩家还可以用一句话描述自己的产品 idea，AI 会评估其质量并**直接校准引擎的初始参数**。
> 这不是装饰性功能——好 idea 和坏 idea 会让整局游戏的难度出现实质性差异。

#### **四维评估框架**

```typescript
interface IdeaCalibration {
  painPointAcuity:     number  // 0-30：痛点真实性与紧迫度 → 映射 MRR 增长率乘数
  marketTiming:        number  // 0-25：2026 年是否是正确时机 → 映射市场波动率修正
  founderFit:          number  // 0-25：idea 与创始人背景契合度 → 映射属性 bonus
  differentiationEdge: number  // 0-20：差异化程度 → 映射初始 moat 值
  total:               number  // 0-100

  // 直接写入 GameState 的参数
  mrrGrowthMultiplier: number  // 0.7x ~ 1.4x（痛点决定付费意愿）
  volatilityMod:       number  // ±0.2（时机决定市场成熟度）
  attributeBonus:      Partial<FounderAttributes>  // founderFit 加成
  initialMoat:         number  // 0 ~ 30（差异化决定初始壁垒）
}
```

| 维度 | 满分 | 低分效果 | 高分效果 |
|------|------|---------|---------|
| 痛点真实性 | 30 | MRR 增长率 × 0.7（用户不愿付钱）| MRR 增长率 × 1.4 |
| 市场时机 | 25 | 波动率 +0.2（市场不成熟/已饱和）| 波动率 -0.1（窗口期优势）|
| 创始人契合 | 25 | 无加成 | 相关属性 +5~+15 |
| 差异化程度 | 20 | initialMoat = 0（竞品随时抄）| initialMoat = 30 |

#### **防止"无限重刷高分"的设计**

AI Prompt 明确要求：
- 模糊描述（如"一个改变世界的 AI 工具"）→ 痛点 < 10/30
- 充满流行词但无具体场景 → 直接扣分
- 只奖励能说清"**用户是谁 + 他们现在怎么解决 + 为什么你更好**"的描述

```typescript
const CALIBRATION_SYSTEM_PROMPT = `
你是一个刻薄但客观的风投分析师。对以下 idea 评分时：
1. 对笼统/模糊描述的痛点给 < 15 分，因为没说清"谁在痛"
2. 用流行词堆砌但无具体场景的 idea 直接扣分
3. 只奖励能一句话说清：用户 → 当前痛点 → 你的差异化的描述
4. 市场时机评分必须参照 2026 年真实竞争格局，不接受"蓝海"自述
`
```

#### **Lazy Tax（跳过描述的惩罚）**

```typescript
if (!ideaDescription.trim()) {
  // 跳过描述：总分永远在 40-60 区间，参数为平均值
  return buildDefaultCalibration({
    note: "⚠️ 你跳过了 idea 描述。系统以平均水平初始化——就像大多数随波逐流的创业者。"
  })
}
```

#### **终端输出示例**

```
⚡ CORTEX IDEA CALIBRATION

idea："帮 Solo founder 自动生成投资人进展报告（分析 Notion workspace）"

  痛点真实性    ████████████████░░░░  21/30
  市场时机      █████████████████████  22/25  ✅
  创始人契合    ███████████████████░░  19/25
  差异化程度    ██████████░░░░░░░░░░░  11/20  ⚠️

  IDEA SCORE：73 / 100  —  B+  "时机正确，差异化需要加速建立"

引擎参数已校准：
  → MRR 增长率    +18%（痛点真实，用户付费意愿高）
  → 初始护城河     12（差异化偏弱，SEED 期需要快速建壁垒）
  → 市场波动率     标准（2026 AI 工具赛道成熟度适中）
  → 创始人加成     TEC +8（技术背景与产品强相关）

AI 点评："自动生成报告"已有竞品（Notion AI / Rows）。
         你的 moat 建立速度将是 SEED 阶段的生死关键。

[按任意键开始模拟...]
```

#### **版本归属**
- **Pre-alpha**：直接接入 Gemini Flash，完整的四维分析 + 参数映射 + 打字机终端输出
  - 实现量极小（一次结构化 API 调用 + JSON 解析），不值得为此降级为关键词匹配
  - 这是用户进入游戏的**第一个 AI 交互**，质量直接决定第一印象和留存


## **2.3 资源平衡公式 (Resource Balance)**


* **神经带宽 (Neural Bandwidth,** ![][image16]**)**：  
  每位创始人每天固定 ![][image17] 点。![][image18]  
  模拟真实情况中，年龄越大，处理同样任务消耗的生理精力越高。  
* **研发进度模型 (![][image19])**：![][image20]  
  其中 ![][image21] 为团队协同系数，由“关系度”决定。

## **3\. 核心功能逻辑 (Core Logic)**

### **3.1 战略会话机制 (Strategic Session & Cadence)**

为了解决“研发期枯燥感”，系统引入**强制性战略决策节点**：

* **周期性强制暂停**：每研发/步进 2 虚拟周，系统强制停下进入“战略会话”。
* **情报汇总**：AI 汇总这 2 周产生的“研发日志”、“技术文档”和“初探调研”。
* **博弈决策**：AI 像合伙人一样拿着 `BACKLOG.md` 的变动问你：“发现隐私安全隐患，是继续追进度，还是花一周重构？”。
* **被动日志升级**：日志不再是 `进度 +3%`，而是具体的事件语义（例如：“AI 正在撰写 PRD，发现核心逻辑冲突…”）。


### **3.2 团队关系动力学 (Bonding Dynamics)**

* **代际协同 (Intergenerational Synergy)**：团队中包含老少配时，获得![][image22]  
  增益，提升技术转化率。  
* **股权敏感度**：若公司估值上涨而分配不均，Bonding 会随时间流逝而磨损。

### **3.3 人力资源系统（分阶段演化模型）**

> **核心原则**：HR 风险不随阶段降低，而是**形态演变**。
> SEED 期一个人离职可以杀死公司；TITAN 期同样事件只是公关问题。
> 系统用三种不同的机制分别模拟这三种形态，而非用统一的复杂对象追踪所有阶段。

#### **3.3.1 阶段对应机制**

```typescript
function getHRMechanism(stage: CompanyStage): 'KEY_PERSON' | 'CULTURE' | 'COMPLIANCE' {
  if (stage === 'SEED' || stage === 'MVP') return 'KEY_PERSON'
  if (stage === 'PMF' || stage === 'SCALE') return 'CULTURE'
  return 'COMPLIANCE'  // IPO / TITAN：HR 转为合规与声誉问题
}
```

#### **3.3.2 机制一：关键人物风险（SEED / MVP）**

只追踪 `isKeyPerson = true` 的 1-3 人，普通员工不追踪 loyalty：

```typescript
interface StaffMember {
  id: string
  role: 'DEV' | 'MKT' | 'OPS' | 'SALES'
  talent: number        // 0-100，影响产出效率
  salary: number        // 消耗现金流
  isKeyPerson: boolean  // true 时离职触发高风险事件
  loyalty?: number      // 只有 isKeyPerson=true 时才追踪（0-100）
}
```

**关键人物离职 → 伤害放大系数**（阶段越早越致命）：
```typescript
function calcHRDamageMultiplier(stage: CompanyStage): number {
  // SEED=1.5x  MVP=1.2x  PMF=0.9x  SCALE=0.6x  IPO=0.3x  TITAN=0.15x
  const map = { SEED:1.5, MVP:1.2, PMF:0.9, SCALE:0.6, IPO:0.3, TITAN:0.15 }
  return map[stage]
}
// SEED 期核心工程师离职：devProgress -40 × 1.5 = -60（接近致命）
// SCALE 期同样事件：devProgress -40 × 0.6 = -24（疼但可恢复）
```

#### **3.3.3 机制二：公司文化分（PMF / SCALE）**

PMF 之后不再追踪个人 loyalty，改用公司级 `cultureScore`（0-100）：

```typescript
// 月度自动衰减/增长（不需要手动维护每个员工）
function stepCultureScore(company: Company, founder: Founder): number {
  let delta = 0
  delta += (founder.attributes.cha - 60) * 0.1   // CHA 每超过60贡献正值
  delta -= company.consecutiveLossWeeks * 0.5     // 连续亏损拖垮文化
  delta -= Math.max(0, founder.bwStress - 80) * 0.3  // 创始人焦虑传染团队
  return Math.min(100, Math.max(0, company.cultureScore + delta))
}
```

**cultureScore 的效果阈值**：
```
> 80：团队效率正常，HR 事件概率 × 0.3
60-80：偶发"关键员工不满"事件
40-60：管理内耗惩罚（BW -10/week），不再追踪个人
< 40：触发"人才外流"事件链（连续 devProgress 扣减）
< 20：SCALE/IPO 阶段的 Game Over 条件触发（系统性崩溃）
```

#### **3.3.4 机制三：合规与声誉风险（IPO / TITAN）**

IPO 之后 HR 事件直接联动 `reputation` 字段，不再影响 devProgress：

```
高管丑闻事件 → reputation -30（不影响 devProgress）
劳动争议事件 → cash -50000 + reputation -15
工会化运动  → 运营成本永久 +20%（新增 unionized: boolean 字段）
```

#### **3.3.5 管理内耗陷阱（保留，仅 SEED~PMF 生效）**

```typescript
function calcManagementOverhead(staff: StaffMember[], founder: Founder, stage: CompanyStage): number {
  if (['IPO', 'TITAN'].includes(stage)) return 0  // 晚期公司有职业经理人，创始人不带团队
  const teamSize = staff.length
  if (teamSize === 0) return 0
  const opsEfficiency = founder.attributes.ops / 100
  const rawOverhead = teamSize * (1 - opsEfficiency)
  return rawOverhead * 10  // BW/week 消耗
}
```

**核心设计意图**：招人不总是好事。OPS = 30 的创始人招 3 个人，管理内耗可能让总带宽产出**低于**单人状态。这是 2026 年 AI 时代的核心议题：**人力杠杆 vs AI 杠杆**。

#### **3.3.6 hire 指令（Alpha 阶段实现）**

```
$ hire

┌─────────────────────────────────────────────────┐
│  候选人 #1：@Zhang_Wei (前字节跳动高级工程师)       │
│  Role: DEV  Talent: 82  Salary: ¥28,000/mo      │
│  ⚠️ 对股权极度敏感，isKeyPerson=true              │
├─────────────────────────────────────────────────┤
│  候选人 #2：@Liu_Na (全栈独立开发者)               │
│  Role: DEV  Talent: 65  Salary: ¥12,000/mo      │
│  普通员工，不追踪 loyalty                         │
└─────────────────────────────────────────────────┘
→ 当前现金流可支撑 2.3 个月。是否雇佣？[1/2/skip]
```

#### **3.3.7 AI 员工（数字分身）— V2.0+ 预留**

> ⚠️ 当前版本不实现。预留 `role: 'AI_AGENT'`，`salary` 极低，无 loyalty 追踪，`talent` 上限 60。

### **3.4 随机事件池 (Roguelike Elements)**


* **阶段感知触发**：事件分为 SEED, MVP, PMF, SCALE, IPO, TITAN 六个阶段，随公司成长解锁更高风险（如反垄断调查）。

## **4\. 代码架构 (Code Architecture)**

### **4.1 目录结构**

/src  
  /engine           \# 核心数值引擎 (含物理年龄算法)  
    \- math.ts       \# 经营公式与数值迭代  
    \- vectors.ts    \# 创始人属性定义  
    \- events.ts     \# 随机事件逻辑  
  /ai               \# AI 适配层  
    \- cortex-ai.ts  \# 调用 Gemini/GPT 生成模拟日志  
  /workflow         \# 异步任务管理  
  /store            \# 状态管理  
  /components       \# UI 表现层

### **4.2 数据模型 (Prisma Schema Preview)**

model Rehearsal {
  id               String            @id @default(uuid())
  founders         Json              // 存储六维能力值、年龄及人生背景
  company          Json              // 现金、护城河、带宽、公司阶段
  logs             Log[]
  isFailed         Boolean           @default(false)
  leaderboardEntry LeaderboardEntry?
  staff            Staff[]
  productLines     ProductLine[]     // 1对多：公司可同时运转多个业务线
}

model LeaderboardEntry {
  id              String    @id @default(uuid())
  userId          String
  founderName     String
  archetype       String    // 人生背景类型
  stage           String    // SEED/MVP/PMF/SCALE/IPO/TITAN
  valuation       Float     @default(0)
  efficiencyScore Float     @default(0)  // VpB 值
  daysSurvived    Int       @default(0)
  isFailed        Boolean   @default(false)
  failedReason    String?   // Graveyard 模式，由 AI 生成
  rehearsalId     String    @unique
  createdAt       DateTime  @default(now())
  rehearsal       Rehearsal @relation(fields: [rehearsalId], references: [id])
}


model Staff {
  id            String   @id @default(uuid())
  rehearsalId   String
  role          String   // DEV / MKT / OPS / SALES / AI_AGENT(reserved)
  talent        Int      @default(60)
  loyalty       Int      @default(80)
  salary        Float
  weeksEmployed Int      @default(0)
  isKeyPerson   Boolean  @default(false)
  firedAt       Int?     // 离职时的游戏周数，null 表示仍在职
  rehearsal     Rehearsal @relation(fields: [rehearsalId], references: [id])
}

// ============================================================
// ProductLine — 多产品线管理（包含对应的市场与业务模型）
// ============================================================
model ProductLine {
  id               String @id @default(uuid())
  rehearsalId      String
  name             String? // 产品名称或 idea 描述
  industry         String // IndustryType
  businessModel    String // BusinessModel
  volatility       Float  @default(0.5)
  pivotCount       Int    @default(0) // PIVOT 次数（每次消耗资源）
  
  // 产品双轨制数据
  techProgress     Float  @default(0) // 技术开发进度
  productMaturity  Float  @default(0) // 产品 PMF 成熟度
  
  // 多产品调度状态
  isFocal          Boolean @default(true) // 是否为当前研发与测试资源聚焦点
  isClosed         Boolean @default(false) // 是否已通过 prod 关停该条线

  rehearsal Rehearsal @relation(fields: [rehearsalId], references: [id])
}

## **5\. 实现路径 (Implementation Roadmap)**

### **第一阶段：内核沙盒 (Pre-alpha)**

* 实现终端 CLI 框架，完成 init-team 交互，支持背景选择与年龄设定。

### **第二阶段：AI 叙事层 (Alpha)**

* 接入 Gemini 生成经营日志，实现基于 Upstash 的“挂机经营”逻辑。

### **第三阶段：阶段晋级与博弈 (Beta)**

* 加入“公司阶段”系统，从种子期一直模拟到上市后的“巨头 (TITAN)”博弈。

### **第四阶段：生态闭环 (V1.0)**

* 建立全球排行榜（基于 **Supabase Realtime** 实现实时推送，**不引入 Firestore**）。三维榜单：估值天梯 / 效能巅峰 (VpB) / 坚韧传说；死难者名录通过 pgvector RAG 生成 AI 尸检报告。支持将"最优路径"导出为 Solo OS 初始化计划。

## **6\. 核心工程挑战与对齐策略 (Engineering Challenges)**

### **6.1 Token 成本优化策略**
*   **按需生成**：AI 不会在每个 Tick（小时）都生成 PRD，而是仅在“战略会话（每 2 周）”或“重大语义断点”时触发深度生成。
*   **折叠式 context**：利用 `SemanticMappingLayer` 动态生成的 MD 段落，对历史日志进行语义压缩（折叠），仅保留关键决策点。

### **6.2 系统 1（数值）与系统 2（语义）的实时感知**
*   **单向依赖**：语义引擎（AI COO）始终以数值记录（DB）为“唯一真理来源”。
*   **双重校验**：在触发战略会话前，系统先通过 `DASHBOARD.md` 强制 AI 确认当前数值状态（如：现金是否过低），防止出现“数值已破产，AI 还在建议扩张”的幻觉。

## **7\. 公正严谨的引擎思考**

* **生命周期管理**：系统模拟不仅仅是商业，还包含创始人的健康与老化。  
* **数据反馈**：模拟中的决策数据将为未来的 AI 经营助手提供真实的语料支撑。


