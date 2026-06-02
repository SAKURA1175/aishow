import { useState, useEffect } from 'react'
import { ClipboardList, Plus, Trash2, Sparkles, BarChart3, Send, Loader2 } from 'lucide-react'
import useStore from '@/store/useStore'
import { getMyExams, createExam, getExamDetail, addExamQuestion, deleteExamQuestion, submitExam, aiGenerateQuestions, getExamStats, getMyClasses, updateExam } from '@/api/modules'
import { AnimatePresence, motion } from 'framer-motion'

const TYPES = { choice:'单选', true_false:'判断', fill:'填空', short_answer:'简答' }

export default function Exams() {
  const { user } = useStore()
  const isT = user?.role === 'teacher' || user?.role === 'admin'
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState(null)
  const [questions, setQuestions] = useState([])
  const [mySub, setMySub] = useState(null)
  const [classes, setClasses] = useState([])
  const [tab, setTab] = useState('questions') // questions | take | stats
  const [showCreate, setShowCreate] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showAddQ, setShowAddQ] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [stats, setStats] = useState(null)

  const [form, setForm] = useState({ title:'', duration:60, totalScore:100, classId:'' })
  const [qForm, setQForm] = useState({ type:'choice', content:'', options:'', answer:'', score:10 })
  const [aiForm, setAiForm] = useState({ subject:'', knowledgePoints:'', count:5, difficulty:'中等', types:['choice','true_false','fill','short_answer'] })

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const [e, c] = await Promise.allSettled([getMyExams(), getMyClasses()])
      setExams(e.status==='fulfilled' ? e.value.data?.data||[] : [])
      setClasses(c.status==='fulfilled' ? c.value.data?.data||[] : [])
    } catch {} setLoading(false)
  }

  const openExam = async (exam) => {
    setSel(exam); setTab('questions'); setResult(null); setAnswers({})
    try {
      const r = await getExamDetail(exam.id)
      setQuestions(r.data?.data?.questions||[])
      setMySub(r.data?.data?.mySubmission||null)
    } catch {}
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try { await createExam({...form, classId: form.classId?parseInt(form.classId):null}); setShowCreate(false); load() } catch {}
  }

  const handleAddQ = async (e) => {
    e.preventDefault()
    try { await addExamQuestion(sel.id, qForm); setShowAddQ(false); setQForm({type:'choice',content:'',options:'',answer:'',score:10}); openExam(sel) } catch {}
  }

  const handleDeleteQ = async (qid) => { try { await deleteExamQuestion(qid); openExam(sel) } catch {} }

  const handlePublish = async () => {
    try { await updateExam(sel.id, {...sel, status:'published'}); load(); setSel({...sel, status:'published'}) } catch {}
  }

  // AI出题
  const handleAIGenerate = async (e) => {
    e.preventDefault(); setAiLoading(true)
    try {
      const r = await aiGenerateQuestions(sel.id, aiForm)
      if (r.data?.success) { setShowAI(false); openExam(sel); alert(`✅ ${r.data.message}`) }
      else alert(r.data?.message || 'AI出题失败')
    } catch (err) { alert('AI出题失败: ' + (err.response?.data?.message || err.message)) }
    setAiLoading(false)
  }

  // 提交答卷
  const handleSubmit = async () => {
    if (!confirm('确定提交？提交后不可修改')) return
    try {
      const r = await submitExam(sel.id, { answers: JSON.stringify(answers) })
      if (r.data?.success) { setResult(r.data.data); setTab('questions') }
      else alert(r.data?.message)
    } catch { alert('提交失败') }
  }

  // 成绩统计
  const loadStats = async () => {
    setTab('stats')
    try { const r = await getExamStats(sel.id); setStats(r.data?.data||null) } catch {}
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-violet-500" /></div>
          <div><h1 className="text-lg font-semibold">考试系统</h1><p className="text-xs text-muted-foreground">{isT?'AI出题·自动判卷·成绩统计':'在线考试·自动评分'}</p></div>
        </div>
        {isT && <button onClick={()=>setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium"><Plus className="w-4 h-4" /> 创建考试</button>}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-border/50 overflow-y-auto p-3 space-y-2">
          {loading ? <p className="text-center text-muted-foreground py-8">加载中...</p> :
           exams.length===0 ? <div className="text-center py-12 text-muted-foreground"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20"/><p className="text-sm">暂无考试</p></div> :
           exams.map(e=>(
             <button key={e.id} onClick={()=>openExam(e)} className={`w-full text-left p-3 rounded-xl border transition-all ${sel?.id===e.id?'border-violet-500/50 bg-violet-500/5':'border-border/50 hover:bg-muted/30'}`}>
               <p className="font-medium text-sm truncate">{e.title}</p>
               <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                 <span>{e.duration}分钟</span><span>·</span><span>{e.totalScore}分</span><span>·</span>
                 <span className={e.status==='published'?'text-green-500':e.status==='closed'?'text-red-400':'text-muted-foreground'}>{e.status==='draft'?'草稿':e.status==='published'?'进行中':'已结束'}</span>
               </div>
               {e.questionCount!=null && <span className="text-[10px] text-muted-foreground mt-1 block">{e.questionCount}题</span>}
             </button>
           ))}
        </div>

        {/* Main */}
        <div className="flex-1 overflow-y-auto p-6">
          {sel ? (<div>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">{sel.title}</h2>
                <p className="text-sm text-muted-foreground">{sel.duration}分钟 · {sel.totalScore}分 · {questions.length}题</p>
              </div>
              <div className="flex gap-2">
                {isT && <><button onClick={()=>setShowAI(true)} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg text-xs font-medium"><Sparkles className="w-3.5 h-3.5"/>AI出题</button>
                  <button onClick={()=>setShowAddQ(true)} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs font-medium"><Plus className="w-3.5 h-3.5"/>手动添题</button>
                  {sel.status==='draft' && <button onClick={handlePublish} className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-medium">发布考试</button>}
                  <button onClick={loadStats} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs font-medium"><BarChart3 className="w-3.5 h-3.5"/>成绩统计</button></>}
                {!isT && sel.status==='published' && !mySub && <button onClick={()=>setTab('take')} className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium">开始答题</button>}
              </div>
            </div>

            {/* Result Banner */}
            {result && <div className="mb-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
              <p className="text-lg font-bold text-violet-500">得分：{result.score}/{result.totalScore}</p>
              <p className="text-sm text-muted-foreground">答对 {result.correctCount}/{result.totalCount}，错题 {result.wrongCount} 道已自动加入错题本</p>
            </div>}
            {mySub && !result && <div className="mb-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <p className="text-sm font-medium text-green-500">已提交 · 得分：{mySub.score}</p>
            </div>}

            {/* Stats Tab */}
            {tab==='stats' && stats && <div className="space-y-4">
              <div className="grid grid-cols-5 gap-3">
                {[{l:'参考人数',v:stats.totalStudents},{l:'平均分',v:stats.avgScore},{l:'最高分',v:stats.maxScore},{l:'最低分',v:stats.minScore},{l:'及格率',v:stats.passRate+'%'}].map(s=>
                  <div key={s.l} className="p-4 rounded-xl border border-border/50 bg-card text-center"><p className="text-2xl font-bold">{s.v}</p><p className="text-xs text-muted-foreground mt-1">{s.l}</p></div>
                )}
              </div>
              <div className="bg-card border border-border/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3">分数段分布</h3>
                <div className="space-y-2">{stats.distribution && Object.entries(stats.distribution).map(([k,v])=>
                  <div key={k} className="flex items-center gap-3"><span className="w-16 text-xs text-muted-foreground">{k}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden"><div className="h-full bg-violet-500/70 rounded-full transition-all" style={{width:`${stats.totalStudents?v/stats.totalStudents*100:0}%`}}/></div>
                    <span className="text-xs w-8 text-right">{v}</span></div>
                )}</div>
              </div>
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <table className="w-full text-sm"><thead><tr className="bg-muted/50 border-b border-border/50"><th className="p-3 text-left font-medium">学生</th><th className="p-3 text-center font-medium">成绩</th><th className="p-3 text-center font-medium">状态</th></tr></thead>
                <tbody>{(stats.submissions||[]).map(s=><tr key={s.id} className="border-b border-border/30"><td className="p-3">{s.studentName}</td><td className="p-3 text-center font-bold">{s.score}</td><td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded ${s.status==='graded'?'bg-green-500/10 text-green-500':'bg-muted'}`}>{s.status==='graded'?'已批':'未批'}</span></td></tr>)}</tbody>
                </table>
              </div>
            </div>}

            {/* Take Exam Tab */}
            {tab==='take' && <div className="space-y-4">
              {questions.map((q,i)=>(
                <div key={q.id} className="p-5 rounded-xl border border-border/50 bg-card">
                  <div className="flex items-center gap-2 mb-2"><span className="text-xs bg-violet-500/10 text-violet-500 px-2 py-0.5 rounded">{TYPES[q.type]||q.type}</span><span className="text-xs text-muted-foreground">{q.score}分</span></div>
                  <p className="text-sm font-medium mb-3">{i+1}. {q.content}</p>
                  {(q.type==='choice') && q.options && <div className="space-y-2">
                    {q.options.split('\n').filter(Boolean).map(opt=>{
                      const letter = opt.trim().charAt(0)
                      return <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${answers[q.id]===letter?'border-violet-500 bg-violet-500/5':'border-border/50 hover:bg-muted/30'}`}>
                        <input type="radio" name={`q${q.id}`} checked={answers[q.id]===letter} onChange={()=>setAnswers({...answers,[q.id]:letter})} className="accent-violet-500"/>
                        <span className="text-sm">{opt}</span>
                      </label>
                    })}
                  </div>}
                  {q.type==='true_false' && <div className="flex gap-3">
                    {['对','错'].map(v=><button key={v} onClick={()=>setAnswers({...answers,[q.id]:v})} className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${answers[q.id]===v?'border-violet-500 bg-violet-500/5 text-violet-500':'border-border/50 hover:bg-muted/30'}`}>{v}</button>)}
                  </div>}
                  {(q.type==='fill'||q.type==='short_answer') && <textarea rows={q.type==='short_answer'?4:1} value={answers[q.id]||''} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})} placeholder={q.type==='fill'?'输入答案':'输入你的回答...'} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-violet-500 focus:outline-none resize-none"/>}
                </div>
              ))}
              <button onClick={handleSubmit} className="w-full py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"><Send className="w-4 h-4"/>提交答卷</button>
            </div>}

            {/* Questions List (teacher view) */}
            {tab==='questions' && <div className="space-y-3">
              {questions.length===0 ? <p className="text-center text-muted-foreground py-8">暂无题目，点击「AI出题」或「手动添题」</p> :
               questions.map((q,i)=>(
                <div key={q.id} className="p-4 rounded-xl border border-border/50 bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2"><span className="text-xs bg-muted px-2 py-0.5 rounded">{TYPES[q.type]||q.type}</span><span className="text-xs text-muted-foreground">{q.score}分</span></div>
                    {isT && <button onClick={()=>handleDeleteQ(q.id)} className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4"/></button>}
                  </div>
                  <p className="text-sm mt-2">{i+1}. {q.content}</p>
                  {q.options && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{q.options}</p>}
                  {isT && q.answer && <p className="text-xs text-green-500 mt-1">✅ 答案：{q.answer}</p>}
                  {/* Show result per question */}
                  {result?.details && result.details.find(d=>d.questionId===q.id) && (()=>{
                    const d = result.details.find(d=>d.questionId===q.id)
                    return <div className={`mt-2 p-2 rounded text-xs ${d.correct?'bg-green-500/10 text-green-500':'bg-red-500/10 text-red-500'}`}>
                      {d.correct?'✅ 正确':'❌ 错误'} · 你的答案：{d.studentAnswer||'未作答'} · 正确答案：{d.correctAnswer} · 得分：{d.score}/{d.maxScore}
                    </div>
                  })()}
                </div>
              ))}
            </div>}
          </div>) : <div className="h-full flex items-center justify-center text-muted-foreground"><p>选择左侧考试查看</p></div>}
        </div>
      </div>

      {/* Create Exam */}
      <AnimatePresence>{showCreate && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowCreate(false)}>
        <motion.form initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} onSubmit={handleCreate} className="bg-card border border-border rounded-2xl p-6 w-[450px] shadow-2xl">
          <h3 className="text-lg font-semibold mb-4">创建考试</h3>
          <div className="space-y-3">
            <input placeholder="考试标题 *" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground block mb-1">时长(分钟)</label><input type="number" value={form.duration} onChange={e=>setForm({...form,duration:parseInt(e.target.value)||60})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/></div>
              <div><label className="text-xs text-muted-foreground block mb-1">总分</label><input type="number" value={form.totalScore} onChange={e=>setForm({...form,totalScore:parseInt(e.target.value)||100})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/></div>
            </div>
            <select value={form.classId} onChange={e=>setForm({...form,classId:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"><option value="">选择班级</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={()=>setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground">取消</button><button type="submit" className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium">创建</button></div>
        </motion.form>
      </motion.div>}</AnimatePresence>

      {/* AI Generate */}
      <AnimatePresence>{showAI && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowAI(false)}>
        <motion.form initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} onSubmit={handleAIGenerate} className="bg-card border border-border rounded-2xl p-6 w-[520px] shadow-2xl">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500"/>AI 智能出题</h3>
          <p className="text-xs text-muted-foreground mb-4">AI将根据你的要求自动生成多种题型</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground block mb-1">科目 *</label><input required value={aiForm.subject} onChange={e=>setAiForm({...aiForm,subject:e.target.value})} placeholder="如：Java、高等数学" className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/></div>
              <div><label className="text-xs text-muted-foreground block mb-1">出题数量</label><input type="number" min={1} max={20} value={aiForm.count} onChange={e=>setAiForm({...aiForm,count:parseInt(e.target.value)||5})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/></div>
            </div>
            <div><label className="text-xs text-muted-foreground block mb-1">知识点（选填）</label><input value={aiForm.knowledgePoints} onChange={e=>setAiForm({...aiForm,knowledgePoints:e.target.value})} placeholder="如：多态、继承、接口" className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/></div>
            <div><label className="text-xs text-muted-foreground block mb-1">难度</label>
              <div className="flex gap-2">{['简单','中等','困难'].map(d=><button key={d} type="button" onClick={()=>setAiForm({...aiForm,difficulty:d})} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${aiForm.difficulty===d?'border-violet-500 bg-violet-500/10 text-violet-500':'border-border/50 hover:bg-muted/50'}`}>{d}</button>)}</div>
            </div>
            <div><label className="text-xs text-muted-foreground block mb-1">题型</label>
              <div className="flex flex-wrap gap-2">{Object.entries(TYPES).map(([k,v])=><label key={k} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border cursor-pointer transition-all ${aiForm.types.includes(k)?'border-violet-500 bg-violet-500/10 text-violet-500':'border-border/50'}`}>
                <input type="checkbox" checked={aiForm.types.includes(k)} onChange={e=>{const t=e.target.checked?[...aiForm.types,k]:aiForm.types.filter(x=>x!==k);setAiForm({...aiForm,types:t})}} className="accent-violet-500"/>{v}
              </label>)}</div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" onClick={()=>setShowAI(false)} className="px-4 py-2 text-sm text-muted-foreground">取消</button>
            <button type="submit" disabled={aiLoading} className="px-5 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin"/>生成中...</> : <><Sparkles className="w-4 h-4"/>开始生成</>}
            </button>
          </div>
        </motion.form>
      </motion.div>}</AnimatePresence>

      {/* Manual Add Question */}
      <AnimatePresence>{showAddQ && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowAddQ(false)}>
        <motion.form initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} onSubmit={handleAddQ} className="bg-card border border-border rounded-2xl p-6 w-[500px] shadow-2xl">
          <h3 className="text-lg font-semibold mb-4">手动添加题目</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select value={qForm.type} onChange={e=>setQForm({...qForm,type:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none">{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
              <input type="number" placeholder="分值" value={qForm.score} onChange={e=>setQForm({...qForm,score:parseInt(e.target.value)||10})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
            </div>
            <textarea placeholder="题目内容 *" required rows={3} value={qForm.content} onChange={e=>setQForm({...qForm,content:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none resize-none"/>
            {(qForm.type==='choice') && <textarea placeholder={'选项，每行一个：\nA. ...\nB. ...\nC. ...\nD. ...'} rows={4} value={qForm.options} onChange={e=>setQForm({...qForm,options:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none resize-none font-mono"/>}
            <input placeholder="标准答案 *" required value={qForm.answer} onChange={e=>setQForm({...qForm,answer:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
          </div>
          <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={()=>setShowAddQ(false)} className="px-4 py-2 text-sm text-muted-foreground">取消</button><button type="submit" className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium">添加</button></div>
        </motion.form>
      </motion.div>}</AnimatePresence>
    </div>
  )
}
