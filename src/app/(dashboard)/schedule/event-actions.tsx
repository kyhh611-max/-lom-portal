'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, Pencil, Trash2, X, GripVertical, Paperclip, FileText, ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import type { Event, EventSession, EventAttachment } from '@/types'

const BUCKET = 'event-attachments'

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)}KB`
    : `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

interface Props {
  mode: 'create' | 'edit'
  event?: Event & { sessions?: EventSession[]; attachments?: EventAttachment[] }
}

function toDatetimeLocal(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm")
}
function toDateOnly(iso: string) {
  return format(new Date(iso), 'yyyy-MM-dd')
}

export function EventActions({ mode, event }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [isAllDay, setIsAllDay] = useState(event?.is_all_day ?? false)
  const [startAt, setStartAt] = useState(
    event ? (event.is_all_day ? toDateOnly(event.start_at) : toDatetimeLocal(event.start_at)) : ''
  )
  const [endAt, setEndAt] = useState(
    event ? (event.is_all_day ? toDateOnly(event.end_at) : toDatetimeLocal(event.end_at)) : ''
  )
  const [sessions, setSessions] = useState<string[]>(
    event?.sessions?.sort((a, b) => a.sort_order - b.sort_order).map((s) => s.name) ?? []
  )
  const [newSession, setNewSession] = useState('')

  // 添付ファイル管理
  const [removedIds, setRemovedIds] = useState(new Set<string>())
  const [newFiles, setNewFiles] = useState<File[]>([])

  const [loading, setLoading] = useState(false)

  const keepAttachments = (event?.attachments ?? []).filter((a) => !removedIds.has(a.id))

  const handleOpenDialog = () => {
    setRemovedIds(new Set())
    setNewFiles([])
    setOpen(true)
  }

  const handleAllDayToggle = (checked: boolean) => {
    setIsAllDay(checked)
    if (checked) {
      setStartAt(startAt ? startAt.slice(0, 10) : '')
      setEndAt(endAt ? endAt.slice(0, 10) : '')
    } else {
      setStartAt(startAt ? `${startAt}T09:00` : '')
      setEndAt(endAt ? `${endAt}T10:00` : '')
    }
  }

  const addSession = () => {
    const name = newSession.trim()
    if (!name) return
    setSessions((prev) => [...prev, name])
    setNewSession('')
  }

  const removeSession = (idx: number) => {
    setSessions((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const valid = files.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        alert(`${f.name} は10MBを超えています`)
        return false
      }
      return true
    })
    setNewFiles((prev) => [...prev, ...valid])
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const start = isAllDay
      ? new Date(`${startAt}T00:00:00`).toISOString()
      : new Date(startAt).toISOString()
    const end = isAllDay
      ? new Date(`${endAt}T23:59:59`).toISOString()
      : new Date(endAt).toISOString()

    let eventId: string

    if (mode === 'create') {
      const { data, error } = await supabase.from('events').insert({
        title,
        description: description || null,
        location: location || null,
        start_at: start,
        end_at: end,
        is_all_day: isAllDay,
        created_by: user!.id,
      }).select('id').single()
      if (error || !data) { setLoading(false); return }
      eventId = data.id
    } else {
      await supabase.from('events').update({
        title,
        description: description || null,
        location: location || null,
        start_at: start,
        end_at: end,
        is_all_day: isAllDay,
      }).eq('id', event!.id)
      eventId = event!.id
      await supabase.from('event_sessions').delete().eq('event_id', eventId)
    }

    // セッション
    if (sessions.length > 0) {
      await supabase.from('event_sessions').insert(
        sessions.map((name, i) => ({ event_id: eventId, name, sort_order: i }))
      )
    }

    // 削除対象の既存ファイルを処理
    const allAttachments = event?.attachments ?? []
    for (const id of removedIds) {
      const att = allAttachments.find((a) => a.id === id)
      if (att) {
        await supabase.storage.from(BUCKET).remove([att.storage_path])
        await supabase.from('event_attachments').delete().eq('id', id)
      }
    }

    // 新規ファイルをアップロード
    for (const file of newFiles) {
      const ext = file.name.split('.').pop() ?? 'bin'
      const safePath = `${eventId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(safePath, file)
      if (!uploadError) {
        await supabase.from('event_attachments').insert({
          event_id: eventId,
          filename: file.name,
          storage_path: safePath,
          mime_type: file.type || 'application/octet-stream',
          file_size: file.size,
        })
      }
    }

    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('この予定を削除しますか？')) return
    const supabase = createClient()
    if (event?.attachments?.length) {
      await supabase.storage.from(BUCKET).remove(event.attachments.map((a) => a.storage_path))
    }
    await supabase.from('events').delete().eq('id', event!.id)
    router.refresh()
  }

  const dialogContent = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '予定を追加' : '予定を編集'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ev-title">タイトル</Label>
            <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          {/* 終日トグル */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ev-allday"
              checked={isAllDay}
              onChange={(e) => handleAllDayToggle(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="ev-allday" className="cursor-pointer">終日</Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ev-start">開始{isAllDay ? '日' : '日時'}</Label>
              <Input
                id="ev-start"
                type={isAllDay ? 'date' : 'datetime-local'}
                step={isAllDay ? undefined : 900}
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-end">終了{isAllDay ? '日' : '日時'}</Label>
              <Input
                id="ev-end"
                type={isAllDay ? 'date' : 'datetime-local'}
                step={isAllDay ? undefined : 900}
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-location">場所（任意）</Label>
            <Input id="ev-location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-desc">説明（任意）</Label>
            <Textarea id="ev-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          {/* セッション管理 */}
          <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">出欠セッション</Label>
              <span className="text-xs text-gray-400">複数の出欠を取る場合に追加</span>
            </div>
            {sessions.length > 0 && (
              <div className="space-y-1.5">
                {sessions.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white rounded-md border px-2 py-1.5">
                    <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    <span className="flex-1 text-sm">{name}</span>
                    <button type="button" onClick={() => removeSession(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="例: AM・PM・懇親会・昼食"
                value={newSession}
                onChange={(e) => setNewSession(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSession() } }}
                className="text-sm h-8"
              />
              <Button type="button" variant="outline" size="sm" onClick={addSession} className="flex-shrink-0">
                <Plus className="w-3.5 h-3.5" />追加
              </Button>
            </div>
            {sessions.length === 0 && (
              <p className="text-xs text-gray-400">セッションなし → イベント全体で1つの出欠</p>
            )}
          </div>

          {/* 添付ファイル */}
          <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />添付ファイル
              </Label>
              <span className="text-xs text-gray-400">PDF・画像（各10MB以内）</span>
            </div>

            {/* 既存ファイル */}
            {keepAttachments.length > 0 && (
              <div className="space-y-1">
                {keepAttachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 bg-white rounded border px-2 py-1.5">
                    {att.mime_type.startsWith('image/')
                      ? <ImageIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      : <FileText className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    }
                    <span className="flex-1 text-xs text-gray-700 truncate">{att.filename}</span>
                    {att.file_size && <span className="text-xs text-gray-400">{formatSize(att.file_size)}</span>}
                    <button
                      type="button"
                      onClick={() => setRemovedIds((prev) => new Set([...prev, att.id]))}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 新規ファイル（追加予定） */}
            {newFiles.length > 0 && (
              <div className="space-y-1">
                {newFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-blue-50 rounded border border-blue-200 px-2 py-1.5">
                    {file.type.startsWith('image/')
                      ? <ImageIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      : <FileText className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    }
                    <span className="flex-1 text-xs text-gray-700 truncate">{file.name}</span>
                    <span className="text-xs text-blue-500">{formatSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="cursor-pointer inline-block">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="sr-only"
                onChange={handleFileSelect}
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                <Plus className="w-3.5 h-3.5" />ファイルを選択
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button type="submit" disabled={loading}>{loading ? '保存中...' : '保存'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )

  if (mode === 'edit') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleOpenDialog}>
              <Pencil className="w-4 h-4 mr-2" />編集
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {dialogContent}
      </>
    )
  }

  return (
    <>
      <Button onClick={handleOpenDialog} size="sm">
        <Plus className="w-4 h-4 mr-1" />予定を追加
      </Button>
      {dialogContent}
    </>
  )
}
