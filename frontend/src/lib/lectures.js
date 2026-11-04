import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { generateCode, normalizeCode, isValidCodeFormat } from './sessionCode';

class CodeTakenError extends Error {}

// Creates the lecture and reserves its session code in one transaction, so two lecturers
// can never end up with the same code. Retries with a new code if one is already taken.
export async function createLecture({ subject, topic, description, scheduledAt, lecturerId }, { maxTries = 10 } = {}) {
  const lectureRef = doc(collection(db, 'lectures'));

  for (let attempt = 0; attempt < maxTries; attempt += 1) {
    const code = generateCode();
    const codeRef = doc(db, 'sessionCodes', code);
    try {
      await runTransaction(db, async (tx) => {
        const existing = await tx.get(codeRef);
        if (existing.exists()) throw new CodeTakenError();
        tx.set(lectureRef, {
          subject,
          topic,
          description: description || '',
          lecturerId,
          sessionCode: code,
          status: 'scheduled',
          scheduledAt: Timestamp.fromDate(scheduledAt),
          createdAt: serverTimestamp(),
        });
        tx.set(codeRef, { lectureId: lectureRef.id });
      });
      return { id: lectureRef.id, sessionCode: code };
    } catch (err) {
      if (!(err instanceof CodeTakenError)) throw err;
    }
  }
  throw new Error('Could not create a unique session code. Please try again.');
}

export async function listLecturerLectures(lecturerId) {
  const q = query(
    collection(db, 'lectures'),
    where('lecturerId', '==', lecturerId),
    orderBy('scheduledAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getLecture(lectureId) {
  const snap = await getDoc(doc(db, 'lectures', lectureId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function setLectureStatus(lectureId, status) {
  return updateDoc(doc(db, 'lectures', lectureId), { status });
}

// Student joins with a session code. Returns the lecture id to open.
export async function joinLecture(rawCode, { uid, displayName }) {
  const code = normalizeCode(rawCode);
  if (!isValidCodeFormat(code)) {
    throw new Error('Session codes have 6 letters or numbers.');
  }
  const codeSnap = await getDoc(doc(db, 'sessionCodes', code));
  if (!codeSnap.exists()) throw new Error('Code not found. Check it and try again.');

  const { lectureId } = codeSnap.data();
  const lecture = await getLecture(lectureId);
  if (!lecture) throw new Error('This lecture no longer exists.');
  if (lecture.status === 'completed') throw new Error('This lecture has ended.');

  await setDoc(
    doc(db, 'lectures', lectureId, 'participants', uid),
    { displayName: displayName || '', joinedAt: serverTimestamp() },
    { merge: true },
  );
  return lectureId;
}
