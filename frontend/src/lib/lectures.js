import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { apiRequest } from './api';
import { normalizeCode, isValidCodeFormat } from './sessionCode';

// Creates a lecture through the backend (POST /api/lectures).
// The backend checks the user is a lecturer, generates a unique session code and
// writes the lecture and its session code in one transaction. Firestore rules do not
// allow the browser to write sessionCodes directly.
export async function createLecture({ subject, topic, scheduledAt }) {
  const data = await apiRequest('/api/lectures', {
    method: 'POST',
    body: { subject, topic, scheduledAt: scheduledAt.toISOString() },
  });
  return { id: data.lectureId, sessionCode: data.sessionCode, expiresAt: data.expiresAt };
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

// Allowed statuses in firestore.rules: 'scheduled', 'live', 'ended'.
export function setLectureStatus(lectureId, status) {
  return updateDoc(doc(db, 'lectures', lectureId), { status });
}

// A student joins with a session code through the backend (POST /api/lectures/join).
// Returns the lecture id to open.
export async function joinLecture(rawCode) {
  const code = normalizeCode(rawCode);
  if (!isValidCodeFormat(code)) {
    throw new Error('Session codes have 6 letters or numbers.');
  }
  const data = await apiRequest('/api/lectures/join', {
    method: 'POST',
    body: { sessionCode: code },
  });
  return data.lectureId;
}
