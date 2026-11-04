import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import { homePathForRole } from './lib/roles';
import { isFirebaseConfigured } from './firebase';
import Login from './pages/Login';
import Register from './pages/Register';
import ChooseRole from './pages/ChooseRole';
import LecturerDashboard from './pages/LecturerDashboard';
import CreateLecture from './pages/CreateLecture';
import StudentHome from './pages/StudentHome';
import LectureRoom from './pages/LectureRoom';

function Home() {
  const { user, role, loading } = useAuth();
  if (loading) return <p className="center muted">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homePathForRole(role)} replace />;
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
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/choose-role" element={<ChooseRole />} />
      <Route path="/lecturer" element={<ProtectedRoute roles={['lecturer', 'admin']}><LecturerDashboard /></ProtectedRoute>} />
      <Route path="/lecturer/new" element={<ProtectedRoute roles={['lecturer', 'admin']}><CreateLecture /></ProtectedRoute>} />
      <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentHome /></ProtectedRoute>} />
      <Route path="/lecture/:lectureId" element={<ProtectedRoute><LectureRoom /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
