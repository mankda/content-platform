import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getOctokit } from '@/lib/octokit'

const ORG = process.env.GITHUB_ORG!
const REPO = process.env.GITHUB_REPO!

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { id } = await params
  const prNumber = parseInt(id)
  if (isNaN(prNumber)) return NextResponse.json({ error: 'Invalid PR id' }, { status: 400 })

  const octokit = await getOctokit()

  const { data: files } = await octokit.pulls.listFiles({
    owner: ORG,
    repo: REPO,
    pull_number: prNumber,
    per_page: 100,
  })

  const { data: pr } = await octokit.pulls.get({
    owner: ORG,
    repo: REPO,
    pull_number: prNumber,
  })

  return NextResponse.json({
    files: files.map(f => ({ path: f.filename, status: f.status })),
    branch: pr.head.ref,
    title: pr.title,
    author: pr.user?.login,
  })
}
