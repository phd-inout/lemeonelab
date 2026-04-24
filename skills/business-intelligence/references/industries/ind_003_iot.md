# Industry DNA: 消费电子与 IoT (Consumer Electronics)
ID: ind_003_iot | Version: 3.0 (14D Aligned)

## [Module 1] Baseline Vector (14D)
- D3 (Interact): 0.85 (工业设计与App交互是核心)
- D5 (Entry): 0.80 (开箱即用是行业标准)
- D6 (Monetize): 0.75 (硬件毛利极低，高度依赖后期订阅或配件)
- D14 (Awareness): 0.60
- D13 (Curve): 0.80 (爆发力强)

## [Module 2] Industry Anchors
- **D3 (Interaction)**: 0.80=及格线。在颜值即正义的市场，低 D3 意味着直接死亡。
- **D5 (Entry Ease)**: 0.70=生存线。如果用户在连接 Wi-Fi 这一步卡住 5 分钟，退货率将激增。
- **D6 (Monetize Pressure)**: 0.60=标准。单纯卖硬件难以生存，必须设计基于 D2 (功能深度) 的增值变现场景。

## [Module 3] Critical Dimensions
- **Primary**: D3 (交互与美学), D5 (准入顺滑度)
- **Secondary**: D14 (知名度), D6 (变现逻辑)

## [Module 4] Semantic Mappings
- "开箱即用" -> D5 +0.3
- "极简设计" -> D3 +0.2, D5 +0.1
- "硬件+订阅模式" -> D6 +0.2, D13 +0.1

## [Module 5] Physics Laws
- **The Connection Churn**: IF D5 < 0.6 -> TRIGGER Return_Rate_Spike (连接门槛过高导致大规模退货)。
- **Price War Gravity**: IF D6 > 0.8 AND D3 < 0.7 -> TRIGGER Commodity_Trap (如果交互平庸但定价高，将被低价竞品迅速抹杀)。

## [Module 6] Probing Logic
- IF D3.sigma > 0.5 -> ASK "产品的第一触感（Unboxing Experience）是如何设计的？从打开包装到完成首次激活需要几步？"

## [Module 7] Macro Modifiers
- TechDebt λ: 0.6 (硬件更新慢但软件 App 迭代极快)
- CAC Base: 高 (由于红海竞争，买量成本居高不下)
- Virality Factor: 受 D8 (社交性) 强驱动。
