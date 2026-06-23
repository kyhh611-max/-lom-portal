'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil } from 'lucide-react'
import { POSITIONS, DEPARTMENTS, type Profile } from '@/types'

const NONE_VALUE = '__none__'

export function EditProfileButton({ member, isAdmin }: { member: Profile; isAdmin: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState(member.full_name)
  const [phone, setPhone] = useState(member.phone ?? '')
  const [position, setPosition] = useState(member.position ?? NONE_VALUE)
  const [department, setDepartment] = useState(member.department ?? NONE_VALUE)
  const [joinYear, setJoinYear] = useState(member.join_year?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    const { error: updateError } = await supabase.from('profiles').update({
      full_name: fullName,
      phone: phone || null,
      position: position === NONE_VALUE ? null : position,
      department: department === NONE_VALUE ? null : department,
      join_year: joinYear ? parseInt(joinYear) : null,
    }).eq('id', member.id)

    if (updateError) {
      setError(updateError.message)
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
        className="h-8 w-8 text-gray-400 hover:text-blue-600 flex-shrink-0"
        onClick={() => setOpen(true)}
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>プロフィール編集</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ep-name">氏名</Label>
              <Input
                id="ep-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ep-phone">電話番号</Label>
              <Input
                id="ep-phone"
                type="tel"
                placeholder="090-0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>役職</Label>
              <Select value={position} onValueChange={(v) => setPosition(v ?? NONE_VALUE)}>
                <SelectTrigger>
                  <SelectValue placeholder="役職を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>なし</SelectItem>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>所属委員会</Label>
              <Select value={department} onValueChange={(v) => setDepartment(v ?? NONE_VALUE)}>
                <SelectTrigger>
                  <SelectValue placeholder="所属を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>なし</SelectItem>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ep-year">入会年</Label>
              <Input
                id="ep-year"
                type="number"
                placeholder="2020"
                min="1950"
                max="2099"
                value={joinYear}
                onChange={(e) => setJoinYear(e.target.value)}
              />
            </div>

            {isAdmin && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                常任理事として編集しています
              </p>
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
