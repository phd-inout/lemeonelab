# lemeone-lab 版本范围与功能锁定表

> **本文档是最高优先级参考**。每次开发前必须先查这张表。
> 设计文档里描述的所有功能，只有出现在当前版本的"✅ IN SCOPE"列表里，才允许开始写代码。
> 其他一切都是"未来的事"——不争论，不临时加，不"顺手做一下"。

---

## Pre-alpha（当前阶段）目标：一个能跑通的核心循环

**验收标准**：新用户打开终端，能完成一次完整的从初始化到 Game Over 或阶段晋级的模拟，且 AI 生成了至少 1 条有意义的经营日志。

**时间预算**：2 周

---

### ✅ Pre-alpha IN SCOPE（只做这些）

#### 创始人系统
- [x] 六维属性（MKT / TEC / LRN / FIN / OPS / CHA），初始值范围 20-100
- [x] 5 种人生背景（Fresh Grad / Corporate Refugee / Serial Pro / Industry Veteran / Plain Starter）——**暂不做 Custom Vector**
- [x] 年龄输入，4档效能乘数（20-29 / 30-39 / 40-49 / 50+）
- [x] 神经带宽（BW），固定上限，按年龄有差异

#### 公司初始化
- [x] `init-company` 指令：选择行业（6选1）、商业模式（5选1）
- [x] 行业只影响 TEC/MKT 权重系数（简单乘法，不做完整 MarketContext 对象）
- [x] 初始现金由背景决定（硬编码 5 个值）
- [x] **Idea Calibration AI 版**：`init-company` 接受 1-2 句 idea 描述，直接调用 Gemini Flash
  - 返回四维分数（JSON 格式），映射初始游戏参数
  - 终端打字机效果输出评估结果（是首个 AI 交互，决定第一印象）
  - 跳过描述（直接回车）→ Lazy Tax，参数取平均值并显示警告
  - **理由**：实现量极小（一次结构化 API 调用），且是用户的第一个 AI 体验，不可降级

#### Sprint 核心循环
- [x] `sprint --weeks N` 指令（最大 12 周）
- [x] 每周数值步进：cash 扣减 burn rate、devProgress 增加
- [x] **burn rate** = 固定基础值（无员工，不计管理内耗）
- [x] **devProgress** = TEC × 年龄系数 × 随机波动（±10%）
- [x] **收入**：仅当 stage ≥ MVP 且 devProgress ≥ 60 时开始产生 MRR（简化公式）

#### 随机事件（V1 概率池，精简版）
- [x] 每阶段 **8-10 个** 核心事件（6 个阶段 × 8 = 约 50 个事件，用 LLM 批量生成后人工审核）
- [x] 事件 JSON 格式：`id / stage / baseProbability / effects / narrativePrompt`
- [x] **不做** `probabilityModifiers`（属性修正），Pre-alpha 里概率全部 hardcode
- [x] **不做** `staffEffects`、`industryFilter`、`volatilityScaled`

#### Game Over 条件（简化版）
- [x] `CASH_BANKRUPT`：cash ≤ 0 且 4 周内无应收款 → 持续 4 周触发
- [x] `MARKET_DEATH`：SEED 超 26 周未晋级 MVP
- [x] **不做** FOUNDER_COLLAPSE（BW 崩溃类）——Pre-alpha 带宽只警告不致死
- [x] **不做** FORCED_EXIT（特殊事件触发类）

#### 阶段晋级
- [x] Stage 顺序：SEED → MVP → PMF → SCALE → IPO → TITAN
- [x] 晋级条件（硬编码）：
  - SEED → MVP：devProgress ≥ 100
  - MVP → PMF：MRR ≥ 5,000 且连续 4 周正增长
  - PMF → SCALE：MRR ≥ 50,000
  - SCALE 及以后：暂不实现（Pre-alpha 到 PMF 就够了）

#### AI 叙事
- [x] `Gemini Flash` 生成每周经营日志（1-2 句话，不超过 80 tokens）
- [x] System Prompt 按 Stage 硬切换（SEED/MVP/PMF 各一套模板，共 3 个）
- [x] **1 个** Aha-Moment：只做 `hard_truth`（sprint 进度 < 预期 40% 时触发）
- [x] Aha-Moment **不接 RAG**，只用硬编码的 3 个参考案例（Segway / WeWork / Quibi）

#### 终端指令集（完整列表，不多不少）
```
init-founder          设置创始人属性和背景
init-company          设置行业和商业模式
sprint --weeks N      推进 N 周
status                查看当前所有数值面板
help                  指令列表
quit / exit           退出
```

#### 终端输出格式（必须在开发前定好）
```
$ sprint --weeks 4

[Week 1/4] 🔧 研发推进中...
  devProgress:  +8%  (52% → 60%)
  cash:        -¥24,000  (¥156,000 剩余)
  [EVENT] 轻微技术债积累。AI 日志：你在赶进度，但没有写测试...

[Week 2/4] ...
[Week 3/4] ...
[Week 4/4] ✅ Sprint 完成

━━━ Sprint 总结 ━━━
进度提升:  +31%（预期 +40%）⚠️ 低于预期
现金消耗:  -¥96,000
事件触发:  2 次

[AHA-MOMENT] ⚡ CORTEX 分析中...
（此处打字机效果输出 Aha-Moment，红色边框）
```

#### 数据持久化
- [x] Prisma + Supabase（已有基础设施）
- [x] 只持久化 `Rehearsal` 表（founder Json + company Json + logs）
- [x] **不做** LeaderboardEntry、Staff、MarketContext 表（Schema 可以写，但不插数据）

---

### ❌ Pre-alpha OUT OF SCOPE（绝对不碰）

> 以下功能出现在设计文档里，但 Pre-alpha **一行代码都不写**：

| 功能 | 推迟到 |
|------|-------|
| HR 模块（Staff 对象、hire 指令、管理内耗） | **Alpha** |
| 产品双轨制（productMaturity 独立追踪） | **Alpha** |
| Custom Vector 自定义属性 | **Alpha** |
| Burnout 永久属性损耗（Founder Collapse） | **Alpha** |
| 应收款（Receivable）系统 | **Alpha** |
| SCALE / IPO / TITAN 阶段 | **Beta** |
| 随机事件 V2（语义驱动 + pgvector） | **Beta** |
| Aha-Moment 接 RAG（Graph-RAG / Vector RAG） | **Beta** |
| Aha-Moment 4 种全实现（只做 hard_truth） | **Alpha（其余 3 种）** |
| 异步仿真（Upstash Workflow，现实时间挂钩） | **Beta** |
| 排行榜 + Graveyard | **V1.0** |
| Supabase Realtime 全局广播 | **V1.0** |
| DLC 插件化架构代码实现 | **V1.0** |
| AI 员工（数字分身） | **V2.0** |
| Monte Carlo 数值压力测试 CI | **Beta** |
| PIVOT 指令（切换商业模式） | **Alpha** |


---

## Alpha 目标：让 AI 像个"懂行的合伙人"

**新增（在 Pre-alpha 基础上）：**

- [ ] HR 模块简化版：`hire` 指令，员工只有 `{ role, salary, bwBonus }` 三字段
- [ ] 管理内耗公式（基础版）
- [ ] PIVOT 指令
- [ ] Aha-Moment 补完（`ops_debt_explosion` + `burnout_insight`）
- [ ] Burnout 永久属性损耗（需要先有 bwStressStreak 追踪）
- [ ] Receivable 应收款（cash 破产逻辑的完整版）
- [ ] Custom Vector 背景
- [ ] 完整的 SCALE 阶段（晋级条件 + 专属事件）
- [ ] 事件 `probabilityModifiers` 开启（属性修正概率）
- [ ] analyze-gap 指令（含 AI 建议版）

---

## Beta 目标：技术护城河建立

**新增：**

- [ ] 随机事件引擎 V2（语义驱动 + pgvector）
- [ ] Aha-Moment 接 Vector RAG（5-10 个真实案例入库）
- [ ] IPO / TITAN 阶段
- [ ] 异步仿真：Upstash Workflow（现实时间挂钩）
- [ ] Monte Carlo 数值压力测试脚本
- [ ] FORCED_EXIT 类 Game Over

---

## V1.0 目标：生态闭环

**新增：**

- [ ] 排行榜（3 维榜单）
- [ ] Graveyard + AI 尸检报告
- [ ] Supabase Realtime 全局广播
- [ ] DLC 插件加载器代码实现（先上官方 AI_SAAS 和 DTC_ECOM 两个剧本）
- [ ] 最优路径导出为 Solo OS 初始化计划

---

## 胜利条件（Win Condition）明确定义

> 之前文档里只定义了死法，这里补全"赢"的判断：

| 赢法 | 条件 | 解锁 |
|------|------|------|
| **IPO 成功** | 完成 IPO 阶段晋级 + 估值 ≥ ¥500,000,000 | 进入排行榜·估值天梯 |
| **效能极致** | VpB 指数 ≥ 85（高效产出 + 健康作息） | 进入排行榜·效能巅峰 |
| **TITAN 生存** | 在 TITAN 阶段生存 ≥ 52 周 | 进入排行榜·坚韧传说 |
| **隐藏结局：Solo Forever** | 全程单人（无任何员工）到达 IPO | 特殊成就标记 |

---

## 核心指令集（最终版，Pre-alpha 只实现上半部分）

```
─── Pre-alpha ──────────────────────
init-founder [--background <type>]    初始化创始人
init-company [--industry <type>]      初始化公司
  [--model <businessModel>]
  [idea 描述（可选）]         → Idea Calibration 分档
sprint [--weeks N] [--overtime]       推进 N 周
status                                查看数值面板
help                                  指令帮助
quit                                  退出

─── Alpha 新增 ──────────────────────
hire                                  进入人才市场
fire <staffId>                        开除员工
pivot --to <businessModel>           切换商业模式（代价巨大）
raise [--amount N]                   发起融资（消耗 CHA）
analyze-gap                          AI 差距分析（当前状态 vs 晋级目标）

─── Beta 新增 ───────────────────────
load-dlc <dlcName>                   加载行业剧本

─── V1.0 新增 ───────────────────────
top [--by valuation|efficiency|days] 查看全球排行榜
graveyard                            查看死难者名录
export --format solos                导出最优路径
```
