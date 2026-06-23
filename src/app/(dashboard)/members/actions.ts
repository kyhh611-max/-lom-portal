'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function addMember(data: {
  full_name: string
  email: string
  password: string
  phone?: string
  position?: string
  department?: string
  join_year?: number
  role: 'admin' | 'member'
}) {
  // 呼び出し元が管理者かチェック
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return { error: '管理者権限が必要です' }

  // サービスロールでユーザー作成（メール確認なし）
  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.full_name },
  })

  if (createError) return { error: createError.message }

  // profiles をトリガーで自動作成後、追加情報を更新
  await admin.from('profiles').update({
    full_name: data.full_name,
    phone: data.phone || null,
    position: data.position || null,
    department: data.department || null,
    join_year: data.join_year || null,
    role: data.role,
  }).eq('id', created.user.id)

  return { error: null }
}

export async function deleteMember(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return { error: '管理者権限が必要です' }

  if (user.id === targetUserId) return { error: '自分自身は削除できません' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(targetUserId)
  if (error) return { error: error.message }

  return { error: null }
}
