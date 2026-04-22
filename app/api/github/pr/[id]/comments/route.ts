import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getOctokit } from '@/lib/octokit'
import { listPRComments, addPRComment } from '@/lib/github'

const ANCHOR_RE = /<!--\s*anchor:\s*(\{.*?\})\s*-->/s

export interface ParsedComment {
  id: number
  body: string
  author: string
  createdAt: string
  anchor: { blockId: string; side: 'left' | 'right'; file: string } | null
}

function parseComment(c: { id: number; body: string; user: { login: string } | null; created_at: string }): ParsedComment {
  const match = c.body.match(ANCHOR_RE)
  let anchor = null
  let body = c.body
  if (match) {
    try { anchor = JSON.parse(match[1]) } catch { /* ignore */ }
    body = c.body.replace(ANCHOR_RE, '').trim()
  }
  return { id: c.id, body, author: c.user?.login ?? 'unknown', createdAt: c.created_at, anchor }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { id } = await params
  const prNumber = parseInt(id)
  if (isNaN(prNumber)) return NextResponse.json({ error: 'Invalid PR id' }, { status: 400 })

  const octokit = await getOctokit()
  const raw = await listPRComments(octokit, prNumber)
  const comments = raw.map(c => parseComment({
    id: c.id,
    body: c.body ?? '',
    user: c.user,
    created_at: c.created_at,
  }))

  return NextResponse.json({ comments })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { id } = await params
  const prNumber = parseInt(id)
  if (isNaN(prNumber)) return NextResponse.json({ error: 'Invalid PR id' }, { status: 400 })

  const { body, anchor } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const fullBody = anchor
    ? `<!-- anchor: ${JSON.stringify(anchor)} -->\n${body}`
    : body

  const octokit = await getOctokit()
  const commentId = await addPRComment(octokit, prNumber, fullBody)

  return NextResponse.json({ ok: true, commentId })
}
