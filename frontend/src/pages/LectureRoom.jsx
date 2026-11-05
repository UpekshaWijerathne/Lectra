import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getLecture } from '../lib/lectures';
import { homePathForRole } from '../lib/roles';

// Placeholder for Sprint 2: the live question feed, upvotes and anonymous mode go here.
export default function LectureRoom() {
  const { lectureId } = useParams();
  const { role } = useAuth();
  const [lecture, setLecture] = useState(undefined); // undefined = loading, null = not found
  const [error, setError] = useState('');

  useEffect(() => {
    getLecture(lectureId).then(setLecture).catch((err) => { setError(err.message); setLecture(null); });
  }, [lectureId]);

  if (lecture === undefined) return <p className="center muted">Loading...</p>;

  return (
    <main className="card narrow">
      {lecture ? (
        <>
          <h1>{lecture.subject}: {lecture.topic}</h1>
          <p className="muted">Status: {lecture.status}{role === 'lecturer' && ` · Code ${lecture.sessionCode}`}</p>
          {lecture.description && <p>{lecture.description}</p>}
          <p className="muted">The live question feed arrives in Sprint 2.</p>
        </>
      ) : (
        <p className="error">{error || 'Lecture not found.'}</p>
      )}
      <Link className="button secondary" to={homePathForRole(role)}>Back</Link>
    </main>
  );
}
