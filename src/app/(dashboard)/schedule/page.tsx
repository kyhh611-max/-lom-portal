import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, isSameDay, isSameMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import { MapPin, Clock, Layers, FileText, ImageIcon, Paperclip } from 'lucide-react'
import type { Event, EventSession, EventAttachment, Profile } from '@/types'
import { EventActions } from './event-actions'

function LinkifiedText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/)
  return (
    <p className={className}>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800 break-all">
            {part}
          </a>
        ) : (
          part
        )
      )}
    </p>
  )
}

function DateBadge({ startAt, endAt }: { startAt: string; endAt: string }) {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const multiDay = !isSameDay(start, end)

  if (!multiDay) {
    return (
      <div className="bg-blue-100 rounded-xl p-3 flex-shrink-0 text-center min-w-[56px]">
        <p className="text-xs text-blue-600 font-medium leading-none">
          {format(start, 'M月', { locale: ja })}
        </p>
        <p className="text-2xl font-bold text-blue-700 leading-tight">
          {format(start, 'd', { locale: ja })}
        </p>
        <p className="text-xs text-blue-500">
          {format(start, 'EEE', { locale: ja })}
        </p>
      </div>
    )
  }

  // 複数日表示
  const sameMonth = isSameMonth(start, end)
  return (
    <div className="bg-blue-100 rounded-xl p-3 flex-shrink-0 text-center min-w-[64px]">
      {sameMonth ? (
        <>
          <p className="text-xs text-blue-600 font-medium leading-none">
            {format(start, 'M月', { locale: ja })}
          </p>
          <p className="text-base font-bold text-blue-700 leading-snug whitespace-nowrap">
            {format(start, 'd')}～{format(end, 'd')}
          </p>
          <p className="text-xs text-blue-500 whitespace-nowrap">
            {format(start, 'EEE', { locale: ja })}～{format(end, 'EEE', { locale: ja })}
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-bold text-blue-700 whitespace-nowrap">
            {format(start, 'M/d', { locale: ja })}
          </p>
          <p className="text-xs text-blue-500">～</p>
          <p className="text-sm font-bold text-blue-700 whitespace-nowrap">
            {format(end, 'M/d', { locale: ja })}
          </p>
        </>
      )}
    </div>
  )
}

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const BUCKET = 'event-attachments'

function getPublicUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
}

type FullEvent = Event & {
  creator: Profile | null
  sessions: EventSession[]
  attachments: EventAttachment[]
}

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { const { redirect } = await import('next/navigation'); redirect('/login') }

  const [eventsRes, profileRes] = await Promise.all([
    supabase
      .from('events')
      .select('*, creator:profiles(id, full_name), sessions:event_sessions(id, event_id, name, sort_order, created_at), attachments:event_attachments(*)')
      .order('start_at', { ascending: true }),
    supabase.from('profiles').select('role').eq('id', user!.id).single(),
  ])

  const events = (eventsRes.data ?? []) as FullEvent[]
  const isAdmin = profileRes.data?.role === 'admin'
  const now = new Date()
  const upcoming = events.filter((e) => new Date(e.end_at) >= now)
  const past = events.filter((e) => new Date(e.end_at) < now)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">スケジュール</h2>
          <p className="text-gray-500 mt-1">例会・行事の予定一覧です</p>
        </div>
        {isAdmin && <EventActions mode="create" />}
      </div>
      <EventList title="今後の予定" events={upcoming} isAdmin={isAdmin} isPast={false} />
      {past.length > 0 && <EventList title="過去の予定" events={past} isAdmin={isAdmin} isPast={true} />}
    </div>
  )
}

function EventList({ title, events, isAdmin, isPast }: {
  title: string
  events: FullEvent[]
  isAdmin: boolean
  isPast: boolean
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{title}</h3>
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500 text-sm">
            {isPast ? '過去の予定はありません' : '今後の予定はありません'}
          </CardContent>
        </Card>
      ) : (
        events.map((event) => {
          const sortedSessions = [...(event.sessions ?? [])].sort((a, b) => a.sort_order - b.sort_order)
          const attachments = event.attachments ?? []
          const images = attachments.filter((a) => a.mime_type.startsWith('image/'))
          const pdfs = attachments.filter((a) => !a.mime_type.startsWith('image/'))

          return (
            <Card key={event.id} className={isPast ? 'opacity-60' : ''}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 flex-1 min-w-0">
                    {/* 日付バッジ */}
                    <DateBadge startAt={event.start_at} endAt={event.end_at} />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      {event.description && (
                        <LinkifiedText text={event.description} className="text-sm text-gray-600 mt-1" />
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        {event.is_all_day ? (
                          <Badge variant="secondary" className="text-xs">終日</Badge>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(event.start_at), 'HH:mm', { locale: ja })}
                            {' 〜 '}
                            {format(new Date(event.end_at), 'HH:mm', { locale: ja })}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />{event.location}
                          </span>
                        )}
                      </div>

                      {/* セッションバッジ */}
                      {sortedSessions.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Layers className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          {sortedSessions.map((s) => (
                            <Badge key={s.id} variant="outline" className="text-xs text-indigo-600 border-indigo-200 bg-indigo-50 py-0">
                              {s.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* 添付ファイル */}
                      {attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {/* 画像サムネイル */}
                          {images.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {images.map((att) => (
                                <a
                                  key={att.id}
                                  href={getPublicUrl(att.storage_path)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={getPublicUrl(att.storage_path)}
                                    alt={att.filename}
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
                                  />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* PDFリンク */}
                          {pdfs.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {pdfs.map((att) => (
                                <a
                                  key={att.id}
                                  href={getPublicUrl(att.storage_path)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-red-300 transition-colors text-xs text-gray-700 hover:text-red-700 max-w-[200px]"
                                >
                                  <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                                  <span className="truncate">{att.filename}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isPast && <Badge variant="secondary" className="text-xs">終了</Badge>}
                    {attachments.length > 0 && (
                      <span className="text-gray-400" title={`添付 ${attachments.length}件`}>
                        <Paperclip className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {isAdmin && <EventActions mode="edit" event={event} />}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
