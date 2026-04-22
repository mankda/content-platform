import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOctokit } from '@/lib/octokit'
import { getFileTree } from '@/lib/github'
import { FileText, ArrowLeft, BookOpen } from 'lucide-react'

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { slug } = await params
  const octokit = await getOctokit()
  const files = await getFileTree(octokit, slug)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold">{slug}</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Files</h2>
          <div className="flex items-center gap-2">
            <Link
              href={`/docs/${slug}`}
              className="text-sm flex items-center gap-1.5 border px-3 py-2 rounded-md hover:bg-muted"
            >
              <BookOpen size={14} /> View docs
            </Link>
            <Link
              href={`/projects/${slug}/edit/index`}
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90"
            >
              New file
            </Link>
          </div>
        </div>

        {files.length === 0 ? (
          <p className="text-muted-foreground">No files yet. Create one to get started.</p>
        ) : (
          <ul className="divide-y border rounded-md">
            {files.map(file => (
              <li key={file.path}>
                <Link
                  href={`/projects/${slug}/edit/${file.path}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                >
                  <FileText size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{file.path}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
