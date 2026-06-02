import { useState, useEffect } from 'react'
import { Flame, Trophy, Clock, Zap } from 'lucide-react'
import { doCheckin, getCheckinStats } from '@/api/modules'

export default function CheckinPage() {
  const [stats, setStats] = useState({ totalDays: 0, totalMinutes: 0, totalPoints: 0, todayChecked: false, history: [], recentPoints: [] })
  const [loading, setLoading] = useState(true)
  const [checkinForm, setCheckinForm] = useState({ studyMinutes: 30, content: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    try { const r = await getCheckinStats(); setStats(r.data?.data || {}) } catch {}
    setLoading(false)
  }

  const handleCheckin = async () => {
    try {
      const r = await doCheckin(checkinForm)
      if (r.data?.success) { load(); setCheckinForm({ studyMinutes: 30, content: '' }) }
      else alert(r.data?.message)
    } catch { alert('打卡失败') }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center"><Flame className="w-5 h-5 text-orange-500" /></div>
          <div><h1 className="text-lg font-semibold">学习打卡</h1><p className="text-xs text-muted-foreground">坚持打卡，积累积分</p></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-border/50 bg-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center"><Flame className="w-6 h-6 text-orange-500" /></div>
            <div><p className="text-sm text-muted-foreground">累计打卡</p><p className="text-2xl font-bold">{stats.totalDays} 天</p></div>
          </div>
          <div className="p-5 rounded-2xl border border-border/50 bg-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center"><Clock className="w-6 h-6 text-blue-500" /></div>
            <div><p className="text-sm text-muted-foreground">总学习时长</p><p className="text-2xl font-bold">{Math.floor((stats.totalMinutes||0)/60)}h {(stats.totalMinutes||0)%60}m</p></div>
          </div>
          <div className="p-5 rounded-2xl border border-border/50 bg-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center"><Trophy className="w-6 h-6 text-yellow-500" /></div>
            <div><p className="text-sm text-muted-foreground">积分</p><p className="text-2xl font-bold">{stats.totalPoints}</p></div>
          </div>
        </div>

        {!stats.todayChecked ? (
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h2 className="text-base font-semibold mb-4">📝 今日打卡</h2>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">学习时长（分钟）</label>
                <input type="number" value={checkinForm.studyMinutes} onChange={e => setCheckinForm({...checkinForm, studyMinutes: parseInt(e.target.value)||0})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">学习内容（选填）</label>
                <input value={checkinForm.content} onChange={e => setCheckinForm({...checkinForm, content: e.target.value})} placeholder="今天学了什么..." className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
              </div>
              <button onClick={handleCheckin} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap">打卡 +10分</button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center">
            <p className="text-lg font-semibold text-emerald-500">✅ 今日已打卡！</p>
            <p className="text-sm text-muted-foreground mt-1">继续保持，明天见！</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> 积分记录</h2>
            {(stats.recentPoints||[]).length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">暂无记录</p> :
              <div className="space-y-2">
                {(stats.recentPoints||[]).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0 text-sm">
                    <span className="text-muted-foreground">{p.description}</span>
                    <span className="text-yellow-500 font-medium">+{p.points}</span>
                  </div>
                ))}
              </div>
            }
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> 打卡历史</h2>
            {(stats.history||[]).length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">暂无记录</p> :
              <div className="space-y-2">
                {(stats.history||[]).slice(0, 10).map(h => (
                  <div key={h.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0 text-sm">
                    <div><p className="font-medium">{new Date(h.checkinDate).toLocaleDateString()}</p>{h.content && <p className="text-xs text-muted-foreground">{h.content}</p>}</div>
                    <span className="text-muted-foreground">{h.studyMinutes}分钟</span>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
