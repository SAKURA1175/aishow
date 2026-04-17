import { NavLink, useNavigate } from 'react-router-dom'
import {
  MessageSquare, FileText, User, Clock,
  Settings, LogOut, Moon, Sun, Plus, BookOpen, Network,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useStore from '@/store/useStore'
import { logout } from '@/api/user'

const navItems = [
  { to: '/chat', icon: MessageSquare, label: '智能问答' },
  { to: '/documents', icon: FileText, label: '文档库' },
  { to: '/profile', icon: User, label: '学习画像' },
  { to: '/starmap', icon: Network, label: '知识星图' },
  { to: '/history', icon: Clock, label: '历史记录' },
]

export default function Sidebar({ onNewChat }) {
  const { user, clearUser, theme, toggleTheme } = useStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (_) {}
    clearUser()
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'teacher'

  return (
    <aside className="flex flex-col h-full w-64 bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-text))]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-white text-sm">学业辅助平台</span>
      </div>

      {/* New Chat Button */}
      {onNewChat && (
        <div className="px-3 pt-3">
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm
                       border border-white/10 hover:bg-[hsl(var(--sidebar-hover))]
                       text-[hsl(var(--sidebar-text))] transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建对话
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pt-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-white font-medium'
                  : 'hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-text))]'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-white font-medium'
                  : 'hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-text))]'
              )
            }
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            管理后台
          </NavLink>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-white/5 p-3 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm
                     hover:bg-[hsl(var(--sidebar-hover))] transition-colors"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
          {theme === 'dark' ? '浅色模式' : '深色模式'}
        </button>

        {/* User info */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-md">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs text-primary font-semibold flex-shrink-0">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white font-medium truncate">{user?.username}</p>
            <p className="text-[10px] text-[hsl(var(--sidebar-text))] capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm
                     hover:bg-red-500/10 hover:text-red-400 transition-colors text-red-400/70"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </aside>
  )
}
