import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { subscribeToQuestions, submitQuestion } from '../lib/questions';
import { friendlyQuestionError } from '../lib/questionData';

export default function LectureRoom() {
  const { lectureId } = useParams();
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();

  // Lecture & Room State
  const [lecture, setLecture] = useState(null);
  const [loadingLecture, setLoadingLecture] = useState(true);
  const [lectureError, setLectureError] = useState(null);

  // --------------------------------------------------------------------------
  // Question Submission State & Firestore Listeners
  // --------------------------------------------------------------------------
  const [questions, setQuestions] = useState([]);
  const [questionsError, setQuestionsError] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Header and slide navigation state
  const [currentSlide, setCurrentSlide] = useState(3);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Only students who joined the lecture can ask questions (firestore.rules)
  const isLecturer = role === 'lecturer' || role === 'admin';

  // 1. Lecture details. The route parameter is the lecture id: students get it by joining with a
  //    session code (POST /api/lectures/join), lecturers by creating the lecture.
  useEffect(() => {
    if (!lectureId) {
      setLectureError('No lecture identifier provided.');
      setLoadingLecture(false);
      return undefined;
    }

    setLoadingLecture(true);
    setLectureError(null);

    const unsubscribe = onSnapshot(
      doc(db, 'lectures', lectureId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Real lectures use subject/topic; this screen shows them as course code and title
          setLecture({ id: docSnap.id, ...data, title: data.topic, courseCode: data.subject });
          setLectureError(null);
        } else {
          setLecture(null);
          setLectureError('Lecture session not found or has been concluded.');
        }
        setLoadingLecture(false);
      },
      (err) => {
        console.error('Error listening to lecture:', err);
        setLectureError('Failed to synchronize lecture session.');
        setLoadingLecture(false);
      }
    );

    return () => unsubscribe();
  }, [lectureId]);

  // 2. Real-time questions (top-level `questions` collection, filtered by lectureId).
  //    Firestore only allows this for the lecture's owner and for students who joined it.
  const loadedLectureId = lecture?.id;
  useEffect(() => {
    if (!loadedLectureId) return undefined;

    return subscribeToQuestions(
      loadedLectureId,
      (items) => {
        // Newest first. The author is private, so the list shows "Anonymous" or "Student".
        setQuestions(
          items.map((q) => ({
            ...q,
            authorName: q.isAnonymous ? 'Anonymous' : 'Student',
            status: 'pending',
          }))
        );
        setQuestionsError(null);
      },
      (err) => {
        console.error('Error fetching questions:', err);
        setQuestions([]);
        setQuestionsError(friendlyQuestionError(err, 'load'));
      }
    );
  }, [loadedLectureId]);

  // --------------------------------------------------------------------------
  // Question Submission UI and Firestore Write (T-15)
  // --------------------------------------------------------------------------
  const handleQuestionSubmit = async (e) => {
    if (e) e.preventDefault();

    const trimmedText = questionText.trim();
    if (!trimmedText) {
      setSubmitError('Please enter your question before submitting.');
      return;
    }

    if (!lecture || isSubmitting) return;

    if (lecture.status === 'ended') {
      setSubmitError('This lecture has ended, so new questions are closed.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Writes questions/{id} and the private questionAuthors/{id} in one batch,
      // with exactly the fields firestore.rules requires.
      await submitQuestion({
        lectureId: lecture.id,
        authorId: currentUser.uid,
        text: trimmedText,
        isAnonymous: false, // the anonymous option arrives with T-18
      });

      // Reset input & provide feedback
      setQuestionText('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 2500);
    } catch (err) {
      console.error('Error submitting question:', err);
      setSubmitError(friendlyQuestionError(err, 'submit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut: Enter to submit, Shift+Enter for new line
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuestionSubmit(e);
    }
  };

  // Loading State
  if (loadingLecture) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F4F7FA',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', sans-serif",
          color: '#17324D',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid #DCE4EC',
            borderTopColor: '#19A7A1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '14px',
          }}
        />
        <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#64748B' }}>
          Entering Lecture Room...
        </span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error State
  if (lectureError || !lecture) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F4F7FA',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#17324D', margin: '0 0 8px' }}>
          {lectureError || 'Lecture Unavailable'}
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#64748B', maxWidth: '400px', margin: '0 0 20px', lineHeight: 1.5 }}>
          The lecture code provided is invalid or the session has ended.
        </p>
        <Link
          to={role === 'lecturer' ? '/lecturer' : '/student'}
          style={{
            padding: '9px 18px',
            backgroundColor: '#17324D',
            color: '#FFFFFF',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.86rem',
          }}
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const exitPath = role === 'lecturer' ? '/lecturer' : '/student';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#F4F7FA',
        fontFamily: "'Inter', sans-serif",
        color: '#243447',
        overflow: 'hidden',
      }}
    >
      {/* Top Application Bar */}
      <header
        style={{
          height: '64px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #DCE4EC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to={exitPath} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#17324D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <span style={{ fontSize: '1.18rem', fontWeight: 800, color: '#17324D' }}>Lectra</span>
          </Link>

          <div style={{ height: '18px', width: '1px', backgroundColor: '#DCE4EC' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#17324D' }}>
              {lecture.courseCode ? `${lecture.courseCode} - ` : ''}{lecture.title}
            </span>
            <span
              style={{
                backgroundColor: '#F0FDFA',
                border: '1px solid #99F6E4',
                color: '#0D9488',
                fontSize: '0.72rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              PIN: {lecture.sessionCode || '------'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#17324D',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.82rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
            </button>

            {showProfileMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '40px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DCE4EC',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(23, 50, 77, 0.1)',
                  width: '180px',
                  padding: '6px 0',
                  zIndex: 30,
                }}
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9', fontSize: '0.78rem', color: '#64748B' }}>
                  {currentUser?.email || 'Student User'}
                </div>
                <button
                  onClick={logout}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    color: '#DC2626',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>

          <Link
            to={exitPath}
            style={{
              padding: '7px 14px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
            }}
          >
            Leave Room
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Presentation Slide View (Left) */}
        <div style={{ flex: 1, display: 'flex', padding: '20px', gap: '16px', minWidth: 0, overflowY: 'auto' }}>
          {/* Thumbnails rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '52px', flexShrink: 0 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setCurrentSlide(n)}
                style={{
                  height: '48px',
                  width: '52px',
                  backgroundColor: '#FFFFFF',
                  border: n === currentSlide ? '2px solid #19A7A1' : '1px solid #DCE4EC',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  color: n === currentSlide ? '#0D9488' : '#64748B',
                  cursor: 'pointer',
                }}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Presentation Slide */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #DCE4EC',
              boxShadow: '0 4px 16px rgba(23, 50, 77, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              padding: '36px',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0D9488', letterSpacing: '0.05em', marginBottom: '8px' }}>
              MODULE 4 • ALGORITHMS & DATA STRUCTURES
            </span>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#17324D', margin: '0 0 24px' }}>
              Sorting Algorithms
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.96rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#19A7A1' }} />
                What is sorting?
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#19A7A1' }} />
                Types of sorting algorithms (Comparison vs Non-comparison)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#19A7A1' }} />
                Time & Space complexity analysis (Best, Average, Worst)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#19A7A1' }} />
                Real-world applications & cache-friendly implementations
              </li>
            </ul>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Right Sidebar: Question Feed & Submission UI Composer        */}
        {/* ------------------------------------------------------------------ */}
        <aside
          style={{
            width: '400px',
            backgroundColor: '#FFFFFF',
            borderLeft: '1px solid #DCE4EC',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #DCE4EC',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#17324D' }}>
              Live Questions
            </h3>
            <span
              style={{
                backgroundColor: '#E2E8F0',
                color: '#475569',
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {questions.length} total
            </span>
          </div>

          {/* Real-time Questions Feed */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >

            {questionsError && (
              <div
                style={{
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  fontSize: '0.76rem',
                  padding: '6px 10px',
                  borderRadius: '6px',
                }}
              >
                {questionsError}
              </div>
            )}

            {questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 8px' }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600, color: '#17324D' }}>No questions yet</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.76rem' }}>Be the first to submit a question below.</p>
              </div>
            ) : (
              questions.map((q) => (
                <div
                  key={q.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    padding: '14px',
                    boxShadow: '0 2px 4px rgba(23, 50, 77, 0.02)',
                  }}
                >
                  <p style={{ margin: '0 0 8px', fontSize: '0.86rem', fontWeight: 600, color: '#17324D', lineHeight: 1.42, wordBreak: 'break-word' }}>
                    {q.text}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#94A3B8' }}>
                    <span style={{ fontWeight: 600, color: '#0369A1' }}>{q.authorName || 'Student'}</span>
                    <span>{q.status === 'answered' ? '✓ Answered' : 'Pending'}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Question Submission Composer Component                       */}
          {/* ---------------------------------------------------------------- */}
          {!isLecturer && (
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid #DCE4EC',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 -3px 12px rgba(23, 50, 77, 0.03)',
            }}
          >
            {/* Feedback Banners */}
            {submitError && (
              <div
                style={{
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  fontSize: '0.76rem',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                }}
              >
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div
                style={{
                  backgroundColor: '#DCFCE7',
                  border: '1px solid #BBF7D0',
                  color: '#15803D',
                  fontSize: '0.76rem',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  fontWeight: 600,
                }}
              >
                ✓ Question posted to Firestore!
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleQuestionSubmit}>
              <div style={{ position: 'relative' }}>
                <textarea
                  rows={2}
                  value={questionText}
                  onChange={(e) => {
                    setQuestionText(e.target.value);
                    if (submitError) setSubmitError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question in this lecture..."
                  style={{
                    width: '100%',
                    padding: '10px 48px 10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #DCE4EC',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.86rem',
                    color: '#17324D',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.4,
                  }}
                />

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !questionText.trim()}
                  title="Submit Question (Enter)"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    bottom: '10px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: questionText.trim() ? '#19A7A1' : '#E2E8F0',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: questionText.trim() ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>

              {/* Form Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  fontSize: '0.72rem',
                  color: '#94A3B8',
                }}
              >
                <span>Press <strong>Enter ↵</strong> to submit</span>
                <span><strong>Shift + Enter</strong> for new line</span>
              </div>
            </form>
          </div>
          )}
        </aside>
      </div>
    </div>
  );
}
