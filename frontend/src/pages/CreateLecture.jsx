import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { createLecture, setLectureStatus } from '../lib/lectures';


export default function CreateLecture() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [description, setDescription] = useState('');
  
  // The backend generates the real, unique session code when the lecture is created (US-10)
  const sessionCode = '------';
  
  // Settings & Controls
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [enablePolls, setEnablePolls] = useState(true);
  const [enableQnA, setEnableQnA] = useState(true);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // US-09: Create the lecture through the backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please provide a lecture title.');
      return;
    }
    if (!currentUser) {
      setError('You must be logged in as a lecturer to create a lecture.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // POST /api/lectures: the backend checks the lecturer role, creates a unique session code
      // and saves the lecture. Firestore rules do not let the browser write session codes.
      const created = await createLecture({
        subject: courseCode.trim().toUpperCase() || 'GENERAL',
        topic: title.trim(),
        scheduledAt: new Date(),
      });

      // "Launch" starts the lecture now. A lecturer may update the status of their own lecture.
      try {
        await setLectureStatus(created.id, 'live');
      } catch (statusError) {
        console.error('Lecture created, but it could not be marked live:', statusError);
      }

      navigate(`/lecture/${created.id}`, { replace: true });
    } catch (err) {
      console.error('Error creating lecture:', err);
      setError(err.message || 'Failed to create the lecture. Please try again.');
      setLoading(false);
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
        alignItems: 'center',
        padding: '40px 16px',
        fontFamily: "'Inter', sans-serif",
        color: '#243447',
        boxSizing: 'border-box',
      }}
    >
      {/* Navigation Breadcrumb */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <Link
          to="/lecturer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#17324D',
            textDecoration: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Dashboard
        </Link>
        <span
          style={{
            backgroundColor: '#E0F2FE',
            color: '#0369A1',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '12px',
          }}
        >
          LECTURER STUDIO
        </span>
      </div>

      {/* Main Form Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 12px 36px rgba(23, 50, 77, 0.08)',
          border: '1px solid #DCE4EC',
          padding: '38px 36px',
          boxSizing: 'border-box',
        }}
      >
        {/* Card Header */}
        <div style={{ marginBottom: '26px' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#17324D',
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}
          >
            Create New Lecture Session
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
            Set up an interactive room with live anonymous Q&A, slide synchronization, and real-time polling.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '22px',
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Lecture Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#17324D', marginBottom: '6px' }}>
              Lecture Topic or Title <span style={{ color: '#E11D48' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sorting Algorithms & Complexity Analysis"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1px solid #DCE4EC',
                fontSize: '0.92rem',
                color: '#17324D',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#19A7A1')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#DCE4EC')}
            />
          </div>

          {/* Course / Module Code */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#17324D', marginBottom: '6px' }}>
              Course Code / Module
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. CS101 or SE201"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1px solid #DCE4EC',
                fontSize: '0.92rem',
                color: '#17324D',
                outline: 'none',
                boxSizing: 'border-box',
                textTransform: 'uppercase',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#19A7A1')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#DCE4EC')}
            />
          </div>

          {/* Description / Learning Objectives */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#17324D', marginBottom: '6px' }}>
              Short Description / Agenda (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key concepts, syllabus module, or prerequisites for students..."
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1px solid #DCE4EC',
                fontSize: '0.9rem',
                color: '#17324D',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#19A7A1')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#DCE4EC')}
            />
          </div>

          {/* Alphanumeric Session PIN Box (US-10) */}
          <div
            style={{
              backgroundColor: '#F5FCFB',
              border: '1.5px solid #CCFBF1',
              borderRadius: '12px',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0D9488', letterSpacing: '0.04em', display: 'block' }}>
                STUDENT JOIN PIN (ALPHANUMERIC)
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  color: '#17324D',
                  display: 'block',
                  marginTop: '2px',
                }}
              >
                {sessionCode}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                The PIN is generated when you create the lecture. Students enter it on their home screen to join.
              </span>
            </div>
          </div>

          {/* Session Interaction Settings */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#17324D', marginBottom: '10px' }}>
              Interactive Features
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#17324D', display: 'block' }}>
                    Allow Anonymous Questions
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Students can submit Q&A queries without displaying their name.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowAnonymous}
                  onChange={(e) => setAllowAnonymous(e.target.checked)}
                  style={{ accentColor: '#19A7A1', width: '18px', height: '18px' }}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#17324D', display: 'block' }}>
                    Live Polling & Quizzes
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Enable interactive polls during slides and presentations.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enablePolls}
                  onChange={(e) => setEnablePolls(e.target.checked)}
                  style={{ accentColor: '#19A7A1', width: '18px', height: '18px' }}
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <Link
              to="/lecturer"
              style={{
                flex: 1,
                padding: '12px',
                textAlign: 'center',
                backgroundColor: '#FFFFFF',
                color: '#64748B',
                border: '1px solid #DCE4EC',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '12px',
                backgroundColor: '#17324D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(23, 50, 77, 0.18)',
              }}
            >
              {loading ? (
                'Creating in Firestore...'
              ) : (
                <>
                  <span>Launch Lecture Room</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}