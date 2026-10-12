import http from './http'

// ── 简历 CRUD ──────────────────────────────────────────────────────────────

export const uploadResume = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return http.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const listResumes = () => http.get('/resume/list')

export const getResume = (id) => http.get(`/resume/${id}`)

export const deleteResume = (id) => http.delete(`/resume/${id}`)

// ── SSE 流式分析 ───────────────────────────────────────────────────────────

/**
 * SSE 流式分析简历
 * @param {number} id - 简历 ID
 * @param {function} onToken - 收到 token 回调 (token: string)
 * @param {function} onDone  - 分析完成回调
 * @param {function} onError - 错误回调 (msg: string)
 * @returns {EventSource} 可调用 .close() 中断
 */
export const analyzeResume = (id, onToken, onDone, onError) => {
  const es = new EventSource(`/api/resume/${id}/analyze`, { withCredentials: true })
  es.addEventListener('data', (e) => onToken && onToken(e.data))
  es.addEventListener('done', () => { onDone && onDone(); es.close() })
  es.addEventListener('error', (e) => {
    onError && onError(e.data || '分析失败')
    es.close()
  })
  return es
}

// ── 岗位技能 Gap 分析 & STAR 润色 ───────────────────────────────────────────

export const matchJob = (id, targetRole, customJd = '') =>
  http.post(`/resume/${id}/match-job`, { targetRole, customJd })

export const triggerExtract = (id) =>
  http.post(`/resume/${id}/extract`)

export const generateCanvaResume = async (id, stylePreference = '') => {
  return http.post(`/resume/${id}/generate-canva`, {
    stylePreference
  }, { timeout: 60000 });
};

export const saveCanvaResume = async (id, canvaData) => {
  const dataStr = typeof canvaData === 'string' ? canvaData : JSON.stringify(canvaData);
  return http.post(`/resume/${id}/canva-save`, { canvaData: dataStr });
};

export const polishResume = (id, targetRole, onToken, onDone, onError) => {
  const params = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : ''
  const es = new EventSource(`/api/resume/${id}/polish${params}`, { withCredentials: true })
  es.addEventListener('data', (e) => onToken && onToken(e.data))
  es.addEventListener('done', () => { onDone && onDone(); es.close() })
  es.addEventListener('error', (e) => {
    onError && onError(e.data || '润色失败')
    es.close()
  })
  return es
}

// ── SSE 流式追问 ───────────────────────────────────────────────────────────

/**
 * SSE 追问接口（POST + EventSource 模拟）
 * 由于 EventSource 只支持 GET，这里用 fetch + ReadableStream 实现
 */
export const askResume = async (id, question, onToken, onDone, onError) => {
  try {
    const response = await fetch(`/api/resume/${id}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      credentials: 'include',
    })

    if (!response.ok) {
      onError && onError(`请求失败: ${response.status}`)
      return null
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5)
            if (data.trim() === '[DONE]') { onDone && onDone(); return }
            onToken && onToken(data)
          } else if (line.startsWith('event:error')) {
            // error line follows
          }
        }
      }
      onDone && onDone()
    }

    pump().catch((e) => onError && onError(e.message))
    return reader
  } catch (e) {
    onError && onError(e.message)
    return null
  }
}

// ── 引导式学习流程 ─────────────────────────────────────────────────────────

export const listFlows = () => http.get('/flow/list')

export const getFlowProgress = (flowType) => http.get(`/flow/${flowType}/progress`)

export const startFlow = (flowType) => http.post(`/flow/${flowType}/start`)

export const nextFlowStep = (flowType) => http.post(`/flow/${flowType}/next`)

/**
 * SSE 流式提交步骤答案
 */
export const submitFlowStep = async (flowType, stepId, answer, onToken, onDone, onError) => {
  try {
    const response = await fetch(`/api/flow/${flowType}/step/${stepId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
      credentials: 'include',
    })

    if (!response.ok) { onError && onError(`请求失败: ${response.status}`); return null }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5)
            if (data.trim() === '[DONE]') { onDone && onDone(); return }
            onToken && onToken(data)
          }
        }
      }
      onDone && onDone()
    }

    pump().catch((e) => onError && onError(e.message))
    return reader
  } catch (e) {
    onError && onError(e.message)
    return null
  }
}

/**
 * SSE 流式生成最终总结报告
 */
export const getFlowSummary = (flowType, onToken, onDone, onError) => {
  const es = new EventSource(`/api/flow/${flowType}/summary`, { withCredentials: true })
  es.addEventListener('data', (e) => onToken && onToken(e.data))
  es.addEventListener('done', () => { onDone && onDone(); es.close() })
  es.addEventListener('error', (e) => { onError && onError(e.data || '生成失败'); es.close() })
  return es
}
