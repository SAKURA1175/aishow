import http from './http'

export const getModelConfig = () =>
  http.get('/admin/model/config')

export const updateModelConfig = (config) =>
  http.post('/admin/model/config', config)

export const getModelPresets = () =>
  http.get('/admin/model/presets')

export const batchImportKnowledge = (files, onProgress) => {
  const formData = new FormData()
  files.forEach(f => formData.append('files', f))
  return http.post('/admin/knowledge/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  })
}

export const getTaskStatus = (taskId) =>
  http.get(`/admin/knowledge/task/${taskId}`)

export const getChatConfig = () =>
  http.get('/admin/chat/config')

export const updateChatConfig = (config) =>
  http.post('/admin/chat/config', config)

export const getPrompt = (role) =>
  http.get(`/admin/prompt/${role}`)

export const updatePrompt = (role, content) =>
  http.post(`/admin/prompt/${role}`, { role, content })
