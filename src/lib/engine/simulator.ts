import {
  GameState,
  SprintResult,
  WeekLog,
  CompanyState,
  Founder,
  FounderVector,
  IndustryType,
  INDUSTRY_WEIGHTS,
  AGE_MULTIPLIERS,
  AgeGroup,
  GameOverResult,
  FailureReason,
  CompanyStage,
  Staff,
  DIM,
} from './types'

// ============================================================
// DRTA 共鸣引擎体系 (Alpha)
// 公式：O = ||state|| × cos(state, V_market) × Φ(e)
// ============================================================

function getAgeGroup(age: number): AgeGroup {
  if (age < 30) return '20s'
  if (age < 40) return '30s'
  if (age < 50) return '40s'
  return '50plus'
}

export function nextMarketDrift(current: FounderVector, industry: IndustryType): FounderVector {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { INDUSTRY_VOLATILITY } = require('./types');
  const lambda = INDUSTRY_VOLATILITY[industry] ?? 0.1;
  return current.map(v => {
    const drift = (Math.random() - 0.5) * lambda;
    return Math.max(0.01, Math.min(1.0, v + drift));
  }) as FounderVector;
}

/**
 * 核心产出计算 (DRTA)
 */
export function calculateResonanceOutput(
  founderVector: FounderVector,
  marketVector: FounderVector,
  techDebt: number,
  age: number,
  staffList: Staff[] = []
): { progressDelta: number; resonance: number; magnitude: number } {
  const ageGroup = getAgeGroup(age)
  const ageMultiplier = AGE_MULTIPLIERS[ageGroup].tec

  // 1. state = V_founder + V_staff
  const stateVector = [...founderVector] as FounderVector
  staffList.forEach(s => {
    const dimIdx = DIM[s.role]
    stateVector[dimIdx] = Math.min(150, stateVector[dimIdx] + s.talent * 0.5) // 每个员工最高提供一半才华的加成，单维度硬顶150
  })

  // 2. Magnitude (||state||)
  const magnitude = Math.sqrt(stateVector.reduce((sum, val) => sum + val * val, 0))

  // 3. Resonance (cos(state, V_market))
  const dotProduct = stateVector.reduce((sum, val, i) => sum + val * marketVector[i], 0)
  const magMarket = Math.sqrt(marketVector.reduce((sum, val) => sum + val * val, 0))
  const resonance = (magnitude === 0 || magMarket === 0) ? 0 : dotProduct / (magnitude * magMarket)

  // 4. Entropy Decay Φ(e) = e^(-λE)
  // E = |staff| * 0.5 + (techDebt / 100) * 5.0 (为了对齐 techDebt 量级)
  const E = staffList.length * 0.5 + (techDebt / 100) * 5.0
  let decay = Math.exp(-0.1 * E)

  // Low Entropy Bonus (小而美)
  if (staffList.length === 0 && techDebt < 20) {
    decay = 1.0 + (20 - techDebt) * 0.05 // 最高 2.0x 乘数
  }

  const noise = 0.9 + Math.random() * 0.2

  // 缩放系数 0.1 保证合理每周进度（3-15%）
  const output = magnitude * Math.max(0, resonance) * decay * ageMultiplier * noise * 0.1

  return { progressDelta: output, resonance, magnitude }
}

/**
 * 技术债步进
 */
export function stepTechDebt(techDebt: number, intensity: number, staffCount: number = 0): number {
  let delta = 0.5  // 基础积累（复杂度自然增长）
  if (intensity > 1.0) {
    delta += 5 * (intensity - 1.0)  // 加班快速积累
  }
  // Low entropy benefit: zero staff reduces tech debt accumulation
  if (staffCount === 0 && intensity <= 1.0) {
    delta -= 0.3 // Reduces base accumulation
  }
  return Math.min(100, Math.max(0, techDebt + delta))
}

/**
 * MRR 计算（仅 MVP+ 且 devProgress ≥ 60）
 */
export function calcMRR(state: GameState, mrrGrowthMultiplier: number = 1.0): number {
  const { stage, devProgress, mrr, businessModel } = state.company

  if (stage === 'SEED' || devProgress < 60) return 0

  // 基础增长率（按商业模式不同）
  const baseGrowthRate: Record<string, number> = {
    SUBSCRIPTION_SAAS: 0.15,
    USAGE_BASED: 0.20,
    MARKETPLACE: 0.08,
    ONE_TIME_LICENSE: 0.05,
    FREEMIUM: 0.10,
  }
  const growth = (baseGrowthRate[businessModel] ?? 0.1) * mrrGrowthMultiplier

  if (mrr === 0) {
    // 首笔收入
    return Math.floor(500 * mrrGrowthMultiplier)
  }
  // 复利增长 + 随机波动
  const noise = 0.85 + Math.random() * 0.3
  return Math.floor(mrr * (1 + growth) * noise)
}

/**
 * Burn Rate 计算
 * Pre-alpha：固定基础值（无员工）
 */
export function calcBurnRate(state: GameState): number {
  const baseBurnByStage: Record<CompanyStage, number> = {
    SEED: 15000,
    MVP: 20000,
    PMF: 30000,
    SCALE: 60000,
    IPO: 120000,
    TITAN: 250000,
    LIFESTYLE_EMPIRE: 30000,
  }
  const base = baseBurnByStage[state.company.stage] ?? 15000
  const staffCost = state.company.staff.reduce((sum, s) => sum + s.salary, 0)
  return base + staffCost
}

/**
 * 阶段晋级检查
 */
function checkStagePromotion(state: GameState): { from: CompanyStage; to: CompanyStage } | null {
  const { stage, devProgress, mrr } = state.company

  if (stage === 'SEED' && devProgress >= 100) {
    return { from: 'SEED', to: 'MVP' }
  }
  if (stage === 'MVP' && mrr >= 5000) {
    return { from: 'MVP', to: 'PMF' }
  }
  if (stage === 'PMF' && mrr >= 50000) {
    return { from: 'PMF', to: 'SCALE' }
  }
  if (stage === 'SCALE' && mrr >= 500000) {
    return { from: 'SCALE', to: 'IPO' }
  }
  if (stage === 'IPO' && mrr >= 5000000) {
    return { from: 'IPO', to: 'TITAN' }
  }
  return null
}

function applyPromotion(state: GameState, promotion: { from: CompanyStage; to: CompanyStage }): GameState {
  return {
    ...state,
    company: { ...state.company, stage: promotion.to }
  }
}

// ============================================================
// Game Over 检查
// ============================================================

function checkCashBankrupt(state: GameState): boolean {
  if (state.company.cash > 0) {
    if (state.company.cashCriticalStreak > 0) {
      // 恢复正常时重置
      state.company.cashCriticalStreak = 0
    }
    return false
  }
  state.company.cashCriticalStreak = (state.company.cashCriticalStreak ?? 0) + 1
  return state.company.cashCriticalStreak > 4  // 持续超过 1 个月（4周）触发
}

function checkMarketDeath(state: GameState): boolean {
  if (state.company.stage === 'SEED' && state.company.weekNumber > 26) return true
  if (state.company.stage === 'MVP' && state.company.weekNumber > 52) return true
  return false
}

function checkLifestyleVictory(state: GameState): boolean {
  // Personal wealth >= ¥10,000,000 and survived at least 2 years (104 weeks), stage >= PMF
  return state.founder.wealth >= 10000000 && state.company.weekNumber >= 104 && state.company.stage !== 'SEED' && state.company.stage !== 'MVP'
}

export function checkGameOver(state: GameState): GameOverResult | null {
  if (checkCashBankrupt(state)) {
    return {
      isFailed: true,
      reason: 'CASH_BANKRUPT',
      failedAtStage: state.company.stage,
      failedAtWeek: state.company.weekNumber,
    }
  }
  if (checkMarketDeath(state)) {
    return {
      isFailed: true,
      reason: 'MARKET_DEATH',
      failedAtStage: state.company.stage,
      failedAtWeek: state.company.weekNumber,
    }
  }
  if (checkLifestyleVictory(state)) {
    return {
      isFailed: false,
      reason: 'LIFESTYLE_VICTORY',
      failedAtStage: state.company.stage,
      failedAtWeek: state.company.weekNumber,
    }
  }
  return null
}

// ============================================================
// Aha-Moment 检查
// ============================================================
function checkAhaMoment(state: GameState, log: WeekLog[]) {
  // Pre-alpha 只做 HARD_TRUTH：实际进度 < 预期 40%
  const totalProgress = log.reduce((sum, w) => sum + w.progressDelta, 0)
  const expectedProgress = log.length * 8  // 每周预期 8%

  if (totalProgress < expectedProgress * 0.6) {
    return {
      type: 'HARD_TRUTH' as const,
      insight: '',  // 由 cortex-ai.ts 填充
      referenceCase: '["WeWork", "Quibi", "Segway"][Math.floor(Math.random()*3)]',
    }
  }
  return null
}

// ============================================================
// 主 Sprint 循环
// ============================================================
export async function runSprint(
  state: GameState,
  weeks: number,
  intensity: number = 1.0,
  onWeekComplete?: (log: WeekLog, weekNum: number) => void
): Promise<SprintResult> {
  let currentState: GameState = JSON.parse(JSON.stringify(state))  // 深拷贝
  const log: WeekLog[] = []

  const mrrMultiplier = currentState.company.ideaScore?.mrrGrowthMultiplier ?? 1.0

  for (let week = 1; week <= weeks; week++) {
    currentState.company.weekNumber++

    // 1. 计算本周进度 (DRTA)
    const outputResult = calculateResonanceOutput(
      currentState.founder.vector,
      currentState.company.marketVector,
      currentState.company.techDebt,
      currentState.founder.age,
      currentState.company.staff
    )
    const progressDelta = outputResult.progressDelta

    // 2. 更新技术债
    const newTechDebt = stepTechDebt(currentState.company.techDebt, intensity, currentState.company.staff.length)

    // 3. 更新 MRR
    const newMRR = calcMRR(currentState, mrrMultiplier)

    // 4. Receivables (应收款槽账期风险模拟)
    const currentReceivables = currentState.company.receivables + newMRR
    // 每周只能收回总应收款的一定比例（例如 40% ~ 60%），模拟账期延迟
    const collectionRate = 0.4 + Math.random() * 0.2
    const collectedCash = Math.floor(currentReceivables * collectionRate)
    const newReceivables = currentReceivables - collectedCash

    // 5. 扣除 burn rate
    const burnRate = calcBurnRate(currentState)
    const cashDelta = collectedCash - burnRate  // 真正到手的钱减去支出

    // 6. Burnout 机制 (压力积攒与永久掉属性)
    const stressDelta = intensity > 1.2 ? 25 : intensity > 1.0 ? 15 : -10
    currentState.founder.bwStress = Math.min(100, Math.max(0, currentState.founder.bwStress + stressDelta))
    let burnoutTriggered = false
    if (currentState.founder.bwStress > 80) {
      currentState.founder.bwStressStreak++
      if (currentState.founder.bwStressStreak >= 4) {
        // 连续4周高压 -> Burnout!
        burnoutTriggered = true
        currentState.founder.bwStressStreak = 0 // 重置连环计
        currentState.founder.bwStress = 50 // 大修整后压力回到50
        // 随机一个属性永久掉 5 点
        const dimIndex = Math.floor(Math.random() * 6)
        currentState.founder.vector[dimIndex] = Math.max(20, currentState.founder.vector[dimIndex] - 5)
      }
    } else {
      currentState.founder.bwStressStreak = 0
    }

    // 7. 更新状态
    currentState = {
      ...currentState,
      company: {
        ...currentState.company,
        devProgress: Math.min(100, currentState.company.devProgress + progressDelta),
        cash: currentState.company.cash + cashDelta,
        mrr: newMRR,
        receivables: newReceivables,
        techDebt: newTechDebt,
        marketVector: nextMarketDrift(currentState.company.marketVector, currentState.company.industry),
        resonance: outputResult.resonance,
      }
    }

    const weekLog: WeekLog = {
      week,
      progressDelta,
      cashDelta,
      techDebtDelta: newTechDebt - state.company.techDebt,
      narrative: `[Week ${week}] Progress +${progressDelta.toFixed(1)}% | Cash ${cashDelta >= 0 ? '+' : ''}¥${cashDelta.toLocaleString()}${burnoutTriggered ? ' ⚠️ BURNOUT' : ''}`,
    }

    log.push(weekLog)
    onWeekComplete?.(weekLog, week)

    // 6. Game Over 检查
    const gameOver = checkGameOver(currentState)
    if (gameOver) {
      return {
        finalState: { ...currentState, isFailed: true, failureReason: gameOver.reason },
        log,
        gameOver,
      }
    }
  }

  // 7. Aha-Moment 检查
  const aha = checkAhaMoment(currentState, log)

  // 8. 阶段晋级检查
  const promotion = checkStagePromotion(currentState)
  if (promotion) {
    currentState = applyPromotion(currentState, promotion)
  }

  return {
    finalState: currentState,
    log,
    ahaMoment: aha ?? undefined,
    promotion: promotion ?? undefined,
    gameOver: undefined,
  }
}

// ============================================================
// 创始人初始化
// ============================================================
export function createFounder(
  background: string,
  age: number,
  name: string = 'Founder'
): Founder {
  const bgPresets: Record<string, FounderVector> = {
    FRESH_GRAD: [40, 75, 80, 30, 35, 50],
    CORPORATE_REFUGEE: [55, 60, 55, 65, 70, 45],
    SERIAL_PRO: [65, 50, 60, 70, 75, 70],
    INDUSTRY_VETERAN: [60, 45, 50, 85, 80, 65],
    PLAIN_STARTER: [60, 60, 60, 60, 60, 60],
  }

  const baseVector = bgPresets[background] ?? bgPresets.PLAIN_STARTER
  // 加小量随机扰动 ±5
  const vector: FounderVector = baseVector.map(
    v => Math.min(100, Math.max(20, v + (Math.random() * 10 - 5)))
  ) as FounderVector

  const ageGroup = age < 30 ? '20s' : age < 40 ? '30s' : age < 50 ? '40s' : '50plus'
  const bwMax = ageGroup === '20s' ? 100 : ageGroup === '30s' ? 90 : ageGroup === '40s' ? 80 : 70

  return {
    name,
    age,
    ageGroup,
    background: background as any,
    vector,
    bwMax,
    bwUsed: 0,
    bwStress: 0,
    bwStressStreak: 0,
    wealth: 0,
  }
}

export function createCompany(
  industry: IndustryType,
  businessModel: string,
  founderBackground: string,
  name: string
): CompanyState {
  const startCash: Record<string, number> = {
    FRESH_GRAD: 50000,
    CORPORATE_REFUGEE: 200000,
    SERIAL_PRO: 150000,
    INDUSTRY_VETERAN: 300000,
    PLAIN_STARTER: 100000,
  }

  return {
    name,
    industry,
    businessModel: businessModel as any,
    stage: 'SEED',
    cash: startCash[founderBackground] ?? 100000,
    burnRate: 15000,
    mrr: 0,
    receivables: 0,
    devProgress: 0,
    moat: 5,
    techDebt: 0,
    valuation: 0,
    weekNumber: 0,
    cashCriticalStreak: 0,
    opsDebtStreak: 0,
    isPostBadDecision: false,
    marketVector: INDUSTRY_WEIGHTS[industry], // 初始市场方向直接取行业权重（归一化为 0-1）
    resonance: 0, // 初始待计算
    staff: [], // 初始无员工
    actionCards: [], // 初始无卡牌
    dividendsPaid: 0,
  }
}
