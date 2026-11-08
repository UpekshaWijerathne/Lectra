import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

export default function LecturerDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Firestore Real-Time State
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'completed'

  // UI Dropdowns & Copy Feedback
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // US-09: Real-time listener for lecturer's lectures from Firestore
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Query lectures created by this authenticated lecturer
    const q = query(
      collection(db, 'lectures'),
      where('lecturerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedLectures = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Real lectures use subject/topic and the statuses scheduled | live | ended (firestore.rules).
          // The screen shows them as title/course code and Active | Ended.
          fetchedLectures.push({
            id: docSnap.id,
            ...data,
            title: data.topic,
            courseCode: data.subject,
            status: data.status === 'ended' ? 'completed' : 'active',
          });
        });

        // Sort client-side by createdAt descending (newest first)
        fetchedLectures.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setLectures(fetchedLectures);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore listener error on LecturerDashboard:', err);
        setError('Failed to load your lectures from Firestore. Please check your connection.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Copy alphanumeric session PIN to clipboard
  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Toggle lecture status (Active / Ended) in Firestore
  const handleToggleStatus = async (lectureId, currentStatus, e) => {
    e.stopPropagation();
    try {
      // firestore.rules only accepts scheduled | live | ended
      const newStatus = currentStatus === 'active' ? 'ended' : 'live';
      const lectureRef = doc(db, 'lectures', lectureId);
      await updateDoc(lectureRef, {
        status: newStatus,
      });
    } catch (err) {
      console.error('Error updating lecture status:', err);
      alert('Could not update lecture status.');
    }
  };

  // Filtered lectures list
  const filteredLectures = lectures.filter((lec) => {
    const matchesSearch =
      lec.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lec.courseCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lec.sessionCode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : lec.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Dynamic Statistics computed from real Firestore docs
  const activeLecturesCount = lectures.filter((l) => l.status === 'active').length;
  const totalStudentsCount = lectures.reduce((acc, l) => acc + (l.studentCount || 0), 0);
  const totalQuestionsCount = lectures.reduce((acc, l) => acc + (l.questionCount || 0), 0);

  const lecturerDisplayName =
    currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Lecturer';

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
      {/* Left Navigation Rail */}
      <aside
        style={{
          width: '250px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #DCE4EC',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px 24px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#17324D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#17324D', letterSpacing: '-0.02em', display: 'block' }}>
              Lectra
            </span>
            <span style={{ fontSize: '0.7rem', color: '#0D9488', fontWeight: 700, letterSpacing: '0.04em' }}>
              LECTURER HUB
            </span>
          </div>
        </div>

        {/* Primary Action: Canonical New Lecture Route */}
        <Link
          to="/lecturer/new"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: '#17324D',
            color: '#FFFFFF',
            textDecoration: 'none',
            padding: '12px 14px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.88rem',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(23, 50, 77, 0.15)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Lecture
        </Link>

        {/* Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <Link
            to="/lecturer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: '#E6FFFA',
              color: '#0D9488',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
            My Lectures
          </Link>

          <a
            href="#analytics"
            onClick={(e) => e.preventDefault()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              color: '#64748B',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.88rem',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Analytics & Reports
          </a>

          <a
            href="#settings"
            onClick={(e) => e.preventDefault()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              color: '#64748B',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.88rem',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Room Settings
          </a>
        </nav>

        {/* Sidebar Sign Out */}
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#94A3B8',
            fontSize: '0.84rem',
            cursor: 'pointer',
            textAlign: 'left',
            borderRadius: '8px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: '70px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #DCE4EC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
          }}
        >
          {/* Quick Search */}
          <div style={{ position: 'relative', width: '320px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lectures or session PINs..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #DCE4EC',
                fontSize: '0.86rem',
                color: '#17324D',
                outline: 'none',
                backgroundColor: '#F8FAFC',
              }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>

          {/* User Profile dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#17324D',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {lecturerDisplayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#17324D', display: 'block' }}>
                  {lecturerDisplayName}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Faculty Lecturer</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {showProfileMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '48px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DCE4EC',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(23, 50, 77, 0.12)',
                  width: '180px',
                  padding: '6px 0',
                  zIndex: 20,
                }}
              >
                <div style={{ padding: '8px 14px', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Logged in as</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#17324D', wordBreak: 'break-all' }}>
                    {currentUser?.email}
                  </span>
                </div>
                <button
                  onClick={logout}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    color: '#B91C1C',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Body */}
        <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
          {/* Welcome Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#17324D', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Welcome back, Prof. {lecturerDisplayName} 👋
              </h1>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B' }}>
                Manage your real-time lecture sessions, track student questions, and launch live polls.
              </p>
            </div>

            <Link
              to="/lecturer/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#19A7A1',
                color: '#FFFFFF',
                textDecoration: 'none',
                padding: '11px 18px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                boxShadow: '0 4px 14px rgba(25, 167, 161, 0.25)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Lecture Session
            </Link>
          </div>

          {/* Metric Cards (Real Firestore Aggregates) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '32px' }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                padding: '20px 22px',
                border: '1px solid #DCE4EC',
                boxShadow: '0 4px 16px rgba(23, 50, 77, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
                  ACTIVE SESSIONS
                </span>
                <span
                  style={{
                    backgroundColor: '#E6FFFA',
                    color: '#0D9488',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  LIVE NOW
                </span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#17324D' }}>
                {activeLecturesCount}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                padding: '20px 22px',
                border: '1px solid #DCE4EC',
                boxShadow: '0 4px 16px rgba(23, 50, 77, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
                  TOTAL LECTURES
                </span>
                <span style={{ color: '#0369A1', backgroundColor: '#E0F2FE', padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                  FIRESTORE
                </span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#17324D' }}>
                {lectures.length}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                padding: '20px 22px',
                border: '1px solid #DCE4EC',
                boxShadow: '0 4px 16px rgba(23, 50, 77, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
                  STUDENT QUESTIONS
                </span>
                <span style={{ color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                  ENGAGEMENT
                </span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#17324D' }}>
                {totalQuestionsCount}
              </div>
            </div>
          </div>

          {/* Section Header & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#17324D', margin: 0 }}>
                Your Lecture Sessions
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Real-time Firestore sync enabled
              </span>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', backgroundColor: '#FFFFFF', padding: '4px', borderRadius: '10px', border: '1px solid #DCE4EC' }}>
              <button
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'all' ? '#17324D' : 'transparent',
                  color: statusFilter === 'all' ? '#FFFFFF' : '#64748B',
                }}
              >
                All ({lectures.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'active' ? '#19A7A1' : 'transparent',
                  color: statusFilter === 'active' ? '#FFFFFF' : '#64748B',
                }}
              >
                Active ({activeLecturesCount})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'completed' ? '#64748B' : 'transparent',
                  color: statusFilter === 'completed' ? '#FFFFFF' : '#64748B',
                }}
              >
                Ended
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #DCE4EC',
                  borderTopColor: '#19A7A1',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 12px',
                }}
              />
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Syncing lectures from Firestore...</span>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredLectures.length === 0 && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1.5px dashed #DCE4EC',
                padding: '48px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  backgroundColor: '#F0FDFA',
                  color: '#0D9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#17324D', margin: '0 0 8px' }}>
                {searchQuery ? 'No matching lectures found' : 'No lectures created yet'}
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748B', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.45 }}>
                {searchQuery
                  ? 'Try searching with a different term or clear the filter.'
                  : 'Get started by creating your first interactive lecture session. Students will be able to join with a 6-character PIN.'}
              </p>
              {!searchQuery && (
                <Link
                  to="/lecturer/new"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#17324D',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    padding: '11px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                  }}
                >
                  Create Your First Lecture →
                </Link>
              )}
            </div>
          )}

          {/* Lectures Grid */}
          {!loading && filteredLectures.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {filteredLectures.map((lec) => {
                const isActive = lec.status === 'active';
                const sessionPin = lec.sessionCode || '------';

                return (
                  <div
                    key={lec.id}
                    onClick={() => navigate(`/lecture/${lec.id}`)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: isActive ? '1.5px solid #CCFBF1' : '1px solid #DCE4EC',
                      boxShadow: '0 6px 20px rgba(23, 50, 77, 0.05)',
                      padding: '22px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 24px rgba(23, 50, 77, 0.09)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(23, 50, 77, 0.05)';
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span
                          style={{
                            backgroundColor: '#E0F2FE',
                            color: '#0369A1',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {lec.courseCode || 'GENERAL'}
                        </span>

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: isActive ? '#0D9488' : '#64748B',
                            backgroundColor: isActive ? '#E6FFFA' : '#F1F5F9',
                            padding: '3px 9px',
                            borderRadius: '12px',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: isActive ? '#10B981' : '#94A3B8',
                            }}
                          />
                          {isActive ? 'LIVE / ACTIVE' : 'CONCLUDED'}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: '#17324D',
                          margin: '0 0 6px',
                          lineHeight: 1.35,
                        }}
                      >
                        {lec.title}
                      </h3>
                      {lec.description && (
                        <p
                          style={{
                            margin: '0 0 14px',
                            fontSize: '0.82rem',
                            color: '#64748B',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {lec.description}
                        </p>
                      )}

                      {/* Join PIN Widget */}
                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '12px',
                          marginBottom: '16px',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', display: 'block' }}>
                            STUDENT JOIN PIN
                          </span>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '1.1rem',
                              fontWeight: 800,
                              letterSpacing: '0.12em',
                              color: '#17324D',
                            }}
                          >
                            {sessionPin}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(sessionPin, e)}
                          style={{
                            backgroundColor: copiedCode === sessionPin ? '#0D9488' : '#FFFFFF',
                            color: copiedCode === sessionPin ? '#FFFFFF' : '#17324D',
                            border: '1px solid #DCE4EC',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {copiedCode === sessionPin ? 'Copied! ✓' : 'Copy PIN'}
                        </button>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '14px',
                        borderTop: '1px solid #F1F5F9',
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(lec.id, lec.status, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748B',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '4px 0',
                          textDecoration: 'underline',
                        }}
                      >
                        {isActive ? 'Mark as Concluded' : 'Reactivate Room'}
                      </button>

                      <span
                        style={{
                          color: '#19A7A1',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        Launch Studio →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
