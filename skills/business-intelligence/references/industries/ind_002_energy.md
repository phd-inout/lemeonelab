# Industry DNA: 能源与精密硬件 (Energy & Precision Hardware)
ID: ind_002_energy | Version: 3.0 (14D Aligned)

## [Module 1] Baseline Vector (14D)
- D4 (Stable): 0.95 (安全性是绝对底线)
- D11 (Barriers): 0.85 (供应链控制力)
- D5 (Entry): 0.10 (极高门槛，涉及电网、基建或重度合规)
- D6 (Monetize): 0.90 (合同能源管理或重资产分期)
- D10 (Ecosystem): 0.70

## [Module 2] Industry Anchors
- **D4 (Stability/Safety)**: 0.95=死亡底线。能源领域不允许任何“Beta测试”式的事故。
- **D11 (Barriers)**: 0.80=及格线。通常由电芯、材料专利或资源特许权构成。
- **D5 (Entry Ease)**: 0.30=天花板。如果准入门槛过高，获客效率将成为主要瓶颈。

## [Module 3] Critical Dimensions
- **Primary**: D4 (安全性), D11 (供应链/准入护城河)
- **Secondary**: D1 (性能), D10 (生态集成)

## [Module 4] Semantic Mappings
- "固态电池" -> D1 +0.2, D4 +0.1, D11 +0.2
- "分布式电网" -> D10 +0.3
- "通过国家级认证 (如 UL/CE)" -> D4 +0.3, D11 +0.1

## [Module 5] Physics Laws
- **Safety Overlord**: IF D4 < 0.9 -> TRIGGER Survival_Rate=0.1 (一旦发生安全事故，项目将面临监管封杀)。
- **Supply Chain Weight**: D6 (变现) 的稳定性直接受制于 D11 (供应链深度)。

## [Module 6] Probing Logic
- IF D4.sigma > 0.5 -> ASK "你的产品是否具备物理层面的强制过热/过压切断机制？失效后的冗余方案是什么？"

## [Module 7] Macro Modifiers
- TechDebt λ: 0.2 (迭代周期极长，技术债积累较慢)
- CAC Base: 极高 (通常涉及大客户采购或政府招标)
- Regulatory Gravity: 极高 (环境政策波动对 survivalRate 影响巨大)
