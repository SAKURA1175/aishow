import { useState, useEffect } from 'react'
import { FileEdit, Plus, Trash2, Share2, Eye } from 'lucide-react'
import { getMyNotebooks, createNotebook, updateNotebook, deleteNotebook, getSharedNotebooks } from '@/api/modules'
import { AnimatePresence, motion } from 'framer-motion'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('my')
  const [showEdit, setShowEdit] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', tags: '', isShared: false })

  useEffect(() => { load() }, [tab])

  const load = async () => {
    setLoading(true)
    try {
      const r = tab === 'my' ? await getMyNotebooks() : await getSharedNotebooks()
      setNotes(r.data?.data || [])
    } catch {}
    setLoading(false)
  }

  const openNew = () => { setEditingNote(null); setForm({ title: '', content: '', tags: '', isShared: false }); setShowEdit(true) }
  const openEdit = (n) => { setEditingNote(n); setForm({ title: n.title, content: n.content || '', tags: n.tags || '', isShared: n.isShared || false }); setShowEdit(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editingNote) await updateNotebook(editingNote.id, form)
      else await createNotebook(form)
      setShowEdit(false); load()
    } catch {}
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除？')) return
    try { await deleteNotebook(id); load() } catch {}
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center"><FileEdit className="w-5 h-5 text-amber-500" /></div>
          <div><h1 className="text-lg font-semibold">课程笔记</h1><p className="text-xs text-muted-foreground">记录学习心得</p></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button onClick={()=>setTab('my')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab==='my'?'bg-card shadow text-foreground':'text-muted-foreground'}`}>我的笔记</button>
            <button onClick={()=>setTab('shared')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab==='shared'?'bg-card shadow text-foreground':'text-muted-foreground'}`}>共享笔记</button>
          </div>
          {tab === 'my' && <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4" /> 新建笔记</button>}
        </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? <p className="text-center text-muted-foreground py-8">加载中...</p> :
         notes.length === 0 ? <div className="text-center py-12"><FileEdit className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm text-muted-foreground">{tab==='my'?'暂无笔记，点击右上角新建':'暂无共享笔记'}</p></div> :
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {notes.map(n => (
             <div key={n.id} className="p-5 rounded-xl border border-border/50 bg-card hover:shadow-md transition-shadow group">
               <div className="flex items-start justify-between mb-2">
                 <h3 className="font-semibold text-sm truncate pr-2">{n.title}</h3>
                 {tab === 'my' && (
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={()=>openEdit(n)} className="p-1 hover:bg-muted rounded"><Eye className="w-3.5 h-3.5" /></button>
                     <button onClick={()=>handleDelete(n.id)} className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                   </div>
                 )}
               </div>
               <p className="text-xs text-muted-foreground line-clamp-3 mb-3 h-12">{n.content || '空笔记'}</p>
               <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                 <span>{n.tags || '无标签'}</span>
                 <div className="flex items-center gap-2">
                   {n.isShared && <Share2 className="w-3 h-3 text-blue-500" />}
                   <span>{new Date(n.updateTime || n.createTime).toLocaleDateString()}</span>
                 </div>
               </div>
             </div>
           ))}
         </div>
        }
      </div>
      <AnimatePresence>{showEdit && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowEdit(false)}>
        <motion.form initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-2xl">
          <h3 className="text-lg font-semibold mb-4">{editingNote ? '编辑笔记' : '新建笔记'}</h3>
          <div className="space-y-3">
            <input placeholder="标题 *" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
            <textarea placeholder="笔记内容（支持 Markdown）" rows={12} value={form.content} onChange={e=>setForm({...form,content:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none resize-none font-mono"/>
            <div className="flex gap-3">
              <input placeholder="标签（逗号分隔）" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isShared} onChange={e=>setForm({...form,isShared:e.target.checked})} /><Share2 className="w-4 h-4" /> 共享</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={()=>setShowEdit(false)} className="px-4 py-2 text-sm text-muted-foreground">取消</button><button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium">保存</button></div>
        </motion.form>
      </motion.div>}</AnimatePresence>
    </div>
  )
}
