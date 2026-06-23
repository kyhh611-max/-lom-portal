'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { UserRole } from '@/types'

export function MemberRoleToggle({ memberId, currentRole }: { memberId: string; currentRole: UserRole }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (!confirm(`このメンバーを${currentRole === 'admin' ? '一般メンバー' : '常任理事'}に変更しますか？`)) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles')
      .update({ role: currentRole === 'admin' ? 'member' : 'admin' })
      .eq('id', memberId)
    setLoading(false)
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500 hover:text-blue-600 px-2"
      onClick={handleToggle} disabled={loading}>
      {loading ? '変更中...' : currentRole === 'admin' ? '→ メンバーに変更' : '→ 常任理事に変更'}
    </Button>
  )
}
