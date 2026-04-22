import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOctokit } from '@/lib/octokit'
import { getFileContent } from '@/lib/github'
import { EditorPageClient } from './client'

export default async function EditorPage({ params }: { params: Promise<{ slug: string; path: string[] }> }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const username = user.externalAccounts.find(a => a.provider === 'oauth_github')?.username
  if (!username) redirect('/sign-in')

  const { slug, path } = await params
  const filePath = `projects/${slug}/docs/${path.join('/')}`
  const branch = `draft/${username}/${slug}`

  const octokit = await getOctokit()

  // Try draft branch first, fall back to main
  let file = await getFileContent(octokit, filePath, branch)
  if (!file) file = await getFileContent(octokit, filePath, 'main')

  return (
    <EditorPageClient
      slug={slug}
      filePath={filePath}
      branch={branch}
      initialContent={file?.content ?? ''}
      initialSha={file?.sha ?? null}
      userId={userId}
    />
  )
}
