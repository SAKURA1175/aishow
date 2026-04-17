import { useState, useEffect } from 'react'
import { Clock, MessageSquare, ChevronRight, Trash2, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { listSessions, listMessages, clearSessions } from '@/api/chat'
import SpotlightCard from '@/components/animations/SpotlightCard'
import { cn } from '@/lib/utils'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return d.toLocaleDateString('zh-CN')
}

export default function History() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [messages, setMessages] = useState({})
  const [loadingMsg, setLoadingMsg] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listSessions()
      if (res.data?.success) {
        setSessions(res.data.data || [])
      }
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleExpand = async (sessionId) => {
    if (expanded === sessionId) {
      setExpanded(null)
      return
    }
    setExpanded(sessionId)
    if (messages[sessionId]) return
    setLoadingMsg(true)
    try {
      const res = await listMessages(sessionId)
      if (res.data?.success) {
        setMessages((prev) => ({ ...prev, [sessionId]: res.data.data || [] }))
      }
    } catch (_) {}
    setLoadingMsg(false)
  }

  const handleClearAll = async () => {
    if (!window.confirm('确定要清空所有历史记录吗？')) return
    try {
      await clearSessions()
      setSessions([])
      setMessages({})
    } catch (_) {}
  }

  const goToChat = (sessionId) => {
    navigate(`/chat?sessionId=${sessionId}`)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight">历史记录</h2>
          <p className="text-xs text-muted-foreground mt-1 font-medium">{sessions.length} 个本地对话资源已就绪</p>
        </div>
        <div className="flex gap-3">
          <Button size="sm" variant="outline" onClick={load} className="gap-2 h-9">
            <RefreshCw className="w-3.5 h-3.5" />刷新
          </Button>
          {sessions.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleClearAll} className="gap-2 h-9 text-red-500 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20">
              <Trash2 className="w-3.5 h-3.5" />
              清空记录
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-muted/40 rounded-2xl animate-pulse border border-border/40" />)}
            </div>
          ) : sessions.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 text-muted-foreground"
            >
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-sm font-medium">暂无历史记录</p>
              <p className="text-xs mt-2 text-muted-foreground/60">开始对话后记录会出现在这里</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SpotlightCard className="overflow-hidden">
                    {/* Session header */}
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/10 transition-colors"
                      onClick={() => toggleExpand(session.id)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-inner">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground/90 truncate mb-1">{session.title || '无标题对话'}</p>
                        <p className="text-xs font-medium text-muted-foreground/60">{formatDate(session.createTime)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); goToChat(session.id) }}
                          className="h-8 px-3 text-xs text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          继续对话
                        </Button>
                        <div className={cn(
                          "w-6 h-6 rounded-md flex items-center justify-center bg-muted/30 transition-transform",
                          expanded === session.id ? 'rotate-90 bg-muted/50' : ''
                        )}>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    {/* Expanded messages */}
                    <AnimatePresence>
                      {expanded === session.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border/40 bg-muted/5"
                        >
                          <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                            {loadingMsg && !messages[session.id] ? (
                              <div className="text-xs text-muted-foreground/60 animate-pulse font-medium">加载历史消息...</div>
                            ) : (messages[session.id] || []).length === 0 ? (
                              <p className="text-xs text-muted-foreground/60 font-medium">暂无消息记录</p>
                            ) : (
                              (messages[session.id] || []).map((msg, i) => (
                                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 shadow-sm ${
                                    msg.role === 'user'
                                      ? 'bg-slate-600 text-white'
                                      : 'bg-primary text-white'
                                  }`}>
                                    {msg.role === 'user' ? '我' : 'AI'}
                                  </div>
                                  <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'text-right' : ''}`}>
                                    <p className={cn(
                                      "text-xs leading-relaxed line-clamp-4 inline-block rounded-xl px-3 py-2 text-left",
                                      msg.role === 'user' ? "bg-muted/50" : "bg-primary/5 border border-primary/10"
                                    )}>
                                      {msg.content}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SpotlightCard>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
