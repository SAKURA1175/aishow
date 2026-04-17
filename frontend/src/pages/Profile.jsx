import { useState, useEffect } from 'react'
import { User, Brain, TrendingUp, BookOpen, Target, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import http from '@/api/http'
import useStore from '@/store/useStore'
import { cn } from '@/lib/utils'
import SpotlightCard from '@/components/animations/SpotlightCard'

function StatCard({ icon: Icon, label, value, sub, color, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <SpotlightCard>
        <CardContent className="p-5 flex items-start gap-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner', color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground/80 mb-1">{label}</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {sub && <p className="text-xs font-medium text-muted-foreground">{sub}</p>}
            </div>
          </div>
        </CardContent>
      </SpotlightCard>
    </motion.div>
  )
}

export default function Profile() {
  const user = useStore((s) => s.user)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await http.get('/profile/current')
      if (res.data?.success) {
        setProfile(res.data.data)
      } else {
        setError(res.data?.message || '加载失败')
      }
    } catch (err) {
      setError('加载学习画像失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex flex-col h-full overflow-auto p-8 bg-background">
        <div className="space-y-6 animate-pulse max-w-5xl mx-auto w-full">
          <div className="h-8 bg-muted/40 rounded w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted/40 rounded-2xl border border-border/40" />)}
          </div>
          <div className="h-64 bg-muted/40 rounded-2xl border border-border/40 mt-8" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background text-muted-foreground">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
            <Brain className="w-10 h-10 opacity-30" />
          </div>
          <p className="text-base font-medium text-foreground/80">{error || '暂无学习画像数据'}</p>
          <p className="text-sm mt-2 text-muted-foreground/60">开始提问后系统会自动分析你的学习情况</p>
          <Button variant="outline" className="mt-8 gap-2 h-10" onClick={load}>
            <RefreshCw className="w-4 h-4" /> 重新加载
          </Button>
        </motion.div>
      </div>
    )
  }

  const topics = profile.topicSummaries || []
  const totalQuestions = topics.reduce((acc, t) => acc + (t.questionCount || 0), 0)
  const masteredCount = topics.filter((t) => t.masteryLevel === 'HIGH').length
  const topTopics = [...topics].sort((a, b) => (b.questionCount || 0) - (a.questionCount || 0)).slice(0, 5)

  const masteryLabel = { HIGH: '掌握', MEDIUM: '熟悉', LOW: '了解' }
  const masteryColor = {
    HIGH: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
    MEDIUM: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/20',
    LOW: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  }

  return (
    <div className="flex flex-col h-full overflow-auto bg-background">
      <div className="flex items-center justify-between px-8 py-6 border-b flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight">学习画像</h2>
          <p className="text-xs text-muted-foreground mt-1 font-medium">基于交互数据自动生成</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} className="gap-2 h-9">
          <RefreshCw className="w-3.5 h-3.5" />刷新
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* User info */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-6"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-black text-primary shadow-inner">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">{user?.username}</h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  <span className="capitalize">{user?.role}</span> · 智能辅助平台
                </p>
                {profile.dominantSubject && (
                  <Badge variant="default" className="mt-3 text-xs bg-primary/20 text-primary hover:bg-primary/30 border-none">
                    主攻学科：{profile.dominantSubject}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Target} label="累计提问" value={totalQuestions} sub="次" color="bg-blue-500/20 text-blue-500" index={0} />
            <StatCard icon={BookOpen} label="涉及主题" value={topics.length} sub="个" color="bg-purple-500/20 text-purple-500" index={1} />
            <StatCard icon={TrendingUp} label="高熟练度" value={masteredCount} sub="个主题" color="bg-emerald-500/20 text-emerald-500" index={2} />
            <StatCard icon={Brain} label="系统评定活跃度" value={profile.activityLevel || '-'} color="bg-orange-500/20 text-orange-500" index={3} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Topic breakdown */}
            <div className="lg:col-span-2 space-y-6">
              {topTopics.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <SpotlightCard className="h-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        核心能力分布 (Top 5)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {topTopics.map((t, idx) => {
                        const pct = totalQuestions > 0 ? Math.round((t.questionCount / totalQuestions) * 100) : 0
                        return (
                          <div key={t.topic} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-foreground/90">{t.topic}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-muted-foreground">{t.questionCount} 次交互</span>
                                <Badge variant="outline" className={cn('text-[10px] px-2 py-0 border', masteryColor[t.masteryLevel])}>
                                  {masteryLabel[t.masteryLevel] || '了解'}
                                </Badge>
                              </div>
                            </div>
                            <div className="h-2 bg-muted/50 rounded-full overflow-hidden shadow-inner">
                              <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, delay: 0.4 + (idx * 0.1) }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </SpotlightCard>
                </motion.div>
              )}
            </div>

            <div className="space-y-6">
              {/* Weak areas */}
              {profile.weakAreas && profile.weakAreas.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <SpotlightCard>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Target className="w-4 h-4 text-orange-500" />
                        建议强化方向
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {profile.weakAreas.map((area) => (
                          <Badge key={area} variant="outline" className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20 px-2.5 py-1">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </SpotlightCard>
                </motion.div>
              )}

              {/* Summary */}
              {profile.summary && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <SpotlightCard>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-500" />
                        AI 综合评价
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground/90 leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/40">
                        {profile.summary}
                      </p>
                    </CardContent>
                  </SpotlightCard>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
