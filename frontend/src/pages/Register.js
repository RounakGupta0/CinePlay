import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Show/Hide Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!agreeTerms) {
      toast.warning('Please agree to the Terms and Conditions');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Generate valid unique username handle from Full Name
    const baseUsername = fullName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 24);

    const generatedUsername =
      baseUsername.length >= 3 ? baseUsername : `director_${Math.random().toString(36).substring(2, 8)}`;

    try {
      setLoading(true);
      const data = await register({
        username: generatedUsername,
        fullName: fullName.trim(),
        channelName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phoneNumber: phone.trim()
      });

      if (data.success) {
        if (data.verificationUrl) {
          setVerificationUrl(data.verificationUrl);
        }
        setRegisteredSuccess(true);
        toast.success('Registration successful! Please verify your email.');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Registration failed. Please check your information and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
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
      <div className="cineplay-auth-card signup-card">
        {/* ========================================================== */}
        {/* LEFT SECTION: CINEMATIC VISUAL SHOWCASE                    */}
        {/* ========================================================== */}
        <section
          className="auth-card-showcase signup-showcase"
          style={{ backgroundImage: `url(/images/signup-showcase-panel.jpg)` }}
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
            <h1>CinePlay - Your Next Chapter Starts Here.</h1>
            <p>Join a community where creators and viewers share their passion for stories.</p>
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

          {registeredSuccess ? (
            <div className="auth-success-state-container fade-in">
              <div className="auth-success-badge-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="36"
                  height="36"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 className="auth-success-state-title">Check Your Email</h2>
              <p className="auth-success-state-text">
                We have dispatched an activation ticket to{' '}
                <strong style={{ color: '#F5F5F7' }}>{email}</strong>.<br />
                Please verify your email address before signing in.
              </p>
              {verificationUrl ? (
                <div style={{ marginTop: 20, marginBottom: 20, padding: '16px', background: 'rgba(214, 173, 98, 0.08)', border: '1px solid rgba(214, 173, 98, 0.3)', borderRadius: 12, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.86rem', color: '#D6AD62', marginBottom: 12, lineHeight: 1.5 }}>
                    Cloud host firewall blocked outbound SMTP. Click below to verify your email directly:
                  </p>
                  <a
                    href={verificationUrl}
                    className="btn-gold-auth-action"
                    style={{ textDecoration: 'none', display: 'inline-block', padding: '10px 22px', fontSize: '0.9rem' }}
                  >
                    Verify Email Address
                  </a>
                </div>
              ) : null}
              <Link
                to="/login"
                className="btn-gold-auth-action"
                style={{ textDecoration: 'none', marginTop: verificationUrl ? 8 : 0 }}
              >
                Proceed to Sign In
              </Link>
            </div>
          ) : (
            <>
              {/* Headings */}
              <div className="auth-form-head">
                <h2 className="auth-form-title-gold">Create Your Account</h2>
                <p className="auth-form-subtitle-gray">
                  Become part of the CinePlay community.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form-stack">
                {/* Full Name Input */}
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
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="auth-input-pill"
                  />
                </div>

                {/* Email Address Input */}
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

                {/* Phone Number (Optional) Input */}
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
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <input
                    type="tel"
                    placeholder="Phone Number (Optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="auth-input-pill"
                  />
                </div>

                {/* Password Input with Lock Icon & Eye Visibility Toggle */}
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
                    minLength={6}
                    autoComplete="new-password"
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

                {/* Confirm Password Input with Lock Icon & Eye Visibility Toggle */}
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="auth-input-pill has-toggle"
                  />
                  <button
                    type="button"
                    className="auth-input-pill-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                  >
                    {showConfirmPassword ? (
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

                {/* Terms and Conditions Checkbox */}
                <div className="auth-form-suboptions" style={{ marginTop: 2 }}>
                  <label className="auth-suboption-checkbox">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      required
                    />
                    <span>
                      I agree to the{' '}
                      <span style={{ color: '#E2B96F' }}>
                        Terms and Conditions
                      </span>
                    </span>
                  </label>
                </div>

                {/* Golden Create Account Button */}
                <button
                  type="submit"
                  className="btn-gold-auth-action"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="auth-spinner-dots" />
                  ) : (
                    'Create Account'
                  )}
                </button>

                {/* Divider: OR SIGN UP WITH */}
                <div className="auth-or-divider">
                  <span className="auth-or-line" />
                  <span className="auth-or-label">OR SIGN UP WITH</span>
                  <span className="auth-or-line" />
                </div>

                {/* Google Sign-Up Button */}
                <button
                  type="button"
                  className="btn-google-auth-action"
                  onClick={handleGoogleSignUp}
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

              {/* Bottom Switch to Login */}
              <div className="auth-bottom-switch">
                <span>Already have an account?</span>
                <Link to="/login" className="auth-gold-switch-link">
                  Sign In
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Register;
