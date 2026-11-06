import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const VerifyEmail = () => {
  const { token } = useParams();
  const { updateUser } = useAuth();

  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const verify = async () => {
      try {
        const { data } = await API.get(`/auth/verify/${token}`);
        if (isMounted) {
          if (data.success) {
            setStatus('success');
            setMessage(data.message || 'Email successfully verified!');
            if (data.token && data.user) {
              localStorage.setItem('sm_token', data.token);
              updateUser(data.user);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
        }
      }
    };

    if (token) {
      verify();
    }
    return () => { isMounted = false; };
  }, [token, updateUser]);

  return (
    <div className="auth-page-wrapper fade-in">
      <div className="auth-card text-center">
        {status === 'verifying' && (
          <div>
            <div className="spinner" style={{ margin: '20px auto' }}></div>
            <h2 className="font-serif">Validating Credentials...</h2>
            <p className="auth-subtitle">Please hold on while we confirm your CinePlay membership.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="verify-status-badge success-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="40" height="40">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="font-serif">Membership Verified</h2>
            <p className="auth-subtitle">{message}</p>
            <div style={{ marginTop: 24 }}>
              <Link to="/" className="btn-auth-submit" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Enter CinePlay & Watch
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="verify-status-badge error-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="40" height="40">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h2 className="font-serif">Verification Failed</h2>
            <p className="auth-subtitle">{message}</p>
            <div style={{ marginTop: 24 }}>
              <Link to="/login" className="btn-auth-submit" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Go to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
