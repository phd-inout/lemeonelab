# Lemeone-lab 2.0 版本范围与功能锁定表 (P0/P1/P2)

> **最高原则**：本阶段只实现“向量碰撞”与“审计报告”。删除所有与 RPG 相关的开发计划。

---

## P0 (MVP 核心：本地重力引擎)

**验收标准**：在终端输入 `dev` 后，控制台能瞬间计算并展示 10,000 个随机 DNA 智能体的共鸣度分布。

- [ ] **13 维 DNA 模型实现 (含 D13: Awareness Rate)**：定义 `AgentDNA` 类型，支持基础 13 维空间的初始化。
- [ ] **向量碰撞函数 (`System 1`)**：
  - 基于 `math.ts` 实现结合余弦相似度、高斯衰减核 ($\alpha$) 与欧氏距离惩罚的修正版共鸣算法。
  - 引入技术债衰减系数 $e^{-\lambda \cdot TechDebt}$，严格限制“过度设计 (Over-engineering)”带来的资金消耗与体验灾难。
  - 支持本地 10,000 个智能体的并行计算（Web Worker 预留）。
- [ ] **基础 CLI 指令集 (短单词重塑)**：
  - `dev`：单次步进，触发一次 10,000 人碰撞。
  - `stat`：显示当前宏观数值仪表盘（Cash, Progress, TechDebt）。
  - `set-price`：直接修改产品向量的价格维度。

---

## P1 (模拟闭环：种子扫描器与审计报告)

**验收标准**：用户输入一段评论，系统生成符合该特征的 10,000 个分布，并产出第一份审计报告。

- [ ] **种子扫描器 (`Cortex Scanner`)**：
  - 接入 Gemini Flash，将文本描述映射为 13 维向量的 $\mu$ 与 $\sigma$。
  - 部署 **Semantic Cache (语义缓存层) 与 Embedding 向量存储**，防止 API 限流导致大规模模拟宕机。
  - 实现蒙特卡洛随机采样，生成模拟种群。
- [ ] **审计报告引擎 (`Cortex Auditor`)**：
  - 提取碰撞后的极值智能体（Outliers）。
  - 生成 `STRESS_TEST_REPORT.md` (包含破产点预测)。
  - 生成 `PRODUCT_BACKLOG.md` (**引入 Speculative Execution 参数模拟运行及副作用预测**)。
- [ ] **PIVOT 指令**：支持基于审计报告建议，大幅度调整产品向量 $V_{product}$。

---

## P2 (视觉与动态：热力图与 JOURNAL)

**验收标准**：终端展示动态更新的热力图。

- [ ] **Dashboard 视觉化**：从“聊天流”转为“热力图仪表盘”。
- [ ] **实时 JOURNAL 渲染**：动态渲染 `JOURNAL.md`，记录产品在 13 维空间中的漂移轨迹。
- [ ] **COMPETITIVE_RADAR.md**：引入 3 个 **响应式竞对智能体 (Responsive Competitor Agents)**，激活智能底线反击逻辑（如降价跟进、功能叠加），展示修罗场的真实动态博弈。

---


