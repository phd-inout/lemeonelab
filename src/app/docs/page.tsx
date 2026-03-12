import Link from 'next/link'

export const metadata = {
  title: 'LEMEONE LAB - Survival Guide',
  description: 'Official survival guide for Lemeone Lab startup simulator.',
}

export default function DocsPage() {
  return (
    <div className="space-y-8 animate-fade-in text-gray-300 py-10">
      <div className="border border-border-dark bg-panel-dark p-6 rounded relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10 rounded-full"></div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-wide font-mono">
          <span className="text-primary mr-2">&gt;</span> 
          Lemeone Lab Survival Guide
        </h1>
        <p className="text-sm text-gray-400 font-mono mb-6">
          v0.2.0-pre-alpha | SECURE_ACCESS: GRANTED
        </p>
        
        <p className="leading-relaxed mb-4">
          欢迎来到 Lemeone Lab 官方生存指南档案室。
        </p>
        <p className="leading-relaxed mb-4">
          在这里，我们不教授你如何编写完美的代码，也不教你如何讨好投资人。我们只向你揭露那个被刻意隐藏的残酷真相：在不可预测的全球演化博弈中，每一次选择所面临的隐性代价与复利。
        </p>
        <p className="leading-relaxed">
          请从左侧菜单选择对应的查阅读物。如果你是第一次来到这里，建议从 [初创指南] 开始。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/docs/01-vision" className="block border border-border-dark hover:border-primary/50 bg-[#121212] hover:bg-[#151515] p-5 rounded transition-all group">
            <h3 className="text-primary text-sm font-bold font-mono mb-2 group-hover:underline">/01/ 实验室哲学</h3>
            <p className="text-xs text-gray-500">模拟创业，实战决策；失败的价值以及沙盒建立的初衷。</p>
        </Link>
        <Link href="/docs/07-commands-reference" className="block border border-border-dark hover:border-primary/50 bg-[#121212] hover:bg-[#151515] p-5 rounded transition-all group">
            <h3 className="text-primary text-sm font-bold font-mono mb-2 group-hover:underline">/07/ 系统指令字典</h3>
            <p className="text-xs text-gray-500">查阅你在终端中生存需要用到的所有操作命令手册。</p>
        </Link>
      </div>
    </div>
  )
}
