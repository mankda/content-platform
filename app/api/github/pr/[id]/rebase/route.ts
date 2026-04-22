import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getOctokit } from '@/lib/octokit'
import { mergeMainIntoDraft } from '@/lib/github'

const ORG = process.env.GITHUB_ORG!
const REPO = process.env.GITHUB_REPO!

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { id } = await params
  const prNumber = parseInt(id)
  if (isNaN(prNumber)) return NextResponse.json({ error: 'Invalid PR id' }, { status: 400 })

  const octokit = await getOctokit()

  const { data: pr } = await octokit.pulls.get({
    owner: ORG,
    repo: REPO,
    pull_number: prNumber,
  })

  const result = await mergeMainIntoDraft(octokit, pr.head.ref)
  return NextResponse.json({ ok: true, result })
}
