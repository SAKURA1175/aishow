import { useState, useEffect } from 'react'
import { Target, Plus, Trash2, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { getMyWrongQuestions, addWrongQuestion, deleteWrongQuestion, setQuestionMastery } from '@/api/modules'
import { motion, AnimatePresence } from 'framer-motion'

export default function WrongQuestions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ subject: '', content: '', correctAnswer: '', myAnswer: '', knowledgePoint: '' })
  const [filter, setFilter] = useState('')

  useEffect(() => { load() }, [filter])

  const load = async () => {
    try { const r = await getMyWrongQuestions(filter); setQuestions(r.data?.data || []) } catch {}
    setLoading(false)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try { await addWrongQuestion(form); setShowAdd(false); setForm({ subject: '', content: '', correctAnswer: '', myAnswer: '', knowledgePoint: '' }); load() } catch {}
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除？')) return
    try { await deleteWrongQuestion(id); load() } catch {}
  }

  const handleMastery = async (id, m) => {
    try { await setQuestionMastery(id, m); load() } catch {}
  }

  const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))]
  const masteryColors = { unmastered: 'text-red-500 bg-red-500/10', reviewing: 'text-yellow-500 bg-yellow-500/10', mastered: 'text-green-500 bg-green-500/10' }
  const masteryLabels = { unmastered: '未掌握', reviewing: '复习中', mastered: '已掌握' }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center"><Target className="w-5 h-5 text-red-500" /></div>
          <div><h1 className="text-lg font-semibold">错题本</h1><p className="text-xs text-muted-foreground">记录错题，AI分析错因</p></div>
        </div>
        <div className="flex items-center gap-3">
          {subjects.length > 0 && (
            <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 bg-muted rounded-lg text-sm border border-border/50">
              <option value="">全部科目</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> 添加错题
          </button>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? <p className="text-center text-muted-foreground py-8">加载中...</p> :
         questions.length === 0 ? <div className="text-center py-12"><Target className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm text-muted-foreground">暂无错题记录</p></div> :
         <div className="space-y-4">
           {questions.map(q => (
             <div key={q.id} className="p-5 rounded-xl border border-border/50 bg-card">
               <div className="flex items-start justify-between mb-3">
                 <div className="flex items-center gap-2">
                   {q.subject && <span className="text-xs bg-muted px-2 py-0.5 rounded">{q.subject}</span>}
                   {q.knowledgePoint && <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded">{q.knowledgePoint}</span>}
                   <span className={`text-xs px-2 py-0.5 rounded ${masteryColors[q.mastery]}`}>{masteryLabels[q.mastery]}</span>
                 </div>
                 <div className="flex items-center gap-1">
                   {q.mastery !== 'mastered' && <button onClick={() => handleMastery(q.id, 'mastered')} className="p-1.5 hover:bg-green-500/10 rounded text-muted-foreground hover:text-green-500"><CheckCircle className="w-4 h-4" /></button>}
                   {q.mastery !== 'reviewing' && q.mastery !== 'mastered' && <button onClick={() => handleMastery(q.id, 'reviewing')} className="p-1.5 hover:bg-yellow-500/10 rounded text-muted-foreground hover:text-yellow-500"><RotateCcw className="w-4 h-4" /></button>}
                   <button onClick={() => handleDelete(q.id)} className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                 </div>
               </div>
               <p className="text-sm font-medium mb-2">{q.content}</p>
               {q.myAnswer && <p className="text-xs text-red-400 mb-1">❌ 我的答案：{q.myAnswer}</p>}
               {q.correctAnswer && <p className="text-xs text-green-500 mb-1">✅ 正确答案：{q.correctAnswer}</p>}
               {q.aiAnalysis && <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground"><strong>AI分析：</strong>{q.aiAnalysis}</div>}
             </div>
           ))}
         </div>
        }
      </div>
      <AnimatePresence>{showAdd && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowAdd(false)}>
        <motion.form initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} onSubmit={handleAdd} className="bg-card border border-border rounded-2xl p-6 w-[500px] shadow-2xl">
          <h3 className="text-lg font-semibold mb-4">添加错题</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="科目" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
              <input placeholder="知识点" value={form.knowledgePoint} onChange={e=>setForm({...form,knowledgePoint:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
            </div>
            <textarea placeholder="题目内容 *" required rows={3} value={form.content} onChange={e=>setForm({...form,content:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none resize-none"/>
            <input placeholder="我的错误答案" value={form.myAnswer} onChange={e=>setForm({...form,myAnswer:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
            <input placeholder="正确答案" value={form.correctAnswer} onChange={e=>setForm({...form,correctAnswer:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
          </div>
          <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={()=>setShowAdd(false)} className="px-4 py-2 text-sm text-muted-foreground">取消</button><button type="submit" className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">添加</button></div>
        </motion.form>
      </motion.div>}</AnimatePresence>
    </div>
  )
}
