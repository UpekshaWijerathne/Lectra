import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTION_LENGTH,
  validateQuestionText,
  buildQuestionDocs,
  sortNewestFirst,
  friendlyQuestionError,
} from './questionData';

describe('validateQuestionText', () => {
  it('trims the text', () => {
    expect(validateQuestionText('  What is a pointer?  ')).toEqual({ ok: true, text: 'What is a pointer?' });
  });
  it('rejects empty and whitespace-only text', () => {
    expect(validateQuestionText('').ok).toBe(false);
    expect(validateQuestionText('   ').ok).toBe(false);
    expect(validateQuestionText(null).ok).toBe(false);
  });
  it('accepts the maximum length and rejects one more', () => {
    expect(validateQuestionText('a'.repeat(MAX_QUESTION_LENGTH)).ok).toBe(true);
    expect(validateQuestionText('a'.repeat(MAX_QUESTION_LENGTH + 1)).ok).toBe(false);
  });
  it('stays inside the 2000 character limit in firestore.rules', () => {
    expect(MAX_QUESTION_LENGTH).toBeLessThanOrEqual(2000);
  });
});

describe('buildQuestionDocs', () => {
  const docs = buildQuestionDocs({
    lectureId: 'lec1', text: 'Why?', isAnonymous: true, authorId: 'u1', createdAt: 'TS',
  });

  it('question has exactly the fields firestore.rules allows', () => {
    expect(Object.keys(docs.question).sort()).toEqual(
      ['createdAt', 'isAnonymous', 'lectureId', 'text', 'voteCount'],
    );
  });
  it('starts with zero votes', () => {
    expect(docs.question.voteCount).toBe(0);
  });
  it('author record has exactly lectureId and authorId', () => {
    expect(docs.author).toEqual({ lectureId: 'lec1', authorId: 'u1' });
  });
  it('isAnonymous is always a boolean', () => {
    expect(buildQuestionDocs({ lectureId: 'l', text: 't', authorId: 'u', createdAt: 1 }).question.isAnonymous).toBe(false);
  });
  it('never puts the author on the public question', () => {
    expect(docs.question).not.toHaveProperty('authorId');
  });
});

describe('sortNewestFirst', () => {
  const at = (n) => ({ toMillis: () => n });
  it('puts the newest question first', () => {
    const sorted = sortNewestFirst([
      { id: 'a', createdAt: at(1) },
      { id: 'b', createdAt: at(3) },
      { id: 'c', createdAt: at(2) },
    ]);
    expect(sorted.map((q) => q.id)).toEqual(['b', 'c', 'a']);
  });
  it('does not change the original array', () => {
    const original = [{ id: 'a', createdAt: at(1) }, { id: 'b', createdAt: at(2) }];
    sortNewestFirst(original);
    expect(original[0].id).toBe('a');
  });
  it('copes with a missing createdAt', () => {
    expect(sortNewestFirst([{ id: 'a' }, { id: 'b', createdAt: at(5) }])[0].id).toBe('b');
  });
});

describe('friendlyQuestionError', () => {
  it('explains permission errors differently for sending and loading', () => {
    const err = { code: 'permission-denied' };
    expect(friendlyQuestionError(err, 'submit')).toMatch(/joined/);
    expect(friendlyQuestionError(err, 'load')).toMatch(/session code/);
  });
  it('explains network problems', () => {
    expect(friendlyQuestionError({ code: 'unavailable' })).toMatch(/internet/);
  });
  it('passes plain error messages through', () => {
    expect(friendlyQuestionError(new Error('Type your question first.'))).toBe('Type your question first.');
  });
});