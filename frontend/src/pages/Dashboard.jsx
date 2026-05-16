import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import api from '../api/client'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0 })
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    api.get('/tickets')
      .then(res => {
        setTickets(res.data.tickets)
        setStats(res.data.stats)
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    // Pick up flash message from navigation state (e.g. after creating/updating a ticket)
    const msg = sessionStorage.getItem('flash')
    if (msg) {
      setAlert(msg)
      sessionStorage.removeItem('flash')
    }
  }, [])

  const statusBadge = (status) => {
    if (status === 'Open')        return <span className="badge-status s-open">● Open</span>
    if (status === 'In Progress') return <span className="badge-status s-inprogress">◐ In Progress</span>
    if (status === 'Resolved')    return <span className="badge-status s-resolved">✓ Resolved</span>
    return                               <span className="badge-status s-closed">✗ Closed</span>
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <h4>
          {user?.role === 'admin'   && <><i className="fas fa-shield-alt me-2" style={{ color: '#6366f1' }}></i>Admin Dashboard</>}
          {user?.role === 'support' && <><i className="fas fa-tools me-2"      style={{ color: '#6366f1' }}></i>IT Support Desk</>}
          {user?.role === 'employee'&& <><i className="fas fa-th-large me-2"   style={{ color: '#6366f1' }}></i>My Tickets</>}
        </h4>
        <p>
          {user?.role === 'admin'    && 'Global overview of all organisational tickets and system status.'}
          {user?.role === 'support'  && 'Manage, triage, and resolve active employee IT requests.'}
          {user?.role === 'employee' && 'Track the status of your personal IT support requests.'}
        </p>
      </div>

      {/* Flash alert */}
      {alert && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {alert}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between">
              <div>
                <div className="stat-num">{stats.total}</div>
                <div className="stat-label">Total Tickets</div>
              </div>
              <i className="fas fa-ticket-alt" style={{ color: '#6366f1', opacity: 0.3, fontSize: '1.8rem' }}></i>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between">
              <div>
                <div className="stat-num">{stats.open}</div>
                <div className="stat-label">Open</div>
              </div>
              <i className="fas fa-circle-exclamation" style={{ color: '#f59e0b', opacity: 0.3, fontSize: '1.8rem' }}></i>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between">
              <div>
                <div className="stat-num">{stats.in_progress}</div>
                <div className="stat-label">In Progress</div>
              </div>
              <i className="fas fa-spinner" style={{ color: '#3b82f6', opacity: 0.3, fontSize: '1.8rem' }}></i>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between">
              <div>
                <div className="stat-num">{stats.resolved}</div>
                <div className="stat-label">Resolved</div>
              </div>
              <i className="fas fa-check-circle" style={{ color: '#10b981', opacity: 0.3, fontSize: '1.8rem' }}></i>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 style={{ margin: 0 }}>
            <i className="fas fa-list me-2" style={{ color: '#6366f1' }}></i>
            {user?.role === 'admin'    && 'Global Ticket Queue'}
            {user?.role === 'support'  && 'Active Support Queue'}
            {user?.role === 'employee' && 'My Ticket History'}
          </h6>
          {user?.role === 'employee' && (
            <button className="btn btn-primary btn-sm" style={{ borderRadius: 8 }}
              onClick={() => navigate('/tickets/new')}>
              <i className="fas fa-plus me-1"></i> New Ticket
            </button>
          )}
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner-border text-primary"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <i className="fas fa-inbox" style={{ fontSize: '3rem', marginBottom: 16, display: 'block' }}></i>
              <p style={{ fontWeight: 600 }}>No tickets yet</p>
              {user?.role === 'employee' && (
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/tickets/new')}>
                  Submit your first ticket
                </button>
              )}
            </div>
          ) : (
            <table className="table mb-0">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>#ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  {['admin', 'support'].includes(user?.role) && <th>Submitted By</th>}
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <span className="ticket-id">#{String(ticket.id).padStart(4, '0')}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{ticket.title}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        <i className="fas fa-tag me-1"></i>{ticket.category}
                      </span>
                    </td>
                    <td>
                      <span className={`p-${ticket.priority?.toLowerCase()}`}>{ticket.priority}</span>
                    </td>
                    <td>{statusBadge(ticket.status)}</td>
                    {['admin', 'support'].includes(user?.role) && (
                      <td>{ticket.creator_name}</td>
                    )}
                    <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {ticket.created_at ? ticket.created_at.split(' ')[0] : 'N/A'}
                    </td>
                    <td>
                      <button className="btn btn-outline-secondary btn-sm"
                        onClick={() => navigate(`/tickets/${ticket.id}`)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
