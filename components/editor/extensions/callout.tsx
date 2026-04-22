'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'

type CalloutType = 'note' | 'warning' | 'tip' | 'danger'

const styles: Record<CalloutType, string> = {
  note: 'border-blue-400 bg-blue-50 text-blue-900',
  warning: 'border-yellow-400 bg-yellow-50 text-yellow-900',
  tip: 'border-green-400 bg-green-50 text-green-900',
  danger: 'border-red-400 bg-red-50 text-red-900',
}

const labels: Record<CalloutType, string> = {
  note: 'Note',
  warning: 'Warning',
  tip: 'Tip',
  danger: 'Danger',
}

function CalloutView({ node, updateAttributes }: NodeViewProps) {
  const type = node.attrs.type as CalloutType
  return (
    <NodeViewWrapper>
      <div className={`my-4 border-l-4 rounded-r-md p-4 ${styles[type]}`}>
        <div className="flex items-center gap-2 mb-2">
          <select
            value={type}
            onChange={e => updateAttributes({ type: e.target.value })}
            className="text-xs font-semibold uppercase bg-transparent border-none outline-none cursor-pointer"
            contentEditable={false}
          >
            {(Object.keys(labels) as CalloutType[]).map(t => (
              <option key={t} value={t}>{labels[t]}</option>
            ))}
          </select>
        </div>
        <NodeViewContent className="prose prose-sm max-w-none" />
      </div>
    </NodeViewWrapper>
  )
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      type: { default: 'note' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },
})
