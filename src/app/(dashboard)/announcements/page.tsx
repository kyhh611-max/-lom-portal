import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Pin } from 'lucide-react'
import type { Announcement, Profile } from '@/types'
import { AnnouncementActions } from './announcement-actions'

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { const { redirect } = await import('next/navigation'); redirect('/login') }

  const [announcementsRes, profileRes] = await Promise.all([
    supabase
      .from('announcements')
      .select('*, author:profiles(id, full_name)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('role').eq('id', user!.id).single(),
  ])

  const announcements = (announcementsRes.data ?? []) as (Announcement & { author: Profile | null })[]
  const isAdmin = profileRes.data?.role === 'admin'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">お知らせ</h2>
          <p className="text-gray-500 mt-1">LOMからのお知らせを確認できます</p>
        </div>
        {isAdmin && <AnnouncementActions mode="create" />}
      </div>

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              お知らせはまだありません
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className={announcement.is_pinned ? 'border-blue-200 bg-blue-50/30' : ''}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {announcement.is_pinned && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
                          <Pin className="w-3 h-3" />固定
                        </Badge>
                      )}
                      <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {announcement.content}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                      <span>{announcement.author?.full_name ?? '不明'}</span>
                      <span>·</span>
                      <span>{format(new Date(announcement.created_at), 'yyyy年M月d日 HH:mm', { locale: ja })}</span>
                    </div>
                  </div>
                  {isAdmin && <AnnouncementActions mode="edit" announcement={announcement} />}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
