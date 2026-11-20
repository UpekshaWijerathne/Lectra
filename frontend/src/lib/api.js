import { auth } from '../firebase';

// Address of the Lectra Express backend (set VITE_API_URL in .env.local).
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

// Calls the backend with the signed-in user's Firebase ID token.
// Returns the "data" field of a successful response, or throws an Error with the server's message.
export async function apiRequest(path, { method = 'GET', body } = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('You are signed out. Please log in again.');
  const token = await user.getIdToken();

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // the backend's verifyToken middleware reads this
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the Lectra server. Check that the backend is running.');
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // The response was not JSON. The status code message below is used instead.
  }

  if (!res.ok || !payload?.success) {
    throw new Error(payload?.message || `Request failed (${res.status}).`);
  }
  return payload.data;
}
