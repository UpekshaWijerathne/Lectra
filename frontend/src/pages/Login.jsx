import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { friendlyAuthError } from '../lib/errors';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setError('');
    setBusy(true);
    try {
      await action();
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card narrow">
      <h1>Log in to Lectra</h1>
      <form onSubmit={(e) => { e.preventDefault(); run(() => login(email, password)); }}>
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>Log in</button>
      </form>
      <button type="button" className="secondary" disabled={busy} onClick={() => run(loginWithGoogle)}>
        Continue with Google
      </button>
      <p className="muted">New here? <Link to="/register">Create an account</Link></p>
    </main>
  );
}
