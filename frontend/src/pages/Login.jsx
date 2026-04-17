import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { login, register } from '@/api/user'
import useStore from '@/store/useStore'
import { cn } from '@/lib/utils'
import AnimatedCharacters from '../components/animations/animated-characters/AnimatedCharacters'
import BrandLogo from '@/components/BrandLogo'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const setUser = useStore((s) => s.setUser)

  const [mode, setMode] = useState('login') // 'login' or 'register'

  // Common UI State
  const [isTyping, setIsTyping] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  // Login State
  const [loginData, setLoginData] = useState({ username: '', password: '', role: 'student' })
  
  // Register State
  const [regData, setRegData] = useState({ username: '', password: '', confirmPassword: '', role: 'student' })

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    if (!loginData.username.trim() || !loginData.password) {
      setErrorMsg('请填写用户名和密码')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await login(loginData.username.trim(), loginData.password, loginData.role)
      if (res.data?.success) {
        setUser(res.data.data)
        navigate('/chat')
      } else {
        setErrorMsg(res.data?.message || '登录失败')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || '网络错误，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    if (!regData.username.trim() || !regData.password || !regData.confirmPassword) {
      setErrorMsg('请填写完整注册信息')
      return
    }
    if (regData.password !== regData.confirmPassword) {
      setErrorMsg('两次输入的密码不一致')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await register(regData.username.trim(), regData.password, regData.role)
      if (res.data?.success) {
        setSuccessMsg('注册成功，请切换到登录模式')
        setRegData({ username: '', password: '', confirmPassword: '', role: 'student' })
        setTimeout(() => {
          setMode('login')
          setSuccessMsg('')
        }, 2000)
      } else {
        setErrorMsg(res.data?.message || '注册失败')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || '网络错误，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentPassword = mode === 'login' ? loginData.password : regData.password

  return (
    <div id="login-page">
      <div className="left-panel">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BrandLogo size={36} />
          <span style={{ fontWeight: 800, letterSpacing: '1px' }}>Study AI</span>
        </div>

        <div className="characters-wrapper">
          <AnimatedCharacters
            isTyping={isTyping}
            isPasswordFocused={isPasswordFocused}
            showPassword={showPassword}
            passwordLength={currentPassword.length}
          />
        </div>

        <div className="footer-links">
          <a href="#">隐私政策</a>
          <a href="#">服务条款</a>
          <a href="#">联系我们</a>
        </div>
      </div>

      <div className="right-panel">
        <div className="form-container">
          <div className="sparkle-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.5 9H10.5L12 2Z" fill="#1a1a2e" />
              <path d="M12 22L10.5 15H13.5L12 22Z" fill="#1a1a2e" />
              <path d="M2 12L9 10.5V13.5L2 12Z" fill="#1a1a2e" />
              <path d="M22 12L15 13.5V10.5L22 12Z" fill="#1a1a2e" />
            </svg>
          </div>

          <div className="form-header">
            <h1>{mode === 'login' ? '欢迎回来!' : '创建新账号'}</h1>
            <p>{mode === 'login' ? '请输入您的详细信息以登录' : '请输入详细信息以注册'}</p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="login-username">用户名</label>
                <div className="input-wrapper">
                  <input
                    id="login-username"
                    type="text"
                    value={loginData.username}
                    onChange={(e) => {
                      setLoginData({ ...loginData, username: e.target.value })
                      setErrorMsg('')
                    }}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    placeholder="请输入用户名"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="login-password">密码</label>
                <div className="input-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => {
                      setLoginData({ ...loginData, password: e.target.value })
                      setErrorMsg('')
                    }}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    placeholder="********"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>角色</label>
                <div className="flex gap-2">
                  {[
                    { value: 'student', label: '学生' },
                    { value: 'teacher', label: '教师' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLoginData({ ...loginData, role: value })}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-md text-sm border transition-all duration-300',
                        loginData.role === value
                          ? 'bg-[#1a1a2e] border-[#1a1a2e] text-white shadow-md'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg ? <div className="error-msg show">{errorMsg}</div> : null}
              {successMsg ? <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{successMsg}</div> : null}

              <button type="submit" className="btn-login" disabled={isSubmitting}>
                <span className="btn-text">{isSubmitting ? "登录中..." : "登 录"}</span>
                <div className="btn-hover-content">
                  <span>{isSubmitting ? "登录中..." : "登 录"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="reg-username">用户名</label>
                <div className="input-wrapper">
                  <input
                    id="reg-username"
                    type="text"
                    value={regData.username}
                    onChange={(e) => {
                      setRegData({ ...regData, username: e.target.value })
                      setErrorMsg('')
                    }}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    placeholder="请输入用户名"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">密码</label>
                <div className="input-wrapper">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    value={regData.password}
                    onChange={(e) => {
                      setRegData({ ...regData, password: e.target.value })
                      setErrorMsg('')
                    }}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    placeholder="设置密码"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-confirm">确认密码</label>
                <div className="input-wrapper">
                  <input
                    id="reg-confirm"
                    type={showPassword ? "text" : "password"}
                    value={regData.confirmPassword}
                    onChange={(e) => {
                      setRegData({ ...regData, confirmPassword: e.target.value })
                      setErrorMsg('')
                    }}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    placeholder="请再次输入密码"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>注册身份</label>
                <div className="flex gap-2">
                  {[
                    { value: 'student', label: '学生' },
                    { value: 'teacher', label: '教师' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRegData({ ...regData, role: value })}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-md text-sm border transition-all duration-300',
                        regData.role === value
                          ? 'bg-[#1a1a2e] border-[#1a1a2e] text-white shadow-md'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg ? <div className="error-msg show">{errorMsg}</div> : null}
              {successMsg ? <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 border border-green-200 rounded-lg font-medium">{successMsg}</div> : null}

              <button type="submit" className="btn-login" disabled={isSubmitting}>
                <span className="btn-text">{isSubmitting ? "注册中..." : "注 册"}</span>
                <div className="btn-hover-content">
                  <span>{isSubmitting ? "注册中..." : "注 册"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </button>
            </form>
          )}

          <div className="signup-link">
            {mode === 'login' ? (
              <>还没有账号? <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); setErrorMsg(''); setSuccessMsg('') }}>去注册</a></>
            ) : (
              <>已有账号? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setErrorMsg(''); setSuccessMsg('') }}>去登录</a></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
