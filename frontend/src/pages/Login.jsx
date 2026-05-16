import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 20 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, background: '#6366f1', borderRadius: 16,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', color: '#fff', marginBottom: 16
          }}>
            <i className="fas fa-headset"></i>
          </div>
          <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>HelpDesk Pro</h3>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', margin: '4px 0 0' }}>
            IT Support Management System
          </p>
        </div>

        {/* Flash error */}
        {error && (
          <div className="alert alert-danger mb-3" style={{ borderRadius: 10, fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Sign In</h5>
          <p style={{ color: '#64748b', fontSize: '0.825rem', marginBottom: 24 }}>
            Enter your credentials to access the portal
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                Username
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter username"
                required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                style={{ borderRadius: 8, padding: '10px 14px' }}
              />
            </div>

            <div className="mb-4">
              <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                Password
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ borderRadius: 8, padding: '10px 14px' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
              style={{ borderRadius: 8, padding: 11, fontWeight: 600 }}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in…</>
                : <><i className="fas fa-sign-in-alt me-2"></i>Sign In</>
              }
            </button>
          </form>

          {/* Contact Admin Message instead of Registration Link */}
          <hr style={{ margin: '20px 0', borderColor: '#f1f5f9' }} />
          <p style={{ textAlign: 'center', fontSize: '0.825rem', color: '#64748b', margin: 0 }}>
            <i className="fas fa-info-circle me-1" style={{ color: '#6366f1' }}></i>
            Need an account? Please contact your IT Administrator.
          </p>
        </div>

      </div>
    </div>
  )
}
