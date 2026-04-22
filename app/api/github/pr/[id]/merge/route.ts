import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getOctokit } from '@/lib/octokit'
import { mergePR, deleteBranch, getUserRole } from '@/lib/github'

const ORG = process.env.GITHUB_ORG!
const REPO = process.env.GITHUB_REPO!

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const username = user.externalAccounts.find(a => a.provider === 'oauth_github')?.username
  if (!username) return NextResponse.json({ error: 'No GitHub account linked' }, { status: 400 })

  const octokit = await getOctokit()
  const role = await getUserRole(octokit, username)
  if (role !== 'reviewer') return NextResponse.json({ error: 'Only reviewers can publish' }, { status: 403 })

  const { id } = await params
  const prNumber = parseInt(id)
  if (isNaN(prNumber)) return NextResponse.json({ error: 'Invalid PR id' }, { status: 400 })

  const { data: pr } = await octokit.pulls.get({
    owner: ORG,
    repo: REPO,
    pull_number: prNumber,
  })

  await mergePR(octokit, prNumber)
  await deleteBranch(octokit, pr.head.ref)

  return NextResponse.json({ ok: true })
}
