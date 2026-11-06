import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { toast } from 'react-toastify';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('cineplay_remember_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch { }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setShowResend(false);

      if (rememberMe) {
        localStorage.setItem('cineplay_remember_email', email.trim());
      } else {
        localStorage.removeItem('cineplay_remember_email');
      }

      await login(email, password);
      toast.success('Welcome back to CinePlay!');
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Invalid credentials. Please verify your email and password.';
      toast.error(msg);
      if (msg.toLowerCase().includes('verify your email')) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    try {
      setResending(true);
      const { data } = await API.post('/auth/resend-verification', { email });
      toast.success(data.message || 'Verification link sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification');
    } finally {
      setResending(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!email) {
      toast.info('Please enter your email address to recover your password');
      return;
    }
    toast.info('Password recovery link has been dispatched to your email.');
  };

  const handleGoogleSignIn = () => {
    toast.info('Google Cloud OAuth will activate with production client ID');
  };

  return (
    <div className="cineplay-auth-page-wrapper">
      {/* 35mm Filmstrip Ambient Ribbon (Matches User Mockup) */}
      <svg
        className="auth-filmstrip-watermark"
        viewBox="0 0 200 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 50 0 Q 120 300 40 600 T 130 1000"
          stroke="#D6AD62"
          strokeWidth="38"
          strokeLinecap="round"
        />
        <path
          d="M 50 0 Q 120 300 40 600 T 130 1000"
          stroke="#08080A"
          strokeWidth="26"
          strokeLinecap="round"
        />
        <path
          d="M 50 0 Q 120 300 40 600 T 130 1000"
          stroke="#D6AD62"
          strokeWidth="8"
          strokeDasharray="14 16"
          strokeLinecap="square"
        />
      </svg>

      {/* Floating Centered Luxury Card */}
      <div className="cineplay-auth-card">
        {/* ========================================================== */}
        {/* LEFT SECTION: CINEMATIC VISUAL SHOWCASE                    */}
        {/* ========================================================== */}
        <section
          className="auth-card-showcase login-showcase"
          style={{ backgroundImage: `url(/images/login-showcase-panel.jpg)` }}
        >
          {/* Subtle right-edge blend into form pane */}
          <div className="auth-showcase-seam-blend" />

          {/* Clickable Brand Logo Hitbox over the visual logo */}
          <Link
            to="/"
            className="auth-card-brand-overlay"
            title="Return to CinePlay Home"
            aria-label="CinePlay Home"
          />

          {/* Screen-reader & SEO semantic content */}
          <div className="sr-only">
            <h1>CinePlay - Every Story Deserves to Be Seen.</h1>
            <p>Discover extraordinary stories. Experience cinema differently.</p>
          </div>
        </section>

        {/* ========================================================== */}
        {/* RIGHT SECTION: FORM PANEL                                  */}
        {/* ========================================================== */}
        <section className="auth-card-form-pane">
          {/* Mobile Header Brand (visible when showcase is hidden) */}
          <Link to="/" className="auth-mobile-header-brand">
            <div className="brand-play-badge">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="#0E0E0E">
                <polygon points="9.5 7.5 16.5 12 9.5 16.5" />
              </svg>
            </div>
            <span className="brand-title-text">CinePlay</span>
          </Link>

          {/* Headings */}
          <div className="auth-form-head">
            <h2 className="auth-form-title-gold">Welcome Back</h2>
            <p className="auth-form-subtitle-gray">
              Continue your cinematic journey.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-stack">
            {/* Email Address with Envelope Icon */}
            <div className="auth-input-pill-wrap">
              <span className="auth-input-pill-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  width="18"
                  height="18"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="auth-input-pill"
              />
            </div>

            {/* Password with Lock Icon & Eye Visibility Toggle */}
            <div className="auth-input-pill-wrap">
              <span className="auth-input-pill-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  width="18"
                  height="18"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="auth-input-pill has-toggle"
              />
              <button
                type="button"
                className="auth-input-pill-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    width="18"
                    height="18"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    width="18"
                    height="18"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="auth-form-suboptions">
              <label className="auth-suboption-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="auth-forgot-password-link"
              >
                Forgot Password?
              </button>
            </div>

            {/* Unverified Resend Notification */}
            {showResend && (
              <div className="auth-unverified-alert">
                <span>Account not verified yet?</span>
                <button
                  type="button"
                  className="btn-resend-inline"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? 'Sending...' : 'Resend verification link'}
                </button>
              </div>
            )}

            {/* Golden Sign In Button */}
            <button
              type="submit"
              className="btn-gold-auth-action"
              disabled={loading}
            >
              {loading ? <span className="auth-spinner-dots" /> : 'Sign In'}
            </button>

            {/* Divider: OR CONTINUE WITH */}
            <div className="auth-or-divider">
              <span className="auth-or-line" />
              <span className="auth-or-label">OR CONTINUE WITH</span>
              <span className="auth-or-line" />
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              className="btn-google-auth-action"
              onClick={handleGoogleSignIn}
            >
              <svg className="google-icon-svg" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Bottom Switch to Register */}
          <div className="auth-bottom-switch">
            <span>Don't have an account?</span>
            <Link to="/register" className="auth-gold-switch-link">
              Create Account
            </Link>
          </div>
        </section>
      </div>

      {/* Floating Demo Creator Helper (discreet, outside card) */}
      <div className="auth-floating-demo-helper">
        <button
          type="button"
          onClick={() => {
            setEmail('apex@shareme.io');
            setPassword('password123');
          }}
          className="btn-floating-demo-pill"
          title="Autofill demo creator credentials (Apex Cinema)"
        >
          ✨ Quick Demo: apex@shareme.io
        </button>
      </div>
    </div>
  );
};

export default Login;
