'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, Building2, Award } from 'lucide-react'
import type { Profile } from '@/types'
import { POSITIONS, DEPARTMENTS } from '@/types'
import { MemberRoleToggle } from './member-role-toggle'
import { EditProfileButton } from './edit-profile-button'
import { DeleteMemberButton } from './delete-member-button'

type SortMode = 'position' | 'department' | 'name'
type FilterMode = 'all' | typeof DEPARTMENTS[number]

export function MembersGrid({ members, isAdmin, currentUserId }: {
  members: Profile[]
  isAdmin: boolean
  currentUserId: string
}) {
  const [sortMode, setSortMode] = useState<SortMode>('position')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      let cmp = 0

      if (sortMode === 'position') {
        const ai = POSITIONS.indexOf(a.position as typeof POSITIONS[number])
        const bi = POSITIONS.indexOf(b.position as typeof POSITIONS[number])
        const aHas = ai !== -1
        const bHas = bi !== -1
        if (aHas && bHas) {
          cmp = ai - bi
        } else if (aHas) {
          cmp = -1
        } else if (bHas) {
          cmp = 1
        } else {
          const di = DEPARTMENTS.indexOf(a.department as typeof DEPARTMENTS[number])
          const dj = DEPARTMENTS.indexOf(b.department as typeof DEPARTMENTS[number])
          cmp = (di === -1 ? 99 : di) - (dj === -1 ? 99 : dj)
        }
      } else if (sortMode === 'department') {
        const di = DEPARTMENTS.indexOf(a.department as typeof DEPARTMENTS[number])
        const dj = DEPARTMENTS.indexOf(b.department as typeof DEPARTMENTS[number])
        cmp = (di === -1 ? 99 : di) - (dj === -1 ? 99 : dj)
        if (cmp === 0) {
          const ai = POSITIONS.indexOf(a.position as typeof POSITIONS[number])
          const bi = POSITIONS.indexOf(b.position as typeof POSITIONS[number])
          cmp = (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        }
      }

      if (cmp === 0) cmp = a.full_name.localeCompare(b.full_name, 'ja')
      return cmp
    })
  }, [members, sortMode])

  const filteredMembers = filterMode === 'all'
    ? sortedMembers
    : sortedMembers.filter((m) => m.department === filterMode)

  const sortButtons: { mode: SortMode; label: string }[] = [
    { mode: 'position', label: '役職順' },
    { mode: 'department', label: '委員会順' },
    { mode: 'name', label: '名前順' },
  ]

  const filterButtons: { mode: FilterMode; label: string }[] = [
    { mode: 'all', label: '全員' },
    ...DEPARTMENTS.map((d) => ({ mode: d as FilterMode, label: d })),
  ]

  return (
    <div className="space-y-4">
      {/* ソート切り替え */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">並び順:</span>
        <div className="flex gap-1">
          {sortButtons.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                sortMode === mode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 委員会フィルター */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">絞り込み:</span>
        <div className="flex flex-wrap gap-1">
          {filterButtons.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterMode === mode
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {filteredMembers.length}名{filterMode !== 'all' && ` / 全${members.length}名`}
        </span>
      </div>

      {/* カード一覧 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            isAdmin={isAdmin}
            isSelf={member.id === currentUserId}
          />
        ))}
      </div>
    </div>
  )
}

function MemberCard({ member, isAdmin, isSelf }: {
  member: Profile
  isAdmin: boolean
  isSelf: boolean
}) {
  const canEdit = isAdmin || isSelf

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <p className="font-semibold text-gray-900">{member.full_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <Badge
                variant="outline"
                className={member.role === 'admin'
                  ? 'text-blue-700 border-blue-200 bg-blue-50 text-xs py-0'
                  : 'text-gray-500 text-xs py-0'}
              >
                {member.role === 'admin' ? '常任理事' : 'メンバー'}
              </Badge>
              {isSelf && (
                <Badge variant="secondary" className="text-xs py-0">自分</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {canEdit && <EditProfileButton member={member} isAdmin={isAdmin} />}
            {isAdmin && !isSelf && (
              <DeleteMemberButton memberId={member.id} memberName={member.full_name} />
            )}
          </div>
        </div>

        <div className="space-y-2">
          {member.position && (
            <div className="flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="font-medium text-gray-800">{member.position}</span>
            </div>
          )}
          {member.department && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-gray-700">{member.department}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
          {member.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{member.phone}</span>
            </div>
          )}
          {member.join_year && (
            <p className="text-xs text-gray-400">{member.join_year}年入会</p>
          )}
        </div>

        {isAdmin && !isSelf && (
          <div className="mt-4 pt-3 border-t">
            <MemberRoleToggle memberId={member.id} currentRole={member.role} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
