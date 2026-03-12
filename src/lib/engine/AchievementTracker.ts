import { GameState } from './types'

export type AchievementDefinition = {
    id: string
    name: string
    category: 'BUSINESS' | 'ALGORITHM' | 'SURVIVAL' | 'AHA_HIDDEN'
    labPoints: number
    desc: string
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
    // 商业领袖
    { id: 'INITIAL_PROFIT', name: '第一桶金', category: 'BUSINESS', labPoints: 50, desc: '实现单周正向现金流 (MRR/4 > BurnRate)' },
    { id: 'BREAK_EVEN', name: '收支平衡', category: 'BUSINESS', labPoints: 80, desc: '累计现金突破 100k 并在 PMF 阶段稳健存活 10 周' },
    { id: 'TEN_HORN', name: '十角兽', category: 'BUSINESS', labPoints: 300, desc: '公司估值突破 100 亿' },
    { id: 'IPO_BELL', name: '敲钟人', category: 'BUSINESS', labPoints: 500, desc: '成功达到 IPO 阶段' },
    { id: 'TITAN_MIND', name: '行业巨头', category: 'BUSINESS', labPoints: 1000, desc: '成功达到 TITAN 阶段' },
    { id: 'CASH_COW', name: '现金奶牛', category: 'BUSINESS', labPoints: 100, desc: '持有现金 > ¥1,000,000' },
    
    // 算法大师
    { id: 'AI_NATIVE', name: 'AI 原住民', category: 'ALGORITHM', labPoints: 200, desc: '规模化阶段且核心团队由高维人才/AI主导' },
    { id: 'PURE_HUMAN', name: '纯粹人类', category: 'ALGORITHM', labPoints: 300, desc: '普通人力下估值破亿' },
    { id: 'EFFICIENCY_GOD', name: '效率之神', category: 'ALGORITHM', labPoints: 200, desc: 'VpB 效能突破 5000' },
    
    // 生存与韧性
    { id: 'NEAR_DEATH', name: '向死而生', category: 'SURVIVAL', labPoints: 100, desc: '破产边缘现金流≤0 存活 4 周并触底反弹' },
    { id: 'SURVIVOR', name: '抗压传说', category: 'SURVIVAL', labPoints: 150, desc: '连续处于高压 (>80) 10 周而不崩溃' },
    { id: 'ANTI_FRAGILE', name: '反脆弱', category: 'SURVIVAL', labPoints: 200, desc: '遭遇重大损失后成功触底反弹' },
    
    // Aha! 隐藏
    { id: 'PIVOT_MASTER', name: '断舍离', category: 'AHA_HIDDEN', labPoints: 150, desc: '在技术债爆炸的情况下 Pivot 重构并存活' },
    { id: 'CODE_TALKER', name: '代码会说话', category: 'AHA_HIDDEN', labPoints: 100, desc: '顶着 90+ 技术债存活超过 20 周' },
    { id: 'LAB_FRIEND', name: '实验室之友', category: 'AHA_HIDDEN', labPoints: 50, desc: '输入高质量 idea 并获得高分校验' },
]

export function evaluateAchievements(state: GameState, unlockedIds: string[]): string[] {
    const newlyUnlocked: string[] = []
    
    function unlock(id: string) {
        if (!unlockedIds.includes(id) && !newlyUnlocked.includes(id)) {
            newlyUnlocked.push(id)
        }
    }

    const { company, founder } = state
    if (!company || !founder) return []

    // 1. 第一桶金 (INITIAL_PROFIT)
    const weeklyRev = company.mrr / 4
    if (weeklyRev > company.burnRate && company.cash > 0) unlock('INITIAL_PROFIT')

    // 2. 收支平衡 (BREAK_EVEN)
    if (company.stage === 'PMF' && company.cash > 100000 && company.weekNumber > 10) unlock('BREAK_EVEN')

    // 3. 十角兽 (TEN_HORN)
    if (company.valuation >= 10000000000) unlock('TEN_HORN')

    // 4. 敲钟人 (IPO_BELL)
    if (company.stage === 'IPO' || company.stage === 'TITAN') unlock('IPO_BELL')

    // 5. 行业巨头 (TITAN_MIND)
    if (company.stage === 'TITAN') unlock('TITAN_MIND')

    // 6. 现金奶牛 (CASH_COW)
    if (company.cash >= 1000000) unlock('CASH_COW')

    // 7. AI 原住民 (AI_NATIVE)
    const isAiNative = company.staff.length > 0 && company.staff.every(s => s.role === 'TEC' && s.talent >= 80)
    const isScaleOrAbove = ['SCALE', 'IPO', 'TITAN'].includes(company.stage)
    if (isScaleOrAbove && isAiNative) unlock('AI_NATIVE')

    // 8. 纯粹人类 (PURE_HUMAN)
    if (company.valuation > 100000000 && company.staff.every(s => s.talent < 80)) unlock('PURE_HUMAN')

    // 9. 效率之神 (EFFICIENCY_GOD)
    const vpb = (company.valuation + founder.wealth) / Math.max(1, founder.bwStress)
    if (vpb >= 5000) unlock('EFFICIENCY_GOD')

    // 10. 向死而生 (NEAR_DEATH)
    if (company.cashCriticalStreak >= 4 && company.cash > 0) unlock('NEAR_DEATH')

    // 11. 抗压传说 (SURVIVOR)
    if (founder.bwStressStreak >= 10) unlock('SURVIVOR')

    // 12. 反脆弱 (ANTI_FRAGILE)
    if (company.isPostBadDecision && company.stage === 'PMF') unlock('ANTI_FRAGILE')

    // 13. 断舍离 (PIVOT_MASTER)
    if (company.techDebt > 80 && company.stage === 'PMF') unlock('PIVOT_MASTER')

    // 14. 代码会说话 (CODE_TALKER)
    if (company.techDebt >= 90 && company.weekNumber > 20) unlock('CODE_TALKER')

    // 15. 实验室之友 (LAB_FRIEND)
    if (company.ideaScore && company.ideaScore.total >= 80) unlock('LAB_FRIEND')

    return newlyUnlocked
}
