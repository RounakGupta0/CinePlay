import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const MAIN_NAV = [
  {
    to: '/',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z" />
      </svg>
    ),
  },
  {
    to: '/explore',
    label: 'Explore',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
        <circle cx="12" cy="12" r="9" />
        <polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5" />
      </svg>
    ),
  },
  {
    to: '/subscriptions',
    label: 'Subscriptions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
        <path d="M4 6h16M7 3h10M3 10h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z" />
        <polygon points="10 13 15 15.5 10 18 10 13" />
      </svg>
    ),
  },
  {
    to: '/shorts',
    label: 'Shorts',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="19" height="19">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
];

const LIBRARY_NAV = [
  {
    to: '/library',
    label: 'Library',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
        <path d="m16 6 4 14M12 6v14M8 8v12M4 4v16" />
      </svg>
    ),
  },
  {
    to: '/history',
    label: 'History',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    ),
  },
  {
    to: '/watch-later',
    label: 'Watch Later',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 6 12 12 16 12" />
      </svg>
    ),
  },
  {
    to: '/liked',
    label: 'Liked Videos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    to: '/your-videos',
    label: 'Your Videos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
        <rect width="18" height="14" x="3" y="5" rx="2" />
        <polygon points="10 9 15 12 10 15 10 9" />
      </svg>
    ),
  },
];

const Sidebar = ({ collapsed, mobileOpen, onCloseMobile }) => {
  const { user } = useAuth();

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside className={`cineplay-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Logo inside Sidebar for Fixed Hierarchy & Mobile Drawer Header */}
      <div className="sidebar-brand-wrapper">
        <Link to="/" className="sidebar-brand-link" onClick={handleNavClick}>
          <div className="brand-logo-circle">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <polygon points="6 4 19 12 6 20 6 4" />
            </svg>
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="brand-text-block">
              <span className="brand-name font-display">CinePlay</span>
              <span className="brand-subtitle">CINEMA DIRECT</span>
            </div>
          )}
        </Link>
        {mobileOpen && (
          <button className="sidebar-mobile-close-btn" onClick={onCloseMobile} aria-label="Close sidebar">
            ✕
          </button>
        )}
      </div>

      <nav className="sidebar-scroll-area">
        {/* Main Section */}
        <div className="nav-group">
          {MAIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              title={collapsed && !mobileOpen ? item.label : undefined}
              onClick={handleNavClick}
            >
              <span className="nav-icon">{item.icon}</span>
              {(!collapsed || mobileOpen) && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-divider" />

        {/* Library Section */}
        <div className="nav-group">
          {(!collapsed || mobileOpen) && <div className="nav-section-title">LIBRARY</div>}
          {LIBRARY_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              title={collapsed && !mobileOpen ? item.label : undefined}
              onClick={handleNavClick}
            >
              <span className="nav-icon">{item.icon}</span>
              {(!collapsed || mobileOpen) && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* User Channel Shortcut if signed in */}
        {user && (!collapsed || mobileOpen) && (
          <>
            <div className="sidebar-divider" />
            <div className="nav-group creator-shortcut">
              <div className="nav-section-title">YOUR CHANNEL</div>
              <Link to={`/channel/${user._id}`} className="sidebar-nav-item channel-shortcut-item" onClick={handleNavClick}>
                <img
                  src={user.avatar?.url || `https://ui-avatars.com/api/?name=${user.username}&background=D6AD62&color=000`}
                  alt={user.username}
                  className="channel-mini-avatar"
                />
                <div className="channel-mini-meta">
                  <span className="channel-mini-name">{user.channelName || user.username}</span>
                  <span className="channel-mini-role">Creator</span>
                </div>
              </Link>
            </div>
          </>
        )}
      </nav>

      {/* Footer / Copyright */}
      {(!collapsed || mobileOpen) && (
        <div className="sidebar-footer-container">
          <div className="luxury-badge">
            <span className="gold-dot" />
            <span>ULTRA HD STREAMING</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
