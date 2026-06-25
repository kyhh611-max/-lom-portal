import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar, Megaphone, ClipboardList, Users } from 'lucide-react'
import Link from 'next/link'
import type { Announcement, Event } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }

  const [announcementsRes, upcomingEventsRes, membersRes, attendanceRes] = await Promise.all([
    supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('events')
      .select('*')
      .gte('start_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .limit(5),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('status', 'attending'),
  ])

  const announcements = (announcementsRes.data ?? []) as Announcement[]
  const upcomingEvents = (upcomingEventsRes.data ?? []) as Event[]
  const memberCount = membersRes.count ?? 0
  const attendingCount = attendanceRes.count ?? 0

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
        <p className="text-gray-500 mt-1">LOM活動の概要を確認できます</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="会員数" value={memberCount} bg="bg-blue-50" />
        <StatCard icon={<Calendar className="w-5 h-5 text-green-600" />} label="今後の予定" value={upcomingEvents.length} bg="bg-green-50" />
        <StatCard icon={<Megaphone className="w-5 h-5 text-orange-600" />} label="お知らせ" value={announcements.length} bg="bg-orange-50" />
        <StatCard icon={<ClipboardList className="w-5 h-5 text-purple-600" />} label="参加予定" value={attendingCount} bg="bg-purple-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">最新のお知らせ</CardTitle>
            <Link href="/announcements" className="text-sm text-blue-600 hover:underline">すべて見る</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">お知らせはありません</p>
            ) : (
              announcements.map((a) => (
                <Link key={a.id} href="/announcements" className="block hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                  <div className="flex items-start gap-2">
                    {a.is_pinned && <Badge variant="secondary" className="text-xs flex-shrink-0 mt-0.5">固定</Badge>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(a.created_at), 'M月d日', { locale: ja })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">今後の予定</CardTitle>
            <Link href="/schedule" className="text-sm text-blue-600 hover:underline">すべて見る</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">予定はありません</p>
            ) : (
              upcomingEvents.map((event) => (
                <Link key={event.id} href="/schedule" className="block hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-lg p-2 flex-shrink-0 text-center min-w-[48px]">
                      <p className="text-xs text-blue-600 font-medium leading-none">
                        {format(new Date(event.start_at), 'M月', { locale: ja })}
                      </p>
                      <p className="text-lg font-bold text-blue-700 leading-tight">
                        {format(new Date(event.start_at), 'd', { locale: ja })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(event.start_at), 'HH:mm', { locale: ja })} 〜{' '}
                        {format(new Date(event.end_at), 'HH:mm', { locale: ja })}
                        {event.location && ` ／ ${event.location}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`${bg} p-2.5 rounded-lg`}>{icon}</div>
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
