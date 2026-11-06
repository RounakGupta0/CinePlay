import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = ({ onToggleSidebar, sidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className={`cineplay-navbar ${mobileSearchOpen ? 'mobile-search-expanded' : ''}`}>
      {/* Left: Sidebar Toggle & CinePlay Brand (or Back Arrow if Mobile Search Active) */}
      <div className="navbar-left">
        {mobileSearchOpen ? (
          <button
            className="navbar-icon-btn mobile-search-back-btn"
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Back to navigation"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <>
            <button
              className="navbar-sidebar-toggle"
              onClick={onToggleSidebar}
              aria-label="Toggle Navigation"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="16" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <Link to="/" className="navbar-brand-link" title="CinePlay Home">
              <div className="navbar-brand-logo">
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                  <polygon points="6 4 19 12 6 20 6 4" />
                </svg>
              </div>
              <div className="navbar-brand-text">
                <span className="navbar-brand-name font-display">CinePlay</span>
                <span className="navbar-brand-sub">STUDIOS</span>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Center: Wide Rounded Search Bar Centered Horizontally */}
      <div className={`navbar-center ${mobileSearchOpen ? 'mobile-search-visible' : ''}`}>
        <form className="navbar-search-form" onSubmit={handleSearch}>
          <div className="search-bar-inner">
            <svg className="search-prefix-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search videos, short clips, creators, channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="navbar-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear Search"
              >
                ✕
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right: Theme Toggle, Upload Short, Upload, Notifications Bell, User Profile */}
      <div className="navbar-right">
        {/* Mobile Search Open Trigger Button (Hidden on Desktop) */}
        {!mobileSearchOpen && (
          <button
            className="navbar-icon-btn navbar-mobile-search-btn"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Search"
            title="Search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        )}
        {/* Light / Dark Theme Switcher Button */}
        <button
          className="navbar-icon-btn theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {user ? (
          <>
            {/* Dedicated Short Upload Link on Navbar */}
            <Link
              to="/upload?type=short"
              className="navbar-upload-short-btn"
              title="Upload a Short video (max 2 minutes)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                <rect x="6" y="2" width="12" height="20" rx="3" />
                <polygon points="10 8 15 12 10 16 10 8" fill="currentColor" stroke="none" />
              </svg>
              <span>+ Short</span>
            </Link>
            {/* Standard Upload Button in Champagne Gold */}
            <Link to="/upload" className="navbar-upload-btn" title="Upload Video">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Upload</span>
            </Link>

            {/* Notification Bell with Red Indicator */}
            <div className="navbar-bell-container" ref={notifRef}>
              <button
                className="navbar-icon-btn bell-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
                title="Notifications"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="19" height="19">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="notification-red-dot" />
              </button>

              {notifOpen && (
                <div className="navbar-popover notif-popover fade-in">
                  <div className="popover-header">
                    <h4>Notifications</h4>
                    <span className="notif-count">2 New</span>
                  </div>
                  <div className="notif-list">
                    <div className="notif-item unread">
                      <div className="notif-indicator" />
                      <div className="notif-content">
                        <p className="notif-title">New release from <strong>NeonVibe Studios</strong></p>
                        <span className="notif-time">15 minutes ago</span>
                      </div>
                    </div>
                    <div className="notif-item unread">
                      <div className="notif-indicator" />
                      <div className="notif-content">
                        <p className="notif-title">Your video <strong>"The Final Chapter"</strong> reached 10,000 views</p>
                        <span className="notif-time">2 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Circular User Profile Picture with Dropdown */}
            <div className="navbar-profile-container" ref={dropdownRef}>
              <button
                className="navbar-avatar-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User Menu"
              >
                <img
                  src={user.avatar?.url || `https://ui-avatars.com/api/?name=${user.username}&background=D6AD62&color=000`}
                  alt={user.username}
                  className="navbar-avatar-img"
                />
              </button>

              {dropdownOpen && (
                <div className="navbar-popover profile-popover fade-in">
                  <div className="profile-popover-header">
                    <img
                      src={user.avatar?.url || `https://ui-avatars.com/api/?name=${user.username}&background=D6AD62&color=000`}
                      alt={user.username}
                      className="popover-avatar"
                    />
                    <div className="popover-user-meta">
                      <div className="popover-display-name">{user.channelName || user.username}</div>
                      <div className="popover-handle">@{user.username}</div>
                    </div>
                  </div>

                  <div className="popover-divider" />

                  <Link to={`/channel/${user._id}`} className="popover-item" onClick={() => setDropdownOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    Your Channel
                  </Link>

                  <Link to="/your-videos" className="popover-item" onClick={() => setDropdownOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                      <rect width="18" height="14" x="3" y="5" rx="2" /><polygon points="10 9 15 12 10 15 10 9" />
                    </svg>
                    Studio & Videos
                  </Link>

                  <Link to="/settings" className="popover-item" onClick={() => setDropdownOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                    </svg>
                    Account Settings
                  </Link>

                  <div className="popover-divider" />

                  <button className="popover-item danger" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="navbar-auth-actions">
            <Link to="/login" className="btn-charcoal">Sign In</Link>
            <Link to="/register" className="btn-gold">Join CinePlay</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
