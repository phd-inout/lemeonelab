# Industry DNA: 新零售与 D2C 品牌 (D2C E-com)
ID: ind_014_d2c | Version: 3.0 (14D Aligned)

## [Module 1] Baseline Vector (14D)
- D14 (Awareness): 0.95 (必须拥有极强的全渠道触媒和种草能力)
- D6 (Monetize): 0.85 (利润率控制与复购压迫是生存基础)
- D9 (Consistency): 0.85 (履约、物流、售后的一致性)
- D5 (Entry): 0.90 (购买链路必须极短，支持一键下单)
- D8 (Social): 0.75 (私域运营能力)

## [Module 2] Industry Anchors
- **D14 (Awareness)**: 0.90=生存线。在注意力稀缺的时代，低感知度意味着产品在货架上腐烂。
- **D6 (Monetize Pressure)**: 0.80=标准。由于获客成本高昂，单均毛利或 LTV (生命周期价值) 必须足够高。
- **D9 (Consistency)**: 0.80=及格线。供应链断裂或发货延迟会导致口碑瞬间崩盘。

## [Module 3] Critical Dimensions
- **Primary**: D14 (全渠道营销触达), D6 (毛利与复购控制)
- **Secondary**: D9 (履约一致性), D8 (私域传染力)

## [Module 4] Semantic Mappings
- "极致性价比 / 低价竞争" -> D6 -0.3, D14 +0.2 (提升感知，但极度压缩生存率)
- "私域会员体系" -> D8 +0.3, D6 +0.1 (增加复购)
- "全网爆款营销" -> D14 +0.4

## [Module 5] Physics Laws
- **Inventory Death**: IF D14 < 0.6 -> TRIGGER Inventory_Write_Off (感知度不足导致库存积压，现金流断裂)。
- **The CAC/LTV Race**: D14 带来的流量必须在 3 个 Epoch 内通过 D6 完成价值提取，否则将被 Burn_Rate 拖死。

## [Module 6] Probing Logic
- IF D14.sigma > 0.5 -> ASK "你们的主要获客依赖于昂贵的公域买量还是自有的社交裂变？单均 CAC 占客单价的具体比例是多少？"

## [Module 7] Macro Modifiers
- TechDebt λ: 0.1 (几无技术债，重点是供应链债)
- CAC Base: 极高 (流量红利消失后的买量红海)
- Inventory Risk: 极高 (物理资产周转压力)。
