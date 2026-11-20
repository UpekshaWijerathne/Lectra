import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionPin, setSessionPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Handle standard login (role is automatically determined from Firestore)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your university email and password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { role: resolvedRole } = await login(email, password);
      // Route automatically according to permanent role
      if (resolvedRole === 'lecturer') {
        navigate('/lecturer');
      } else {
        navigate('/student');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Failed to log in. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Google SSO login
  const handleGoogleLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { role: resolvedRole } = await loginWithGoogle();
      if (resolvedRole === 'lecturer') {
        navigate('/lecturer');
      } else {
        navigate('/student');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google sign-in was cancelled or failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Lecture PIN Join
  const handleJoinByPin = (e) => {
    e.preventDefault();
    const cleanPin = sessionPin.trim().toUpperCase();
    if (!cleanPin) {
      setError('Please enter a valid session PIN or code.');
      return;
    }
    navigate(`/room/${cleanPin}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F4F7FA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Inter', sans-serif",
        color: '#243447',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #DCE4EC',
          boxShadow: '0 8px 30px rgba(23, 50, 77, 0.06)',
          padding: '36px 32px',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Icon & Heading */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#17324D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: '#FFFFFF',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
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
              }}
            >
              Academic
            </span>
          </div>

          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#17324D', margin: '6px 0 4px' }}>
            Log in to Lectra
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            Enter your university credentials to continue.
          </p>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              fontSize: '0.8rem',
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#17324D', marginBottom: '6px' }}>
              University Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #DCE4EC',
                backgroundColor: '#F8FAFC',
                fontSize: '0.86rem',
                color: '#17324D',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17324D' }}>Password</label>
              <a href="#forgot" style={{ fontSize: '0.75rem', color: '#0D9488', textDecoration: 'none', fontWeight: 600 }}>
                Forgot password?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: '100%',
                  padding: '10px 36px 10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #DCE4EC',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.86rem',
                  color: '#17324D',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: 0,
                  fontSize: '0.8rem',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#64748B', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#19A7A1', width: '14px', height: '14px' }}
              />
              Remember this device
            </label>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>🔒 256-bit SSL</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '11px',
              backgroundColor: '#17324D',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s ease',
              marginTop: '4px',
            }}
          >
            {submitting ? 'Verifying...' : 'Log in to Lectra →'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
            or continue with
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
        </div>

        {/* Google SSO Button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #DCE4EC',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#17324D',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google Workspace
        </button>

        {/* Quick PIN Join Module */}
        <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid #F1F5F9' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
            Attending a lecture right now?
          </span>
          <form onSubmit={handleJoinByPin} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={sessionPin}
              onChange={(e) => setSessionPin(e.target.value.toUpperCase())}
              placeholder="Enter PIN (e.g. CS101)"
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #DCE4EC',
                backgroundColor: '#F8FAFC',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: '0.84rem',
                color: '#17324D',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '9px 14px',
                backgroundColor: '#19A7A1',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Join Room →
            </button>
          </form>
        </div>

        {/* Footer Link to Register */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', color: '#64748B' }}>
          New here?{' '}
          <Link to="/register" style={{ color: '#0D9488', fontWeight: 700, textDecoration: 'none' }}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

