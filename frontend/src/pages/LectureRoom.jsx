import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { subscribeToQuestions, submitQuestion } from '../lib/questions';
import { friendlyQuestionError } from '../lib/questionData';

// Shapes a question from Firestore (text, isAnonymous, voteCount, createdAt) for this screen
function toRoomQuestion(q) {
  return {
    ...q,
    upvotes: q.voteCount || 0,
    upvotedBy: [],
    authorName: q.isAnonymous ? 'Anonymous' : 'Student',
    status: 'pending',
  };
}

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

export default function LectureRoom() {
  const { lectureId } = useParams();
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();

  // Lecture Document State
  const [lecture, setLecture] = useState(null);
  const [loadingLecture, setLoadingLecture] = useState(true);
  const [lectureError, setLectureError] = useState(null);

  // Q&A State (real-time Firestore, top-level `questions` collection)
  const [questions, setQuestions] = useState([]);
  const [questionsError, setQuestionsError] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submittingQ, setSubmittingQ] = useState(false);
  const [sortOrder, setSortOrder] = useState('upvotes'); // 'upvotes' | 'newest'

  // Tabs & Presentation State
  const [activeTab, setActiveTab] = useState('qna'); // 'qna' | 'polls' | 'quiz'
  const [currentSlide, setCurrentSlide] = useState(3);
  const totalSlides = 5;

  // Header Dropdown
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Clock for the elapsed-time label
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isLecturer = role === 'lecturer';

  // 1. Lecture details. The route parameter is the lecture id (students get it by joining with a session code).
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
        console.error('Error fetching lecture:', err);
        setLectureError('Failed to load this lecture.');
        setLoadingLecture(false);
      },
    );

    return () => unsubscribe();
  }, [lectureId]);

  // 2. Live question list. Firestore only allows this for the lecture's owner and students who joined it.
  const lectureLoadedId = lecture?.id;
  useEffect(() => {
    if (!lectureLoadedId) return undefined;
    return subscribeToQuestions(
      lectureLoadedId,
      (items) => {
        setQuestions(items.map(toRoomQuestion));
        setQuestionsError(null);
      },
      (err) => {
        setQuestions([]);
        setQuestionsError(friendlyQuestionError(err, 'load'));
      },
    );
  }, [lectureLoadedId]);

  // Send a question (writes questions/{id} and the private questionAuthors/{id} in one batch)
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim() || submittingQ) return;

    setSubmittingQ(true);
    try {
      await submitQuestion({
        lectureId,
        authorId: currentUser.uid,
        text: questionText,
        isAnonymous,
      });
      setQuestionText('');
    } catch (err) {
      alert(friendlyQuestionError(err, 'submit'));
    } finally {
      setSubmittingQ(false);
    }
  };

  // Upvotes and "mark answered" are not saved yet: firestore.rules does not allow them until the voting work.
  const handleToggleUpvote = () => {};
  const handleUpdateQuestionStatus = () => {};

  // Slide strip: local to this browser for now
  const handleSlideChange = (newSlide) => {
    if (newSlide < 1 || newSlide > totalSlides) return;
    setCurrentSlide(newSlide);
  };

  // Sort questions client-side based on user preference
  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortOrder === 'upvotes') {
      const diff = (b.upvotes || 0) - (a.upvotes || 0);
      if (diff !== 0) return diff;
    }
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });

  // Loading Screen
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
            width: '40px',
            height: '40px',
            border: '3.5px solid #DCE4EC',
            borderTopColor: '#19A7A1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '16px',
          }}
        />
        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748B' }}>
          Entering Live Lecture Room...
        </span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error Screen
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
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#17324D', margin: '0 0 8px' }}>
          {lectureError || 'Lecture Unavailable'}
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#64748B', maxWidth: '420px', margin: '0 0 24px', lineHeight: 1.5 }}>
          The lecture code you entered may be invalid or the session has been concluded.
        </p>
        <Link
          to={role === 'lecturer' ? '/lecturer' : '/student'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17324D',
            color: '#FFFFFF',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
          }}
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const exitDestination = isLecturer ? '/lecturer' : '/student';

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
      {/* Top Interactive App Bar */}
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
          zIndex: 10,
        }}
      >
        {/* Left: Brand & Lecture Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to={exitDestination}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
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
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#17324D', letterSpacing: '-0.02em' }}>
              Lectra
            </span>
          </Link>

          <div style={{ height: '20px', width: '1px', backgroundColor: '#CBD5E1' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#17324D' }}>
              {lecture.courseCode ? `${lecture.courseCode} - ` : ''}{lecture.title}
            </span>
            <span
              style={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
              {lecture.status === 'live' ? 'LIVE' : lecture.status === 'ended' ? 'ENDED' : 'SCHEDULED'}
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

        {/* Right: Presence & Leave Room */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748B' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span><strong>{lecture.studentCount ?? '—'}</strong> students</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748B' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{lecture.status === 'live' && lecture.scheduledAt?.toMillis ? formatElapsed(now - lecture.scheduledAt.toMillis()) : '--:--:--'}</span>
          </div>

          {/* User Profile Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu((p) => !p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#17324D',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
            </button>

            {showProfileMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '42px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DCE4EC',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(23, 50, 77, 0.12)',
                  width: '180px',
                  padding: '6px 0',
                  zIndex: 30,
                }}
              >
                <div style={{ padding: '8px 14px', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Signed in as</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#17324D', wordBreak: 'break-all' }}>
                    {currentUser?.email || 'Guest Participant'}
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
                    fontSize: '0.82rem',
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
            to={exitDestination}
            style={{
              padding: '8px 16px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
            }}
          >
            Leave Lecture
          </Link>
        </div>
      </header>

      {/* Main Lecture Workspace */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left: Slide Strip & Interactive Canvas */}
        <div style={{ flex: 1, display: 'flex', padding: '20px', gap: '16px', minWidth: 0, overflowY: 'auto' }}>
          {/* Thumbnails rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '56px', flexShrink: 0 }}>
            {[1, 2, 3, 4, 5].map((num) => {
              const isSelected = num === currentSlide;
              return (
                <button
                  key={num}
                  onClick={() => handleSlideChange(num)}
                  style={{
                    height: '52px',
                    width: '56px',
                    backgroundColor: '#FFFFFF',
                    border: isSelected ? '2px solid #19A7A1' : '1px solid #DCE4EC',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: isSelected ? '#0D9488' : '#64748B',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 2px 8px rgba(25, 167, 161, 0.15)' : 'none',
                  }}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Active Presentation Canvas */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #DCE4EC',
              boxShadow: '0 4px 20px rgba(23, 50, 77, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              padding: '40px',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {/* Slide Metadata */}
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#0D9488',
                letterSpacing: '0.06em',
                marginBottom: '8px',
                display: 'block',
              }}
            >
              MODULE 4 • ALGORITHMS & DATA STRUCTURES
            </span>

            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#17324D',
                margin: '0 0 28px',
                letterSpacing: '-0.02em',
              }}
            >
              Sorting Algorithms
            </h2>

            {/* Slide Key Takeaways */}
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                fontSize: '1rem',
                color: '#243447',
              }}
            >
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#19A7A1' }} />
                What is sorting?
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#19A7A1' }} />
                Types of sorting algorithms (Comparison vs Non-comparison)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#19A7A1' }} />
                Time & Space complexity analysis (Best, Average, Worst)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#19A7A1' }} />
                Real-world applications & cache-friendly implementations
              </li>
            </ul>

            {/* Visual Graphic Representation */}
            <div
              style={{
                marginTop: 'auto',
                padding: '24px',
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '32px', height: '24px', backgroundColor: '#19A7A1', borderRadius: '4px 4px 0 0' }} />
                  <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px', display: 'block' }}>O(1)</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '32px', height: '48px', backgroundColor: '#24688E', borderRadius: '4px 4px 0 0' }} />
                  <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px', display: 'block' }}>O(log n)</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '32px', height: '72px', backgroundColor: '#17324D', borderRadius: '4px 4px 0 0' }} />
                  <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px', display: 'block' }}>O(n)</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '32px', height: '96px', backgroundColor: '#0F172A', borderRadius: '4px 4px 0 0' }} />
                  <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px', display: 'block' }}>O(n log n)</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '32px', height: '110px', backgroundColor: '#E11D48', borderRadius: '4px 4px 0 0' }} />
                  <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px', display: 'block' }}>O(n²)</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', display: 'block' }}>
                  Complexity Benchmark
                </span>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#17324D' }}>
                  Comparative Graph
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Real-Time Firestore Q&A Stream (T-15) */}
        <aside
          style={{
            width: '380px',
            backgroundColor: '#FFFFFF',
            borderLeft: '1px solid #DCE4EC',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          {/* Tabs: Live Q&A, Polls, Quiz */}
          <div style={{ display: 'flex', borderBottom: '1px solid #DCE4EC', backgroundColor: '#F8FAFC' }}>
            <button
              onClick={() => setActiveTab('qna')}
              style={{
                flex: 1,
                padding: '14px 8px',
                border: 'none',
                borderBottom: activeTab === 'qna' ? '2.5px solid #19A7A1' : 'none',
                backgroundColor: activeTab === 'qna' ? '#FFFFFF' : 'transparent',
                fontWeight: 700,
                fontSize: '0.84rem',
                color: activeTab === 'qna' ? '#17324D' : '#64748B',
                cursor: 'pointer',
              }}
            >
              Live Q&A ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab('polls')}
              style={{
                flex: 1,
                padding: '14px 8px',
                border: 'none',
                borderBottom: activeTab === 'polls' ? '2.5px solid #19A7A1' : 'none',
                backgroundColor: activeTab === 'polls' ? '#FFFFFF' : 'transparent',
                fontWeight: 700,
                fontSize: '0.84rem',
                color: activeTab === 'polls' ? '#17324D' : '#64748B',
                cursor: 'pointer',
              }}
            >
              Polls (1)
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              style={{
                flex: 1,
                padding: '14px 8px',
                border: 'none',
                borderBottom: activeTab === 'quiz' ? '2.5px solid #19A7A1' : 'none',
                backgroundColor: activeTab === 'quiz' ? '#FFFFFF' : 'transparent',
                fontWeight: 700,
                fontSize: '0.84rem',
                color: activeTab === 'quiz' ? '#17324D' : '#64748B',
                cursor: 'pointer',
              }}
            >
              Quiz (0)
            </button>
          </div>

          {/* Subheader / Sorting Controls */}
          <div
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#17324D' }}>
              Questions Stream
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '0.78rem',
                borderRadius: '6px',
                border: '1px solid #DCE4EC',
                backgroundColor: '#FFFFFF',
                color: '#64748B',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="upvotes">Most Upvoted</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {/* Questions Scrollable List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {questionsError && (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#B91C1C', fontWeight: 600 }}>{questionsError}</p>
            )}
            {sortedQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ margin: '0 auto 10px' }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600 }}>No questions asked yet</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.76rem' }}>Be the first student to ask a question below!</p>
              </div>
            ) : (
              sortedQuestions.map((q) => {
                const userHasUpvoted = currentUser && (q.upvotedBy || []).includes(currentUser.uid);
                const isAnswered = q.status === 'answered';

                return (
                  <div
                    key={q.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: isAnswered ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                      padding: '14px',
                      boxShadow: '0 2px 6px rgba(23, 50, 77, 0.03)',
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    {/* Upvote Button with Atomic Firestore Counter (US-12) */}
                    <button
                      onClick={() => handleToggleUpvote(q.id, q.upvotedBy)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        padding: '6px 0',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: userHasUpvoted ? '#19A7A1' : '#F1F5F9',
                        color: userHasUpvoted ? '#FFFFFF' : '#17324D',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                        height: 'fit-content',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, marginTop: '2px' }}>
                        {q.upvotes || 0}
                      </span>
                    </button>

                    {/* Question Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 6px', fontSize: '0.86rem', fontWeight: 600, color: '#17324D', lineHeight: 1.4, wordBreak: 'break-word' }}>
                        {q.text}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94A3B8' }}>
                        <span style={{ fontWeight: 600, color: q.isAnonymous ? '#64748B' : '#0369A1' }}>
                          {q.authorName || 'Anonymous'}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isAnswered && (
                            <span
                              style={{
                                color: '#16A34A',
                                backgroundColor: '#DCFCE7',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              Answered ✓
                            </span>
                          )}

                          {/* Lecturer Moderation Controls */}
                          {isLecturer && !isAnswered && (
                            <button
                              onClick={() => handleUpdateQuestionStatus(q.id, 'answered')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#0D9488',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: '0.72rem',
                              }}
                            >
                              Mark Answered
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Interactive Question Input (US-11) */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid #DCE4EC', backgroundColor: '#FFFFFF' }}>
            <form onSubmit={handleAskQuestion}>
              <div style={{ position: 'relative' }}>
                <textarea
                  rows={2}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Ask a question..."
                  style={{
                    width: '100%',
                    padding: '10px 44px 10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #DCE4EC',
                    fontSize: '0.86rem',
                    color: '#17324D',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none',
                    fontFamily: 'inherit',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAskQuestion(e);
                    }
                  }}
                />

                <button
                  type="submit"
                  disabled={submittingQ || !questionText.trim()}
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>

              {/* Anonymous Question Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748B', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    style={{ accentColor: '#19A7A1', width: '14px', height: '14px' }}
                  />
                  Ask anonymously
                </label>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Press Enter ↵ to send
                </span>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}