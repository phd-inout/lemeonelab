import { getDocData, getSortedDocsData } from '@/lib/docs'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { notFound } from 'next/navigation'
import { Hash, Calendar, BookOpen } from 'lucide-react'

type Props = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const docs = getSortedDocsData()
  return docs.map((doc) => ({
    slug: doc.slug,
  }))
}

export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params
  try {
    const docData = await getDocData(resolvedParams.slug)
    return {
      title: `${docData.title} | LEMEONE LAB`,
      description: docData.description,
    }
  } catch (e) {
    return {
      title: 'Not Found | LEMEONE LAB',
    }
  }
}

export default async function DocPage({ params }: Props) {
  const resolvedParams = await params
  let docData
  try {
    docData = await getDocData(resolvedParams.slug)
  } catch (e) {
    notFound()
  }

  return (
    <article className="animate-in fade-in slide-in-from-right-4 duration-700 pb-32">
      {/* Header Metadata */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4 text-cyan-500/60 font-bold text-[10px] tracking-[0.2em] uppercase">
           <Hash className="w-3 h-3" />
           <span>Protocol_Entry: {resolvedParams.slug}</span>
           <span className="text-gray-800">|</span>
           <Calendar className="w-3 h-3" />
           <span>Updated: 2026.04.24</span>
        </div>
        
        <h1 className="text-4xl font-display font-bold text-white mb-6 tracking-tight uppercase leading-tight">
          {docData.title}
        </h1>
        
        {docData.description && (
          <div className="relative p-6 bg-cyan-500/5 border-l-2 border-cyan-500 rounded-r-lg">
             <p className="text-gray-400 text-lg font-medium leading-relaxed italic">
               "{docData.description}"
             </p>
             <BookOpen className="absolute top-2 right-4 w-12 h-12 text-cyan-500/10 pointer-events-none" />
          </div>
        )}
      </header>
      
      {/* Markdown Body with Industrial/Cyberpunk styling */}
      <div className="markdown-body font-sans text-gray-300 leading-relaxed space-y-8
        [&>h2]:text-2xl [&>h2]:font-display [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-16 [&>h2]:mb-6 [&>h2]:border-b [&>h2]:border-gray-800 [&>h2]:pb-3 [&>h2]:uppercase [&>h2]:tracking-widest
        [&>h3]:text-lg [&>h3]:font-display [&>h3]:font-bold [&>h3]:text-cyan-400 [&>h3]:mt-10 [&>h3]:mb-4 [&>h3]:tracking-wide
        [&>p]:text-base [&>p]:mb-6 [&>p]:leading-8
        [&>ul]:list-none [&>ul]:pl-0 [&>ul]:mb-8 [&>ul>li]:relative [&>ul>li]:pl-6 [&>ul>li]:mb-3 [&>ul>li::before]:content-['>'] [&>ul>li::before]:absolute [&>ul>li::before]:left-0 [&>ul>li::before]:text-cyan-500 [&>ul>li::before]:font-bold [&>ul>li::before]:text-[10px] [&>ul>li::before]:top-2
        [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-8 [&>ol>li]:mb-3 [&>ol>li]:marker:text-cyan-500 [&>ol>li]:marker:font-bold
        [&>blockquote]:border-l-2 [&>blockquote]:border-cyan-500/30 [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-gray-500 [&>blockquote]:bg-white/[0.02] [&>blockquote]:py-4 [&>blockquote]:pr-6 [&>blockquote]:my-8 [&>blockquote]:rounded-r-xl
        [&>strong]:text-white [&>strong]:font-bold
        [&>code]:text-cyan-300 [&>code]:bg-cyan-500/10 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:font-display [&>code]:text-sm
        [&>pre]:bg-[#050505] [&>pre]:border [&>pre]:border-gray-800 [&>pre]:p-6 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:my-8 [&>pre]:shadow-inner
        [&>pre>code]:bg-transparent [&>pre>code]:text-gray-300 [&>pre>code]:p-0 [&>pre>code]:text-xs
        [&>hr]:border-gray-800 [&>hr]:my-16
        [&>table]:w-full [&>table]:border-collapse [&>table]:my-8 [&>table]:text-sm
        [&>table_th]:bg-cyan-500/10 [&>table_th]:text-cyan-400 [&>table_th]:font-bold [&>table_th]:p-3 [&>table_th]:border [&>table_th]:border-gray-800 [&>table_th]:text-left
        [&>table_td]:p-3 [&>table_td]:border [&>table_td]:border-gray-800 [&>table_td]:text-gray-400
      ">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={[rehypeRaw]}
        >
          {docData.contentMd}
        </ReactMarkdown>
      </div>

      {/* Navigation Footer */}
      <footer className="mt-20 pt-10 border-t border-gray-900 flex justify-between items-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">
         <span>End_of_Protocol</span>
         <div className="flex gap-4">
            <span className="hover:text-cyan-500 cursor-pointer transition-colors">Print_Hardcopy</span>
            <span className="hover:text-cyan-500 cursor-pointer transition-colors">Download_PDF</span>
         </div>
      </footer>
    </article>
  )
}
