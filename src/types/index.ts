export type UserRole = 'admin' | 'member'

export const POSITIONS = [
  '理事長',
  '直前理事長',
  '監事',
  '副理事長',
  '専務理事',
  '財政理事',
  '室長',
  '実行委員長',
  '委員長',
  '事務局長',
] as const

export const DEPARTMENTS = [
  '拡大委員会',
  'まちづくり委員会',
  'ひとづくり委員会',
  '運営グループ',
] as const

export type Position = typeof POSITIONS[number]
export type Department = typeof DEPARTMENTS[number]

export interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  position?: string
  department?: string
  join_year?: number
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  author_id: string
  author?: Profile
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface EventSession {
  id: string
  event_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface Event {
  id: string
  title: string
  description?: string
  location?: string
  start_at: string
  end_at: string
  is_all_day: boolean
  created_by: string
  creator?: Profile
  sessions?: EventSession[]
  created_at: string
  updated_at: string
}

export interface EventAttachment {
  id: string
  event_id: string
  filename: string
  storage_path: string
  mime_type: string
  file_size?: number
  created_at: string
}

export type AttendanceStatus = 'attending' | 'absent' | 'undecided'

export interface Attendance {
  id: string
  event_id: string
  session_id?: string | null
  user_id: string
  status: AttendanceStatus
  comment?: string
  user?: Profile
  event?: Event
  created_at: string
  updated_at: string
}
