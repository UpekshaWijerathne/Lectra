import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { friendlyAuthError } from '../lib/errors';
import { homePathForRole } from '../lib/roles';

export default function Login() {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where the user was heading before being sent to login (keeps ?code=... from join links)
  const from = location.state?.from;
  const redirectTarget = from ? `${from.pathname}${from.search || ''}` : null;

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  
  // Status State
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  // After any successful sign-in: role selection, the page the user wanted, or their home page
  const goAfterAuth = (res) => {
    if (!res?.role) navigate('/choose-role', { replace: true });
    else if (redirectTarget) navigate(redirectTarget, { replace: true });
    else navigate(homePathForRole(res.role), { replace: true });
  };

  // Sends Firebase's password reset email to the address typed above
  const handleForgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('Enter your email address first, then choose "Forgot password?".');
      return;
    }
    try {
      await resetPassword(email);
      setInfo(`If an account exists for ${email.trim()}, a password reset link is on its way.`);
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  };

  // Email / Password Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your university email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await login(email, password);
      goAfterAuth(res);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Google Workspace SSO (US-05)
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const res = await loginWithGoogle();
      // A new Google user has no role yet and goes to /choose-role
      goAfterAuth(res);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  // Alphanumeric Lecture Session Code Handler (US-10 & US-11)
  const handleCodeChange = (e) => {
    // Sanitize to alphanumeric uppercase, max 6 characters
    const clean = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    setSessionCode(clean);
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    const cleanCode = sessionCode.trim();
    if (cleanCode.length === 6) {
      // Joining needs an account: the student signs in and lands on the join screen with the code filled in
      navigate(`/student?code=${cleanCode}`);
    } else {
      setError('Please enter the 6-character session code.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F4F7FA',
        backgroundImage:
          'radial-gradient(at 0% 0%, rgba(25, 167, 161, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(23, 50, 77, 0.06) 0px, transparent 50%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '36px 16px',
        fontFamily: "'Inter', sans-serif",
        color: '#243447',
        boxSizing: 'border-box',
      }}
    >
      {/* Centered Auth Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 12px 36px rgba(23, 50, 77, 0.08)',
          border: '1px solid #DCE4EC',
          padding: '44px 36px',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Icon & Heading */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: '#17324D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              margin: '0 auto 14px',
              boxShadow: '0 4px 12px rgba(23, 50, 77, 0.15)',
            }}
          >
            {/* Academic Cap Icon */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#17324D', letterSpacing: '-0.02em' }}>
              Lectra
            </span>
            <span
              style={{
                backgroundColor: '#E6FFFA',
                color: '#0D9488',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                letterSpacing: '0.04em',
              }}
            >
              Academic
            </span>
          </div>

          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#17324D',
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}
          >
            Log in to Lectra
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B', lineHeight: 1.45 }}>
            Welcome back! Enter your university credentials to continue.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              padding: '11px 14px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              marginBottom: '20px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div
            role="status"
            style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
              color: '#065F46',
              fontSize: '0.85rem',
              lineHeight: 1.45,
            }}
          >
            {info}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#17324D', marginBottom: '6px' }}>
              University Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #DCE4EC',
                  fontSize: '0.92rem',
                  color: '#17324D',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#19A7A1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#DCE4EC')}
              />
              <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#17324D' }}>
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  handleForgotPassword();
                }}
                style={{ fontSize: '0.78rem', color: '#19A7A1', fontWeight: 600, textDecoration: 'none' }}
              >
                Forgot password?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #DCE4EC',
                  fontSize: '0.92rem',
                  color: '#17324D',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#19A7A1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#DCE4EC')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember me & Security Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748B' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#19A7A1', width: '15px', height: '15px', borderRadius: '4px' }}
              />
              Remember this device
            </label>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#0D9488', fontWeight: 600 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              256-bit SSL
            </span>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: '#17324D',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#13283E')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#17324D')}
          >
            {loading ? 'Logging in...' : 'Log in to Lectra →'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0 16px', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.06em' }}>
            OR CONTINUE WITH
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
        </div>

        {/* Google Workspace SSO Button (US-05) */}
        <button
          type="button"
          disabled={googleLoading || loading}
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '11px',
            backgroundColor: '#FFFFFF',
            color: '#17324D',
            border: '1px solid #DCE4EC',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            opacity: googleLoading ? 0.75 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
        >
          {/* Multi-color Google "G" icon */}
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27a7.227 7.227 0 0 1 0-4.54V6.58H1.25a11.97 11.97 0 0 0 0 10.84l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
          {googleLoading ? 'Connecting with Google...' : 'Continue with Google Workspace'}
        </button>

        {/* Register Account Link */}
        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <span style={{ fontSize: '0.86rem', color: '#64748B' }}>
            New here?{' '}
            <Link to="/register" style={{ color: '#17324D', fontWeight: 700, textDecoration: 'none' }}>
              Create an account
            </Link>
          </span>
        </div>

        {/* Student Quick-Join Alphanumeric Session Code (US-10 & US-11) */}
        <div
          style={{
            marginTop: '24px',
            backgroundColor: '#F5FCFB',
            borderRadius: '12px',
            border: '1.5px solid #CCFBF1',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#19A7A1" strokeWidth="2.5">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect width="8" height="8" x="8" y="8" rx="1" />
            </svg>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#17324D' }}>
              Joining live lecture as a student?
            </span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: '#64748B' }}>
            Enter your code, then sign in to join the live Q&A.
          </p>

          <form onSubmit={handleCodeSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              maxLength={6}
              value={sessionCode}
              onChange={handleCodeChange}
              placeholder="e.g. 482910 or CS101A"
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #99F6E4',
                fontSize: '0.9rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                letterSpacing: '0.12em',
                textAlign: 'center',
                textTransform: 'uppercase',
                color: '#17324D',
                outline: 'none',
                backgroundColor: '#FFFFFF',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '9px 16px',
                backgroundColor: '#19A7A1',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Join Room →
            </button>
          </form>
        </div>
      </div>

      {/* Footer Meta */}
      <footer
        style={{
          marginTop: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          fontSize: '0.76rem',
          color: '#94A3B8',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#19A7A1' }} />
          Lectra Campus Cloud v4.2
        </span>
        <a href="#privacy" style={{ color: '#64748B', textDecoration: 'none' }}>Privacy</a>
        <span>•</span>
        <a href="#terms" style={{ color: '#64748B', textDecoration: 'none' }}>Terms</a>
        <span>•</span>
        <a href="#help" style={{ color: '#64748B', textDecoration: 'none' }}>Help</a>
      </footer>
    </div>
  );
}