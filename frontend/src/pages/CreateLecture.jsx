import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { createLecture } from '../lib/lectures';

// Value for <input type="datetime-local"> in local time, one hour from now.
function defaultDateTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreateLecture() {
  const { user } = useAuth();
  const [form, setForm] = useState({ subject: '', topic: '', description: '', scheduledAt: defaultDateTime() });
  const [created, setCreated] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const when = new Date(form.scheduledAt);
    if (Number.isNaN(when.getTime())) {
      setError('Choose a valid date and time.');
      return;
    }
    setBusy(true);
    try {
      const result = await createLecture({
        subject: form.subject.trim(),
        topic: form.topic.trim(),
        description: form.description.trim(),
        scheduledAt: when,
        lecturerId: user.uid,
      });
      setCreated(result);
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
        <p className="code big">{created.sessionCode}</p>
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
        <label>Description (optional)
          <textarea value={form.description} onChange={set('description')} rows={3} maxLength={500} />
        </label>
        <label>Date and time
          <input type="datetime-local" value={form.scheduledAt} onChange={set('scheduledAt')} required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="row">
          <button type="submit" disabled={busy}>Create lecture</button>
          <Link className="button secondary" to="/lecturer">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
