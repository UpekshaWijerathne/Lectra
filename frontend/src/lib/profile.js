export function buildProfileRequest({ name, email, role, preferredLanguage = 'en' }) {
  const cleanName = String(name ?? '').trim() || String(email ?? '').split('@')[0];
  return { name: cleanName, role, preferredLanguage };
}