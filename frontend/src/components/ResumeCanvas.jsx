import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { useEffect, useRef } from 'react'

/**
 * 简历画板组件
 * - persistenceKey 确保每个简历有独立画板状态（存储在 localStorage）
 * - 支持标注模式 + 自由画板 + 选择题注释
 */
export default function ResumeCanvas({ resumeId }) {
  const editorRef = useRef(null)

  return (
    <div className="w-full h-full relative">
      {/* 工具提示条 */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10
                      bg-background/80 backdrop-blur border border-border
                      rounded-full px-4 py-1.5 text-xs text-muted-foreground
                      pointer-events-none select-none">
        📌 在画板上标注简历要点、画思维导图，或做结构草稿
      </div>

      <Tldraw
        persistenceKey={`resume-canvas-${resumeId}`}
        onMount={(editor) => {
          editorRef.current = editor
          // 设置暗色主题跟随页面
          const isDark = document.documentElement.classList.contains('dark')
          editor.user.updateUserPreferences({ colorScheme: isDark ? 'dark' : 'light' })
        }}
      />
    </div>
  )
}
