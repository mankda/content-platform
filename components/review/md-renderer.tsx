'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { ComponentPropsWithoutRef } from 'react'

const calloutStyles: Record<string, string> = {
  note: 'border-blue-400 bg-blue-50 text-blue-900',
  warning: 'border-yellow-400 bg-yellow-50 text-yellow-900',
  tip: 'border-green-400 bg-green-50 text-green-900',
  danger: 'border-red-400 bg-red-50 text-red-900',
}

// Custom components for MDX-like elements rendered via rehype-raw
const components = {
  callout: ({ type, children }: ComponentPropsWithoutRef<'div'> & { type?: string }) => (
    <div className={`my-3 border-l-4 rounded-r p-3 text-sm ${calloutStyles[type ?? 'note'] ?? calloutStyles.note}`}>
      <span className="font-semibold uppercase text-xs mr-2">{type ?? 'note'}</span>
      {children}
    </div>
  ),
  accordion: ({ title, children }: ComponentPropsWithoutRef<'div'> & { title?: string }) => (
    <div className="my-3 border rounded overflow-hidden">
      <div className="bg-muted px-3 py-2 text-sm font-medium">{title}</div>
      <div className="p-3 text-sm">{children}</div>
    </div>
  ),
  // Style standard elements
  h1: ({ children }: ComponentPropsWithoutRef<'h1'>) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
  h2: ({ children }: ComponentPropsWithoutRef<'h2'>) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
  h3: ({ children }: ComponentPropsWithoutRef<'h3'>) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
  p: ({ children }: ComponentPropsWithoutRef<'p'>) => <p className="my-2 text-sm leading-relaxed">{children}</p>,
  ul: ({ children }: ComponentPropsWithoutRef<'ul'>) => <ul className="my-2 ml-4 list-disc text-sm space-y-1">{children}</ul>,
  ol: ({ children }: ComponentPropsWithoutRef<'ol'>) => <ol className="my-2 ml-4 list-decimal text-sm space-y-1">{children}</ol>,
  blockquote: ({ children }: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="border-l-4 border-muted-foreground pl-3 my-2 text-sm text-muted-foreground italic">{children}</blockquote>
  ),
  code: ({ children, className }: ComponentPropsWithoutRef<'code'>) =>
    className ? (
      <code className="block bg-muted rounded p-3 text-xs font-mono my-2 overflow-x-auto">{children}</code>
    ) : (
      <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
    ),
  table: ({ children }: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-2 overflow-x-auto">
      <table className="text-xs border-collapse w-full">{children}</table>
    </div>
  ),
  th: ({ children }: ComponentPropsWithoutRef<'th'>) => <th className="border px-2 py-1 bg-muted font-semibold text-left">{children}</th>,
  td: ({ children }: ComponentPropsWithoutRef<'td'>) => <td className="border px-2 py-1">{children}</td>,
}

interface Props {
  content: string
}

export function MdRenderer({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={components as never}
    >
      {content}
    </ReactMarkdown>
  )
}
