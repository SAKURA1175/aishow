import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  MessageSquare, FileText, User, Clock,
  Settings, LogOut, Moon, Sun, Plus, BookOpen, Network, Trash2, MoreHorizontal, ChevronUp, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useStore from '@/store/useStore'
import { logout } from '@/api/user'
import { newSession, clearSessions } from '@/api/chat'

const navItems = [
  { to: '/chat', icon: MessageSquare, label: '智能问答' },
  { to: '/documents', icon: FileText, label: '文档库' },
  { to: '/resume', icon: Sparkles, label: '简历优化', accent: 'emerald' },
  { to: '/profile', icon: User, label: '学习画像' },
  { to: '/starmap', icon: Network, label: '知识星图' },
  { to: '/history', icon: Clock, label: '历史记录' },
]

export default function Sidebar() {
  const { user, clearUser, theme, toggleTheme, sessions, loadSessions, currentSessionId, setCurrentSessionId } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (e) { console.error(e) }
    clearUser()
    navigate('/login')
  }

  const handleNewChat = async () => {
    try {
      const res = await newSession()
      if (res.data?.success) {
        const session = res.data.data
        useStore.getState().setSessions([session, ...useStore.getState().sessions])
        setCurrentSessionId(session.id)
        if (location.pathname !== '/chat') navigate('/chat')
      }
    } catch (e) { console.error(e) }
  }

  const handleSelectSession = (session) => {
    setCurrentSessionId(session.id)
    if (location.pathname !== '/chat') navigate('/chat')
  }

  const handleClearAll = async () => {
    if (!window.confirm('确定要清空所有聊天记录吗？')) return
    try {
      await clearSessions()
      useStore.getState().setSessions([])
      setCurrentSessionId(null)
    } catch (e) { console.error(e) }
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'teacher'

  return (
    <aside className="flex flex-col h-full w-64 bg-card/50 backdrop-blur-xl border-r border-border text-foreground transition-all duration-300">
      {/* Logo & New Chat */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-semibold text-foreground text-sm">Study AI</span>
        </div>
        <button
          onClick={handleNewChat}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="开启新对话"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 custom-scrollbar">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelectSession(s)}
            className={cn(
              'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 truncate group flex items-center gap-3',
              currentSessionId === s.id && location.pathname === '/chat'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span className="truncate flex-1">{s.title || '无标题会话'}</span>
          </button>
        ))}
        {sessions.length === 0 && (
          <div className="text-xs text-muted-foreground/60 text-center py-6">暂无历史对话</div>
        )}
      </div>

      {/* Clear History */}
      {sessions.length > 0 && (
        <div className="p-2">
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空聊天记录
          </button>
        </div>
      )}

      {/* User section with Popover */}
      <div className="p-3 border-t border-border/50 relative" ref={menuRef}>
        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-3 w-[calc(100%-24px)] bg-card border border-border/80 shadow-xl rounded-xl py-2 z-50 overflow-hidden transform transition-all">
            <div className="px-3 py-1.5 mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">功能菜单</p>
            </div>
            {navItems.map(({ to, icon: Icon, label, accent }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                    isActive
                      ? accent === 'emerald'
                        ? 'bg-emerald-500/10 text-emerald-500 font-medium'
                        : 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )
                }
              >
                <Icon className={cn('w-[16px] h-[16px] flex-shrink-0',
                  accent === 'emerald' ? 'text-emerald-500' : '')} />
                {label}
              </NavLink>
            ))}

            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )
                }
              >
                <Settings className="w-[16px] h-[16px] flex-shrink-0" />
                后台管理
              </NavLink>
            )}

            <div className="h-px bg-border/50 my-1.5" />

            <button
              onClick={() => { toggleTheme(); setMenuOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-[16px] h-[16px]" /> : <Moon className="w-[16px] h-[16px]" />}
              {theme === 'dark' ? '切换浅色' : '切换深色'}
            </button>

            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-[16px] h-[16px]" />
              退出登录
            </button>
          </div>
        )}

        {/* User Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all duration-200 border",
            menuOpen ? "bg-muted border-border" : "hover:bg-muted/50 border-transparent"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold flex-shrink-0">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <ChevronUp className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", menuOpen && "rotate-180")} />
        </button>
      </div>
    </aside>
  )
}
