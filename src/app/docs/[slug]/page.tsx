import { getDocData, getSortedDocsData } from '@/lib/docs'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { notFound } from 'next/navigation'

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
    <article className="prose prose-invert prose-green max-w-none animate-fade-in pb-20">
      <div className="mb-10 border-b border-border-dark pb-6">
        <h1 className="text-3xl font-bold font-display text-white mb-2 tracking-wide">
          {docData.title}
        </h1>
        {docData.description && (
          <p className="text-gray-400 text-lg">{docData.description}</p>
        )}
      </div>
      
      {/* 
        这里我们使用 react-markdown 渲染，配置 remarkGfm 开启表格/删除线等 Github 格式
        rehypeRaw 允许在 MD 中书写 HTML 标签（按需开启）
      */}
      <div className="markdown-body font-sans text-gray-300 leading-relaxed space-y-6
        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:border-b [&>h2]:border-border-dark [&>h2]:pb-2
        [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-gray-200 [&>h3]:mt-8 [&>h3]:mb-3
        [&>p]:mb-4
        [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul>li]:mb-1
        [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol>li]:mb-1
        [&>blockquote]:border-l-4 [&>blockquote]:border-primary/50 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-gray-400 [&>blockquote]:bg-primary/5 [&>blockquote]:py-2 [&>blockquote]:pr-4 [&>blockquote]:my-6 [&>blockquote]:rounded-r
        [&>strong]:text-primary [&>strong]:font-semibold
        [&>code]:text-primary [&>code]:bg-primary/10 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:font-mono [&>code]:text-sm
        [&>pre]:bg-[#0f0f0f] [&>pre]:border [&>pre]:border-border-dark [&>pre]:p-4 [&>pre]:rounded-md [&>pre]:overflow-x-auto [&>pre]:my-6
        [&>pre>code]:bg-transparent [&>pre>code]:text-gray-300 [&>pre>code]:p-0
        [&>hr]:border-border-dark [&>hr]:my-8
      ">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={[rehypeRaw]}
        >
          {docData.contentMd}
        </ReactMarkdown>
      </div>
    </article>
  )
}
