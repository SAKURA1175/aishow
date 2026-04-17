import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, Trash2, Download, Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { listDocuments, uploadDocument, deleteDocument, downloadDocument } from '@/api/document'
import useStore from '@/store/useStore'
import { cn } from '@/lib/utils'
import SpotlightCard from '@/components/animations/SpotlightCard'

export default function Documents() {
  const user = useStore((s) => s.user)
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'

  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef()

  const load = async () => {
    setLoading(true)
    try {
      const res = await listDocuments()
      if (res.data?.success) {
        setDocs(res.data.data || [])
      }
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = docs.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setError('')
    try {
      await uploadDocument(file, (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100))
      })
      await load()
    } catch (err) {
      setError(err.response?.data?.message || '上传失败')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该文档吗？')) return
    try {
      await deleteDocument(id)
      setDocs((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      setError(err.response?.data?.message || '删除失败')
    }
  }

  const getExt = (name) => {
    const parts = name.split('.')
    return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE'
  }

  const extColor = (ext) => {
    const map = {
      PDF: 'bg-red-500/10 text-red-500',
      DOCX: 'bg-blue-500/10 text-blue-500',
      DOC: 'bg-blue-500/10 text-blue-500',
      TXT: 'bg-slate-500/10 text-slate-400',
      MD: 'bg-emerald-500/10 text-emerald-500',
      PPTX: 'bg-orange-500/10 text-orange-500',
    }
    return map[ext] || 'bg-primary/10 text-primary'
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight">文档库</h2>
          <p className="text-xs text-muted-foreground mt-1 font-medium">{docs.length} 个本地资源已就绪</p>
        </div>
        {isTeacher && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0])}
              accept=".pdf,.doc,.docx,.txt,.md,.pptx"
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2 h-10 px-4 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              {uploading ? `上传中 ${uploadProgress}%` : '上传文档'}
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-8 py-4 border-b flex-shrink-0 bg-muted/20">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            placeholder="搜索文档名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-background/50 border-border/50 text-sm focus-visible:ring-primary/30"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="text-sm text-red-500 bg-red-500/10 px-4 py-3 rounded-xl flex items-center justify-between border border-red-500/20">
                <span className="font-medium">{error}</span>
                <button onClick={() => setError('')} className="hover:opacity-70"><X className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {uploading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-primary flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  正在同步资源...
                </span>
                <span className="text-xs font-bold text-primary">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-muted/40 rounded-2xl animate-pulse border border-border/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-64 text-muted-foreground"
          >
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-medium">{search ? '未找到相关文档' : '暂无文档资源'}</p>
            {isTeacher && !search && (
              <p className="text-xs mt-2 text-muted-foreground/60">点击右上角上传，开始构建知识库</p>
            )}
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((doc, index) => {
              const ext = getExt(doc.name)
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SpotlightCard className="group relative flex flex-col gap-4 p-5 transition-all hover:shadow-xl hover:-translate-y-1 bg-card border-border/40 overflow-visible">
                    <div className="flex items-start justify-between gap-4">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-inner', extColor(ext))}>
                        {ext.slice(0, 4)}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={downloadDocument(doc.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {isTeacher && (
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate text-foreground/90 mb-1 group-hover:text-primary transition-colors">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium border-border/60 text-muted-foreground uppercase">
                          {ext}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground/60 font-medium">ID: {doc.id}</span>
                      </div>
                    </div>
                  </SpotlightCard>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
