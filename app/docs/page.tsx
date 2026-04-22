import Link from 'next/link'
import { getServerOctokit } from '@/lib/octokit'
import { listProjects } from '@/lib/github'
import { BookOpen } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default async function DocsIndexPage() {
  const octokit = getServerOctokit()
  const projects = await listProjects(octokit)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-3">
        <BookOpen size={20} className="text-primary" />
        <h1 className="text-lg font-semibold">Documentation</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-2">All Projects</h2>
        <p className="text-muted-foreground text-sm mb-8">Published documentation.</p>

        {projects.length === 0 ? (
          <p className="text-muted-foreground">No published documentation yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map(slug => (
              <Link key={slug} href={`/docs/${slug}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base capitalize">{slug.replace(/[_-]/g, ' ')}</CardTitle>
                    <CardDescription>Browse docs</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
