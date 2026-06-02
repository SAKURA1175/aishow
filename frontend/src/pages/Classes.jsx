import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { School, Plus, Users, Copy, Check, UserMinus, LogIn } from 'lucide-react'
import useStore from '@/store/useStore'
import { getMyClasses, createClass, joinClass, getClassMembers, removeMember } from '@/api/modules'

export default function Classes() {
  const { user } = useStore()
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [members, setMembers] = useState([])
  const [form, setForm] = useState({ name: '', description: '', semester: '' })
  const [inviteCode, setInviteCode] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => { loadClasses() }, [])

  const loadClasses = async () => {
    try { const r = await getMyClasses(); setClasses(r.data?.data || []) } catch {}
    setLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try { await createClass(form); setShowCreate(false); setForm({ name: '', description: '', semester: '' }); loadClasses() } catch {}
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    try { const r = await joinClass(inviteCode); if (r.data?.success) { setShowJoin(false); setInviteCode(''); loadClasses() } else alert(r.data?.message) } catch { alert('邀请码无效') }
  }

  const handleSelectClass = async (c) => {
    setSelectedClass(c)
    try { const r = await getClassMembers(c.id); setMembers(r.data?.data || []) } catch {}
  }

  const handleRemove = async (uid) => {
    if (!confirm('确定移除？')) return
    await removeMember(selectedClass.id, uid)
    const r = await getClassMembers(selectedClass.id); setMembers(r.data?.data || [])
  }

  const copyCode = (code) => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><School className="w-5 h-5 text-blue-500" /></div>
          <div><h1 className="text-lg font-semibold">班级管理</h1><p className="text-xs text-muted-foreground">{isTeacher ? '创建和管理班级' : '查看和加入班级'}</p></div>
        </div>
        <div className="flex gap-2">
          {isTeacher && <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4" />创建班级</button>}
          <button onClick={() => setShowJoin(true)} className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"><LogIn className="w-4 h-4" />加入班级</button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-border/50 overflow-y-auto p-4 space-y-3">
          {loading ? <p className="text-center text-muted-foreground py-8">加载中...</p> : classes.length === 0 ? <div className="text-center text-muted-foreground py-12"><School className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">暂无班级</p></div> :
            classes.map(c => (
              <motion.div key={c.id} whileHover={{ scale: 1.01 }} onClick={() => handleSelectClass(c)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleSelectClass(c)
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedClass?.id === c.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-border/50 hover:bg-muted/30'}`}>
                <div className="flex items-start justify-between"><div><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-muted-foreground mt-1">{c.semester || '未设学期'}</p></div>
                  <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full"><Users className="w-3 h-3 inline mr-1" />{c.memberCount||0}</span></div>
                {isTeacher && <div className="mt-2 flex items-center gap-1.5"><span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{c.inviteCode}</span>
                  <button onClick={e => { e.stopPropagation(); copyCode(c.inviteCode) }}>{copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}</button></div>}
              </motion.div>
            ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {selectedClass ? <div>
            <h2 className="text-lg font-semibold">{selectedClass.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{selectedClass.description || '暂无描述'}</p>
            {isTeacher && <div className="mt-3 flex items-center gap-2 text-sm"><span className="text-muted-foreground">邀请码：</span><code className="px-2 py-1 bg-muted rounded font-mono">{selectedClass.inviteCode}</code></div>}
            <h3 className="text-sm font-medium text-muted-foreground mb-3 mt-6">成员（{members.length}人）</h3>
            <div className="space-y-2">{members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{m.username?.[0]?.toUpperCase()}</div>
                  <div><p className="text-sm font-medium">{m.username}</p><p className="text-xs text-muted-foreground capitalize">{m.role}</p></div></div>
                {isTeacher && m.role !== 'teacher' && <button onClick={() => handleRemove(m.userId)} className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500 text-muted-foreground"><UserMinus className="w-4 h-4" /></button>}
              </div>))}</div>
          </div> : <div className="h-full flex items-center justify-center"><div className="text-center text-muted-foreground"><Users className="w-16 h-16 mx-auto mb-4 opacity-20" /><p className="text-sm">选择班级查看成员</p></div></div>}
        </div>
      </div>
      {/* Create/Join modals - simplified */}
      <AnimatePresence>{showCreate && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowCreate(false)}>
        <motion.form initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} onSubmit={handleCreate} className="bg-card border border-border rounded-2xl p-6 w-[420px] shadow-2xl">
          <h3 className="text-lg font-semibold mb-4">创建班级</h3>
          <div className="space-y-3"><input placeholder="班级名称 *" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-blue-500 focus:outline-none"/>
            <input placeholder="学期" value={form.semester} onChange={e=>setForm({...form,semester:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-blue-500 focus:outline-none"/>
            <textarea placeholder="描述" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-blue-500 focus:outline-none resize-none"/></div>
          <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={()=>setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground">取消</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">创建</button></div>
        </motion.form></motion.div>}</AnimatePresence>
      <AnimatePresence>{showJoin && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowJoin(false)}>
        <motion.form initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} onSubmit={handleJoin} className="bg-card border border-border rounded-2xl p-6 w-[380px] shadow-2xl">
          <h3 className="text-lg font-semibold mb-4">加入班级</h3>
          <input placeholder="输入邀请码" required value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-muted rounded-lg text-sm font-mono text-center tracking-widest border border-border/50 focus:border-blue-500 focus:outline-none text-lg"/>
          <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={()=>setShowJoin(false)} className="px-4 py-2 text-sm text-muted-foreground">取消</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">加入</button></div>
        </motion.form></motion.div>}</AnimatePresence>
    </div>
  )
}
