import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, ChevronRight, RefreshCw, Sparkles } from 'lucide-react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { getFlowProgress, startFlow, nextFlowStep, submitFlowStep, getFlowSummary } from '@/api/resume'

/**
 * 引导式学习面板
 * 支持三种步骤类型：text（文本输入）、choice（选择题）、summary（AI 生成总结）
 */
export default function LearningFlowPanel({ flowType }) {
  const [progress, setProgress]     = useState(null)
  const [stepDef,  setStepDef]      = useState(null)
  const [answer,   setAnswer]       = useState('')
  const [feedback, setFeedback]     = useState('')
  const [loading,  setLoading]      = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [completed, setCompleted]   = useState(false)
  const [summary,  setSummary]      = useState('')
  const [loadingStart, setLoadingStart] = useState(true)
  const feedbackRef = useRef(null)

  useEffect(() => { fetchProgress() }, [flowType])

  useEffect(() => {
    if (feedbackRef.current) feedbackRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [feedback])

  const fetchProgress = async () => {
    setLoadingStart(true)
    try {
      const res = await getFlowProgress(flowType)
      const p = res.data?.data
      setProgress(p)
      if (p?.status === 'completed') setCompleted(true)
    } catch (e) { console.error(e) }
    finally { setLoadingStart(false) }
  }

  // ── 开始 / 重置流程 ────────────────────────────────────────────────────

  const handleStart = async () => {
    try {
      const res = await startFlow(flowType)
      setProgress(res.data?.data)
      setFeedback(''); setAnswer(''); setSubmitted(false); setCompleted(false); setSummary('')
    } catch (e) { console.error(e) }
  }

  // ── 提交当前步骤 ───────────────────────────────────────────────────────

  const handleSubmit = async (choiceAnswer = null) => {
    const finalAnswer = choiceAnswer ?? answer
    if (!finalAnswer?.trim() || loading) return

    setLoading(true); setFeedback('')

    await submitFlowStep(
      flowType,
      progress.currentStep,
      finalAnswer,
      (token) => setFeedback(f => f + token),
      () => { setLoading(false); setSubmitted(true) },
      (e)  => { setLoading(false); console.error(e) }
    )
  }

  // ── 进入下一步 ─────────────────────────────────────────────────────────

  const handleNext = async () => {
    setLoading(true)
    try {
      const res = await nextFlowStep(flowType)
      const d = res.data?.data
      if (d?.completed) {
        setCompleted(true)
        // 触发总结报告生成
        setSummary('')
        getFlowSummary(
          flowType,
          (token) => setSummary(s => s + token),
          () => {},
          (e) => console.error(e)
        )
      } else {
        setProgress(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))
        setFeedback(''); setAnswer(''); setSubmitted(false)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // ── 渲染 ───────────────────────────────────────────────────────────────

  if (loadingStart) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Sparkles className="w-10 h-10 text-emerald-500" />
        <h3 className="text-lg font-semibold text-foreground">简历基础写作课</h3>
        <p className="text-sm text-muted-foreground">5 步引导，打造亮眼技术简历</p>
        <button onClick={handleStart}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-colors">
          开始学习
        </button>
      </div>
    )
  }

  // 已完成 → 展示总结报告
  if (completed) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">课程完成！</h2>
            <p className="text-sm text-muted-foreground">正在为你生成简历优化报告…</p>
          </div>
          <button onClick={handleStart} className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" /> 重新开始
          </button>
        </div>

        {summary ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer content={summary} />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            生成报告中…
          </div>
        )}
      </div>
    )
  }

  const total = progress.totalSteps ?? 5
  const current = progress.currentStep ?? 1
  const progressPct = ((current - 1) / total) * 100

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* 进度条 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {Array.from({ length: total }, (_, i) => (
              <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all
                ${i + 1 < current ? 'bg-emerald-500 text-white' :
                  i + 1 === current ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-500' :
                  'bg-muted text-muted-foreground'}`}>
                {i + 1 < current ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{current}/{total}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* 步骤内容 — 从后端 progress 和前端 flow JSON 对应 */}
      <StepContent
        flowType={flowType}
        stepId={current}
        answer={answer}
        setAnswer={setAnswer}
        onSubmit={handleSubmit}
        feedback={feedback}
        feedbackRef={feedbackRef}
        loading={loading}
        submitted={submitted}
        onNext={handleNext}
      />
    </div>
  )
}

// ── 步骤内容子组件 ────────────────────────────────────────────────────────────

function StepContent({ flowType, stepId, answer, setAnswer, onSubmit, feedback, feedbackRef, loading, submitted, onNext }) {
  // 步骤定义从静态配置中读取（与后端 JSON 保持一致）
  const STEPS = {
    resume_basics: [
      { id: 1, type: 'text',   title: '目标岗位定位',
        instruction: '你期望应聘什么岗位？\n\n例：Java 后端开发、前端工程师、全栈工程师',
        placeholder: '输入你的目标岗位…' },
      { id: 2, type: 'choice', title: '教育背景',
        instruction: '你的最高学历是？',
        choices: [
          { label: '🎓 本科（211/985）',  value: 'bachelor_985' },
          { label: '🎓 本科（普通院校）', value: 'bachelor_normal' },
          { label: '🎓 专科',            value: 'associate' },
          { label: '🎓 硕士及以上',       value: 'master_plus' },
        ]},
      { id: 3, type: 'text',   title: '项目经历（STAR 法则）',
        instruction: '用 STAR 法则描述你最亮点的项目：\n\n🔹 S：项目背景\n🔹 T：你的职责\n🔹 A：具体行动（技术栈）\n🔹 R：可量化的成果',
        placeholder: '例：负责 Study AI 的 RAG 模块（T），基于 ChromaDB + BGE-M3 实现向量检索（A），搜索准确率提升 40%（R）' },
      { id: 4, type: 'text',   title: '技术栈梳理',
        instruction: '列出你掌握的技术技能（用逗号分隔）',
        placeholder: 'Java, Spring Boot, React, MySQL, Redis, Docker, Git…' },
      { id: 5, type: 'summary', title: '生成优化报告',
        instruction: '已收集完所有信息！点击下方按钮，AI 将为你生成完整的简历优化建议报告。' },
    ]
  }

  const steps = STEPS[flowType] || []
  const step = steps.find(s => s.id === stepId) || steps[0]
  if (!step) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div key={stepId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
                  className="space-y-5">

        {/* 步骤标题 + 说明 */}
        <div className="p-5 bg-card border border-border rounded-xl">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
              {step.id}
            </span>
            {step.title}
          </h3>
          <p className="text-sm text-foreground whitespace-pre-line">{step.instruction}</p>
        </div>

        {/* 输入区 */}
        {!submitted && step.type === 'text' && (
          <div className="space-y-3">
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder={step.placeholder}
              rows={5}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground
                         placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
            />
            <button
              onClick={() => onSubmit()}
              disabled={!answer.trim() || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600
                         disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'AI 评估中…' : '提交并获取反馈'}
            </button>
          </div>
        )}

        {!submitted && step.type === 'choice' && (
          <div className="grid grid-cols-1 gap-3">
            {step.choices.map(c => (
              <button
                key={c.value}
                onClick={() => onSubmit(c.label)}
                disabled={loading}
                className="flex items-center justify-between p-4 bg-card border border-border hover:border-emerald-500/50
                           hover:bg-emerald-500/5 rounded-xl text-sm text-left transition-all disabled:opacity-40"
              >
                <span className="font-medium text-foreground">{c.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {!submitted && step.type === 'summary' && (
          <button
            onClick={() => onSubmit('generate_summary')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600
                       disabled:opacity-40 text-white font-medium rounded-xl transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            {loading ? '生成中…' : '生成简历优化报告'}
          </button>
        )}

        {/* AI 反馈 */}
        {(feedback || loading) && (
          <div ref={feedbackRef} className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">AI 反馈</span>
              {loading && <div className="w-3 h-3 border border-emerald-500 border-t-transparent rounded-full animate-spin ml-auto" />}
            </div>
            <MarkdownRenderer content={feedback} />
          </div>
        )}

        {/* 下一步按钮 */}
        {submitted && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onNext}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-foreground text-background
                       hover:bg-foreground/90 disabled:opacity-40 font-medium rounded-xl transition-colors"
          >
            {loading ? '处理中…' : stepId >= 5 ? '查看最终报告' : '继续下一步'}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
