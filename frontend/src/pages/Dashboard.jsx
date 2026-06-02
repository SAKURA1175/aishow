import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Award, Calendar, CheckSquare, MessageSquare, TrendingUp } from 'lucide-react'
import useStore from '@/store/useStore'
import { getTodos, getMyAssignments, getGpa, getCheckinStats } from '@/api/modules'

export default function Dashboard() {
  const { user } = useStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pendingTodos: 0, assignments: 0, gpa: '0.00', checkinDays: 0, totalPoints: 0, todayChecked: false })
  const [recentAssignments, setRecentAssignments] = useState([])

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    try {
      const [todoRes, assRes, gpaRes, checkinRes] = await Promise.allSettled([
        getTodos(), getMyAssignments(), getGpa(), getCheckinStats()
      ])
      const todos = todoRes.status === 'fulfilled' ? todoRes.value.data?.data : {}
      const assignments = assRes.status === 'fulfilled' ? assRes.value.data?.data : []
      const gpa = gpaRes.status === 'fulfilled' ? gpaRes.value.data?.data : {}
      const checkin = checkinRes.status === 'fulfilled' ? checkinRes.value.data?.data : {}
      setStats({
        pendingTodos: todos?.pendingCount || 0,
        assignments: assignments?.length || 0,
        gpa: gpa?.gpa?.toFixed?.(2) || '0.00',
        checkinDays: checkin?.totalDays || 0,
        totalPoints: checkin?.totalPoints || 0,
        todayChecked: checkin?.todayChecked || false,
      })
      setRecentAssignments((assignments || []).slice(0, 5))
    } catch {}
  }

  const cards = [
    { label: '待办事项', value: stats.pendingTodos, icon: CheckSquare, color: 'pink', to: '/schedule' },
    { label: '当前作业', value: stats.assignments, icon: BookOpen, color: 'orange', to: '/assignments' },
    { label: '平均绩点', value: stats.gpa, icon: TrendingUp, color: 'purple', to: '/grades' },
    { label: '累计打卡', value: `${stats.checkinDays}天`, icon: Calendar, color: 'emerald', to: '/checkin' },
    { label: '学习积分', value: stats.totalPoints, icon: Award, color: 'blue', to: '/checkin' },
    { label: 'AI 辅导', value: '开始', icon: MessageSquare, color: 'green', to: '/chat' },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">你好，{user?.username} 👋</h1>
            <p className="text-muted-foreground mt-1">欢迎回来，这是你的学业概览</p>
          </div>
          <span className={`text-sm px-3 py-1.5 rounded-full ${stats.todayChecked ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
            {stats.todayChecked ? '✅ 今日已打卡' : '⏰ 今日未打卡'}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cards.map(c => (
            <button key={c.label} onClick={() => navigate(c.to)}
              className="p-5 rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all text-left group">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <c.icon className="w-5 h-5 text-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </button>
          ))}
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2"><BookOpen className="w-5 h-5 text-orange-500" /> 近期作业</h2>
            <button onClick={() => navigate('/assignments')} className="text-sm text-muted-foreground hover:text-foreground">查看全部 →</button>
          </div>
          {recentAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">暂无作业</p>
          ) : (
            <div className="space-y-3">
              {recentAssignments.map(a => (
                <div key={a.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                  <div><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.className||'全体'} · {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '无截止'}</p></div>
                  <span className={`text-xs px-2 py-1 rounded-full ${a.status==='published'?'bg-green-500/10 text-green-500':'bg-muted text-muted-foreground'}`}>{a.status==='published'?'进行中':'已结束'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
