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
  
  // Debug Alert for backend connection issues
  const [backendError, setBackendError] = useState(null)

  // Admin creating user state
  const [newUser, setNewUser] = useState({ full_name: '', username: '', password: '', role: 'employee' })
  const [userLoading, setUserLoading] = useState(false)
  const [userAlert, setUserAlert] = useState(null)

  // Assignment states
  const [supportUsers, setSupportUsers] = useState([])
  const [selectedTickets, setSelectedTickets] = useState([])
  const [bulkAssignTo, setBulkAssignTo] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchDashboardData = () => {
    setLoading(true)
    api.get('/tickets')
      .then(res => {
        setTickets(res.data.tickets)
        setStats(res.data.stats)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDashboardData()

    if (user?.role === 'admin') {
      api.get('/admin/support-users')
        .then(res => setSupportUsers(res.data.users))
        .catch(err => {
          console.error("Backend Error:", err);
          setBackendError("CRITICAL ERROR: Failed to connect to backend to fetch Support Users. Your backend container did not update properly.");
        })
    }

    const msg = sessionStorage.getItem('flash')
    if (msg) {
      setAlert(msg)
      sessionStorage.removeItem('flash')
    }
  }, [user?.role])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setUserLoading(true)
    setUserAlert(null)
    try {
      const res = await api.post('/admin/users', newUser)
      setUserAlert({ type: 'success', msg: res.data.message })
      setNewUser({ full_name: '', username: '', password: '', role: 'employee' })
    } catch (err) {
      setUserAlert({ type: 'danger', msg: err.response?.data?.error || 'Failed to create user.' })
    } finally {
      setUserLoading(false)
    }
  }

  // --- Ticket Selection & Assignment Methods ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTickets(tickets.map(t => t.id))
    } else {
      setSelectedTickets([])
    }
  }

  const handleSelectTicket = (ticketId) => {
    if (selectedTickets.includes(ticketId)) {
      setSelectedTickets(selectedTickets.filter(id => id !== ticketId))
    } else {
      setSelectedTickets([...selectedTickets, ticketId])
    }
  }

  const handleBulkAssign = async () => {
    if (!bulkAssignTo) return
    setBulkLoading(true)
    try {
      await api.put('/tickets/bulk-assign', { 
        ticket_ids: selectedTickets, 
        assigned_to: bulkAssignTo === 'unassigned' ? '' : bulkAssignTo 
      })
      setAlert(`${selectedTickets.length} tickets successfully assigned!`)
      setSelectedTickets([])
      setBulkAssignTo('')
      fetchDashboardData()
    } catch (err) {
      setAlert(err.response?.data?.error || 'Failed to assign tickets.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleSingleAssign = async (ticketId, supportId) => {
    try {
      await api.put('/tickets/bulk-assign', {
        ticket_ids: [ticketId],
        assigned_to: supportId === 'unassigned' ? '' : supportId
      })
      setAlert(`Ticket #${String(ticketId).padStart(4, '0')} assigned successfully!`)
      fetchDashboardData()
    } catch (err) {
      setAlert(err.response?.data?.error || 'Failed to assign ticket.')
    }
  }

  const statusBadge = (status) => {
    if (status === 'Open')        return <span className="badge-status s-open">● Open</span>
    if (status === 'In Progress') return <span className="badge-status s-inprogress">◐ In Progress</span>
    if (status === 'Resolved')    return <span className="badge-status s-resolved">✓ Resolved</span>
    return                               <span className="badge-status s-closed">✗ Closed</span>
  }

  return (
    <>
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

      {/* Critical Backend Error Banner */}
      {backendError && (
        <div className="alert alert-danger" role="alert" style={{ fontWeight: 'bold' }}>
          <i className="fas fa-exclamation-triangle me-2"></i>
          {backendError}
        </div>
      )}

      {alert && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {alert}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Admin Panel: Create Users */}
      {user?.role === 'admin' && (
        <div className="card mb-4" style={{ border: '1px solid #e2e8f0' }}>
          <div className="card-header bg-white" style={{ borderBottom: '1px solid #e2e8f0' }}>
            <h6 style={{ margin: 0, color: '#334155' }}>
              <i className="fas fa-user-plus me-2" style={{ color: '#10b981' }}></i>
              Create New Staff Account
            </h6>
          </div>
          <div className="card-body">
            {userAlert && (
              <div className={`alert alert-${userAlert.type} py-2 mb-3`} style={{ fontSize: '0.85rem' }}>
                {userAlert.msg}
              </div>
            )}
            <form onSubmit={handleCreateUser} className="row g-2 align-items-center">
              <div className="col-md-3">
                <input type="text" className="form-control form-control-sm" placeholder="Full Name" required
                  value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} />
              </div>
              <div className="col-md-2">
                <input type="text" className="form-control form-control-sm" placeholder="Username" required
                  value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
              </div>
              <div className="col-md-2">
                <input type="password" className="form-control form-control-sm" placeholder="Password" required
                  value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
              <div className="col-md-2">
                <select className="form-select form-select-sm" 
                  value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="support">IT Support</option>
                </select>
              </div>
              <div className="col-md-3">
                <button type="submit" className="btn btn-success btn-sm w-100" disabled={userLoading}>
                  {userLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
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
            {user?.role === 'support'  && 'My Assigned Tasks'}
            {user?.role === 'employee' && 'My Ticket History'}
          </h6>
          {user?.role === 'employee' && (
            <button className="btn btn-primary btn-sm" style={{ borderRadius: 8 }}
              onClick={() => navigate('/tickets/new')}>
              <i className="fas fa-plus me-1"></i> New Ticket
            </button>
          )}
        </div>

        {/* Bulk Action Bar - ALWAYS VISIBLE FOR ADMINS */}
        {user?.role === 'admin' && (
          <div className="bg-light p-2 border-bottom d-flex align-items-center" style={{ gap: '10px' }}>
            <span className="fw-bold text-primary" style={{ fontSize: '0.85rem', paddingLeft: '15px', minWidth: '130px' }}>
              <i className="fas fa-check-square me-2"></i>
              {selectedTickets.length} selected
            </span>
            <select 
              className="form-select form-select-sm w-auto" 
              value={bulkAssignTo} 
              onChange={e => setBulkAssignTo(e.target.value)}
              disabled={selectedTickets.length === 0}
            >
              <option value="">-- Bulk Assign To --</option>
              <option value="unassigned">Unassigned</option>
              {supportUsers.map(su => (
                <option key={su.id} value={su.id}>{su.full_name} ({su.username})</option>
              ))}
            </select>
            <button 
              className="btn btn-primary btn-sm" 
              disabled={selectedTickets.length === 0 || !bulkAssignTo || bulkLoading}
              onClick={handleBulkAssign}
            >
              {bulkLoading ? 'Applying...' : 'Apply Assignment'}
            </button>
          </div>
        )}

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
            <table className="table mb-0 align-middle">
              <thead>
                <tr>
                  {user?.role === 'admin' && (
                    <th style={{ width: '40px', paddingLeft: '20px' }}>
                      <input 
                        type="checkbox" 
                        className="form-check-input"
                        onChange={handleSelectAll}
                        checked={selectedTickets.length === tickets.length && tickets.length > 0}
                      />
                    </th>
                  )}
                  <th style={{ paddingLeft: user?.role === 'admin' ? 0 : 20 }}>#ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  
                  {/* PRIORITY COLUMN RESTORED */}
                  <th>Priority</th>
                  
                  <th>Status</th>
                  {['admin', 'support'].includes(user?.role) && <th>Submitted By</th>}
                  
                  {user?.role === 'admin' ? <th>Assign To</th> : user?.role === 'support' ? <th>Assigned To</th> : null}
                  
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} className={selectedTickets.includes(ticket.id) ? 'table-active' : ''}>
                    
                    {user?.role === 'admin' && (
                      <td style={{ paddingLeft: '20px' }}>
                        <input 
                          type="checkbox" 
                          className="form-check-input"
                          checked={selectedTickets.includes(ticket.id)}
                          onChange={() => handleSelectTicket(ticket.id)}
                        />
                      </td>
                    )}
                    
                    <td style={{ paddingLeft: user?.role === 'admin' ? 0 : 20 }}>
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

                    {/* PRIORITY DATA RESTORED */}
                    <td>
                      <span className={`p-${ticket.priority?.toLowerCase()}`}>{ticket.priority}</span>
                    </td>

                    <td>{statusBadge(ticket.status)}</td>
                    
                    {['admin', 'support'].includes(user?.role) && (
                      <td>{ticket.creator_name}</td>
                    )}
                    
                    {user?.role === 'admin' && (
                      <td>
                        <select 
                          className="form-select form-select-sm" 
                          style={{ fontSize: '0.8rem', minWidth: '120px' }}
                          value={ticket.assigned_to || 'unassigned'}
                          onChange={(e) => handleSingleAssign(ticket.id, e.target.value)}
                        >
                          <option value="unassigned" className="text-muted">Unassigned</option>
                          {supportUsers.map(su => (
                            <option key={su.id} value={su.id}>{su.username}</option>
                          ))}
                        </select>
                      </td>
                    )}

                    {user?.role === 'support' && (
                      <td>
                        {ticket.assigned_name 
                          ? <span className="badge bg-light text-dark border"><i className="fas fa-user-check me-1 text-success"></i>{ticket.assigned_name}</span> 
                          : <span className="text-muted" style={{ fontSize: '0.8rem' }}>Unassigned</span>}
                      </td>
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
