export default function QuestionList({ questions }) {
  if (questions === null) return <p className="muted">Loading questions...</p>;
  if (questions.length === 0) return <p className="muted">No questions yet.</p>;

  return (
    <ul className="list">
      {questions.map((q) => (
        <li key={q.id} className="question">
          <p>{q.text}</p>
          <span className="muted">{q.isAnonymous ? 'Anonymous' : 'Student'} · {q.voteCount} votes</span>
        </li>
      ))}
    </ul>
  );
}