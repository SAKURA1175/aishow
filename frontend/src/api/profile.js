import http from './http'

export const getLearningProfile = () =>
  http.get('/profile/current')

export const getProfileHierarchy = () =>
  http.get('/profile/hierarchy')
