import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Maximize,
  Minimize,
  RefreshCw,
  ArrowLeft,
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  ChevronDown,
  Clock,
  Sparkles,
  ShieldAlert,
  BarChart3,
  Radar as RadarIcon,
  Layers,
  GraduationCap
} from 'lucide-react'
import EChart from '@/components/charts/EChart'
import { getScreenClasses, getScreenData } from '@/api/analytics'
import useStore from '@/store/useStore'
import { cn } from '@/lib/utils'

// ── 宽幅沉浸面板容器 ───────────────────────────────────────────────────────────
function SpaciousPanel({ title, subtitle, icon: Icon, extra, children, className }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800/80 bg-[#0e1424]/90 backdrop-blur-md flex flex-col p-5 shadow-sm hover:border-slate-700/80 transition-all',
        className
      )}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-100 tracking-wide flex items-center gap-2">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {extra && <div>{extra}</div>}
      </div>

      {/* 内容主体 */}
      <div className="flex-1 min-h-0 relative flex flex-col justify-center">
        {children}
      </div>
    </div>
  )
}

// ── 简约 KPI 指标卡片 ──────────────────────────────────────────────────────────
function KpiStatCard({ title, value, unit, hint, icon: Icon, colorClass, bgBadgeClass }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0e1424]/90 backdrop-blur-md p-4 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-xs font-medium text-slate-400 mb-1">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <span className={cn('text-2xl lg:text-3xl font-bold font-mono tracking-tight', colorClass)}>
            {value}
          </span>
          {unit && <span className="text-xs text-slate-400 font-normal">{unit}</span>}
        </div>
        {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
      </div>

      <div className={cn('p-2.5 rounded-xl border border-white/5', bgBadgeClass, colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}

// ── 主大屏页面 ─────────────────────────────────────────────────────────────────
export default function ScreenDashboard() {
  const navigate = useNavigate()
  const { user } = useStore()

  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [timeStr, setTimeStr] = useState('')

  // Tab 切换状态
  const [subjectViewTab, setSubjectViewTab] = useState('ranking') // 'ranking' | 'trend'
  const [studentBoardTab, setStudentBoardTab] = useState('warning') // 'warning' | 'top'

  // 1. 动态时钟
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const ss = String(now.getSeconds()).padStart(2, '0')
      const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const w = weeks[now.getDay()]
      setTimeStr(`${y}-${m}-${d} ${hh}:${mm}:${ss} ${w}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // 2. 加载班级列表
  useEffect(() => {
    loadClassList()
  }, [])

  const loadClassList = async () => {
    try {
      const res = await getScreenClasses()
      if (res.data?.success) {
        const list = res.data.data.classes || []
        setClasses(list)
        if (list.length > 0 && !selectedClassId) {
          setSelectedClassId(list[0].id)
        }
      }
    } catch (e) {
      console.error('加载班级列表失败', e)
    }
  }

  // 3. 加载学情数据
  const loadScreen = async (clsId, crsId) => {
    setLoading(true)
    try {
      const res = await getScreenData(clsId, crsId)
      if (res.data?.success) {
        setData(res.data.data)
      }
    } catch (e) {
      console.error('加载学情数据失败', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (selectedClassId) {
      loadScreen(selectedClassId, selectedCourseId)
    }
  }, [selectedClassId, selectedCourseId])

  const handleRefresh = () => {
    setRefreshing(true)
    loadScreen(selectedClassId, selectedCourseId)
  }

  // 全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const currentClassCourses = useMemo(() => {
    const found = classes.find((c) => String(c.id) === String(selectedClassId))
    return found?.courses || []
  }, [classes, selectedClassId])

  // ── 图表配置 options（大幅扩大尺寸，杜绝拥挤与重叠）───────────────────────────

  // 【图表 1: 成绩等级全景玫瑰图】超宽展现，右侧纵向图例带充裕间距，零遮挡
  const gradeTierRoseOption = useMemo(() => {
    if (!data?.gradeTierRose) return null
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: <span style="font-weight:bold;color:#38bdf8;">{c}人</span> ({d}%)',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 13 }
      },
      legend: {
        orient: 'vertical',
        right: '6%',
        top: 'middle',
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16,
        textStyle: { color: '#cbd5e1', fontSize: 13 },
        formatter: (name) => {
          const item = data.gradeTierRose.find((i) => i.name === name)
          return item ? `${name.padEnd(12, ' ')}  ${item.value}人 (${item.percent}%)` : name
        }
      },
      series: [
        {
          name: '成绩等级分布',
          type: 'pie',
          radius: ['24%', '78%'],
          center: ['35%', '50%'],
          roseType: 'radius',
          itemStyle: {
            borderRadius: 6,
            borderColor: '#0e1424',
            borderWidth: 2
          },
          label: { show: false },
          labelLine: { show: false },
          data: data.gradeTierRose.map((item) => ({
            value: item.value,
            name: item.name,
            itemStyle: { color: item.color }
          }))
        }
      ]
    }
  }, [data?.gradeTierRose])

  // 【图表 2: 及格达标大环图】
  const passRateDonutOption = useMemo(() => {
    if (!data?.passRateDonut) return null
    const passItem = data.passRateDonut[0] || {}
    const passRate = passItem.percent || 0
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}人 ({d}%)',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 13 }
      },
      title: {
        text: `${passRate}%`,
        subtext: '学科及格率',
        left: 'center',
        top: '36%',
        textStyle: {
          color: '#34d399',
          fontSize: 26,
          fontWeight: 'bold',
          fontFamily: 'monospace'
        },
        subtextStyle: {
          color: '#94a3b8',
          fontSize: 12
        }
      },
      legend: {
        bottom: '6%',
        left: 'center',
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16,
        textStyle: { color: '#cbd5e1', fontSize: 12 }
      },
      series: [
        {
          name: '及格达标状态',
          type: 'pie',
          radius: ['54%', '78%'],
          center: ['50%', '46%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#0e1424',
            borderWidth: 2
          },
          label: { show: false },
          data: data.passRateDonut.map((d) => ({
            value: d.value,
            name: d.name,
            itemStyle: { color: d.color }
          }))
        }
      ]
    }
  }, [data?.passRateDonut])

  // 【图表 3: 六维学情综合雷达图】收敛半径至 50%，为维度文字预留宽敞空间，绝不截断
  const radarOption = useMemo(() => {
    if (!data?.radarCapabilities) return null
    return {
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 13 }
      },
      radar: {
        indicator: data.radarCapabilities.map((r) => ({
          name: r.indicator,
          max: r.max || 100
        })),
        center: ['50%', '50%'],
        radius: '52%',
        splitNumber: 4,
        axisName: {
          color: '#cbd5e1',
          fontSize: 12,
          fontWeight: 500
        },
        splitLine: {
          lineStyle: { color: 'rgba(148, 163, 184, 0.15)' }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(14, 20, 36, 0.5)', 'rgba(56, 189, 248, 0.04)']
          }
        },
        axisLine: {
          lineStyle: { color: 'rgba(148, 163, 184, 0.2)' }
        }
      },
      series: [
        {
          name: '班级能力画像',
          type: 'radar',
          symbolSize: 6,
          data: [
            {
              value: data.radarCapabilities.map((r) => r.value),
              name: '班级综合素养',
              itemStyle: { color: '#818cf8' },
              lineStyle: { width: 2.5, color: '#818cf8' },
              areaStyle: {
                color: 'rgba(129, 140, 248, 0.25)'
              }
            }
          ]
        }
      ]
    }
  }, [data?.radarCapabilities])

  // 【图表 4: 各学科成绩排行与极值（横向柱状图，课程名竖向排列，彻底解决X轴文字倾斜挤压问题！）】
  const subjectHorizontalBarsOption = useMemo(() => {
    if (!data?.subjectComparisonBars) return null
    // 降序排列，最高分课程在最上方
    const list = [...data.subjectComparisonBars].sort((a, b) => b.avgScore - a.avgScore)
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 12 }
      },
      legend: {
        top: '1%',
        right: '4%',
        itemWidth: 12,
        itemHeight: 10,
        textStyle: { color: '#cbd5e1', fontSize: 12 }
      },
      grid: {
        left: '2%',
        right: '8%',
        bottom: '2%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        min: 50,
        max: 100,
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 }
      },
      yAxis: {
        type: 'category',
        data: list.map((i) => i.courseName),
        inverse: true, // 均分第一名在最顶部
        axisLabel: {
          color: '#e2e8f0',
          fontSize: 12,
          formatter: (name) => (name.length > 14 ? name.slice(0, 14) + '…' : name)
        },
        axisLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [
        {
          name: '平均分',
          type: 'bar',
          barMaxWidth: 14,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: '#38bdf8'
          },
          label: {
            show: true,
            position: 'right',
            color: '#94a3b8',
            fontSize: 11,
            formatter: '{c}分'
          },
          data: list.map((i) => i.avgScore)
        },
        {
          name: '最高分',
          type: 'bar',
          barMaxWidth: 14,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: '#34d399'
          },
          data: list.map((i) => i.maxScore)
        }
      ]
    }
  }, [data?.subjectComparisonBars])

  // 【图表 5: 阶段测验走势平滑曲线】
  const trendLineOption = useMemo(() => {
    if (!data?.scoreTrendCurve) return null
    const list = data.scoreTrendCurve
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 12 }
      },
      legend: {
        top: '1%',
        right: '4%',
        itemWidth: 12,
        itemHeight: 10,
        textStyle: { color: '#cbd5e1', fontSize: 12 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '14%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: list.map((i) => i.stage),
        axisLabel: { color: '#cbd5e1', fontSize: 12 },
        axisLine: { lineStyle: { color: '#1e293b' } }
      },
      yAxis: {
        type: 'value',
        min: 50,
        max: 100,
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 }
      },
      series: [
        {
          name: '班级均分曲线',
          type: 'line',
          smooth: true,
          symbolSize: 7,
          itemStyle: { color: '#38bdf8' },
          lineStyle: { width: 3, color: '#38bdf8' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(56, 189, 248, 0.28)' },
                { offset: 1, color: 'rgba(56, 189, 248, 0.0)' }
              ]
            }
          },
          data: list.map((i) => i.avgScore)
        },
        {
          name: '最高分记录',
          type: 'line',
          smooth: true,
          symbolSize: 6,
          itemStyle: { color: '#fbbf24' },
          lineStyle: { width: 2, type: 'dashed', color: '#fbbf24' },
          data: list.map((i) => i.topScore)
        }
      ]
    }
  }, [data?.scoreTrendCurve])

  return (
    <div
      className={cn(
        'w-full h-full min-h-screen bg-[#090d16] text-slate-100 flex flex-col overflow-x-hidden overflow-y-auto custom-scrollbar select-none',
        isFullscreen ? 'fixed inset-0 z-50 p-4' : 'p-5'
      )}
    >
      {/* ── 顶部极简沉稳标题栏 ── */}
      <header className="w-full pb-4 border-b border-slate-800/80 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate('/grades')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回</span>
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base lg:text-lg font-bold text-slate-100 tracking-tight">
                {data?.classInfo?.name || '班级'} · 学科学情多维分析
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                业务真数据
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>学期: {data?.classInfo?.semester || '2025春'}</span>
              <span>•</span>
              <span>授课教师: {data?.classInfo?.teacherName || '任课教师'}</span>
              <span>•</span>
              <span className="font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {timeStr}
              </span>
            </p>
          </div>
        </div>

        {/* 右侧筛选器与控制 */}
        <div className="flex items-center gap-2.5">
          {/* 班级切换 */}
          <div className="relative">
            <select
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="appearance-none bg-[#111625] border border-slate-700/80 text-slate-200 text-xs font-medium rounded-lg pl-3 pr-7 py-2 outline-none hover:border-slate-600 cursor-pointer shadow-inner"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id} className="bg-[#0e1424] text-slate-100">
                  {cls.name} ({cls.student_count || 0}人)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* 课程筛选 */}
          {currentClassCourses.length > 0 && (
            <div className="relative">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="appearance-none bg-[#111625] border border-slate-700/80 text-slate-300 text-xs rounded-lg pl-3 pr-7 py-2 outline-none hover:border-slate-600 cursor-pointer"
              >
                <option value="" className="bg-[#0e1424] text-slate-300">
                  全学科汇总
                </option>
                {currentClassCourses.map((crs) => (
                  <option key={crs.id} value={crs.id} className="bg-[#0e1424] text-slate-100">
                    {crs.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg border border-slate-800 bg-[#111625] text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="刷新数据"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-slate-800 bg-[#111625] text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title={isFullscreen ? '退出全屏' : '全屏模式'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── 主体区域 ── */}
      <main className="flex-1 pt-5 flex flex-col gap-5 min-h-0">
        {/* KPI 核心统计行 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 flex-shrink-0">
          <KpiStatCard
            title="在册学生数"
            value={data?.kpi?.studentCount ?? 0}
            unit="人"
            hint="真实建档学生"
            icon={Users}
            colorClass="text-sky-400"
            bgBadgeClass="bg-sky-500/10"
          />
          <KpiStatCard
            title="综合平均成绩"
            value={data?.kpi?.avgScore ?? '--'}
            unit="分"
            hint="全学科成绩均值"
            icon={TrendingUp}
            colorClass="text-blue-400"
            bgBadgeClass="bg-blue-500/10"
          />
          <KpiStatCard
            title="学科及格达标率"
            value={`${data?.kpi?.passRate ?? '--'}%`}
            hint="≥60分及格比例"
            icon={CheckCircle2}
            colorClass="text-emerald-400"
            bgBadgeClass="bg-emerald-500/10"
          />
          <KpiStatCard
            title="优秀拔尖率"
            value={`${data?.kpi?.excellentRate ?? '--'}%`}
            hint="≥90分卓越比例"
            icon={Award}
            colorClass="text-indigo-400"
            bgBadgeClass="bg-indigo-500/10"
          />
          <KpiStatCard
            title="学业关注/预警"
            value={data?.kpi?.warningCount ?? 0}
            unit="人"
            hint="需针对性帮扶"
            icon={AlertTriangle}
            colorClass="text-rose-400"
            bgBadgeClass="bg-rose-500/10"
          />
          <KpiStatCard
            title="作业考评交付率"
            value={`${data?.kpi?.submissionRate ?? '--'}%`}
            hint="考评提交整体完成率"
            icon={FileCheck}
            colorClass="text-amber-400"
            bgBadgeClass="bg-amber-500/10"
          />
        </div>

        {/* ── 核心 4 大宽幅图表面板（删去拥挤冗余图表，大幅扩大留白与图表尺寸！） ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">
          {/* ════════ 第 1 块：成绩等级全景分布（南丁格尔玫瑰大图） ════════ */}
          <SpaciousPanel
            title="成绩等级全景分布 · 玫瑰图"
            subtitle="卓越 (90+) · 良好 (80-89) · 中等 (70-79) · 及格 (60-69) · 待提升 (<60)"
            icon={Sparkles}
            className="min-h-[360px]"
          >
            <EChart option={gradeTierRoseOption} loading={loading} />
          </SpaciousPanel>

          {/* ════════ 第 2 块：及格达标率与六维素养雷达（双核并列呈现） ════════ */}
          <SpaciousPanel
            title="学科达标及格率与六维学情素养"
            subtitle="Pass Rate Donut & Holistic Competency Radar"
            icon={RadarIcon}
            className="min-h-[360px]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* 及格大环形图 */}
              <div className="h-full flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-800/60 pb-3 md:pb-0 md:pr-3">
                <EChart option={passRateDonutOption} loading={loading} />
              </div>
              {/* 六维雷达图 */}
              <div className="h-full flex flex-col justify-center">
                <EChart option={radarOption} loading={loading} />
              </div>
            </div>
          </SpaciousPanel>

          {/* ════════ 第 3 块：各学科对比分析与历次趋势（支持横向条形图与走势图切换） ════════ */}
          <SpaciousPanel
            title={subjectViewTab === 'ranking' ? '各学科平均分与最高分排行' : '阶段测验与测评成长走势'}
            subtitle={
              subjectViewTab === 'ranking'
                ? 'Subject Average Scores & Highest Records'
                : 'Periodic Assessment Trend Curve'
            }
            icon={BarChart3}
            className="min-h-[360px]"
            extra={
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setSubjectViewTab('ranking')}
                  className={cn(
                    'px-3 py-1 text-xs rounded-md font-medium transition-all',
                    subjectViewTab === 'ranking'
                      ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  学科均分排行
                </button>
                <button
                  onClick={() => setSubjectViewTab('trend')}
                  className={cn(
                    'px-3 py-1 text-xs rounded-md font-medium transition-all',
                    subjectViewTab === 'trend'
                      ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  阶段测验走势
                </button>
              </div>
            }
          >
            {subjectViewTab === 'ranking' ? (
              <EChart option={subjectHorizontalBarsOption} loading={loading} />
            ) : (
              <EChart option={trendLineOption} loading={loading} />
            )}
          </SpaciousPanel>

          {/* ════════ 第 4 块：重点学生学情诊断与卓越榜单（宽敞卡片与完整辅导建议） ════════ */}
          <SpaciousPanel
            title={studentBoardTab === 'warning' ? '学业预警学生重点跟进' : '卓越学霸领航荣誉榜'}
            subtitle="Targeted Intervention Diagnostic & Honor Roll"
            icon={ShieldAlert}
            className="min-h-[360px]"
            extra={
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setStudentBoardTab('warning')}
                  className={cn(
                    'px-3 py-1 text-xs rounded-md font-medium transition-all',
                    studentBoardTab === 'warning'
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  学业预警 ({data?.warningStudents?.length || 0})
                </button>
                <button
                  onClick={() => setStudentBoardTab('top')}
                  className={cn(
                    'px-3 py-1 text-xs rounded-md font-medium transition-all',
                    studentBoardTab === 'top'
                      ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  卓越榜单 ({data?.topStudents?.length || 0})
                </button>
              </div>
            }
          >
            <div className="h-full overflow-y-auto custom-scrollbar pr-1.5 space-y-3">
              {studentBoardTab === 'warning' ? (
                data?.warningStudents && data.warningStudents.length > 0 ? (
                  data.warningStudents.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 flex flex-col gap-1.5 text-xs transition-all hover:bg-rose-950/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-rose-200 text-sm">{item.username}</span>
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-medium border border-rose-500/30">
                            {item.riskLevel}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-rose-400 text-sm">{item.avgScore}分</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>薄弱学科: <strong className="text-slate-200">{item.weakSubject}</strong></span>
                        {item.tags?.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 text-[11px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-300/80 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 mt-0.5">
                        💡 <strong>辅导建议:</strong> {item.suggestion}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">
                    暂无学业预警学生，班级整体表现平稳达标
                  </div>
                )
              ) : data?.topStudents && data.topStudents.length > 0 ? (
                data.topStudents.map((top) => (
                  <div
                    key={top.rank}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-sm',
                          top.rank === 1
                            ? 'bg-amber-400 text-slate-950 shadow-amber-400/20'
                            : top.rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : top.rank === 3
                            ? 'bg-amber-600 text-slate-100'
                            : 'bg-slate-800 text-slate-400'
                        )}
                      >
                        {top.rank}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                          {top.username}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                            {top.badge}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">累计打卡 {top.streakDays} 天</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sky-400 font-bold font-mono text-base">{top.avgScore}分</p>
                      <p className="text-xs text-slate-400">GPA {top.gpa}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  暂无榜单数据
                </div>
              )}
            </div>
          </SpaciousPanel>
        </div>
      </main>
    </div>
  )
}
