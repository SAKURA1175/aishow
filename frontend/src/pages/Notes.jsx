import { useState, useEffect } from 'react'
import { FileEdit, Plus, Trash2, Share2, Eye, Sparkles, Loader2, Maximize2, Edit3, X, Calendar, Tag, BookOpen } from 'lucide-react'
import { getMyNotebooks, createNotebook, updateNotebook, deleteNotebook, getSharedNotebooks, aiSummarizeNotebook } from '@/api/modules'
import { AnimatePresence, motion } from 'framer-motion'
import MarkdownRenderer from '@/components/MarkdownRenderer'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('my')
  const [showEdit, setShowEdit] = useState(false)
  const [viewingNote, setViewingNote] = useState(null) // 详情展开页
  const [editingNote, setEditingNote] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', tags: '', isShared: false, aiSummary: '' })
  const [summarizingId, setSummarizingId] = useState(null)
  const [isSummarizingForm, setIsSummarizingForm] = useState(false)

  useEffect(() => { load() }, [tab])

  const load = async () => {
    setLoading(true)
    try {
      const r = tab === 'my' ? await getMyNotebooks() : await getSharedNotebooks()
      setNotes(r.data?.data || [])
    } catch {}
    setLoading(false)
  }

  const openNew = () => { 
    setEditingNote(null)
    setForm({ title: '', content: '', tags: '', isShared: false, aiSummary: '' })
    setShowEdit(true) 
  }
  
  const openEdit = (n, e) => { 
    if (e) e.stopPropagation()
    setEditingNote(n)
    setForm({ title: n.title, content: n.content || '', tags: n.tags || '', isShared: n.isShared || false, aiSummary: n.aiSummary || '' })
    setShowEdit(true) 
  }

  const openDetail = (n) => {
    setViewingNote(n)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editingNote) {
        await updateNotebook(editingNote.id, form)
        // 若同时在查看该详情，同步更新详情
        if (viewingNote?.id === editingNote.id) {
          setViewingNote(prev => ({ ...prev, ...form }))
        }
      } else {
        await createNotebook(form)
      }
      setShowEdit(false)
      load()
    } catch {}
  }

  const handleCardAiSummary = async (n, e) => {
    if (e) e.stopPropagation()
    try {
      setSummarizingId(n.id)
      const res = await aiSummarizeNotebook(n.id)
      const summary = res.data?.data?.aiSummary
      if (summary) {
        setNotes(prev => prev.map(item => item.id === n.id ? { ...item, aiSummary: summary } : item))
        if (viewingNote?.id === n.id) {
          setViewingNote(prev => ({ ...prev, aiSummary: summary }))
        }
      }
    } catch (err) {
      alert('AI 提炼摘要失败: ' + (err.response?.data?.message || err.message))
    } finally {
      setSummarizingId(null)
    }
  }

  const handleModalAiSummary = async () => {
    if (!editingNote?.id) {
      alert('请先保存新建的笔记，再生成 AI 摘要')
      return
    }
    try {
      setIsSummarizingForm(true)
      await updateNotebook(editingNote.id, form)
      const res = await aiSummarizeNotebook(editingNote.id)
      const summary = res.data?.data?.aiSummary
      if (summary) {
        setForm(prev => ({ ...prev, aiSummary: summary }))
        setNotes(prev => prev.map(item => item.id === editingNote.id ? { ...item, ...form, aiSummary: summary } : item))
        if (viewingNote?.id === editingNote.id) {
          setViewingNote(prev => ({ ...prev, ...form, aiSummary: summary }))
        }
      }
    } catch (err) {
      alert('AI 提炼摘要失败: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsSummarizingForm(false)
    }
  }

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation()
    if (!confirm('确定删除该笔记？')) return
    try { 
      await deleteNotebook(id)
      if (viewingNote?.id === id) setViewingNote(null)
      load() 
    } catch {}
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <FileEdit className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">课程笔记</h1>
            <p className="text-xs text-muted-foreground">随时记录、AI 智能归纳要点并展开完整阅读</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button onClick={()=>setTab('my')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab==='my'?'bg-card shadow text-foreground':'text-muted-foreground'}`}>我的笔记</button>
            <button onClick={()=>setTab('shared')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab==='shared'?'bg-card shadow text-foreground':'text-muted-foreground'}`}>共享笔记</button>
          </div>
          {tab === 'my' && (
            <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> 新建笔记
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">加载中...</p>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <FileEdit className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">{tab==='my'?'暂无笔记，点击右上角新建':'暂无共享笔记'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map(n => (
              <div
                key={n.id}
                onClick={() => openDetail(n)}
                className="p-5 rounded-xl border border-border/50 bg-card hover:border-amber-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm truncate pr-2 group-hover:text-amber-600 transition-colors">
                      {n.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={summarizingId === n.id}
                        onClick={(e) => handleCardAiSummary(n, e)}
                        className="p-1 hover:bg-amber-500/10 rounded text-amber-500 transition-colors"
                        title={n.aiSummary ? '重新生成 AI 摘要' : '一键生成 AI 摘要'}
                      >
                        {summarizingId === n.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </button>
                      {tab === 'my' && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => openEdit(n, e)}
                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                            title="编辑笔记"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(n.id, e)}
                            className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500"
                            title="删除笔记"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                    {n.content || '空笔记'}
                  </p>

                  {n.aiSummary && (
                    <div className="mb-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] leading-relaxed text-muted-foreground">
                      <div className="flex items-center gap-1 font-medium text-amber-600 mb-0.5">
                        <Sparkles className="w-3 h-3" />
                        <span>AI 智能提要</span>
                      </div>
                      <p className="line-clamp-2">{n.aiSummary}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 truncate max-w-[150px]">
                    <Tag className="w-3 h-3 shrink-0" />
                    <span className="truncate">{n.tags || '未分类'}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {n.isShared && <Share2 className="w-3 h-3 text-blue-500" title="已共享" />}
                    <span className="text-[10px] text-amber-600/80 group-hover:text-amber-600 font-medium">展开阅读 →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 笔记详情大页面（完整展开阅读器） */}
      <AnimatePresence>
        {viewingNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setViewingNote(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl w-full max-w-4xl h-[88vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* 详情页头部 */}
              <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-foreground truncate">{viewingNote.title}</h2>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(viewingNote.updateTime || viewingNote.createTime).toLocaleString()}
                      </span>
                      {viewingNote.tags && (
                        <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-[11px]">
                          <Tag className="w-3 h-3" />
                          {viewingNote.tags}
                        </span>
                      )}
                      {viewingNote.isShared && (
                        <span className="flex items-center gap-1 text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded text-[11px]">
                          <Share2 className="w-3 h-3" /> 已共享
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={summarizingId === viewingNote.id}
                    onClick={() => handleCardAiSummary(viewingNote)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                  >
                    {summarizingId === viewingNote.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {summarizingId === viewingNote.id ? '提炼中...' : 'AI 提炼'}
                  </button>
                  {tab === 'my' && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = viewingNote
                        setViewingNote(null)
                        openEdit(target)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-medium transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> 编辑
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewingNote(null)}
                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors ml-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 详情页正文区域 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {viewingNote.aiSummary && (
                  <div className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/25 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                      <Sparkles className="w-4 h-4" />
                      <span>AI 智能提炼核心要点</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {viewingNote.aiSummary}
                    </p>
                  </div>
                )}

                <div className="prose dark:prose-invert max-w-none text-foreground leading-relaxed text-sm bg-background p-6 rounded-xl border border-border/40 shadow-inner">
                  {viewingNote.content ? (
                    <MarkdownRenderer content={viewingNote.content} />
                  ) : (
                    <p className="text-muted-foreground italic">该笔记暂无内容</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 编辑/新建弹窗 */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEdit(false)}
          >
            <motion.form
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={e => e.stopPropagation()}
              onSubmit={handleSave}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{editingNote ? '编辑笔记' : '新建笔记'}</h3>
                {editingNote && (
                  <button
                    type="button"
                    disabled={isSummarizingForm}
                    onClick={handleModalAiSummary}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
                  >
                    {isSummarizingForm ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isSummarizingForm ? 'AI 正在提炼...' : 'AI 智能摘要提炼'}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <input
                  placeholder="标题 *"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none focus:border-amber-500"
                />
                <textarea
                  placeholder="笔记内容（支持完整 Markdown 语法、公式等）"
                  rows={12}
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none focus:border-amber-500 resize-none font-mono leading-relaxed"
                />
                
                {form.aiSummary && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-600">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI 智能提要与知识要点</span>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={form.aiSummary}
                      onChange={e => setForm({ ...form, aiSummary: e.target.value })}
                      placeholder="AI 摘要内容"
                      className="w-full bg-background/80 p-2 rounded text-xs border border-border/50 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <input
                    placeholder="标签（逗号分隔，如：计算机系统, 高数）"
                    value={form.tags}
                    onChange={e => setForm({ ...form, tags: e.target.value })}
                    className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:outline-none focus:border-amber-500"
                  />
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isShared}
                      onChange={e => setForm({ ...form, isShared: e.target.checked })}
                    />
                    <Share2 className="w-4 h-4 text-blue-500" />
                    <span>共享给班级同学</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  保存
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

