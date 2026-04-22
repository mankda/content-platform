'use client'

import { type Editor } from '@tiptap/react'
import { Bold, Italic, List, ListOrdered, Quote, Code, Minus, Table, Link, Image, AlignLeft, AlignCenter, AlignRight, ListTodo, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface ToolbarProps {
  editor: Editor | null
  onSave: () => void
  saving?: boolean
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-muted transition-colors ${active ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
    >
      {children}
    </button>
  )
}

export function EditorToolbar({ editor, onSave, saving }: ToolbarProps) {
  if (!editor) return null

  const addImage = () => {
    const url = window.prompt('Image URL')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const addLink = () => {
    const url = window.prompt('Link URL')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const insertCallout = () => {
    editor.chain().focus().insertContent({
      type: 'callout',
      attrs: { type: 'note' },
      content: [{ type: 'paragraph' }],
    }).run()
  }

  const insertAccordion = () => {
    editor.chain().focus().insertContent({
      type: 'accordion',
      attrs: { title: '' },
      content: [{ type: 'paragraph' }],
    }).run()
  }

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b bg-background flex-wrap sticky top-0 z-10">
      {/* Marks */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
        <Code size={15} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Headings */}
      {([1, 2, 3] as const).map(level => (
        <ToolbarButton
          key={level}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          active={editor.isActive('heading', { level })}
          title={`Heading ${level}`}
        >
          <span className="text-xs font-bold">H{level}</span>
        </ToolbarButton>
      ))}

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
        <ListOrdered size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Task list">
        <ListTodo size={15} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Blocks */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
        <Quote size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
        <Code size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        <Minus size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Table">
        <Table size={15} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
        <AlignLeft size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
        <AlignCenter size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
        <AlignRight size={15} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Media */}
      <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Link">
        <Link size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="Image">
        <Image size={15} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Custom blocks */}
      <button
        type="button"
        onClick={insertCallout}
        title="Callout"
        className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors text-muted-foreground"
      >
        Callout
      </button>
      <button
        type="button"
        onClick={insertAccordion}
        title="Accordion"
        className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors text-muted-foreground"
      >
        Accordion
      </button>

      <div className="flex-1" />

      {/* Save */}
      <Button size="sm" onClick={onSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}
