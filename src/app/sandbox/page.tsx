"use client";

import { useLemeoneStore } from '@/lib/store';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AssetPanel from '@/components/AssetPanel';
import VisualizationPanel from '@/components/VisualizationPanel';
import { 
  Activity, 
  ShieldAlert, 
  DollarSign, 
  Users, 
  Cpu, 
  Globe, 
  BookOpen,
  Zap
} from 'lucide-react';

const TerminalUI = dynamic(() => import('@/components/TerminalUI'), { ssr: false });

// Helper component for Stat Bar
const HUDStat = ({ icon: Icon, label, value, colorClass, subValue }: any) => (
  <div className="flex flex-col border-r border-gray-800/50 px-5 last:border-0">
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon className={`w-3 h-3 ${colorClass} opacity-70`} />
      <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">{label}</span>
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className="text-sm font-display font-bold text-gray-100 tracking-tight">{value}</span>
      {subValue && <span className="text-[8px] text-gray-600 font-bold">{subValue}</span>}
    </div>
  </div>
);

export default function Home() {
  const sandboxState = useLemeoneStore(s => s.sandboxState);
  const [mounted, setMounted] = useState(false);
  const [leftWidth, setLeftWidth] = useState(25);
  const [rightWidth, setRightWidth] = useState(30);

  useEffect(() => {
    setMounted(true);
  }, []);

  const startResizingLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;
    const fullWidth = window.innerWidth;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setLeftWidth(Math.max(15, Math.min(45, startWidth + (delta / fullWidth) * 100)));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const startResizingRight = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;
    const fullWidth = window.innerWidth;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX; 
      setRightWidth(Math.max(15, Math.min(50, startWidth + (delta / fullWidth) * 100)));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  if (!mounted) return null;

  return (
    <div className="bg-[#020617] text-slate-200 h-screen flex flex-col font-sans selection:bg-cyan-500/30 selection:text-white scanlines overflow-hidden">
      
      {/* 1. TOP TELEMETRY HUD */}
      <header className="h-16 border-b border-gray-800 bg-[#0F172A]/80 backdrop-blur-xl flex items-center px-6 justify-between shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 pr-8 border-r border-gray-800">
            <div className="relative">
              <Cpu className="w-6 h-6 text-cyan-500 glow-cyan animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold tracking-tighter text-lg leading-tight uppercase">LEMEONE_LAB <span className="text-gray-600">v2.0</span></span>
              <span className="text-[9px] text-cyan-500 font-bold tracking-tighter uppercase opacity-70">OS_CORE // STABLE</span>
            </div>
          </div>

          <div className="flex items-center">
            <HUDStat 
              icon={Users} 
              label="ACTIVE_USERS" 
              value={sandboxState?.metrics.activePaidUserCount.toLocaleString() || '---'} 
              colorClass="text-cyan-400"
              subValue={sandboxState ? `T+${sandboxState.epoch}` : ''}
            />
            <HUDStat 
              icon={DollarSign} 
              label="REVENUE_MRR" 
              value={sandboxState ? `$${sandboxState.metrics.mrr.toLocaleString()}` : '---'} 
              colorClass="text-green-400"
            />
            <HUDStat 
              icon={ShieldAlert} 
              label="TECH_DEBT" 
              value={sandboxState ? `${sandboxState.techDebt.toFixed(1)}%` : '---'} 
              colorClass="text-yellow-500"
            />
            <HUDStat 
              icon={Activity} 
              label="SURVIVAL" 
              value={sandboxState ? `${(sandboxState.metrics.survivalRate * 100).toFixed(1)}%` : '---'} 
              colorClass={sandboxState?.metrics.survivalRate && sandboxState.metrics.survivalRate > 0.5 ? 'text-green-400' : 'text-red-500'}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden xl:flex flex-col items-end mr-4">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Industry_Cluster</span>
            <span className="text-xs text-white font-display font-medium uppercase">{sandboxState?.industryName || 'SCANNING...'}</span>
          </div>
          <Link href="/docs" className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-400 hover:text-cyan-400 transition-all border border-gray-800 hover:border-cyan-500/50 px-4 py-2 rounded-md bg-[#111] hover:bg-cyan-500/5 group">
            <BookOpen className="w-3.5 h-3.5 group-hover:animate-bounce" />
            READ DOCS
          </Link>
        </div>
      </header>

      {/* 2. MAIN GRID LAYOUT */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Visualization Area */}
        <aside style={{ width: `${leftWidth}%` }} className="bg-[#050505] p-3 flex flex-col overflow-hidden shrink-0">
          <VisualizationPanel />
        </aside>

        {/* DRAG HANDLE 1 */}
        <div 
          className="w-px hover:w-1 cursor-col-resize bg-gray-800 hover:bg-cyan-500 transition-all z-50 shrink-0"
          onMouseDown={startResizingLeft}
        />

        {/* CENTER: Terminal */}
        <section className="flex-1 flex flex-col bg-black relative min-w-0 overflow-hidden">
          <TerminalUI />
          
          {/* Subtle Overlay Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        </section>

        {/* DRAG HANDLE 2 */}
        <div 
          className="w-px hover:w-1 cursor-col-resize bg-gray-800 hover:bg-cyan-500 transition-all z-50 shrink-0"
          onMouseDown={startResizingRight}
        />

        {/* RIGHT: Strategic Assets */}
        <aside style={{ width: `${rightWidth}%` }} className="bg-[#050505] p-3 flex flex-col overflow-hidden shrink-0">
          <div className="bg-black/40 border border-gray-800/60 rounded-lg flex-1 flex flex-col overflow-hidden">
             <div className="px-4 py-2 border-b border-gray-800/60 flex justify-between items-center bg-[#0F172A]/40">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">ASSET_STREAM_READER</span>
                </div>
                <span className="text-[9px] text-yellow-500/50 font-mono tracking-tighter">ENCRYPTED_STREAM</span>
             </div>
             <div className="flex-1 overflow-hidden p-1">
                <AssetPanel />
             </div>
          </div>
        </aside>

      </main>

      {/* 3. BOTTOM INFO BAR */}
      <footer className="h-7 border-t border-gray-800 bg-[#020617] px-6 flex items-center justify-between shrink-0 text-[9px] text-gray-500 tracking-tighter uppercase font-bold">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span>Node: lemeonelab/v2.0/main</span>
          </div>
          <span className="text-gray-700">|</span>
          <span>PID: 100,000_AGENTS_ACTIVE</span>
          <span className="text-gray-700">|</span>
          <span>Resolution: {sandboxState?.tier || 'FREE'}</span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3 opacity-50" />
            <span>Latency: 24ms</span>
          </div>
          <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-400">Memory: Stable</span>
        </div>
      </footer>
    </div>
  );
}
