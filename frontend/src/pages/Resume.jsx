import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Trash2, Sparkles, MessageSquare, Download,
  ChevronDown, ChevronUp, Star, BookOpen, Target, Wand2,
  CheckCircle2, AlertCircle, Copy, Check, ArrowRight, BookMarked
} from 'lucide-react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import {
  uploadResume, listResumes, getResume, deleteResume,
  analyzeResume, askResume, matchJob, polishResume, triggerExtract
} from '@/api/resume'
import ResumeCanvas from '@/components/ResumeCanvas'
import LearningFlowPanel from '@/components/LearningFlowPanel'

const TABS = [
  { id: 'analyze', label: '5维分析', icon: Sparkles },
  { id: 'gap',     label: '岗位匹配 (Gap)', icon: Target },
  { id: 'polish',  label: 'STAR 精修', icon: Wand2 },
  { id: 'canvas',  label: '可画智能排版', icon: FileText },
  { id: 'learn',   label: '引导学习', icon: BookOpen },
]

const PRESET_ROLES = [
  'Java 后端开发工程师',
  '前端开发工程师',
  '全栈开发工程师',
  'Python / AI 算法工程师',
  '大数据与数据分析师',
  '软件测试 / QA 工程师',
]

export default function Resume() {
  const [resumes, setResumes] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [tab, setTab] = useState('analyze')

  // 5维分析状态
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [askInput, setAskInput] = useState('')
  const [askHistory, setAskHistory] = useState([])
  const [askLoading, setAskLoading] = useState(false)

  // 岗位匹配 & Gap 状态
  const [targetRole, setTargetRole] = useState(PRESET_ROLES[0])
  const [customRole, setCustomRole] = useState('')
  const [customJd, setCustomJd] = useState('')
  const [gapLoading, setGapLoading] = useState(false)
  const [gapData, setGapData] = useState(null)

  // STAR 润色状态
  const [polishing, setPolishing] = useState(false)
  const [polishedText, setPolishedText] = useState('')
  const [copied, setCopied] = useState(false)

  // 上传与解析状态
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showStructured, setShowStructured] = useState(false)

  const fileInputRef = useRef(null)
  const analysisRef = useRef(null)
  const polishRef = useRef(null)
  const sseRef = useRef(null)
  const polishSseRef = useRef(null)

  useEffect(() => { fetchList() }, [])

  useEffect(() => {
    if (selected) {
      fetchDetail(selected)
    } else {
      setDetail(null)
      setAnalysis('')
      setAskHistory([])
      setGapData(null)
      setPolishedText('')
    }
  }, [selected])

  useEffect(() => {
    if (analysisRef.current) {
      analysisRef.current.scrollTop = analysisRef.current.scrollHeight
    }
  }, [analysis])

  useEffect(() => {
    if (polishRef.current) {
      polishRef.current.scrollTop = polishRef.current.scrollHeight
    }
  }, [polishedText])

  const fetchList = async () => {
    try {
      const res = await listResumes()
      setResumes(res.data?.data || [])
    } catch (e) { console.error(e) }
  }

  const fetchDetail = async (id, isRetry = false) => {
    try {
      const res = await getResume(id)
      const d = res.data?.data
      setDetail(d)

      // 解析已有分析
      if (d?.analysisJson) {
        try {
          const parsed = JSON.parse(d.analysisJson)
          if (parsed.report) setAnalysis(parsed.report)
        } catch (e) {}
      }

      // 解析已有 Gap 数据
      if (d?.gapAnalysis) {
        try {
          const parsedGap = JSON.parse(d.gapAnalysis)
          setGapData(parsedGap)
        } catch (e) {}
      }
      if (d?.targetRole) {
        setTargetRole(d.targetRole)
      }

      // 检查结构化解析是否完成，未完成则轻量轮询/触发提取
      const hasStructured = d?.structuredJson && d.structuredJson !== '{}' && d.structuredJson.length > 10
      if (!hasStructured && !isRetry) {
        setExtracting(true)
        setTimeout(async () => {
          try {
            await triggerExtract(id)
            await fetchDetail(id, true)
          } catch (e) {}
          finally {
            setExtracting(false)
          }
        }, 2000)
      }
    } catch (e) { console.error(e) }
  }

  // ── 上传 ─────────────────────────────────────────────────────────────────

  const handleFile = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadResume(file)
      if (res.data?.success) {
        await fetchList()
        const newId = res.data.data.id
        setSelected(newId)
        fetchDetail(newId)
        setAnalysis('')
        setAskHistory([])
        setGapData(null)
        setPolishedText('')
      } else {
        alert('上传解析失败：' + (res.data?.message || '未知错误'))
      }
    } catch (e) {
      alert('上传失败：' + (e.response?.data?.message || e.message))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }
  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // ── 5维 AI 分析 ───────────────────────────────────────────────────────────

  const startAnalysis = () => {
    if (!selected || analyzing) return
    setAnalysis('')
    setAnalyzing(true)

    if (sseRef.current) sseRef.current.close()
    sseRef.current = analyzeResume(
      selected,
      (token) => setAnalysis(prev => prev + token),
      () => { setAnalyzing(false); fetchDetail(selected, true) },
      (err) => { setAnalyzing(false); console.error(err) }
    )
  }

  // ── 目标岗位技能 Gap 分析 ────────────────────────────────────────────────

  const runGapMatch = async () => {
    if (!selected || gapLoading) return
    const finalRole = customRole.trim() || targetRole
    setGapLoading(true)
    try {
      const res = await matchJob(selected, finalRole, customJd)
      if (res.data?.success) {
        const raw = res.data.data
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        setGapData(parsed)
      } else {
        alert(res.data?.message || '匹配分析失败')
      }
    } catch (e) {
      alert('匹配分析异常：' + (e.response?.data?.message || e.message))
    } finally {
      setGapLoading(false)
    }
  }

  // ── STAR 法则精修润色 ─────────────────────────────────────────────────────

  const startPolish = () => {
    if (!selected || polishing) return
    setPolishedText('')
    setPolishing(true)

    if (polishSseRef.current) polishSseRef.current.close()
    const finalRole = customRole.trim() || targetRole
    polishSseRef.current = polishResume(
      selected,
      finalRole,
      (token) => setPolishedText(prev => prev + token),
      () => setPolishing(false),
      (err) => { setPolishing(false); console.error(err) }
    )
  }

  const copyPolishedText = () => {
    if (!polishedText) return
    navigator.clipboard.writeText(polishedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── 导出 Markdown ─────────────────────────────────────────────────────────

  const exportAnalysis = () => {
    if (!analysis || !detail) return
    const content = `# 简历 5 维专业评估报告\n\n**文件名**: ${detail.filename}\n**综合评分**: ${detail.score || '待评'}\n\n---\n\n${analysis}`
    downloadBlob(content, `resume_analysis_${detail.id}.md`)
  }

  const exportPolished = () => {
    if (!polishedText || !detail) return
    const content = `# STAR 法则精修润色简历\n\n**原文件**: ${detail.filename}\n**目标岗位**: ${customRole || targetRole}\n\n---\n\n${polishedText}`
    downloadBlob(content, `polished_resume_${detail.id}.md`)
  }

  const downloadBlob = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── 追问 ──────────────────────────────────────────────────────────────────

  const sendQuestion = async () => {
    if (!askInput.trim() || !selected || askLoading) return
    const question = askInput.trim()
    setAskInput('')
    setAskLoading(true)
    const msgId = Date.now()
    setAskHistory(h => [
      ...h,
      { id: msgId, role: 'user', content: question },
      { id: msgId + 1, role: 'ai', content: '' }
    ])

    await askResume(
      selected,
      question,
      (token) => setAskHistory(h => h.map(m => m.id === msgId + 1 ? { ...m, content: m.content + token } : m)),
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
    try {
      const p = JSON.parse(detail.structuredJson)
      return (p && Object.keys(p).length > 0) ? p : null
    } catch { return null }
  })()

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            AI 简历优化中心
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">岗位技能 Gap 诊断 · 5维深度体检 · STAR法则润色 · 阶梯式学习建议</p>
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
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,.md"
                     className="hidden" onClick={(e) => e.stopPropagation()} onChange={onFileChange} />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">提取解析中…</p>
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
                        <Star className="w-2.5 h-2.5" />{r.score}分
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-rose-500 transition-all"
                  onClick={(e) => handleDelete(r.id, e)}
                  title="删除简历"
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
                <p className="text-sm text-muted-foreground mt-1">AI 将自动为您提取技能、计算岗位 Gap 并提供 STAR 精修方案</p>
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
                          ? 'text-emerald-500 border-b-2 border-emerald-500 font-semibold'
                          : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <div className="flex-1 flex overflow-hidden">
                {/* 简历左侧提取预览（常驻侧边抽屉，可展开收起，Canva 视图隐藏以提供全宽沉浸式画布） */}
                {tab !== 'canvas' && (
                  <div className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-card/20">
                    <div className="flex-shrink-0 p-3 border-b border-border flex items-center justify-between">
                      <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                        <BookMarked className="w-3.5 h-3.5 text-emerald-500" />
                        简历结构化预览
                      </h3>
                      {structured && (
                        <button onClick={() => setShowStructured(s => !s)}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                          {showStructured ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {showStructured ? '收起' : '展开'}
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      {extracting ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-xs text-muted-foreground">大模型结构化抽取中…</p>
                        </div>
                      ) : !structured ? (
                        <div className="py-6 text-center text-xs text-muted-foreground">
                          <p>暂无结构化信息</p>
                          <button
                            onClick={() => fetchDetail(selected, false)}
                            className="mt-2 text-emerald-500 hover:underline"
                          >
                            点击尝试重新提取
                          </button>
                        </div>
                      ) : (
                        <ResumeStructureView data={structured} expanded={showStructured} />
                      )}
                    </div>
                  </div>
                )}

                {/* 动态主视窗 */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <AnimatePresence mode="wait">

                    {/* ─── 1. 5维分析 ─────────────────────────────────────── */}
                    {tab === 'analyze' && (
                      <motion.div key="analyze" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                  className="h-full flex flex-col overflow-hidden">
                        {/* 工具栏 */}
                        <div className="flex-shrink-0 p-4 border-b border-border flex items-center gap-3">
                          <button
                            onClick={startAnalysis}
                            disabled={analyzing}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50
                                       text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                          >
                            <Sparkles className="w-4 h-4" />
                            {analyzing ? 'AI 分析中…' : analysis ? '重新进行 5 维体检' : '开始 5 维体检分析'}
                          </button>
                          {analysis && (
                            <button onClick={exportAnalysis}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground
                                               border border-border hover:border-foreground/30 rounded-lg transition-colors">
                              <Download className="w-4 h-4" />
                              导出分析报告
                            </button>
                          )}
                          {detail?.score != null && (
                            <div className={`ml-auto flex items-center gap-1.5 text-sm font-bold
                              ${detail.score >= 80 ? 'text-emerald-500' : detail.score >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                              <Star className="w-4 h-4" />
                              综合评分：{detail.score} / 100
                            </div>
                          )}
                        </div>

                        {/* 分析结果渲染 */}
                        <div ref={analysisRef} className="flex-1 overflow-y-auto p-6">
                          {!analysis && !analyzing && (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm font-medium">点击上方按钮，从内容完整度、STAR法则、量化数据、关键词、表达5个维度打分</p>
                              </div>
                            </div>
                          )}
                          {analyzing && !analysis && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                              正在深度分析你的简历…
                            </div>
                          )}
                          {analysis && <MarkdownRenderer content={analysis} />}
                        </div>

                        {/* 追问区域 */}
                        <div className="flex-shrink-0 border-t border-border p-4 bg-card/30">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-semibold text-foreground">针对简历向 AI 导师提问</span>
                          </div>
                          {askHistory.length > 0 && (
                            <div className="max-h-32 overflow-y-auto mb-3 space-y-2">
                              {askHistory.map(msg => (
                                <div key={msg.id} className={`text-xs ${msg.role === 'user'
                                  ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                  {msg.role === 'user' ? '👤 我：' : '🤖 AI：'}
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
                              placeholder="例：如何把我的第二个项目改写得更有说服力？"
                              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm
                                         text-foreground placeholder:text-muted-foreground
                                         focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              onClick={sendQuestion}
                              disabled={askLoading || !askInput.trim()}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40
                                         text-white rounded-lg transition-colors text-sm font-medium"
                            >
                              提问
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ─── 2. 目标匹配与 Gap 分析 ──────────────────────────── */}
                    {tab === 'gap' && (
                      <motion.div key="gap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                  className="h-full flex flex-col overflow-y-auto p-6 space-y-6">
                        {/* 岗位配置卡片 */}
                        <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-bold text-foreground">目标岗位对齐与差距分析</h3>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            选择你的求职方向或粘贴目标招聘 JD，AI 将量化评估你与该岗位的适配度，精准揪出技能短板 (Skill Gap)。
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">选择目标岗位</label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {PRESET_ROLES.map(r => (
                                  <button
                                    key={r}
                                    onClick={() => { setTargetRole(r); setCustomRole('') }}
                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                      targetRole === r && !customRole
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                                        : 'border-border hover:bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {r}
                                  </button>
                                ))}
                              </div>
                              <input
                                placeholder="或者输入其他自定义岗位名称…"
                                value={customRole}
                                onChange={e => setCustomRole(e.target.value)}
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">目标岗位 JD 要求（可选）</label>
                              <textarea
                                rows={4}
                                placeholder="可粘贴招聘要求，如：熟悉高并发调优、有微服务实践经验、熟练掌握 Redis 缓存架构等…"
                                value={customJd}
                                onChange={e => setCustomJd(e.target.value)}
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none resize-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={runGapMatch}
                              disabled={gapLoading}
                              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-md"
                            >
                              <Target className="w-4 h-4" />
                              {gapLoading ? '智能比对计算中…' : '开始技能 Gap 匹配分析'}
                            </button>
                          </div>
                        </div>

                        {/* 分析结果面板 */}
                        {gapData ? (
                          <div className="space-y-6">
                            {/* 匹配度评分与概览卡片 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-center items-center text-center">
                                <span className="text-xs text-muted-foreground mb-1">岗位综合契合度</span>
                                <div className="text-4xl font-extrabold text-emerald-500">
                                  {gapData.matchScore || 75}%
                                </div>
                                <div className="w-full bg-muted h-2 rounded-full mt-3 overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, gapData.matchScore || 75)}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-muted-foreground mt-2">目标岗位：{gapData.targetRole || targetRole}</span>
                              </div>

                              <div className="p-5 rounded-2xl border border-border bg-card col-span-2 space-y-3">
                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Gap 评估总结</h4>
                                <p className="text-sm text-foreground/90 leading-relaxed">{gapData.gapSummary || '具备良好基础，建议进一步扩充实战工程项目。'}</p>

                                <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-2">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> 已具备核心优势
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(gapData.matchedSkills || []).map((s, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded font-medium">
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 mb-2">
                                      <AlertCircle className="w-3.5 h-3.5" /> 核心缺失短板 (Skill Gap)
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(gapData.missingSkills || []).map((s, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 rounded font-medium">
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 阶梯式补短板路线 */}
                            {gapData.learningPath && gapData.learningPath.length > 0 && (
                              <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                  <ArrowRight className="w-4 h-4 text-emerald-500" />
                                  定制阶梯式学习流路线建议
                                </h4>
                                <div className="space-y-3">
                                  {gapData.learningPath.map((step, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-border/70 bg-muted/40 hover:bg-muted/70 transition-colors">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{step.stage}</span>
                                        {step.recommendedDoc && (
                                          <span className="text-[11px] px-2 py-0.5 rounded bg-foreground/5 text-muted-foreground">
                                            推荐学习：{step.recommendedDoc}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm font-semibold text-foreground">{step.focus}</p>
                                      <p className="text-xs text-muted-foreground mt-1">实践行动：{step.actions}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : !gapLoading && (
                          <div className="py-12 text-center text-muted-foreground text-sm">
                            选择上方目标岗位，点击「开始技能 Gap 匹配分析」获取适配度与短板报告
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ─── 3. STAR 法则精修 ────────────────────────────────── */}
                    {tab === 'polish' && (
                      <motion.div key="polish" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                  className="h-full flex flex-col overflow-hidden">
                        <div className="flex-shrink-0 p-4 border-b border-border flex items-center gap-3">
                          <button
                            onClick={startPolish}
                            disabled={polishing}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                          >
                            <Wand2 className="w-4 h-4" />
                            {polishing ? 'STAR 润色精修中…' : polishedText ? '重新精修' : '一键 STAR 精修润色'}
                          </button>

                          {polishedText && (
                            <>
                              <button
                                onClick={copyPolishedText}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
                              >
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                {copied ? '已复制到剪贴板' : '复制全文'}
                              </button>
                              <button
                                onClick={exportPolished}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                导出 Markdown
                              </button>
                            </>
                          )}
                        </div>

                        <div ref={polishRef} className="flex-1 overflow-y-auto p-6">
                          {!polishedText && !polishing && (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center max-w-md">
                                <Wand2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                <h3 className="text-sm font-bold text-foreground mb-1">STAR 法则量化润色器</h3>
                                <p className="text-xs text-muted-foreground">
                                  基于 10 年资深技术顾问 Prompt，深度重构您的项目经历（背景、职责、具体行动、量化成果），全面替换空洞描述。
                                </p>
                              </div>
                            </div>
                          )}
                          {polishing && !polishedText && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                              正在为您重构并润色简历…
                            </div>
                          )}
                          {polishedText && <MarkdownRenderer content={polishedText} />}
                        </div>
                      </motion.div>
                    )}

                    {/* ─── 4. 可画智能排版 ───────────────────────────────────── */}
                    {tab === 'canvas' && (
                      <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                        <ResumeCanvas
                          resumeId={selected}
                          detail={detail}
                          onResumeUpdated={() => fetchDetail(selected, true)}
                        />
                      </motion.div>
                    )}

                    {/* ─── 5. 引导学习 ─────────────────────────────────────── */}
                    {tab === 'learn' && (
                      <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto">
                        <LearningFlowPanel flowType="resume_basics" />
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
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
    <div className="space-y-4 text-xs">
      {data.name && (
        <div className="p-2.5 rounded-lg bg-card border border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">姓名 / 意向</p>
          <p className="font-bold text-sm text-foreground mt-0.5">{data.name}</p>
          {data.targetRole && <p className="text-emerald-500 font-medium text-xs mt-0.5">{data.targetRole}</p>}
        </div>
      )}

      {data.skills?.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">已识别技术栈</p>
          <div className="flex flex-wrap gap-1">
            {data.skills.slice(0, expanded ? 999 : 8).map((s, i) => (
              <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[11px] font-medium">
                {s}
              </span>
            ))}
            {!expanded && data.skills.length > 8 && (
              <span className="px-1.5 py-0.5 text-muted-foreground text-[10px]">+{data.skills.length - 8}</span>
            )}
          </div>
        </div>
      )}

      {expanded && data.education?.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">教育背景</p>
          {data.education.map((e, i) => (
            <div key={i} className="mb-2 p-2 rounded bg-card/60 border border-border">
              <p className="font-semibold text-foreground">{e.school}</p>
              <p className="text-muted-foreground text-[11px]">{e.major} · {e.degree} · {e.period}</p>
            </div>
          ))}
        </div>
      )}

      {expanded && data.projects?.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">项目经历</p>
          {data.projects.map((p, i) => (
            <div key={i} className="mb-2 p-2 rounded bg-card/60 border border-border">
              <p className="font-semibold text-foreground">{p.name}</p>
              {p.tech && <p className="text-[10px] text-emerald-500 mb-1">{p.tech}</p>}
              <p className="text-muted-foreground line-clamp-3 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

