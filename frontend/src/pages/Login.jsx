import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy } from 'lucide-react'
import { login } from '@/api/user'
import useStore from '@/store/useStore'
import { cn } from '@/lib/utils'
import AnimatedCharacters from '../components/animations/animated-characters/AnimatedCharacters'
import BrandLogo from '@/components/BrandLogo'
import './Login.css'

const DEMO_ACCOUNTS = [
  { label: '学生演示', username: 'teststudent', password: '123456', role: 'student' },
  { label: '教师演示', username: 'testteacher', password: '123456', role: 'teacher' },
  { label: '管理员', username: 'admin', password: 'admin123', role: 'admin' },
]

export default function Login() {
  const navigate = useNavigate()
  const setUser = useStore((s) => s.setUser)

  // WeChat Login States
  const [qrMode, setQrMode] = useState(false)
  const [wechatScanned, setWechatScanned] = useState(false)

  // Common UI State
  const [isTyping, setIsTyping] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [copiedAccount, setCopiedAccount] = useState('')
  
  // Unified Form State (Username, Password, Role)
  const [loginData, setLoginData] = useState({ username: '', password: '', role: 'student' })

  const fillDemoAccount = (account) => {
    setLoginData({
      username: account.username,
      password: account.password,
      role: account.role,
    })
    setErrorMsg('')
    setSuccessMsg(`${account.label}已填入，可直接登录`)
  }

  const copyDemoAccount = async (account) => {
    const text = `${account.label}\n用户名：${account.username}\n密码：${account.password}\n角色：${account.role}`
    try {
      if (!window.isSecureContext) {
        fallbackCopy(text)
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        fallbackCopy(text)
      }
      setCopiedAccount(account.username)
      setSuccessMsg(`${account.label}已复制`)
      window.setTimeout(() => setCopiedAccount(''), 1800)
    } catch {
      try {
        fallbackCopy(text)
        setCopiedAccount(account.username)
        setSuccessMsg(`${account.label}已复制`)
        window.setTimeout(() => setCopiedAccount(''), 1800)
      } catch {
        setSuccessMsg('')
        setErrorMsg(`账号：${account.username}，密码：${account.password}`)
      }
    }
  }

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-1000px'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (!copied) {
      throw new Error('copy failed')
    }
  }

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

  const handleMockWechatScan = () => {
    setWechatScanned(true)
    setErrorMsg('')
    setSuccessMsg('微信扫码成功，正在登录...')
    setTimeout(async () => {
      setIsSubmitting(true)
      try {
        const res = await login('teststudent', '123456', 'student')
        if (res.data?.success) {
          setUser(res.data.data)
          navigate('/chat')
        } else {
          setErrorMsg(res.data?.message || '扫码登录失败')
          setWechatScanned(false)
        }
      } catch {
        setErrorMsg('网络错误，请重试')
        setWechatScanned(false)
      } finally {
        setIsSubmitting(false)
      }
    }, 1500)
  }

  const handleThirdPartyLogin = (platform) => {
    setErrorMsg('')
    setSuccessMsg(`正在跳转至 ${platform} 授权登录...`)
    setTimeout(() => {
      setSuccessMsg('')
      setErrorMsg(`${platform} 登录当前不可用，请使用账号密码或微信扫码。`)
    }, 1500)
  }

  const currentPassword = loginData.password

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

          {qrMode ? (
            <div className="wechat-login-container">
              <div className="wechat-header">
                <h2>微信扫码登录</h2>
                <p>请使用微信App扫描下方二维码</p>
              </div>

              <div className={cn("qr-code-box", wechatScanned && "scanned")}>
                {wechatScanned ? (
                  <div className="qr-success-overlay">
                    <div className="qr-success-icon">
                      <Check size={28} />
                    </div>
                    <span>扫码成功</span>
                  </div>
                ) : (
                  <>
                    <div className="qr-scan-line"></div>
                    <svg className="qr-code-image" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5" y="5" width="90" height="90" rx="6" fill="#F4F4F6" />
                      
                      <rect x="12" y="12" width="24" height="24" rx="2" fill="#2D2D2D" />
                      <rect x="16" y="16" width="16" height="16" rx="1" fill="#F4F4F6" />
                      <rect x="20" y="20" width="8" height="8" fill="#2D2D2D" />
                      
                      <rect x="64" y="12" width="24" height="24" rx="2" fill="#2D2D2D" />
                      <rect x="68" y="16" width="16" height="16" rx="1" fill="#F4F4F6" />
                      <rect x="72" y="20" width="8" height="8" fill="#2D2D2D" />
                      
                      <rect x="12" y="64" width="24" height="24" rx="2" fill="#2D2D2D" />
                      <rect x="16" y="68" width="16" height="16" rx="1" fill="#F4F4F6" />
                      <rect x="20" y="72" width="8" height="8" fill="#2D2D2D" />
                      
                      <rect x="42" y="12" width="6" height="6" rx="1" fill="#2D2D2D" />
                      <rect x="52" y="12" width="6" height="6" rx="1" fill="#2D2D2D" />
                      <rect x="42" y="22" width="12" height="6" rx="1" fill="#2D2D2D" />
                      <rect x="48" y="32" width="6" height="12" rx="1" fill="#2D2D2D" />
                      <rect x="12" y="42" width="12" height="6" rx="1" fill="#2D2D2D" />
                      <rect x="28" y="42" width="6" height="12" rx="1" fill="#2D2D2D" />
                      <rect x="64" y="42" width="12" height="6" rx="1" fill="#2D2D2D" />
                      <rect x="82" y="42" width="6" height="6" rx="1" fill="#2D2D2D" />
                      
                      <rect x="42" y="48" width="12" height="12" rx="1" fill="#2D2D2D" />
                      <rect x="12" y="52" width="6" height="6" rx="1" fill="#2D2D2D" />
                      <rect x="24" y="52" width="12" height="6" rx="1" fill="#2D2D2D" />
                      <rect x="76" y="52" width="12" height="12" rx="1" fill="#2D2D2D" />
                      
                      <rect x="42" y="64" width="6" height="12" rx="1" fill="#2D2D2D" />
                      <rect x="52" y="70" width="12" height="6" rx="1" fill="#2D2D2D" />
                      <rect x="42" y="82" width="18" height="6" rx="1" fill="#2D2D2D" />
                      <rect x="64" y="82" width="6" height="6" rx="1" fill="#2D2D2D" />
                      <rect x="76" y="74" width="12" height="12" rx="1" fill="#2D2D2D" />
                      
                      <rect x="38" y="38" width="24" height="24" rx="12" fill="#F4F4F6" />
                      <rect x="40" y="40" width="20" height="20" rx="10" fill="#07C160" />
                      
                      <path d="M53.5 48.5C53.5 46.84 51.54 45.5 49 45.5C46.46 45.5 44.5 46.84 44.5 48.5C44.5 50.16 46.46 51.5 49 51.5C49.8 51.5 50.55 51.29 51.2 50.92L52.88 51.76L52.43 50.12C53.08 49.68 53.5 49.14 53.5 49.14Z" fill="white"/>
                      <path d="M47.75 47.75C47.34 47.75 47 47.41 47 47C47 46.59 47.34 46.25 47.75 46.25c.41 0 .75.34.75.75c0 .41-.34.75-.75.75Zm2.5 0C49.84 47.75 49.5 47.41 49.5 47C49.5 46.59 49.84 46.25 50.25 46.25c.41 0 .75.34.75.75c0 .41-.34.75-.75.75Z" fill="#07C160" />
                      
                      <path d="M47.75 51.38C45.26 51.38 43.25 52.69 43.25 54.31c0 1.62 2.01 2.94 4.5 2.94c.77 0 1.48-.19 2.13-.56l1.62.81-.43-1.56c.94-.43 1.18-.99 1.18-1.63c0-1.62-2.01-2.93-4.5-2.93Z" fill="white"/>
                      <path d="M46.5 53.5C46.09 53.5 45.75 53.16 45.75 52.75C45.75 52.34 46.09 52 46.5 52c.41 0 .75.34.75.75c0 .41-.34.75-.75.75Zm2.5 0C48.59 53.5 48.25 53.16 48.25 52.75C48.25 52.34 48.59 52 49 52c.41 0 .75.34.75.75c0 .41-.34.75-.75.75Z" fill="#07C160" />
                    </svg>
                  </>
                )}
              </div>

              <div className="wechat-status">
                {!wechatScanned && <div className="wechat-status-dot"></div>}
                <span>{wechatScanned ? "登录授权中..." : "等待扫码登录"}</span>
              </div>

              {!wechatScanned && (
                <button type="button" className="btn-wechat-mock" onClick={handleMockWechatScan}>
                  模拟扫码成功
                </button>
              )}

              <button 
                type="button" 
                className="btn-wechat-back" 
                onClick={() => {
                  setQrMode(false)
                  setWechatScanned(false)
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
                disabled={wechatScanned}
              >
                返回密码登录
              </button>
            </div>
          ) : (
            <>
              <div className="form-header">
                <h1>欢迎使用 Study AI</h1>
                <p>输入账号密码即可登录，学生账号若不存在将自动注册</p>
              </div>

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
                      { value: 'admin', label: '管理员' },
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
                  
                  {loginData.role === 'student' ? (
                    <div className="role-instruction-note student">
                      <span>💡 提示：若您的账号不存在，系统将自动为您注册为学生账号并登录。</span>
                    </div>
                  ) : (
                    <div className="role-instruction-note other">
                      <span>🔒 提示：仅学生账号支持自助注册。教师与管理员账号请联系管理员。</span>
                    </div>
                  )}
                </div>

                {errorMsg ? <div className="error-msg show">{errorMsg}</div> : null}
                {successMsg ? <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{successMsg}</div> : null}

                <button type="submit" className="btn-login" disabled={isSubmitting}>
                  <span className="btn-text">
                    {isSubmitting ? "处理中..." : loginData.role === 'student' ? "登 录 / 注 册" : "登 录"}
                  </span>
                  <div className="btn-hover-content">
                    <span>
                      {isSubmitting ? "处理中..." : loginData.role === 'student' ? "登 录 / 注 册" : "登 录"}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </button>

                <div className="demo-accounts" aria-label="演示账号">
                  <div className="demo-header">
                    <span>演示账号</span>
                    <small>一键填入或复制</small>
                  </div>
                  <div className="demo-list">
                    {DEMO_ACCOUNTS.map((account) => (
                      <div className="demo-account" key={account.username}>
                        <button
                          type="button"
                          className="demo-main"
                          onClick={() => fillDemoAccount(account)}
                          title={`填入 ${account.label}`}
                        >
                          <span className="demo-label">{account.label}</span>
                          <span className="demo-credential">{account.username} / {account.password}</span>
                        </button>
                        <button
                          type="button"
                          className="demo-copy"
                          onClick={() => copyDemoAccount(account)}
                          title={`复制 ${account.label}`}
                          aria-label={`复制${account.label}`}
                        >
                          {copiedAccount === account.username ? <Check size={15} /> : <Copy size={15} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="social-divider">
                  <span>其他登录方式</span>
                </div>

                <div className="social-buttons">
                  <button
                    type="button"
                    className="btn-social wechat"
                    onClick={() => {
                      setQrMode(true)
                      setErrorMsg('')
                      setSuccessMsg('')
                    }}
                    title="微信登录"
                    aria-label="微信登录"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.28 10.3c0-.36.32-.65.7-.65s.7.29.7.65c0 .36-.32.65-.7.65s-.7-.29-.7-.65zm3.62 0c0-.36.32-.65.7-.65s.7.29.7.65c0 .36-.32.65-.7.65s-.7-.29-.7-.65zm-5.71-.97c3.96 0 7.18 2.7 7.18 6.03 0 3.32-3.22 6.03-7.18 6.03-.78 0-1.52-.11-2.22-.31l-2.02 1.05.51-1.93C1.04 19.16 0 17.51 0 15.36c0-3.33 3.22-6.03 7.19-6.03zm9.05-7.2c4.76 0 8.62 3.4 8.62 7.6 0 2.45-1.39 4.62-3.56 5.92l.62 2.42-2.52-1.3c-.95.27-1.95.42-3 .42-.4 0-.8-.03-1.19-.07 3.38-.97 5.91-3.69 5.91-6.9 0-4-3.52-7.25-7.85-7.25-.8 0-1.58.11-2.31.32.96-1 2.91-1.66 5.23-1.66z" />
                    </svg>
                  </button>
                  
                  <button
                    type="button"
                    className="btn-social github"
                    onClick={() => handleThirdPartyLogin('GitHub')}
                    title="GitHub 登录"
                    aria-label="GitHub 登录"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="btn-social google"
                    onClick={() => handleThirdPartyLogin('Google')}
                    title="Google 登录"
                    aria-label="Google 登录"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.326 0-6.023-2.697-6.023-6.023 0-3.326 2.697-6.023 6.023-6.023 1.488 0 2.846.549 3.896 1.44l3.117-3.116C18.98 2.766 15.821 1.5 12.24 1.5c-5.79 0-10.5 4.71-10.5 10.5s4.71 10.5 10.5 10.5c5.38 0 9.87-3.86 9.87-10.5 0-.64-.06-1.26-.17-1.715H12.24z" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
