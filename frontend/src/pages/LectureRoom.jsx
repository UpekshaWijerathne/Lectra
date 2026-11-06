import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getLecture } from '../lib/lectures';
import { subscribeToQuestions } from '../lib/questions';
import { friendlyQuestionError } from '../lib/questionData';
import { homePathForRole } from '../lib/roles';
import QuestionForm from '../components/QuestionForm';
import QuestionList from '../components/QuestionList';

export default function LectureRoom() {
  const { lectureId } = useParams();
  const { user, role } = useAuth();
  const [lecture, setLecture] = useState(undefined); // undefined = loading, null = not found
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState(null); // null = loading
  const [questionsError, setQuestionsError] = useState('');

  useEffect(() => {
    getLecture(lectureId).then(setLecture).catch((err) => { setError(err.message); setLecture(null); });
  }, [lectureId]);

  useEffect(() => {
    if (!lecture) return undefined;
    return subscribeToQuestions(
      lectureId,
      (items) => { setQuestions(items); setQuestionsError(''); },
      (err) => { setQuestions([]); setQuestionsError(friendlyQuestionError(err, 'load')); },
    );
  }, [lectureId, lecture]);

  if (lecture === undefined) return <p className="center muted">Loading...</p>;

  const lectureEnded = lecture?.status === 'ended';

  return (
    <main className="card">
      {lecture ? (
        <>
          <h1>{lecture.subject}: {lecture.topic}</h1>
          <p className="muted">Status: {lecture.status}{role === 'lecturer' && ` · Code ${lecture.sessionCode}`}</p>
          {lecture.description && <p>{lecture.description}</p>}

          {role === 'student' && (
            lectureEnded
              ? <p className="muted">This lecture has ended, so new questions are closed.</p>
              : <QuestionForm lectureId={lectureId} userId={user.uid} />
          )}

          <h2>Questions</h2>
          {questionsError
            ? <p className="error" role="alert">{questionsError}</p>
            : <QuestionList questions={questions} />}
        </>
      ) : (
        <p className="error">{error || 'Lecture not found.'}</p>
      )}
      <Link className="button secondary" to={homePathForRole(role)}>Back</Link>
    </main>
  );
}