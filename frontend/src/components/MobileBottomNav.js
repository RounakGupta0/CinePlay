import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MobileBottomNav.css';

const MobileBottomNav = () => {
  const { user } = useAuth();

  return (
    <nav className="cineplay-mobile-bottom-nav" aria-label="Mobile Navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `mobile-nav-tab ${isActive ? 'active-tab' : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z" />
        </svg>
        <span className="mobile-nav-label">Home</span>
      </NavLink>

      <NavLink
        to="/shorts"
        className={({ isActive }) => `mobile-nav-tab ${isActive ? 'active-tab' : ''}`}
        aria-label="Explore Shorts"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span className="mobile-nav-label">Shorts</span>
      </NavLink>

      <NavLink
        to={user ? '/upload' : '/login'}
        className="mobile-nav-tab mobile-nav-create-btn"
        title="Upload Video or Short"
        aria-label="Upload Video"
      >
        <div className="create-circle-gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" width="20" height="20">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </NavLink>

      <NavLink
        to={user ? '/subscriptions' : '/login'}
        className={({ isActive }) => `mobile-nav-tab ${isActive ? 'active-tab' : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
          <path d="M4 6h16M7 3h10M3 10h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z" />
          <polygon points="10 13 15 15.5 10 18 10 13" />
        </svg>
        <span className="mobile-nav-label">Subscriptions</span>
      </NavLink>

      <NavLink
        to={user ? '/library' : '/login'}
        className={({ isActive }) => `mobile-nav-tab ${isActive ? 'active-tab' : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
          <path d="m16 6 4 14M12 6v14M8 8v12M4 4v16" />
        </svg>
        <span className="mobile-nav-label">Library</span>
      </NavLink>
    </nav>
  );
};

export default MobileBottomNav;
