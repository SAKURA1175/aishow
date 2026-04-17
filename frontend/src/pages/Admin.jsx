import { useState, useEffect } from 'react'
import { Settings, Users, FileText, RefreshCw, Shield, Server, Database, BrainCircuit } from 'lucide-react'
import { motion } from 'framer-motion'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { listDocuments } from '@/api/document'
import { listSessions } from '@/api/chat'
import SpotlightCard from '@/components/animations/SpotlightCard'
import { cn } from '@/lib/utils'

function StatCard({ icon: Icon, label, value, loading, color, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <SpotlightCard className="h-full">
        <CardContent className="p-5 flex items-start gap-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner', color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground/80 mb-1">{label}</p>
            <p className="text-2xl font-bold tracking-tight">
              {loading ? (
                <span className="inline-block w-8 h-8 bg-muted/50 rounded animate-pulse" />
              ) : (
                value ?? '-'
              )}
            </p>
          </div>
        </CardContent>
      </SpotlightCard>
    </motion.div>
  )
}

export default function Admin() {
  const [docCount, setDocCount] = useState(null)
  const [sessionCount, setSessionCount] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [docsRes, sessRes] = await Promise.allSettled([listDocuments(), listSessions()])
      if (docsRes.status === 'fulfilled' && docsRes.value.data?.success) {
        setDocCount(docsRes.value.data.data?.length ?? 0)
      }
      if (sessRes.status === 'fulfilled' && sessRes.value.data?.success) {
        setSessionCount(sessRes.value.data.data?.length ?? 0)
      }
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="flex flex-col h-full overflow-auto bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">管理后台</h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium">教师与系统管理员控制中心</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={load} className="gap-2 h-9 shadow-sm">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          {loading ? '刷新中' : '刷新数据'}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              icon={FileText} 
              label="全站文档总数" 
              value={docCount} 
              loading={loading} 
              color="bg-blue-500/20 text-blue-500" 
              index={0} 
            />
            <StatCard 
              icon={Users} 
              label="我的对话数量" 
              value={sessionCount} 
              loading={loading} 
              color="bg-purple-500/20 text-purple-500" 
              index={1} 
            />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <SpotlightCard className="h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Settings className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground/80 mb-1">服务状态</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <p className="text-sm font-bold tracking-tight text-emerald-500">所有服务正常运行</p>
                    </div>
                  </div>
                </CardContent>
              </SpotlightCard>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <SpotlightCard className="h-full border-primary/20 bg-primary/5">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    权限与操作
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-background/50 rounded-xl p-4 border border-border/40">
                    <h4 className="text-sm font-semibold mb-2">文档库管理</h4>
                    <p className="text-xs text-muted-foreground mb-4">上传、删除、管理系统级知识库文档。文档将用于增强 AI 检索能力。</p>
                    <a
                      href="/documents"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      前往文档库
                    </a>
                  </div>
                </CardContent>
              </SpotlightCard>
            </motion.div>

            {/* System Info */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <SpotlightCard className="h-full">
                <CardHeader className="pb-4 border-b border-border/40">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-400" />
                    系统架构信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Server className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground/90">核心后端 (Spring Boot 3.3)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">运行于端口 8090，提供 RESTful API 与 SSE 流式响应接口。</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BrainCircuit className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground/90">AI 引擎 (Spring AI)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">基于 OpenAI 兼容协议接入，支持 Function Calling 与大模型流式输出。</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Database className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground/90">存储策略 (双轨)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">首选阿里云 OSS；若未配置则自动降级使用服务器本地 ~/study-ai-uploads 目录。</p>
                    </div>
                  </div>
                </CardContent>
              </SpotlightCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

