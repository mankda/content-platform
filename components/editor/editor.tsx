'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Youtube from '@tiptap/extension-youtube'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Markdown } from 'tiptap-markdown'
import { common, createLowlight } from 'lowlight'
import { useEffect, useRef, useCallback } from 'react'
import { Callout } from './extensions/callout'
import { Accordion } from './extensions/accordion'
import { EditorToolbar } from './toolbar'

const lowlight = createLowlight(common)

interface EditorProps {
  initialContent: string
  onSave: (markdown: string) => Promise<void>
  saving?: boolean
}

export function Editor({ initialContent, onSave, saving }: EditorProps) {
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, link: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Image,
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Markdown.configure({ html: true, transformPastedText: true }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      Callout,
      Accordion,
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-neutral max-w-none min-h-[60vh] px-8 py-6 focus:outline-none',
      },
    },
  })

  const triggerSave = useCallback(() => {
    if (!editor) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markdown = (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown()
    onSave(markdown)
  }, [editor, onSave])

  // Autosave every 30s after last change
  useEffect(() => {
    if (!editor) return
    const handler = () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      autosaveTimer.current = setTimeout(triggerSave, 30_000)
    }
    editor.on('update', handler)
    return () => {
      editor.off('update', handler)
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [editor, triggerSave])

  // Cmd/Ctrl+S manual save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        triggerSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [triggerSave])

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editor={editor} onSave={triggerSave} saving={saving} />
      <div className="flex-1 overflow-y-auto bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
