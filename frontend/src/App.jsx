import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { isFirebaseConfigured } from './firebase';
import { canAccess, homePathForRole } from './lib/roles';
import { normalizeCode } from './lib/sessionCode';

// Lazy-loaded page components
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ChooseRole = lazy(() => import('./pages/ChooseRole'));
const StudentHome = lazy(() => import('./pages/StudentHome'));
const LecturerDashboard = lazy(() => import('./pages/LecturerDashboard'));
const CreateLecture = lazy(() => import('./pages/CreateLecture'));
const LectureRoom = lazy(() => import('./pages/LectureRoom'));

// Minimal loading indicator matching Lectra design tokens
function PageLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F7FA',
        fontFamily: "'Inter', sans-serif",
        color: '#17324D',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3.5px solid #DCE4EC',
          borderTopColor: '#19A7A1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '14px',
        }}
      />
      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#64748B' }}>
        Loading Lectra...
      </span>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// US-08: Protected Route Guard. Pass roles={['lecturer', 'admin']} to limit a page to those roles.
function ProtectedRoute({ children, roles }) {
  const { currentUser, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  // Not signed in -> login, remembering where the user wanted to go
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;

  // Signed in but no profile role yet -> role selection
  if (!role) return <Navigate to="/choose-role" replace />;

  // Wrong role -> that user's own home page
  if (roles && !canAccess(role, roles)) return <Navigate to={homePathForRole(role)} replace />;

  return children;
}

// US-07: role selection is only for signed-in users who do not have a role yet (the role is permanent).
function RoleSetupRoute({ children }) {
  const { currentUser, role, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (role) return <Navigate to={homePathForRole(role)} replace />;

  return children;
}

// Prevents signed-in users from viewing login/register. If they were sent to login from another page
// (for example /student?code=ABC234), they go back there, so the session code is not lost.
function PublicOnlyRoute({ children }) {
  const { currentUser, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (currentUser) {
    const from = location.state?.from;
    const back = from ? `${from.pathname}${from.search || ''}` : null;
    return <Navigate to={role ? back || homePathForRole(role) : '/choose-role'} replace />;
  }

  return children;
}

// Old prototype links like /room/ABC234 open the student join screen with the code filled in.
function LegacyRoomRedirect() {
  const { code } = useParams();
  return <Navigate to={`/student?code=${encodeURIComponent(normalizeCode(code))}`} replace />;
}

export default function App() {
  if (!isFirebaseConfigured) {
    return (
      <main className="card narrow">
        <h1>Firebase is not configured</h1>
        <p>Copy <code>.env.example</code> to <code>.env.local</code>, fill in your Firebase web app settings, then restart the dev server. See README.md.</p>
      </main>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Authentication Routes */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        {/* US-07: Role Onboarding (Protected, but allows null role) */}
        <Route
          path="/choose-role"
          element={
            <RoleSetupRoute>
              <ChooseRole />
            </RoleSetupRoute>
          }
        />

        {/* Student Workspace (US-08) */}
        <Route
          path="/student"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentHome />
            </ProtectedRoute>
          }
        />

        {/* Lecturer Workspace (US-08) */}
        <Route
          path="/lecturer"
          element={
            <ProtectedRoute roles={['lecturer', 'admin']}>
              <LecturerDashboard />
            </ProtectedRoute>
          }
        />

        {/* US-09: Canonical Create Lecture Route */}
        <Route
          path="/lecturer/new"
          element={
            <ProtectedRoute roles={['lecturer', 'admin']}>
              <CreateLecture />
            </ProtectedRoute>
          }
        />

        {/* US-10 & US-11: Canonical Lecture Room Route (Supports alphanumeric codes) */}
        <Route
          path="/lecture/:lectureId"
          element={
            <ProtectedRoute>
              <LectureRoom />
            </ProtectedRoute>
          }
        />

        {/* Compatibility Redirects for Previous Prototype Routes */}
        <Route path="/create-lecture" element={<Navigate to="/lecturer/new" replace />} />
        <Route path="/room/:code" element={<LegacyRoomRedirect />} />

        {/* Root & Catch-all redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}