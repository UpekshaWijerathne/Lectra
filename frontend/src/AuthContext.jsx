import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from './firebase';
import { apiRequest } from './lib/api';
import { buildProfileRequest } from './lib/profile';

const AuthContext = createContext(null);

// Reads the role from users/{uid}. Returns null when the profile does not exist yet.
async function fetchRole(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data().role || null : null;
}

// firestore.rules does not allow browsers to create users/{uid} (US-05, US-07),
// so the backend creates the profile and stores the role.
function createProfileOnBackend({ name, email, role }) {
  return apiRequest('/api/users/profile', {
    method: 'POST',
    body: buildProfileRequest({ name, email, role }),
  });
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRoleState] = useState(null); // 'student' | 'lecturer' | 'admin' | null
  const [loading, setLoading] = useState(isFirebaseConfigured);

  // True while register() is creating the account and its profile. The auth listener then
  // skips its own profile read so it cannot overwrite the role with null.
  const registering = useRef(false);
  // Ignores results from an older auth event that finishes after a newer one.
  const latestEvent = useRef(0);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (registering.current) return;
      const eventId = ++latestEvent.current;

      if (!firebaseUser) {
        setCurrentUser(null);
        setRoleState(null);
        setLoading(false);
        return;
      }

      let userRole = null;
      try {
        userRole = await fetchRole(firebaseUser.uid);
      } catch (err) {
        console.error('Error reading the user profile from Firestore:', err);
      }
      if (eventId !== latestEvent.current) return;

      // The user and the role are set together, so a guard never sees "signed in, no role" by mistake.
      setRoleState(userRole);
      setCurrentUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  // Email / password login (US-05)
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const userRole = await fetchRole(cred.user.uid).catch(() => null);
    return { user: cred.user, role: userRole };
  };

  // Email / password registration with a role (US-05, US-07)
  const register = async ({ email, password, name, role: chosenRole }) => {
    const wantedRole = chosenRole || 'student';
    registering.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      try {
        if (name) await updateProfile(cred.user, { displayName: name });
        await createProfileOnBackend({ name, email: cred.user.email, role: wantedRole });
      } catch (profileError) {
        // The Firebase account exists but has no profile. Sign out so the user can log in
        // and finish on the role selection screen.
        await signOut(auth);
        throw new Error(
          `Your account was created, but your profile could not be saved (${profileError.message}). Please log in to continue.`,
        );
      }
      setRoleState(wantedRole);
      setCurrentUser(cred.user);
      setLoading(false);
      return { user: cred.user, role: wantedRole };
    } finally {
      registering.current = false;
    }
  };

  // Google sign-in (US-05). A new Google user has no profile, so the role stays null
  // and the app sends them to /choose-role.
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const userRole = await fetchRole(result.user.uid).catch(() => null);
    return { user: result.user, role: userRole, isNewUser: !userRole };
  };

  // Saves the chosen role through the backend (US-07). The backend refuses to change an existing role.
  const setRole = async (newRole) => {
    if (!currentUser) throw new Error('No authenticated user found.');
    await createProfileOnBackend({
      name: currentUser.displayName,
      email: currentUser.email,
      role: newRole,
    });
    setRoleState(newRole);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());

  const logout = () => signOut(auth);

  const value = {
    currentUser,
    user: currentUser, // alias used by some pages
    role,
    loading,
    login,
    register,
    loginWithGoogle,
    setRole,
    resetPassword,
    logout,
    isAuthenticated: Boolean(currentUser),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}