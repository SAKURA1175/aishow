import { useEffect, useRef, useState, useCallback } from 'react'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import katex from 'katex'
import 'katex/dist/katex.min.css'
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

/** 渲染 LaTeX 数学公式：先处理块级 $$，再处理行内 $ */
function renderMath(text) {
  // 块级公式 $$...$$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    try {
      return '<span class="math-block">' + katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false }) + '</span>'
    } catch {
      return `<span class="math-block text-red-500 text-xs">LaTeX error: ${expr}</span>`
    }
  })
  // 行内公式 $...$（排除 $$ 已处理的情况）
  text = text.replace(/\$([^\n$]+?)\$/g, (_, expr) => {
    try {
      return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return `<span class="text-red-500 text-xs">LaTeX error: ${expr}</span>`
    }
  })
  return text
}

/** 复制按钮组件 */
function CopyButton({ text, className = '', label = '复制' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-all',
        'text-muted-foreground hover:text-foreground hover:bg-muted/60',
        copied && 'text-emerald-500 hover:text-emerald-500',
        className
      )}
      title={copied ? '已复制' : label}
    >
      {copied ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      )}
      {copied ? '已复制' : label}
    </button>
  )
}

export default function MarkdownRenderer({ content, className, streaming = false }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      // Re-run highlight on any un-highlighted code blocks
      ref.current.querySelectorAll('pre code:not(.hljs)').forEach((el) => {
        hljs.highlightElement(el)
      })
      // Inject copy buttons into code blocks
      ref.current.querySelectorAll('pre').forEach((pre) => {
        if (pre.querySelector('.code-copy-btn')) return // already has button
        const code = pre.querySelector('code')
        if (!code) return
        const btn = document.createElement('button')
        btn.className = 'code-copy-btn'
        btn.textContent = '复制'
        btn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(code.textContent || '')
          } catch {
            const textarea = document.createElement('textarea')
            textarea.value = code.textContent || ''
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
          }
          btn.textContent = '已复制 ✓'
          setTimeout(() => { btn.textContent = '复制' }, 2000)
        })
        pre.style.position = 'relative'
        pre.appendChild(btn)
      })
    }
  }, [content])

  let thinkContent = ''
  let mainContent = content || ''
  
  // 预处理 Gemma 的原生思考 token
  mainContent = mainContent.replace(/<\|channel>thought\n?(Thinking Process:)?/i, '<think>\n')
  mainContent = mainContent.replace(/<channel\|>/, '\n</think>\n\n')

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

  // 先渲染数学公式（在 marked 之前），再 markdown parse
  const mathProcessed = renderMath(mainContent)
  const html = marked.parse(mathProcessed)

  // 思考过程也渲染为 Markdown（更易读）
  const thinkHtml = thinkContent ? marked.parse(renderMath(thinkContent)) : ''

  // 提取纯文本用于复制
  const plainText = (mainContent || '').replace(/<[^>]*>/g, '').trim()

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
          <div
            className="mt-2 text-[13px] text-muted-foreground/70 border-l-2 border-primary/30 pl-3 py-1 mb-2 break-all overflow-hidden leading-relaxed italic bg-muted/10 rounded-r-md prose-sm max-w-none [&_p]:my-1 [&_li]:my-0.5 [&_pre]:text-[12px]"
            dangerouslySetInnerHTML={{ __html: thinkHtml }}
          />
        </details>
      )}
      
      {mainContent && (
        <>
          <div
            ref={ref}
            className={cn(
              'markdown-body prose-sm max-w-none',
              streaming && !thinkContent && 'after:content-["▋"] after:animate-pulse after:text-primary after:ml-0.5',
              className
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {!streaming && plainText.length > 20 && (
            <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={content?.replace(/<think>[\s\S]*?<\/think>/g, '').trim() || ''} label="复制全文" />
            </div>
          )}
        </>
      )}
    </div>
  )
}

