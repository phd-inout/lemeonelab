import { getSortedDocsData } from '@/lib/docs'
import Link from 'next/link'
import { 
  ChevronRight, 
  BookOpen, 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  Zap, 
  Layers,
  LayoutDashboard
} from 'lucide-react'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const docs = getSortedDocsData()

  return (
    <div className="font-sans bg-[#020617] text-slate-300 h-screen flex flex-col transition-colors duration-300 scanlines overflow-hidden relative">
      <div className="crt-overlay pointer-events-none" />
      
      {/* 1. TOP COMMAND BAR */}
      <header className="h-14 border-b border-gray-800/60 bg-[#0F172A]/80 backdrop-blur-xl flex items-center px-6 justify-between shrink-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-3 pr-6 border-r border-gray-800/60">
            <div className="relative">
              <Cpu className="w-5 h-5 text-cyan-500 glow-cyan animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-display font-bold text-white tracking-widest uppercase group-hover:text-cyan-400 transition-colors">Lemeone.lab</span>
              <span className="text-[8px] text-cyan-500/70 font-bold tracking-tighter uppercase">Protocol_Manual</span>
            </div>
          </Link>
          
          <nav className="flex items-center gap-4 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
             <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400">
                <BookOpen className="w-3 h-3" />
                <span>Reference</span>
             </div>
             <ChevronRight className="w-3 h-3 text-gray-700" />
             <span className="text-gray-400">Knowledge_Base</span>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/sandbox" className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-white border border-cyan-500/50 px-4 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 transition-all border-glow-cyan">
            <LayoutDashboard className="w-3.5 h-3.5" />
            RESUME_SIMULATION
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full relative z-10 border-x border-gray-800/40 bg-black/20">
        
        {/* 2. SIDE NAVIGATION */}
        <aside className="w-72 border-r border-gray-800/60 bg-[#0F172A]/20 backdrop-blur-sm hidden md:flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-800/40">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Layers className="w-4 h-4" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">System_Modules</h2>
            </div>
            <p className="text-[9px] text-gray-600 font-medium">Protocol version 2.5.0-STABLE</p>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="space-y-1">
              {docs.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/docs/${doc.slug}`}
                  className="group flex items-center gap-3 px-4 py-2.5 rounded-lg border border-transparent hover:border-cyan-500/20 hover:bg-cyan-500/5 transition-all"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-800 group-hover:bg-cyan-500 transition-colors shadow-[0_0_5px_transparent] group-hover:shadow-cyan-500/50" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold tracking-tight text-gray-400 group-hover:text-white transition-colors">{doc.title}</span>
                    <span className="text-[9px] text-gray-600 line-clamp-1 group-hover:text-gray-500">{doc.description}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 pt-10 border-t border-gray-800/40">
               <h3 className="text-[9px] font-bold text-gray-700 uppercase tracking-widest px-4 mb-4">Diagnostics</h3>
               <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-2 text-[10px] text-gray-500 font-medium">
                     <ShieldCheck className="w-3.5 h-3.5 text-green-900" />
                     <span>Gravity_Auth: OK</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 text-[10px] text-gray-500 font-medium">
                     <Zap className="w-3.5 h-3.5 text-yellow-900" />
                     <span>Neural_Drift: 0.03%</span>
                  </div>
               </div>
            </div>
          </nav>
        </aside>

        {/* 3. MAIN ARTICLE VIEW */}
        <main className="flex-1 overflow-y-auto bg-black/10 relative p-8 md:p-16 flex justify-center">
           <div className="w-full max-w-4xl">
              {children}
           </div>
        </main>
      </div>

      {/* 4. FOOTER */}
      <footer className="h-6 border-t border-gray-800/60 bg-[#020617] px-6 flex items-center justify-between shrink-0 text-[9px] text-gray-600 tracking-tighter uppercase font-bold z-50">
        <div className="flex gap-4">
          <span>Root: documentation/v2.5/physics-core</span>
          <span className="text-gray-800">|</span>
          <span>Access_Level: CLASSIFIED</span>
        </div>
        <div className="flex items-center gap-1">
          <Terminal className="w-3 h-3 opacity-50" />
          <span>Kernel_Sync: READY</span>
        </div>
      </footer>
    </div>
  )
}
