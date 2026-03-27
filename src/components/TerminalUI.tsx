"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { useLemeoneStore } from '@/lib/store';
import { DIM, TeamSize } from '@/lib/engine/types';

// ANSI Colors
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

const HELP_TEXT = `
${C.cyan}${C.bold}LEMEONE_LAB v2.0 CLI${C.reset} ${C.gray}— 重力沙盒操作系统 (Gravity Sandbox OS)${C.reset}

${C.bold}初始化${C.reset}
  ${C.green}scan "<描述>"${C.reset}   - 从文本或文件初始化商业基因扫描
  ${C.green}tier <等级>${C.reset}     - 升级分辨率 (FREE, PRO, ULTRA, ENTERPRISE)

${C.bold}模拟运行${C.reset}
  ${C.green}dev${C.reset}              - 推进至下一市场周期 (Epoch)，触发万次碰撞
  ${C.green}reset${C.reset}            - 清除当前模拟状态

${C.bold}向量调参${C.reset}
  ${C.green}set <dim> <val>${C.reset}  - 调整 14D 维度 (PERF, DEPTH, INTERACT, STABLE, ENTRY, MONETIZE...)
  ${C.green}feature "<描述>"${C.reset} - 将自然语言功能映射到向量空间
  ${C.green}team <规模>${C.reset}      - 设置资源约束 (SOLO, STARTUP, GROWTH, ENTERPRISE)

${C.bold}诊断分析${C.reset}
  ${C.green}stat${C.reset}             - 显示完整 14D 产品向量与关键指标
  ${C.green}audit${C.reset}            - 触发深度 AI 战略审计并刷新资产

输入 ${C.green}help${C.reset} / ${C.green}clear${C.reset} / ${C.green}exit${C.reset} 控制终端
`

export default function TerminalUI() {
    const termRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const xtermRef = useRef<Terminal | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)
    const inputBufRef = useRef('')
    const historyRef = useRef<string[]>([])
    const historyIndexRef = useRef(-1)
    const currentInputRef = useRef('')
    const [isDragging, setIsDragging] = useState(false)

    const { 
        initSimulation, 
        step, 
        updateVector, 
        addFeature, 
        setTeamSize,
        audit, 
        reset, 
        upgradeTier,
        terminalLines
    } = useLemeoneStore()

    const lastRenderedLineCount = useRef(0)

    useEffect(() => {
        if (!xtermRef.current) return
        if (terminalLines.length === 0) {
            lastRenderedLineCount.current = 0
            return
        }
        if (terminalLines.length > lastRenderedLineCount.current) {
            for (let i = lastRenderedLineCount.current; i < terminalLines.length; i++) {
                xtermRef.current.write('\r\n' + terminalLines[i])
            }
            lastRenderedLineCount.current = terminalLines.length
            xtermRef.current.scrollToBottom()
        }
    }, [terminalLines])

    const print = useCallback((text: string) => {
        const term = xtermRef.current
        if (!term) return
        text.split('\n').forEach(line => {
            term.write('\r\n' + line)
        })
    }, [])

    const showPrompt = useCallback(() => {
        xtermRef.current?.scrollToBottom()
    }, [])

    const handleCommand = useCallback(async (input: string) => {
        const term = xtermRef.current
        if (!term) return
        
        const raw = input.trim()
        if (!raw) { showPrompt(); return }

        const state = useLemeoneStore.getState()
        if (state.isInterviewing) {
            await state.answerInterview(raw)
            showPrompt()
            return
        }

        const parts = raw.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g)?.map(p => 
            p.startsWith('"') || p.startsWith("'") ? p.slice(1, -1) : p
        ) || []
        
        const cmd = parts[0]?.toLowerCase()
        const args = parts.slice(1)

        switch (cmd) {
            case 'help':
                print(HELP_TEXT)
                break
            case 'clear':
                term.clear()
                break
            case 'scan':
                if (args.length === 0) {
                    print(`${C.red}[ERR] Missing input. Usage: scan "..." or drop a file.${C.reset}`)
                } else {
                    const inputStr = args.join(' ')
                    print(`${C.cyan}[PARSING] 正在解析商业基因向量...${C.reset}`)
                    await initSimulation(inputStr)
                }
                break
            case 'tier':
                const newTier = args[0]?.toUpperCase() as any
                if (['FREE', 'PRO', 'ULTRA', 'ENTERPRISE'].includes(newTier)) {
                    upgradeTier(newTier)
                } else {
                    print(`${C.red}[ERR] Invalid tier. Available: FREE, PRO, ULTRA, ENTERPRISE${C.reset}`)
                }
                break
            case 'dev':
                const agentCount = useLemeoneStore.getState().sandboxState?.agents.length || 100
                print(`${C.green}[COLLISION] 执行下一周期 (Epoch) ${agentCount.toLocaleString()} 并行压力测试...${C.reset}`)
                await step()
                break
            case 'set':
                const dim = args[0]?.toUpperCase() as keyof typeof DIM
                const val = parseFloat(args[1])
                if (DIM[dim] !== undefined && !isNaN(val)) {
                    updateVector(dim, val)
                } else {
                    print(`${C.red}[ERR] Invalid dimension. Available: PERF, DEPTH, INTERACT, STABLE...${C.reset}`)
                }
                break
            case 'feature':
                if (!args[0]) {
                    print(`${C.red}[ERR] Missing feature description.${C.reset}`)
                } else {
                    await addFeature(args[0])
                }
                break
            case 'team':
                const size = args[0]?.toUpperCase() as TeamSize
                if (['SOLO', 'STARTUP', 'GROWTH', 'ENTERPRISE'].includes(size)) {
                    setTeamSize(size)
                } else {
                    print(`${C.red}[ERR] 无效的团队规模。可选: SOLO, STARTUP, GROWTH, ENTERPRISE${C.reset}`)
                }
                break
            case 'audit':
                print(`${C.magenta}[ALIGNMENT] 启动战略一致性复盘...${C.reset}`)
                await audit()
                break
case 'stat':
                const s = useLemeoneStore.getState().sandboxState
                if (!s) {
                    print(`${C.gray}Simulation not initialized.${C.reset}`)
                } else {
                    print(`\n${C.cyan}╔═ PRODUCT VECTOR (14D) ══════════════════╗${C.reset}`)
                    print(`${C.cyan}║${C.reset}  RESOLUTION: ${C.bold}${s.tier}${C.reset} (${s.agents.length.toLocaleString()} Agents) - EPOCH: ${C.bold}T+${s.epoch}${C.reset}`)
                    print(`${C.cyan}║${C.reset}  D1-D4 [CORE]: P:${s.productVector[0].toFixed(3)} D:${s.productVector[1].toFixed(3)} I:${s.productVector[2].toFixed(3)} S:${s.productVector[3].toFixed(3)}`)
                    print(`${C.cyan}║${C.reset}  D5-D6 [GATE]: ENTRY:${s.productVector[4].toFixed(3)} MONETIZE:${s.productVector[5].toFixed(3)}`)
                    print(`${C.cyan}║${C.reset}  D7-D9 [MKT]:  U:${s.productVector[6].toFixed(3)} S:${s.productVector[7].toFixed(3)} C:${s.productVector[8].toFixed(3)}`)
                    print(`${C.cyan}║${C.reset}  D10-D13[STR]: E:${s.productVector[9].toFixed(3)} B:${s.productVector[10].toFixed(3)} G:${s.productVector[11].toFixed(3)} C:${s.productVector[12].toFixed(3)}`)
                    print(`${C.cyan}║${C.reset}  D14   [GTM]:  AWARENESS:${s.productVector[13].toFixed(3)}`)
                    print(`${C.cyan}╚═════════════════════════════════════════╝${C.reset}`)
                    print(`${C.yellow}TEAM_SIZE: ${s.teamSize}  SURVIVAL_RATE: ${(s.metrics.survivalRate*100).toFixed(1)}%  EARNING_POTENTIAL: ${s.metrics.earningPotential}${C.reset}`)
                }
                break
            case 'reset':
                reset()
                term.clear()
                print(`${C.yellow}Simulation reset. Memory wiped.${C.reset}`)
                break
            case 'exit':
                print(`${C.gray}Connection closed.${C.reset}`)
                break
            default:
                print(`${C.red}Unknown command: ${cmd}${C.reset}`)
        }

        showPrompt()
    }, [initSimulation, step, updateVector, addFeature, setTeamSize, audit, reset, upgradeTier, showPrompt, print])

    const handleFileDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (!file) return

        const validExts = ['.md', '.txt', '.json']
        if (!validExts.some(ext => file.name.endsWith(ext))) {
            print(`${C.red}[ERR] Unsupported file. Please use .md, .txt or .json${C.reset}`)
            showPrompt()
            return
        }

        print(`${C.cyan}[FEEDING] 成功接收文件: ${file.name}${C.reset}`)
        const text = await file.text()
        print(`${C.cyan}[PARSING] 正在执行深度文档扫描 (Size: ${text.length} chars)...${C.reset}`)
        
        // Prevent recursive quotes in command
        const cleanText = text.replace(/"/g, "'")
        await handleCommand(`scan "${cleanText}"`)
    }, [handleCommand, print, showPrompt])

    // Initialize Terminal
    useEffect(() => {
        if (!termRef.current || xtermRef.current) return

        const term = new Terminal({
            theme: {
                background: '#00000000',
                foreground: '#e2e2e2',
                cursor: '#00f2ff',
                green: '#00ff88',
                cyan: '#00f2ff',
                yellow: '#ffd700',
            },
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 13,
            cursorBlink: true,
        })

        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.open(termRef.current)
        setTimeout(() => fitAddon.fit(), 100)
        xtermRef.current = term
        
        term.writeln(`\r\n${C.cyan}${C.bold}  ██╗     ███████╗███╗   ███╗███████╗ ██████╗ ███╗   ██╗███████╗${C.reset}`)
        term.writeln(`${C.cyan}${C.bold}  ██║     ██╔════╝████╗ ████║██╔════╝██╔═══██╗████╗  ██║██╔════╝${C.reset}`)
        term.writeln(`${C.cyan}${C.bold}  ██║     █████╗  ██╔████╔██║█████╗  ██║   ██║██╔██╗ ██║█████╗${C.reset}`)
        term.writeln(`${C.cyan}${C.bold}  ██║     ██╔══╝  ██║╚██╔╝██║██╔══╝  ██║   ██║██║╚██╗██║██╔══╝${C.reset}`)
        term.writeln(`${C.cyan}${C.bold}  ███████╗███████╗██║ ╚═╝ ██║███████╗╚██████╔╝██║ ╚████║███████╗${C.reset}`)
        term.writeln(`${C.cyan}${C.bold}  ╚══════╝╚══════╝╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝${C.reset}`)
        term.writeln(`${C.gray}  v2.0 Gravity Sandbox — 14D 商业模拟引擎${C.reset}`)
        term.writeln(`${C.gray}  ─────────────────────────────────────────────────${C.reset}`)
        term.writeln(`${C.yellow}  提示：描述越模糊，σ (不确定性) 越高，模拟中的现金流崩塌风险越大。${C.reset}`)
        term.writeln(`${C.gray}  输入 ${C.green}scan "你的项目描述"${C.gray} 开始扫描 | ${C.green}help${C.gray} 查看全部命令${C.reset}\r\n`)

        // Native terminal input has been migrated to the external HTML input bar below for better UX

        const handleResize = () => fitAddon.fit()
        window.addEventListener('resize', handleResize)

        let observer: ResizeObserver | null = null;
        if (termRef.current) {
            observer = new ResizeObserver(() => {
                fitAddon.fit()
            });
            observer.observe(termRef.current);
        }

        return () => {
            if (observer) observer.disconnect();
            window.removeEventListener('resize', handleResize)
            term.dispose()
            xtermRef.current = null
        }
    }, [handleCommand])

    return (
        <div 
            className={`w-full h-full bg-[#0a0a0c] flex flex-col transition-all duration-300 ${isDragging ? 'ring-2 ring-cyan-500 bg-gray-900 opacity-80' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => inputRef.current?.focus()}
        >
            {/* Upper: Standard Output Log */}
            <div className="flex-1 overflow-hidden pl-6 pr-1 pt-6 pb-2 cursor-text">
                <div ref={termRef} className="w-full h-full" />
            </div>

            {/* Lower: Visual Input Bar */}
            <div className="h-14 bg-black border-t border-gray-800/60 flex items-center px-6 shrink-0 font-mono text-sm relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10">
                <span className="text-cyan-500 mr-3 font-bold">{'>'}</span>
                <input 
                    ref={inputRef}
                    className="flex-1 bg-transparent text-gray-200 focus:outline-none placeholder-gray-600/50"
                    placeholder="Type your command or drop a PRD file here..."
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const cmd = e.currentTarget.value
                            e.currentTarget.value = ''
                            if (cmd.trim()) {
                                const last = historyRef.current[historyRef.current.length - 1]
                                if (cmd.trim() !== last) historyRef.current.push(cmd.trim())
                                xtermRef.current?.writeln(`\r\n> ${cmd}`)
                                historyIndexRef.current = -1
                                handleCommand(cmd)
                            }
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            if (historyRef.current.length > 0) {
                                if (historyIndexRef.current === -1) {
                                    currentInputRef.current = e.currentTarget.value
                                }
                                if (historyIndexRef.current < historyRef.current.length - 1) {
                                    historyIndexRef.current++
                                    e.currentTarget.value = historyRef.current[historyRef.current.length - 1 - historyIndexRef.current]
                                }
                            }
                        } else if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            if (historyIndexRef.current > -1) {
                                historyIndexRef.current--
                                if (historyIndexRef.current === -1) {
                                    e.currentTarget.value = currentInputRef.current
                                } else {
                                    e.currentTarget.value = historyRef.current[historyRef.current.length - 1 - historyIndexRef.current]
                                }
                            }
                        }
                    }}
                />
                <div className="text-[10px] text-gray-600 tracking-wider hidden sm:block">~/lemeone-lab (main*)</div>
            </div>
        </div>
    )
}
