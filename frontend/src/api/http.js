import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  withCredentials: true,  // send session cookies
  timeout: 30000,
})

http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired – redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default http
