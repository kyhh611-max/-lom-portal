'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteMember } from './actions'

export function DeleteMemberButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setLoading(true)
    setError('')
    const result = await deleteMember(memberId)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              会員を削除
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{memberName}</span> を削除しますか？
            </p>
            <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded p-2">
              削除するとログインできなくなります。この操作は取り消せません。
            </p>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                キャンセル
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                {loading ? '削除中...' : '削除する'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
