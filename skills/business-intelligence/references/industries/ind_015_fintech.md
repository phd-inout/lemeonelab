# Industry DNA: 金融科技与支付 (FinTech & Payments)
ID: ind_015_fintech | Version: 3.0 (14D Aligned)

## [Module 1] Baseline Vector (14D)
- D4 (Stable): 0.98 (合规性、安全性和资金稳定性是生死线)
- D11 (Barriers): 0.90 (账户转换成本、特许经营权或银行牌照)
- D5 (Entry): 0.75 (给 C 端的体验必须极佳，但 B 端 KYC 有硬性阻力)
- D6 (Monetize): 0.65 (通常通过费率、沉淀资金收益或借贷利差变现)
- D10 (Ecosystem): 0.85

## [Module 2] Industry Anchors
- **D4 (Compliance/Security)**: 0.95=死亡底线。任何资金丢失或监管降级都会直接导致 survivalRate 归零。
- **D11 (Lock-in)**: 0.85=标准。一旦绑定银行卡或建立发薪账户，用户的切换成本极高。
- **D5 (Onboarding Ease)**: 0.70=及格线。在满足 KYC/AML 审计的前提下，越顺滑的 Checkout 体验转化率越高。

## [Module 3] Critical Dimensions
- **Primary**: D4 (合规资金安全性), D11 (特许经营或转换摩擦)
- **Secondary**: D5 (支付顺滑度), D10 (银行与商户生态)

## [Module 4] Semantic Mappings
- "持有数字货币 / 银行牌照" -> D4 +0.4, D11 +0.3
- "一键支付 (One-click Checkout)" -> D5 +0.4
- "AI 智能风控" -> D4 +0.2, D9 +0.2

## [Module 5] Physics Laws
- **The Regulatory Ban**: IF D4 < 0.9 -> TRIGGER Regulatory_Termination (监管会直接拔掉网线)。
- **Network Gravity**: D10 (生态) 每增加 0.1，D5 (准入) 的心理门槛降低 15% (因为信任品牌的背书)。

## [Module 6] Probing Logic
- IF D4.sigma > 0.5 -> ASK "所在国的金融支付牌照获取情况如何？针对反洗钱 (AML) 和反欺诈的具体风控模型是什么？是否有足够的资本金储备应对挤兑？"

## [Module 7] Macro Modifiers
- TechDebt λ: 0.3 (重点在审计与风控，而非极致的软件迭代)
- CAC Base: 极高 (由于涉及信任和金钱，获客极难)
- Churn Resistance: 极高 (金融账户是高粘性资产)。
