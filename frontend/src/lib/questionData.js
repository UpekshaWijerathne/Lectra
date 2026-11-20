export const MAX_QUESTION_LENGTH = 500;

export function validateQuestionText(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return { ok: false, error: 'Type your question first.' };
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return { ok: false, error: `Questions can be at most ${MAX_QUESTION_LENGTH} characters.` };
  }
  return { ok: true, text: trimmed };
}

export function buildQuestionDocs({ lectureId, text, isAnonymous, authorId, createdAt }) {
  return {
    question: { lectureId, text, isAnonymous: Boolean(isAnonymous), voteCount: 0, createdAt },
    author: { lectureId, authorId },
  };
}

function millis(value) {
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  return typeof value === 'number' ? value : 0;
}

export function sortNewestFirst(questions) {
  return [...questions].sort((a, b) => millis(b.createdAt) - millis(a.createdAt) || a.id.localeCompare(b.id));
}

export function friendlyQuestionError(err, context = 'submit') {
  const code = err?.code || '';
  if (code === 'permission-denied') {
    return context === 'load'
      ? 'Join this lecture with its session code to see the questions.'
      : 'You can only ask questions in a lecture you have joined.';
  }
  if (code === 'unavailable') return 'Cannot reach Firebase. Check your internet connection and try again.';
  return err?.message || 'Something went wrong. Please try again.';
}