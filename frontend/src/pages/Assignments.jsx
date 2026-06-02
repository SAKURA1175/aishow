import { useState, useEffect } from 'react'
import { BookOpen, Plus, FileText, Clock, Upload, X } from 'lucide-react'
import useStore from '@/store/useStore'
import { getMyAssignments, createAssignment, getMyClasses, submitAssignment, getMySubmission, getSubmissions, gradeSubmission } from '@/api/modules'
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
      setSubmissions(r.data?.data || [])
    } catch {
      setSubmissions([])
    }
    setShowSubmissions(true)
  }

  const handleGradeSubmission = async (submission, teacherScore) => {
    const score = Number(teacherScore)
    if (Number.isNaN(score)) return
    await gradeSubmission(submission.id, { teacherScore: score, teacherFeedback: submission.teacherFeedback || '' })
    openSubmissions(activeAssignment)
    loadData()
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
                <input placeholder="附件链接（可选）" value={submissionForm.fileUrl} onChange={e=>setSubmissionForm({...submissionForm,fileUrl:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-orange-500 focus:outline-none"/>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={()=>setShowSubmit(false)} className="px-4 py-2 text-sm text-muted-foreground">取消</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"><Upload className="w-4 h-4" />提交</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubmissions && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowSubmissions(false)}>
            <motion.div initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 w-[720px] max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">作业提交</h3>
                  <p className="text-xs text-muted-foreground mt-1">{activeAssignment?.title}</p>
                </div>
                <button type="button" onClick={()=>setShowSubmissions(false)} className="p-1.5 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-y-auto space-y-3 pr-1">
                {submissions.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">暂无学生提交</p> : submissions.map(s => (
                  <div key={s.id} className="p-4 rounded-xl bg-muted/30 border border-border/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{s.studentName}</p>
                        <p className="text-xs text-muted-foreground">{s.submitTime ? new Date(s.submitTime).toLocaleString() : '未记录时间'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" max={activeAssignment?.maxScore || 100} defaultValue={s.teacherScore || ''} placeholder="分数" onBlur={e=>handleGradeSubmission(s, e.target.value)} className="w-20 px-2 py-1.5 bg-background rounded-md text-sm border border-border/60 focus:outline-none"/>
                        <span className={`text-[10px] px-2 py-1 rounded-full ${s.status === 'graded' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>{s.status === 'graded' ? '已批改' : '已提交'}</span>
                      </div>
                    </div>
                    <p className="text-sm mt-3 whitespace-pre-wrap">{s.content}</p>
                    {s.fileUrl && <a className="text-xs text-orange-500 hover:underline mt-2 inline-block" href={s.fileUrl} target="_blank" rel="noreferrer">查看附件</a>}
                  </div>
                ))}
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
