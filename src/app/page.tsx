"use client";

import { useLemeoneStore } from '@/lib/store';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ResonanceRadar from '@/components/ResonanceRadar';
import { createClient } from '@/utils/supabase/client';
import { logout } from '@/app/login/actions';
import { syncRehearsal } from '@/app/actions/rehearsal';

const TerminalUI = dynamic(() => import('@/components/TerminalUI'), { ssr: false });

export default function Home() {
  const gameState = useLemeoneStore(s => s.gameState);
  const isSystemPaused = useLemeoneStore(s => s.isSystemPaused);
  const setSystemPaused = useLemeoneStore(s => s.setSystemPaused);
  const founder = gameState?.founder;
  const company = gameState?.company;

  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email ?? null);
    };
    fetchUser();

    // ── 离线暂停与保护机制 ──
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setSystemPaused(true);
      } else {
        // We do not resume automatically to ensure the user is actively back.
        // It stays paused until a keypress or terminal command happens.
        // Actually, let's just show it. We'll resume it when they type in TerminalUI.
      }
    };
    
    // ── 离线、关闭窗口前的强制存档 ──
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const gs = useLemeoneStore.getState().gameState;
      if (gs && gs.id) {
        // syncRehearsal does not block the unload, but uses fire-and-forget logic suitable for beforeunload
        const data = new Blob([JSON.stringify({ id: gs.id, state: gs })], { type: 'application/json' });
        navigator.sendBeacon('/api/rehearsal/sync', data); // Since server action might be killed, we could use sendBeacon if we had an API route.
        // For now, we just call the server action and hope it finishes or the browser lets it fire.
        syncRehearsal(gs.id, gs).catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [setSystemPaused]);

  if (!mounted) return null;

  return (
    <div className="font-display bg-background-dark text-slate-200 min-h-screen flex flex-col transition-colors duration-300 scanlines">
      {/* Top Bar */}
      <div className="border-b border-border-dark bg-panel-dark text-xs py-2 px-4 flex justify-between items-center text-gray-500">
        <div className="flex gap-6">
          <span className="flex items-center gap-2">
            {isSystemPaused ? (
              <>
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                <span className="text-yellow-500 font-bold">[SYSTEM_PAUSED]</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500/80 animate-pulse"></span>
                SYS_ONLINE
              </>
            )}
          </span>
          <span className="hidden sm:inline">LATENCY: {isSystemPaused ? '---' : '12ms'}</span>
          <span className="hidden md:inline">ENCRYPTION: AES-256</span>
        </div>
        <div className="flex gap-6">
          <Link className="hover:text-primary transition-colors hover:underline" href="/docs">DOCS</Link>
          <a className="hover:text-primary transition-colors hover:underline" href="#">COMMUNITY</a>
          <button className="hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">contrast</span> MODE
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border-dark bg-panel-dark/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-primary">terminal</span>
            <span className="text-xl font-bold tracking-tight">LEMEONE<span className="text-gray-500">_LAB</span></span>
          </div>
          <div className="hidden md:flex items-center bg-background-dark border border-border-dark rounded px-3 py-1.5 w-96">
            <span className="text-gray-500 mr-2 font-mono">&gt;</span>
            <input
              className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full text-primary placeholder-gray-600 font-display outline-none"
              placeholder="execute search_query..." type="text"
            />
          </div>
          <div className="flex items-center gap-4">
            <a className="text-sm hover:text-primary transition-colors hidden sm:block font-mono" href="#">STATUS</a>
            {userEmail ? (
              <div className="flex items-center gap-3 bg-black border border-primary px-4 py-1.5 rounded">
                <span className="text-sm text-primary font-mono">{userEmail}</span>
                <span className="text-gray-600 font-mono">|</span>
                <button onClick={() => logout()} className="text-sm text-gray-400 hover:text-red-500 transition-colors font-mono">
                  [ LOGOUT ]
                </button>
              </div>
            ) : (
              <a className="text-sm bg-transparent text-primary border border-border-dark px-4 py-1.5 rounded hover:bg-primary hover:text-black transition-all font-mono" href="/login">
                [ AUTH ]
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 flex flex-col">
        {/* Terminal Section */}
        <section className="bg-black rounded border border-border-dark shadow-sm overflow-hidden flex flex-col flex-1 min-h-[500px]">
          <div className="bg-[#151515] border-b border-border-dark px-4 py-2 flex items-center gap-2 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]/80"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]/80"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]/80"></div>
            </div>
            <div className="mx-auto text-xs text-slate-500 font-display">root@lemeone-lab:~</div>
          </div>
          <div className="relative flex-1 min-h-0">
            <div style={{position: 'absolute', inset: 0}}>
              <TerminalUI />
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-8 border-t border-border-dark bg-[#060606] py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-6 text-sm text-gray-600 font-mono">
            <a className="hover:text-primary transition-colors" href="#">man cortex</a>
            <a className="hover:text-primary transition-colors" href="#">/etc/privacy</a>
            <a className="hover:text-primary transition-colors" href="#">ping @devs</a>
          </div>
          <div className="mt-4 text-xs text-gray-700 font-mono">© 2026 lemeone-lab Systems. All protocols observed.</div>
        </div>
      </footer>
    </div>
  );
}
