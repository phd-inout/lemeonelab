"use client";

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="bg-black text-slate-200 min-h-screen flex flex-col items-center justify-center font-mono selection:bg-primary selection:text-black scanlines relative overflow-hidden">
      
      {/* Top Navbar */}
      <div className="absolute top-0 w-full h-16 border-b border-gray-800 bg-black/50 backdrop-blur z-[100] flex items-center justify-between px-8">
        <div className="font-bold tracking-tighter text-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#00f2ff]"></span>
          <Link href="/" className="pointer-events-auto">LEMEONE_LAB <span className="text-gray-600">v2.0</span></Link>
        </div>
        <div className="flex gap-6 items-center text-sm font-bold tracking-widest">
          <Link href="/docs" className="text-gray-400 hover:text-white transition-colors pointer-events-auto">DOCS</Link>
          <Link href="/login" className="text-primary hover:text-white transition-colors border border-primary px-4 py-1.5 rounded bg-primary/10 hover:bg-primary/20 pointer-events-auto">SIGN IN</Link>
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-[100] text-center max-w-4xl px-6 mt-16 pointer-events-auto">
        <div className="inline-flex items-center gap-2 mb-6 border border-primary/30 px-3 py-1 rounded-full bg-primary/5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00f2ff]"></span>
          <span className="text-xs text-primary tracking-widest">DRTA ENGINE v2.5 ONLINE</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Commercial</span> Wind Tunnel
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Stop guessing. Map your startup into a 14-Dimensional physics vector and simulate its survival against up to 100,000 AI agents before writing a single line of code.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login" className="bg-primary text-black font-bold px-8 py-3 rounded uppercase tracking-widest hover:bg-white transition-colors duration-300 shadow-[0_0_15px_rgba(0,242,255,0.4)]">
            Initialize Project
          </Link>
          <Link href="/docs" className="border border-gray-700 text-gray-300 font-bold px-8 py-3 rounded uppercase tracking-widest hover:bg-gray-800 transition-colors duration-300">
            Read Docs
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left text-sm border-t border-gray-800 pt-12">
          <div>
            <h3 className="text-primary font-bold mb-2 tracking-widest">1. DNA SEQUENCING</h3>
            <p className="text-gray-500">Extract 14D vectors from your PRD, decoupling Entry Friction from Monetization Pressure.</p>
          </div>
          <div>
            <h3 className="text-primary font-bold mb-2 tracking-widest">2. FERMI-ENTROPY TUNNELING</h3>
            <p className="text-gray-500">Simulate conversions using continuous quantum potential barriers rather than hardcoded logic.</p>
          </div>
          <div>
            <h3 className="text-primary font-bold mb-2 tracking-widest">3. TIERED SIMULATION</h3>
            <p className="text-gray-500">Run from 100 (Free) up to 100,000 (Enterprise) concurrent agent collisions in the market sandbox.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
