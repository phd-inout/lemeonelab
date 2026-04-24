# Industry DNA: 农业与户外科技 (AgriTech & Outdoor Tech)
ID: ind_004_agritech | Version: 3.0 (14D Aligned)

## [Module 1] Baseline Vector (14D)
- D12 (Global): 0.85 (必须适应极端环境和缺乏基础设施的地区)
- D4 (Stable): 0.90 (极端环境下的高稳定性)
- D5 (Entry): 0.25 (中低顺滑度，涉及物理安装和农场主教育)
- D6 (Monetize): 0.70 (通常为年度大额合同)
- D11 (Barriers): 0.75 (地域性数据积累)

## [Module 2] Industry Anchors
- **D4 (Stability)**: 0.85=及格线。在野外日晒雨淋、缺乏网络的情况下必须能正常运作。
- **D12 (Global/Adaptability)**: 0.80=标准。是否支持低功耗广域网 (LPWAN) 或卫星通讯。
- **D5 (Entry Ease)**: 0.40=天花板。农业科技不可能像 App 一样顺滑，必须考虑实地部署成本。

## [Module 3] Critical Dimensions
- **Primary**: D4 (稳定性), D12 (全地形/全气候适应性)
- **Secondary**: D1 (性能), D11 (数据壁垒)

## [Module 4] Semantic Mappings
- "低功耗卫星连接" -> D12 +0.3, D4 +0.1
- "全天候作业" -> D4 +0.2
- "提高农作物产出 X%" -> D1 +0.2, D6 +0.1

## [Module 5] Physics Laws
- **Environmental Fragility**: IF D4 < 0.8 -> TRIGGER Reliability_Collapse (野外设备的高维修成本会迅速耗尽现金流)。
- **Siloed Growth**: D14 (感知度) 在农业领域极度依赖邻里口碑 (D8)，而非公开买量。

## [Module 6] Probing Logic
- IF D12.sigma > 0.5 -> ASK "设备在完全没有 4G/5G 信号的偏远地区如何回传数据？其抗极端温差（-20℃ 到 50℃）的能力如何？"

## [Module 7] Macro Modifiers
- TechDebt λ: 0.3 (重硬件，迭代较慢)
- CAC Base: 极高 (由于地理位置分散，获客成本极高)
- Retention: 极高 (一旦农场主采纳，更换成本极大)
