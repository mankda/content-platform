'use client'

import { useState } from 'react'
import { X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ParsedComment } from '@/app/api/github/pr/[id]/comments/route'

interface Props {
  prId: number
  blockId: string
  side: 'left' | 'right'
  file: string
  comments: ParsedComment[]
  onClose: () => void
  onCommentAdded: (comment: ParsedComment) => void
}

export function CommentPanel({ prId, blockId, side, file, comments, onClose, onCommentAdded }: Props) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/github/pr/${prId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: text,
          anchor: { blockId, side, file },
        }),
      })
      if (res.ok) {
        onCommentAdded({
          id: Date.now(),
          body: text,
          author: 'you',
          createdAt: new Date().toISOString(),
          anchor: { blockId, side, file },
        })
        setText('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const blockComments = comments.filter(c => c.anchor?.blockId === blockId)

  return (
    <div className="w-72 flex-shrink-0 border-l bg-background flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="text-sm font-medium">Comments</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {blockComments.length === 0 && (
          <p className="text-xs text-muted-foreground">No comments on this block yet.</p>
        )}
        {blockComments.map(c => (
          <div key={c.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">@{c.author}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm bg-muted rounded p-2">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="border-t p-3 space-y-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Leave a comment..."
          rows={3}
          className="w-full text-sm border rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
          }}
        />
        <Button size="sm" className="w-full" onClick={handleSubmit} disabled={submitting || !text.trim()}>
          <Send size={13} className="mr-1" />
          {submitting ? 'Posting...' : 'Comment'}
        </Button>
      </div>
    </div>
  )
}
