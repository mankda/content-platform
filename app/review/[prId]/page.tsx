import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOctokit } from '@/lib/octokit'
import { getFileContent } from '@/lib/github'
import { ReviewClient } from './client'
import type { ParsedComment } from '@/app/api/github/pr/[id]/comments/route'

const ORG = process.env.GITHUB_ORG!
const REPO = process.env.GITHUB_REPO!

const ANCHOR_RE = /<!--\s*anchor:\s*(\{.*?\})\s*-->/s

function parseRawComment(c: {
  id: number
  body: string | null
  user: { login: string } | null
  created_at: string
}): ParsedComment {
  const body = c.body ?? ''
  const match = body.match(ANCHOR_RE)
  let anchor = null
  let cleanBody = body
  if (match) {
    try { anchor = JSON.parse(match[1]) } catch { /* ignore */ }
    cleanBody = body.replace(ANCHOR_RE, '').trim()
  }
  return { id: c.id, body: cleanBody, author: c.user?.login ?? 'unknown', createdAt: c.created_at, anchor }
}

export default async function ReviewPage({ params }: { params: Promise<{ prId: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { prId } = await params
  const prNumber = parseInt(prId)
  if (isNaN(prNumber)) redirect('/')

  const octokit = await getOctokit()

  const [{ data: pr }, { data: files }, { data: rawComments }] = await Promise.all([
    octokit.pulls.get({ owner: ORG, repo: REPO, pull_number: prNumber }),
    octokit.pulls.listFiles({ owner: ORG, repo: REPO, pull_number: prNumber, per_page: 100 }),
    octokit.issues.listComments({ owner: ORG, repo: REPO, issue_number: prNumber, per_page: 100 }),
  ])

  const changedFiles = files.map(f => ({ path: f.filename, status: f.status }))
  const defaultFile = changedFiles[0]?.path ?? ''

  // Fetch both versions of the default file
  const [leftFile, rightFile] = await Promise.all([
    getFileContent(octokit, defaultFile, 'main'),
    getFileContent(octokit, defaultFile, pr.head.ref),
  ])

  const comments = rawComments.map(c => parseRawComment({
    id: c.id,
    body: c.body ?? null,
    user: c.user,
    created_at: c.created_at,
  }))

  return (
    <ReviewClient
      prId={prNumber}
      prTitle={pr.title}
      prAuthor={pr.user?.login ?? 'unknown'}
      branch={pr.head.ref}
      changedFiles={changedFiles}
      defaultFile={defaultFile}
      defaultLeftContent={leftFile?.content ?? ''}
      defaultRightContent={rightFile?.content ?? ''}
      initialComments={comments}
    />
  )
}
