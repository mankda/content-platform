import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getOctokit } from '@/lib/octokit'
import { createBranch, branchExists } from '@/lib/github'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { slug } = await req.json()
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const username = user.externalAccounts.find(a => a.provider === 'oauth_github')?.username
  if (!username) return NextResponse.json({ error: 'No GitHub account linked' }, { status: 400 })

  const branchName = `draft/${username}/${slug}`
  const octokit = await getOctokit()

  const exists = await branchExists(octokit, branchName)
  if (!exists) await createBranch(octokit, branchName)

  return NextResponse.json({ branch: branchName, created: !exists })
}
