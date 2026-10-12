import { useState, useEffect } from 'react'
import { BookOpen, Plus, FileText, Clock, Upload, X, Sparkles, Loader2, Check, Paperclip, ExternalLink, CheckCircle2 } from 'lucide-react'
import useStore from '@/store/useStore'
import { getMyAssignments, createAssignment, getMyClasses, submitAssignment, getMySubmission, getSubmissions, gradeSubmission, aiGradeSubmission } from '@/api/modules'
import { motion, AnimatePresence } from 'framer-motion'

export default function Assignments() {
  const { user } = useStore()
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [showSubmissions, setShowSubmissions] = useState(false)
  const [activeAssignment, setActiveAssignment] = useState(null)
  const [submissionForm, setSubmissionForm] = useState({ content: '', fileUrl: '' })
  const [submissions, setSubmissions] = useState([])
  const [classes, setClasses] = useState([])
  
  // 教师本地批改编辑状态 map: { [subId]: { score: number|string, feedback: string, saving: boolean, saved: boolean } }
  const [gradeState, setGradeState] = useState({})
  
  const [form, setForm] = useState({ title: '', description: '', classId: '', maxScore: 100, dueDate: '' })

  useEffect(() => { 
    loadData()
  }, [])

  const loadData = async () => {
    try { 
      const [assRes, clsRes] = await Promise.all([getMyAssignments(), getMyClasses()])
      setAssignments(assRes.data?.data || [])
      setClasses(clsRes.data?.data || [])
    } catch {}
    setLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        classId: form.classId ? parseInt(form.classId) : null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null
      }
      await createAssignment(payload)
      setShowCreate(false)
      setForm({ title: '', description: '', classId: '', maxScore: 100, dueDate: '' })
      loadData()
    } catch {}
  }

  const openSubmit = async (assignment) => {
    setActiveAssignment(assignment)
    setSubmissionForm({ content: '', fileUrl: '' })
    try {
      const r = await getMySubmission(assignment.id)
      const existing = r.data?.data
      if (existing) setSubmissionForm({ content: existing.content || '', fileUrl: existing.fileUrl || '' })
    } catch {}
    setShowSubmit(true)
  }

  const handleSubmitAssignment = async (e) => {
    e.preventDefault()
    if (!activeAssignment) return
    try {
      await submitAssignment(activeAssignment.id, submissionForm)
      setShowSubmit(false)
      setActiveAssignment(null)
      loadData()
    } catch {
      alert('提交失败，请稍后重试')
    }
  }

  const openSubmissions = async (assignment) => {
    setActiveAssignment(assignment)
    try {
      const r = await getSubmissions(assignment.id)
      const list = r.data?.data || []
      setSubmissions(list)
      // 初始化批改表单状态
      const initialMap = {}
      list.forEach(s => {
        initialMap[s.id] = {
          score: s.teacherScore ?? (s.aiScore ?? ''),
          feedback: s.teacherFeedback || s.aiFeedback || '',
          saving: false,
          saved: false
        }
      })
      setGradeState(initialMap)
    } catch {
      setSubmissions([])
      setGradeState({})
    }
    setShowSubmissions(true)
  }

  const [aiGradingId, setAiGradingId] = useState(null)

  const handleConfirmGrade = async (submissionId) => {
    const current = gradeState[submissionId]
    if (!current) return
    const scoreVal = current.score
    if (scoreVal === '' || scoreVal === null || scoreVal === undefined) {
      alert('请输入批改分数')
      return
    }
    const numScore = Number(scoreVal)
    if (Number.isNaN(numScore)) {
      alert('请输入有效的数字分数')
      return
    }

    setGradeState(prev => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], saving: true }
    }))

    try {
      await gradeSubmission(submissionId, { teacherScore: numScore, teacherFeedback: current.feedback || '' })
      setSubmissions(prev => prev.map(s => s.id === submissionId ? {
        ...s,
        teacherScore: numScore,
        teacherFeedback: current.feedback || '',
        status: 'graded'
      } : s))
      setGradeState(prev => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], saving: false, saved: true }
      }))
      setTimeout(() => {
        setGradeState(prev => ({
          ...prev,
          [submissionId]: { ...prev[submissionId], saved: false }
        }))
      }, 3000)
      loadData()
    } catch (err) {
      alert('批改保存失败：' + (err.response?.data?.message || err.message))
      setGradeState(prev => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], saving: false }
      }))
    }
  }

  const handleAiGrade = async (submission) => {
    try {
      setAiGradingId(submission.id)
      const res = await aiGradeSubmission(submission.id)
      const aiData = res.data?.data
      if (aiData) {
        setSubmissions(prev => prev.map(item => item.id === submission.id ? {
          ...item,
          aiScore: aiData.suggestedScore,
          aiFeedback: aiData.feedback
        } : item))
        // 自动填入教师当前待确认表单中
        setGradeState(prev => ({
          ...prev,
          [submission.id]: {
            ...prev[submission.id],
            score: aiData.suggestedScore,
            feedback: aiData.feedback
          }
        }))
      }
    } catch (err) {
      alert('AI 批改失败：' + (err.response?.data?.message || err.message))
    } finally {
      setAiGradingId(null)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">作业系统</h1>
            <p className="text-xs text-muted-foreground">{isTeacher ? '发布和批改作业' : '查看和提交作业'}</p>
          </div>
        </div>
        {isTeacher && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> 发布作业
          </button>
        )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? <p className="text-center text-muted-foreground py-8">加载中...</p> : 
         assignments.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">暂无作业</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map(a => (
              <div key={a.id} className="p-5 rounded-xl border border-border/50 bg-card hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-foreground truncate pr-2">{a.title}</h3>
                  <span className={`text-[10px] px-2 py-1 rounded-full ${a.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                    {a.status === 'published' ? '进行中' : '已结束'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{a.description || '无描述'}</p>
                <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {a.dueDate ? new Date(a.dueDate).toLocaleString() : '无截止时间'}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
                    <span>{a.className || '全体'}</span>
                    {isTeacher ? (
                      <button onClick={() => openSubmissions(a)} className="text-orange-500 font-medium hover:underline">{a.gradedCount}/{a.submissionCount} 已批改</button>
                    ) : (
                      <button onClick={() => openSubmit(a)} className="text-blue-500 font-medium hover:underline">去提交 →</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showSubmit && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowSubmit(false)}>
            <motion.form initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} onSubmit={handleSubmitAssignment} className="bg-card border border-border rounded-2xl p-6 w-[520px] shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">提交作业</h3>
                  <p className="text-xs text-muted-foreground mt-1">{activeAssignment?.title}</p>
                </div>
                <button type="button" onClick={()=>setShowSubmit(false)} className="p-1.5 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <textarea required placeholder="填写作业内容、答案或说明..." rows={8} value={submissionForm.content} onChange={e=>setSubmissionForm({...submissionForm,content:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-orange-500 focus:outline-none resize-none"/>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">作业附件链接（如网盘、在线文档或公网文件地址）</label>
                  <input placeholder="https://..." value={submissionForm.fileUrl} onChange={e=>setSubmissionForm({...submissionForm,fileUrl:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-orange-500 focus:outline-none"/>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={()=>setShowSubmit(false)} className="px-4 py-2 text-sm text-muted-foreground">取消</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"><Upload className="w-4 h-4" />提交作业</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubmissions && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowSubmissions(false)}>
            <motion.div initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 w-[780px] max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">作业提交与批改</h3>
                  <p className="text-xs text-muted-foreground mt-1">{activeAssignment?.title} (共 {submissions.length} 份提交)</p>
                </div>
                <button type="button" onClick={()=>setShowSubmissions(false)} className="p-1.5 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-y-auto space-y-4 pr-1">
                {submissions.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">暂无学生提交</p> : submissions.map(s => {
                  const state = gradeState[s.id] || { score: s.teacherScore ?? '', feedback: s.teacherFeedback || '' }
                  return (
                    <div key={s.id} className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-2">
                            {s.studentName}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.status === 'graded' ? 'bg-green-500/15 text-green-600 font-medium' : 'bg-blue-500/15 text-blue-600'}`}>
                              {s.status === 'graded' ? '✓ 已批改' : '待批改'}
                            </span>
                            {s.teacherScore != null && (
                              <span className="text-xs font-bold text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded">
                                当前得分: {s.teacherScore} 分
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.submitTime ? new Date(s.submitTime).toLocaleString() : '未记录时间'}</p>
                        </div>
                        <button
                          type="button"
                          disabled={aiGradingId === s.id}
                          onClick={() => handleAiGrade(s)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                          title="使用 AI 智能分析作答内容并给出参考得分与评语"
                        >
                          {aiGradingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          {aiGradingId === s.id ? 'AI 批改中...' : 'AI 辅助评分'}
                        </button>
                      </div>

                      {/* 作答文本正文 */}
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">学生作答内容：</span>
                        <div className="bg-background/80 p-3 rounded-lg border border-border/40 text-sm whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                          {s.content || '学生未填写文字作答内容'}
                        </div>
                      </div>

                      {/* 附件展示：明显卡片 */}
                      {s.fileUrl ? (
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/20">
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <div className="w-7 h-7 rounded bg-orange-500/15 text-orange-600 flex items-center justify-center shrink-0">
                              <Paperclip className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">作业提交附件</p>
                              <p className="text-[11px] text-muted-foreground truncate">{s.fileUrl}</p>
                            </div>
                          </div>
                          <a
                            href={s.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors shrink-0 shadow-sm"
                          >
                            <ExternalLink className="w-3 h-3" />
                            打开查看
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 py-1">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>未上传附件</span>
                        </div>
                      )}

                      {/* 教师批改输入与确认提交区 */}
                      <div className="p-3 bg-background rounded-xl border border-border/60 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                            教师批改与评语
                          </span>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">批改打分:</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max={activeAssignment?.maxScore || 100}
                                value={state.score}
                                onChange={e => {
                                  const val = e.target.value
                                  setGradeState(prev => ({
                                    ...prev,
                                    [s.id]: { ...prev[s.id], score: val }
                                  }))
                                }}
                                placeholder="分数"
                                className="w-20 px-2 py-1 bg-muted/60 rounded-md text-xs font-semibold border border-border/80 focus:outline-none focus:border-orange-500"
                              />
                              <span className="text-xs text-muted-foreground">/ {activeAssignment?.maxScore || 100} 分</span>
                            </div>
                          </div>
                        </div>

                        <textarea
                          rows={2}
                          value={state.feedback}
                          onChange={e => {
                            const val = e.target.value
                            setGradeState(prev => ({
                              ...prev,
                              [s.id]: { ...prev[s.id], feedback: val }
                            }))
                          }}
                          placeholder="填写教师评语、指导反馈或批改意见..."
                          className="w-full bg-muted/40 p-2.5 rounded-lg text-xs border border-border/50 focus:outline-none focus:border-orange-500 resize-none leading-relaxed"
                        />

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-muted-foreground">
                            {s.status === 'graded' ? '💡 当前作业已批改，修改上方分数与评语后点击确认可重新覆盖保存' : '💡 打分并填写评语后，点击右侧按钮确认提交批改结果'}
                          </span>
                          <button
                            type="button"
                            disabled={state.saving}
                            onClick={() => handleConfirmGrade(s.id)}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${
                              state.saved
                                ? 'bg-green-600 text-white'
                                : 'bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50'
                            }`}
                          >
                            {state.saving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : state.saved ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            {state.saving ? '保存中...' : state.saved ? '已确认批改 ✓' : '确认并提交批改'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowCreate(false)}>
            <motion.form initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} onSubmit={handleCreate} className="bg-card border border-border rounded-2xl p-6 w-[480px] shadow-2xl">
              <h3 className="text-lg font-semibold mb-4">发布作业</h3>
              <div className="space-y-4">
                <input placeholder="作业标题 *" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-orange-500 focus:outline-none"/>
                <textarea placeholder="作业描述" rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-orange-500 focus:outline-none resize-none"/>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">选择班级</label>
                    <select value={form.classId} onChange={e=>setForm({...form,classId:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-orange-500 focus:outline-none">
                      <option value="">全体学生 (不限班级)</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">满分</label>
                    <input type="number" value={form.maxScore} onChange={e=>setForm({...form,maxScore:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-orange-500 focus:outline-none"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">截止时间</label>
                  <input type="datetime-local" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-orange-500 focus:outline-none"/>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={()=>setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground">取消</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">发布</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
