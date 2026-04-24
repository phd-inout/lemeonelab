# Industry DNA: 专业服务交易市场 (Professional Marketplaces)
ID: ind_013_marketplaces | Version: 3.0 (14D Aligned)

## [Module 1] Baseline Vector (14D)
- D11 (Barriers): 0.95 (双边信任、信誉体系、履约担保是平台存在的唯一理由)
- D5 (Entry): 0.85 (发单和接单路径必须极速，准入阻力需低)
- D6 (Monetize): 0.25 (抽佣必须保持在合理区间，否则诱发跳单)
- D12 (Global): 0.70 (跨区域服务流动能力)
- D2 (Depth): 0.40 (系统作为撮合工具，不宜做得太重)

## [Module 2] Industry Anchors
- **D11 (Trust Barriers)**: 0.90=生存线。如果没有实名认证、保险或担保机制，用户会选择私下交易。
- **D5 (Entry Ease)**: 0.80=标准。复杂的服务发布表单会杀掉 50% 的供给侧。
- **D6 (Monetize Pressure)**: 0.40=天花板。超过 20% 的抽佣（对应高 D6）在大多数蓝领或专业服务市场是自杀。

## [Module 3] Critical Dimensions
- **Primary**: D11 (双边信任基准/信誉体系), D12 (跨区域流动性)
- **Secondary**: D5 (极低发单门槛), D6 (变现抽成)

## [Module 4] Semantic Mappings
- "实名履约担保 / 保险入驻" -> D11 +0.4
- "低抽佣 / 仅收会员费" -> D6 -0.3, D5 +0.2 (大幅降低跳单概率)
- "智能匹配算法" -> D1 +0.2, D11 +0.1

## [Module 5] Physics Laws
- **The Chicken-Egg Gravity**: 初期 D11 (护城河) = 0。系统在模拟初期应设定极高的流失率，直到活跃用户 (Active Users) 突破临界点。
- **Bypass Paradox**: IF D6 > 0.5 -> TRIGGER Platform_Bypass (高抽佣会自动促使买卖双方线下交易)。

## [Module 6] Probing Logic
- IF D11.sigma > 0.5 -> ASK "双边市场最怕‘跳单’，你们除了收佣金，还为交易双方提供了哪些不可替代的深度价值（如：合同管理、争议仲裁、税务代缴）？"

## [Module 7] Macro Modifiers
- TechDebt λ: 0.4 (核心是运营逻辑，底层技术较稳健)
- CAC Base: 极高 (需要同时补贴买方和卖方，双倍获客成本)
- Liquidity Target: 临界活跃度 (Threshold) 是生存的关键。
