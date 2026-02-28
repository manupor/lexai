"use client"

import { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Indent, Outdent,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo, Redo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}

function ToolbarButton({ onClick, active, disabled, children, title }: ToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700',
        active && 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 hover:text-emerald-300',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
    >
      {children}
    </Button>
  )
}

interface EditorToolbarProps {
  editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-700 bg-[#1e293b] rounded-t-lg">
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Deshacer"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Rehacer"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6 bg-slate-700" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Título 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Título 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Título 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6 bg-slate-700" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Negrita"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Cursiva"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Subrayado"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Tachado"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6 bg-slate-700" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Lista sin orden"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Lista ordenada"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
        disabled={!editor.can().sinkListItem('listItem')}
        title="Aumentar sangría"
      >
        <Indent className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().liftListItem('listItem').run()}
        disabled={!editor.can().liftListItem('listItem')}
        title="Reducir sangría"
      >
        <Outdent className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6 bg-slate-700" />

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        title="Alinear izquierda"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        title="Centrar"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        title="Alinear derecha"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        active={editor.isActive({ textAlign: 'justify' })}
        title="Justificar"
      >
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}
