'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const Editor = dynamic(() => import('@/components/editor/editor').then(m => m.Editor), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Loading editor...</div>,
})

interface PR {
  number: number
  title: string
  state: string
}

interface Props {
  slug: string
  filePath: string
  branch: string
  initialContent: string
  initialSha: string | null
  userId: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function EditorPageClient({ slug, filePath, branch, initialContent, initialSha }: Props) {
  const router = useRouter()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [pr, setPr] = useState<PR | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const shaRef = useRef<string | null>(initialSha)

  // Load PR state on mount
  useEffect(() => {
    fetch(`/api/github/pr?branch=${encodeURIComponent(branch)}`)
      .then(r => r.json())
      .then(d => setPr(d.prs?.[0] ?? null))
      .catch(() => {})
  }, [branch])

  const ensureBranch = useCallback(async () => {
    const res = await fetch('/api/github/branch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
    if (!res.ok) throw new Error('Failed to create branch')
  }, [slug])

  const handleSave = useCallback(async (markdown: string) => {
    setSaveStatus('saving')
    try {
      await ensureBranch()
      const res = await fetch('/api/github/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content: markdown, branch, sha: shaRef.current }),
      })
      if (!res.ok) throw new Error('Save failed')

      const fileRes = await fetch(`/api/github/file?path=${encodeURIComponent(filePath)}&branch=${encodeURIComponent(branch)}`)
      if (fileRes.ok) {
        const data = await fileRes.json()
        shaRef.current = data.sha
      }

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [filePath, branch, ensureBranch])

  const handleSubmit = async () => {
    setLoadingAction('submit')
    try {
      const res = await fetch('/api/github/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch,
          title: `Review: ${slug} — ${filePath.split('/').pop()}`,
          body: `Draft changes to \`${filePath}\``,
        }),
      })
      const data = await res.json()
      if (res.ok && data.pr) setPr(data.pr)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleDiscard = async () => {
    if (!confirm('Discard this draft? This will delete the branch and close the PR if open.')) return
    setLoadingAction('discard')
    try {
      if (pr) {
        await fetch(`/api/github/pr/${pr.number}`, { method: 'DELETE' })
      }
      router.push(`/projects/${slug}`)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRebase = async () => {
    if (!pr) return
    setLoadingAction('rebase')
    try {
      await fetch(`/api/github/pr/${pr.number}/rebase`, { method: 'POST' })
    } finally {
      setLoadingAction(null)
    }
  }

  const handlePublish = async () => {
    if (!pr) return
    if (!confirm('Publish this content? It will be merged to main.')) return
    setLoadingAction('publish')
    try {
      const res = await fetch(`/api/github/pr/${pr.number}/merge`, { method: 'POST' })
      if (res.ok) router.push('/')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b px-4 py-2 flex items-center gap-3 bg-background flex-shrink-0 flex-wrap">
        <Link href={`/projects/${slug}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm font-medium truncate flex-1 min-w-0">{filePath}</span>

        {/* Save status */}
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle size={13} /> Saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle size={13} /> Save failed
          </span>
        )}

        {/* PR status badge */}
        {pr && <Badge variant="secondary">In Review · PR #{pr.number}</Badge>}

        {/* Workflow actions */}
        <div className="flex items-center gap-2">
          {pr && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRebase}
              disabled={!!loadingAction}
            >
              {loadingAction === 'rebase' ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
              Rebase to latest
            </Button>
          )}

          {!pr && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSubmit}
              disabled={!!loadingAction}
            >
              {loadingAction === 'submit' ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
              Submit for Review
            </Button>
          )}

          {pr && (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={!!loadingAction}
            >
              {loadingAction === 'publish' ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
              Approve & Publish
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDiscard}
            disabled={!!loadingAction}
            className="text-destructive hover:text-destructive"
          >
            {loadingAction === 'discard' ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
            Discard
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <Editor
          initialContent={initialContent}
          onSave={handleSave}
          saving={saveStatus === 'saving'}
        />
      </div>
    </div>
  )
}
