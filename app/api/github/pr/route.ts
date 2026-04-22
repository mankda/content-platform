import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getOctokit } from '@/lib/octokit'
import { listPRs, createPR } from '@/lib/github'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const branch = searchParams.get('branch') ?? undefined

  const octokit = await getOctokit()
  const prs = await listPRs(octokit, branch)

  return NextResponse.json({ prs })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { branch, title, body } = await req.json()
  if (!branch || !title) return NextResponse.json({ error: 'branch and title required' }, { status: 400 })

  const octokit = await getOctokit()

  // Check no open PR already exists for this branch
  const existing = await listPRs(octokit, branch)
  if (existing.length > 0) {
    return NextResponse.json({ pr: existing[0] })
  }

  const prNumber = await createPR(octokit, branch, title, body ?? '')
  const prs = await listPRs(octokit, branch)

  return NextResponse.json({ pr: prs.find(p => p.number === prNumber) ?? null })
}
