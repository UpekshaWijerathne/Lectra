import { collection, doc, onSnapshot, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { buildQuestionDocs, sortNewestFirst, validateQuestionText } from './questionData';

export async function submitQuestion({ lectureId, authorId, text, isAnonymous }) {
  const check = validateQuestionText(text);
  if (!check.ok) throw new Error(check.error);

  const questionRef = doc(collection(db, 'questions')); // new auto id
  const authorRef = doc(db, 'questionAuthors', questionRef.id); // same id as the question
  const docs = buildQuestionDocs({
    lectureId,
    text: check.text,
    isAnonymous,
    authorId,
    createdAt: serverTimestamp(),
  });

  const batch = writeBatch(db);
  batch.set(questionRef, docs.question);
  batch.set(authorRef, docs.author);
  await batch.commit();
  return questionRef.id;
}

export function subscribeToQuestions(lectureId, onChange, onError) {
  const q = query(collection(db, 'questions'), where('lectureId', '==', lectureId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
      onChange(sortNewestFirst(items));
    },
    onError,
  );
}