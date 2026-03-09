"use client";

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useLemeoneStore } from '@/lib/store';

export default function TerminalUI() {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    const { logs, addLog, initGame, sprint } = useLemeoneStore();
    const [inputBuffer, setInputBuffer] = useState('');

    // Typewriter effect function
    const writeLog = (term: Terminal, text: string, speed = 10) => {
        let i = 0;
        term.write('\r\n'); // start on new line
        const interval = setInterval(() => {
            if (i < text.length) {
                term.write(text.charAt(i));
                i++;
            } else {
                clearInterval(interval);
                term.write('\r\n> ');
            }
        }, speed);
    };

    useEffect(() => {
        if (!terminalRef.current || xtermRef.current) return;

        const term = new Terminal({
            theme: {
                background: '#0a0f14',
                foreground: '#e6e6e6',
                cursor: '#fff'
            },
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 14,
            cursorBlink: true
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Handle resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        // Initial log
        term.writeln('Welcome to lemeone-lab. Type "init" to start, "sprint" to run a cycle.');

        // Print existing logs
        if (logs.length > 0) {
            logs.forEach(log => term.writeln(log));
        } else {
            term.writeln('[SYSTEM] Ready.');
        }

        term.write('> ');

        // Handle input
        term.onData(e => {
            switch (e) {
                case '\r': // Enter
                    term.writeln('');
                    handleCommand(inputBuffer);
                    setInputBuffer('');
                    break;
                case '\x7F': // Backspace
                    if (term.buffer.active.cursorX > 2) {
                        term.write('\b \b');
                        setInputBuffer(prev => prev.slice(0, -1));
                    }
                    break;
                default: // Normal char
                    if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                        term.write(e);
                        setInputBuffer(prev => prev + e);
                    }
            }
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
            xtermRef.current = null;
        };
    }, []); // Run once

    const handleCommand = (cmd: string) => {
        const term = xtermRef.current;
        if (!term) return;

        const trimmed = cmd.trim().toLowerCase();

        if (trimmed === 'init') {
            initGame();
            writeLog(term, '[SYSTEM] lemeone-lab 启动成功。', 20);
        } else if (trimmed === 'sprint') {
            const resultLog = sprint();
            writeLog(term, resultLog, 15);
        } else if (trimmed === 'clear') {
            term.clear();
            term.write('\r\n> ');
        } else if (trimmed === '') {
            term.write('\r\n> ');
        } else {
            term.writeln(`Unknown command: ${trimmed}`);
            term.write('> ');
        }
    };

    return (
        <div
            ref={terminalRef}
            className="w-full h-full p-4 bg-[#0a0f14] rounded overflow-hidden"
        />
    );
}
