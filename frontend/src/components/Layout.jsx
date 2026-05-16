import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navLink = (path) =>
    `nav-link${location.pathname === path ? ' active' : ''}`

  return (
    <>
      {/* ── Sidebar ── */}
      <div className="sidebar">
        <div className="sidebar-brand">
          <p className="brand-name">
            <i className="fas fa-headset me-2"></i>HelpDesk <span>Pro</span>
          </p>
          <small>IT Support Management</small>
        </div>

        <nav className="mt-2 flex-grow-1">
          <div className="sidebar-section-label">Main</div>

          <a className={navLink('/dashboard')} onClick={() => navigate('/dashboard')}>
            <i className="fas fa-th-large"></i> Dashboard
          </a>

          {user?.role === 'employee' && (
            <a className={navLink('/tickets/new')} onClick={() => navigate('/tickets/new')}>
              <i className="fas fa-plus-circle"></i> New Ticket
            </a>
          )}

          <div className="sidebar-section-label mt-2">Account</div>

          <a className="nav-link" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </a>
        </nav>

        <div className="sidebar-user d-flex align-items-center gap-2">
          <div className="user-avatar">
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
              {user?.full_name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>
              {user?.role === 'admin' && <i className="fas fa-shield-alt me-1"></i>}
              {user?.role === 'support' && <i className="fas fa-tools me-1"></i>}
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="main-content">
        {children}
      </div>
    </>
  )
}
