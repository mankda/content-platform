'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ParsedComment } from '@/app/api/github/pr/[id]/comments/route'

const DiffView = dynamic(() => import('@/components/review/diff-view').then(m => m.DiffView), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Loading diff...</div>,
})

interface Props {
  prId: number
  prTitle: string
  prAuthor: string
  branch: string
  changedFiles: { path: string; status: string }[]
  defaultFile: string
  defaultLeftContent: string
  defaultRightContent: string
  initialComments: ParsedComment[]
}

export function ReviewClient({
  prId, prTitle, prAuthor, branch,
  changedFiles, defaultFile,
  defaultLeftContent, defaultRightContent,
  initialComments,
}: Props) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState(defaultFile)
  const [leftContent, setLeftContent] = useState(defaultLeftContent)
  const [rightContent, setRightContent] = useState(defaultRightContent)
  const [loadingFile, setLoadingFile] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const switchFile = useCallback(async (path: string) => {
    if (path === selectedFile) return
    setLoadingFile(true)
    setSelectedFile(path)
    try {
      const [l, r] = await Promise.all([
        fetch(`/api/github/file?path=${encodeURIComponent(path)}&branch=main`).then(r => r.json()),
        fetch(`/api/github/file?path=${encodeURIComponent(path)}&branch=${encodeURIComponent(branch)}`).then(r => r.json()),
      ])
      setLeftContent(l.content ?? '')
      setRightContent(r.content ?? '')
    } finally {
      setLoadingFile(false)
    }
  }, [selectedFile, branch])

  const handleRebase = async () => {
    setLoadingAction('rebase')
    try {
      await fetch(`/api/github/pr/${prId}/rebase`, { method: 'POST' })
    } finally {
      setLoadingAction(null)
    }
  }

  const handlePublish = async () => {
    if (!confirm('Publish this content? It will be merged to main.')) return
    setLoadingAction('publish')
    try {
      const res = await fetch(`/api/github/pr/${prId}/merge`, { method: 'POST' })
      if (res.ok) router.push('/')
    } finally {
      setLoadingAction(null)
    }
  }

  const fileStatusBadge = (status: string) => {
    if (status === 'added') return <Badge variant="outline" className="text-green-600 border-green-400 text-[10px]">new</Badge>
    if (status === 'removed') return <Badge variant="outline" className="text-red-600 border-red-400 text-[10px]">deleted</Badge>
    return <Badge variant="outline" className="text-yellow-600 border-yellow-400 text-[10px]">modified</Badge>
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b px-4 py-2 flex items-center gap-3 bg-background flex-shrink-0">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{prTitle}</p>
          <p className="text-xs text-muted-foreground">PR #{prId} by @{prAuthor}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleRebase} disabled={!!loadingAction}>
            {loadingAction === 'rebase'
              ? <Loader2 size={13} className="animate-spin mr-1" />
              : <RefreshCw size={13} className="mr-1" />}
            Rebase to latest
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={!!loadingAction}>
            {loadingAction === 'publish' && <Loader2 size={13} className="animate-spin mr-1" />}
            Approve & Publish
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* File list sidebar */}
        <aside className="w-56 border-r flex-shrink-0 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase border-b">
            Changed files
          </div>
          <ul>
            {changedFiles.map(f => (
              <li key={f.path}>
                <button
                  onClick={() => switchFile(f.path)}
                  className={`w-full text-left flex items-start gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors
                    ${selectedFile === f.path ? 'bg-muted font-medium' : ''}`}
                >
                  <FileText size={12} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <span className="break-all flex-1">{f.path.split('/').pop()}</span>
                  {fileStatusBadge(f.status)}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Diff area */}
        <div className="flex-1 overflow-hidden">
          {loadingFile ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DiffView
              key={selectedFile}
              prId={prId}
              file={selectedFile}
              leftContent={leftContent}
              rightContent={rightContent}
              initialComments={initialComments}
            />
          )}
        </div>
      </div>
    </div>
  )
}
