import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Permanent role selection happens here during account creation
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'lecturer'
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Save permanently to Firestore users/{uid}
      await register(email, password, selectedRole);
      if (selectedRole === 'lecturer') {
        navigate('/lecturer');
      } else {
        navigate('/student');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in.');
      } else {
        setError('Failed to create account. Please check your network.');
      }
    } finally {
      setSubmitting(false);
    }
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
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #DCE4EC',
          boxShadow: '0 8px 30px rgba(23, 50, 77, 0.06)',
          padding: '36px 32px',
          boxSizing: 'border-box',
        }}
      >
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#17324D', margin: '0 0 4px' }}>
            Create Your Account
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            Select your permanent role to configure your Lectra workspace.
          </p>
        </div>

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
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Permanent Role Selection Cards */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#17324D', marginBottom: '8px' }}>
              I am joining Lectra as:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                onClick={() => setSelectedRole('student')}
                style={{
                  border: selectedRole === 'student' ? '2px solid #19A7A1' : '1px solid #DCE4EC',
                  backgroundColor: selectedRole === 'student' ? '#F0FDFA' : '#FFFFFF',
                  borderRadius: '10px',
                  padding: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>🎓</div>
                <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#17324D' }}>Student</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Join lectures & ask questions</div>
              </div>

              <div
                onClick={() => setSelectedRole('lecturer')}
                style={{
                  border: selectedRole === 'lecturer' ? '2px solid #17324D' : '1px solid #DCE4EC',
                  backgroundColor: selectedRole === 'lecturer' ? '#F1F5F9' : '#FFFFFF',
                  borderRadius: '10px',
                  padding: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>👨‍🏫</div>
                <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#17324D' }}>Lecturer</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Create sessions & moderate</div>
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', marginTop: '6px' }}>
              ℹ️ Your role is fixed to your account and cannot be swapped later.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#17324D', marginBottom: '6px' }}>
              University Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@university.edu"
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
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#17324D', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
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
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#17324D', marginBottom: '6px' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
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

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '11px',
              backgroundColor: '#19A7A1',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              marginTop: '6px',
            }}
          >
            {submitting ? 'Creating Account...' : 'Complete Registration →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', color: '#64748B' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0D9488', fontWeight: 700, textDecoration: 'none' }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
