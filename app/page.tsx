import { auth, clerkClient } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOctokit } from '@/lib/octokit'
import { getUserRole, listProjects, listPRs, type Role } from '@/lib/github'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GitPullRequest, FolderOpen, BookOpen } from 'lucide-react'

function roleBadgeVariant(role: Role): 'default' | 'secondary' | 'outline' {
  if (role === 'reviewer') return 'default'
  if (role === 'writer') return 'secondary'
  return 'outline'
}

function prStatusBadge(state: string) {
  if (state === 'open') return <Badge variant="secondary">In Review</Badge>
  return <Badge variant="outline">Draft</Badge>
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const githubAccount = user.externalAccounts.find(a => a.provider === 'oauth_github')
  const username = githubAccount?.username ?? 'unknown'

  const octokit = await getOctokit()
  const [role, projects, allPRs] = await Promise.all([
    getUserRole(octokit, username),
    listProjects(octokit),
    listPRs(octokit),
  ])

  // My drafts: branches matching draft/<userId>/*
  const myDraftPRs = allPRs.filter(pr => pr.head.ref.startsWith(`draft/${username}/`))
  // Review queue: all open PRs not from me (for reviewers)
  const reviewQueue = role === 'reviewer' ? allPRs : []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Content Platform</h1>
        <div className="flex items-center gap-3">
          <Link href="/docs" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <BookOpen size={15} /> Docs
          </Link>
          <Badge variant={roleBadgeVariant(role)}>{role}</Badge>
          <span className="text-sm text-muted-foreground">@{username}</span>
          <UserButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* My Drafts */}
        {myDraftPRs.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GitPullRequest size={18} /> My drafts in review
            </h2>
            <ul className="divide-y border rounded-md">
              {myDraftPRs.map(pr => {
                const slug = pr.head.ref.replace(`draft/${username}/`, '')
                return (
                  <li key={pr.number} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <Link href={`/projects/${slug}`} className="text-sm font-medium hover:underline">
                        {pr.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">PR #{pr.number} · {slug}</p>
                    </div>
                    {prStatusBadge(pr.state)}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* Review Queue — reviewers only */}
        {role === 'reviewer' && reviewQueue.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GitPullRequest size={18} /> Review queue
            </h2>
            <ul className="divide-y border rounded-md">
              {reviewQueue.map(pr => {
                const slug = pr.head.ref.split('/').slice(2).join('/')
                return (
                  <li key={pr.number} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <Link href={`/review/${pr.number}`} className="text-sm font-medium hover:underline">
                        {pr.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">PR #{pr.number} · {slug} · by {pr.user?.login}</p>
                    </div>
                    <Badge variant="secondary">Open</Badge>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {(myDraftPRs.length > 0 || reviewQueue.length > 0) && <Separator />}

        {/* Projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen size={18} /> Projects
            </h2>
            {role === 'reviewer' && (
              <Link
                href="/projects/new"
                className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90"
              >
                New project
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No projects yet.{role === 'reviewer' ? ' Create one to get started.' : ' Ask a reviewer to create a project.'}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map(slug => (
                <Link key={slug} href={`/projects/${slug}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-base">{slug}</CardTitle>
                      <CardDescription>projects/{slug}/docs/</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
