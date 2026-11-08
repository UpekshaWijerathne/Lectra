// Body for POST /api/users/profile.
// firestore.rules does not let browsers create users/{uid}, so the backend creates it.
// If a name is missing (some Google accounts have none), the part of the email before "@" is used.
export function buildProfileRequest({ name, email, role, preferredLanguage = 'en' }) {
  const cleanName = String(name ?? '').trim() || String(email ?? '').split('@')[0];
  return { name: cleanName, role, preferredLanguage };
}