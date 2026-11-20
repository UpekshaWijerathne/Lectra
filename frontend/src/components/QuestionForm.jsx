import { useState } from 'react';
import { submitQuestion } from '../lib/questions';
import { MAX_QUESTION_LENGTH, friendlyQuestionError } from '../lib/questionData';

export default function QuestionForm({ lectureId, userId }) {
  const [text, setText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSent(false);
    setBusy(true);
    try {
      await submitQuestion({ lectureId, authorId: userId, text, isAnonymous });
      setText('');
      setSent(true);
    } catch (err) {
      setError(friendlyQuestionError(err, 'submit'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <label>Ask a question
        <textarea
          rows={3}
          value={text}
          maxLength={MAX_QUESTION_LENGTH}
          disabled={busy}
          placeholder="What would you like to ask?"
          onChange={(e) => { setText(e.target.value); setSent(false); }}
        />
      </label>
      <p className="hint left">{text.length} / {MAX_QUESTION_LENGTH}</p>
      <label className="check">
        <input type="checkbox" checked={isAnonymous} disabled={busy} onChange={(e) => setIsAnonymous(e.target.checked)} />
        Ask anonymously (shown as "Anonymous" in the list)
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      {sent && <p className="success" role="status">Question sent.</p>}
      <button type="submit" disabled={busy || !text.trim()}>{busy ? 'Sending...' : 'Send question'}</button>
    </form>
  );
}