import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { canAccess, homePathForRole } from './lib/roles';

// Wrap a page in <ProtectedRoute roles={['lecturer']}>. This only hides screens.
// The real protection is in firestore.rules, which blocks cross-role data access.
export default function ProtectedRoute({ roles, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="center muted">Loading...</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!role) return <Navigate to="/choose-role" replace />;
  if (!canAccess(role, roles)) return <Navigate to={homePathForRole(role)} replace />;
  return children;
}
