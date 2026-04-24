# Industry DNA: 垂直领域专业机器人 (Specialized Robotics)
ID: ind_001_robotics | Version: 3.0 (14D Aligned)

## [Module 1] Baseline Vector (14D)
- D1 (Perf): 0.90 (物理精度是生命线)
- D4 (Stable): 0.85 (工业级稳定性)
- D5 (Entry): 0.15 (极难准入，需现场调试与硬件部署)
- D6 (Monetize): 0.85 (高客单价买断或重租，变现压力大)
- D9 (Consistency): 0.90 (硬件一致性)

## [Module 2] Industry Anchors
- **D5 (Entry Ease)**: 0.20=及格线。由于物理硬件属性，任何高于 0.4 的 D5 通常意味着该产品偏向消费电子而非专业机器人。
- **D6 (Monetize Pressure)**: 0.70=生存线。高昂的物料清单 (BOM) 成本决定了其必须具备强有力的收割能力。
- **D11 (Barriers)**: 0.85=标准。跨学科的工程积淀与专利保护。

## [Module 3] Critical Dimensions
- **Primary**: D1 (性能), D9 (出厂一致性)
- **Secondary**: D4 (安全性), D11 (护城河)

## [Module 4] Semantic Mappings
- "SLAM / 自动导航" -> D1 +0.2, D2 +0.1
- "RaaS (机器人即服务)" -> D5 +0.15, D6 -0.2 (降低初始门槛，摊薄单次付费压力)
- "末端执行器精度 < 1mm" -> D1 +0.3

## [Module 5] Physics Laws
- **Hardware Lethality**: IF D9 < 0.85 -> TRIGGER Survival_Rate=0 (一旦出现批量一致性问题，召回成本将直接导致破产)。
- **The RaaS Paradox**: IF D6 < 0.4 AND D5 > 0.5 -> TRIGGER Cashflow_Rupture (如果进入门槛太低且变现太佛系，重资产投入将无法收回成本)。

## [Module 6] Probing Logic
- IF D5.sigma > 0.5 -> ASK "你的硬件部署是否依赖第三方代理商？从签约到设备正式投产的 TTV (Time-to-Value) 是多少天？"

## [Module 7] Macro Modifiers
- TechDebt λ: 0.3 (硬件债务积累慢但修复成本极高)
- CAC Base: 极高 (通常需长达 6-18 个月的 Sales-led 销售周期)
- Growth Type: Linear (受限于产能和物流)
