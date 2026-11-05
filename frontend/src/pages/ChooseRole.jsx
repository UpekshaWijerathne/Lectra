import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { SELF_ASSIGNABLE_ROLES, homePathForRole } from '../lib/roles';

// Shown after a first Google login, when the user has no profile (and so no role) yet.
export default function ChooseRole() {
  const { user, role, loading, chooseRole } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="center muted">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role) return <Navigate to={homePathForRole(role)} replace />;

  async function pick(r) {
    setError('');
    setBusy(true);
    try {
      await chooseRole(r);
      navigate(homePathForRole(r), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card narrow">
      <h1>How will you use Lectra?</h1>
      <p className="muted">You can't change this later, so choose carefully.</p>
      <div className="row">
        {SELF_ASSIGNABLE_ROLES.map((r) => (
          <button key={r} type="button" disabled={busy} onClick={() => pick(r)}>
            I'm a {r}
          </button>
        ))}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </main>
  );
}
