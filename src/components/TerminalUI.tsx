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
${C.cyan}${C.bold}LEMEONE_LAB v2.0 CLI${C.reset} ${C.gray}— Gravity Sandbox OS${C.reset}

${C.bold}FEEDING & INITIALIZATION${C.reset}
  ${C.green}scan "<seed>"${C.reset}   - Initialize from text or drop a BP/PRD file.
  ${C.green}upgrade <tier>${C.reset}   - Upgrade license (FREE, PRO, ULTRA, ENTERPRISE).

${C.bold}SIMULATION${C.reset}
  ${C.green}dev${C.reset}            - Advance to next Market Epoch (T+1, T+2), triggers 10,000-agent collision.
  ${C.green}reset${C.reset}          - Wipe current simulation state.

${C.bold}VECTOR TUNING${C.reset}
  ${C.green}set <dim> <val>${C.reset}   - Adjust 13D dimensions (perf, depth, interact, stable...).
  ${C.green}set-price <val>${C.reset}   - Adjust Dimension 5 (Friction/Price). Alias for 'set friction <val>'.
  ${C.green}feature "<desc>"${C.reset} - Map a natural language feature to vector space.
  ${C.green}team <size>${C.reset}      - Set resource constraint (SOLO, STARTUP, ENTERPRISE).
  ${C.green}pivot${C.reset}            - Auto-adjust strategy vectors based on the latest AI audit report.

${C.bold}DIAGNOSTICS${C.reset}
  ${C.green}stat${C.reset}             - Display precise 13D product vector & metrics.
  ${C.green}audit${C.reset}            - Trigger Deep AI Audit & Asset refresh.

Input ${C.green}help${C.reset} / ${C.green}clear${C.reset} / ${C.green}exit${C.reset} to control terminal.
`

export default function TerminalUI() {
    const termRef = useRef<HTMLDivElement>(null)
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
            // showPrompt() is triggered by component later if needed, but we can do it here manually for store-driven output
            xtermRef.current.write('\r\n> ')
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
        xtermRef.current?.write('\r\n> ')
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
            case 'upgrade':
                const newTier = args[0]?.toUpperCase() as any
                if (['FREE', 'PRO', 'ULTRA', 'ENTERPRISE'].includes(newTier)) {
                    upgradeTier(newTier)
                } else {
                    print(`${C.red}[ERR] Invalid tier. Available: FREE, PRO, ULTRA, ENTERPRISE${C.reset}`)
                }
                break
            case 'dev':
            case 'run':
                print(`${C.green}[COLLISION] 执行下一周期 (Epoch) 10,000 并行压力测试...${C.reset}`)
                await step()
                break
            case 'set-price':
                if (args[0] && !isNaN(parseFloat(args[0]))) {
                    updateVector('FRICTION', parseFloat(args[0]))
                } else {
                    print(`${C.red}[ERR] Usage: set-price <val>${C.reset}`)
                }
                break
            case 'pivot':
                print(`${C.yellow}[PIVOT] Generating aggressive product vector changes based on recent audit...${C.reset}`)
                // Simple alias: just adds a macro feature to shift dimensions based on the backlog.
                const sTemp = useLemeoneStore.getState().sandboxState
                if (sTemp && sTemp.assets.backlog) {
                    await addFeature(`Pivot execution based on: ${sTemp.assets.backlog}`)
                } else {
                    print(`${C.red}[ERR] Missing audit context. Run 'audit' first.${C.reset}`)
                }
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
                if (['SOLO', 'STARTUP', 'ENTERPRISE'].includes(size)) {
                    setTeamSize(size)
                } else {
                    print(`${C.red}[ERR] Invalid team size. Available: SOLO, STARTUP, ENTERPRISE${C.reset}`)
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
                    print(`\n${C.cyan}╔═ PRODUCT VECTOR (13D) ══════════════════╗${C.reset}`)
                    print(`${C.cyan}║${C.reset}  RESOLUTION: ${C.bold}${s.tier}${C.reset} (${s.agents.length.toLocaleString()} Agents) - EPOCH: ${C.bold}T+${s.epoch}${C.reset}`)
                    print(`${C.cyan}║${C.reset}  D1-D4 [CORE]: P:${s.productVector[0].toFixed(3)} D:${s.productVector[1].toFixed(3)} I:${s.productVector[2].toFixed(3)} S:${s.productVector[3].toFixed(3)}`)
                    print(`${C.cyan}║${C.reset}  D5-D8 [MKT]:  F:${s.productVector[4].toFixed(3)} U:${s.productVector[5].toFixed(3)} S:${s.productVector[6].toFixed(3)} C:${s.productVector[7].toFixed(3)}`)
                    print(`${C.cyan}║${C.reset}  D9-D12[STR]:  E:${s.productVector[8].toFixed(3)} B:${s.productVector[9].toFixed(3)} G:${s.productVector[10].toFixed(3)} C:${s.productVector[11].toFixed(3)}`)
                    print(`${C.cyan}║${C.reset}  D13   [GTM]:  AWARENESS:${s.productVector[12].toFixed(3)}`)
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

        term.writeln(`${C.cyan}${C.bold}[LAB_INIT] 实验室环境初始化完成...${C.reset}`)
        term.writeln(`${C.gray}当前现实同步： ${C.magenta}已挂载 $Gemini-2.5-Flash$ 新闻实时映射引擎。${C.reset}`)
        term.writeln(`${C.gray}内核版本： ${C.green}DRTA 2.0 (Gravity Engine)。${C.reset}`)
        term.writeln(`${C.cyan}请输入你的商业蓝图或拖入 PRD 文档。${C.reset}`)
        term.writeln(`${C.yellow}提示：描述越模糊，σ (不确定性) 越高，模拟中的现金流崩塌风险越大。${C.reset}`)
        term.write('\r\n> ')

        term.onData(e => {
            const buf = inputBufRef.current
            if (e === '\r') {
                term.write('\r\n')
                const cmd = buf
                inputBufRef.current = ''
                if (cmd.trim()) {
                    const last = historyRef.current[historyRef.current.length - 1]
                    if (cmd.trim() !== last) historyRef.current.push(cmd.trim())
                }
                historyIndexRef.current = -1
                handleCommand(cmd)
            } else if (e === '\x7F') { 
                if (buf.length > 0) {
                    inputBufRef.current = buf.slice(0, -1)
                    term.write('\b \b')
                }
            } else if (e === '\x1b[A') { // Arrow Up
                if (historyRef.current.length > 0) {
                    if (historyIndexRef.current === -1) {
                        currentInputRef.current = buf
                    }
                    if (historyIndexRef.current < historyRef.current.length - 1) {
                        historyIndexRef.current++
                        const histCmd = historyRef.current[historyRef.current.length - 1 - historyIndexRef.current]
                        inputBufRef.current = histCmd
                        term.write('\r> \x1b[K' + histCmd)
                    }
                }
            } else if (e === '\x1b[B') { // Arrow Down
                if (historyIndexRef.current > -1) {
                    historyIndexRef.current--
                    if (historyIndexRef.current === -1) {
                        inputBufRef.current = currentInputRef.current
                    } else {
                        const histCmd = historyRef.current[historyRef.current.length - 1 - historyIndexRef.current]
                        inputBufRef.current = histCmd
                    }
                    term.write('\r> \x1b[K' + inputBufRef.current)
                }
            } else if (e >= ' ') {
                inputBufRef.current += e
                term.write(e)
            }
        })

        const handleResize = () => fitAddon.fit()
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            term.dispose()
            xtermRef.current = null
        }
    }, [handleCommand])

    return (
        <div 
            className={`w-full h-full bg-black p-2 transition-all duration-300 ${isDragging ? 'ring-2 ring-cyan-500 bg-gray-900 opacity-80' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
        >
            <div ref={termRef} className="w-full h-full" />
        </div>
    )
}
