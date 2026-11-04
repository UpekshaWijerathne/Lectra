import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { joinLecture } from '../lib/lectures';
import { normalizeCode } from '../lib/sessionCode';

export default function StudentHome() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const lectureId = await joinLecture(code, { uid: user.uid, displayName: profile?.name });
      navigate(`/lecture/${lectureId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card narrow">
      <header className="row between">
        <h1>Join a lecture</h1>
        <button type="button" className="secondary" onClick={logout}>Log out</button>
      </header>
      <p className="muted">Enter the 6-character code shown by your lecturer.</p>
      <form onSubmit={onSubmit}>
        <input
          className="code-input"
          value={code}
          onChange={(e) => setCode(normalizeCode(e.target.value).slice(0, 6))}
          placeholder="ABC234"
          aria-label="Session code"
          autoComplete="off"
          required
        />
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={busy || code.length !== 6}>Join</button>
      </form>
    </main>
  );
}
