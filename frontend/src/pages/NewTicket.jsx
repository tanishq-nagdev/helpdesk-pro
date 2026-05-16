import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function NewTicket() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', category: 'Hardware', priority: 'Medium'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/tickets', form)
      sessionStorage.setItem('flash', 'Ticket submitted successfully!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit ticket.')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h4>
          <i className="fas fa-plus-circle me-2" style={{ color: '#6366f1' }}></i>
          Submit New Ticket
        </h4>
        <p>Describe your issue and our IT team will get back to you shortly.</p>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="row">
        <div className="col-lg-7">
          <div className="card">
            <div className="card-header">
              <h6 style={{ margin: 0 }}>Ticket Details</h6>
            </div>
            <div className="card-body" style={{ padding: 24 }}>
              <form onSubmit={handleSubmit}>

                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                    Issue Title <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Cannot connect to company VPN"
                    required
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    style={{ borderRadius: 8, padding: '10px 14px' }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                    Description <span style={{ color: 'red' }}>*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={5}
                    placeholder="Describe the issue in detail…"
                    required
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    style={{ borderRadius: 8, padding: '10px 14px' }}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                      Category
                    </label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      style={{ borderRadius: 8, padding: '10px 14px' }}
                    >
                      <option>Hardware</option>
                      <option>Software</option>
                      <option>Network</option>
                      <option>Access / Permissions</option>
                      <option>Email</option>
                      <option>General</option>
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                      Priority
                    </label>
                    <select
                      className="form-select"
                      value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value })}
                      style={{ borderRadius: 8, padding: '10px 14px' }}
                    >
                      <option value="Low">Low — Can wait</option>
                      <option value="Medium">Medium — Affects my work</option>
                      <option value="High">High — Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ borderRadius: 8, padding: '10px 24px', fontWeight: 600 }}
                  >
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting…</>
                      : <><i className="fas fa-paper-plane me-2"></i>Submit Ticket</>
                    }
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/dashboard')}
                    style={{ borderRadius: 8, padding: '10px 24px' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Tips panel */}
        <div className="col-lg-5">
          <div className="card" style={{ background: '#f8fafc' }}>
            <div className="card-body" style={{ padding: 24 }}>
              <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
                <i className="fas fa-lightbulb me-2" style={{ color: '#f59e0b' }}></i>
                Tips for a faster resolution
              </h6>
              <ul style={{ color: '#64748b', fontSize: '0.825rem', paddingLeft: 20, lineHeight: 2 }}>
                <li>Be specific about what's not working</li>
                <li>Include any error messages</li>
                <li>Mention when it started</li>
                <li>Steps to reproduce</li>
                <li>How many users affected</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
