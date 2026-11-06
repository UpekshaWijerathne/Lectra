import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createLecture } from '../lib/lectures';

// Value for <input type="datetime-local"> in local time, one hour from now.
function defaultDateTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreateLecture() {
  const [form, setForm] = useState({ subject: '', topic: '', scheduledAt: defaultDateTime() });
  const [created, setCreated] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const subject = form.subject.trim();
    const topic = form.topic.trim();
    if (!subject || !topic) {
      setError('Subject and topic cannot be blank.');
      return;
    }
    const when = new Date(form.scheduledAt);
    if (Number.isNaN(when.getTime())) {
      setError('Choose a valid date and time.');
      return;
    }
    setBusy(true);
    try {
      // The backend creates the lecture and the session code (US-09 / US-10).
      setCreated(await createLecture({ subject, topic, scheduledAt: when }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <main className="card narrow">
        <h1>Lecture created</h1>
        <p>Share this session code with your students:</p>
        <p className="code big" aria-label={`Session code ${created.sessionCode}`}>{created.sessionCode}</p>
        <p className="muted">Valid until {new Date(created.expiresAt).toLocaleString()}</p>
        <div className="row">
          <Link className="button" to="/lecturer">Back to my lectures</Link>
          <Link className="button secondary" to={`/lecture/${created.id}`}>Open lecture</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="card narrow">
      <h1>Create lecture</h1>
      <form onSubmit={onSubmit}>
        <label>Subject
          <input value={form.subject} onChange={set('subject')} required maxLength={100} />
        </label>
        <label>Topic
          <input value={form.topic} onChange={set('topic')} required maxLength={150} />
        </label>
        <label>Date and time
          <input type="datetime-local" value={form.scheduledAt} onChange={set('scheduledAt')} required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="row">
          <button type="submit" disabled={busy}>{busy ? 'Creating...' : 'Create lecture'}</button>
          <Link className="button secondary" to="/lecturer">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
