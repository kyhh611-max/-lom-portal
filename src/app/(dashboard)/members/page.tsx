import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'
import { AddMemberButton } from './add-member-button'
import { MembersGrid } from './members-grid'

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { const { redirect } = await import('next/navigation'); redirect('/login') }

  const [membersRes, profileRes] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('profiles').select('role').eq('id', user!.id).single(),
  ])

  const members = (membersRes.data ?? []) as Profile[]
  const isAdmin = profileRes.data?.role === 'admin'

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">会員管理</h2>
          <p className="text-gray-500 mt-1">LOM会員の一覧です</p>
        </div>
        {isAdmin && <AddMemberButton />}
      </div>

      <MembersGrid members={members} isAdmin={isAdmin} currentUserId={user!.id} />
    </div>
  )
}
