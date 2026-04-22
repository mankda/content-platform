import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getOctokit } from '@/lib/octokit'
import { getFileContent, commitFile } from '@/lib/github'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  const branch = searchParams.get('branch') ?? 'main'
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 })

  const octokit = await getOctokit()
  const file = await getFileContent(octokit, path, branch)

  if (!file) return NextResponse.json({ content: '', sha: null })
  return NextResponse.json(file)
}

export async function PUT(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { path, content, branch, sha, message } = await req.json()
  if (!path || !branch) return NextResponse.json({ error: 'path and branch required' }, { status: 400 })

  const octokit = await getOctokit()
  await commitFile(
    octokit,
    path,
    content,
    message ?? `docs: update ${path.split('/').pop()}`,
    branch,
    sha ?? undefined
  )

  return NextResponse.json({ ok: true })
}
