import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { friendlyAuthError } from '../lib/errors';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Role Selection (Default to Student)
  const [role, setRole] = useState('student'); // 'student' | 'lecturer'

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Status & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    if (!agreedTerms) {
      setError('You must accept the Academic Terms of Service to create an account.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await register({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role, // Permanent role attached to user record
        department: department.trim() || undefined,
      });

      // Automatic direct routing based on registered role
      if (res?.user?.role === 'lecturer' || role === 'lecturer') {
        navigate('/lecturer', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const isLecturer = role === 'lecturer';
  const primaryThemeColor = isLecturer ? '#17324D' : '#19A7A1';

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
        padding: '40px 16px',
        fontFamily: "'Inter', sans-serif",
        color: '#243447',
        boxSizing: 'border-box',
      }}
    >
      {/* Centered Register Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 12px 36px rgba(23, 50, 77, 0.08)',
          border: '1px solid #DCE4EC',
          padding: '44px 38px',
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
              ACADEMIC
            </span>
          </div>

          <h1
            style={{
              fontSize: '1.55rem',
              fontWeight: 800,
              color: '#17324D',
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}
          >
            Create your account
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B', lineHeight: 1.45 }}>
            Join your university's live interactive lecture community and engage in real-time.
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

        {/* ================= STEP 1: PERMANENT ROLE SELECTION CARDS ================= */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17324D', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Academic Role *
            </label>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Permanent Account Role</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Student Card */}
            <div
              onClick={() => setRole('student')}
              style={{
                border: !isLecturer ? '2px solid #19A7A1' : '1px solid #DCE4EC',
                backgroundColor: !isLecturer ? '#F2FBF9' : '#FFFFFF',
                borderRadius: '12px',
                padding: '16px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: !isLecturer ? '#19A7A1' : '#F1F5F9',
                    color: !isLecturer ? '#FFFFFF' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                {!isLecturer ? (
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#19A7A1',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                    }}
                  >
                    ✓
                  </div>
                ) : (
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid #CBD5E1' }} />
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#17324D', display: 'block' }}>
                  Student
                </span>
                <span style={{ fontSize: '0.76rem', color: '#64748B', lineHeight: 1.35, display: 'block', marginTop: '2px' }}>
                  Ask questions anonymously & vote on live lecture topics.
                </span>
              </div>
            </div>

            {/* Lecturer Card */}
            <div
              onClick={() => setRole('lecturer')}
              style={{
                border: isLecturer ? '2px solid #17324D' : '1px solid #DCE4EC',
                backgroundColor: isLecturer ? '#F6F8FB' : '#FFFFFF',
                borderRadius: '12px',
                padding: '16px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isLecturer ? '#17324D' : '#F1F5F9',
                    color: isLecturer ? '#FFFFFF' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="14" x="3" y="3" rx="2" />
                    <path d="M3 9h18" />
                    <path d="m9 16 3-3 3 3" />
                  </svg>
                </div>

                {isLecturer ? (
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#17324D',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                    }}
                  >
                    ✓
                  </div>
                ) : (
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid #CBD5E1' }} />
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#17324D', display: 'block' }}>
                  Lecturer
                </span>
                <span style={{ fontSize: '0.76rem', color: '#64748B', lineHeight: 1.35, display: 'block', marginTop: '2px' }}>
                  Moderate Q&A, broadcast live polls & view analytics.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= STEP 2: USER CREDENTIALS FORM ================= */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full Name */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#17324D' }}>Full Name</label>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Legal or Campus alias</span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isLecturer ? 'e.g. Dr. Catherine Silva' : 'e.g. Sanduni Perera'}
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #DCE4EC',
                  fontSize: '0.92rem',
                  color: '#17324D',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = primaryThemeColor)}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#DCE4EC')}
              />
              <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
              </span>
            </div>
          </div>

          {/* University Email */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#17324D' }}>University Email</label>
              <span style={{ fontSize: '0.75rem', color: '#0D9488', fontWeight: 600 }}>.edu / campus ID</span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.ac.lk"
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #DCE4EC',
                  fontSize: '0.92rem',
                  color: '#17324D',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = primaryThemeColor)}
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

          {/* Department / Faculty (Optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#17324D', marginBottom: '6px' }}>
              Department or Faculty <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Faculty of Computing / Software Engineering"
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #DCE4EC',
                  fontSize: '0.92rem',
                  color: '#17324D',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = primaryThemeColor)}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#DCE4EC')}
              />
              <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18" />
                  <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                  <path d="M9 9h1" />
                  <path d="M9 13h1" />
                  <path d="M9 17h1" />
                  <path d="M14 9h1" />
                  <path d="M14 13h1" />
                  <path d="M14 17h1" />
                </svg>
              </span>
            </div>
          </div>

          {/* Passwords in 2 Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#17324D', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  style={{
                    width: '100%',
                    padding: '11px 36px 11px 14px',
                    borderRadius: '10px',
                    border: '1px solid #DCE4EC',
                    fontSize: '0.9rem',
                    color: '#17324D',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = primaryThemeColor)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#DCE4EC')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: '10px',
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
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#17324D', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #DCE4EC',
                  fontSize: '0.9rem',
                  color: '#17324D',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = primaryThemeColor)}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#DCE4EC')}
              />
            </div>
          </div>

          {/* Validation Checklist / Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#64748B' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: password.length >= 6 ? '#19A7A1' : '#CBD5E1' }} />
              Minimum 6 characters
            </span>
            <span style={{ color: '#0D9488', fontWeight: 600 }}>Campus SSO synced</span>
          </div>

          {/* Terms Checkbox */}
          <div style={{ marginTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#64748B', lineHeight: 1.45 }}>
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                style={{ accentColor: '#19A7A1', width: '15px', height: '15px', borderRadius: '4px', marginTop: '2px' }}
              />
              <span>
                By creating an account, you agree to Lectra's{' '}
                <a href="#terms" onClick={(e) => e.preventDefault()} style={{ color: '#19A7A1', fontWeight: 600, textDecoration: 'none' }}>
                  Academic Terms of Service
                </a>{' '}
                &{' '}
                <a href="#privacy" onClick={(e) => e.preventDefault()} style={{ color: '#19A7A1', fontWeight: 600, textDecoration: 'none' }}>
                  Privacy Policy
                </a>.
              </span>
            </label>
          </div>

          {/* Primary CTA Button */}
          <button
            type="submit"
            disabled={loading}
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
              marginTop: '6px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#13283E')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#17324D')}
          >
            {loading ? 'Creating account...' : `Create ${isLecturer ? 'Lecturer' : 'Student'} account →`}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0 16px', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.06em' }}>
            ALREADY HAVE AN ID?
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
        </div>

        {/* Log In Link */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.88rem',
              color: '#17324D',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Already registered? Log in ➔
          </Link>
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
        <a href="#help" style={{ color: '#64748B', textDecoration: 'none' }}>Help Desk</a>
      </footer>
    </div>
  );
}
