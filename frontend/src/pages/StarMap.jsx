import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Network, RefreshCw, ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import http from '@/api/http'
import useStore from '@/store/useStore'
import { cn } from '@/lib/utils'

// ── 力导向图模拟 ────────────────────────────────────────────────────────────
class ForceSimulation {
  constructor(nodes, links, width, height) {
    this.nodes = nodes.map((n) => ({ ...n, vx: 0, vy: 0 }))
    this.links = links
    this.width = width
    this.height = height
    this.alpha = 1
    this.alphaDecay = 0.02
    this.velocityDecay = 0.4
  }

  tick() {
    if (this.alpha < 0.001) return false
    this.alpha *= 1 - this.alphaDecay

    // Repulsion between all node pairs
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i]
        const b = this.nodes[j]
        const dx = b.x - a.x || 0.1
        const dy = b.y - a.y || 0.1
        const dist2 = dx * dx + dy * dy
        const force = (-6000 * this.alpha) / dist2
        const fx = (dx / Math.sqrt(dist2)) * force
        const fy = (dy / Math.sqrt(dist2)) * force
        a.vx -= fx
        a.vy -= fy
        b.vx += fx
        b.vy += fy
      }
    }

    // Attraction along links
    for (const link of this.links) {
      const src = this.nodes.find((n) => n.id === link.source)
      const tgt = this.nodes.find((n) => n.id === link.target)
      if (!src || !tgt) continue
      const dx = tgt.x - src.x
      const dy = tgt.y - src.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const targetDist = 160
      const force = ((dist - targetDist) / dist) * 0.08 * this.alpha
      src.vx += dx * force
      src.vy += dy * force
      tgt.vx -= dx * force
      tgt.vy -= dy * force
    }

    // Centering force
    for (const n of this.nodes) {
      n.vx += (this.width / 2 - n.x) * 0.01 * this.alpha
      n.vy += (this.height / 2 - n.y) * 0.01 * this.alpha
    }

    // Apply velocity
    for (const n of this.nodes) {
      if (n.fixed) continue
      n.vx *= this.velocityDecay
      n.vy *= this.velocityDecay
      n.x += n.vx
      n.y += n.vy
    }
    return true
  }
}

// ── 颜色 & 工具 ─────────────────────────────────────────────────────────────
const MASTERY_COLOR = {
  HIGH: { fill: '#10b981', glow: 'rgba(16,185,129,0.4)', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  MEDIUM: { fill: '#f59e0b', glow: 'rgba(245,158,11,0.4)', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
  LOW: { fill: '#6366f1', glow: 'rgba(99,102,241,0.4)', badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25' },
  CENTER: { fill: '#7c3aed', glow: 'rgba(124,58,237,0.5)', badge: '' },
}
const MASTERY_LABEL = { HIGH: '掌握', MEDIUM: '熟悉', LOW: '了解' }

function buildGraphFromHierarchy(hierarchy, username) {
  if (!hierarchy) return { nodes: [], links: [] }

  const centerNode = {
    id: '__center__',
    label: username || '我',
    mastery: 'CENTER',
    questionCount: 0,
    radius: 36,
    isCenter: true,
  }

  const nodes = [centerNode]
  const links = []

  // Traverse hierarchy children: 学科分类 → topic children
  const subjects = hierarchy.children?.find((c) => c.name === '学科分类')
  const status = hierarchy.children?.find((c) => c.name === '学习状态')

  const weakTopic = status?.children?.find((c) => c.name === '薄弱领域')?.children?.[0]?.name
  const strongTopic = status?.children?.find((c) => c.name === '优势领域')?.children?.[0]?.name

  if (subjects?.children) {
    subjects.children.forEach((topic) => {
      const count = topic.value || topic.children?.reduce((s, c) => s + (c.value || 1), 0) || 1
      let mastery = 'LOW'
      if (topic.name === strongTopic) mastery = 'HIGH'
      else if (count >= 3) mastery = 'MEDIUM'

      nodes.push({
        id: topic.name,
        label: topic.name,
        mastery,
        questionCount: count,
        radius: Math.max(22, Math.min(44, 18 + count * 3)),
      })
      links.push({ source: '__center__', target: topic.name, weight: 1 })
    })
  }

  // Cross-links between HIGH/MEDIUM topics
  const highNodes = nodes.filter((n) => !n.isCenter && (n.mastery === 'HIGH' || n.mastery === 'MEDIUM'))
  for (let i = 0; i < Math.min(highNodes.length, 4); i++) {
    for (let j = i + 1; j < Math.min(highNodes.length, 4); j++) {
      links.push({ source: highNodes[i].id, target: highNodes[j].id, weight: 0.4 })
    }
  }

  return { nodes, links }
}

function buildGraph(topics, username) {
  if (!topics || topics.length === 0) return { nodes: [], links: [] }

  const centerNode = {
    id: '__center__',
    label: username || '我',
    mastery: 'CENTER',
    questionCount: 0,
    radius: 36,
    isCenter: true,
  }

  const topicNodes = topics.map((t) => ({
    id: t.topic,
    label: t.topic,
    mastery: t.masteryLevel || 'LOW',
    questionCount: t.questionCount || 0,
    radius: Math.max(20, Math.min(40, 18 + (t.questionCount || 0) * 2)),
  }))

  // Build cross-links between topics that share mastery level
  const links = []
  topicNodes.forEach((n) => links.push({ source: '__center__', target: n.id, weight: 1 }))

  // Link topics with >= MEDIUM mastery to each other (up to 3 cross-links)
  const highNodes = topicNodes.filter((n) => n.mastery === 'HIGH' || n.mastery === 'MEDIUM')
  for (let i = 0; i < Math.min(highNodes.length, 4); i++) {
    for (let j = i + 1; j < Math.min(highNodes.length, 4); j++) {
      links.push({ source: highNodes[i].id, target: highNodes[j].id, weight: 0.4 })
    }
  }

  return { nodes: [centerNode, ...topicNodes], links }
}

// ── Canvas 渲染 ──────────────────────────────────────────────────────────────
function drawStarfield(ctx, w, h) {
  for (let i = 0; i < 120; i++) {
    const x = (Math.sin(i * 137.508) * 0.5 + 0.5) * w
    const y = (Math.cos(i * 97.3) * 0.5 + 0.5) * h
    const r = Math.random() * 1.2 + 0.3
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(180,180,255,${0.1 + Math.random() * 0.25})`
    ctx.fill()
  }
}

function drawGraph(ctx, nodes, links, hoveredId, transform) {
  const { dx, dy, scale } = transform
  ctx.save()
  ctx.translate(dx, dy)
  ctx.scale(scale, scale)

  // Draw links
  for (const link of links) {
    const src = nodes.find((n) => n.id === link.source)
    const tgt = nodes.find((n) => n.id === link.target)
    if (!src || !tgt) continue
    ctx.beginPath()
    ctx.moveTo(src.x, src.y)
    ctx.lineTo(tgt.x, tgt.y)
    const isHighlighted = hoveredId && (src.id === hoveredId || tgt.id === hoveredId)
    ctx.strokeStyle = isHighlighted
      ? 'rgba(124,58,237,0.7)'
      : `rgba(150,150,200,${0.15 + link.weight * 0.2})`
    ctx.lineWidth = isHighlighted ? 2 : 1
    if (!isHighlighted) {
      ctx.setLineDash([4, 8])
    } else {
      ctx.setLineDash([])
    }
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Draw nodes
  for (const node of nodes) {
    const col = MASTERY_COLOR[node.mastery] || MASTERY_COLOR.LOW
    const isHovered = node.id === hoveredId
    const r = node.radius

    // Glow
    if (isHovered || node.isCenter) {
      const grd = ctx.createRadialGradient(node.x, node.y, r * 0.5, node.x, node.y, r * 2.2)
      grd.addColorStop(0, col.glow)
      grd.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(node.x, node.y, r * 2.2, 0, Math.PI * 2)
      ctx.fillStyle = grd
      ctx.fill()
    }

    // Circle fill
    const grad = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r)
    grad.addColorStop(0, col.fill + 'ee')
    grad.addColorStop(1, col.fill + '99')
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.shadowColor = col.fill
    ctx.shadowBlur = isHovered ? 20 : 8
    ctx.fill()
    ctx.shadowBlur = 0

    // Border
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
    ctx.strokeStyle = isHovered ? '#fff' : col.fill + 'cc'
    ctx.lineWidth = isHovered ? 2.5 : 1.5
    ctx.stroke()

    // Label
    ctx.font = node.isCenter ? 'bold 13px Inter,sans-serif' : `${Math.max(10, Math.min(12, r * 0.55))}px Inter,sans-serif`
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // Truncate long labels
    const maxChars = Math.floor(r / 5.5) + 2
    const label = node.label.length > maxChars ? node.label.slice(0, maxChars) + '…' : node.label
    ctx.fillText(label, node.x, node.y)

    // Question count badge (small dot below)
    if (!node.isCenter && node.questionCount > 0) {
      const bx = node.x + r * 0.65
      const by = node.y - r * 0.65
      ctx.beginPath()
      ctx.arc(bx, by, 9, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(15,15,30,0.9)'
      ctx.fill()
      ctx.font = 'bold 8px Inter,sans-serif'
      ctx.fillStyle = '#ddd'
      ctx.fillText(node.questionCount, bx, by + 0.5)
    }
  }

  ctx.restore()
}

// ── 主组件 ───────────────────────────────────────────────────────────────────
export default function StarMap() {
  const user = useStore((s) => s.user)
  const canvasRef = useRef(null)
  const simRef = useRef(null)
  const rafRef = useRef(null)
  const nodesRef = useRef([])
  const linksRef = useRef([])
  const transformRef = useRef({ dx: 0, dy: 0, scale: 1 })
  const dragRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hoveredNode, setHoveredNode] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [simDone, setSimDone] = useState(false)

  // ── Load data ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setSelectedNode(null)
    setHoveredNode(null)
    try {
      const res = await http.get('/profile/hierarchy')
      if (res.data?.success) {
        setProfile(res.data.data)
      } else {
        setError(res.data?.message || '加载失败')
      }
    } catch {
      setError('暂无学习数据，完成对话后自动生成星图')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Init simulation when data ready ───────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || loading) return
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    canvas.width = w
    canvas.height = h

    const { nodes, links } = buildGraphFromHierarchy(profile, user?.username)

    // Scatter initial positions
    nodes.forEach((n) => {
      if (n.isCenter) { n.x = w / 2; n.y = h / 2 }
      else { n.x = w / 2 + (Math.random() - 0.5) * 300; n.y = h / 2 + (Math.random() - 0.5) * 300 }
    })

    nodesRef.current = nodes
    linksRef.current = links
    transformRef.current = { dx: 0, dy: 0, scale: 1 }
    setSimDone(false)

    simRef.current = new ForceSimulation(nodes, links, w, h)

    const ctx = canvas.getContext('2d')
    drawStarfield(ctx, w, h)

    const animate = () => {
      ctx.clearRect(0, 0, w, h)
      drawStarfield(ctx, w, h)

      const running = simRef.current.tick()
      // Sync positions back to our ref nodes
      simRef.current.nodes.forEach((sn) => {
        const rn = nodesRef.current.find((n) => n.id === sn.id)
        if (rn) { rn.x = sn.x; rn.y = sn.y }
      })

      drawGraph(ctx, nodesRef.current, linksRef.current, hoveredNode, transformRef.current)

      if (running) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setSimDone(true)
      }
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, loading])

  // ── Re-render on hover change without resetting simulation ─────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !simDone) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawStarfield(ctx, canvas.width, canvas.height)
    drawGraph(ctx, nodesRef.current, linksRef.current, hoveredNode, transformRef.current)
  }, [hoveredNode, simDone])

  // ── Hit-test helper ────────────────────────────────────────────────────────
  const hitTest = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const { dx, dy, scale } = transformRef.current
    const cx = (clientX - rect.left - dx) / scale
    const cy = (clientY - rect.top - dy) / scale
    return nodesRef.current.find((n) => {
      const d = Math.sqrt((n.x - cx) ** 2 + (n.y - cy) ** 2)
      return d <= n.radius + 4
    }) || null
  }, [])

  // ── Mouse events ───────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e) => {
    if (dragRef.current) {
      if (dragRef.current.nodeId) {
        // Drag node
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const { dx, dy, scale } = transformRef.current
        const nx = (e.clientX - rect.left - dx) / scale
        const ny = (e.clientY - rect.top - dy) / scale
        const simNode = simRef.current?.nodes.find((n) => n.id === dragRef.current.nodeId)
        if (simNode) { simNode.x = nx; simNode.y = ny; simNode.vx = 0; simNode.vy = 0; simNode.fixed = true }
        const rn = nodesRef.current.find((n) => n.id === dragRef.current.nodeId)
        if (rn) { rn.x = nx; rn.y = ny }
        if (simDone) {
          const ctx = canvas.getContext('2d')
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          drawStarfield(ctx, canvas.width, canvas.height)
          drawGraph(ctx, nodesRef.current, linksRef.current, hoveredNode, transformRef.current)
        }
      } else {
        // Pan canvas
        transformRef.current.dx += e.clientX - dragRef.current.x
        transformRef.current.dy += e.clientY - dragRef.current.y
        dragRef.current.x = e.clientX
        dragRef.current.y = e.clientY
        if (simDone) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          drawStarfield(ctx, canvas.width, canvas.height)
          drawGraph(ctx, nodesRef.current, linksRef.current, hoveredNode, transformRef.current)
        }
      }
      return
    }
    const hit = hitTest(e.clientX, e.clientY)
    setHoveredNode(hit?.id || null)
    canvasRef.current.style.cursor = hit ? 'pointer' : 'grab'
  }, [hitTest, hoveredNode, simDone])

  const onMouseDown = useCallback((e) => {
    const hit = hitTest(e.clientX, e.clientY)
    if (hit) {
      dragRef.current = { nodeId: hit.id }
    } else {
      dragRef.current = { x: e.clientX, y: e.clientY }
    }
  }, [hitTest])

  const onMouseUp = useCallback((e) => {
    if (dragRef.current?.nodeId) {
      const simNode = simRef.current?.nodes.find((n) => n.id === dragRef.current.nodeId)
      if (simNode) simNode.fixed = false
    }
    dragRef.current = null
  }, [])

  const onClick = useCallback((e) => {
    const hit = hitTest(e.clientX, e.clientY)
    if (hit && !hit.isCenter) {
      setSelectedNode(hit)
    } else {
      setSelectedNode(null)
    }
  }, [hitTest])

  const onWheel = useCallback((e) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const { dx, dy, scale } = transformRef.current
    const newScale = Math.max(0.3, Math.min(3, scale * factor))
    transformRef.current = {
      dx: mx - (mx - dx) * (newScale / scale),
      dy: my - (my - dy) * (newScale / scale),
      scale: newScale,
    }
    if (simDone) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawStarfield(ctx, canvas.width, canvas.height)
      drawGraph(ctx, nodesRef.current, linksRef.current, hoveredNode, transformRef.current)
    }
  }, [simDone, hoveredNode])

  const zoom = (delta) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { dx, dy, scale } = transformRef.current
    const newScale = Math.max(0.3, Math.min(3, scale * delta))
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    transformRef.current = {
      dx: cx - (cx - dx) * (newScale / scale),
      dy: cy - (cy - dy) * (newScale / scale),
      scale: newScale,
    }
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawStarfield(ctx, canvas.width, canvas.height)
    drawGraph(ctx, nodesRef.current, linksRef.current, hoveredNode, transformRef.current)
  }

  const resetView = () => {
    transformRef.current = { dx: 0, dy: 0, scale: 1 }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawStarfield(ctx, canvas.width, canvas.height)
    drawGraph(ctx, nodesRef.current, linksRef.current, hoveredNode, transformRef.current)
  }

  // Count topic nodes (exclude center)
  const nodeCount = nodesRef.current.filter((n) => !n.isCenter).length

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Network className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">知识星图</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {nodeCount > 0 ? `已覆盖 ${nodeCount} 个知识节点` : '开始对话后自动构建'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => zoom(1.2)} className="h-8 w-8 p-0">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => zoom(0.8)} className="h-8 w-8 p-0">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={resetView} className="h-8 w-8 p-0">
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button size="sm" variant="outline" onClick={load} className="gap-1.5 h-8 text-xs">
            <RefreshCw className="w-3 h-3" />刷新
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="relative flex-1 min-h-0 bg-[#080816]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full"
              />
              <p className="text-sm">正在加载星图数据…</p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center">
              <Network className="w-8 h-8 opacity-30" />
            </div>
            <p className="text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={load} className="gap-2">
              <RefreshCw className="w-3.5 h-3.5" />重试
            </Button>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              onMouseMove={onMouseMove}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onClick={onClick}
              onWheel={onWheel}
              style={{ cursor: 'grab' }}
            />

            {/* Legend */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 bg-black/50 backdrop-blur-sm rounded-xl p-3 border border-white/5">
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">熟练度</p>
              {Object.entries(MASTERY_LABEL).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: MASTERY_COLOR[k].fill }} />
                  <span className="text-[11px] text-white/70">{v}</span>
                </div>
              ))}
            </div>

            {/* Help tip */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-[11px] text-white/30">
              <Info className="w-3 h-3" />
              拖拽节点 / 滚轮缩放 / 点击查看详情
            </div>

            {/* Node detail panel */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  key={selectedNode.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-4 right-4 w-64 bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 p-5 shadow-2xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg"
                      style={{ background: MASTERY_COLOR[selectedNode.mastery]?.fill }}
                    >
                      {selectedNode.label[0]}
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
                    >×</button>
                  </div>

                  <h3 className="text-white font-bold text-sm leading-tight mb-1">{selectedNode.label}</h3>
                  <p className="text-white/40 text-xs mb-4">知识节点详情</p>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/50">熟练度</span>
                      <Badge variant="outline" className={cn('text-[10px] px-2 py-0 border', MASTERY_COLOR[selectedNode.mastery]?.badge)}>
                        {MASTERY_LABEL[selectedNode.mastery] || '了解'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/50">交互次数</span>
                      <span className="text-xs text-white font-semibold">{selectedNode.questionCount} 次</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: MASTERY_COLOR[selectedNode.mastery]?.fill }}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${selectedNode.mastery === 'HIGH' ? 90 : selectedNode.mastery === 'MEDIUM' ? 55 : 20}%`,
                        }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}
