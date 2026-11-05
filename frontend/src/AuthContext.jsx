import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from './firebase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); 
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const registering = useRef(false);

  const loadProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setProfile(null);
      return null;
    }
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
    const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (registering.current) {
        setLoading(false);
        return;
      }
      try {
        await loadProfile(firebaseUser);
      } finally {
        setLoading(false);
      }
    });
  }, [loadProfile]);

  async function createProfile(firebaseUser, { name, role, preferredLanguage = 'en' }) {
    const data = {
      name: name || firebaseUser.displayName || '',
      email: firebaseUser.email,
      role,
      preferredLanguage,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', firebaseUser.uid), data);
    return loadProfile(firebaseUser);
  }

  async function register({ name, email, password, role }) {
    registering.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
      await createProfile(cred.user, { name, role });
      return cred.user;
    } finally {
      registering.current = false;
    }
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    await loadProfile(cred.user);
    return cred.user;
  }

  async function chooseRole(role) {
    if (!user) throw new Error('Not signed in');
    return createProfile(user, { name: user.displayName, role });
  }

  function logout() {
    return signOut(auth);
  }

  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    register,
    login,
    loginWithGoogle,
    resetPassword,
    chooseRole,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}