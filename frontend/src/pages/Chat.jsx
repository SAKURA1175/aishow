import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Plus, Trash2, MessageSquare, Menu, Paperclip, X, Image, PanelLeftClose, PanelLeftOpen, BookOpen, ExternalLink, ChevronDown, ChevronUp, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { listMessages, streamAsk, streamAskWithImage } from '@/api/chat'
import useStore from '@/store/useStore'
import { cn } from '@/lib/utils'
import BrandLogo from '@/components/BrandLogo'
import { useOutletContext } from 'react-router-dom'

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

function CitationBlock({ refs }) {
  const [expanded, setExpanded] = useState(false)
  if (!refs || refs.length === 0) return null

  const webRefs = refs.filter(r => r.url)
  const docRefs = refs.filter(r => !r.url)

  return (
    <div className="mt-4 pt-3 border-t border-border/40">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 font-medium"
      >
        {webRefs.length > 0
          ? <Globe className="w-3.5 h-3.5 text-blue-500" />
          : <BookOpen className="w-3.5 h-3.5" />}
        <span>
          {webRefs.length > 0 ? `网页来源 · ${webRefs.length} 条` : ''}
          {webRefs.length > 0 && docRefs.length > 0 ? ' · ' : ''}
          {docRefs.length > 0 ? `知识库 · ${docRefs.length} 条` : ''}
        </span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="space-y-2">
          {webRefs.map((ref, i) => (
            <a
              key={'w' + i}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-2 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs hover:bg-blue-500/10 transition-colors group"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/15 text-blue-500 font-bold flex items-center justify-center text-[10px]">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground/80 truncate group-hover:text-blue-500 transition-colors">
                  {ref.title || ref.url}
                </p>
                {ref.snippet && <p className="text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{ref.snippet}</p>}
                <p className="text-muted-foreground/50 text-[10px] mt-1 truncate flex items-center gap-1">
                  <ExternalLink className="w-2.5 h-2.5" />{ref.url}
                </p>
              </div>
            </a>
          ))}
          {docRefs.map((ref, i) => (
            <div
              key={'d' + i}
              className="flex gap-2 p-2.5 rounded-xl bg-muted/50 border border-border/30 text-xs"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-[10px]">
                {ref.index || (i + 1)}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground/80 truncate">{ref.docName}</p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{ref.snippet}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SearchingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-8 h-8">
        <BrandLogo size={28} animated={true} />
      </div>
      <div className="flex gap-0.5 items-center font-medium text-[13px] text-blue-500 tracking-wide">
        <Globe className="w-3.5 h-3.5 mr-1 animate-pulse" />
        联网搜索中
        <span className="flex w-3 ml-0.5">
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>.</motion.span>
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>.</motion.span>
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>.</motion.span>
        </span>
      </div>
    </div>
  )
}

function MessageBubble({ msg, isStreaming, refs, searchStatus }) {
  const isAi = msg.role === 'ai' || msg.role === 'assistant'

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        'flex gap-4 mb-6 group px-4',
        !isAi && 'flex-row-reverse'
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 shadow-md border',
        isAi ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-800 text-white border-slate-700'
      )}>
        {isAi ? 'AI' : '我'}
      </div>

      <div className={cn(
        'max-w-[85%] min-w-0 rounded-2xl px-5 py-4 shadow-sm border',
        isAi 
          ? 'bg-card border-border/60 rounded-tl-sm shadow-black/5' 
          : 'bg-primary/5 border-primary/20 rounded-tr-sm'
      )}>
        {/* 图片附件（仅用户消息有） */}
        {msg.imageUrl && (
          <div className="mb-3">
            <img
              src={msg.imageUrl}
              alt="上传的图片"
              className="max-w-sm max-h-64 rounded-xl border border-border/40 object-cover shadow-sm"
            />
          </div>
        )}

        {msg.content === '__thinking__' ? (
          <div className="flex items-center py-1">
            {searchStatus ? <SearchingIndicator /> : <TypingIndicator />}
          </div>
        ) : isAi ? (
          <>
            <MarkdownRenderer
              content={msg.content}
              streaming={isStreaming}
              className="text-sm leading-relaxed"
            />
            {!isStreaming && refs && refs.length > 0 && (
              <CitationBlock refs={refs} />
            )}
          </>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{msg.content}</p>
        )}
      </div>
    </motion.div>
  )
}


export default function Chat() {
  const { user, sessions, currentSessionId, setCurrentSessionId, loadSessions } = useStore()
  const [messagesMap, setMessagesMap] = useState({ new: [{ id: 'welcome', role: 'ai', content: '你好！我是你的学业助手，有什么可以帮你的吗？' }] })
  const [streamingSessions, setStreamingSessions] = useState({})
  const [refsMap, setRefsMap] = useState({}) // msgId -> [{index, docId, docName, snippet}]
  const [searchStatusMap, setSearchStatusMap] = useState({}) // sessionId -> status string
  
  const streamingSessionsRef = useRef({})
  const esRefs = useRef({})

  const activeId = currentSessionId || 'new'
  const messages = messagesMap[activeId] || []
  const isStreaming = !!streamingSessions[activeId]

  const [input, setInput] = useState('')
  const { setSidebarOpen } = useOutletContext()
  const [isDeepThink, setIsDeepThink] = useState(false)
  const [isWebSearch, setIsWebSearch] = useState(false)

  // 图片附件状态
  const [pendingImage, setPendingImage] = useState(null) // { dataUrl, base64, mimeType }

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

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

  // 当外部 currentSessionId 改变时加载消息
  useEffect(() => {
    if (currentSessionId && !messagesMap[currentSessionId]) {
      loadMessages(currentSessionId)
    }
  }, [currentSessionId, loadMessages, messagesMap])

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
        useStore.setState(prev => {
          const sessions = prev.sessions
          if (sessions.find((s) => s.id === sid)) return prev
          return { sessions: [{ id: sid, title: displayText.slice(0, 30) }, ...sessions] }
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
        isWebSearch,
        { onMeta: handleMeta, onChunk: handleChunk, onDone: handleDone, onError: handleError }
      )
      esRefs.current[streamActiveId] = handle
    } else {
      // 纯文字：EventSource SSE
      const es = streamAsk(displayText, currentSessionId, isDeepThink, isWebSearch)
      esRefs.current[streamActiveId] = es

      es.addEventListener('meta', (e) => {
        try { handleMeta(JSON.parse(e.data)) } catch (_) {}
      })
      es.addEventListener('refs', (e) => {
        try {
          const refs = JSON.parse(e.data)
          setRefsMap(prev => ({ ...prev, [streamActiveId + '_pending']: refs }))
        } catch (_) {}
      })
      es.addEventListener('status', (e) => {
        setSearchStatusMap(prev => ({ ...prev, [streamActiveId]: e.data }))
      })
      es.onmessage = (e) => {
        const data = e.data
        if (data === '[DONE]') {
          es.close()
          setRefsMap(prev => {
            const pending = prev[streamActiveId + '_pending']
            if (!pending) return prev
            const next = { ...prev }
            delete next[streamActiveId + '_pending']
            next[streamActiveId + '_latest'] = pending
            return next
          })
          setSearchStatusMap(prev => { const n = {...prev}; delete n[streamActiveId]; return n })
          handleDone()
          return
        }
        if (data.startsWith('[ERROR]')) { es.close(); handleError(data.replace('[ERROR] ', '')); return }
        handleChunk(data)
      }
      es.onerror = () => { es.close(); if (!accumulated) handleError('网络错误，请稍后重试') }
    }
  }

  const handleKeyDown = (e) => {
    // 忽略输入法组合期间的 Enter 键（如：拼音输入时按回车选词）
    if (e.nativeEvent.isComposing) return
    
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
      {/* Main Chat area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-6 h-14 border-b bg-background/80 backdrop-blur-xl z-10 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <PanelLeftOpen className="w-5 h-5 hidden md:block" />
            <Menu className="w-5 h-5 md:hidden" />
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
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-4xl mx-auto pt-8 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                // 找最近一条 AI 消息的引用
                const isLastAi = msg.role === 'ai' && i === messages.map(m => m.role).lastIndexOf('ai')
                const refs = isLastAi ? (refsMap[activeId + '_latest'] || refsMap[activeId + '_pending']) : null
                const searchStatus = isLastAi ? searchStatusMap[activeId] : null
                return (
                  <MessageBubble
                    key={msg.id || i}
                    msg={msg}
                    isStreaming={isStreaming && msg.id === 'thinking' && msg.content !== '__thinking__'}
                    refs={refs}
                    searchStatus={searchStatus}
                  />
                )
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-20" />
          </div>
        </div>

        {/* Input area */}
        <div className="px-4 pb-8 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <motion.div
              layout
              className="relative bg-card border border-border/80 rounded-3xl p-3 shadow-2xl shadow-primary/5 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all duration-300"
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
                className="flex-1 w-full bg-transparent resize-none outline-none text-[15px] py-2 px-3 min-h-[44px] max-h-[200px] disabled:opacity-50 placeholder:text-muted-foreground/50 leading-relaxed"
                style={{ height: '44px' }}
              />
              <div className="flex items-center justify-between px-2 pt-2 border-t border-border/40 mt-1">
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
                  <button
                    type="button"
                    disabled={isStreaming}
                    onClick={() => setIsWebSearch(!isWebSearch)}
                    className={cn(
                      'flex items-center gap-1.5 text-[11px] font-medium transition-colors rounded-lg px-2 py-1',
                      isWebSearch
                        ? 'text-blue-500 bg-blue-500/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                    title="联网搜索"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {isWebSearch ? '联网搜索开' : '联网搜索关'}
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
