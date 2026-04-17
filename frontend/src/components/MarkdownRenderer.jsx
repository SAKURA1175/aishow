import { useEffect, useRef } from 'react'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { cn } from '@/lib/utils'

// Configure marked with highlight.js
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true,
})

export default function MarkdownRenderer({ content, className, streaming = false }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      // Re-run highlight on any un-highlighted code blocks
      ref.current.querySelectorAll('pre code:not(.hljs)').forEach((el) => {
        hljs.highlightElement(el)
      })
    }
  }, [content])

  let thinkContent = ''
  let mainContent = content || ''
  let isThinkingOpen = false

  const thinkMatch = mainContent.match(/<think>([\s\S]*?)<\/think>/)
  if (thinkMatch) {
    thinkContent = thinkMatch[1].trim()
    mainContent = mainContent.replace(/<think>[\s\S]*?<\/think>/, '').trim()
  } else {
    const unclosedThinkMatch = mainContent.match(/<think>([\s\S]*)$/)
    if (unclosedThinkMatch) {
      thinkContent = unclosedThinkMatch[1].trim()
      mainContent = '' // 全都在思考中
      isThinkingOpen = true // 正在思考时保持展开
    }
  }

  const html = marked.parse(mainContent)

  return (
    <div className="flex flex-col w-full">
      {thinkContent && (
        <details className="group mb-4 w-full" open={isThinkingOpen || undefined}>
          <summary className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground/80 hover:text-primary transition-colors text-xs font-medium py-1.5 px-3 bg-muted/30 rounded-lg border border-border/40 w-fit">
            <span className="flex w-3 h-3 items-center justify-center">
              <svg className="w-2.5 h-2.5 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[13px]">🧠</span>
              深度思考过程
              {streaming && !thinkMatch && (
                <span className="flex w-3 ml-0.5 text-primary">
                  <span className="animate-[pulse_1.5s_ease-in-out_infinite]">.</span>
                  <span className="animate-[pulse_1.5s_ease-in-out_0.2s_infinite]">.</span>
                  <span className="animate-[pulse_1.5s_ease-in-out_0.4s_infinite]">.</span>
                </span>
              )}
            </span>
          </summary>
          <div className="mt-2 text-[13px] text-muted-foreground/70 border-l-2 border-primary/30 pl-3 py-1 mb-2 whitespace-pre-wrap leading-relaxed italic bg-muted/10 rounded-r-md">
            {thinkContent}
          </div>
        </details>
      )}
      
      {mainContent && (
        <div
          ref={ref}
          className={cn(
            'markdown-body prose-sm max-w-none',
            streaming && !thinkContent && 'after:content-["▋"] after:animate-pulse after:text-primary after:ml-0.5',
            className
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  )
}
