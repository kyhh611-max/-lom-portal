'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'attending' | 'absent' | 'undecided'

interface Props {
  eventId: string
  sessionId?: string | null
  currentStatus: Status
  attendanceId?: string
  userId: string
}

const buttons: { status: Status; label: string; icon: typeof CheckCircle2; activeClass: string }[] = [
  { status: 'attending', label: '出席', icon: CheckCircle2, activeClass: 'bg-green-600 hover:bg-green-700 text-white border-green-600' },
  { status: 'absent',    label: '欠席', icon: XCircle,      activeClass: 'bg-red-500 hover:bg-red-600 text-white border-red-500' },
  { status: 'undecided', label: '未定', icon: HelpCircle,   activeClass: 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500' },
]

export function AttendanceButton({ eventId, sessionId, currentStatus, attendanceId, userId }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>(currentStatus)
  const [loading, setLoading] = useState(false)

  const handleClick = async (newStatus: Status) => {
    if (newStatus === status || loading) return
    setLoading(true)
    const supabase = createClient()

    if (!attendanceId) {
      await supabase.from('attendance').insert({
        event_id: eventId,
        session_id: sessionId ?? null,
        user_id: userId,
        status: newStatus,
      })
    } else {
      await supabase.from('attendance').update({ status: newStatus }).eq('id', attendanceId)
    }

    setStatus(newStatus)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      {buttons.map(({ status: s, label, icon: Icon, activeClass }) => (
        <Button
          key={s}
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => handleClick(s)}
          className={cn('flex-1 gap-1.5 transition-all', status === s ? activeClass : 'text-gray-600')}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Button>
      ))}
    </div>
  )
}
