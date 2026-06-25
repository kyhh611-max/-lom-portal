'use client'

import { useState, useMemo, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Clock, MapPin, CheckCircle2, XCircle, HelpCircle, Download, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { Event, EventSession, Profile, Attendance, AttendanceStatus } from '@/types'
import { DEPARTMENTS, POSITIONS } from '@/types'
import { AttendanceButton } from './attendance-button'

interface Props {
  events: (Event & { sessions: EventSession[] })[]
  members: Profile[]
  attendanceRecords: Attendance[]
  currentUserId: string
  isAdmin: boolean
}

const statusLabel: Record<AttendanceStatus, string> = { attending: '○', absent: '×', undecided: '△' }
const statusColor: Record<AttendanceStatus, string> = {
  attending: 'text-green-600 font-bold',
  absent:    'text-red-500 font-bold',
  undecided: 'text-gray-400',
}

// 集計用カラム定義（セッションあり→セッション単位、なし→イベント単位）
interface SummaryColumn {
  key: string         // 一意キー（eventId or sessionId）
  label: string       // ヘッダー行1
  subLabel: string    // ヘッダー行2
  eventId: string
  sessionId: string | null
}

export function AttendanceTabs({ events, members, attendanceRecords, currentUserId, isAdmin }: Props) {
  const [selectedMemberId, setSelectedMemberId] = useState(currentUserId)

  // attMap: { userId → { "event_eventId" or "session_sessionId" → Attendance } }
  const attMap = useMemo(() => {
    const map: Record<string, Record<string, Attendance>> = {}
    for (const a of attendanceRecords) {
      if (!map[a.user_id]) map[a.user_id] = {}
      const k = a.session_id ? `session_${a.session_id}` : `event_${a.event_id}`
      map[a.user_id][k] = a
    }
    return map
  }, [attendanceRecords])

  // 集計カラム一覧
  const summaryColumns = useMemo((): SummaryColumn[] => {
    const cols: SummaryColumn[] = []
    for (const ev of events) {
      const sorted = [...ev.sessions].sort((a, b) => a.sort_order - b.sort_order)
      if (sorted.length === 0) {
        cols.push({
          key: `event_${ev.id}`,
          label: format(new Date(ev.start_at), 'M/d(EEE)', { locale: ja }),
          subLabel: ev.title,
          eventId: ev.id,
          sessionId: null,
        })
      } else {
        for (const s of sorted) {
          cols.push({
            key: `session_${s.id}`,
            label: `${format(new Date(ev.start_at), 'M/d', { locale: ja })} ${ev.title}`,
            subLabel: s.name,
            eventId: ev.id,
            sessionId: s.id,
          })
        }
      }
    }
    return cols
  }, [events])

  const targetMember = members.find((m) => m.id === selectedMemberId)

  return (
    <Tabs defaultValue="input">
      <TabsList className="mb-4">
        <TabsTrigger value="input">出欠入力</TabsTrigger>
        <TabsTrigger value="summary">出欠集計</TabsTrigger>
      </TabsList>

      {/* ── 出欠入力タブ ── */}
      <TabsContent value="input">
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-sm font-medium text-blue-700 flex-shrink-0">メンバーを選択:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={selectedMemberId}
                  onValueChange={(v) => setSelectedMemberId(v ?? currentUserId)}
                >
                  <SelectTrigger className="w-full sm:w-56 bg-white">
                    <SelectValue>
                      {members.find((m) => m.id === selectedMemberId)?.full_name ?? ''}
                      {selectedMemberId === currentUserId ? '（自分）' : ''}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name}{m.id === currentUserId ? '（自分）' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {targetMember && selectedMemberId !== currentUserId && (
                  <Badge variant="outline" className="text-blue-700 border-blue-300">
                    {targetMember.full_name}の出欠を編集中
                  </Badge>
                )}
              </div>
            </div>
          )}

          {events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">対象の予定はありません</CardContent>
            </Card>
          ) : (
            events.map((event) => {
              const sorted = [...event.sessions].sort((a, b) => a.sort_order - b.sort_order)
              const hasSessions = sorted.length > 0

              // セッションなし → 全体出欠カウント
              const eventKey = `event_${event.id}`
              const eventAtt = attMap[selectedMemberId]?.[eventKey]
              const eventStatus: AttendanceStatus = (eventAtt?.status as AttendanceStatus) ?? 'undecided'

              const countByStatus = (key: string) => ({
                attending: attendanceRecords.filter((a) => {
                  const k = a.session_id ? `session_${a.session_id}` : `event_${a.event_id}`
                  return k === key && a.status === 'attending'
                }).length,
                absent: attendanceRecords.filter((a) => {
                  const k = a.session_id ? `session_${a.session_id}` : `event_${a.event_id}`
                  return k === key && a.status === 'absent'
                }).length,
              })

              return (
                <Card key={event.id}>
                  <CardContent className="p-5 space-y-4">
                    {/* イベントヘッダー */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                          {event.is_all_day ? (
                            <Badge variant="secondary" className="text-xs">終日</Badge>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {format(new Date(event.start_at), 'M月d日(EEE) HH:mm', { locale: ja })} 〜{' '}
                              {format(new Date(event.end_at), 'HH:mm', { locale: ja })}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />{event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {!hasSessions && (
                        <Badge className={
                          eventStatus === 'attending' ? 'bg-green-100 text-green-700 border-0' :
                          eventStatus === 'absent'    ? 'bg-red-100 text-red-600 border-0' :
                          'bg-gray-100 text-gray-500 border-0'
                        }>
                          {eventStatus === 'attending' ? '出席' : eventStatus === 'absent' ? '欠席' : '未定'}
                        </Badge>
                      )}
                    </div>

                    {/* セッションなし → 通常の出欠ボタン */}
                    {!hasSessions && (
                      <>
                        <AttendanceButton
                          key={`${selectedMemberId}-${event.id}`}
                          eventId={event.id}
                          sessionId={null}
                          currentStatus={eventStatus}
                          attendanceId={eventAtt?.id}
                          userId={selectedMemberId}
                        />
                        <CountRow counts={countByStatus(eventKey)} />
                      </>
                    )}

                    {/* セッションあり → セッションごとのボタン */}
                    {hasSessions && (
                      <div className="space-y-2">
                        {sorted.map((session) => {
                          const sKey = `session_${session.id}`
                          const sAtt = attMap[selectedMemberId]?.[sKey]
                          const sStatus: AttendanceStatus = (sAtt?.status as AttendanceStatus) ?? 'undecided'
                          const sCounts = countByStatus(sKey)
                          return (
                            <div key={session.id} className="border rounded-lg p-3 bg-gray-50 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">{session.name}</span>
                                <Badge className={
                                  sStatus === 'attending' ? 'bg-green-100 text-green-700 border-0 text-xs' :
                                  sStatus === 'absent'    ? 'bg-red-100 text-red-600 border-0 text-xs' :
                                  'bg-gray-100 text-gray-500 border-0 text-xs'
                                }>
                                  {sStatus === 'attending' ? '出席' : sStatus === 'absent' ? '欠席' : '未定'}
                                </Badge>
                              </div>
                              <AttendanceButton
                                key={`${selectedMemberId}-${session.id}`}
                                eventId={event.id}
                                sessionId={session.id}
                                currentStatus={sStatus}
                                attendanceId={sAtt?.id}
                                userId={selectedMemberId}
                              />
                              <CountRow counts={sCounts} small />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </TabsContent>

      {/* ── 出欠集計タブ ── */}
      <TabsContent value="summary">
        <SummaryTab
          events={events}
          members={members}
          attMap={attMap}
          summaryColumns={summaryColumns}
        />
      </TabsContent>
    </Tabs>
  )
}

function CountRow({ counts, small }: { counts: { attending: number; absent: number }; small?: boolean }) {
  const cls = small ? 'text-xs' : 'text-xs'
  return (
    <div className={`flex gap-4 ${cls} text-gray-500 pt-1 border-t`}>
      <span className="flex items-center gap-1 text-green-600">
        <CheckCircle2 className="w-3.5 h-3.5" />出席 {counts.attending}名
      </span>
      <span className="flex items-center gap-1 text-red-500">
        <XCircle className="w-3.5 h-3.5" />欠席 {counts.absent}名
      </span>
    </div>
  )
}

function SummaryTab({ events, members, attMap, summaryColumns }: {
  events: (Event & { sessions: EventSession[] })[]
  members: Profile[]
  attMap: Record<string, Record<string, Attendance>>
  summaryColumns: SummaryColumn[]
}) {
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(
    () => new Set(events.map((e) => e.id))
  )
  const [sortKey, setSortKey] = useState<string>('position')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // スクロール同期用 ref
  const topBarRef = useRef<HTMLDivElement>(null)
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)

  const onTopScroll = () => {
    if (isSyncing.current) return
    isSyncing.current = true
    if (tableWrapRef.current && topBarRef.current)
      tableWrapRef.current.scrollLeft = topBarRef.current.scrollLeft
    isSyncing.current = false
  }
  const onTableScroll = () => {
    if (isSyncing.current) return
    isSyncing.current = true
    if (topBarRef.current && tableWrapRef.current)
      topBarRef.current.scrollLeft = tableWrapRef.current.scrollLeft
    isSyncing.current = false
  }

  const allSelected = selectedEventIds.size === events.length
  const toggleAll = () =>
    setSelectedEventIds(allSelected ? new Set() : new Set(events.map((e) => e.id)))
  const toggleEvent = (id: string) =>
    setSelectedEventIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const filteredCols = summaryColumns.filter((c) => selectedEventIds.has(c.eventId))
  const filteredEvents = events.filter((e) => selectedEventIds.has(e.id))
  const colSpanMap = filteredEvents.map((e) => ({
    event: e,
    cols: filteredCols.filter((c) => c.eventId === e.id),
  }))

  const getStatus = (userId: string, col: SummaryColumn): AttendanceStatus =>
    (attMap[userId]?.[col.key]?.status as AttendanceStatus) ?? 'undecided'

  // ソート処理
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const statusOrder: Record<AttendanceStatus, number> = { attending: 0, undecided: 1, absent: 2 }

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') {
        cmp = a.full_name.localeCompare(b.full_name, 'ja')
      } else if (sortKey === 'department') {
        const ai = DEPARTMENTS.indexOf(a.department as typeof DEPARTMENTS[number])
        const bi = DEPARTMENTS.indexOf(b.department as typeof DEPARTMENTS[number])
        cmp = (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        if (cmp === 0) cmp = a.full_name.localeCompare(b.full_name, 'ja')
      } else if (sortKey === 'position') {
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
          // 役職なし同士 → 委員会順
          const di = DEPARTMENTS.indexOf(a.department as typeof DEPARTMENTS[number])
          const dj = DEPARTMENTS.indexOf(b.department as typeof DEPARTMENTS[number])
          cmp = (di === -1 ? 99 : di) - (dj === -1 ? 99 : dj)
        }
        if (cmp === 0) cmp = a.full_name.localeCompare(b.full_name, 'ja')
      } else if (sortKey === 'count') {
        const ca = filteredCols.filter((c) => getStatus(a.id, c) === 'attending').length
        const cb = filteredCols.filter((c) => getStatus(b.id, c) === 'attending').length
        cmp = ca - cb
        if (cmp === 0) cmp = a.full_name.localeCompare(b.full_name, 'ja')
      } else {
        // セッション/イベント列キー
        const col = filteredCols.find((c) => c.key === sortKey)
        if (col) {
          cmp = statusOrder[getStatus(a.id, col)] - statusOrder[getStatus(b.id, col)]
          if (cmp === 0) cmp = a.full_name.localeCompare(b.full_name, 'ja')
        }
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, sortKey, sortDir, filteredCols, attMap])

  // ソートアイコン
  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ChevronsUpDown className="w-3 h-3 ml-0.5 text-gray-400 inline-block flex-shrink-0" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-0.5 text-blue-600 inline-block flex-shrink-0" />
      : <ChevronDown className="w-3 h-3 ml-0.5 text-blue-600 inline-block flex-shrink-0" />
  }

  const handleExport = () => {
    if (filteredCols.length === 0 || members.length === 0) return
    const header = ['氏名', '役職', '所属委員会',
      ...filteredCols.map((c) => c.sessionId ? `${c.label} ${c.subLabel}` : c.label),
      '出席合計',
    ]
    const rows = sortedMembers.map((m) => {
      let cnt = 0
      const cells = filteredCols.map((c) => {
        const s = getStatus(m.id, c)
        if (s === 'attending') cnt++
        return statusLabel[s]
      })
      return [m.full_name, m.position ?? '', m.department ?? '', ...cells, cnt]
    })
    const totalRow = ['出席合計', '', '',
      ...filteredCols.map((c) => `${members.filter((m) => getStatus(m.id, c) === 'attending').length}名`),
      '',
    ]
    const csv = [header, ...rows, totalRow]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `出欠一覧_${format(new Date(), 'yyyyMMdd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (events.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center text-gray-500">対象の予定はありません</CardContent></Card>
    )
  }

  // テーブルの最小幅（上部スクロールバーの幅合わせ用）
  const minTableWidth = 120 + 80 + 120 + filteredCols.length * 80 + 60

  return (
    <div className="space-y-4">
      {/* イベント単位の選択 */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">出力するイベントを選択</p>
            <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
              {allSelected ? 'すべて解除' : 'すべて選択'}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {events.map((ev) => {
              const checked = selectedEventIds.has(ev.id)
              const sorted = [...ev.sessions].sort((a, b) => a.sort_order - b.sort_order)
              const dateStr = format(new Date(ev.start_at), 'M/d(EEE)', { locale: ja })
              return (
                <label
                  key={ev.id}
                  className={`flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors select-none ${
                    checked ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input type="checkbox" className="mt-0.5 accent-blue-600" checked={checked} onChange={() => toggleEvent(ev.id)} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${checked ? 'text-blue-700' : 'text-gray-700'}`}>
                      {dateStr}　{ev.title}
                    </p>
                    {sorted.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {sorted.map((s) => (
                          <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full border ${checked ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
          {selectedEventIds.size === 0 && (
            <p className="text-xs text-amber-600">イベントを1つ以上選択してください</p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {selectedEventIds.size > 0 ? `${selectedEventIds.size}件のイベントを表示中` : 'イベントが未選択です'}
        </p>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={selectedEventIds.size === 0}>
          <Download className="w-4 h-4 mr-1.5" />CSV出力
        </Button>
      </div>

      {filteredCols.length > 0 && (
        <>
          {/* 上部スクロールバー（テーブルと同期） */}
          <div
            ref={topBarRef}
            onScroll={onTopScroll}
            className="overflow-x-auto rounded-t-lg border-x border-t bg-gray-100 h-4"
          >
            <div style={{ minWidth: minTableWidth, height: 1 }} />
          </div>

          {/* テーブル本体 */}
          <div
            ref={tableWrapRef}
            onScroll={onTableScroll}
            className="overflow-x-auto rounded-b-lg border bg-white -mt-px"
          >
            <table className="text-sm" style={{ minWidth: minTableWidth }}>
              <thead>
                {/* 1行目: 固定列（rowSpan=2）+ イベント名グループ */}
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th
                    rowSpan={2}
                    onClick={() => handleSort('name')}
                    className="text-left px-4 py-3 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-[120px] border-b cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                  >
                    氏名<SortIcon colKey="name" />
                  </th>
                  <th
                    rowSpan={2}
                    onClick={() => handleSort('position')}
                    className="text-left px-3 py-3 font-semibold text-gray-700 min-w-[80px] border-b cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                  >
                    役職<SortIcon colKey="position" />
                  </th>
                  <th
                    rowSpan={2}
                    onClick={() => handleSort('department')}
                    className="text-left px-3 py-3 font-semibold text-gray-700 min-w-[120px] border-b cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                  >
                    所属<SortIcon colKey="department" />
                  </th>
                  {colSpanMap.map(({ event: ev, cols }) => (
                    <th
                      key={ev.id}
                      colSpan={cols.length}
                      className="px-3 py-2 text-center text-xs font-semibold text-blue-700 border-l border-gray-200 whitespace-nowrap"
                    >
                      {format(new Date(ev.start_at), 'M/d', { locale: ja })}　{ev.title}
                    </th>
                  ))}
                  <th
                    rowSpan={2}
                    onClick={() => handleSort('count')}
                    className="px-3 py-3 font-semibold text-gray-700 text-center min-w-[60px] border-b cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                  >
                    出席<SortIcon colKey="count" />
                  </th>
                </tr>
                {/* 2行目: セッション名（クリックでソート） */}
                <tr className="bg-gray-50 border-b">
                  {filteredCols.map((col, i) => {
                    const isFirstInEvent = i === 0 || filteredCols[i - 1].eventId !== col.eventId
                    return (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className={`px-3 py-2 font-semibold text-gray-600 text-center min-w-[72px] text-xs whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none ${isFirstInEvent ? 'border-l border-gray-200' : ''}`}
                      >
                        {col.subLabel}<SortIcon colKey={col.key} />
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((m, idx) => {
                  let cnt = 0
                  return (
                    <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className={`px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap sticky left-0 z-10 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        {m.full_name}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{m.position ?? ''}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{m.department ?? ''}</td>
                      {filteredCols.map((col, i) => {
                        const s = getStatus(m.id, col)
                        if (s === 'attending') cnt++
                        const isFirstInEvent = i === 0 || filteredCols[i - 1].eventId !== col.eventId
                        return (
                          <td key={col.key} className={`px-3 py-2.5 text-center text-base ${statusColor[s]} ${isFirstInEvent ? 'border-l border-gray-200' : ''}`}>
                            {statusLabel[s]}
                          </td>
                        )
                      })}
                      <td className="px-3 py-2.5 text-center font-semibold text-blue-700">{cnt}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 border-t-2 border-blue-200">
                  <td className="px-4 py-2.5 font-semibold text-gray-700 sticky left-0 bg-blue-50 z-10" colSpan={3}>出席合計</td>
                  {filteredCols.map((col, i) => {
                    const cnt = members.filter((m) => getStatus(m.id, col) === 'attending').length
                    const isFirstInEvent = i === 0 || filteredCols[i - 1].eventId !== col.eventId
                    return (
                      <td key={col.key} className={`px-3 py-2.5 text-center font-bold text-green-700 ${isFirstInEvent ? 'border-l border-gray-200' : ''}`}>
                        {cnt}
                      </td>
                    )
                  })}
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      <div className="flex gap-6 text-sm text-gray-500">
        <span><span className="font-bold text-green-600">○</span> 出席</span>
        <span><span className="font-bold text-red-500">×</span> 欠席</span>
        <span><span className="text-gray-400">△</span> 未定・未回答</span>
      </div>
    </div>
  )
}
