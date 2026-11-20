import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ChooseRole = lazy(() => import('./pages/ChooseRole'));
const StudentHome = lazy(() => import('./pages/StudentHome'));
const LecturerDashboard = lazy(() => import('./pages/LecturerDashboard'));
const CreateLecture = lazy(() => import('./pages/CreateLecture'));
const LectureRoom = lazy(() => import('./pages/LectureRoom'));

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F7FA', color: '#17324D', fontFamily: "'Inter', sans-serif" }}>
      <span>Loading Lectra...</span>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/choose-role" element={<ChooseRole />} />
        
        {/* Student Routes */}
        <Route path="/student" element={<StudentHome />} />
        <Route path="/room/:lectureId" element={<LectureRoom />} />

        {/* Lecturer Routes */}
        <Route path="/lecturer" element={<LecturerDashboard />} />
        <Route path="/lecturer/new" element={<CreateLecture />} />
        <Route path="/lecture/:lectureId" element={<LectureRoom />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
