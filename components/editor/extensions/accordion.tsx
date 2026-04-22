'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { useState } from 'react'

function AccordionView({ node, updateAttributes }: NodeViewProps) {
  const [open, setOpen] = useState(true)

  return (
    <NodeViewWrapper>
      <div className="my-4 border rounded-md overflow-hidden">
        <div className="flex items-center bg-muted px-4 py-2 gap-2">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="text-sm font-medium"
            contentEditable={false}
          >
            {open ? '▾' : '▸'}
          </button>
          <input
            type="text"
            value={node.attrs.title}
            onChange={e => updateAttributes({ title: e.target.value })}
            placeholder="Accordion title..."
            className="flex-1 bg-transparent text-sm font-medium outline-none"
          />
        </div>
        {open && (
          <div className="p-4">
            <NodeViewContent className="prose prose-sm max-w-none" />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const Accordion = Node.create({
  name: 'accordion',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      title: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-accordion]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-accordion': '' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AccordionView)
  },
})
