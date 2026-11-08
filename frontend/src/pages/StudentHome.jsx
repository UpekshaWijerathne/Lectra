import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getLecture, joinLecture } from '../lib/lectures';

export default function StudentHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State for user profile dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Sanduni');
  const initial = displayName.charAt(0).toUpperCase();

// Session code join (US-11). Share links open this page as /student?code=ABC234
  const [searchParams] = useSearchParams();
  const cleanCode = (value) => String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
  const [pinInput, setPinInput] = useState(() => cleanCode(searchParams.get('code')));
  const [joinError, setJoinError] = useState(null);
  const [joining, setJoining] = useState(false);
  const pinInputRef = useRef(null);

  // The app cannot list a student's lectures, so the last lecture joined is remembered in this browser.
  const storageKey = `lectra_last_lecture_${user?.uid || 'guest'}`;
  const [recentLecture, setRecentLecture] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let lectureId = null;
    try {
      lectureId = localStorage.getItem(storageKey);
    } catch {
      lectureId = null;
    }
    if (!lectureId) return undefined;
    getLecture(lectureId)
      .then((lec) => { if (!cancelled) setRecentLecture(lec); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [storageKey]);

  // Looks the code up through the backend (POST /api/lectures/join), which also records the student as a participant
  const handleJoinByPin = async (e) => {
    e.preventDefault();
    if (joining) return;
    const code = cleanCode(pinInput);
    if (code.length !== 6) {
      setJoinError('Enter the 6-character session code from your lecturer.');
      return;
    }

    setJoining(true);
    setJoinError(null);
    try {
      const lectureId = await joinLecture(code);
      try {
        localStorage.setItem(storageKey, lectureId);
      } catch {
        // storage is optional
      }
      navigate(`/lecture/${lectureId}`);
    } catch (err) {
      setJoinError(err.message || 'Could not join this lecture. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const lectureStatus = recentLecture?.status;
  const statusLabel = lectureStatus === 'live' ? '● LIVE NOW' : lectureStatus === 'ended' ? 'ENDED' : 'UPCOMING';
  const statusBadge = lectureStatus === 'live' ? { bg: '#FEE2E2', fg: '#EF4444' } : { bg: '#E2E8F0', fg: '#475569' };  

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#F4F7FA',
        fontFamily: "'Inter', sans-serif",
        color: '#243447',
      }}
    >
      {/* ================= LEFT SIDEBAR ================= */}
      <aside
        style={{
          width: '240px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #DCE4EC',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        {/* Brand Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 8px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: '#17324D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#17324D', letterSpacing: '-0.02em' }}>
            Lectra
          </span>
        </div>

        {/* Navigation links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#17324D',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home
          </button>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#64748B',
              fontWeight: 500,
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            My Lectures
          </button>

          <button
            onClick={() => (recentLecture ? navigate(`/lecture/${recentLecture.id}`) : pinInputRef.current?.focus())}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#64748B',
              fontWeight: 500,
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Live Q&A
          </button>
        </nav>

        {/* Sidebar Footer Log Out Button */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid #E2E8F0', marginTop: 'auto' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#B91C1C',
              fontWeight: 500,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Navbar */}
        <header
          style={{
            height: '68px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #DCE4EC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Search bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #DCE4EC',
              padding: '8px 14px',
              width: '380px',
              gap: '10px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search lectures, topics, or materials..."
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.88rem',
                color: '#243447',
                width: '100%',
              }}
            />
          </div>

          {/* Right Header: Notification & Interactive User Profile Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Notification Bell */}
            <button
              style={{
                position: 'relative',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#19A7A1',
                  borderRadius: '50%',
                }}
              />
            </button>

            {/* Profile Dropdown Container */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: dropdownOpen ? '#F1F5F9' : 'transparent',
                  border: '1px solid',
                  borderColor: dropdownOpen ? '#CBD5E1' : '#E2E8F0',
                  borderRadius: '24px',
                  padding: '4px 12px 4px 5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Circular Teal Avatar with Initial */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#19A7A1',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  {initial}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#17324D',
                      display: 'block',
                    }}
                  >
                    {displayName}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: '#64748B',
                    }}
                  >
                    Student
                  </span>
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="2.5"
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Popover Dropdown Menu (Permanent role - no role-switch button) */}
              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '240px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #DCE4EC',
                    boxShadow: '0 12px 32px rgba(23, 50, 77, 0.12)',
                    padding: '8px 0',
                    zIndex: 100,
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                  {/* Account Overview Header */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#17324D' }}>
                      {displayName}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#64748B',
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user?.email || 'sanduni@university.ac.lk'}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '6px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: '#E0F2F1',
                        color: '#00796B',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      Student Account
                    </span>
                  </div>

                  {/* Menu Actions */}
                  <div style={{ padding: '4px 0' }}>
                    <button
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        width: '100%',
                        padding: '9px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.85rem',
                        color: '#243447',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      Account Settings
                    </button>
                  </div>

                  <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '4px 0' }} />

                  {/* Log Out */}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#B91C1C',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ================= PAGE BODY ================= */}
        <main style={{ padding: '32px', maxWidth: '1240px', width: '100%', boxSizing: 'border-box' }}>
          {/* Welcome and PIN Join Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #DCE4EC',
              padding: '28px 32px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(23, 50, 77, 0.03)',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#17324D',
                  margin: '0 0 6px',
                  letterSpacing: '-0.02em',
                }}
              >
                Welcome back, {displayName}! 👋
              </h1>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B' }}>
                Join your ongoing lecture by entering the 6-digit session code provided by your lecturer.
              </p>
            </div>

            {/* Quick PIN Input Form */}
            <form onSubmit={handleJoinByPin} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                ref={pinInputRef}
                maxLength="6"
                placeholder="Session PIN"
                value={pinInput}
                onChange={(e) => setPinInput(cleanCode(e.target.value))}
                style={{
                  padding: '11px 16px',
                  width: '160px',
                  borderRadius: '8px',
                  border: '1.5px solid #DCE4EC',
                  fontSize: '1rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.1em',
                  outline: 'none',
                  color: '#17324D',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '11px 22px',
                  backgroundColor: '#19A7A1',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
              >
                {joining ? 'Joining...' : 'Join Lecture →'}
              </button>
            </form>
          </div>

          {joinError && (
            <div
              role="alert"
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px',
                color: '#991B1B',
                fontSize: '0.85rem',
              }}
            >
              {joinError}
            </div>
          )}

          {/* Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            {[
              { label: 'Upcoming Lectures', val: '—', icon: '📅', color: '#17324D' },
              { label: 'Questions Asked', val: '—', icon: '💬', color: '#19A7A1' },
              { label: 'Questions Upvoted', val: '—', icon: '👍', color: '#24688E' },
              { label: 'Participation Score', val: '—', icon: '⭐', color: '#F59E0B' },              
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #DCE4EC',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div style={{ fontSize: '1.6rem' }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: stat.color }}>{stat.val}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Active / Upcoming Lecture Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #DCE4EC',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#17324D' }}>
                Your Current & Upcoming Lectures
              </h2>
            </div>
            
            {recentLecture ? (
            <div
              style={{
                padding: '20px',
                borderRadius: '10px',
                border: '1.5px solid #19A7A1',
                backgroundColor: '#FAFCFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: statusBadge.bg,
                      color: statusBadge.fg,
                    }}
                  >
                    {statusLabel}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#17324D',
                      backgroundColor: '#EAF0F6',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    PIN: {recentLecture?.sessionCode || '------'}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px', color: '#17324D' }}>
                  {recentLecture ? `${recentLecture.subject} - ${recentLecture.topic}` : ''}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                  {recentLecture?.scheduledAt?.toDate ? recentLecture.scheduledAt.toDate().toLocaleString() : ''}
                </p>
              </div>

              <button
                onClick={() => navigate(`/lecture/${recentLecture.id}`)}
                style={{
                  padding: '11px 22px',
                  backgroundColor: '#19A7A1',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                }}
              >
                {lectureStatus === 'live' ? 'Join Live Stream →' : 'Open Lecture →'}
              </button>
            </div>
            ) : (
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B' }}>
              You have not joined a lecture yet. Enter a session code above to join one.
            </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
