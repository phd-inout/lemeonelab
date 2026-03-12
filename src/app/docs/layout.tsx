import { getSortedDocsData } from '@/lib/docs'
import Link from 'next/link'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const docs = getSortedDocsData()

  return (
    <div className="font-display bg-background-dark text-slate-200 h-screen flex flex-col transition-colors duration-300 scanlines overflow-hidden">
      {/* Top Header */}
      <header className="border-b border-border-dark bg-panel-dark text-xs py-2 px-6 flex justify-center shrink-0">
        <div className="w-full max-w-7xl flex justify-between items-center text-gray-400">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              LEMEONE LAB
            </Link>
            <span className="text-gray-600">|</span>
            <span className="text-green-400">Survival Guide</span>
          </div>
          <div>
            <span>SECURE CONNECTION</span>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto flex flex-1 overflow-hidden border-x border-border-dark bg-background-dark">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border-dark bg-[#0f0f0f] hidden md:flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-border-dark shrink-0">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">
              Chapters
            </h2>
          </div>
          <nav className="flex flex-col p-2 gap-1">
            {docs.map((doc) => (
              <Link
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                className="px-3 py-2 text-sm text-gray-400 hover:text-primary hover:bg-[#1a1a1a] rounded transition-colors"
                title={doc.description}
              >
                {doc.title}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative bg-background-dark p-6 md:p-10">
          <div className="max-w-3xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
