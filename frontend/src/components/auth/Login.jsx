import React, { useState, useEffect } from 'react'
import socket from '../../socket'

export default function Login() {
  const [mode, setMode] = useState('login') // login | register
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const onFail = (d) => { setError(d.message); setTimeout(() => setError(''), 4000) }
    const onRegOk = () => {
      setSuccess('注册成功，正在自动登录...')
      setTimeout(() => socket.emit('auth_login', { phone, password }), 800)
    }
    socket.on('login_fail', onFail)
    socket.on('register_fail', onFail)
    socket.on('register_success', onRegOk)
    return () => {
      socket.off('login_fail', onFail)
      socket.off('register_fail', onFail)
      socket.off('register_success', onRegOk)
    }
  }, [phone, password])

  const switchMode = (m) => { setMode(m); setError(''); setSuccess('') }

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    if (!phone || !password) { setError('请输入手机号和密码'); return }
    socket.emit('auth_login', { phone: phone.trim(), password })
  }

  const handleRegister = (e) => {
    e.preventDefault()
    setError('')
    if (!phone || !password || !nickname) { setError('请填写完整信息'); return }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) { setError('请输入正确的11位手机号'); return }
    if (password.length < 4) { setError('密码至少4位'); return }
    if (password !== confirmPwd) { setError('两次密码不一致'); return }
    socket.emit('auth_register', { phone: phone.trim(), nickname: nickname.trim(), password })
  }

  return (
    <div className="mhy-page">
      {/* 背景 */}
      <div className="mhy-bg" />
      <div className="mhy-bg-mask" />

      {/* 角色立绘 */}
      <img className="mhy-char mhy-char-left" src="/assets/keqing.png" alt="" draggable="false" />
      <img className="mhy-char mhy-char-right" src="/assets/venti.png" alt="" draggable="false" />

      {/* 登录弹窗 */}
      <div className="mhy-dialog">
        {/* Logo */}
        <div className="mhy-logo">
          <span className="mhy-logo-icon">♠♥♣♦</span>
          <span className="mhy-logo-text">POKER FRIENDS</span>
        </div>

        {/* Tab */}
        <div className="mhy-tabs">
          <button className={`mhy-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}>密码登录</button>
          <button className={`mhy-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}>注册账号</button>
        </div>

        {/* 表单内容 */}
        <div className="mhy-form-area">
          {mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="mhy-input-wrap">
                <input type="tel" placeholder="手机号"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  autoComplete="tel" />
              </div>
              <div className="mhy-input-wrap">
                <input type={showPwd ? 'text' : 'password'} placeholder="密码"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password" />
                <button type="button" className="mhy-eye" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
              {error && <div className="mhy-error">{error}</div>}
              <button className="mhy-submit" type="submit">登 录</button>
              <div className="mhy-footer-links">
                <span className="mhy-link" onClick={() => switchMode('register')}>注册账号</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="mhy-input-wrap">
                <input type="tel" placeholder="手机号"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  autoComplete="tel" />
              </div>
              <div className="mhy-input-wrap">
                <input type="text" placeholder="昵称"
                  value={nickname}
                  onChange={e => setNickname(e.target.value.slice(0, 12))} />
              </div>
              <div className="mhy-input-wrap">
                <input type={showPwd ? 'text' : 'password'} placeholder="密码（至少4位）"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password" />
                <button type="button" className="mhy-eye" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
              <div className="mhy-input-wrap">
                <input type="password" placeholder="确认密码"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  autoComplete="new-password" />
              </div>
              {error && <div className="mhy-error">{error}</div>}
              {success && <div className="mhy-success">{success}</div>}
              <button className="mhy-submit" type="submit">注 册</button>
              <div className="mhy-footer-links">
                <span className="mhy-link" onClick={() => switchMode('login')}>返回登录</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
