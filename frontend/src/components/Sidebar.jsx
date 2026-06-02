import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, School, Book, Award, Calendar, FileText,
  User, Network, Clock, Settings, LogOut, Moon, Sun, Sparkles, BookOpen, MessageSquare,
  Target, FileEdit, MessagesSquare, Flame, ClipboardList
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useStore from '@/store/useStore'
import { logout } from '@/api/user'

const mainNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '概览', accent: 'blue' },
  { to: '/classes', icon: School, label: '班级', accent: 'indigo' },
  { to: '/assignments', icon: Book, label: '作业', accent: 'orange' },
  { to: '/exams', icon: ClipboardList, label: '考试', accent: 'violet' },
  { to: '/grades', icon: Award, label: '成绩', accent: 'purple' },
  { to: '/schedule', icon: Calendar, label: '日程', accent: 'pink' },
  { to: '/documents', icon: FileText, label: '文档', accent: 'zinc' },
]

const studyNavItems = [
  { to: '/wrong-questions', icon: Target, label: '错题本', accent: 'red' },
  { to: '/notes', icon: FileEdit, label: '笔记', accent: 'amber' },
  { to: '/forum', icon: MessagesSquare, label: '讨论区', accent: 'cyan' },
  { to: '/checkin', icon: Flame, label: '打卡', accent: 'orange' },
]

const aiNavItems = [
  { to: '/chat', icon: MessageSquare, label: 'AI 辅导', accent: 'emerald' },
  { to: '/resume', icon: Sparkles, label: '简历优化', accent: 'emerald' },
  { to: '/starmap', icon: Network, label: '知识星图', accent: 'emerald' },
]

const userNavItems = [
  { to: '/profile', icon: User, label: '学习画像' },
  { to: '/history', icon: Clock, label: '活动记录' },
]

export default function Sidebar() {
  const { user, clearUser, theme, toggleTheme } = useStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (e) { console.error(e) }
    clearUser()
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'teacher'

  const renderNavGroup = (title, items) => (
    <div className="space-y-1">
      {title && <h3 className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>}
      {items.map(({ to, icon: Icon, label, accent }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group',
              isActive
                ? 'bg-muted/80 text-foreground font-medium shadow-sm'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "p-1 rounded-md transition-colors",
                isActive 
                  ? `bg-${accent}-500/10 text-${accent}-500` 
                  : `text-muted-foreground group-hover:text-${accent}-500`
              )}>
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  )

  return (
    <aside className="flex flex-col h-full w-64 bg-card/40 backdrop-blur-2xl border-r border-border text-foreground transition-all duration-300">
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-6 py-6 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-foreground tracking-tight">Study.AI</span>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar">
        {renderNavGroup('核心模块', mainNavItems)}
        {renderNavGroup('学习工具', studyNavItems)}
        {renderNavGroup('AI 助手', aiNavItems)}
        {renderNavGroup('个人中心', userNavItems)}
        
        {isAdmin && (
          <div className="space-y-1">
            <h3 className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">管理</h3>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group',
                  isActive ? 'bg-muted/80 text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )
              }
            >
              <div className="p-1 rounded-md text-muted-foreground group-hover:text-foreground transition-colors">
                <Settings className="w-[18px] h-[18px]" />
              </div>
              <span>后台管理</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* User Area at Bottom */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm text-primary font-bold shadow-sm">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground truncate">{user?.username || '未登录'}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{user?.role || 'student'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border/50"
          >
            {theme === 'dark' ? <Sun className="w-[16px] h-[16px]" /> : <Moon className="w-[16px] h-[16px]" />}
            {theme === 'dark' ? '浅色' : '深色'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20"
            title="退出登录"
          >
            <LogOut className="w-[16px] h-[16px]" />
          </button>
        </div>
      </div>
    </aside>
  )
}
