import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Trash2, Sparkles, MessageSquare, Download,
         ChevronDown, ChevronUp, Star, BookOpen } from 'lucide-react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { uploadResume, listResumes, getResume, deleteResume,
         analyzeResume, askResume } from '@/api/resume'
import ResumeCanvas from '@/components/ResumeCanvas'
import LearningFlowPanel from '@/components/LearningFlowPanel'

const TABS = [
  { id: 'analyze', label: '简历分析', icon: Sparkles },
  { id: 'canvas',  label: '画板标注', icon: FileText },
  { id: 'learn',   label: '引导学习', icon: BookOpen },
]

export default function Resume() {
  const [resumes, setResumes] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [tab, setTab] = useState('analyze')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [askInput, setAskInput] = useState('')
  const [askHistory, setAskHistory] = useState([])
  const [askLoading, setAskLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showStructured, setShowStructured] = useState(false)
  const fileInputRef = useRef(null)
  const analysisRef = useRef(null)
  const sseRef = useRef(null)

  useEffect(() => { fetchList() }, [])

  useEffect(() => {
    if (selected) fetchDetail(selected)
    else { setDetail(null); setAnalysis(''); setAskHistory([]) }
  }, [selected])

  useEffect(() => {
    if (analysisRef.current) {
      analysisRef.current.scrollTop = analysisRef.current.scrollHeight
    }
  }, [analysis])

  const fetchList = async () => {
    try {
      const res = await listResumes()
      setResumes(res.data?.data || [])
    } catch (e) { console.error(e) }
  }

  const fetchDetail = async (id) => {
    try {
      const res = await getResume(id)
      setDetail(res.data?.data)
      // 如果已有分析结果就直接展示
      const d = res.data?.data
      if (d?.analysisJson) {
        try {
          const parsed = JSON.parse(d.analysisJson)
          if (parsed.report) setAnalysis(parsed.report)
        } catch (e) {}
      }
    } catch (e) {}
  }

  // ── 上传 ─────────────────────────────────────────────────────────────────

  const handleFile = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadResume(file)
      if (res.data?.success) {
        await fetchList()
        setSelected(res.data.data.id)
        setAnalysis('')
        setAskHistory([])
      }
    } catch (e) {
      alert('上传失败：' + (e.response?.data?.message || e.message))
    } finally {
      setUploading(false)
    }
  }

  const onFileChange = (e) => handleFile(e.target.files[0])
  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  // ── AI 分析 ───────────────────────────────────────────────────────────────

  const startAnalysis = () => {
    if (!selected || analyzing) return
    setAnalysis(''); setAnalyzing(true)

    if (sseRef.current) sseRef.current.close()
    sseRef.current = analyzeResume(
      selected,
      (token) => setAnalysis(prev => prev + token),
      () => { setAnalyzing(false); fetchDetail(selected) },
      (err) => { setAnalyzing(false); console.error(err) }
    )
  }

  // ── 导出 Markdown ─────────────────────────────────────────────────────────

  const exportMarkdown = () => {
    if (!analysis || !detail) return
    const content = `# 简历分析报告\n\n**文件**: ${detail.filename}\n\n---\n\n${analysis}`
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `resume_analysis_${detail.id}.md`; a.click()
    URL.revokeObjectURL(url)
  }

  // ── 追问 ──────────────────────────────────────────────────────────────────

  const sendQuestion = async () => {
    if (!askInput.trim() || !selected || askLoading) return
    const question = askInput.trim()
    setAskInput('')
    setAskLoading(true)
    const msgId = Date.now()
    setAskHistory(h => [...h, { id: msgId, role: 'user', content: question }, { id: msgId+1, role: 'ai', content: '' }])

    await askResume(
      selected,
      question,
      (token) => setAskHistory(h => h.map(m => m.id === msgId+1 ? { ...m, content: m.content + token } : m)),
      () => setAskLoading(false),
      (err) => { setAskLoading(false); console.error(err) }
    )
  }

  // ── 删除 ──────────────────────────────────────────────────────────────────

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('确定删除这份简历？')) return
    await deleteResume(id)
    if (selected === id) setSelected(null)
    await fetchList()
  }

  // ── 解析结构化 JSON ──────────────────────────────────────────────────────

  const structured = (() => {
    if (!detail?.structuredJson) return null
    try { return JSON.parse(detail.structuredJson) } catch { return null }
  })()

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            简历优化中心
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">AI 驱动的简历分析与引导式写作</p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ─── 左侧面板 ───────────────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-card/50">
          {/* 上传区域 */}
          <div className="p-4">
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                ${dragOver ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-emerald-500/50 hover:bg-muted/50'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt"
                     className="hidden" onChange={onFileChange} />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">解析中…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">上传简历</p>
                  <p className="text-xs text-muted-foreground">PDF · DOCX · TXT</p>
                </div>
              )}
            </div>
          </div>

          {/* 简历列表 */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              我的简历 ({resumes.length})
            </p>
            {resumes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                还没有上传任何简历
              </p>
            )}
            {resumes.map(r => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150
                  ${selected === r.id
                    ? 'bg-emerald-500/15 border border-emerald-500/30'
                    : 'hover:bg-muted border border-transparent'}`}
                onClick={() => setSelected(r.id)}
              >
                <FileText className={`w-4 h-4 flex-shrink-0 ${selected === r.id ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.filename}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground uppercase">{r.fileType}</span>
                    {r.score != null && (
                      <span className={`text-xs font-bold flex items-center gap-0.5
                        ${r.score >= 80 ? 'text-emerald-500' : r.score >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                        <Star className="w-2.5 h-2.5" />{r.score}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-rose-500 transition-all"
                  onClick={(e) => handleDelete(r.id, e)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ─── 右侧主区域 ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">选择或上传一份简历</h2>
                <p className="text-sm text-muted-foreground mt-1">AI 将帮你分析并提供专业的优化建议</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tab 栏 */}
              <div className="flex-shrink-0 border-b border-border px-6 pt-2 flex items-center gap-1">
                {TABS.map(t => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                        ${tab === t.id
                          ? 'text-emerald-500 border-b-2 border-emerald-500'
                          : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {tab === 'analyze' && (
                    <motion.div key="analyze" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="h-full flex overflow-hidden">

                      {/* 简历预览（结构化） */}
                      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col">
                        <div className="flex-shrink-0 p-4 border-b border-border flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-foreground">简历预览</h3>
                          {structured && (
                            <button onClick={() => setShowStructured(s => !s)}
                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                              {showStructured ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {showStructured ? '收起' : '展开'}
                            </button>
                          )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                          {!structured ? (
                            <p className="text-xs text-muted-foreground">结构化解析中…</p>
                          ) : (
                            <ResumeStructureView data={structured} expanded={showStructured} />
                          )}
                        </div>
                      </div>

                      {/* 分析区域 */}
                      <div className="flex-1 flex flex-col overflow-hidden">
                        {/* 工具栏 */}
                        <div className="flex-shrink-0 p-4 border-b border-border flex items-center gap-3">
                          <button
                            onClick={startAnalysis}
                            disabled={analyzing}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50
                                       text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Sparkles className="w-4 h-4" />
                            {analyzing ? 'AI 分析中…' : analysis ? '重新分析' : '开始 AI 分析'}
                          </button>
                          {analysis && (
                            <button onClick={exportMarkdown}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground
                                               border border-border hover:border-foreground/30 rounded-lg transition-colors">
                              <Download className="w-4 h-4" />
                              导出
                            </button>
                          )}
                          {detail?.score != null && (
                            <div className={`ml-auto flex items-center gap-1.5 text-sm font-bold
                              ${detail.score >= 80 ? 'text-emerald-500' : detail.score >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                              <Star className="w-4 h-4" />
                              评分 {detail.score}/100
                            </div>
                          )}
                        </div>

                        {/* 分析结果 */}
                        <div ref={analysisRef} className="flex-1 overflow-y-auto p-4">
                          {!analysis && !analyzing && (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">点击「开始 AI 分析」获取专业评估报告</p>
                              </div>
                            </div>
                          )}
                          {analyzing && !analysis && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                              正在分析你的简历…
                            </div>
                          )}
                          {analysis && <MarkdownRenderer content={analysis} />}
                        </div>

                        {/* 追问区域 */}
                        <div className="flex-shrink-0 border-t border-border p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">追问简历</span>
                          </div>
                          {/* 追问历史 */}
                          {askHistory.length > 0 && (
                            <div className="max-h-36 overflow-y-auto mb-3 space-y-2">
                              {askHistory.map(msg => (
                                <div key={msg.id} className={`text-sm ${msg.role === 'user'
                                  ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                  {msg.role === 'user' ? '👤 ' : '🤖 '}
                                  <MarkdownRenderer content={msg.content} compact />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              value={askInput}
                              onChange={e => setAskInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendQuestion()}
                              placeholder="例：如何优化项目经历描述？"
                              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm
                                         text-foreground placeholder:text-muted-foreground
                                         focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              onClick={sendQuestion}
                              disabled={askLoading || !askInput.trim()}
                              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40
                                         text-white rounded-lg transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {tab === 'canvas' && (
                    <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                      <ResumeCanvas resumeId={selected} />
                    </motion.div>
                  )}

                  {tab === 'learn' && (
                    <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-y-auto">
                      <LearningFlowPanel flowType="resume_basics" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 结构化简历展示子组件 ──────────────────────────────────────────────────────

function ResumeStructureView({ data, expanded }) {
  if (!data) return null
  return (
    <div className="space-y-4 text-sm">
      {data.name && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">姓名</p>
          <p className="font-semibold text-foreground">{data.name}</p>
          {data.targetRole && <p className="text-muted-foreground text-xs mt-0.5">{data.targetRole}</p>}
        </div>
      )}
      {data.skills?.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">技术栈</p>
          <div className="flex flex-wrap gap-1">
            {data.skills.slice(0, expanded ? 999 : 8).map((s, i) => (
              <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400
                                       text-xs rounded-full font-medium">{s}</span>
            ))}
            {!expanded && data.skills.length > 8 && (
              <span className="px-2 py-0.5 text-muted-foreground text-xs">+{data.skills.length - 8}</span>
            )}
          </div>
        </div>
      )}
      {expanded && data.education?.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">教育经历</p>
          {data.education.map((e, i) => (
            <div key={i} className="mb-2">
              <p className="font-medium text-foreground">{e.school}</p>
              <p className="text-xs text-muted-foreground">{e.major} · {e.degree} · {e.period}</p>
            </div>
          ))}
        </div>
      )}
      {expanded && data.projects?.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">项目经历</p>
          {data.projects.map((p, i) => (
            <div key={i} className="mb-2">
              <p className="font-medium text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
