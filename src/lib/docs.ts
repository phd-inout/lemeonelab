import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const docsDirectory = path.join(process.cwd(), 'src/content/docs')

export type DocData = {
  slug: string
  title: string
  description: string
  order: number
  contentHtml: string // 为了保留扩展性，目前我们返回原始 markdown，由客户端渲染
  contentMd: string
}

export function getSortedDocsData(): Omit<DocData, 'contentHtml' | 'contentMd'>[] {
  // Get file names under /docs
  if (!fs.existsSync(docsDirectory)) return []
  
  const fileNames = fs.readdirSync(docsDirectory)
  const allDocsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      // Remove ".md" from file name to get id
      const slug = fileName.replace(/\.md$/, '')

      // Read markdown file as string
      const fullPath = path.join(docsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')

      // Use gray-matter to parse the post metadata section
      const matterResult = matter(fileContents)

      // Combine the data with the id
      return {
        slug,
        title: matterResult.data.title || slug,
        description: matterResult.data.description || '',
        order: matterResult.data.order || 99,
      }
    })

  // Sort docs by order
  return allDocsData.sort((a, b) => {
    if (a.order < b.order) {
      return -1
    } else if (a.order > b.order) {
      return 1
    } else {
      return 0
    }
  })
}

export async function getDocData(slug: string): Promise<DocData> {
  const fullPath = path.join(docsDirectory, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents)

  // Combine the data with the id and content
  return {
    slug,
    title: matterResult.data.title || slug,
    description: matterResult.data.description || '',
    order: matterResult.data.order || 99,
    contentHtml: '', // We use react-markdown to render MD directly on client/Server Components. No need for remark-html.
    contentMd: matterResult.content,
  }
}
