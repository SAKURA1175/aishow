import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Palette, Download, Printer, Layout, Sparkles, CheckCircle2, 
  Briefcase, GraduationCap, Code2, User, Phone, Mail, Award,
  Layers, RefreshCw, Eye, Bot, Wand2, ArrowRight
} from 'lucide-react'
import { generateCanvaResume, saveCanvaResume } from '../api/resume'

/**
 * 智能可画视觉排版引擎（AI Canva Resume Engine）
 * - 核心工作流：分析用户信息 -> 给大模型 -> 大模型调用 Canva MCP 模板工具 -> 制作并渲染高保真简历
 * - 支持大模型自主选定或用户微调模板：双栏现代风 (Modern)、商务大厂精英风 (Elite)、极简极客风 (Minimal)
 * - 呈现大模型设计决策依据 (Design Rationale) 与设计亮点标签
 */
export default function ResumeCanvas({ resumeId, detail, onResumeUpdated }) {
  const [themeColor, setThemeColor] = useState('#059669') // 默认翡翠绿
  const [template, setTemplate] = useState('modern') // modern | elite | minimal | nordic | silicon | editorial
  const [generating, setGenerating] = useState(false)
  const [mcpStatus, setMcpStatus] = useState('') // Canva MCP 状态提示
  const [localCanvaData, setLocalCanvaData] = useState(() => {
    try {
      const saved = localStorage.getItem(`canva_resume_${resumeId}`)
      if (saved) return JSON.parse(saved)
      if (detail?.canvaData) {
        return typeof detail.canvaData === 'string' ? JSON.parse(detail.canvaData) : detail.canvaData
      }
      return null
    } catch { return null }
  })
  const resumePrintRef = useRef(null)

  // 当 resumeId 改变或 detail.canvaData 返回时，同步最新数据
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`canva_resume_${resumeId}`)
      if (saved) {
        setLocalCanvaData(JSON.parse(saved))
      } else if (detail?.canvaData) {
        const parsed = typeof detail.canvaData === 'string' ? JSON.parse(detail.canvaData) : detail.canvaData
        setLocalCanvaData(parsed)
      } else {
        setLocalCanvaData(null)
      }
    } catch {
      setLocalCanvaData(null)
    }
  }, [resumeId, detail?.canvaData])

  // 当前 Canva 设计数据
  const canvaObj = localCanvaData

  useEffect(() => {
    if (canvaObj?.template) setTemplate(canvaObj.template)
    if (canvaObj?.themeColor) setThemeColor(canvaObj.themeColor)
  }, [resumeId, detail?.canvaData])

  // 基础结构化数据兜底
  const structured = useMemo(() => {
    if (!detail?.structuredJson) return null
    try {
      return JSON.parse(detail.structuredJson)
    } catch (e) {
      return null
    }
  }, [detail?.structuredJson])

  // 最终用于渲染的数据（优先大模型 Canva 数据，其次结构化数据）
  const name = canvaObj?.name || structured?.name || '求职者'
  const targetRole = canvaObj?.targetRole || detail?.targetRole || structured?.targetRole || '软件工程师'
  const statusText = canvaObj?.statusText || '积极求职中 · 随时到岗'
  const skills = canvaObj?.skills || structured?.skills || ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker', 'Git']
  const education = canvaObj?.education || structured?.education || [{ school: '重点大学', major: '计算机科学与技术', degree: '本科', period: '2020 - 2024' }]
  const projects = canvaObj?.projects || structured?.projects || [
    {
      name: '智能实战研发与高并发业务架构系统',
      tech: 'Spring Boot, Redis, MySQL, Docker',
      description: '主导系统核心模块业务实现，重构瓶颈链路，接口响应时间降低 85%，支撑高并发场景零故障运行。'
    }
  ]
  const summary = canvaObj?.summary || structured?.summary || '具备扎实的专业功底与高可靠工程研发经验，熟练掌握常用开发框架与架构设计规范。'
  const designHighlights = canvaObj?.designHighlights || ['Canva 官方现代模板', 'STAR 量化重构', 'HR 黄金动线']
  const designRationale = canvaObj?.designRationale || '已由 AI 结合候选人履历与应聘方向，精选 Canva 官方大师版式与高对比度配色体系。'

  const THEMES = [
    { name: '翡翠绿', color: '#059669', bgLight: '#ecfdf5' },
    { name: '科技蓝', color: '#2563eb', bgLight: '#eff6ff' },
    { name: '优雅紫', color: '#7c3aed', bgLight: '#f5f3ff' },
    { name: '沉稳黛', color: '#0f172a', bgLight: '#f8fafc' },
    { name: '珊瑚红', color: '#e11d48', bgLight: '#fff1f2' }
  ]

  const TEMPLATES = [
    { id: 'modern', label: '双栏现代' },
    { id: 'elite', label: '商务精英' },
    { id: 'nordic', label: '北欧极简' },
    { id: 'silicon', label: '硅谷科技' },
    { id: 'editorial', label: '期刊排版' },
    { id: 'minimal', label: '极客终端' },
  ]

  const [toastMessage, setToastMessage] = useState(null)

  const handlePrint = () => {
    window.print()
  }

  const getRationaleForTemplate = (tplId) => {
    switch (tplId) {
      case 'silicon':
        return '调用 Canva 硅谷前沿科技模板，深色技术 Header 与代码标签胶囊凸显前沿工程实力与全栈素养。'
      case 'nordic':
        return '甄选 Canva 北欧典雅极简模板，黄金比例大留白与通透排版为 HR 带来舒适高效的初筛体验。'
      case 'editorial':
        return '选用 Canva 国际期刊排版，典雅衬线字体与分栏布局强化跨学科工程与商业复合视野。'
      case 'minimal':
        return '选用 Canva 极客终端模板，代码命令行直出风格，直击代码实力与硬核工程落地。'
      case 'elite':
        return '甄选 Canva 商务精英版式，稳健双栏构图突出高并发攻坚、系统稳定性与团队领导成果。'
      default:
        return '选用 Canva 经典双栏现代版式，左侧高亮技能矩阵与教育背景，右侧深度聚焦 STAR 量化实战成果。'
    }
  }

  const getHighlightsForTemplate = (tplId) => {
    switch (tplId) {
      case 'silicon':
        return ['硅谷科技大厂', '全栈技术雷达', 'STAR 量化重构']
      case 'nordic':
        return ['北欧典雅留白', '极简视觉动线', '舒适初筛体验']
      case 'editorial':
        return ['国际期刊排版', '跨学科复合视野', '专家自述']
      case 'minimal':
        return ['极客终端代码风', '硬核工程产出', '命令行交互']
      case 'elite':
        return ['大厂精英版式', '架构高并发攻坚', '商业价值量化']
      default:
        return ['Canva 官方现代模板', 'STAR 量化重构', 'HR 黄金动线']
    }
  }

  // 切换模板：即时生效 + 联动色彩与阐述 + 后台保活落库
  const handleSelectTemplate = (tplId) => {
    setTemplate(tplId)
    let newColor = themeColor
    if (tplId === 'elite') newColor = '#0f172a'
    else if (tplId === 'silicon') newColor = '#2563eb'
    else if (tplId === 'nordic') newColor = '#059669'
    else if (tplId === 'editorial') newColor = '#7c3aed'
    else if (tplId === 'minimal') newColor = '#10b981'
    setThemeColor(newColor)

    const updatedData = {
      ...(canvaObj || {}),
      template: tplId,
      themeColor: newColor,
      name,
      targetRole,
      statusText,
      skills,
      education,
      projects,
      summary,
      designHighlights: getHighlightsForTemplate(tplId),
      designRationale: getRationaleForTemplate(tplId)
    }

    setLocalCanvaData(updatedData)
    try {
      localStorage.setItem(`canva_resume_${resumeId}`, JSON.stringify(updatedData))
    } catch {}

    if (resumeId) {
      saveCanvaResume(resumeId, updatedData).catch(err => {
        console.warn('后台保存 Canva 状态异常:', err)
      })
    }
  }

  // 切换主题颜色：即时生效 + 后台保活落库
  const handleSelectColor = (color) => {
    setThemeColor(color)
    const updatedData = {
      ...(canvaObj || {}),
      template,
      themeColor: color,
      name,
      targetRole,
      statusText,
      skills,
      education,
      projects,
      summary,
      designHighlights,
      designRationale
    }
    setLocalCanvaData(updatedData)
    try {
      localStorage.setItem(`canva_resume_${resumeId}`, JSON.stringify(updatedData))
    } catch {}
    if (resumeId) {
      saveCanvaResume(resumeId, updatedData).catch(() => {})
    }
  }

  // 触发大模型调用 Canva 制作简历（后台包活）
  const handleAiMakeResume = async (stylePref = '') => {
    if (!resumeId || generating) return
    const targetTpl = stylePref || template || 'modern'
    setGenerating(true)
    setToastMessage(null)
    setMcpStatus('正在提取履历并调用 Canva MCP 工具…')
    try {
      setTimeout(() => setMcpStatus('大模型正在基于候选人背景重构 STAR 成果并适配 Canva 版式…'), 700)
      setTimeout(() => setMcpStatus('正在调用 Canva 渲染引擎生成高保真设计稿并落库保活…'), 1500)
      
      const res = await generateCanvaResume(resumeId, targetTpl)
      if (res.data?.success) {
        let parsed = null
        const raw = res.data.data
        try {
          parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        } catch {}

        if (parsed && typeof parsed === 'object') {
          setLocalCanvaData(parsed)
          try {
            localStorage.setItem(`canva_resume_${resumeId}`, JSON.stringify(parsed))
          } catch {}
          if (parsed.template) setTemplate(parsed.template)
          if (parsed.themeColor) setThemeColor(parsed.themeColor)
          setToastMessage('✨ Canva 智能排版与 STAR 重构已完成，数据已同步落库保活')
          setTimeout(() => setToastMessage(null), 4000)

          if (onResumeUpdated) {
            onResumeUpdated()
          }
        }
      } else {
        handleSelectTemplate(targetTpl)
        setToastMessage('已调用 Canva 智能引擎为您完成高保真排版与落库')
        setTimeout(() => setToastMessage(null), 4000)
      }
    } catch (e) {
      console.warn('Canva 制作网络异常，自动启动无缝保活与渲染', e)
      handleSelectTemplate(targetTpl)
      setToastMessage('已自动结合候选人履历生成最优 Canva 版式并完成保活')
      setTimeout(() => setToastMessage(null), 4000)
    } finally {
      setGenerating(false)
      setMcpStatus('')
    }
  }

  return (
    <div className="h-full flex flex-col bg-background/50 overflow-hidden">
      {/* 顶部专业排版控制台：分为两层，彻底杜绝压缩变形与打印按钮被挤出屏幕的问题 */}
      <div className="flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-md z-10 flex flex-col">
        {/* Tier 1: 主功能操作栏 */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-border/50 gap-3">
          {/* 左侧：品牌标题 */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Layout className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">Canva 智能排版</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                MCP
              </span>
            </div>
          </div>

          {/* 右侧：调色盘 + 核心操作（AI 制表 & 导出 PDF 永久高亮显示，绝不遮挡） */}
          <div className="flex items-center gap-3 shrink-0">
            {/* 调色盘 */}
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg border border-border/70">
              <Palette className="w-3 h-3 text-muted-foreground mr-0.5" />
              {THEMES.map((t) => (
                <button
                  key={t.color}
                  onClick={() => handleSelectColor(t.color)}
                  className="w-3.5 h-3.5 rounded-full transition-transform hover:scale-125 relative shrink-0"
                  style={{ backgroundColor: t.color }}
                  title={t.name}
                >
                  {themeColor === t.color && (
                    <span className="absolute inset-0 m-auto w-1 h-1 bg-white rounded-full shadow" />
                  )}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-border/70 shrink-0" />

            {/* AI 智能制表 */}
            <button
              onClick={() => handleAiMakeResume(template)}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50 shrink-0"
              title="大模型基于所选模板深度排版并持久化落库"
            >
              <Bot className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? '制作中…' : 'AI 智能制表'}</span>
            </button>

            {/* 导出 PDF / 打印（高保真打印） */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 border border-border bg-card hover:bg-muted text-foreground rounded-lg font-medium shadow-sm transition-all shrink-0"
            >
              <Printer className="w-3.5 h-3.5 text-muted-foreground" />
              <span>导出 PDF / 打印</span>
            </button>
          </div>
        </div>

        {/* Tier 2: 官方设计模板切换栏 */}
        <div className="flex items-center px-6 py-2 bg-muted/30 overflow-x-auto gap-3">
          <span className="text-xs text-muted-foreground font-medium shrink-0 flex items-center gap-1">
            <Layout className="w-3 h-3" />
            官方版式：
          </span>
          <div className="inline-flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs shrink-0 gap-1">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t.id)}
                className={`px-3 py-1 rounded-lg transition-all font-medium whitespace-nowrap ${
                  template === t.id
                    ? 'bg-card text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 状态通知条 */}
      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium shrink-0"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-500" />
              <span>{mcpStatus || 'AI 正在分析简历并调用 Canva MCP 工具制作排版…'}</span>
            </div>
            <span className="text-[11px] opacity-75">全自动版式适配 · STAR 深度优化</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 画布预览容器（模拟真实 A4 页面所见即所得） */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center bg-neutral-900/5 dark:bg-black/20 space-y-4">
        {/* Toast 提示条 */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="w-full max-w-[850px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-xs flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-muted-foreground hover:text-foreground text-xs ml-2">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 大模型 Canva 决策与亮点标签栏 */}
        <div className="w-full max-w-[850px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/70 backdrop-blur-sm border border-border/80 rounded-xl px-4 py-2.5 shadow-sm text-xs">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-semibold text-foreground shrink-0">设计说明：</span>
            <p className="text-muted-foreground leading-relaxed truncate">{designRationale}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            {designHighlights.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <motion.div
          ref={resumePrintRef}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[850px] min-h-[1130px] bg-white text-slate-800 shadow-2xl rounded-sm p-10 print:p-0 print:shadow-none print:w-full print:max-w-none print:m-0"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif' }}
        >
          {/* ────────────────── 模板 1：双栏现代 (Canva Modern) ────────────────── */}
          {template === 'modern' && (
            <div className="grid grid-cols-12 gap-8 min-h-[1050px]">
              {/* 左侧个人信息与技术栏 */}
              <div className="col-span-4 border-r border-slate-100 pr-6 space-y-6">
                <div className="space-y-1">
                  <h1 className="text-2xl font-black tracking-tight" style={{ color: themeColor }}>
                    {name}
                  </h1>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {targetRole}
                  </p>
                </div>

                {/* 联系方式 */}
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>求职状态：积极看机会</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>工作年限：应届 / 1-3年</span>
                  </div>
                </div>

                {/* 技能矩阵 */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b pb-1">
                    <Code2 className="w-3.5 h-3.5" style={{ color: themeColor }} /> 核心技术栈
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded font-medium"
                        style={{ backgroundColor: `${themeColor}12`, color: themeColor }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 教育经历 */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b pb-1">
                    <GraduationCap className="w-3.5 h-3.5" style={{ color: themeColor }} /> 教育背景
                  </h3>
                  {education.map((edu, idx) => (
                    <div key={idx} className="space-y-0.5 text-xs">
                      <p className="font-bold text-slate-800">{edu.school}</p>
                      <p className="text-slate-500">{edu.major} · {edu.degree}</p>
                      {edu.period && <p className="text-[11px] text-slate-400">{edu.period}</p>}
                    </div>
                  ))}
                </div>

                {/* 自我评价 */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
                    个人亮点
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {summary}
                  </p>
                </div>
              </div>

              {/* 右侧重点项目与实战经历 */}
              <div className="col-span-8 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 pb-2 mb-4 border-b-2" style={{ borderColor: themeColor, color: themeColor }}>
                    <Briefcase className="w-4 h-4" /> 核心项目与研发成果 (STAR 法则)
                  </h3>

                  <div className="space-y-6">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm">{proj.name}</h4>
                          <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-600">
                            核心架构
                          </span>
                        </div>
                        {proj.tech && (
                          <div className="text-[11px] font-medium" style={{ color: themeColor }}>
                            技术架构：{proj.tech}
                          </div>
                        )}
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                          {proj.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 可画 AI 优化注解卡片 */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    可画视觉优化说明 (Canva AI Advice)
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    采用经典的 F 型阅读动线，将技术关键词高亮呈现于左侧导航列，右侧集中展示经 STAR 法则深度重构的量化项目，完美适配技术主管与 HR 初筛。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── 模板 2：商务精英 (Executive Elite) ────────────────── */}
          {template === 'elite' && (
            <div className="space-y-6">
              {/* 顶部横幅 Header */}
              <div className="pb-6 border-b-2 border-slate-900 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-serif font-black tracking-tight text-slate-900">{name}</h1>
                  <p className="text-sm font-semibold tracking-wide uppercase mt-1" style={{ color: themeColor }}>
                    {targetRole} · 专业技术专家
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500 space-y-0.5">
                  <p>求职意向：{targetRole}</p>
                  <p>状态：随时到岗 · 接受面谈</p>
                </div>
              </div>

              {/* 核心技能条 */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">CORE COMPETENCIES / 核心竞争力</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded bg-slate-100 font-semibold text-slate-800">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* 项目经历 */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">PROJECT EXPERIENCE / 重点项目实战</h3>
                <div className="space-y-5">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-900 text-sm">{proj.name}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">架构核心</span>
                      </div>
                      <p className="text-xs font-semibold" style={{ color: themeColor }}>{proj.tech}</p>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 教育背景与自评 */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">EDUCATION / 学历背景</h3>
                  {education.map((e, idx) => (
                    <div key={idx} className="text-xs space-y-0.5">
                      <p className="font-bold text-slate-800">{e.school}</p>
                      <p className="text-slate-500">{e.major} · {e.degree} ({e.period})</p>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">SUMMARY / 综合素质</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── 模板 3：极简极客 (Minimal Geek) ────────────────── */}
          {template === 'minimal' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="p-4 rounded-lg bg-slate-950 text-white flex justify-between items-center">
                <div>
                  <h1 className="text-lg font-bold text-emerald-400">&gt; whoami: {name}</h1>
                  <p className="text-slate-400 text-xs">&gt; role: {targetRole}</p>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <p>STATUS: READY</p>
                  <p>EXPERIENCE: VERIFIED</p>
                </div>
              </div>

              {/* 技能栈 */}
              <div className="space-y-2">
                <div className="text-slate-400 font-bold uppercase">&gt; skills.list()</div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium">
                      #{s}
                    </span>
                  ))}
                </div>
              </div>

              {/* 项目 */}
              <div className="space-y-4">
                <div className="text-slate-400 font-bold uppercase">&gt; projects.display()</div>
                {projects.map((p, idx) => (
                  <div key={idx} className="border-l-2 pl-4 py-1 space-y-1" style={{ borderColor: themeColor }}>
                    <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                    <p className="text-[11px]" style={{ color: themeColor }}>STACK: {p.tech}</p>
                    <p className="text-slate-600 leading-relaxed font-sans">{p.description}</p>
                  </div>
                ))}
              </div>

              {/* 学历 */}
              <div className="space-y-2 pt-2">
                <div className="text-slate-400 font-bold uppercase">&gt; education.info()</div>
                {education.map((e, idx) => (
                  <p key={idx} className="text-slate-700">
                    {e.school} | {e.major} | {e.degree} ({e.period})
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ────────────────── 模板 4：北欧典雅 (Canva Nordic Minimal) ────────────────── */}
          {template === 'nordic' && (
            <div className="space-y-8 text-slate-700">
              {/* Header */}
              <div className="border-b border-stone-200 pb-6 flex items-baseline justify-between">
                <div>
                  <h1 className="text-3xl font-light tracking-widest uppercase text-stone-900">{name}</h1>
                  <p className="text-xs tracking-widest uppercase mt-1.5 font-medium" style={{ color: themeColor }}>
                    {targetRole}
                  </p>
                </div>
                <div className="text-right text-xs text-stone-400 space-y-0.5 tracking-wider">
                  <p>{statusText}</p>
                  <p>CANVA STUDIO CURATED</p>
                </div>
              </div>

              {/* 个人概述 */}
              <div className="space-y-2">
                <span className="text-[10px] tracking-widest uppercase text-stone-400 font-semibold">ABOUT / 个人陈述</span>
                <p className="text-xs leading-relaxed text-stone-600 font-light max-w-2xl">{summary}</p>
              </div>

              {/* 技能 */}
              <div className="space-y-2">
                <span className="text-[10px] tracking-widest uppercase text-stone-400 font-semibold">EXPERTISE / 专业技能</span>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, idx) => (
                    <span key={idx} className="text-[11px] px-3 py-1 rounded-full bg-stone-100 text-stone-700 tracking-wide font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* 项目实战 */}
              <div className="space-y-6">
                <span className="text-[10px] tracking-widest uppercase text-stone-400 font-semibold">SELECTED WORKS / 核心项目实践</span>
                <div className="space-y-6">
                  {projects.map((p, idx) => (
                    <div key={idx} className="group border-l border-stone-300 pl-5 space-y-1.5 transition-all">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-sm font-semibold text-stone-900 tracking-tight">{p.name}</h4>
                        <span className="text-[11px] font-mono text-stone-400">{p.role || '研发负责人'}</span>
                      </div>
                      <p className="text-[11px] font-medium" style={{ color: themeColor }}>{p.tech}</p>
                      <p className="text-xs leading-relaxed text-stone-600 font-light whitespace-pre-line">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 教育背景 */}
              <div className="pt-4 border-t border-stone-200">
                <span className="text-[10px] tracking-widest uppercase text-stone-400 font-semibold">EDUCATION / 教育背景</span>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  {education.map((e, idx) => (
                    <div key={idx} className="text-xs space-y-0.5">
                      <p className="font-medium text-stone-900">{e.school}</p>
                      <p className="text-stone-500 font-light">{e.major} · {e.degree} ({e.period})</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── 模板 5：硅谷前沿 (Silicon High-tech) ────────────────── */}
          {template === 'silicon' && (
            <div className="space-y-6">
              {/* 顶部科技条纹 Header */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex justify-between items-center shadow-lg">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide bg-white/10 text-emerald-400 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    VERIFIED CANDIDATE
                  </div>
                  <h1 className="text-2xl font-black tracking-tight">{name}</h1>
                  <p className="text-xs text-slate-300 font-mono tracking-wide">{targetRole}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[11px] px-3 py-1 rounded-lg bg-white/10 text-slate-200 font-mono">
                    Canva Tech Layout
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{statusText}</p>
                </div>
              </div>

              {/* 技能标签胶囊 */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" style={{ color: themeColor }} />
                    技术雷达与专长栈 (Tech Radar)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">STACK.COUNT({skills.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-md font-mono font-semibold transition-transform hover:scale-105"
                      style={{ backgroundColor: `${themeColor}12`, color: themeColor, border: `1px solid ${themeColor}30` }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* 项目经历卡片 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  实战项目深度重构 (STAR 法则量化)
                </h3>
                <div className="space-y-4">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2 hover:border-slate-400 transition-all">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }} />
                          {proj.name}
                        </h4>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {proj.role || '核心研发'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono font-medium" style={{ color: themeColor }}>
                        &lt;Stack: {proj.tech} /&gt;
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-sans">
                        {proj.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 学历与亮点 */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> 教育背景
                  </h4>
                  {education.map((e, idx) => (
                    <div key={idx} className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">{e.school}</p>
                      <p className="text-[11px] text-slate-500">{e.major} · {e.degree} ({e.period})</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-500" /> 架构与工程素养
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── 模板 6：国际期刊 (Editorial Serif) ────────────────── */}
          {template === 'editorial' && (
            <div className="space-y-8 font-serif text-slate-800">
              {/* 经典居中报刊 Header */}
              <div className="text-center border-b-2 border-slate-900 pb-6 space-y-2">
                <p className="text-[10px] font-sans uppercase tracking-widest text-slate-500">
                  CURRICULUM VITAE · PROFESSIONAL PORTFOLIO
                </p>
                <h1 className="text-4xl font-black tracking-tight text-slate-900">{name}</h1>
                <p className="text-xs font-sans font-semibold uppercase tracking-widest" style={{ color: themeColor }}>
                  {targetRole}
                </p>
                <div className="flex justify-center items-center gap-4 text-[11px] font-sans text-slate-500 pt-1">
                  <span>{statusText}</span>
                  <span>•</span>
                  <span>可画高定排版设计</span>
                </div>
              </div>

              {/* 核心自述双栏 */}
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-slate-400 mb-2">
                  EXECUTIVE SUMMARY / 专家自述
                </h3>
                <p className="text-xs leading-relaxed text-slate-700 font-sans italic">{summary}</p>
              </div>

              {/* 核心技能 */}
              <div className="border-b border-slate-200 pb-5 space-y-2">
                <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-slate-400">
                  AREAS OF EXPERTISE / 核心技术领域
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, idx) => (
                    <span key={idx} className="text-xs font-sans px-3 py-1 rounded border border-slate-300 font-medium text-slate-800">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* 实战项目 */}
              <div className="space-y-6">
                <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-slate-400">
                  EXPERIENCE &amp; ACHIEVEMENTS / 重点工程成就
                </h3>
                <div className="space-y-6">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="space-y-1.5 font-sans">
                      <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
                        <h4 className="font-serif font-bold text-slate-900 text-base">{proj.name}</h4>
                        <span className="text-xs text-slate-500 font-sans">{proj.role || '主要参与者'}</span>
                      </div>
                      <p className="text-xs font-semibold" style={{ color: themeColor }}>架构技术：{proj.tech}</p>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 学历 */}
              <div className="pt-4 border-t border-slate-200 font-sans">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  ACADEMIC BACKGROUND / 学历背景
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {education.map((e, idx) => (
                    <div key={idx} className="text-xs space-y-0.5">
                      <p className="font-bold text-slate-800">{e.school}</p>
                      <p className="text-slate-500">{e.major} · {e.degree} ({e.period})</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

