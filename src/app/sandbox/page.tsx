"use client";

import { useLemeoneStore } from '@/lib/store';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AssetPanel from '@/components/AssetPanel';
import VisualizationPanel from '@/components/VisualizationPanel';
import LogoutButton from '@/components/LogoutButton';

const TerminalUI = dynamic(() => import('@/components/TerminalUI'), { ssr: false });

export default function Home() {
  const sandboxState = useLemeoneStore(s => s.sandboxState);
  const [mounted, setMounted] = useState(false);
  const [leftWidth, setLeftWidth] = useState(30);
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
      setLeftWidth(Math.max(15, Math.min(50, startWidth + (delta / fullWidth) * 100)));
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
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
      setRightWidth(Math.max(15, Math.min(60, startWidth + (delta / fullWidth) * 100)));
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

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
          <div className="flex gap-6 text-[10px] uppercase tracking-widest text-gray-400">
            {/* 1. 活跃用户 */}
            <div className="flex flex-col">
              <span className="text-gray-600">活跃用户</span>
              <span className={sandboxState ? 'text-primary' : 'text-gray-600'}>
                {sandboxState ? (sandboxState.metrics?.activePaidUserCount || 0).toLocaleString() : '---'}
              </span>
            </div>
            {/* 2. 付费用户 */}
            <div className="flex flex-col">
              <span className="text-gray-600">付费用户</span>
              <span className={sandboxState ? ((sandboxState.metrics?.earningPotential || 0) < 10 ? 'text-red-500' : 'text-green-400 font-bold') : 'text-gray-600'}>
                {sandboxState ? (sandboxState.metrics?.earningPotential || 0).toLocaleString() : '---'}
              </span>
            </div>
            {/* 3. 月营收 MRR */}
            <div className="flex flex-col">
              <span className="text-gray-600">月营收_MRR</span>
              <span className={sandboxState ? ((sandboxState.metrics?.mrr || 0) > 0 ? 'text-green-400 font-bold' : 'text-yellow-500') : 'text-gray-600'}>
                {sandboxState ? '$' + (sandboxState.metrics?.mrr || 0).toLocaleString() : '---'}
              </span>
            </div>
            {/* 4. 转化率 */}
            <div className="flex flex-col">
              <span className="text-gray-600">转化率</span>
              <span className={sandboxState ? ((sandboxState.metrics?.conversionRate || 0) > 0.03 ? 'text-green-400' : 'text-yellow-500') : 'text-gray-600'}>
                {sandboxState ? ((sandboxState.metrics?.conversionRate || 0) * 100).toFixed(2) + '%' : '---'}
              </span>
            </div>
            {/* 5. 生存几率 */}
            <div className="flex flex-col">
              <span className="text-gray-600">生存几率</span>
              <span className={sandboxState ? ((sandboxState.metrics?.survivalRate || 0) > 0.5 ? 'text-green-400 font-bold' : 'text-red-500 font-bold animate-pulse') : 'text-gray-600'}>
                {sandboxState ? ((sandboxState.metrics?.survivalRate || 0) * 100).toFixed(1) + '%' : '---'}
              </span>
            </div>
            {/* Epoch */}
            <div className="flex flex-col">
              <span className="text-gray-600">周期</span>
              <span className={sandboxState ? 'text-white' : 'text-gray-600'}>
                {sandboxState ? `T+${sandboxState.epoch || 0}` : 'PRE-SIM'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-xs font-bold tracking-widest">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">STATUS:</span>
            <span className="text-green-500">[GRAVITY_ENGAGED]</span>
          </div>
          <Link href="/docs" className="text-gray-400 hover:text-white transition-colors border border-gray-800 px-3 py-1 rounded bg-[#111] hover:bg-[#222]">
            READ DOCS
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* 2. MAIN GRID LAYOUT */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Visualization Area (Tabs) */}
        <aside style={{ width: `${leftWidth}%` }} className="bg-[#050505] p-2 flex flex-col overflow-hidden shrink-0">
          <VisualizationPanel />
        </aside>

        {/* DRAG HANDLE 1 */}
        <div 
          className="w-1 cursor-col-resize bg-border-dark hover:bg-primary transition-colors z-50 shrink-0"
          onMouseDown={startResizingLeft}
        />

        {/* CENTER: Terminal */}
        <section className="flex-1 flex flex-col bg-black relative min-w-0 overflow-hidden">
          <div className="absolute inset-0">
            <TerminalUI />
          </div>
          
          {/* Subtle Overlay Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </section>

        {/* DRAG HANDLE 2 */}
        <div 
          className="w-1 cursor-col-resize bg-border-dark hover:bg-primary transition-colors z-50 shrink-0"
          onMouseDown={startResizingRight}
        />

        {/* RIGHT: Strategic Assets */}
        <aside style={{ width: `${rightWidth}%` }} className="bg-[#080808] p-4 flex flex-col overflow-hidden shrink-0">
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
