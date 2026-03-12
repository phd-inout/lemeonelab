# lemeone-lab：从数据库到 Markdown 的语义映射层 (Semantic Mapping Layer) 设计指南

这是一套介于关系型数据库（Relational DB，硬核数值）与 大语言模型（LLM，认知语义）之间的桥接系统。它不会取代现有的数据库，而是作为数据库的“实时语义视图”，将冰冷的数值序列化为 AI 最易理解的 Markdown 格式，实现“龙虾式”的深度记忆与精准复盘。

## 1. 核心设计理念

**唯一真理来源**：始终以数据库（PostgreSQL）的快照序列为准。
**动态实例化**：Markdown 仅在调用 AI（Cortex AI / Gemini）时**动态在内存中生成**，不持久化单独的 `.md` 文件实体，以防止数据同步冲突与状态分裂。
**消解机器幻觉**：通过把数据库属性（如 `cash`, `techDebt`, `founderVector`）统一转译为带有业务含义的 Markdown 榜单表格或特征描述，消除 AI 在推演过程中的数值幻觉。

---

## 2. 核心语义文档映射 (The Strategic Docs)

系统不再仅仅生成临时的快照，而是维护一套动态更新的“战略资产”，它们是 AI COO 进行决策和反馈的核心依据：

### 📝 PROPOSAL.md (项目建议书)
该片段定义项目的“初始基因”与“现实约束”。它不仅包含愿景，更包含 AI COO 的初步评估。

*   **映射来源**：`Rehearsal.founderJson` + `Rehearsal.ideaJson` + AI 初始推演。
*   **核心内容**：
    *   **创始人画像**：六维能力向量与性格底色（老兵、学院派等）。
    *   **战略预算**：MVP 所需周数、月度预期支出、资金生命周期预警。
    *   **风险对齐**：AI 识别出的核心合规、技术或市场风险点。

### 📋 BACKLOG.md (需求任务池)
系统的“执行路线图”。随着 `dev/sprint` 指令的推进，AI 会动态填充或调整此文档。

*   **映射来源**：`Rehearsal.productLines` + 当前研发进度 + AI 生成的任务拆解。
*   **核心内容**：
    *   **当前 sprint 任务**：正在开发的具体功能点（如：“Notion API 鉴权模块”）。
    *   **技术债务/待办**：记录为了赶进度而留下的坑（Tech Debt 水位）。
    *   **逻辑自洽性检查**：AI 在此文档中记录研发发现的矛盾点（如：“监控功能触犯隐私法律”）。

### 📊 MARKET_FEEDBACK.md (市场画像)
系统的“真实性来源”。记录模拟过程中 AI 推演出的用户原声和市场反应。

*   **映射来源**：`Rehearsal.logsJson` + 市场波动率相关推演。
*   **核心内容**：
    *   **用户原声 (User Vox)**：模拟 Reddit/Twitter 上的 2026 年用户真实反馈。
    *   **调研结论**：付费意愿、痛点匹配度、由于差异化不足导致的流失率。
    *   **竞争者动向**：大模型厂商或巨头的潜在降价/功能覆盖预警。

### 📈 DASHBOARD.md & JOURNAL.md (实时遥测与因果链)
*   **DASHBOARD.md**：瞬时数值快照（现金、燃烧率、BW 压力）。
*   **JOURNAL.md**：结构化的时间序列记录，用于“战略会话”时的回溯。


---

## 3. 核心开发逻辑：语义转化器 (The Mapper)

在服务端实现一个 `SemanticContextService`，负责串联上述渲染：

```typescript
// 将数据库快照映射为语义 Markdown 的服务
export class SemanticContextService {
  public static generateAhaContext(rehearsal: Rehearsal, product?: ProductLine, recentLogsLimit: number = 8): string {
    const soul = this.mapToSoul(rehearsal.founderJson, rehearsal.ideaJson);
    const dash = this.mapToDashboard(rehearsal.companyJson, product);
    const journal = this.mapToJournal(rehearsal.logsJson, recentLogsLimit);

    // 返回拼接后的 Markdown 字符串，作为 Prompt 系统上下文注入
    return `
# SOUL_CONTEXT
${soul}

# CURRENT_DASHBOARD
${dash}

# RECENT_JOURNAL_HISTORY
${journal}
    `;
  }

  private static mapToSoul(...) { /* 渲染逻辑 */ }
  private static mapToDashboard(...) { /* 渲染逻辑 */ }
  private static mapToJournal(...) { /* 渲染逻辑 */ }
}
```

---

## 4. “龙虾式”因果复盘的执行流程 (Causal Reasoning)

当 DRTA 数值引擎（System 1）检测到极值或崩坏（例如：现金断流、技术债暴雷），触发 Aha-Moment 或 破产清算 时，按以下顺序执行“深度复盘”：

1.  **快照投影**：`SemanticContextService` 将数据库中该 `Rehearsal` 的序列状态投影成 `SOUL`, `DASHBOARD`, `JOURNAL` 三层 MD 上下文。
2.  **案例检索 (Vector RAG)**：利用提取到的特征，结合 `BusinessCase.embedding` 从 `pgvector` 中检索出与之高度近似的 2-3 个真实商业案例。
3.  **语义对齐**：将“本地 MD 状态” + “检索到的异星真实案例”。同时喂入 Gemini 大模型。
4.  **复盘生成**：AI 在读取 `JOURNAL.md` 的历史轨迹后，能够精确定位因果关系（例如指出：“你在第 4 周盲目追求 `techProgress` 而忽略了招聘补齐 `OPS`，直接导致了本周的业务内耗与团队出走…”）。

---

## 5. 特殊场景的支持策略

### 离线补算下的 MD 记忆维护 (Offline Warp Integration)

针对 `1秒 = 1虚拟小时` 的高频流速，日志维护采取松弛策略：
*   **实时运行期间**：每经历一整周（168 虚拟小时），向 `logsJson` (对应映射后的 `JOURNAL.md`) 追加一条高度紧凑的浓缩周报。
*   **离线补偿期间（Offline Warp）**：当用户重连并触发离线补算时，系统执行快进，并将离线期间的数值变化**折叠**。用一个 `# [OFFLINE_SUMMARY]` 块级标题聚合掉离线周期内的所有宏观波动，而不是逐周生成日志。这能极大防止长文本撑爆 Token 空间或干扰 AI 的重点。

### 极具沉浸感的商业尸检 (Autopsy / Graveyard)

当玩家在 CLI 终端执行 `grave <id>` 时：
1. 后端直接调用 `generateAhaContext` 还原死者生前的 `SOUL`、临终时的 `DASHBOARD` 和最后十周的 `JOURNAL`。
2. 将这套材料丢给 AI 生成辛辣的尸检报告。
3. （可选进阶功能）不仅在控制台输出复盘分析，还允许终端直接用 `cat /var/log/soul.md` 的形式呈现这份动态生成的亡者档案给玩家检阅。
