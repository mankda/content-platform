import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getOctokit } from '@/lib/octokit'
import { listPRs } from '@/lib/github'

const ORG = process.env.GITHUB_ORG!
const REPO = process.env.GITHUB_REPO!

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const username = user.externalAccounts.find(a => a.provider === 'oauth_github')?.username
  if (!username) return NextResponse.json({ error: 'No GitHub account linked' }, { status: 400 })

  const octokit = await getOctokit()

  // List all branches matching draft/<username>/*
  const prefix = `draft/${username}/`
  const branches: { name: string; slug: string }[] = []

  let page = 1
  while (true) {
    const { data } = await octokit.repos.listBranches({
      owner: ORG,
      repo: REPO,
      per_page: 100,
      page,
    })
    for (const b of data) {
      if (b.name.startsWith(prefix)) {
        branches.push({ name: b.name, slug: b.name.replace(prefix, '') })
      }
    }
    if (data.length < 100) break
    page++
  }

  // Get all open PRs and index by branch name
  const allPRs = await listPRs(octokit)
  const prByBranch = new Map(allPRs.map(pr => [pr.head.ref, pr]))

  const drafts = branches.map(b => ({
    branch: b.name,
    slug: b.slug,
    pr: prByBranch.get(b.name) ?? null,
  }))

  return NextResponse.json({ drafts })
}
