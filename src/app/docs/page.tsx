import { getSortedDocsData } from '@/lib/docs'
import Link from 'next/link'
import { FileText, ChevronRight, Binary, Fingerprint, Activity } from 'lucide-react'

export default function DocsPage() {
  const docs = getSortedDocsData()

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#0F172A]/40 p-10 backdrop-blur-sm shadow-[0_0_50px_rgba(6,182,212,0.05)]">
        <div className="absolute top-0 right-0 p-6 opacity-20">
           <Binary className="w-32 h-32 text-cyan-500" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
             <Fingerprint className="w-5 h-5 text-cyan-500 glow-cyan" />
             <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.3em]">Identity_Verified</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4 tracking-tight leading-tight uppercase">
            Protocol <span className="text-cyan-500">Repository</span>
          </h1>
          <p className="text-gray-400 text-lg font-medium leading-relaxed mb-8">
            Access the underlying mathematical principles, 14-dimensional DNA modeling logic, and tactical guidelines for the Lemeone Lab simulation environment.
          </p>
          
          <div className="flex items-center gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-t border-gray-800 pt-8">
             <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-green-500" />
                <span>Sim_Version: 2.5</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span>Neural_Sync: ACTIVE</span>
             </div>
          </div>
        </div>
      </section>

      {/* Chapters Grid */}
      <section>
        <div className="flex items-center gap-3 mb-8 px-2">
           <div className="w-1 h-4 bg-cyan-500" />
           <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Available_Modules</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              className="group relative flex flex-col p-6 rounded-xl border border-gray-800 bg-[#050505] hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <FileText className="w-16 h-16 text-white" />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors flex items-center justify-between">
                  {doc.title}
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed flex-1">
                  {doc.description}
                </p>
                
                <div className="mt-6 flex items-center gap-2">
                   <span className="text-[8px] font-bold text-cyan-500/50 uppercase tracking-tighter">ID: {doc.slug.toUpperCase()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
