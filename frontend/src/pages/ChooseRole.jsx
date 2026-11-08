import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function ChooseRole() {
  const { currentUser, setRole, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'lecturer'
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Quick Lecture PIN State
  const [quickCode, setQuickCode] = useState('');

  // Handle Permanent Role Submission (US-07)
  const handleConfirmRole = async () => {
    setSaving(true);
    setError(null);

    try {
      // Writes role directly to Firestore doc `users/{uid}`
      await setRole(selectedRole);

      // Navigate to the role's canonical dashboard
      if (selectedRole === 'lecturer') {
        navigate('/lecturer', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err) {
      console.error('Failed to save role to Firestore:', err);
      setError(err.message || 'Failed to update your academic role in Firestore. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Quick join: only students join lectures, so this saves the Student role and opens the join screen
  const handleQuickJoin = async (e) => {
    e.preventDefault();
    const clean = quickCode.trim().toUpperCase();
    if (clean.length !== 6) {
      setError('Please enter the 6-character session code.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await setRole('student');
      navigate(`/student?code=${clean}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not save your role. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isLecturer = selectedRole === 'lecturer';
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
        padding: '36px 16px',
        fontFamily: "'Inter', sans-serif",
        color: '#243447',
        boxSizing: 'border-box',
      }}
    >
      {/* Centered Role Selection Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
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
              ONBOARDING
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
            Choose your academic role
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B', lineHeight: 1.45 }}>
            Welcome, <strong>{currentUser?.displayName || currentUser?.email || 'Campus Member'}</strong>. Select your primary role to configure your permissions and workspace.
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

        {/* Role Selector Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
          {/* Student Card */}
          <div
            onClick={() => setSelectedRole('student')}
            style={{
              border: !isLecturer ? '2px solid #19A7A1' : '1px solid #DCE4EC',
              backgroundColor: !isLecturer ? '#F2FBF9' : '#FFFFFF',
              borderRadius: '14px',
              padding: '18px 16px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: !isLecturer ? '#19A7A1' : '#F1F5F9',
                  color: !isLecturer ? '#FFFFFF' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              {!isLecturer ? (
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#19A7A1',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  ✓
                </div>
              ) : (
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid #CBD5E1' }} />
              )}
            </div>

            <div>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#17324D', display: 'block' }}>
                Student
              </span>
              <span style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4, display: 'block', marginTop: '4px' }}>
                Join live lectures, ask anonymous questions, vote on classmate queries, and answer live polls.
              </span>
            </div>
          </div>

          {/* Lecturer Card */}
          <div
            onClick={() => setSelectedRole('lecturer')}
            style={{
              border: isLecturer ? '2px solid #17324D' : '1px solid #DCE4EC',
              backgroundColor: isLecturer ? '#F6F8FB' : '#FFFFFF',
              borderRadius: '14px',
              padding: '18px 16px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: isLecturer ? '#17324D' : '#F1F5F9',
                  color: isLecturer ? '#FFFFFF' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="14" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="m9 16 3-3 3 3" />
                </svg>
              </div>

              {isLecturer ? (
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#17324D',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  ✓
                </div>
              ) : (
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid #CBD5E1' }} />
              )}
            </div>

            <div>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#17324D', display: 'block' }}>
                Lecturer
              </span>
              <span style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4, display: 'block', marginTop: '4px' }}>
                Create lecture rooms, generate session PINs, moderate live Q&A, and view engagement analytics.
              </span>
            </div>
          </div>
        </div>

        {/* Notice Info Box */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '0.78rem',
            color: '#64748B',
            lineHeight: 1.45,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#17324D" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>
            <strong>Permanent Account Setting:</strong> This role will be bound to your account profile in Firestore to maintain academic integrity and lecture room security.
          </span>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          disabled={saving}
          onClick={handleConfirmRole}
          style={{
            width: '100%',
            padding: '13px',
            backgroundColor: primaryThemeColor,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.75 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.15s ease',
          }}
        >
          {saving ? 'Saving role to Firestore...' : `Continue as ${isLecturer ? 'Lecturer' : 'Student'} →`}
        </button>

        {/* Sign Out Option */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.82rem',
              color: '#94A3B8',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Signed in with wrong account? Sign out
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0 16px', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.06em' }}>
            NEED TO JOIN A LECTURE RIGHT NOW?
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
        </div>

        {/* Quick Alphanumeric Join (US-10 & US-11) */}
        <form onSubmit={handleQuickJoin} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            maxLength={6}
            value={quickCode}
            onChange={(e) => setQuickCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6))}
            placeholder="e.g. 482910 or CS101A"
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #DCE4EC',
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
              backgroundColor: '#17324D',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Join Live Room →
          </button>
        </form>
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
