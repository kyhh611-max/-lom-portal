'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { UserPlus } from 'lucide-react'
import { POSITIONS, DEPARTMENTS } from '@/types'
import { addMember } from './actions'

const NONE_VALUE = '__none__'

export function AddMemberButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState(NONE_VALUE)
  const [department, setDepartment] = useState(NONE_VALUE)
  const [joinYear, setJoinYear] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')

  const resetForm = () => {
    setFullName(''); setEmail(''); setPassword(''); setPhone('')
    setPosition(NONE_VALUE); setDepartment(NONE_VALUE); setJoinYear(''); setRole('member')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await addMember({
      full_name: fullName,
      email,
      password,
      phone: phone || undefined,
      position: position === NONE_VALUE ? undefined : position,
      department: department === NONE_VALUE ? undefined : department,
      join_year: joinYear ? parseInt(joinYear) : undefined,
      role,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setOpen(false)
    resetForm()
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <UserPlus className="w-4 h-4 mr-1.5" />メンバーを追加
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>メンバーを追加</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="am-name">氏名 *</Label>
              <Input id="am-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="am-email">メールアドレス *</Label>
              <Input id="am-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="am-password">初期パスワード * （8文字以上）</Label>
              <Input id="am-password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="am-phone">電話番号</Label>
              <Input id="am-phone" type="tel" placeholder="090-0000-0000"
                value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>役職</Label>
              <Select value={position} onValueChange={(v) => setPosition(v ?? NONE_VALUE)}>
                <SelectTrigger><SelectValue placeholder="役職を選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>なし</SelectItem>
                  {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>所属委員会</Label>
              <Select value={department} onValueChange={(v) => setDepartment(v ?? NONE_VALUE)}>
                <SelectTrigger><SelectValue placeholder="所属を選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>なし</SelectItem>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="am-year">入会年</Label>
                <Input id="am-year" type="number" placeholder="2020" min="1950" max="2099"
                  value={joinYear} onChange={(e) => setJoinYear(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>権限</Label>
                <Select value={role} onValueChange={(v) => setRole(v as 'member' | 'admin')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">メンバー</SelectItem>
                    <SelectItem value="admin">常任理事</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm() }}>
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '追加中...' : 'メンバーを追加'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
