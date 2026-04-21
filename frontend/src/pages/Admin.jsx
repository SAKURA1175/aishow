import { useState, useEffect, useRef, useCallback } from 'react'
import { Shield, BrainCircuit, UploadCloud, CheckCircle2, XCircle, Loader2, ChevronDown, RefreshCw, Zap, Database, Server, MessageSquare, FileText, Terminal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getModelConfig, updateModelConfig, getModelPresets, batchImportKnowledge, getTaskStatus, getChatConfig, updateChatConfig, getPrompt, updatePrompt } from '@/api/admin'
import { listDocuments } from '@/api/document'

// ─── Tab 组件 ─────────────────────────────────────────────────────────────────
function Tab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
        active
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

// ─── 模型管理面板 ──────────────────────────────────────────────────────────────
function ModelPanel() {
  const [config, setConfig] = useState({ model: '', apiUrl: '', apiKey: '' })
  const [presets, setPresets] = useState([])
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null) // { ok, msg }
  const [presetsOpen, setPresetsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getModelConfig(), getModelPresets()]).then(([cfgRes, presRes]) => {
      if (cfgRes.data?.success) setConfig(cfgRes.data.data)
      if (presRes.data?.success) setPresets(presRes.data.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const applyPreset = (p) => {
    setConfig(prev => ({ ...prev, apiUrl: p.apiUrl, model: p.id.includes('local') ? prev.model : p.id.split('-').slice(-1)[0] }))
    setPresetsOpen(false)
  }

  const save = async () => {
    setSaving(true)
    setResult(null)
    try {
      const res = await updateModelConfig(config)
      setResult({ ok: res.data?.success, msg: res.data?.message || '操作完成' })
    } catch (e) {
      setResult({ ok: false, msg: e.message })
    }
    setSaving(false)
  }

  const categories = [...new Set(presets.map(p => p.category))]

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-primary" />
            当前模型配置
          </h3>
          {/* 预设选择器 */}
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setPresetsOpen(!presetsOpen)} className="gap-2">
              快速套用预设
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', presetsOpen && 'rotate-180')} />
            </Button>
            <AnimatePresence>
              {presetsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  className="absolute right-0 top-10 w-72 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden py-2"
                >
                  {loading ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> 加载中…
                    </div>
                  ) : categories.map(cat => (
                    <div key={cat}>
                      <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50">{cat}</div>
                      {presets.filter(p => p.category === cat).map(p => (
                        <button
                          key={p.id}
                          onClick={() => applyPreset(p)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          <span className="font-medium">{p.name}</span>
                          <span className="block text-[11px] text-muted-foreground truncate">{p.apiUrl}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">模型名称 (Model ID)</label>
            <input
              value={config.model}
              onChange={e => setConfig(p => ({ ...p, model: e.target.value }))}
              placeholder="e.g. gpt-4o / deepseek-v3 / gemma-4-e4b-it"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">API 地址 (Base URL)</label>
            <input
              value={config.apiUrl}
              onChange={e => setConfig(p => ({ ...p, apiUrl: e.target.value }))}
              placeholder="e.g. https://api.openai.com/v1 或 http://localhost:1234"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">API Key</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={e => setConfig(p => ({ ...p, apiKey: e.target.value }))}
              placeholder="sk-... (本地模型可填 lm-studio / ollama)"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all font-mono"
            />
            <p className="text-[11px] text-muted-foreground/70 mt-1.5">支持所有 OpenAI 兼容协议，包括 Ollama、LM Studio、DeepSeek、Kimi 等</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={save} disabled={saving} className="gap-2 shadow-lg shadow-primary/20">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {saving ? '更新中…' : '立即生效'}
          </Button>
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className={cn('flex items-center gap-1.5 text-sm font-medium', result.ok ? 'text-emerald-500' : 'text-red-500')}
              >
                {result.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {result.msg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 协议说明 */}
      <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5">
        <p className="font-semibold text-foreground/80 flex items-center gap-1.5"><Server className="w-3.5 h-3.5" /> 支持的接入协议</p>
        <p>• <span className="font-medium text-foreground/70">OpenAI 兼容</span>：GPT、DeepSeek、Kimi、通义千问、智谱 GLM、Gemini 中转等</p>
        <p>• <span className="font-medium text-foreground/70">本地推理</span>：LM Studio (端口 1234)、Ollama (端口 11434)，Key 填 lm-studio / ollama</p>
        <p>• 配置保存到 Redis，<span className="font-medium text-emerald-600">无需重启即时生效</span></p>
      </div>
    </div>
  )
}

// ─── 知识库导入面板 ────────────────────────────────────────────────────────────
function KnowledgePanel() {
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [taskId, setTaskId] = useState(null)
  const [task, setTask] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [docs, setDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(true)
  const fileInputRef = useRef(null)
  const pollRef = useRef(null)

  const loadDocs = useCallback(async () => {
    setDocsLoading(true)
    try {
      const res = await listDocuments()
      if (res.data?.success) setDocs(res.data.data || [])
    } catch (_) {}
    setDocsLoading(false)
  }, [])

  useEffect(() => { loadDocs() }, [loadDocs])

  // 轮询任务进度
  useEffect(() => {
    if (!taskId || !task || task.status !== 'running') return
    pollRef.current = setInterval(async () => {
      try {
        const res = await getTaskStatus(taskId)
        if (res.data?.success) {
          setTask(res.data.data)
          if (res.data.data.status !== 'running') {
            clearInterval(pollRef.current)
            loadDocs()
          }
        }
      } catch (_) {}
    }, 1500)
    return () => clearInterval(pollRef.current)
  }, [taskId, task?.status, loadDocs])

  const addFiles = (newFiles) => {
    const allowed = ['pdf', 'doc', 'docx', 'txt', 'md']
    const filtered = [...newFiles].filter(f => {
      const ext = f.name.split('.').pop().toLowerCase()
      return allowed.includes(ext)
    })
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...filtered.filter(f => !names.has(f.name))]
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const startImport = async () => {
    if (!files.length) return
    setUploading(true)
    setUploadProgress(0)
    setTask(null)
    try {
      const res = await batchImportKnowledge(files, (evt) => {
        if (evt.total) setUploadProgress(Math.round(evt.loaded / evt.total * 100))
      })
      if (res.data?.success) {
        setTaskId(res.data.data.taskId)
        setTask({ taskId: res.data.data.taskId, total: res.data.data.total, done: 0, failed: 0, status: 'running' })
        setFiles([])
      }
    } catch (e) {
      setTask({ status: 'error', message: e.message })
    }
    setUploading(false)
  }

  const progress = task && task.total > 0 ? Math.round((task.done + task.failed) / task.total * 100) : 0

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 上传区 */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 select-none',
          dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        <UploadCloud className={cn('w-10 h-10 mx-auto mb-3 transition-colors', dragging ? 'text-primary' : 'text-muted-foreground/50')} />
        <p className="text-sm font-semibold text-foreground/80">拖拽文件到此处，或点击选择</p>
        <p className="text-xs text-muted-foreground mt-1.5">支持 PDF、Word (.doc/.docx)、TXT、Markdown，可批量选择</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md"
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {/* 待上传文件列表 */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold">待导入文件 ({files.length})</p>
              <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="text-xs h-7 text-muted-foreground">清空</Button>
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-muted/40 rounded-lg px-3 py-2">
                  <span className="truncate max-w-xs text-foreground/80">{f.name}</span>
                  <span className="text-muted-foreground flex-shrink-0 ml-2">{(f.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
            <Button onClick={startImport} disabled={uploading} className="w-full mt-3 gap-2 shadow-lg shadow-primary/20">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {uploading ? `上传中 ${uploadProgress}%…` : `开始导入并向量化 (${files.length} 个文件)`}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 任务进度 */}
      <AnimatePresence>
        {task && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold flex items-center gap-2">
                {task.status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                {task.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {task.status === 'partial' && <XCircle className="w-4 h-4 text-amber-500" />}
                {task.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                {task.status === 'running' ? '正在处理与向量化…' : task.status === 'done' ? '全部完成！' : '部分完成'}
              </p>
              {task.status !== 'running' && (
                <span className="text-xs text-muted-foreground">成功 {task.done} / 失败 {task.failed} / 共 {task.total}</span>
              )}
            </div>
            {task.status === 'running' && (
              <>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-2 bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                {task.lastFile && (
                  <p className="text-xs text-muted-foreground">正在处理：{task.lastFile}</p>
                )}
                <p className="text-xs text-muted-foreground">{task.done + task.failed} / {task.total} 个文件</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 已导入文档列表 */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <p className="text-sm font-bold flex items-center gap-2">
            <Database className="w-4 h-4 text-orange-500" />
            知识库文档 ({docsLoading ? '…' : docs.length})
          </p>
          <Button variant="ghost" size="sm" onClick={loadDocs} className="h-7 w-7 p-0">
            <RefreshCw className={cn('w-3.5 h-3.5', docsLoading && 'animate-spin')} />
          </Button>
        </div>
        <div className="divide-y divide-border/40 max-h-64 overflow-y-auto custom-scrollbar">
          {docsLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              加载中…
            </div>
          ) : docs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">暂无文档，请上传资料以丰富知识库</div>
          ) : docs.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
              <span className="text-[10px] text-muted-foreground/50 w-5 text-right flex-shrink-0">{i + 1}</span>
              <span className="text-sm text-foreground/80 truncate flex-1">{d.name}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 对话设置面板 ──────────────────────────────────────────────────────────────
function ChatConfigPanel() {
  const [cfg, setCfg] = useState({ maxHistoryMessages: 30, maxHistoryChars: 12000 })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    getChatConfig().then(res => {
      if (res.data?.success) setCfg(res.data.data)
    }).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    setResult(null)
    try {
      const res = await updateChatConfig(cfg)
      setResult({ ok: res.data?.success, msg: res.data?.message || '操作完成' })
    } catch (e) {
      setResult({ ok: false, msg: e.message })
    }
    setSaving(false)
  }

  const Slider = ({ label, desc, field, min, max, step, unit }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <span className="text-sm font-bold text-primary tabular-nums w-20 text-right">
          {cfg[field].toLocaleString()} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={cfg[field]}
        onChange={e => setCfg(p => ({ ...p, [field]: Number(e.target.value) }))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <h3 className="font-bold text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          对话上下文配置
        </h3>

        <Slider
          label="最大历史消息条数"
          desc="每次 AI 回答时携带的历史对话轮数上限"
          field="maxHistoryMessages"
          min={2} max={100} step={2} unit=" 条"
        />
        <Slider
          label="最大历史字符数"
          desc="携带历史的总字符数上限（1个中文字约=1字符）"
          field="maxHistoryChars"
          min={1000} max={60000} step={1000} unit=" 字"
        />

        <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground/70">参考值</p>
          <p>• 轻量对话：8条 / 3000字 &nbsp;·&nbsp; 推荐默认：30条 / 12000字</p>
          <p>• 超长记忆：50条 / 30000字（需模型 Context 窗口足够大）</p>
          <p>• 修改后<span className="text-emerald-600 font-medium">立即生效</span>，无需重启</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving} className="gap-2 shadow-lg shadow-primary/20">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {saving ? '保存中…' : '保存并立即生效'}
          </Button>
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className={cn('flex items-center gap-1.5 text-sm font-medium', result.ok ? 'text-emerald-500' : 'text-red-500')}
              >
                {result.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {result.msg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── 系统提示词编辑面板 ──────────────────────────────────────────────────────────────
const ROLE_LABELS = { student: '学生端 AI 教师', teacher: '教师端 AI 助教' }

function PromptPanel() {
  const [role, setRole] = useState('student')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  const load = async (r) => {
    setLoading(true)
    setResult(null)
    try {
      const res = await getPrompt(r)
      if (res.data?.success) setContent(res.data.data.content || '')
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load(role) }, [role])

  const save = async () => {
    setSaving(true)
    setResult(null)
    try {
      const res = await updatePrompt(role, content)
      setResult({ ok: res.data?.success, msg: res.data?.message || '操作完成' })
    } catch (e) {
      setResult({ ok: false, msg: e.message })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            系统提示词编辑
          </h3>
          <div className="flex gap-2">
            {Object.entries(ROLE_LABELS).map(([r, label]) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  role === r ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />加载中…
          </div>
        ) : (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={18}
            className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all resize-y leading-relaxed"
            placeholder="输入系统提示词内容..."
          />
        )}

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving || loading} className="gap-2 shadow-lg shadow-primary/20">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {saving ? '保存中…' : '保存并立即生效'}
          </Button>
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className={cn('flex items-center gap-1.5 text-sm font-medium', result.ok ? 'text-emerald-500' : 'text-red-500')}
              >
                {result.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {result.msg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-400 space-y-1">
        <p className="font-semibold flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> 使用说明</p>
        <p>• 修改后<span className="font-medium">立即生效</span>，并写入 Redis 持久化，重启后仍生效</p>
        <p>• 学生端提示词对应 ai-teacher-prompt.txt，教师端对应 ai-assistant-prompt.txt</p>
        <p>• 提示词中可使用 Markdown 格式，正文起始的 # 行会被跳过</p>
      </div>
    </div>
  )
}

// ─── 主页面 ────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [tab, setTab] = useState('model')


  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-8 py-5 border-b flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">管理控制台</h2>
          <p className="text-xs text-muted-foreground">模型管理 · 知识库导入</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-8 pt-5 pb-0 flex-shrink-0">
        <Tab active={tab === 'model'} onClick={() => setTab('model')} icon={BrainCircuit} label="模型配置" />
        <Tab active={tab === 'knowledge'} onClick={() => setTab('knowledge')} icon={Database} label="知识库导入" />
        <Tab active={tab === 'chat'} onClick={() => setTab('chat')} icon={MessageSquare} label="对话设置" />
        <Tab active={tab === 'prompt'} onClick={() => setTab('prompt')} icon={Terminal} label="提示词编辑" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          {tab === 'model' && (
            <motion.div key="model" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ModelPanel />
            </motion.div>
          )}
          {tab === 'knowledge' && (
            <motion.div key="knowledge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <KnowledgePanel />
            </motion.div>
          )}
          {tab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ChatConfigPanel />
            </motion.div>
          )}
          {tab === 'prompt' && (
            <motion.div key="prompt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PromptPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
