'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Announcement } from '@/types'

interface Props {
  mode: 'create' | 'edit'
  announcement?: Announcement
}

export function AnnouncementActions({ mode, announcement }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(announcement?.title ?? '')
  const [content, setContent] = useState(announcement?.content ?? '')
  const [isPinned, setIsPinned] = useState(announcement?.is_pinned ?? false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (mode === 'create') {
      await supabase.from('announcements').insert({
        title, content, is_pinned: isPinned, author_id: user!.id,
      })
    } else {
      await supabase.from('announcements').update({ title, content, is_pinned: isPinned })
        .eq('id', announcement!.id)
    }

    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('このお知らせを削除しますか？')) return
    const supabase = createClient()
    await supabase.from('announcements').delete().eq('id', announcement!.id)
    router.refresh()
  }

  if (mode === 'edit') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 flex-shrink-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <Pencil className="w-4 h-4 mr-2" />編集
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AnnouncementDialog open={open} setOpen={setOpen} title={title} setTitle={setTitle}
          content={content} setContent={setContent} isPinned={isPinned} setIsPinned={setIsPinned}
          loading={loading} onSubmit={handleSubmit} mode="edit" />
      </>
    )
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="w-4 h-4 mr-1" />新規作成
      </Button>
      <AnnouncementDialog open={open} setOpen={setOpen} title={title} setTitle={setTitle}
        content={content} setContent={setContent} isPinned={isPinned} setIsPinned={setIsPinned}
        loading={loading} onSubmit={handleSubmit} mode="create" />
    </>
  )
}

function AnnouncementDialog({ open, setOpen, title, setTitle, content, setContent,
  isPinned, setIsPinned, loading, onSubmit, mode }: {
  open: boolean; setOpen: (v: boolean) => void
  title: string; setTitle: (v: string) => void
  content: string; setContent: (v: string) => void
  isPinned: boolean; setIsPinned: (v: boolean) => void
  loading: boolean; onSubmit: (e: React.FormEvent) => void
  mode: 'create' | 'edit'
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'お知らせを作成' : 'お知らせを編集'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ann-title">タイトル</Label>
            <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ann-content">内容</Label>
            <Textarea id="ann-content" value={content} onChange={(e) => setContent(e.target.value)}
              rows={5} required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ann-pinned" checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)} className="rounded" />
            <Label htmlFor="ann-pinned" className="cursor-pointer">上部に固定する</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button type="submit" disabled={loading}>{loading ? '保存中...' : '保存'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
