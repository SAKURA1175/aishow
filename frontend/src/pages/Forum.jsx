import { useState, useEffect } from 'react'
import { MessagesSquare, Plus, Trash2, Eye, MessageCircle, Pin } from 'lucide-react'
import { getPosts, createPost, deletePost, getPostDetail, replyPost } from '@/api/modules'
import useStore from '@/store/useStore'
import { AnimatePresence, motion } from 'framer-motion'

export default function Forum() {
  const { user } = useStore()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [replies, setReplies] = useState([])
  const [replyText, setReplyText] = useState('')
  const [form, setForm] = useState({ title: '', content: '', tags: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    try { const r = await getPosts(); setPosts(r.data?.data || []) } catch {}
    setLoading(false)
  }

  const handleNew = async (e) => {
    e.preventDefault()
    try { await createPost(form); setShowNew(false); setForm({ title: '', content: '', tags: '' }); load() } catch {}
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除？')) return
    try { await deletePost(id); if (selectedPost?.id === id) { setSelectedPost(null); setReplies([]) }; load() } catch {}
  }

  const openPost = async (p) => {
    setSelectedPost(p)
    try {
      const r = await getPostDetail(p.id)
      setSelectedPost(r.data?.data?.post || p)
      setReplies(r.data?.data?.replies || [])
    } catch {}
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    try { await replyPost(selectedPost.id, { content: replyText }); setReplyText(''); openPost(selectedPost); load() } catch {}
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center"><MessagesSquare className="w-5 h-5 text-cyan-500" /></div>
          <div><h1 className="text-lg font-semibold">讨论区</h1><p className="text-xs text-muted-foreground">提问与交流</p></div>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4" /> 发帖</button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[420px] border-r border-border/50 overflow-y-auto">
          {loading ? <p className="text-center text-muted-foreground py-8">加载中...</p> :
           posts.length === 0 ? <div className="text-center py-12"><MessagesSquare className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm text-muted-foreground">暂无帖子</p></div> :
           <div className="divide-y divide-border/30">
             {posts.map(p => (
               <div
                 key={p.id}
                 onClick={() => openPost(p)}
                 role="button"
                 tabIndex={0}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') openPost(p)
                 }}
                 className={`w-full text-left p-4 hover:bg-muted/30 transition-colors cursor-pointer ${selectedPost?.id===p.id?'bg-muted/50':''}`}
               >
                 <div className="flex items-start gap-2 mb-1">
                   {p.isPinned && <Pin className="w-3 h-3 text-cyan-500 mt-0.5 flex-shrink-0" />}
                   <h3 className="text-sm font-medium line-clamp-1">{p.title}</h3>
                 </div>
                 <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{p.content}</p>
                 <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                   <span>{p.authorName}</span>
                   <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.viewCount}</span>
                   <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{p.replyCount}</span>
                   {p.userId === user?.id && <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }} className="ml-auto hover:text-red-500"><Trash2 className="w-3 h-3" /></button>}
                 </div>
               </div>
             ))}
           </div>
          }
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedPost ? (
            <>
              <div className="p-6 border-b border-border/50">
                <h2 className="text-lg font-semibold mb-2">{selectedPost.title}</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedPost.content}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span>{selectedPost.authorName}</span>
                  <span>{new Date(selectedPost.createTime).toLocaleString()}</span>
                  {selectedPost.tags && <span className="bg-muted px-2 py-0.5 rounded">{selectedPost.tags}</span>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {replies.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">暂无回复，来写下第一条交流吧</p>
                  </div>
                ) : replies.map(r => (
                  <div key={r.id} className={`p-3 rounded-lg ${r.isAiGenerated ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-muted/30'}`}>
                    <div className="flex items-center gap-2 mb-1 text-xs">
                      <span className="font-medium">{r.authorName}</span>
                      {r.isAiGenerated && <span className="text-emerald-500 text-[10px]">🤖 AI</span>}
                      <span className="text-muted-foreground">{new Date(r.createTime).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{r.content}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border/50 flex gap-2">
                <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key==='Enter' && handleReply()} placeholder="输入回复..." className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
                <button onClick={handleReply} className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium">回复</button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground"><p className="text-sm">选择左侧帖子查看详情</p></div>
          )}
        </div>
      </div>
      <AnimatePresence>{showNew && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowNew(false)}>
        <motion.form initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} onSubmit={handleNew} className="bg-card border border-border rounded-2xl p-6 w-[500px] shadow-2xl">
          <h3 className="text-lg font-semibold mb-4">发布帖子</h3>
          <div className="space-y-3">
            <input placeholder="标题 *" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
            <textarea placeholder="内容 *" required rows={6} value={form.content} onChange={e=>setForm({...form,content:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none resize-none"/>
            <input placeholder="标签（逗号分隔）" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none"/>
          </div>
          <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={()=>setShowNew(false)} className="px-4 py-2 text-sm text-muted-foreground">取消</button><button type="submit" className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium">发布</button></div>
        </motion.form>
      </motion.div>}</AnimatePresence>
    </div>
  )
}
