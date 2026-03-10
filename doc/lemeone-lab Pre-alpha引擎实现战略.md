# Pre-alpha 核心引擎实现战略

> **定位**：这是 Pre-alpha 阶段的最高优先级技术决策文档。
> 在开始写任何 `simulator.ts` 代码前，必须先通读本文档。

---

## 一、核心结论

**Pre-alpha 不实现完整 DRTA，采用「伪向量标量引擎」代替。**

理由：
- DRTA 的向量夹角计算需要同时调试 founderVector 初始化、marketVector 定义、熵衰减参数——三个不确定量叠加，调参会陷入数学泥潭
- Pre-alpha 的真正目标是 **Terminal 交互爽感** 和 **基础财务逻辑自洽**，不是物理引擎精度
- 但数据结构必须从第一天就按 DRTA 设计，确保 Alpha 升级时零改动成本

---

## 二、伪向量标量引擎（Pseudo-Vector Engine）

### 2.1 数据结构：保持 6 维向量

即使在 Pre-alpha，**`FounderVector` 也定义为 6 维数组**，而不是 6 个独立字段：

```typescript
// src/engine/types.ts

// ❌ 错误设计（不利于未来升级）
interface FounderAttributes {
  mkt: number; tec: number; lrn: number
  fin: number; ops: number; cha: number
}

// ✅ 正确设计（DRTA 兼容）
type FounderVector = [number, number, number, number, number, number]
// 索引对应：[MKT, TEC, LRN, FIN, OPS, CHA]，归一化到 [0, 1]

// 行业权重也是 6 维：
const INDUSTRY_WEIGHTS: Record<IndustryType, FounderVector> = {
  AI_SAAS:          [0.10, 0.50, 0.15, 0.10, 0.05, 0.10],
  DTC_ECOM:         [0.40, 0.10, 0.10, 0.15, 0.15, 0.10],
  WEB3_GAMING:      [0.15, 0.35, 0.15, 0.10, 0.10, 0.15],
  BIOTECH:          [0.05, 0.55, 0.20, 0.10, 0.05, 0.05],
  CREATOR_ECONOMY:  [0.45, 0.05, 0.10, 0.05, 0.10, 0.25],
  B2B_ENTERPRISE:   [0.20, 0.15, 0.10, 0.20, 0.25, 0.10],
}
// 每行加总 = 1.0（归一化权重）
```

**目的**：数据库 Schema、UI 雷达图、Prisma Model 从第一天就基于 6 维设计，Alpha 升级时只替换公式，不改结构。

### 2.2 计算公式：加权点积（不计夹角）

```
Pre-alpha: ΔProgress = Σ(Attribute_i × Weight_industry,i) × Efficiency
```

翻译成代码：

```typescript
// src/engine/simulator.ts

/**
 * Pre-alpha 版产出计算（伪向量标量引擎）
 * Alpha 升级时：将此函数内部替换为 LemeoneResonanceEngine.calculateOutput()
 * 外部调用接口不变
 */
function calcProgressDelta(
  founderVector: FounderVector,
  industry: IndustryType,
  state: GameState
): number {
  const weights = INDUSTRY_WEIGHTS[industry]

  // 1. 加权点积（模拟"专业匹配度"，替代 cos(θ)）
  const dotProduct = founderVector.reduce(
    (sum, attr, i) => sum + attr * weights[i],
    0
  )

  // 2. 年龄效能系数（保留，这块不简化）
  const ageMultiplier = getAgeMultiplier(state.founder.age, 'tec')

  // 3. 技术债惩罚——"安全阀"，防止平衡性崩溃
  const techDebtPenalty = Math.max(0.3, 1 - state.company.techDebt / 100)

  // 4. 随机波动 ±10%
  const noise = 0.9 + Math.random() * 0.2

  // 5. 最终产出（归一化后 × 系数）
  return dotProduct * ageMultiplier * techDebtPenalty * noise * 20
                                                        // ^ 缩放系数，调参用
}
```

### 2.3 热插拔升级路径

```typescript
// Pre-alpha：getEfficiency() 返回固定值
function getEfficiency(state: GameState): number {
  return 1.0  // 占位
}

// Alpha 升级：只改这一个函数，其他代码不动
function getEfficiency(state: GameState): number {
  const { output } = LemeoneResonanceEngine.calculateOutput(
    state.founder.vector,
    state.staff.map(s => s.contributionVector),
    MARKET_VECTORS[state.company.industry]
  )
  return output
}

// Beta 升级：引入市场漂移
function stepMarket(state: GameState): GameState {
  return {
    ...state,
    marketVector: LemeoneResonanceEngine.nextMarketDrift(state.marketVector)
  }
}
```

---

## 三、技术债（TechDebt）— 必须保留的"安全阀"

> 即使不用 DRTA，技术债必须在 Pre-alpha 实现。
> 它是数值上的负反馈，防止游戏变成"无脑堆 TEC 就赢"的平衡性崩溃。

```typescript
interface CompanyState {
  cash: number
  mrr: number
  devProgress: number
  moat: number
  stage: CompanyStage

  // 技术债：0-100，不可忽视
  techDebt: number

  // 技术债积累规则：
  // + 每次 sprint intensity > 1.0（加班）：+5/week
  // + 跳过"架构重构"卡牌超过 8 周：+2/week
  // - 使用"架构重构"卡牌：-20
  // 当 techDebt > 70 时：触发"技术债爆炸"事件（devProgress 被清零 30%）
}

function stepTechDebt(state: GameState, intensity: number): number {
  let delta = 0
  if (intensity > 1.0) delta += 5 * (intensity - 1.0)  // 加班积累
  delta += 0.5  // 基础积累（复杂度自然增长）
  return Math.min(100, state.company.techDebt + delta)
}
```

**设计意图**：玩家前期为了刷进度疯狂加班，中期技术债爆炸导致进度回滚——这就是最真实的创业节奏。

---

## 四、P0/P1/P2 优先级

```
P0（Must，2 周内完成）：
  ① simulator.ts 核心循环（伪向量标量引擎 + 技术债）
  ② Xterm.js 流式打字效果 + 基础 CLI 解析（6 条指令）
  ③ Gemini Flash AI 叙事层（周日志 + Idea Calibration）

P1（Should，在 P0 完成后）：
  ④ Game Over 检测（CASH_BANKRUPT + MARKET_DEATH）
  ⑤ 随机事件池（每阶段 8 个精品事件）
  ⑥ 1 个 Aha-Moment（hard_truth，硬编码 3 个参考案例）

P2（Pre-alpha 结束前 Backlog）：
  ⑦ ResonanceEngine Mock 状态（返回模拟数值，接口对齐）
  ⑧ analyze-gap 简化版（只列差距，不给 AI 建议）
```

---

## 五、Simulator 主结构（Pre-alpha 版）

```typescript
// src/engine/simulator.ts

export async function runSprint(
  state: GameState,
  weeks: number,
  intensity: number = 1.0
): Promise<SprintResult> {
  let currentState = { ...state }
  const log: WeekLog[] = []

  for (let week = 1; week <= weeks; week++) {
    // 1. 数值步进（伪向量引擎）
    const progressDelta = calcProgressDelta(
      currentState.founder.vector,
      currentState.company.industry,
      currentState
    )
    const burnRate = calcBurnRate(currentState)

    currentState = {
      ...currentState,
      company: {
        ...currentState.company,
        devProgress: Math.min(100, currentState.company.devProgress + progressDelta),
        cash: currentState.company.cash - burnRate,
        mrr: calcMRR(currentState),
        techDebt: stepTechDebt(currentState, intensity),
      }
    }

    // 2. 随机事件（V1 概率池）
    const event = pickEventForWeek(currentState)
    if (event) {
      currentState = applyEvent(event, currentState)
    }

    // 3. Game Over 检查（立即中止）
    const gameOver = checkGameOver(currentState)
    if (gameOver) {
      return { finalState: { ...currentState, isFailed: true }, log, gameOver }
    }

    // 4. AI 叙事（流式，每周调用一次 Gemini Flash）
    const narrative = await generateWeekNarrative(currentState, event)
    log.push({ week, progressDelta, burnRate, event, narrative })
  }

  // 5. Sprint 结束后检查 Aha-Moment
  const aha = checkAhaMoment(currentState, log)

  // 6. 阶段晋级检查
  const promotion = checkStagePromotion(currentState)
  if (promotion) currentState = applyPromotion(currentState)

  return {
    finalState: currentState,
    log,
    ahaMoment: aha,
    promotion,
    gameOver: null,
  }
}
```

---

## 六、ResonanceEngine Mock（P2 阶段预留接口）

```typescript
// src/engine/resonance-mock.ts
// Pre-alpha 阶段只用这个，Alpha 替换为真实 LemeoneResonanceEngine

export const ResonanceEngineMock = {
  calculateOutput: (_founder: FounderVector, _staff: number[][], _market: FounderVector) => ({
    output: 1.0,        // 占位，始终返回 1.0（不影响计算结果）
    resonance: 0.72,    // 模拟数值，供 UI 雷达图展示（看起来有意义）
    magnitude: 0.85,
    entropy: 1.5,
    isValid: true,
  }),

  nextMarketDrift: (v: FounderVector) => v,  // 市场不漂移（Pre-alpha 固定市场）
}
```

这样即使 Pre-alpha UI 里显示了共鸣雷达图，数据也是合理的模拟值，不影响核心数值计算。
