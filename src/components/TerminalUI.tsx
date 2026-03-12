"use client";

import { useEffect, useRef, useCallback } from 'react';
import { Terminal, IDisposable } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
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
    magenta: '\x1b[35m',
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
${C.cyan}${C.bold}lemeone-lab CLI${C.reset} ${C.gray}— lemeone-lab Pre-alpha${C.reset}

${C.bold}核心指令${C.reset}
  ${C.green}user${C.reset}   - 建立创始人档案
  ${C.green}corp${C.reset}   - 注册公司实体
  ${C.green}idea${C.reset}   - 构思初始产品
  ${C.green}dev${C.reset}    - 研发与冲刺 (支持参数: --weeks N --intensity 1.0)
  ${C.green}fix${C.reset}    - 修复缓冲与技术债清理
  ${C.green}test${C.reset}   - 投放测验与调研
  ${C.green}scan${C.reset}   - 扫描分析市场缺口
  ${C.green}prod${C.reset}   - 前沿：产品线管理/转型
  ${C.green}stat${C.reset}   - 查看当前面板状态

${C.bold}组织与扩张${C.reset}
  ${C.green}hire${C.reset}   - 招募人才 (支持参数: --role MKT/TEC/FIN... --talent 60)
  ${C.green}fire${C.reset}   - 解雇人才 (支持参数: --id <staff_id>)
  ${C.green}fund${C.reset}   - 资本运作 / 融资分红 (支持参数: --amount 10000)
  ${C.green}grow${C.reset}   - PR大推与增长
  ${C.green}buy${C.reset}    - 竞品并购
  ${C.green}auto${C.reset}   - 工作流自动化

${C.bold}全球生态${C.reset}
  ${C.green}top${C.reset}    - 全球效能排行 (进入 TITAN 名人堂)
  ${C.green}grave${C.reset}  - 废墟死难者名录 
  ${C.green}legacy${C.reset} - 遗产点数查看

输入 ${C.green}help${C.reset} / ${C.green}clear${C.reset} / ${C.green}quit${C.reset} 控制主终端。
`

export default function TerminalUI() {
    const termRef = useRef<HTMLDivElement>(null)
    const xtermRef = useRef<Terminal | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)
    const inputBufRef = useRef('')          // 用 ref 避免闭包陷阱
    const interactiveRef = useRef<{ active: boolean, cmd: string, step: number, data: any }>({ active: false, cmd: '', step: 0, data: {} })
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null) // idle timer

    const { gameState, isRunning, initFounder, initCompany, sprintWeeks, hire, fire, pivot, playCard, dividend, parseNews } = useLemeoneStore()

    // ======= 自动补全词典 =======
    const COMMANDS = [
        { name: 'user', desc: '建立创始人档案' },
        { name: 'corp', desc: '注册公司实体' },
        { name: 'idea', desc: '构思初始产品' },
        { name: 'stat', desc: '查看各类看板' },
        { name: 'dev', desc: '研发与冲刺' },
        { name: 'fix', desc: '修复缓冲' },
        { name: 'scan', desc: '扫描分析市场' },
        { name: 'test', desc: '投放测验与调研' },
        { name: 'prod', desc: '多产品线管理/转型' },
        { name: 'fund', desc: '资本运作' },
        { name: 'hire', desc: '招募人才/雇佣AI' },
        { name: 'auto', desc: '工作流自动化' },
        { name: 'grow', desc: 'PR大推与增长' },
        { name: 'buy', desc: '竞品并购' },
        { name: 'rule', desc: '制定行业规则' },
        { name: 'play', desc: '使用行动卡牌' },
        { name: 'cards', desc: '查看持有卡牌' },
        { name: 'news', desc: '全球新闻广播' },
        { name: 'legacy', desc: '遗产点数查看' },
        { name: 'top', desc: '全球效能排行' },
        { name: 'grave', desc: '废墟死难者名录' },
        { name: 'help', desc: '系统指令说明' },
        { name: 'clear', desc: '清理终端屏幕' },
    ]
    // 重置 Idle Timer
    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        idleTimerRef.current = setTimeout(() => {
            const gs = useLemeoneStore.getState().gameState
            if (gs?.company && !useLemeoneStore.getState().isRunning) {
                const term = xtermRef.current
                if (term) {
                    term.write(`\r\n${C.yellow}[lemeone_lab 絮语] 创始人，时间就是金钱（Burn Rate: ¥${gs.company.burnRate}/周）。如果你迷茫了，试试输入 scan 或 dev。${C.reset}\r\n> ` + inputBufRef.current)
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
        const t = xtermRef.current
        if (!t) return
        t.write('\r\n> ')
        t.scrollToBottom()
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

        // ── CommandGate 权限拦截 ─────────────────────────────────────
        const TIER_LEVELS = {
            'DAY_0': 0,
            'SEED': 1,
            'MVP': 2,
            'PMF': 3,
            'SCALE': 4,
            'IPO': 5,
            'TITAN': 6
        }
        const CMD_REFS: Record<string, number> = {
            'user': 0, 'corp': 0, 'idea': 0,
            'help': 0, 'clear': 0, 'quit': 0, 'exit': 0,
            'legacy': 0, 'top': 0, 'grave': 0,

            'stat': 1, 'dev': 1, 'fix': 1,
            'play': 1, 'cards': 1, 'news': 1,

            'scan': 2, 'test': 2, 'prod': 2, 'fund': 2,

            'hire': 4, 'fire': 4, 'auto': 4, 'grow': 4,

            'buy': 6, 'rule': 6
        }

        const currentStage = gameState?.company?.stage || 'DAY_0';
        const currentTier = TIER_LEVELS[currentStage as keyof typeof TIER_LEVELS] || 0;
        const reqTier = CMD_REFS[cmd];

        if (reqTier !== undefined && currentTier < reqTier) {
            const stageNames = Object.keys(TIER_LEVELS);
            const reqStageName = stageNames.find(k => (TIER_LEVELS as any)[k] === reqTier) || 'UNKNOWN';
            print(`\n${C.red}[ACCESS_DENIED: TIER_INSUFFICIENT] 该指令需要到达 ${C.bold}${reqStageName}${C.reset}${C.red} 阶段才能解锁。${C.reset}`)
            showPrompt()
            return
        }

        // ── cancel / stop ──────────────────────────────────────────
        if (cmd === 'cancel' || cmd === 'stop') {
            if (isRunning) {
                useLemeoneStore.setState({ isRunning: false })
                print(`${C.yellow}\n[SYSTEM] 接收到中断信号，正在安全终止当前进程...${C.reset}`)
            } else {
                print(`${C.gray}没有正在进行的进程可以终止。${C.reset}`)
            }
            showPrompt()
            return
        }

        // ── user ───────────────────────────────────────────
        if (cmd === 'user') {
            if (Object.keys(args).length === 0 && !args.bg && !args.age) {
                interactiveRef.current = { active: true, cmd: 'user', step: 0, data: {} }
                print(`\n${C.cyan}╔═ 创建新一代创始人 ═════╗${C.reset}`)
                print(`${C.yellow}请输入创始人姓名 Name (默认: Founder)：${C.reset}`)
                term.write('\r\n? ')
                return
            }
            const bgMap: Record<string, FounderBackground> = {
                'fresh-grad': 'FRESH_GRAD',
                'corporate-refugee': 'CORPORATE_REFUGEE',
                'serial-pro': 'SERIAL_PRO',
                'industry-veteran': 'INDUSTRY_VETERAN',
                'plain-starter': 'PLAIN_STARTER',
            }
            const bg = bgMap[(args.background || args.bg) ?? 'plain-starter'] ?? 'PLAIN_STARTER'
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
            print(`\n${C.gray}下一步：输入 corp 注册公司实体（直接输入 corp 可进入交互创建）${C.reset}`)
            showPrompt()
            return
        }

        // ── corp ────────────────────────────────────────
        if (cmd === 'corp') {
            if (Object.keys(args).length === 0 && !args.name) {
                interactiveRef.current = { active: true, cmd: 'corp', step: 0, data: {} }
                print(`\n${C.cyan}╔═ 注册公司实体 ═════════╗${C.reset}`)
                print(`${C.yellow}请输入公司名称 Name：${C.reset}`)
                term.write('\r\n? ')
                return
            }
            const companyName = args.name;
            if (!companyName) {
                print(`${C.red}[ERROR] 请提供公司名称，例如: corp --name "MyStartup"${C.reset}`)
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
            const idea = args.idea || '通用版'

            print(`\n${C.cyan}公司: ${companyName}  行业: ${industry}  商业模式: ${model}${C.reset}`)
            print(`${C.gray}正在执行 Cortex Idea Calibration...${C.reset}`)

            // Execute initCompany immediately with idea arg
            useLemeoneStore.getState().initCompany(industry, model, idea, companyName, (line: string) => {
                line.split('\n').forEach((l: string) => print(l))
            }).then(() => {
                const gs = useLemeoneStore.getState().gameState
                if (gs?.company) {
                    print(`\n${C.gray}下一步：输入 dev 开始研发冲刺（尝试直接输入 dev）${C.reset}`)
                }
                showPrompt()
            }).catch(e => {
                print(`${C.red}[ERROR] 公司创立失败: ${e}${C.reset}`)
                showPrompt()
            })
            return
        }        // ── dev ────────────────────────────────────────────────
        if (cmd === 'dev') {
            if (!gameState?.company) {
                print(`${C.red}[ERROR] 请先执行 corp 注册公司实体${C.reset}`)
                showPrompt()
                return
            }
            if (isRunning) {
                print(`${C.red}[ERROR] 冲刺进行中，请等待${C.reset}`)
                showPrompt()
                return
            }
            if (Object.keys(args).length === 0 && !args.weeks && !args.intensity) {
                interactiveRef.current = { active: true, cmd: 'dev', step: 0, data: {} }
                print(`\n${C.yellow}预计冲刺几周 [1-12，默认2周]：${C.reset}`)
                term.write('\r\n? ')
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

        // ── prod ─────────────────────────────────────────────────
        if (cmd === 'prod') {
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

        // ── play ─────────────────────────────────────────────
        if (cmd === 'play') {
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

        // ── scan ───────────────────────────────────────────
        if (cmd === 'scan') {
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

        // ── fund ──────────────────────────────────────────────
        if (cmd === 'fund') {
            if (!gameState?.company) {
                print(`${C.red}[ERROR] 公司尚未成立${C.reset}`)
                showPrompt()
                return
            }
            const amount = parseInt(args.amount ?? '0', 10)
            if (isNaN(amount) || amount <= 0) {
                print(`${C.red}[ERROR] 请指定有效的分红金额。例如: fund --amount 100000${C.reset}`)
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

        // ── stat ────────────────────────────────────────────────
        if (cmd === 'stat') {
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

        // ── legacy ──────────────────────────────────────────────
        if (cmd === 'legacy') {
            const store = useLemeoneStore.getState()
            print(`\n${C.cyan}╔═ LAB POINTS & LEGACIES ══════════════╗${C.reset}`)
            print(`${C.cyan}║${C.reset}  当前可用点数: ${C.magenta}${store.labPoints} pts${C.reset}`)
            print(`${C.cyan}║${C.reset}  已记录先驱数量: ${store.legacyRecords?.length || 0} 人`)
            if (store.legacyRecords && store.legacyRecords.length > 0) {
                print(`${C.cyan}╠═ GRAVEYARD 墓碑录 ═══════════════════╣${C.reset}`)
                store.legacyRecords.slice(-5).forEach(r => {
                    const finalMsg = `${C.gray}最终阶段: ${r.finalStage} (${r.weeksAlive}周) — 原因: ${r.reason} -> 遗留 ${C.green}${r.legacyPoints} pts${C.reset}`
                    print(`${C.cyan}║${C.reset}  [${C.bold}${r.founderName}${C.reset}] ${finalMsg}`)
                })
            }
            print(`${C.cyan}╚══════════════════════════════════════╝${C.reset}`)
            showPrompt()
            return
        }

        // ── top ───────────────────────────────────────────
        if (cmd === 'top') {
            print(`\n${C.cyan}╔═ 名人堂 (The Efficiency Peak) ═══════╗${C.reset}`)
            print(`${C.gray}正在连接 CORTEX 节点拉取全球排行...${C.reset}`)
            fetch('/api/leaderboard').then(res => res.json()).then(data => {
                if (data.success && data.data) {
                    data.data.forEach((r: any, idx: number) => {
                        const rankMsg = `#${idx + 1} [${r.founderName}] ${r.stage} | VpB: ${r.efficiencyScore.toFixed(2)}`
                        print(`${C.cyan}║${C.reset}  ${rankMsg}`)
                    })
                    print(`${C.cyan}╚══════════════════════════════════════╝${C.reset}`)
                } else {
                    print(`${C.red}拉取排行榜失败: ${data.error || 'Unknown Error'}${C.reset}`)
                    print(`${C.cyan}╚══════════════════════════════════════╝${C.reset}`)
                }
                showPrompt()
            }).catch(e => {
                print(`${C.red}网络连接错误: ${String(e)}${C.reset}`)
                showPrompt()
            })
            return // wait for async response to show prompt
        }

        // ── grave ────────────────────────────────────────────
        if (cmd === 'grave') {
            if (args.id) {
                print(`\n${C.gray}正在连接尸检终端拉取 #${args.id} 的记录...${C.reset}`)
                fetch(`/api/graveyard/autopsy?id=${args.id}`).then(res => res.json()).then(data => {
                    if (data.success && data.data && data.data.report) {
                        print(`${C.cyan}╔═ 深度尸检诊断 (AI Autopsy) ══════════╗${C.reset}`)
                        data.data.report.split('\n').forEach((line: string) => {
                            print(`${C.magenta}║${C.reset}  ${line}`)
                        })
                        print(`${C.cyan}╚══════════════════════════════════════╝${C.reset}`)
                    } else {
                        print(`${C.red}无法生成尸检报告: ${data.error || 'Unknown Error'}${C.reset}`)
                    }
                    showPrompt()
                }).catch(e => {
                    print(`${C.red}网络连接错误: ${String(e)}${C.reset}`)
                    showPrompt()
                })
            } else {
                print(`\n${C.cyan}╔═ 死难者名录 (The Graveyard) ═════════╗${C.reset}`)
                print(`${C.gray}正在同步最新阵亡的创始人清单...${C.reset}`)
                fetch('/api/graveyard').then(res => res.json()).then(data => {
                    if (data.success && data.data && data.data.length > 0) {
                        data.data.slice(0, 15).forEach((r: any) => {
                            const shortId = r.id.split('-')[0]
                            const msg = `[${shortId}] ${r.founderName} 卒于 ${r.stage} (${r.daysSurvived}天) - ${r.failedReason}`
                            print(`${C.cyan}║${C.reset}  ${msg}`)
                        })
                        print(`${C.cyan}╚══════════════════════════════════════╝${C.reset}`)
                        print(`${C.gray}Tips: 输入 graveyard --id <ID前段> 查看深度尸检报告 (施工中)${C.reset}`)
                    } else {
                        print(`${C.cyan}║${C.reset}  ${C.gray}目前尚无牺牲者记录...${C.reset}`)
                        print(`${C.cyan}╚══════════════════════════════════════╝${C.reset}`)
                    }
                    showPrompt()
                }).catch(e => {
                    print(`${C.red}网络连接错误: ${String(e)}${C.reset}`)
                    showPrompt()
                })
            }
            return
        }

        // ── 其他 ─────────────────────────────────────────────────
        if (cmd === 'help') { print(HELP_TEXT); showPrompt(); return }
        if (cmd === 'clear') { term.clear(); showPrompt(); return }
        if (cmd === 'quit' || cmd === 'exit') {
            print('\n再见，创始人。')
            return
        }

        // ── 未知指令 -> 传入 NLP 双轨解析 ──────────────────────────────
        const store = useLemeoneStore.getState()
        if (store.gameState?.company) {
            await store.nlpAction(input, print)
        } else {
            print(`${C.red}未识别指令: ${cmd}${C.reset}  (输入 help 或先完成 corp)`)
        }
        showPrompt()
    }, [initFounder, showPrompt, print])

    // 处理交互式输入表单流程
    const handleInteractiveInput = useCallback((input: string) => {
        const term = xtermRef.current
        if (!term) return
        const ctx = interactiveRef.current
        const val = input.trim()

        if (ctx.cmd === 'user') {
            if (ctx.step === 0) {
                ctx.data.name = val || 'Founder'
                ctx.step++
                print(`\n${C.yellow}选择核心背景:\n  1. 新鲜血液 (FRESH_GRAD)\n  2. 大厂难民 (CORPORATE_REFUGEE)\n  3. 连续创业者 (SERIAL_PRO)\n  4. 行业老兵 (INDUSTRY_VETERAN)\n  5. 普通人定局 (PLAIN_STARTER)\n  [1-5，默认5]：${C.reset}`)
                term.write('\r\n? ')
            } else if (ctx.step === 1) {
                const map: any = { '1': 'fresh-grad', '2': 'corporate-refugee', '3': 'serial-pro', '4': 'industry-veteran', '5': 'plain-starter' }
                ctx.data.bg = map[val] || 'plain-starter'
                ctx.step++
                print(`\n${C.yellow}请输入年龄 Age [默认 28]：${C.reset}`)
                term.write('\r\n? ')
            } else if (ctx.step === 2) {
                ctx.data.age = parseInt(val) || 28
                ctx.active = false
                handleCommand(`user --name ${ctx.data.name} --bg ${ctx.data.bg} --age ${ctx.data.age}`)
            }
        }
        else if (ctx.cmd === 'corp') {
            if (ctx.step === 0) {
                if (!val) { print(`${C.red}名称不能为空，请重新输入：${C.reset}`); term.write('\r\n? '); return }
                ctx.data.name = val
                ctx.step++
                print(`\n${C.yellow}选择行业方向:\n  1. AI SaaS\n  2. DTC E-commerce\n  3. Web3/Gaming\n  4. Biotech\n  5. Creator Economy\n  6. B2B Enterprise\n  [1-6，默认1]：${C.reset}`)
                term.write('\r\n? ')
            } else if (ctx.step === 1) {
                const map: any = { '1': 'AI_SAAS', '2': 'DTC_ECOM', '3': 'WEB3_GAMING', '4': 'BIOTECH', '5': 'CREATOR_ECONOMY', '6': 'B2B_ENTERPRISE' }
                ctx.data.industry = map[val] || 'AI_SAAS'
                ctx.step++
                print(`\n${C.yellow}选择商业模式:\n  1. 订阅制 (SUBSCRIPTION_SAAS)\n  2. 消耗制 (USAGE_BASED)\n  3. 平台抽佣 (MARKETPLACE)\n  4. 买断制 (ONE_TIME_LICENSE)\n  5. 免费增值 (FREEMIUM)\n  [1-5，默认1]：${C.reset}`)
                term.write('\r\n? ')
            } else if (ctx.step === 2) {
                const map: any = { '1': 'SUBSCRIPTION_SAAS', '2': 'USAGE_BASED', '3': 'MARKETPLACE', '4': 'ONE_TIME_LICENSE', '5': 'FREEMIUM' }
                ctx.data.model = map[val] || 'SUBSCRIPTION_SAAS'
                ctx.step++
                print(`\n${C.yellow}请描述产品 Idea（直接影响初始护城河，或者回车使用通用版跳过）：${C.reset}`)
                term.write('\r\n💡 ')
            } else if (ctx.step === 3) {
                ctx.data.idea = val || '通用版'
                ctx.active = false
                handleCommand(`corp --name "${ctx.data.name}" --industry ${ctx.data.industry} --model ${ctx.data.model} --idea "${ctx.data.idea}"`)
            }
        }
        else if (ctx.cmd === 'dev') {
            if (ctx.step === 0) {
                ctx.data.weeks = Math.min(12, Math.max(1, parseInt(val || '2')))
                ctx.step++
                print(`\n${C.yellow}选择冲刺强度 [1.常规(强度1.0) 2.极限压榨(强度1.5) 3.修仙(强度2.0)] 默认1：${C.reset}`)
                term.write('\r\n? ')
            } else if (ctx.step === 1) {
                const intensityMap: any = { '1': 1.0, '2': 1.5, '3': 2.0 }
                ctx.data.intensity = intensityMap[val] || 1.0
                ctx.active = false
                handleCommand(`dev --weeks ${ctx.data.weeks} --intensity ${ctx.data.intensity}`)
            }
        }
        else {
            ctx.active = false; showPrompt()
        }
    }, [handleCommand, print, showPrompt])
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
            scrollback: 5000, // 足够大的回滚缓冲区
            cursorBlink: true,
            cursorStyle: 'block',
        })

        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.open(termRef.current)
        fitAddonRef.current = fitAddon
        xtermRef.current = term

        // 使用 ResizeObserver 替代原始的 window resize 监听
        const resizeObserver = new ResizeObserver(() => {
            // 确保 DOM 容器有高度以后再 fit
            if (termRef.current && termRef.current.clientHeight > 0) {
                requestAnimationFrame(() => fitAddon.fit());
            }
        });
        resizeObserver.observe(termRef.current);

        const handleResize = () => fitAddon.fit()
        window.addEventListener('resize', handleResize)

        // 欢迎界面
        term.writeln(`${C.cyan}${C.bold}`)
        term.writeln('  ██╗     ███████╗███╗   ███╗███████╗██████╗ ███╗   ██╗███████╗    ██╗      █████╗ ██████╗ ')
        term.writeln('  ██║     ██╔════╝████╗ ████║██╔════╝██╔══██╗████╗  ██║██╔════╝    ██║     ██╔══██╗██╔══██╗')
        term.writeln('  ██║     █████╗  ██╔████╔██║█████╗  ██║  ██║██╔██╗ ██║█████╗      ██║     ███████║██████╔╝')
        term.writeln('  ██║     ██╔══╝  ██║╚██╔╝██║██╔══╝  ██║  ██║██║╚██╗██║██╔══╝      ██║     ██╔══██║██╔══██╗')
        term.writeln(`  ███████╗███████╗██║ ╚═╝ ██║███████╗██████╔╝██║ ╚████║███████╗██╗ ███████╗██║  ██║██████╔╝`)
        term.writeln(`  ╚══════╝╚══════╝╚═╝     ╚═╝╚══════╝╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝ ╚══════╝╚═╝  ╚═╝╚═════╝ ${C.reset}`)
        term.writeln(`${C.gray}  LEMEONE_LAB — Startup Simulator  Pre-alpha${C.reset}`)
        term.writeln('')
        term.writeln(`  输入 ${C.green}help${C.reset} 查看指令，或直接输入 ${C.green}user${C.reset} 开始`)
        term.write('\r\n> ')

        // 输入处理
        term.onData((e) => {
            resetIdleTimer()
            const storeState = useLemeoneStore.getState()
            if (storeState.isSystemPaused) {
                storeState.setSystemPaused(false)
            }
            const isAwaiting = interactiveRef.current.active
            const buf = inputBufRef.current

            if (e === '\r') {  // Enter
                term.write('\r\n')
                const cmd = buf
                inputBufRef.current = ''
                if (isAwaiting) {
                    (xtermRef.current as any)._handleInteractive(cmd)
                } else {
                    (xtermRef.current as any)._handleCommand(cmd)
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
                if (isAwaiting) return // 不要在交互输入写表单时补全
                const matches = COMMANDS.filter(c => c.name.startsWith(buf))
                if (matches.length === 1) {
                    const completion = matches[0].name.slice(buf.length)
                    inputBufRef.current += completion
                    term.write(completion + ' ')
                    inputBufRef.current += ' '
                } else if (matches.length > 1) {
                    term.write('\r\n' + matches.map(m => `${C.green}${m.name}${C.reset} ${C.gray}(${m.desc})${C.reset}`).join('  ') + '\r\n> ' + buf)
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
            resizeObserver.disconnect()
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
            term.dispose()
            xtermRef.current = null
            if (termRef.current) {
                termRef.current.innerHTML = ''
            }
        }
    }, [])  // 只初始化一次

    // handleCommand / handleInteractive 变化时更新 term 内的引用（避免 stale closure）
    useEffect(() => {
        if (!xtermRef.current) return
            ; (xtermRef.current as any)._handleCommand = handleCommand
            ; (xtermRef.current as any)._handleInteractive = handleInteractiveInput
    }, [handleCommand, handleInteractiveInput])

    // stage 变化时（如 ASCII header 显隐），重新适配终端大小
    useEffect(() => {
        if (!fitAddonRef.current) return
        // 短暂延迟以等待 DOM 重排完成
        const t = setTimeout(() => fitAddonRef.current?.fit(), 50)
        return () => clearTimeout(t)
    }, [gameState?.company?.stage])

    const renderHeaderAscii = (stage: string) => {
        switch (stage) {
            case 'MVP':
                return `
   __  __   _  _   ___ 
  |  \\/  | | || | | _ \\
  | |\\/| | | \\/ | |  _/
  |_|  |_|  \\__/  |_|  
`.replace(/^\n/, '').replace(/\n$/, '');
            case 'PMF':
                return `
   ___   __  __   ___ 
  | _ \\ |  \\/  | | __|
  |  _/ | |\\/| | | _| 
  |_|   |_|  |_| |_|  
`.replace(/^\n/, '').replace(/\n$/, '');
            case 'SCALE':
                return `
   ___   ___    _     _      ___ 
  / __| / __|  /_\\   | |    | __|
  \\__ \\| (__  / _ \\  | |__  | _| 
  |___/ \\___|/_/ \\_\\ |____| |___|
`.replace(/^\n/, '').replace(/\n$/, '');
            case 'IPO':
                return `
   ___   ___    ___  
  |_ _| | _ \\  / _ \\ 
   | |  |  _/ | (_) |
  |___| |_|    \\___/ 
`.replace(/^\n/, '').replace(/\n$/, '');
            case 'TITAN':
                return `
   _____   ___   _____    _    _  _ 
  |_   _| |_ _| |_   _|  /_\\  | \\| |
    | |    | |    | |   / _ \\ | .  |
    |_|   |___|   |_|  /_/ \\_\\|_|\\_|
`.replace(/^\n/, '').replace(/\n$/, '');
            default:
                return null;
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#0a0f14]">
            {gameState?.company?.stage && gameState.company.stage !== 'SEED' && (
                <div className="shrink-0 p-4 border-b border-gray-800 text-cyan-500/80 font-mono text-xs whitespace-pre select-none pointer-events-none fade-in">
                    {renderHeaderAscii(gameState.company.stage)}
                </div>
            )}
            <div
                ref={termRef}
                className="w-full flex-1 overflow-hidden"
                style={{ background: '#0a0f14' }}
            />
        </div>
    )
}
