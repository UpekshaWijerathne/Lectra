import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { friendlyAuthError } from '../lib/errors';
import { SELF_ASSIGNABLE_ROLES, homePathForRole } from '../lib/roles';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await register(form);
      navigate(homePathForRole(form.role), { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card narrow">
      <h1>Create your account</h1>
      <form onSubmit={onSubmit}>
        <label>Full name
          <input value={form.name} onChange={set('name')} required />
        </label>
        <label>Email
          <input type="email" value={form.email} onChange={set('email')} required />
        </label>
        <label>Password
          <input type="password" value={form.password} onChange={set('password')} required minLength={6} />
        </label>
        <label>I am a
          <select value={form.role} onChange={set('role')}>
            {SELF_ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>Create account</button>
      </form>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </main>
  );
}
