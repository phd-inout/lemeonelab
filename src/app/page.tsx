"use client";

import { useLemeoneStore } from '@/lib/store';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import ResonanceRadar from '@/components/ResonanceRadar';

const TerminalUI = dynamic(() => import('@/components/TerminalUI'), { ssr: false });

export default function Home() {
  const gameState = useLemeoneStore(s => s.gameState);
  const founder = gameState?.founder;
  const company = gameState?.company;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="font-display bg-background-dark text-slate-200 min-h-screen transition-colors duration-300 scanlines">
      {/* Top Bar */}
      <div className="border-b border-border-dark bg-panel-dark text-xs py-2 px-4 flex justify-between items-center text-gray-500">
        <div className="flex gap-6">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500/80 animate-pulse"></span>
            SYS_ONLINE
          </span>
          <span className="hidden sm:inline">LATENCY: 12ms</span>
          <span className="hidden md:inline">ENCRYPTION: AES-256</span>
        </div>
        <div className="flex gap-6">
          <a className="hover:text-primary transition-colors hover:underline" href="#">DOCS</a>
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
            <a className="text-sm bg-transparent text-primary border border-border-dark px-4 py-1.5 rounded hover:bg-primary hover:text-black transition-all font-mono" href="#">
              [ AUTH ]
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Terminal Section */}
        <section className="bg-black rounded border border-border-dark shadow-sm overflow-hidden flex flex-col h-[550px]">
          <div className="bg-[#151515] border-b border-border-dark px-4 py-2 flex items-center gap-2 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]/80"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]/80"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]/80"></div>
            </div>
            <div className="mx-auto text-xs text-slate-500 font-display">root@lemeone-lab:~</div>
          </div>
          <div className="flex-1 overflow-hidden font-display text-sm md:text-base relative p-2 md:p-4 bg-black">
            <TerminalUI />
          </div>
        </section>

        {/* 3 Metric Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-panel-dark border border-border-dark p-6 rounded relative overflow-hidden group hover:border-slate-500 transition-colors shadow-none">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-primary">account_balance_wallet</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 uppercase tracking-wider font-mono">
              <span className="material-symbols-outlined text-[18px]">payments</span>
              Sys_Variable: Cash
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              ${company ? company.cash.toLocaleString() : '245,000'} <span className="text-sm text-gray-400 font-normal ml-1">{company && company.mrr > 0 ? `+${company.mrr.toLocaleString()}` : '+12%'}</span>
            </div>
            <div className="w-full bg-black rounded-full h-1.5 mt-4 border border-border-dark">
              <div className="bg-white h-1.5 rounded-full" style={{ width: company ? `${Math.min(100, Math.max(0, company.cash / 10000))}%` : '45%' }}></div>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-right font-mono uppercase">BURN RATE: ${company ? company.burnRate.toLocaleString() : '12K'}/mo</div>
          </div>

          <div className="bg-panel-dark border border-border-dark p-6 rounded relative overflow-hidden group hover:border-slate-500 transition-colors shadow-none">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-primary">security</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 uppercase tracking-wider font-mono">
              <span className="material-symbols-outlined text-[18px]">shield</span>
              Sys_Variable: Moat
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              LVL {company ? company.moat.toFixed(0) : '4'} <span className="text-sm text-gray-500 font-normal">/ 10</span>
            </div>
            <div className="w-full bg-black rounded-full h-1.5 mt-4 border border-border-dark flex gap-1 p-0.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`h-1 rounded-sm flex-1 ${i < (company ? Math.ceil(company.moat / 16.6) : 4) ? 'bg-slate-300' : 'bg-white/10'}`}></div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2 text-right font-mono uppercase">DEFENSE RATING: STABLE</div>
          </div>

          <div className="bg-panel-dark border border-border-dark p-6 rounded relative overflow-hidden group hover:border-slate-500 transition-colors shadow-none">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-primary">speed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 uppercase tracking-wider font-mono">
              <span className="material-symbols-outlined text-[18px]">memory</span>
              Sys_Variable: Bandwidth
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {company ? Math.round((founder!.bwUsed / founder!.bwMax) * 100) : '85'}% <span className="text-gray-400 font-normal">HIGH</span>
            </div>
            <div className="w-full bg-black rounded-full h-1.5 mt-4 border border-border-dark">
              <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${company ? Math.min(100, (founder!.bwUsed / founder!.bwMax) * 100) : 85}%` }}></div>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-right font-mono uppercase">CAPACITY WARNING</div>
          </div>
        </section>

        {/* Mechanics & Radar Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <section className="col-span-3 bg-panel-dark border border-border-dark p-8 rounded">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-border-dark pb-4 flex items-center gap-2">
              <span className="text-gray-500 font-mono">&gt;</span> CORE_MECHANICS.md
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded bg-white/5 border border-border-dark flex items-center justify-center text-primary/80">
                  <span className="material-symbols-outlined">track_changes</span>
                </div>
                <h3 className="font-bold text-white">Intention Driven</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Input high-level strategic commands. The system translates your intent into operational tasks. Micromanagement is obsolete; focus on the grand vision.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-black border border-border-dark rounded text-gray-500 font-mono">#strategy</span>
                  <span className="text-xs px-2 py-1 bg-black border border-border-dark rounded text-gray-500 font-mono">#nlp</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded bg-white/5 border border-border-dark flex items-center justify-center text-primary/80">
                  <span className="material-symbols-outlined">hourglass_empty</span>
                </div>
                <h3 className="font-bold text-white">Resource Constraints</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Every execution consumes cycles, cash, and team sanity. Optimize your burn rate. Failing to balance constraints leads to immediate system termination (bankruptcy).
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-black border border-border-dark rounded text-gray-500 font-mono">#management</span>
                  <span className="text-xs px-2 py-1 bg-black border border-border-dark rounded text-gray-500 font-mono">#survival</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded bg-white/5 border border-border-dark flex items-center justify-center text-primary/80">
                  <span className="material-symbols-outlined">restart_alt</span>
                </div>
                <h3 className="font-bold text-white">Roguelike Simulation</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Market conditions shift unpredictably. Permadeath is enforced. Extract knowledge from failed runs to build stronger foundations in the next iteration.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-black border border-border-dark rounded text-gray-500 font-mono">#permadeath</span>
                  <span className="text-xs px-2 py-1 bg-black border border-border-dark rounded text-gray-500 font-mono">#replayable</span>
                </div>
              </div>
            </div>
          </section>

          <section className="col-span-1 bg-panel-dark border border-border-dark rounded flex flex-col justify-center min-h-[300px]">
            {founder && company ? (
              <ResonanceRadar
                founderVector={founder.vector}
                marketVector={company.marketVector}
                resonance={company.resonance}
              />
            ) : (
              <div className="text-gray-600 font-mono text-xs text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-3xl opacity-50">radar</span>
                [ AWAITING_INITIALIZATION ]
              </div>
            )}
          </section>
        </div>

        {/* GLOBAL_LEADERBOARD.sql */}
        <section className="bg-panel-dark border border-border-dark rounded overflow-hidden">
          <div className="bg-[#151515] border-b border-border-dark p-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-500">list_alt</span>
              GLOBAL_LEADERBOARD.sql
            </h2>
            <span className="text-xs text-gray-500 font-mono">STATUS: DECRYPTED</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left font-mono">
              <thead className="text-xs text-gray-500 uppercase bg-[#151515] border-b border-border-dark">
                <tr>
                  <th className="px-6 py-3 font-medium" scope="col">Entity_ID</th>
                  <th className="px-6 py-3 font-medium" scope="col">Valuation</th>
                  <th className="px-6 py-3 font-medium" scope="col">Moat_Lvl</th>
                  <th className="px-6 py-3 font-medium text-right" scope="col">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">Nexus_Corp</td>
                  <td className="px-6 py-4 text-gray-400">$1.2B</td>
                  <td className="px-6 py-4 text-gray-500">9</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs border border-border-dark text-gray-400 px-3 py-1 rounded hover:bg-white/10 transition-colors">
                      [ VIEW_LOGS ]
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">OmniTech_Systems</td>
                  <td className="px-6 py-4 text-gray-400">$850M</td>
                  <td className="px-6 py-4 text-gray-500">8</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs border border-border-dark text-gray-400 px-3 py-1 rounded hover:bg-white/10 transition-colors">
                      [ VIEW_LOGS ]
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">Synthetix_Labs</td>
                  <td className="px-6 py-4 text-gray-400">$420M</td>
                  <td className="px-6 py-4 text-gray-500">6</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs border border-border-dark text-gray-400 px-3 py-1 rounded hover:bg-white/10 transition-colors">
                      [ VIEW_LOGS ]
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors text-gray-600">
                  <td className="px-6 py-4 font-medium">DataGhost_Inc</td>
                  <td className="px-6 py-4">$0 (BANKRUPT)</td>
                  <td className="px-6 py-4">2</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs px-3 py-1 line-through">[ CORRUPTED ]</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-[#151515] border-t border-border-dark p-3 text-center">
            <a className="text-sm text-gray-400 hover:text-white transition-colors underline-offset-4" href="#">LOAD_MORE_RECORDS &gt;&gt;</a>
          </div>
        </section>
      </main>

      <footer className="mt-12 border-t border-border-dark bg-[#060606] py-8">
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
