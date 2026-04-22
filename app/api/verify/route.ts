import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getOctokit } from '@/lib/octokit'
import { getUserRole, listProjects } from '@/lib/github'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const githubAccount = user.externalAccounts.find(a => a.provider === 'oauth_github')
  const username = githubAccount?.username

  if (!username) {
    return NextResponse.json({ error: 'No GitHub account linked' }, { status: 400 })
  }

  const octokit = await getOctokit()
  const role = await getUserRole(octokit, username)
  const projects = await listProjects(octokit)

  return NextResponse.json({
    userId,
    githubUsername: username,
    role,
    projects,
    repo: `${process.env.GITHUB_ORG}/${process.env.GITHUB_REPO}`,
  })
}
