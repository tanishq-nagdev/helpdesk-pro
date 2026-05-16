import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await api.post('/register', form)
      setSuccess('Registration successful! Please login.')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.')
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
        </div>

        {error   && <div className="alert alert-danger mb-3"  style={{ borderRadius: 10, fontSize: '0.875rem' }}>{error}</div>}
        {success && <div className="alert alert-success mb-3" style={{ borderRadius: 10, fontSize: '0.875rem' }}>{success}</div>}

        <div style={{
          background: '#fff', borderRadius: 16, padding: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Create Account</h5>
          <p style={{ color: '#64748b', fontSize: '0.825rem', marginBottom: 24 }}>
            Register as a new employee
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                Full Name
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Your full name"
                required
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                style={{ borderRadius: 8, padding: '10px 14px' }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                Username
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Choose a username"
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
                placeholder="Choose a password"
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
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>

          <hr style={{ margin: '20px 0', borderColor: '#f1f5f9' }} />
          <p style={{ textAlign: 'center', fontSize: '0.825rem', color: '#64748b', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
