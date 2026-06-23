'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Megaphone,
  Calendar,
  ClipboardList,
  Users,
  LogOut,
} from 'lucide-react'
import type { Profile } from '@/types'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/announcements', label: 'お知らせ', icon: Megaphone },
  { href: '/schedule', label: 'スケジュール', icon: Calendar },
  { href: '/attendance', label: '出欠入力', icon: ClipboardList },
  { href: '/members', label: '会員管理', icon: Users },
]

export function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 h-screen flex-shrink-0 bg-white border-r flex flex-col overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">JC</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">LOMポータル</h1>
            <p className="text-xs text-gray-500">青年会議所</p>
          </div>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      <div className="p-4 space-y-3">
        {profile && (
          <div className="flex items-center gap-3 px-1">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                {profile.full_name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
              <p className="text-xs text-gray-500">{profile.role === 'admin' ? '常任理事' : 'メンバー'}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          ログアウト
        </Button>
      </div>
    </aside>
  )
}
