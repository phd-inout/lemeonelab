"use client";

import { useLemeoneStore } from '@/lib/store';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import ParticleManifold from '@/components/ParticleManifold';
import AssetPanel from '@/components/AssetPanel';

const TerminalUI = dynamic(() => import('@/components/TerminalUI'), { ssr: false });

export default function Home() {
  const sandboxState = useLemeoneStore(s => s.sandboxState);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-black text-slate-200 min-h-screen flex flex-col font-mono selection:bg-primary selection:text-black scanlines overflow-hidden">
      
      {/* 1. TOP TELEMETRY HUD */}
      <div className="h-14 border-b border-border-dark bg-[#0a0a0a] flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00f2ff]"></span>
            <span className="font-bold tracking-tighter text-lg">LEMEONE_LAB <span className="text-gray-600">v2.0</span></span>
          </div>
          <div className="flex gap-8 text-[10px] uppercase tracking-widest text-gray-400">
            <div className="flex flex-col">
              <span className="text-gray-600">Active_Paid_Users</span>
              <span className={sandboxState ? ((sandboxState.metrics?.earningPotential || 0) < 100 ? 'text-red-500 underline decoration-double' : 'text-primary') : 'text-gray-600'}>
                {sandboxState ? (sandboxState.metrics?.earningPotential || 0).toLocaleString() : '---'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600">Projected_MRR</span>
              <span className={sandboxState ? 'text-green-400 font-bold' : 'text-gray-600'}>
                {sandboxState ? '$' + ((sandboxState.metrics?.earningPotential || 0) * 15).toLocaleString() : '---'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600">Logical_Epoch</span>
              <span className={sandboxState ? 'text-white' : 'text-gray-600'}>
                {sandboxState ? `T+${sandboxState.epoch || 0}` : 'PRE-SIM'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600">Avg_Resonance</span>
              <span className={sandboxState ? 'text-primary' : 'text-gray-600'}>
                {sandboxState ? ((sandboxState.metrics?.avgResonance || 0) * 100).toFixed(1) + '%' : '---'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600">Population_Target</span>
              <span className="text-white">10,000</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-600">STATUS:</span>
          <span className="text-green-500 font-bold tracking-widest">[GRAVITY_ENGAGED]</span>
        </div>
      </div>

      {/* 2. MAIN GRID LAYOUT */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Gravity Field (25%) */}
        <aside className="w-1/4 border-r border-border-dark bg-[#050505] p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 flex justify-between">
            <span>Market_Gravity_Field</span>
            <span className="text-primary/50">LIVE</span>
          </div>
          <ParticleManifold />
          
          <div className="mt-4 space-y-4">
            <div className="p-3 border border-border-dark bg-black/40 rounded">
              <div className="text-[9px] text-gray-500 mb-1 font-bold">CONVERSION_PROBABILITY</div>
              <div className="text-xl text-primary font-bold">
                {(sandboxState?.metrics.conversionRate || 0 * 100).toFixed(2)}%
              </div>
            </div>
            <div className="p-3 border border-border-dark bg-black/40 rounded">
              <div className="text-[9px] text-gray-500 mb-1 font-bold">TECH_DEBT_COEFFICIENT</div>
              <div className="text-xl text-yellow-500 font-bold">
                {sandboxState?.techDebt.toFixed(1)}%
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER: Terminal (45%) */}
        <section className="flex-1 flex flex-col bg-black relative border-r border-border-dark">
          <div className="absolute inset-0">
            <TerminalUI />
          </div>
          
          {/* Subtle Overlay Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </section>

        {/* RIGHT: Strategic Assets (30%) */}
        <aside className="w-[30%] bg-[#080808] p-4 flex flex-col overflow-hidden">
          <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-4 flex justify-between">
            <span>Strategic_Asset_Reader</span>
            <span className="text-yellow-500/50">ENCRYPTED</span>
          </div>
          <AssetPanel />
        </aside>

      </main>

      {/* 3. BOTTOM INFO BAR */}
      <div className="h-6 border-t border-border-dark bg-black px-4 flex items-center justify-between shrink-0 text-[9px] text-gray-700 tracking-tighter uppercase">
        <div className="flex gap-4">
          <span>Root: lemeone-lab/v2.0/physics-engine</span>
          <span>PID: 10000_AGENTS</span>
        </div>
        <div>
          Memory_Safe: Standard | Simulation_Thread: ACTIVE
        </div>
      </div>
    </div>
  );
}
