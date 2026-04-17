import http from './http'

export const login = (username, password, role) =>
  http.post('/user/login', { username, password, role })

export const register = (username, password, role) =>
  http.post('/user/register', { username, password, role })

export const logout = () =>
  http.post('/user/logout')

export const getProfile = () =>
  http.get('/user/profile')
