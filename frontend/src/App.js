import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';

// Pages
import Home from './pages/Home';
import Watch from './pages/Watch';
import Shorts from './pages/Shorts';
import Search from './pages/Search';
import Trending from './pages/Trending';
import Explore from './pages/Explore';
import Library from './pages/Library';
import History from './pages/History';
import WatchLater from './pages/WatchLater';
import YourVideos from './pages/YourVideos';
import Subscriptions from './pages/Subscriptions';
import LikedVideos from './pages/LikedVideos';
import Upload from './pages/Upload';
import Channel from './pages/Channel';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();

  // On watch page, collapse or tuck sidebar so video has cinematic full width
  const isWatchPage = location.pathname.startsWith('/watch/');
  const isShortsPage = location.pathname.startsWith('/shorts');
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/verify-email');

  const toggleSidebar = () => {
    if (window.innerWidth <= 1024) {
      setMobileMenuOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  // Automatically close mobile/tablet drawer when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-root">
      {!isAuthPage && (
        <Navbar onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
      )}

      {mobileMenuOpen && (
        <div className="sidebar-mobile-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`page-layout ${isAuthPage ? 'auth-page-layout' : ''}`}>
        {!isAuthPage && (
          <Sidebar
            collapsed={sidebarCollapsed}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
        )}

        <main
          className={`main-content ${
            isAuthPage
              ? 'auth-content-mode'
              : isWatchPage
              ? (sidebarCollapsed ? 'sidebar-collapsed watch-mode' : 'watch-mode')
              : isShortsPage
              ? (sidebarCollapsed ? 'sidebar-collapsed shorts-mode' : 'shorts-mode')
              : sidebarCollapsed
              ? 'sidebar-collapsed'
              : ''
          }`}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shorts" element={<Shorts />} />
            <Route path="/shorts/:id" element={<Shorts />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/search" element={<Search />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/library" element={<Library />} />
            <Route path="/history" element={<History />} />
            <Route path="/watch-later" element={<WatchLater />} />
            <Route
              path="/your-videos"
              element={
                <ProtectedRoute>
                  <YourVideos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute>
                  <Subscriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/liked"
              element={
                <ProtectedRoute>
                  <LikedVideos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route path="/channel/:id" element={<Channel />} />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route
              path="*"
              element={
                <div className="empty-cinema-slate" style={{ background: '#121212', border: '1px dashed #242424', borderRadius: 14, padding: '80px 24px', textAlign: 'center', marginTop: 40 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎞️</div>
                  <h2 className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 8 }}>
                    Feature Not Found
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
                    The cinematic feature or projection coordinate you requested does not exist.
                  </p>
                  <a href="/" className="btn-gold" style={{ textDecoration: 'none' }}>
                    Return to Cinema Home
                  </a>
                </div>
              }
            />
          </Routes>
        </main>
      </div>

      {!isAuthPage && <MobileBottomNav />}

      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === 'light' ? 'light' : 'dark'}
        toastStyle={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#171717',
          color: theme === 'light' ? '#121316' : '#F8FAFC',
          border: theme === 'light' ? '1px solid rgba(179, 134, 40, 0.35)' : '1px solid rgba(214, 173, 98, 0.25)',
          borderRadius: '10px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)'
        }}
      />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppLayout />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
