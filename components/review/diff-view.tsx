'use client'

import { useState, useMemo } from 'react'
import { MessageSquare } from 'lucide-react'
import { MdRenderer } from './md-renderer'
import { CommentPanel } from './comment-panel'
import { diffBlocks, type DiffBlock } from '@/lib/diff'
import type { ParsedComment } from '@/app/api/github/pr/[id]/comments/route'

const statusStyles: Record<string, string> = {
  added: 'border-l-4 border-green-400 bg-green-50',
  changed: 'border-l-4 border-yellow-400 bg-yellow-50',
  deleted: 'border-l-4 border-red-400 bg-red-50 line-through opacity-60',
  unchanged: '',
}

interface ActiveBlock {
  blockId: string
  side: 'left' | 'right'
}

interface Props {
  prId: number
  file: string
  leftContent: string
  rightContent: string
  initialComments: ParsedComment[]
}

export function DiffView({ prId, file, leftContent, rightContent, initialComments }: Props) {
  const [comments, setComments] = useState<ParsedComment[]>(initialComments)
  const [activeBlock, setActiveBlock] = useState<ActiveBlock | null>(null)

  const blocks = useMemo(() => diffBlocks(leftContent, rightContent), [leftContent, rightContent])

  const commentsByBlock = useMemo(() => {
    const map = new Map<string, ParsedComment[]>()
    for (const c of comments) {
      if (!c.anchor) continue
      const key = c.anchor.blockId
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    return map
  }, [comments])

  const handleBlockClick = (blockId: string, side: 'left' | 'right') => {
    setActiveBlock(prev =>
      prev?.blockId === blockId && prev.side === side ? null : { blockId, side }
    )
  }

  const handleCommentAdded = (comment: ParsedComment) => {
    setComments(prev => [...prev, comment])
  }

  return (
    <div className="flex h-full">
      {/* Side-by-side panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — Published (main) */}
        <div className="flex-1 overflow-y-auto border-r">
          <div className="sticky top-0 bg-muted border-b px-4 py-2 text-xs font-semibold text-muted-foreground">
            PUBLISHED (main)
          </div>
          <div className="divide-y">
            {blocks.map(block => (
              <BlockCell
                key={`left-${block.id}`}
                block={block}
                side="left"
                content={block.leftContent}
                status={block.status === 'deleted' ? 'deleted' : block.status === 'changed' ? 'changed' : block.status === 'added' ? null : 'unchanged'}
                commentCount={commentsByBlock.get(block.id)?.filter(c => c.anchor?.side === 'left').length ?? 0}
                isActive={activeBlock?.blockId === block.id && activeBlock.side === 'left'}
                onClick={() => block.leftContent && handleBlockClick(block.id, 'left')}
              />
            ))}
          </div>
        </div>

        {/* Right — Proposed (draft) */}
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 bg-muted border-b px-4 py-2 text-xs font-semibold text-muted-foreground">
            PROPOSED (draft)
          </div>
          <div className="divide-y">
            {blocks.map(block => (
              <BlockCell
                key={`right-${block.id}`}
                block={block}
                side="right"
                content={block.rightContent}
                status={block.status === 'added' ? 'added' : block.status === 'changed' ? 'changed' : block.status === 'deleted' ? null : 'unchanged'}
                commentCount={commentsByBlock.get(block.id)?.filter(c => c.anchor?.side === 'right').length ?? 0}
                isActive={activeBlock?.blockId === block.id && activeBlock.side === 'right'}
                onClick={() => block.rightContent && handleBlockClick(block.id, 'right')}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Comment panel */}
      {activeBlock && (
        <CommentPanel
          prId={prId}
          blockId={activeBlock.blockId}
          side={activeBlock.side}
          file={file}
          comments={comments}
          onClose={() => setActiveBlock(null)}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  )
}

interface BlockCellProps {
  block: DiffBlock
  side: 'left' | 'right'
  content: string | null
  status: 'added' | 'changed' | 'deleted' | 'unchanged' | null
  commentCount: number
  isActive: boolean
  onClick: () => void
}

function BlockCell({ content, status, commentCount, isActive, onClick }: BlockCellProps) {
  if (content === null) {
    return <div className="px-4 py-3 min-h-[48px] bg-muted/30" />
  }

  return (
    <div
      className={`group relative px-4 py-3 cursor-pointer transition-colors
        ${status ? statusStyles[status] : ''}
        ${isActive ? 'ring-2 ring-primary ring-inset' : 'hover:bg-muted/40'}
      `}
      onClick={onClick}
    >
      <MdRenderer content={content} />

      {/* Comment badge */}
      <button
        className={`absolute top-2 right-2 flex items-center gap-1 text-xs rounded-full px-2 py-0.5 transition-opacity
          ${commentCount > 0
            ? 'bg-primary text-primary-foreground opacity-100'
            : 'bg-muted text-muted-foreground opacity-0 group-hover:opacity-100'
          }`}
        onClick={e => { e.stopPropagation(); onClick() }}
      >
        <MessageSquare size={11} />
        {commentCount > 0 && commentCount}
      </button>
    </div>
  )
}
