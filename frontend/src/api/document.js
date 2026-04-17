import http from './http'

export const listDocuments = () =>
  http.get('/document/list')

export const uploadDocument = (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  return http.post('/document/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  })
}

export const downloadDocument = (id) =>
  `/api/document/download/${id}`

export const deleteDocument = (id) =>
  http.delete(`/document/${id}`)
