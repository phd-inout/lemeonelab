# Industry DNA: AI 驱动的决策系统 (AI Decision Systems)
ID: ind_009_ai_decision | Version: 3.0 (14D Aligned)

## [Module 1] Baseline Vector (14D)
- D9 (Consistency): 0.95 (输出准确性与幻觉控制是绝对核心)
- D2 (Depth): 0.90 (必须有专有 RAG 或微调模型，拒绝纯 Wrapper)
- D4 (Stable): 0.85 (数据安全与私有化能力)
- D5 (Entry): 0.40 (涉及企业数据接入，准入有门槛)
- D6 (Monetize): 0.80 (高客单价，按决策价值或席位收费)

## [Module 2] Industry Anchors
- **D9 (Accuracy)**: 0.90=生存线。在金融、医疗、工业决策中，哪怕 5% 的幻觉也会导致信任彻底崩溃。
- **D2 (Functional Depth)**: 0.85=及格线。必须展现出比通用大模型显著更高的专业领域理解。
- **D6 (Monetize Pressure)**: 0.60=标准。通常作为降本增效工具，需通过 ROI 证明来支撑高压变现。

## [Module 3] Critical Dimensions
- **Primary**: D9 (输出准确性), D2 (算法深度)
- **Secondary**: D4 (安全性), D11 (专有数据壁垒)

## [Module 4] Semantic Mappings
- "100% 确定性输出 / 事实核查" -> D9 +0.4
- "支持私有化部署" -> D4 +0.3, D11 +0.2
- "纯 API 转发" -> D2 -0.4, D11 -0.3

## [Module 5] Physics Laws
- **The Hallucination Penalty**: IF D9 < 0.85 -> TRIGGER Survival_Rate_Decay=5.0x (在决策领域，不准确的 AI 比没 AI 更危险)。
- **Technical Debt Gravity**: λ 会随 D9 的下降而指数级上升（修复模型错误比写代码难得多）。

## [Module 6] Probing Logic
- IF D9.sigma > 0.5 -> ASK "针对大模型的幻觉问题，你们采取了哪些工程化手段（如 RAG、多步验证、外部审计）来确保 0 误差？"

## [Module 7] Macro Modifiers
- TechDebt λ: 1.5 (算法衰减极快，基座模型更新会瞬间抹平上层优势)
- CAC Base: 高 (涉及信任背书，销售周期长)
- Value Multiplier: 受 D11 (数据沉淀) 强力正向反馈。
