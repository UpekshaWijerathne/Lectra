import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { listLecturerLectures, setLectureStatus } from '../lib/lectures';

function formatDate(ts) {
  return ts?.toDate ? ts.toDate().toLocaleString() : '';
}

export default function LecturerDashboard() {
  const { user, profile, logout } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setLectures(await listLecturerLectures(user.uid));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => { refresh(); }, [refresh]);

  async function changeStatus(id, status) {
    await setLectureStatus(id, status);
    refresh();
  }

  return (
    <main className="card">
      <header className="row between">
        <h1>My lectures</h1>
        <div className="row">
          <span className="muted">{profile?.name}</span>
          <button type="button" className="secondary" onClick={logout}>Log out</button>
        </div>
      </header>
      <Link className="button" to="/lecturer/new">Create lecture</Link>
      {error && <p className="error" role="alert">{error}</p>}
      {loading ? <p className="muted">Loading...</p> : lectures.length === 0 ? (
        <p className="muted">No lectures yet. Create one to get a session code.</p>
      ) : (
        <ul className="list">
          {lectures.map((l) => (
            <li key={l.id} className="item">
              <div>
                <strong>{l.subject}</strong>: {l.topic}
                <div className="muted">{formatDate(l.scheduledAt)} &middot; {l.status}</div>
              </div>
              <div className="row">
                <span className="code" title="Session code">{l.sessionCode}</span>
                {l.status === 'scheduled' && (
                  <button type="button" onClick={() => changeStatus(l.id, 'live')}>Start</button>
                )}
                {l.status === 'live' && (
                  <button type="button" className="secondary" onClick={() => changeStatus(l.id, 'ended')}>End</button>
                )}
                <Link className="button secondary" to={`/lecture/${l.id}`}>Open</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
