import http from './http'

export const ask = (question, sessionId) =>
  http.post('/chat/ask', { question, sessionId })

export const newSession = () =>
  http.post('/chat/new')

export const getLatestSession = () =>
  http.get('/chat/latest')

export const listSessions = () =>
  http.get('/chat/sessions')

export const listMessages = (sessionId) =>
  http.get(`/chat/messages/${sessionId}`)

export const clearSessions = () =>
  http.delete('/chat/clear')

/**
 * Open an SSE connection for streaming AI responses (text-only).
 * Returns an EventSource instance.
 */
export const streamAsk = (question, sessionId, deepThink = false) => {
  const params = new URLSearchParams({ question })
  if (sessionId) params.append('sessionId', sessionId)
  if (deepThink) params.append('deepThink', 'true')
  return new EventSource(`/api/chat/stream?${params.toString()}`, {
    withCredentials: true,
  })
}

/**
 * 多模态流式请求（含图片）。
 * 因为 EventSource 不支持 POST，改用 fetch + ReadableStream 手动解析 SSE。
 * 返回一个可关闭的对象 { close() }，通过 callback 传回事件。
 *
 * @param {string} question
 * @param {string|null} sessionId
 * @param {string} imageBase64   纯 base64（不含 data URI 前缀）
 * @param {string} mimeType      如 image/jpeg
 * @param {boolean} deepThink    是否开启深度思考
 * @param {{ onMeta, onChunk, onDone, onError }} callbacks
 */
export const streamAskWithImage = (question, sessionId, imageBase64, mimeType, deepThink, callbacks) => {
  const controller = new AbortController()

  fetch('/api/chat/stream-vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    signal: controller.signal,
    body: JSON.stringify({ question, sessionId, imageBase64, mimeType, deepThink }),
  }).then(async (res) => {
    if (!res.ok) {
      callbacks.onError?.(`HTTP ${res.status}`)
      return
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const pump = async () => {
      const { done, value } = await reader.read()
      if (done) { callbacks.onDone?.(); return }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // 保留未完成行

      for (const line of lines) {
        if (line.startsWith('event: meta')) continue
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data.startsWith('{"sessionId"')) {
            try { callbacks.onMeta?.(JSON.parse(data)) } catch (_) {}
          } else if (data === '[DONE]') {
            callbacks.onDone?.()
            return
          } else if (data.startsWith('[ERROR]')) {
            callbacks.onError?.(data.replace('[ERROR] ', ''))
            return
          } else {
            callbacks.onChunk?.(data)
          }
        }
      }
      pump()
    }
    pump()
  }).catch((err) => {
    if (err.name !== 'AbortError') callbacks.onError?.(err.message)
  })

  return { close: () => controller.abort() }
}

