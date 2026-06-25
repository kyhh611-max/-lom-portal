import { createClient } from '@/lib/supabase/server'
import type { Event, EventSession, Profile, Attendance } from '@/types'
import { AttendanceTabs } from './attendance-tabs'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { const { redirect } = await import('next/navigation'); redirect('/login') }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [eventsRes, membersRes, profileRes] = await Promise.all([
    supabase
      .from('events')
      .select('*, sessions:event_sessions(id, event_id, name, sort_order, created_at)')
      .gte('start_at', cutoff)
      .order('start_at', { ascending: true }),
    supabase.from('profiles').select('*').order('department').order('full_name'),
    supabase.from('profiles').select('role').eq('id', user!.id).single(),
  ])

  const events = (eventsRes.data ?? []) as (Event & { sessions: EventSession[] })[]
  const members = (membersRes.data ?? []) as Profile[]
  const isAdmin = profileRes.data?.role === 'admin'

  let attendanceRecords: Attendance[] = []
  if (events.length > 0) {
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .in('event_id', events.map((e) => e.id))
    attendanceRecords = (data ?? []) as Attendance[]
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">出欠入力</h2>
        <p className="text-gray-500 mt-1">例会・行事への出欠を登録・確認できます</p>
      </div>
      <AttendanceTabs
        events={events}
        members={members}
        attendanceRecords={attendanceRecords}
        currentUserId={user!.id}
        isAdmin={isAdmin}
      />
    </div>
  )
}
