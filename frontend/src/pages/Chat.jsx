import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Plus, Trash2, MessageSquare, Menu, Paperclip, X, Image } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import {
  listSessions, listMessages, newSession,
  clearSessions, streamAsk, streamAskWithImage,
} from '@/api/chat'
import useStore from '@/store/useStore'
import { cn } from '@/lib/utils'
import BrandLogo from '@/components/BrandLogo'

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-8 h-8">
        <BrandLogo size={28} animated={true} />
      </div>
      
      <div className="flex gap-0.5 items-center font-medium text-[13px] text-blue-500 tracking-wide">
        正在思考
        <span className="flex w-3 ml-0.5 text-blue-500">
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>.</motion.span>
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>.</motion.span>
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>.</motion.span>
        </span>
      </div>
    </div>
  )
}

function MessageBubble({ msg, isStreaming }) {
  const isAi = msg.role === 'ai' || msg.role === 'assistant'

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-4 px-6 py-6 border-b border-border/40 transition-colors', isAi ? 'bg-muted/30' : '')}
    >
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm',
        isAi ? 'bg-primary text-white' : 'bg-slate-600 text-white'
      )}>
        {isAi ? 'AI' : '我'}
      </div>

      <div className="flex-1 min-w-0">
        {/* 图片附件（仅用户消息有） */}
        {msg.imageUrl && (
          <div className="mb-3">
            <img
              src={msg.imageUrl}
              alt="上传的图片"
              className="max-w-xs max-h-48 rounded-xl border border-border/40 object-cover shadow-sm"
            />
          </div>
        )}

        {msg.content === '__thinking__' ? (
          <div className="flex items-center py-1">
            <TypingIndicator />
          </div>
        ) : isAi ? (
          <MarkdownRenderer
            content={msg.content}
            streaming={isStreaming}
            className="text-sm leading-relaxed"
          />
        ) : (
          <p className="text-sm leading-7 whitespace-pre-wrap text-foreground/90">{msg.content}</p>
        )}
      </div>
    </motion.div>
  )
}

export default function Chat() {
  const user = useStore((s) => s.user)
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [messagesMap, setMessagesMap] = useState({ new: [{ id: 'welcome', role: 'ai', content: '你好！我是你的学业助手，有什么可以帮你的吗？' }] })
  const [streamingSessions, setStreamingSessions] = useState({})
  
  const streamingSessionsRef = useRef({})
  const esRefs = useRef({})

  const activeId = currentSessionId || 'new'
  const messages = messagesMap[activeId] || []
  const isStreaming = !!streamingSessions[activeId]

  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDeepThink, setIsDeepThink] = useState(false)

  // 图片附件状态
  const [pendingImage, setPendingImage] = useState(null) // { dataUrl, base64, mimeType }

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  const loadSessions = useCallback(async () => {
    try {
      const res = await listSessions()
      if (res.data?.success) {
        setSessions(res.data.data || [])
      }
    } catch (_) {}
  }, [])

  const loadMessages = useCallback(async (sessionId) => {
    if (streamingSessionsRef.current[sessionId]) return // 正在生成时不要用后端数据覆盖前端包含动画的状态

    try {
      const res = await listMessages(sessionId)
      if (res.data?.success) {
        const msgs = res.data.data || []
        setMessagesMap(prev => ({
          ...prev,
          [sessionId]: msgs.length > 0 ? msgs : [{ id: 'welcome', role: 'ai', content: '你好！我是你的学业助手，有什么可以帮你的吗？' }]
        }))
      }
    } catch (_) {}
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId) {
      const latest = sessions[0]
      setCurrentSessionId(latest.id)
      loadMessages(latest.id)
    } else if (sessions.length === 0) {
      setMessagesMap(prev => ({
        ...prev,
        new: [{ id: 'welcome', role: 'ai', content: '你好！我是你的学业助手，有什么可以帮你的吗？' }]
      }))
    }
  }, [sessions, currentSessionId, loadMessages])

  const handleSelectSession = (session) => {
    setCurrentSessionId(session.id)
    loadMessages(session.id)
    setSidebarOpen(false)
  }

  const handleNewChat = async () => {
    try {
      const res = await newSession()
      if (res.data?.success) {
        const session = res.data.data
        setSessions((prev) => [session, ...prev])
        setCurrentSessionId(session.id)
        setMessagesMap(prev => ({ ...prev, [session.id]: [{ id: 'welcome', role: 'ai', content: '你好！我是你的学业助手，有什么可以帮你的吗？' }] }))
      }
    } catch (_) {}
    setSidebarOpen(false)
  }

  const handleClearAll = async () => {
    if (!window.confirm('确定要清空所有聊天记录吗？')) return
    try {
      await clearSessions()
      setSessions([])
      setCurrentSessionId(null)
      setMessagesMap({ new: [{ id: 'welcome', role: 'ai', content: '你好！我是你的学业助手，有什么可以帮你的吗？' }] })
    } catch (_) {}
  }

  // ── 图片选择 ───────────────────────────────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // 限制 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('图片不能超过 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result // data:image/jpeg;base64,...
      const base64 = dataUrl.split(',')[1]
      setPendingImage({ dataUrl, base64, mimeType: file.type || 'image/jpeg' })
    }
    reader.readAsDataURL(file)
    e.target.value = '' // 允许重复选同一文件
  }

  // ── 中断回答 ─────────────────────────────────────────────────────────────
  const stopStreaming = () => {
    const sid = activeId
    const es = esRefs.current[sid]
    if (es) {
      es.close()
      delete esRefs.current[sid]
      setStreamingSessions(prev => {
        const next = { ...prev }
        delete next[sid]
        streamingSessionsRef.current = next
        return next
      })
      setMessagesMap((prev) => {
        const msgs = prev[sid] || []
        const lastMsg = msgs[msgs.length - 1]
        if (lastMsg && lastMsg.id === 'thinking') {
          return {
            ...prev,
            [sid]: msgs.map((m) =>
              m.id === 'thinking' 
                ? { id: Date.now() + 1, role: 'ai', content: m.content === '__thinking__' ? '*(已中断)*' : m.content + '\n\n*(已中断)*' } 
                : m
            )
          }
        }
        return prev
      })
    }
  }

  // ── 发送消息（文字 / 多模态） ─────────────────────────────────────────────
  const sendMessage = () => {
    const q = input.trim()
    const currentSid = activeId
    if ((!q && !pendingImage) || streamingSessions[currentSid]) return

    const displayText = q || '请分析这张图片'
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = '44px'

    const capturedImage = pendingImage
    setPendingImage(null)

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: displayText,
      imageUrl: capturedImage?.dataUrl || null,
    }
    const thinkingMsg = { id: 'thinking', role: 'ai', content: '__thinking__', imageUrl: capturedImage?.dataUrl || null }
    
    let streamActiveId = currentSid
    setMessagesMap(prev => {
      const msgs = prev[streamActiveId] || []
      return { ...prev, [streamActiveId]: [...msgs, userMsg, thinkingMsg] }
    })
    setStreamingSessions(prev => {
      const next = { ...prev, [streamActiveId]: true }
      streamingSessionsRef.current = next
      return next
    })

    let accumulated = ''

    const handleMeta = (meta) => {
      if (meta.sessionId) {
        const sid = parseInt(meta.sessionId)
        if (streamActiveId === 'new') {
          setMessagesMap(prev => {
            const newMsgs = prev['new'] || []
            const { new: _, ...rest } = prev
            return { ...rest, [sid]: newMsgs }
          })
          setStreamingSessions(prev => {
            const { new: _, ...rest } = prev
            const next = { ...rest, [sid]: true }
            streamingSessionsRef.current = next
            return next
          })
          esRefs.current[sid] = esRefs.current['new']
          delete esRefs.current['new']
          streamActiveId = sid
          setCurrentSessionId(prev => prev === null ? sid : prev)
        }
        setSessions((prev) => {
          if (prev.find((s) => s.id === sid)) return prev
          return [{ id: sid, title: displayText.slice(0, 30) }, ...prev]
        })
      }
    }

    const handleChunk = (chunk) => {
      accumulated += chunk.replace(/\\n/g, '\n')
      setMessagesMap((prev) => {
        const msgs = prev[streamActiveId] || []
        return {
          ...prev,
          [streamActiveId]: msgs.map((m) => m.id === 'thinking' ? { ...m, content: accumulated } : m)
        }
      })
    }

    const handleDone = () => {
      delete esRefs.current[streamActiveId]
      setStreamingSessions(prev => {
        const next = { ...prev }
        delete next[streamActiveId]
        streamingSessionsRef.current = next
        return next
      })
      const finalContent = accumulated
      setMessagesMap((prev) => {
        const msgs = prev[streamActiveId] || []
        return {
          ...prev,
          [streamActiveId]: msgs.map((m) => m.id === 'thinking'
            ? { id: Date.now() + 1, role: 'ai', content: finalContent }
            : m)
        }
      })
      loadSessions()
    }

    const handleError = (err) => {
      delete esRefs.current[streamActiveId]
      setStreamingSessions(prev => {
        const next = { ...prev }
        delete next[streamActiveId]
        streamingSessionsRef.current = next
        return next
      })
      setMessagesMap((prev) => {
        const msgs = prev[streamActiveId] || []
        return {
          ...prev,
          [streamActiveId]: msgs.map((m) => m.id === 'thinking'
            ? { id: Date.now() + 1, role: 'ai', content: '⚠️ ' + (err || '网络错误，请稍后重试') }
            : m)
        }
      })
    }

    if (capturedImage) {
      // 多模态：POST SSE
      const handle = streamAskWithImage(
        displayText,
        currentSessionId,
        capturedImage.base64,
        capturedImage.mimeType,
        isDeepThink,
        { onMeta: handleMeta, onChunk: handleChunk, onDone: handleDone, onError: handleError }
      )
      esRefs.current[streamActiveId] = handle
    } else {
      // 纯文字：EventSource SSE
      const es = streamAsk(displayText, currentSessionId, isDeepThink)
      esRefs.current[streamActiveId] = es

      es.addEventListener('meta', (e) => {
        try { handleMeta(JSON.parse(e.data)) } catch (_) {}
      })
      es.onmessage = (e) => {
        const data = e.data
        if (data === '[DONE]') { es.close(); handleDone(); return }
        if (data.startsWith('[ERROR]')) { es.close(); handleError(data.replace('[ERROR] ', '')); return }
        handleChunk(data)
      }
      es.onerror = () => { es.close(); if (!accumulated) handleError('网络错误，请稍后重试') }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = '44px'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Sessions Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <div className={cn(
        'flex-shrink-0 w-72 bg-slate-950 flex flex-col border-r border-white/5',
        'fixed inset-y-0 left-0 z-30 md:relative md:flex transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">会话历史</span>
        </div>

        <div className="px-3 py-4">
          <Button
            variant="outline"
            onClick={handleNewChat}
            className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2 h-10 shadow-lg active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">开启新对话</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectSession(s)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all duration-200 truncate group flex items-center gap-2.5',
                currentSessionId === s.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <MessageSquare className={cn("w-3.5 h-3.5 flex-shrink-0 opacity-40 group-hover:opacity-100", currentSessionId === s.id && "opacity-100")} />
              <span className="truncate flex-1">{s.title || '无标题会话'}</span>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="w-full text-red-400/50 hover:text-red-400 hover:bg-red-400/5 gap-2 text-[10px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空记录
          </Button>
        </div>
      </div>
      {/* Main Chat area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-6 h-14 border-b bg-background/80 backdrop-blur-xl z-10 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-accent md:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <BrandLogo size={28} />
            <div className="flex flex-col justify-center">
              <h2 className="text-sm font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Study AI
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  System Online
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-background to-muted/10">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id || i}
                  msg={msg}
                  isStreaming={isStreaming && msg.id === 'thinking' && msg.content !== '__thinking__'}
                />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-20" />
          </div>
        </div>

        {/* Input area */}
        <div className="px-4 pb-6 pt-2 bg-gradient-to-t from-background via-background to-transparent flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <motion.div
              layout
              className="relative bg-card border border-border/60 rounded-2xl p-2.5 shadow-xl shadow-black/5 focus-within:border-primary/50 transition-colors"
            >
              {/* 图片预览 */}
              <AnimatePresence>
                {pendingImage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3 pt-2 pb-1"
                  >
                    <div className="relative inline-block">
                      <img
                        src={pendingImage.dataUrl}
                        alt="待发送图片"
                        className="h-24 max-w-xs rounded-xl object-cover border border-border/40 shadow-sm"
                      />
                      <button
                        onClick={() => setPendingImage(null)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Image className="w-2.5 h-2.5" />
                        图片已附加
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isStreaming
                    ? 'AI 正在回复中...'
                    : pendingImage
                    ? '描述你想问的问题（可留空直接发送）'
                    : '输入问题或指令，Shift + Enter 换行'
                }
                disabled={isStreaming}
                rows={1}
                className="flex-1 w-full bg-transparent resize-none outline-none text-sm py-2 px-3 min-h-[44px] max-h-[200px] disabled:opacity-50 placeholder:text-muted-foreground/60 leading-relaxed"
                style={{ height: '44px' }}
              />
              <div className="flex items-center justify-between px-2 pt-1 border-t border-border/40 mt-1">
                <div className="flex items-center gap-3">
                  {/* 图片上传按钮 */}
                  <button
                    type="button"
                    disabled={isStreaming}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'flex items-center gap-1.5 text-[11px] font-medium transition-colors rounded-lg px-2 py-1',
                      pendingImage
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                    title="上传图片（视觉分析）"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    {pendingImage ? '已选图片' : '图片'}
                  </button>
                  <button
                    type="button"
                    disabled={isStreaming}
                    onClick={() => setIsDeepThink(!isDeepThink)}
                    className={cn(
                      'flex items-center gap-1.5 text-[11px] font-medium transition-colors rounded-lg px-2 py-1',
                      isDeepThink
                        ? 'text-indigo-500 bg-indigo-500/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                    title="深度思考模式"
                  >
                    <span className="text-[12px]">🧠</span>
                    {isDeepThink ? '深度思考开' : '深度思考关'}
                  </button>
                  <span className="text-[10px] text-muted-foreground/50 font-medium ml-1">支持 Markdown</span>
                </div>
                <div className="flex gap-2">
                  {isStreaming && (
                    <Button
                      onClick={stopStreaming}
                      className="h-8 px-3 rounded-lg text-xs font-medium tracking-wide bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm flex items-center gap-1.5 border border-destructive/20"
                    >
                      <div className="w-1.5 h-1.5 rounded-sm bg-current animate-pulse" />
                      停止生成
                    </Button>
                  )}
                  {!isStreaming && (
                    <Button
                      size="icon"
                      onClick={sendMessage}
                      disabled={(!input.trim() && !pendingImage)}
                      className="h-8 w-8 rounded-lg shadow-lg shadow-primary/20 transition-transform hover:scale-105"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* 隐藏文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageSelect}
              />
            </motion.div>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-3 font-medium">
              本助手由大型语言模型驱动，支持文字与图片输入
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
