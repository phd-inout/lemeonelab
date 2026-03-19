# lemeone-lab：从数据库到 Markdown 的语义映射层 (Semantic Mapping Layer) 设计指南

这是一套介于关系型数据库（Relational DB，硬核数值）与 大语言模型（LLM，认知语义）之间的桥接系统。它不会取代现有的数据库，而是作为数据库的“实时语义视图”，将冰冷的数值序列化为 AI 最易理解的 Markdown 格式，实现“龙虾式”的深度记忆与精准复盘。

## 1. 核心设计理念

**唯一真理来源**：始终以数据库（PostgreSQL）的快照序列为准。
**动态实例化**：Markdown 仅在调用 AI（Cortex AI / Gemini）时**动态在内存中生成**，不持久化单独的 `.md` 文件实体，以防止数据同步冲突与状态分裂。
**消解机器幻觉**：通过把数据库属性（如 `earningPotential`, `survivalRate`, `techDebt`）统一转译为带有业务含义的 Markdown 榜单表格或特征描述，消除 AI 在推演过程中的数值幻觉。

---

## 2. 核心语义文档资产 (Strategic Assets)

这是在终端触发 DRTA 引擎运算并产生极值点（Outliers）后，自动利用 10,000 个虚拟智能体验证数据动态生成的四份 Markdown 战略审计报告：

### 📈 STRESS_TEST_REPORT.md (商业逻辑压力诊断)
*   **持久化时机**：执行 `audit` 指令触发深度复盘时。
*   **核心内容**：
    *   **破产生存率预估**：在当前 Team Size 和 TechDebt 侵蚀下模型推演的生存极限极限。
    *   **共鸣断裂带**：产品在哪个 12D 维度组上与智能体产生了最严重的逻辑排斥（例如 D5 上手摩擦力导致的非核心用户大面积流失）。
    *   **用户定性反馈**：抓取并模拟极端不满用户（Haters）或核心铁粉（Fans）的原声摘录。

### 📌 PMF_QUADRANT.md (PMF 象限与用户画像)
*   **持久化时机**：伴随 `audit` 执行同步更新。
*   **核心内容**：
    *   **受众人群热力分布**：展示产品的高共鸣人群在 12D 空间的集中象限。
    *   **核心拥趸特征**：为产品“买单”的死忠群体在 D1-D12 上的典型特征均值。

### 📋 PRODUCT_BACKLOG.md (涌现型待办需求)
*   **持久化时机**：伴随 `audit` 指令同步更新。
*   **核心内容**：
    *   **战略优化优先级**：不是玩家自己写的情景规划，而是由 10,000 个智能体“集体投票”出的 1-3 条高优先级痛点需求（例：“建议立即降低 D5 认知负荷，即使牺牲部分 D2 深度”）。
    *   **资源权衡建议**：明确在预算有限的当下，资源该向哪个 12D 变量倾斜。

### 📍 COMPETITIVE_RADAR.md (行业竞对雷达)
*   **持久化时机**：当存在模拟外部竞对时的定期更新。
*   **核心内容**：
    *   对比玩家产品向量（$V_{product}$）与 3 个核心虚拟竞对在 12 维空间中的实时挤压态势。

---

## 3. “重力碰撞”中的语义流动 (The Collision Flow)

系统采用“数据第一，聊天闭嘴”四步走方式，摒弃 RPG/闲聊式流转：

1.  **投喂解析（Feeding & Parsing）**：用户终端传入 PRD / 文本内容，AI 提炼成初始 `$V_{product}$` 均值与方差。
2.  **碰撞计算（Collision）**：用户输入 `run`，系统直接让 10,000 个包含不同噪声和特质分布的智能体计算其余弦相似度与 TechDebt 衰减项，产生宏观指标并推进商业阶段至下一 Epoch (如 T+1)。不打断、不弹决策球，完全让用户的参数调整承受环境的验证。
3.  **极值提取与审计（Auditing）**：不基于“对话历史”或所谓“阶段问答”，而是针对“因碰撞导致存活率 (Survival Rate) 低至破产边缘”或“用户主动在终端打出 `audit`”，此时提取分布中最特殊的 10 个数据样本提交给 Cortex AI，生成前面提到的 4 份文档。
4.  **向量偏转（Vector Tuning）**：用户根据在终端读取的 `STRESS_TEST_REPORT` 等文件，再在终端敲入诸如 `set D5 0.2` 或 `team STARTUP` 重新调整 `$V_{product}$` 属性与资源配比并持续运行，形成逻辑闭环。

---

## 4. 核心开发逻辑：语义转化器 (The Mapper)与维度折叠

作为系统输出的最后一公里，**Semantic Mapping Layer 必须隐藏 12D 的数学骨架**，把“宏大叙事”降维打击到“具体操作”。用户不需要看见冰冷的向量值，他们只需要一份“带行动指南的体检报告”。

### 4.1 维度折叠 (Dimension Folding)
将 12 维折叠为 3 大直观痛点：

*   **D1-D4 (产品核心)** $\rightarrow$ **“核心爽点分析”**：如技术深度支撑不起定价，建议增加某功能模块或降低预期。
*   **D5-D8 (用户阻力)** $\rightarrow$ **“获客血槽诊断”**：如复杂的注册门槛杀死了转化率，建议移除特定约束。
*   **D9-D12 (天花板)** $\rightarrow$ **“增长后劲评估”**：如产品过于单一无法形成二次购买生态，建议开放接口等。

### 4.2 特征绑定 (Feature-to-DNA Binding)
不要反馈“D5 上升，D2 上升”的空洞数值。系统需要跟踪记录用户输入的**具体功能点**与 DNA 的映射。
**反馈示例**：“你添加的 **[AI 插件]** 虽然提升了技术上限，但其带来的 **[配置复杂度]** 会阻碍 T+1 阶段 40% 的非极客用户进入，建议增加一个 **[一键配置模式]** 以对冲摩擦力”。

```typescript
// 将 12D 数据与极值样本、用户历史特征 (Features) 映射为输入给 AI 以供审计的内容
export class SemanticContextService {
  public static generateAuditContext(state: SandboxState): string {
    const macro = this.mapToMacroMetrics(state.metrics);
    const vectorSpace = this.mapTo12DProfile(state.productVector);
    const outliers = this.extractOutliers(state.agents);

    // 以严谨冷峻的格式给 AI 注入上下文，用于生成那四份 Markdown
    return \`
# CORE PERFORMANCE
\${macro}

# 12-DIMENSIONAL PRODUCT PROFILE
\${vectorSpace}

# EXTREME AGENT SAMPLING (Haters & Fans)
\${outliers}
    \`;
  }
}
```

---

## 5. “龙虾式”因果复盘 (Causal Reasoning)

当 DRTA 数值引擎检测到崩坏（例如：生存几率预估破底 `SurvivalRate <= 0.05`），触发破产清算时：

1.  **快照投影**：将最后几个阶段 (Epoch) 的产品 12D 轨迹变化和崩坏时的宏观指标传给 AI。
2.  **硬核剖析**：AI 读取这一客观断层后输出“复盘报告”（例如：“在最近的 2 轮推演中，你强行拉升了 D2（深度）却未能匹配对应的团队研发资源支撑（TeamSize 不足），这导致了 TechDebt 系数爆炸从而抹平了剩余的 D8 稳定性红利，建议... ”）。这不再是虚构的商业玄幻故事，而是对用户参数干预失败原因的数学揭示。
