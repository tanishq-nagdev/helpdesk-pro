import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import api from '../api/client'

export default function ViewTicket() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [form, setForm] = useState({ status: '', priority: '' })
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    api.get(`/tickets/${id}`)
      .then(res => {
        setTicket(res.data.ticket)
        setForm({ status: res.data.ticket.status, priority: res.data.ticket.priority })
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }, [id])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await api.put(`/tickets/${id}`, form)
      setTicket(prev => ({ ...prev, ...form }))
      setAlert(`Ticket #${String(id).padStart(4, '0')} updated successfully!`)
    } catch (err) {
      setAlert(err.response?.data?.error || 'Update failed.')
    } finally {
      setUpdating(false)
    }
  }

  const statusBadge = (status) => {
    if (status === 'Open')        return <span className="badge-status s-open">● Open</span>
    if (status === 'In Progress') return <span className="badge-status s-inprogress">◐ In Progress</span>
    if (status === 'Resolved')    return <span className="badge-status s-resolved">✓ Resolved</span>
    return                               <span className="badge-status s-closed">✗ Closed</span>
  }

  if (loading) return (
    <div style={{ textAlign: 'center', paddingTop: 60 }}>
      <div className="spinner-border text-primary"></div>
    </div>
  )

  return (
    <>
      {/* Header */}
      <div className="page-header d-flex align-items-center justify-content-between">
        <div>
          <h4>
            <i className="fas fa-ticket-alt me-2" style={{ color: '#6366f1' }}></i>
            Ticket #{String(ticket.id).padStart(4, '0')}
          </h4>
          <p>
            {ticket.created_at ? ticket.created_at.split(' ')[0] : 'N/A'} by {ticket.creator_name}
          </p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" style={{ borderRadius: 8 }}
          onClick={() => navigate('/dashboard')}>
          <i className="fas fa-arrow-left me-1"></i> Back
        </button>
      </div>

      {alert && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {alert}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      <div className="row g-3">
        {/* Description card */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h6 style={{ margin: 0 }}>{ticket.title}</h6>
            </div>
            <div className="card-body" style={{ padding: 24 }}>
              <p style={{
                color: '#334155', fontSize: '0.9rem', lineHeight: 1.7,
                whiteSpace: 'pre-wrap', margin: 0
              }}>
                {ticket.description}
              </p>
            </div>
          </div>
        </div>

        {/* Info + admin panel */}
        <div className="col-lg-4">
          <div className="card mb-3">
            <div className="card-header">
              <h6 style={{ margin: 0 }}>Ticket Info</h6>
            </div>
            <div className="card-body" style={{ padding: 20 }}>
              <table style={{ width: '100%', fontSize: '0.825rem' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#94a3b8', padding: '6px 0', width: '45%' }}>Status</td>
                    <td>{statusBadge(ticket.status)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#94a3b8', padding: '6px 0' }}>Priority</td>
                    <td><span className={`p-${ticket.priority?.toLowerCase()}`}>{ticket.priority}</span></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#94a3b8', padding: '6px 0' }}>Category</td>
                    <td style={{ color: '#334155' }}>{ticket.category}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#94a3b8', padding: '6px 0' }}>Submitted by</td>
                    <td style={{ color: '#334155' }}>{ticket.creator_name}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#94a3b8', padding: '6px 0' }}>Created</td>
                    <td style={{ color: '#334155' }}>{ticket.created_at || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#94a3b8', padding: '6px 0' }}>Last Updated</td>
                    <td style={{ color: '#334155' }}>{ticket.updated_at || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin controls — visible only to admin/support */}
          {['admin', 'support'].includes(user?.role) && (
            <div className="card" style={{ border: '2px solid #f0f0ff' }}>
              <div className="card-header" style={{ background: '#f5f3ff' }}>
                <h6 style={{ color: '#6366f1', margin: 0 }}>
                  <i className="fas fa-shield-alt me-2"></i>Admin Controls
                </h6>
              </div>
              <div className="card-body" style={{ padding: 20 }}>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 12 }}>
                  Update ticket status and priority.
                </p>

                <form onSubmit={handleUpdate}>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      New Status
                    </label>
                    <select
                      className="form-select form-select-sm"
                      style={{ borderRadius: 8 }}
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      Update Priority
                    </label>
                    <select
                      className="form-select form-select-sm"
                      style={{ borderRadius: 8 }}
                      value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 btn-sm"
                    disabled={updating}
                    style={{ borderRadius: 8, fontWeight: 600 }}
                  >
                    {updating
                      ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving…</>
                      : <><i className="fas fa-save me-1"></i>Update Ticket</>
                    }
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
