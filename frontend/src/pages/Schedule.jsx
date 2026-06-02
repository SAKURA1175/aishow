import { useState, useEffect } from 'react'
import { Calendar, CheckSquare, Plus, Clock, Circle, CheckCircle2, MoreHorizontal } from 'lucide-react'
import { getTodos, createTodo, toggleTodo, deleteTodo } from '@/api/modules'
import { motion } from 'framer-motion'

export default function Schedule() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')

  useEffect(() => { loadTodos() }, [])

  const loadTodos = async () => {
    try {
      const res = await getTodos()
      setTodos(res.data?.data?.todos || [])
    } catch {}
    setLoading(false)
  }

  const handleAdd = async (e) => {
    if (e.key === 'Enter' && newTask.trim()) {
      try {
        await createTodo({ title: newTask.trim() })
        setNewTask('')
        loadTodos()
      } catch {}
    }
  }

  const handleToggle = async (id) => {
    try {
      await toggleTodo(id)
      loadTodos()
    } catch {}
  }

  const handleDelete = async (id) => {
    try {
      await deleteTodo(id)
      loadTodos()
    } catch {}
  }

  const pending = todos.filter(t => t.status === 'pending')
  const done = todos.filter(t => t.status === 'done')

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">日程与待办</h1>
            <p className="text-xs text-muted-foreground">规划你的学习任务</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
            <Plus className="w-5 h-5 text-pink-500" />
            <input 
              type="text" 
              placeholder="添加新待办，按回车保存..." 
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={handleAdd}
              className="flex-1 bg-transparent border-none focus:outline-none text-base"
            />
          </div>

          {loading ? <p className="text-center text-muted-foreground py-4">加载中...</p> : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4" /> 待处理 ({pending.length})
                </h3>
                {pending.length === 0 ? <p className="text-xs text-muted-foreground/50 py-2">没有待处理的任务</p> : 
                 <div className="space-y-2">
                   {pending.map(t => (
                     <motion.div layout key={t.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 group border border-transparent hover:border-border/50 transition-all">
                       <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleToggle(t.id)}>
                         <Circle className="w-5 h-5 text-muted-foreground hover:text-pink-500 transition-colors" />
                         <span className="text-sm">{t.title}</span>
                       </div>
                       <button onClick={() => handleDelete(t.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 transition-all">
                         <MoreHorizontal className="w-4 h-4" />
                       </button>
                     </motion.div>
                   ))}
                 </div>
                }
              </div>

              {done.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                    <CheckSquare className="w-4 h-4" /> 已完成 ({done.length})
                  </h3>
                  <div className="space-y-2 opacity-60">
                    {done.map(t => (
                      <motion.div layout key={t.id} className="flex items-center justify-between p-3 rounded-lg">
                        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleToggle(t.id)}>
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span className="text-sm line-through text-muted-foreground">{t.title}</span>
                        </div>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-all">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
