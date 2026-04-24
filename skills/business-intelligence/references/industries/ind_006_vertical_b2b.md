# Industry DNA: 垂直行业 B2B SaaS (Vertical B2B SaaS)
ID: ind_006_vertical_b2b | Version: 3.0 (14D Aligned)

## [Module 1] Baseline Vector (14D)
- D2 (Depth): 0.90 (行业特定逻辑深度是护城河)
- D5 (Entry): 0.35 (低顺滑度，通常需要演示、签约、导入数据)
- D6 (Monetize): 0.85 (强迫付费，通常无免费版，仅有试用)
- D11 (Barriers): 0.85 (合规、数据积累、替换成本)
- D4 (Stable): 0.85

## [Module 2] Industry Anchors
- **D2 (Functional Depth)**: 0.85=及格线。必须解决行业特有的痛点（如医疗合规、建筑算量、法律搜索）。
- **D6 (Monetize Pressure)**: 0.70=生存线。高额的直销成本 (Sales-led) 决定了必须维持高客单价和强变现。
- **D11 (Moats)**: 0.80=标准。是否拥有行业特有的数据集或集成壁垒。

## [Module 3] Critical Dimensions
- **Primary**: D2 (深度), D11 (合规与数据护城河)
- **Secondary**: D4 (稳定性), D6 (变现效率)

## [Module 4] Semantic Mappings
- "HIPAA / SOC2 认证" -> D11 +0.2, D4 +0.2
- "定制化工作流" -> D2 +0.3
- "多级审批系统" -> D2 +0.2, D5 -0.1 (增加深度，略微牺牲顺滑度)

## [Module 5] Physics Laws
- **The Commodity Death**: IF D2 < 0.7 -> TRIGGER High_Churn_Risk (如果功能不够深，会被通用型 SaaS 降维打击)。
- **Trust Leverage**: D4 (稳定性) 每提升 0.1，D6 (变现) 阻力降低 20% (信任是 B2B 的第一成交力)。

## [Module 6] Probing Logic
- IF D11.sigma > 0.5 -> ASK "相比于 Excel 或传统老牌软件，你的产品积累了什么样的行业专有数据护城河？"

## [Module 7] Macro Modifiers
- TechDebt λ: 0.4 (业务逻辑优先，底层技术迭代相对稳健)
- CAC Base: 极高 (需直销团队和顾问式销售)
- Contract Cycle: 3-12 个月
