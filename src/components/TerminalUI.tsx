"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { useLemeoneStore } from '@/lib/store';
import { DIM, TeamSize } from '@/lib/engine/types';
import { 
    Terminal as TerminalIcon, 
    Globe, 
    Activity
} from 'lucide-react';

// ANSI Colors for logic printing (internal)
const C = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
}

const getHelpText = (lang: 'en' | 'zh') => `
${C.cyan}${C.bold}LEMEONE_LAB v2.0 CLI${C.reset} ${C.gray}— Gravity Sandbox OS${C.reset}

${C.bold}Project Management${C.reset}
  ${C.green}project new "<name>"${C.reset} - Create a new project/company file
  ${C.green}project list${C.reset}         - List existing historical projects
  ${C.green}project load <ID>${C.reset}    - Switch to a specific project

${C.bold}Initialization${C.reset}
  ${C.green}scan "<desc>"${C.reset}   - Init business DNA scan from text/file
  ${C.green}tier <level>${C.reset}     - Upgrade resolution (FREE, PRO, ULTRA, ENTERPRISE)

${C.bold}Simulation Run${C.reset}
  ${C.green}dev [month|num]${C.reset}    - Advance market cycle (default 1 month/4 Epochs)
  ${C.green}reset${C.reset}            - Clear current simulation state

${C.bold}Vector Tuning${C.reset}
  ${C.green}set <dim> <val>${C.reset}  - Adjust 14D dimensions
  ${C.green}feature "<desc>"${C.reset} - Map natural language feature
  ${C.green}team <size>${C.reset}      - Set resource constraints
  ${C.green}price <amount>${C.reset}   - Set ARPU (-y to confirm)

${C.bold}Diagnostics${C.reset}
  ${C.green}stat${C.reset}             - Display full 14D product vector
  ${C.green}audit${C.reset}            - Trigger deep AI strategic audit

Type ${C.green}help${C.reset} / ${C.green}clear${C.reset} / ${C.green}exit${C.reset} to control terminal
`;

export default function TerminalUI() {
    const termRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const xtermRef = useRef<Terminal | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)
    const historyRef = useRef<string[]>([])
    const historyIndexRef = useRef(-1)
    const [lang, setLang] = useState<'en' | 'zh'>('en')

    const { 
        initSimulation, 
        step, 
        updateVector, 
        addFeature, 
        setTeamSize,
        audit, 
        reset, 
        upgradeTier,
        setARPU,
        terminalLines,
        isInterviewing,
        activeQuestions,
        answerInterview
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
                print(getHelpText(lang))
                break
            case 'lang':
                const newLang = args[0]?.toLowerCase()
                if (newLang === 'en' || newLang === 'zh') {
                    setLang(newLang as 'en' | 'zh')
                    print(`${C.green}[SYSTEM] Language switched to ${newLang}${C.reset}`)
                }
                break
            case 'clear':
                term.clear()
                break
            case 'project':
                const subCmd = args[0]?.toLowerCase()
                if (subCmd === 'new') {
                    const name = args.slice(1).join(' ')
                    if (name) {
                        print(`${C.cyan}[PROJECT] Creating: ${name}...${C.reset}`)
                        await useLemeoneStore.getState().createProject(name)
                    }
                } else if (subCmd === 'list') {
                    const projects = useLemeoneStore.getState().projectsList
                    if (projects.length === 0) {
                        print(`${C.gray}No projects found.${C.reset}`)
                    } else {
                        print(`\n${C.cyan}╔═ PROJECTS LIST ═════════════════════════╗${C.reset}`)
                        projects.forEach(p => {
                            const isCurrent = p.id === useLemeoneStore.getState().activeProjectId
                            print(`${C.cyan}║${C.reset} ${isCurrent ? C.green + '*' : ' '} ${p.id.substring(0,8)} | ${p.name}`)
                        })
                        print(`${C.cyan}╚═════════════════════════════════════════╝${C.reset}`)
                    }
                } else if (subCmd === 'load') {
                    const searchId = args[1]
                    const project = useLemeoneStore.getState().projectsList.find(p => p.id.startsWith(searchId))
                    if (project) {
                        print(`${C.cyan}[PROJECT] Loading ${project.name}...${C.reset}`)
                        await useLemeoneStore.getState().loadProject(project.id)
                    } else {
                        print(`${C.red}[ERR] Project ID mismatch.${C.reset}`)
                    }
                }
                break
            case 'scan':
                if (args.length > 0) {
                    print(`${C.cyan}[PARSING] Scanning business DNA...${C.reset}`)
                    await initSimulation(args.join(' '))
                }
                break
            case 'tier':
                const newTier = args[0]?.toUpperCase() as any
                if (['FREE', 'PRO', 'ULTRA', 'ENTERPRISE'].includes(newTier)) upgradeTier(newTier)
                break
            case 'dev': {
                const isMonth = args[0]?.toLowerCase() === 'month' || args.length === 0;
                const steps = isMonth ? 4 : (parseInt(args[0]) || 1);
                print(`${C.green}[COLLISION] Advancing ${isMonth ? '1 market month' : steps + ' epochs'}...${C.reset}`);
                for (let i = 0; i < steps; i++) await step();
                break;
            }
            case 'set':
                const dim = args[0]?.toUpperCase() as keyof typeof DIM
                const val = parseFloat(args[1])
                if (DIM[dim] !== undefined && !isNaN(val)) updateVector(dim, val)
                break
            case 'feature':
                if (args[0]) await addFeature(args[0])
                break
            case 'team':
                const size = args[0]?.toUpperCase() as TeamSize
                if (['SOLO', 'STARTUP', 'GROWTH', 'ENTERPRISE'].includes(size)) setTeamSize(size)
                break
            case 'price':
                const pValue = parseFloat(args[0])
                if (!isNaN(pValue)) {
                    setARPU(pValue)
                    print(`${C.green}[✓ OK] ARPU set to $${pValue}/mo${C.reset}`)
                }
                break
            case 'stat': {
                const s = useLemeoneStore.getState().sandboxState
                if (!s) break
                print(`\n${C.cyan}╔═ PRODUCT DNA (T+${s.epoch}) ═══════════════╗${C.reset}`)
                s.productVector.forEach((v, i) => {
                    const bar = '█'.repeat(Math.floor(v * 10)).padEnd(10, '░')
                    print(`${C.cyan}║${C.reset} D${i.toString().padStart(2,'0')}: ${v.toFixed(3)} ${C.blue}${bar}${C.reset}`)
                })
                print(`${C.cyan}╚══════════════════════════════════════════╝${C.reset}`)
                break
            }
            case 'audit':
                await audit()
                break
            case 'reset':
                reset()
                term.clear()
                print(`${C.yellow}[SYSTEM] Simulation reset. Memory cleared.${C.reset}`)
                break
            case 'exit':
                print(`${C.gray}Connection closed.${C.reset}`)
                break
            default:
                print(`${C.red}Unknown command: ${cmd}${C.reset}`)
        }
        showPrompt()
    }, [initSimulation, step, updateVector, addFeature, setTeamSize, audit, reset, upgradeTier, setARPU, showPrompt, print, lang])

    useEffect(() => {
        if (!termRef.current || xtermRef.current) return
        const term = new Terminal({
            theme: { background: '#00000000', foreground: '#e2e2e2', cursor: '#22C55E', green: '#22C55E', cyan: '#06B6D4', yellow: '#EAB308' },
            fontFamily: '"Fira Code", monospace',
            fontSize: 13,
            cursorBlink: true,
            lineHeight: 1.2
        })
        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.open(termRef.current)
        setTimeout(() => fitAddon.fit(), 100)
        xtermRef.current = term
        
        const handleResize = () => fitAddon.fit()
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
            term.dispose(); xtermRef.current = null
        }
    }, [])

    return (
        <div className="w-full h-full bg-black flex flex-col transition-all duration-300 font-sans scanlines relative overflow-hidden">
            <div className="crt-overlay" />
            
            {/* Terminal Window */}
            <div className="flex-1 min-w-0 relative">
                <div ref={termRef} className="absolute inset-0 p-4" onClick={() => inputRef.current?.focus()} />
            </div>

            {/* Dynamic Probing Panel */}
            {isInterviewing && activeQuestions.length > 0 && (
                <div className="px-6 mb-4 relative z-10">
                    <div className="bg-[#0F172A]/90 border border-cyan-500/30 rounded-lg p-4 shadow-[0_0_30px_rgba(6,182,212,0.1)] backdrop-blur-md">
                        <div className="flex-1 flex flex-col gap-3">
                            {activeQuestions.map(q => (
                                <div key={q.id} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded font-bold uppercase">{q.dimension}</span>
                                        <p className="text-gray-100 font-medium text-sm">{q.text}</p>
                                    </div>
                                    {q.type === 'choice' && (
                                        <div className="flex flex-wrap gap-2">
                                            {q.options?.map((opt: any) => (
                                                <button 
                                                    key={opt.value}
                                                    onClick={() => answerInterview(opt.label, q.id)}
                                                    className="px-3 py-1 bg-gray-800 hover:bg-cyan-500/20 border border-gray-700 hover:border-cyan-500/50 rounded text-xs text-gray-300 transition-all"
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Input Bar */}
            <footer className="h-12 border-t border-gray-800 bg-black flex items-center px-4 gap-3 shrink-0 relative z-20">
                <TerminalIcon className="w-4 h-4 text-cyan-500/50" />
                <span className="text-xs font-bold text-cyan-500">{'>'}</span>
                <input 
                    ref={inputRef}
                    className="flex-1 bg-transparent text-gray-200 focus:outline-none placeholder-gray-700 font-display text-sm tracking-wide"
                    placeholder="Enter command..."
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const cmd = e.currentTarget.value
                            if (!cmd.trim()) return
                            e.currentTarget.value = ''
                            xtermRef.current?.writeln(`\r\n${C.gray}${C.bold}❯ ${cmd}${C.reset}`)
                            handleCommand(cmd)
                        }
                    }}
                />
                <div className="flex items-center gap-4 text-[9px] font-bold text-gray-600 uppercase border-l border-gray-800 pl-4">
                    <div className="flex items-center gap-1 hover:text-cyan-400 cursor-pointer" onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}>
                        <Globe className="w-3 h-3" />
                        <span>{lang}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-500/50">
                        <Activity className="w-3 h-3" />
                        <span>CONNECTED</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}
