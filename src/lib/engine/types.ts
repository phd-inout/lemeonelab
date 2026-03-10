// ============================================================
// lemeone-lab Core Types
// 6维向量系统 — 与 DRTA 共鸣引擎完全兼容
// ============================================================

// 6维创始人属性向量：[MKT, TEC, LRN, FIN, OPS, CHA]
// 原始值范围：20-100（不归一化，归一化在 engine 内部处理）
export type FounderVector = [number, number, number, number, number, number]

// 维度索引常量
export const DIM = {
    MKT: 0, // 营销能力
    TEC: 1, // 技术/AI驾驭
    LRN: 2, // 基础学习力
    FIN: 3, // 财务感知
    OPS: 4, // 运营/流程
    CHA: 5, // 魅力/抗压
} as const

export type CompanyStage = 'SEED' | 'MVP' | 'PMF' | 'SCALE' | 'IPO' | 'TITAN' | 'LIFESTYLE_EMPIRE'

export type IndustryType =
    | 'AI_SAAS'
    | 'DTC_ECOM'
    | 'WEB3_GAMING'
    | 'BIOTECH'
    | 'CREATOR_ECONOMY'
    | 'B2B_ENTERPRISE'

export type BusinessModel =
    | 'SUBSCRIPTION_SAAS'
    | 'USAGE_BASED'
    | 'MARKETPLACE'
    | 'ONE_TIME_LICENSE'
    | 'FREEMIUM'

export type FounderBackground =
    | 'FRESH_GRAD'        // 学院派黑客
    | 'CORPORATE_REFUGEE' // 大厂逃离者
    | 'SERIAL_PRO'       // 中年连续创业者
    | 'INDUSTRY_VETERAN' // 行业老兵
    | 'PLAIN_STARTER'    // 白手起Family

// ============================================================
// 行业权重矩阵（Pre-alpha 伪向量引擎核心常量）
// 每行：[MKT, TEC, LRN, FIN, OPS, CHA]，加总 = 1.0
// ============================================================
export const INDUSTRY_WEIGHTS: Record<IndustryType, FounderVector> = {
    AI_SAAS: [0.10, 0.50, 0.15, 0.10, 0.05, 0.10],
    DTC_ECOM: [0.40, 0.10, 0.10, 0.15, 0.15, 0.10],
    WEB3_GAMING: [0.15, 0.35, 0.15, 0.10, 0.10, 0.15],
    BIOTECH: [0.05, 0.55, 0.20, 0.10, 0.05, 0.05],
    CREATOR_ECONOMY: [0.45, 0.05, 0.10, 0.05, 0.10, 0.25],
    B2B_ENTERPRISE: [0.20, 0.15, 0.10, 0.20, 0.25, 0.10],
}

// 行业波动率（影响随机事件振幅）
export const INDUSTRY_VOLATILITY: Record<IndustryType, number> = {
    AI_SAAS: 0.08,
    DTC_ECOM: 0.12,
    WEB3_GAMING: 0.20,
    BIOTECH: 0.15,
    CREATOR_ECONOMY: 0.15,
    B2B_ENTERPRISE: 0.06,
}

// 年龄段效能乘数
export type AgeGroup = '20s' | '30s' | '40s' | '50plus'
export const AGE_MULTIPLIERS: Record<AgeGroup, { tec: number; mkt: number; ops: number }> = {
    '20s': { tec: 1.2, mkt: 0.9, ops: 0.9 },
    '30s': { tec: 1.0, mkt: 1.0, ops: 1.1 },
    '40s': { tec: 0.85, mkt: 1.2, ops: 1.2 },
    '50plus': { tec: 0.7, mkt: 1.1, ops: 1.3 },
}

// ============================================================
// 创始人建模
// ============================================================
export interface Founder {
    name: string
    age: number
    ageGroup: AgeGroup
    background: FounderBackground
    vector: FounderVector   // [MKT, TEC, LRN, FIN, OPS, CHA] 原始值 20-100
    bwMax: number           // 带宽上限（Neural Bandwidth）
    bwUsed: number          // 本周已用带宽
    bwStress: number        // 压力值 0-100（高于 80 进入警告区）
    bwStressStreak: number  // 连续高压周数（触发 Burnout 用的计数器）
    wealth: number          // 创始人个人财富（来自公司分红）
}

// ============================================================
// Idea Calibration（AI 评估产品想法）
// ============================================================
export interface IdeaCalibration {
    painPointAcuity: number  // 0-30
    marketTiming: number  // 0-25
    founderFit: number  // 0-25
    differentiationEdge: number  // 0-20
    total: number  // 0-100

    // 映射到引擎参数
    mrrGrowthMultiplier: number  // 0.7 ~ 1.4
    initialMoat: number  // 0 ~ 30
    attributeBonus: Partial<Record<keyof typeof DIM, number>>
}

// ============================================================
// 公司与游戏状态
// ============================================================
export interface Staff {
    id: string
    role: keyof typeof DIM
    talent: number       // 0-100 换算为矩阵的增益
    salary: number       // 每周薪资
    bwBonus: number      // 为创始人提供的带宽减轻（如果有）
    weeksEmployed: number
}

export interface CompanyState {
    name: string
    industry: IndustryType
    businessModel: BusinessModel
    stage: CompanyStage

    cash: number
    burnRate: number        // 每周固定支出
    mrr: number             // 月经常性收入（实际作单周流水基数计算）
    receivables: number     // 待回收账款（应收款槽，引入账期风险）
    devProgress: number     // 0-100，产品进度
    moat: number            // 0-100，护城河
    techDebt: number        // 0-100，技术债
    valuation: number       // 估值

    weekNumber: number      // 当前游戏第几周
    cashCriticalStreak: number  // cash ≤ 0 持续周数（破产倒计时）
    opsDebtStreak: number       // TEC/OPS 比例失衡的连续周数
    isPostBadDecision: boolean  // 是否刚经历过严重的进度落后或失败Pivot (用于触发 Lucky Pivot)

    ideaScore?: IdeaCalibration
    marketVector: FounderVector // [MKT, TEC, LRN, FIN, OPS, CHA] 随时间漂移的市场需求方向 (0-1)
    resonance: number       // 缓存的当前共鸣度计算结果 (0-1)

    staff: Staff[]          // 公司雇员
    actionCards: ActionCard[] // 玩家拥有的行动卡牌
    dividendsPaid: number   // 累计分红金额
}

// ============================================================
// 行动卡牌 (Action Cards)
// ============================================================
export type ActionCardType = 'GEEK_SPRINT' | 'VIRAL_MARKETING' | 'TECH_REFACTOR'
export interface ActionCard {
    id: string
    type: ActionCardType
    name: string
    desc: string
}

// ============================================================
// 游戏完整状态（贯穿整个模拟）
// ============================================================
export interface GameState {
    id: string              // Rehearsal ID
    founder: Founder
    company: CompanyState
    isFailed: boolean
    failureReason?: FailureReason
    logs: WeekLog[]
}

// ============================================================
// Sprint 结果
// ============================================================
export interface WeekLog {
    week: number
    progressDelta: number
    cashDelta: number
    techDebtDelta: number
    event?: GameEvent
    narrative: string       // AI 生成的叙事（或占位文本）
}

export interface SprintResult {
    finalState: GameState
    log: WeekLog[]
    ahaMoment?: AhaMoment
    promotion?: { from: CompanyStage; to: CompanyStage }
    gameOver?: GameOverResult
}

// ============================================================
// Game Over
// ============================================================
export type FailureReason =
    | 'CASH_BANKRUPT'
    | 'FOUNDER_COLLAPSE'
    | 'MARKET_DEATH'
    | 'FORCED_EXIT'
    | 'LIFESTYLE_VICTORY'

export interface GameOverResult {
    isFailed: boolean
    reason: FailureReason
    failedAtStage: CompanyStage
    failedAtWeek: number
    aiPostMortem?: string
}

// ============================================================
// 随机事件
// ============================================================
export type EventCategory = 'MARKET' | 'TECH' | 'PEOPLE' | 'FINANCE' | 'BLACK_SWAN'

export interface EventEffect {
    target: keyof CompanyState | 'bwStress' | 'founderAttr'
    delta: number
    attrIndex?: number  // 当 target = 'founderAttr' 时，指定维度索引
}

export interface GameEvent {
    id: string
    name: string
    stage: CompanyStage[]
    category: EventCategory
    baseProbability: number
    effects: EventEffect[]
    narrativePrompt: string
    isGameOver?: boolean
    cooldownWeeks: number
    probabilityModifiers?: {     // 高分属性降低负面随机事件概率
        targetDim: keyof typeof DIM
        threshold: number       // 对应维度能力若 >= 该值
        multiplier: number      // 则 baseProbability 乘以此系数，如 0.2
    }[]
}

// ============================================================
// Aha-Moment
// ============================================================
export type AhaMomentType = 'HARD_TRUTH' | 'OPS_DEBT_EXPLOSION' | 'BURNOUT_INSIGHT' | 'LUCKY_PIVOT'

export interface AhaMoment {
    type: AhaMomentType
    insight: string       // AI 生成的顿悟内容
    referenceCase: string // 参考案例（Segway / WeWork / Quibi）
}
