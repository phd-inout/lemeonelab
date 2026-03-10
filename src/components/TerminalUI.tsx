"use client";

import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useLemeoneStore } from '@/lib/store';
import { IndustryType, BusinessModel, FounderBackground, DIM, CompanyStage } from '@/lib/engine/types';
import { generateGapAnalysis } from '@/lib/engine/cortex-ai';

// ANSI 颜色工具
const C = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
}

// 打字机效果
function typewrite(term: Terminal, text: string, speed = 8): Promise<void> {
    return new Promise(resolve => {
        let i = 0
        const interval = setInterval(() => {
            if (i < text.length) {
                term.write(text.charAt(i))
                i++
            } else {
                clearInterval(interval)
                resolve()
            }
        }, speed)
    })
}

function writeln(term: Terminal, text: string) {
    term.write('\r\n' + text)
}

// 指令解析函数
function parseArgs(input: string): { cmd: string; args: Record<string, string>; raw: string } {
    const parts = input.trim().split(/\s+/)
    const cmd = parts[0]?.toLowerCase() ?? ''
    const args: Record<string, string> = {}
    let i = 1
    // 解析 --key value 风格的参数
    while (i < parts.length) {
        if (parts[i].startsWith('--')) {
            const key = parts[i].slice(2)
            const val = parts[i + 1] && !parts[i + 1].startsWith('--') ? parts[i + 1] : 'true'
            args[key] = val
            i += val !== 'true' ? 2 : 1
        } else {
            i++
        }
    }
    return { cmd, args, raw: input.trim() }
}

const HELP_TEXT = `
${C.cyan}${C.bold}CORTEX-ZERO CLI${C.reset} ${C.gray}— lemeone-lab Pre-alpha${C.reset}

${C.bold}指令列表${C.reset}
  ${C.green}init-founder${C.reset} ${C.gray}[--background <type>] [--age <num>] [--name <str>] [--vector <M,T,L,F,O,C>]${C.reset}
    初始化创始人。background: fresh-grad | corporate-refugee | serial-pro | industry-veteran | plain-starter
    (可选项: --vector 直接设置 6 维初始点数，如 80,40,60,50,90,70)

  ${C.green}init-company${C.reset} ${C.gray}[--industry <type>] [--model <type>]${C.reset}
    初始化公司并进行 AI Idea Calibration。
    industry: AI_SAAS | DTC_ECOM | WEB3_GAMING | BIOTECH | CREATOR_ECONOMY | B2B_ENTERPRISE

  ${C.green}sprint${C.reset} ${C.gray}[--weeks <N>] [--intensity <1.0-2.0>]${C.reset}
    推进 N 周（默认 2 周，最大 12 周）。intensity 为加班强度，高强度会加速技术债与创始人高压崩溃（Burnout）。

  ${C.green}status${C.reset}
    查看当前所有数值面板。

  ${C.green}hire${C.reset} ${C.gray}[--role <MKT|TEC|LRN|FIN|OPS|CHA>] [--talent <0-100>] [--salary <num>]${C.reset}
    雇佣员工，直接提升团队对应维度算力，但会急剧增加管理内耗指数（e^-λE）与 Burn Rate。

  ${C.green}fire${C.reset} ${C.gray}[--id <staff_id>]${C.reset}
    解雇员工，减轻内耗与烧钱负担（不带参数可列出当前员工 ID）。

  ${C.green}pivot${C.reset} ${C.gray}[--industry <type>] [--model <type>]${C.reset}
    强行转型，消耗大量资金，丢失大量进度，并大幅推高技术债。

  ${C.green}play-card${C.reset} ${C.gray}[--id <card_id>]${C.reset}
    打出拥有的行动卡牌。输入 cards 查看手中卡牌。

  ${C.green}cards${C.reset}
    查看手中拥有的全部行动卡牌。

  ${C.green}analyze-gap${C.reset}
    分析当前公司状态距离下一阶段的硬性阈值差距，并由 AI 给出深度策略诊断。

  ${C.green}dividend${C.reset} ${C.gray}[--amount <num>]${C.reset}
    公司分红。将现金提取到个人账户，追求“生存主义大师” (Lifestyle Empire) 的稳健胜利。

  ${C.green}news${C.reset} ${C.gray}[<query>]${C.reset}
    分析当前全球发生的新闻事件，并计算其对您所在行业（Market Vector）的潜在扰动。

  ${C.green}clear${C.reset}  /  ${C.green}help${C.reset}  /  ${C.green}quit${C.reset}
`

export default function TerminalUI() {
    const termRef = useRef<HTMLDivElement>(null)
    const xtermRef = useRef<Terminal | null>(null)
    const inputBufRef = useRef('')          // 用 ref 避免闭包陷阱
    const awaitingIdeaRef = useRef(false)  // 是否在等待 idea 输入
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null) // idle timer

    const { gameState, isRunning, initFounder, initCompany, sprintWeeks, hire, fire, pivot, playCard, dividend, parseNews } = useLemeoneStore()

    // ======= 自动补全词典 =======
    const COMMANDS = ['init-founder', 'init-company', 'sprint', 'status', 'hire', 'fire', 'pivot', 'play-card', 'cards', 'analyze-gap', 'dividend', 'news', 'clear', 'help', 'quit']

    // 重置 Idle Timer
    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        idleTimerRef.current = setTimeout(() => {
            const gs = useLemeoneStore.getState().gameState
            if (gs?.company && !useLemeoneStore.getState().isRunning) {
                const term = xtermRef.current
                if (term) {
                    term.write(`\r\n${C.yellow}[CORTEX-AI 絮语] 创始人，时间就是金钱（Burn Rate: ¥${gs.company.burnRate}/周）。如果你迷茫了，试试输入 analyze-gap 或 sprint。${C.reset}\r\n> ` + inputBufRef.current)
                }
            }
        }, 60000) // 60s
    }, [])

    // 输出一行到终端
    const print = useCallback((text: string) => {
        const term = xtermRef.current
        if (!term) return
        text.split('\n').forEach(line => {
            term.write('\r\n' + line)
        })
    }, [])

    // 显示 prompt
    const showPrompt = useCallback(() => {
        xtermRef.current?.write('\r\n> ')
        resetIdleTimer()
    }, [resetIdleTimer])

    // 主指令处理器
    const handleCommand = useCallback(async (input: string) => {
        const term = xtermRef.current
        if (!term) return
        resetIdleTimer()
        const { cmd, args } = parseArgs(input)

        if (!cmd) { showPrompt(); return }

        const localStore = useLemeoneStore.getState()
        const gameState = localStore.gameState
        const isRunning = localStore.isRunning

        // ── init-founder ──────────────────────────────────────────
        if (cmd === 'init-founder') {
            const bgMap: Record<string, FounderBackground> = {
                'fresh-grad': 'FRESH_GRAD',
                'corporate-refugee': 'CORPORATE_REFUGEE',
                'serial-pro': 'SERIAL_PRO',
                'industry-veteran': 'INDUSTRY_VETERAN',
                'plain-starter': 'PLAIN_STARTER',
            }
            const bg = bgMap[args.background ?? 'plain-starter'] ?? 'PLAIN_STARTER'
            const age = parseInt(args.age ?? '28', 10)
            const name = args.name ?? 'Founder'
            let customVector: [number, number, number, number, number, number] | undefined
            if (args.vector) {
                const parts = args.vector.split(',').map(n => parseInt(n.trim(), 10))
                if (parts.length === 6 && parts.every(n => !isNaN(n))) {
                    customVector = parts as [number, number, number, number, number, number]
                }
            }
            initFounder(bg, age, name, customVector)

            print(`\n${C.cyan}${C.bold}创始人已初始化${C.reset}`)
            const gs = useLemeoneStore.getState().gameState
            if (gs?.founder) {
                const { vector } = gs.founder
                print(`  背景: ${bg}  年龄: ${age}`)
                print(`  MKT: ${vector[0].toFixed(0)}  TEC: ${vector[1].toFixed(0)}  LRN: ${vector[2].toFixed(0)}`)
                print(`  FIN: ${vector[3].toFixed(0)}  OPS: ${vector[4].toFixed(0)}  CHA: ${vector[5].toFixed(0)}`)
                print(`  带宽上限: ${gs.founder.bwMax}  初始压力: ${gs.founder.bwStress}`)
            }
            print(`\n${C.gray}下一步：输入 init-company --industry AI_SAAS${C.reset}`)
            showPrompt()
            return
        }

        // ── init-company ─────────────────────────────────────────
        if (cmd === 'init-company') {
            const companyName = args.name;
            if (!companyName) {
                print(`${C.red}[ERROR] 请提供公司名称，例如: init-company --name "MyStartup"${C.reset}`)
                showPrompt()
                return
            }

            const industryMap: Record<string, IndustryType> = {
                'AI_SAAS': 'AI_SAAS', 'DTC_ECOM': 'DTC_ECOM',
                'WEB3_GAMING': 'WEB3_GAMING', 'BIOTECH': 'BIOTECH',
                'CREATOR_ECONOMY': 'CREATOR_ECONOMY', 'B2B_ENTERPRISE': 'B2B_ENTERPRISE',
            }
            const modelMap: Record<string, BusinessModel> = {
                'SUBSCRIPTION_SAAS': 'SUBSCRIPTION_SAAS', 'USAGE_BASED': 'USAGE_BASED',
                'MARKETPLACE': 'MARKETPLACE', 'ONE_TIME_LICENSE': 'ONE_TIME_LICENSE',
                'FREEMIUM': 'FREEMIUM',
            }
            const industry = industryMap[args.industry?.toUpperCase() ?? ''] ?? 'AI_SAAS'
            const model = modelMap[args.model?.toUpperCase() ?? ''] ?? 'SUBSCRIPTION_SAAS'

            print(`\n公司名称: ${companyName}  行业: ${industry}  模式: ${model}`)
            print(`${C.yellow}请描述你的产品 idea（一句话，或直接回车跳过）：${C.reset}`)

            // 进入 idea 等待状态
            awaitingIdeaRef.current = true
                ; (xtermRef.current as any)._ideaContext = { industry, model, companyName }
            term.write('\r\n💡 ')
            return
        }

        // ── sprint ────────────────────────────────────────────────
        if (cmd === 'sprint') {
            if (!gameState?.company) {
                print(`${C.red}[ERROR] 请先执行 init-company${C.reset}`)
                showPrompt()
                return
            }
            if (isRunning) {
                print(`${C.red}[ERROR] Sprint 进行中，请等待${C.reset}`)
                showPrompt()
                return
            }

            const weeks = Math.min(12, Math.max(1, parseInt(args.weeks ?? '2', 10)))
            const intensity = Math.max(0.5, Math.min(2.0, parseFloat(args.intensity ?? '1.0')))
            print(`\n${C.bold}━━━ Sprint ×${weeks} 周 (Intensity: ${intensity.toFixed(1)}) 开始 ━━━${C.reset}`)

            const pStage = useLemeoneStore.getState().gameState?.company.stage
            await sprintWeeks(weeks, intensity, (line) => print(line))
            const nStage = useLemeoneStore.getState().gameState?.company.stage

            if (pStage && nStage && pStage !== nStage) {
                print(`\n${C.green}${C.bold}>>> MILESTONE REACHED: ${nStage} <<<${C.reset}`)
                const ascii = `
      /\\
     /  \\
    /____\\    [ LEVEL_UP ]
   /      \\   STAGE UNLOCKED
  /________\\  ${nStage}
`
                print(C.cyan + ascii + C.reset)
            }

            showPrompt()
            return
        }

        // ── hire ──────────────────────────────────────────────────
        if (cmd === 'hire') {
            if (!gameState?.company) {
                print(`${C.red}[ERROR] 公司尚未成立${C.reset}`)
                showPrompt()
                return
            }
            const roleStr = (args.role ?? 'TEC').toUpperCase()
            const roleMap: Record<string, keyof typeof DIM> = { MKT: 'MKT', TEC: 'TEC', LRN: 'LRN', FIN: 'FIN', OPS: 'OPS', CHA: 'CHA' }
            const role = roleMap[roleStr] ?? 'TEC'
            const talent = parseInt(args.talent ?? '60', 10)
            const salary = parseInt(args.salary ?? '1500', 10)

            hire(role, Math.min(100, Math.max(0, talent)), salary)
            print(`\n${C.green}已签发 Offer！${C.reset}`)
            print(`  职位: ${role}  能力指数: ${talent}  周薪: ¥${salary}`)
            print(`  ${C.gray}注意：团队扩张将导致管理内耗加剧（e^(-λE)）。${C.reset}`)
            showPrompt()
            return
        }

        // ── fire ──────────────────────────────────────────────────
        if (cmd === 'fire') {
            if (!gameState?.company) {
                print(`${C.red}[ERROR] 公司尚未成立${C.reset}`)
                showPrompt()
                return
            }
            const targetId = args.id
            if (!targetId) {
                print(`\n${C.gray}当前员工列表：${C.reset}`)
                if (gameState.company.staff.length === 0) print(`  (团队仅有创始人)`)
                gameState.company.staff.forEach(s => {
                    print(`  [${s.id}] ${s.role} | 能力:${s.talent} | 周薪:¥${s.salary}`)
                })
                showPrompt()
                return
            }
            fire(targetId)
            print(`\n${C.yellow}已解除劳动合同：${targetId}${C.reset}`)
            showPrompt()
            return
        }

        // ── pivot ─────────────────────────────────────────────────
        if (cmd === 'pivot') {
            if (!gameState?.company) {
                print(`${C.red}[ERROR] 公司尚未成立${C.reset}`)
                showPrompt()
                return
            }
            const cost = gameState.company.stage === 'SEED' ? 20000 : 50000
            print(`\n${C.bold}${C.red}!!! 警告：PIVOT 将摧毁现有产品并造成大量流失 (估计损失：¥${cost.toLocaleString()}) !!!${C.reset}`)
            const industryMap: Record<string, IndustryType> = {
                'AI_SAAS': 'AI_SAAS', 'DTC_ECOM': 'DTC_ECOM',
                'WEB3_GAMING': 'WEB3_GAMING', 'BIOTECH': 'BIOTECH',
                'CREATOR_ECONOMY': 'CREATOR_ECONOMY', 'B2B_ENTERPRISE': 'B2B_ENTERPRISE',
            }
            const modelMap: Record<string, BusinessModel> = {
                'SUBSCRIPTION_SAAS': 'SUBSCRIPTION_SAAS', 'USAGE_BASED': 'USAGE_BASED',
                'MARKETPLACE': 'MARKETPLACE', 'ONE_TIME_LICENSE': 'ONE_TIME_LICENSE',
                'FREEMIUM': 'FREEMIUM',
            }
            const ind = industryMap[args.industry?.toUpperCase() ?? ''] ?? gameState.company.industry
            const mod = modelMap[args.model?.toUpperCase() ?? ''] ?? gameState.company.businessModel

            const res = pivot(ind, mod)
            if (res.success) {
                print(`${C.green}Pivot 协议已执行。公司现涉足 [${ind}]，采用 [${mod}] 模式。${C.reset}`)
            } else {
                print(`${C.red}Pivot 失败：${res.reason}${C.reset}`)
            }
            showPrompt()
            return
        }

        // ── play-card ─────────────────────────────────────────────
        if (cmd === 'play-card') {
            if (!gameState?.company) {
                print(`${C.red}[ERROR] 公司尚未成立${C.reset}`)
                showPrompt()
                return
            }
            if (!args.id) {
                print(`${C.red}[ERROR] 缺少 --id 参数，输入 cards 查看手中卡牌。${C.reset}`)
                showPrompt()
                return
            }
            const res = playCard(args.id)
            if (res.success) {
                print(`${C.green}行动卡牌已打出执行。请查看 status 面板确认变化。${C.reset}`)
            } else {
                print(`${C.red}卡牌使用失败：${res.reason}${C.reset}`)
            }
            showPrompt()
            return
        }

        // ── cards ─────────────────────────────────────────────────
        if (cmd === 'cards') {
            if (!gameState?.company) {
                print(`${C.red}[ERROR] 公司尚未成立${C.reset}`)
                showPrompt()
                return
            }
            const cList = gameState.company.actionCards
            if (cList.length === 0) {
                print(`${C.gray}目前手头没有任何灵感/卡牌。${C.reset}`)
            } else {
                print(`\n${C.cyan}拥有卡牌 (${cList.length}/5):${C.reset}`)
                cList.forEach(c => {
                    print(`  [${C.bold}${c.id}${C.reset}] ${C.green}${c.name}${C.reset} : ${c.desc}`)
                })
            }
            showPrompt()
            return
        }

        // ── analyze-gap ───────────────────────────────────────────
        if (cmd === 'analyze-gap') {
            if (!gameState?.company) {
                print(`${C.red}[ERROR] 公司尚未成立${C.reset}`)
                showPrompt()
                return
            }

            const c = gameState.company
            const f = gameState.founder
            let nextStage: CompanyStage | null = null
            let reqStr = ''
            let reqs: { name: string, current: number, target: number, unit?: string }[] = []

            switch (c.stage) {
                case 'SEED':
                    nextStage = 'MVP'
                    reqs = [{ name: '产品进度', current: c.devProgress, target: 100, unit: '%' }]
                    break
                case 'MVP':
                    nextStage = 'PMF'
                    reqs = [{ name: '月营收 (MRR)', current: c.mrr, target: 5000, unit: '¥' }]
                    break
                case 'PMF':
                    nextStage = 'SCALE'
                    reqs = [{ name: '月营收 (MRR)', current: c.mrr, target: 50000, unit: '¥' }]
                    break
                case 'SCALE':
                    nextStage = 'IPO'
                    reqs = [{ name: '月营收 (MRR)', current: c.mrr, target: 500000, unit: '¥' }]
                    break
                case 'IPO':
                    nextStage = 'TITAN'
                    reqs = [{ name: '月营收 (MRR)', current: c.mrr, target: 5000000, unit: '¥' }]
                    break
                default:
                    print(`${C.green}你已经在行业巅峰，无需再诊断晋级条件。${C.reset}`)
                    showPrompt()
                    return
            }

            print(`\n${C.cyan}╔═ 差距分析 (Gap Analysis) ════════════╗${C.reset}`)
            print(`${C.cyan}║${C.reset} 目标阶段: ${C.bold}${nextStage}${C.reset}`)
            print(`${C.cyan}║${C.reset}`)

            reqs.forEach(r => {
                const mark = r.current >= r.target ? '✅' : '❌'
                const unit = r.unit ?? ''
                print(`${C.cyan}║${C.reset} [${mark}] ${r.name}: ${Math.floor(r.current)}${unit} / ${r.target}${unit}`)
                reqStr += `- ${r.name}: 当前 ${Math.floor(r.current)}${unit}，目标 ${r.target}${unit}\n`
            })
            print(`${C.cyan}╚══════════════════════════════════════╝${C.reset}`)

            print(`\n${C.gray}[CORTEX-AI] 执行战略诊断中...${C.reset}`)

            const report = `
公司所处阶段：${c.stage}
即将冲击阶段：${nextStage}
当前资金状况：现金 ¥${c.cash.toLocaleString()} | Burn Rate ¥${c.burnRate.toLocaleString()}
当前压力状况：压力值 ${f.bwStress.toFixed(0)}/100
当前团队算力：创始人(${f.vector.map(v => v.toFixed(0)).join(',')}) + ${c.staff.length}名员工
硬性晋级指标差距：
${reqStr}
            `.trim()

            const analysis = await generateGapAnalysis(report)
            print(`\n${C.yellow}战略顾问建议：${C.reset}`)
            analysis.split('\n').forEach((l: string) => {
                // simple wrap logic
                const chunks = l.match(/.{1,60}/g) || ['']
                chunks.forEach((chunk: string) => print(`  ${chunk}`))
            })

            showPrompt()
            return
        }

        // ── news ────────────────────────────────────────────────
        if (cmd === 'news') {
            const query = input.replace(/^news\s*/, '').trim() || "今日全球科技与监管动态"
            // Set isRunning or just let parseNews handle it asynchronously
            // Actually parsing news is async and writes to terminal
            parseNews(query, print).then(() => {
                showPrompt()
            })
            return // async command
        }

        // ── dividend ──────────────────────────────────────────────
        if (cmd === 'dividend') {
            if (!gameState?.company) {
                print(`${C.red}[ERROR] 公司尚未成立${C.reset}`)
                showPrompt()
                return
            }
            const amount = parseInt(args.amount ?? '0', 10)
            if (isNaN(amount) || amount <= 0) {
                print(`${C.red}[ERROR] 请指定有效的分红金额。例如: dividend --amount 100000${C.reset}`)
                showPrompt()
                return
            }

            const res = dividend(amount)
            if (res.success) {
                print(`${C.green}✅ 分红执行成功：¥${amount.toLocaleString()} 已提取。${C.reset}`)
                print(`${C.gray}  公司剩余现金: ¥${(gameState.company.cash - amount).toLocaleString()}${C.reset}`)
            } else {
                print(`${C.red}分红失败：${res.reason}${C.reset}`)
            }
            showPrompt()
            return
        }

        // ── status ────────────────────────────────────────────────
        if (cmd === 'status') {
            const gs = useLemeoneStore.getState().gameState
            if (!gs?.company) {
                print(`${C.gray}[空] 游戏未初始化${C.reset}`)
                showPrompt()
                return
            }
            const c = gs.company
            const f = gs.founder
            const techColor = c.techDebt > 70 ? C.red : c.techDebt > 40 ? C.yellow : C.green

            print(`\n${C.bold}${C.cyan}╔═ 状态面板 ════════════════════════════╗${C.reset}`)
            print(`${C.cyan}║${C.reset}  阶段:     ${C.bold}${c.stage}${C.reset}  第 ${c.weekNumber} 周`)
            print(`${C.cyan}║${C.reset}  现金:     ${c.cash >= 0 ? C.green : C.red}¥${c.cash.toLocaleString()}${C.reset}`)
            print(`${C.cyan}║${C.reset}  应收款:   ¥${c.receivables.toLocaleString()}`)
            print(`${C.cyan}║${C.reset}  MRR:      ¥${c.mrr.toLocaleString()}/月`)
            print(`${C.cyan}║${C.reset}  产品进度: ${c.devProgress.toFixed(1)}%`)
            print(`${C.cyan}║${C.reset}  护城河:   ${c.moat.toFixed(0)}/100`)
            print(`${C.cyan}║${C.reset}  技术债:   ${techColor}${c.techDebt.toFixed(0)}/100${C.reset}`)
            print(`${C.cyan}║${C.reset}  累计分红: ${C.green}¥${(c.dividendsPaid || 0).toLocaleString()}${C.reset}`)

            if (c.stage !== 'SEED') {
                const entropy = f.vector[DIM.TEC] / Math.max(1, f.vector[DIM.OPS])
                const VpB = (c.valuation + f.wealth) / Math.max(1, f.bwStress)
                print(`${C.cyan}║${C.reset}  系统熵值: ${entropy > 3 ? C.red : C.green}${entropy.toFixed(2)}${C.reset}  运营效能 VpB: ${VpB.toFixed(0)}`)
            }

            print(`${C.cyan}╠═ 创始人状态 ══════════════════════════╣${C.reset}`)
            print(`${C.cyan}║${C.reset}  个人财富: ${C.yellow}¥${(f.wealth || 0).toLocaleString()}${C.reset}`)
            print(`${C.cyan}║${C.reset}  压力值:   ${f.bwStress > 80 ? C.red : C.green}${f.bwStress.toFixed(0)}/100${C.reset} ${f.bwStressStreak > 0 ? `(连贯高压: ${f.bwStressStreak}周)` : ''}`)
            print(`${C.cyan}║${C.reset}  MKT:${f.vector[0].toFixed(0)}  TEC:${f.vector[1].toFixed(0)}  LRN:${f.vector[2].toFixed(0)}  FIN:${f.vector[3].toFixed(0)}  OPS:${f.vector[4].toFixed(0)}  CHA:${f.vector[5].toFixed(0)}`)
            if (c.ideaScore) {
                print(`${C.cyan}╠═ Idea Calibration ════════════════════╣${C.reset}`)
                print(`${C.cyan}║${C.reset}  得分: ${c.ideaScore.total}/100  MRR 乘数: ${c.ideaScore.mrrGrowthMultiplier.toFixed(2)}x`)
            }
            print(`${C.cyan}╚═══════════════════════════════════════╝${C.reset}`)
            showPrompt()
            return
        }

        // ── 其他 ─────────────────────────────────────────────────
        if (cmd === 'help') { print(HELP_TEXT); showPrompt(); return }
        if (cmd === 'clear') { term.clear(); showPrompt(); return }
        if (cmd === 'quit' || cmd === 'exit') {
            print('\n再见，创始人。')
            return
        }

        print(`${C.red}Unknown command: ${cmd}${C.reset}  (输入 help 查看指令)`)
        showPrompt()
    }, [initFounder, showPrompt, print])

    // 处理 idea 输入（单独处理，不经过 handleCommand）
    const handleIdeaInput = useCallback(async (description: string) => {
        const term = xtermRef.current as any
        if (!term) return
        const { industry, model, companyName } = term._ideaContext ?? {}
        awaitingIdeaRef.current = false

        await initCompany(industry, model, description, companyName, (line: string) => {
            line.split('\n').forEach((l: string) => {
                xtermRef.current?.write('\r\n' + l)
            })
        })

        const gs = useLemeoneStore.getState().gameState
        if (gs?.company) {
            xtermRef.current?.write(`\r\n${C.gray}下一步：输入 sprint --weeks 4${C.reset}`)
        }
        showPrompt()
    }, [initCompany, showPrompt])

    // 初始化 Xterm
    useEffect(() => {
        if (!termRef.current || xtermRef.current) return

        const term = new Terminal({
            theme: {
                background: '#0a0f14',
                foreground: '#e2e2e2',
                cursor: '#00ff88',
                black: '#0a0f14',
                green: '#00ff88',
                cyan: '#00d4ff',
                yellow: '#ffd700',
                red: '#ff4757',
            },
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 14,
            lineHeight: 1.4,
            cursorBlink: true,
            cursorStyle: 'block',
        })

        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.open(termRef.current)
        fitAddon.fit()
        xtermRef.current = term

        const handleResize = () => fitAddon.fit()
        window.addEventListener('resize', handleResize)

        // 欢迎界面
        term.writeln(`${C.cyan}${C.bold}`)
        term.writeln('  ██████╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗')
        term.writeln('  ██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝')
        term.writeln('  ██║     ██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝ ')
        term.writeln('  ██║     ██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗ ')
        term.writeln(`  ╚██████╗╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗`)
        term.writeln(`   ╚═════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝${C.reset}`)
        term.writeln(`${C.gray}  ZERO — Startup Simulator  Pre-alpha${C.reset}`)
        term.writeln('')
        term.writeln(`  输入 ${C.green}help${C.reset} 查看指令，或直接输入 ${C.green}init-founder${C.reset} 开始`)
        term.write('\r\n> ')

        // 输入处理
        term.onData((e) => {
            resetIdleTimer()
            const isAwaiting = awaitingIdeaRef.current
            const buf = inputBufRef.current

            if (e === '\r') {  // Enter
                term.write('\r\n')
                const cmd = buf
                inputBufRef.current = ''
                if (isAwaiting) {
                    handleIdeaInput(cmd)
                } else {
                    handleCommand(cmd)
                }
                return
            }

            if (e === '\x7F') {  // Backspace
                if (buf.length > 0) {
                    inputBufRef.current = buf.slice(0, -1)
                    term.write('\b \b')
                }
                return
            }

            if (e === '\t') { // Tab completion
                if (isAwaiting) return // 不要在写 idea 时补全
                const matches = COMMANDS.filter(c => c.startsWith(buf))
                if (matches.length === 1) {
                    const completion = matches[0].slice(buf.length)
                    inputBufRef.current += completion
                    term.write(completion + ' ')
                    inputBufRef.current += ' '
                } else if (matches.length > 1) {
                    term.write('\r\n' + matches.join('  ') + '\r\n> ' + buf)
                }
                return
            }

            if (e >= ' ' || e >= '\u00a0') {  // 可打印字符
                inputBufRef.current = buf + e
                term.write(e)
            }
        })

        // 启动初始 timer
        resetIdleTimer()

        return () => {
            window.removeEventListener('resize', handleResize)
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
            term.dispose()
            xtermRef.current = null
        }
    }, [])  // 只初始化一次

    // handleCommand / handleIdeaInput 变化时更新 term 内的引用（避免 stale closure）
    useEffect(() => {
        if (!xtermRef.current) return
            ; (xtermRef.current as any)._handleCommand = handleCommand
            ; (xtermRef.current as any)._handleIdeaInput = handleIdeaInput
    }, [handleCommand, handleIdeaInput])

    return (
        <div
            ref={termRef}
            className="w-full h-full"
            style={{ background: '#0a0f14' }}
        />
    )
}
