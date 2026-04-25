# **GEMINI.md: LemeoneLab 2.0 商业重力沙盒开发指南**

> **最高原则**: AI 代理在执行任务时必须严格遵守“单问制”交互协议，并优先保障 14D 维度映射的完整性与营收模拟的真实性。

---

## **1. 项目概览 (Project Identity)**

**LemeoneLab 2.0** 是一款基于群体智能涌现与 14D 向量碰撞的商业决策支持系统。通过 100,000 个逻辑自洽的虚拟智能体，在瞬时的市场步进（Epochs）中，对产品需求进行确定性的风险审计。

- **核心模型**: 14D DNA 向量模型（D1-D4 产品核心, D5-D6 变现与门槛, D7-D9 市场动态, D10-D13 战略未来, D14 认知与分发）。
- **核心逻辑**: **Gravity (行业重力)** vs **Weather (实时新闻)**。重力是结构化的行业 DNA（ind_xxx.md），天气是 Gemini Search 抓取的实时扰动。
- **关键技术栈**: Next.js 16 (Turbopack), Google AI SDK (Gemini 3.1 Flash), Prisma, Xterm.js (Terminal UI)。

---

## **2. 强制开发规范 (Core Mandates)**

### **2.1 交互协议：单问制 (Sequential Prompting)**
- **规则**: 每次调用 `ask_user` 或 `Cortex Scanner` 的追问时，**只能提出最多 1 个问题**。
- **目的**: 确保用户专注、防止交互断层，且符合“极客终端”的操作习惯。
- **实施**: `Cortex-ai.ts` 的 `questions` 数组必须在返回前执行 `.slice(0, 1)`。

### **2.2 维度审计层 (The Audit Layer)**
- **规则**: 如果任何维度的标准差 $\sigma > 0.4$，系统必须通过代码硬逻辑拦截 `isComplete: true`。
- **禁令**: 禁止 AI 对 D5 (准入方式)、D6 (客单价) 和 D14 (分发渠道) 进行脑补。如果用户描述不明确，必须发起追问。

### **2.3 商业模式识别 (Monetization Logic)**
- **买断制 (ONE_TIME)**: 营收 = 每周新卖出设备数 × 硬件单价。
- **订阅制 (SUBSCRIPTION)**: 营收 = 付费用户总数 × 月服务费。
- **混合模式 (HYBRID)**: 包含硬件买断 + 持续订阅。
- **修复记录**: `setARPU` 已在 `store.ts` 实现，不再使用硬编码的行业基准。

---

## **3. 关键路径与指令 (CLI & Actions)**

### **3.1 核心指令集**
- `project new "<项目名>"`: 创建并锁定案卷。
- `scan "<需求描述>"`: 启动 Cortex Scanner 映射 14D 向量。
- `price <金额> [-y]`: 设定硬件价或月费。系统会校验与行业基准的偏离度。
- `dev`: 执行一周的“向量碰撞”，推进 T+X 进度。
- `stat`: 查看当前 14D 向量的实时状态与 NaN 安全保护。
- `audit`: 调用 Cortex Auditor 生成深度审计报告。

### **3.2 运行与调试**
- **开发启动**: `npm run dev`
- **数据库迁移**: `npx prisma db push`
- **逻辑验证**: 使用 `src/lib/engine/math-engine.test.ts` 进行 14D 向量的数学一致性校验。

---

## **4. 数学防御原则 (Numerical Integrity)**

- **Sigmoid 修正**: 留存率函数已平滑处理（Center: 0.15, Slope: 8），防止低共鸣状态下用户瞬间归零。
- **Resonance 幂次**: 相似度计算采用 $cosSim^2$ 而非立方，以减少向量偏移带来的剧烈波动。
- **NaN 保护**: 所有向量累加、除法运算前必须进行 `agents.length > 0` 和 `|| 0` 校验。

---

## **5. 行业知识库 (Knowledge Base)**

- 存储路径: `src/assets/knowledge/industries/`
- 命名规则: `ind_00x_<industry_id>.md`
- 核心内容: 定义了各行业的 **物理死穴 (Hard Constraints)**，如：`IF D5 < 0.8 -> TRIGGER ...`。

---

## **6. AI 代理待办 (TODOs)**

- [ ] 完善 `Cortex Researcher` 的实时价格抓取逻辑，用真实竞对价格覆盖 Baseline。
- [ ] 优化 `ENTERPRISE` 级别（100,000 Agents）在大数据量下的渲染性能。
- [ ] 完善 `COMPETITIVE_RADAR` 的竞对智能体博弈逻辑。
