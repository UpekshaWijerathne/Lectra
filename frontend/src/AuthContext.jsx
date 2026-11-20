import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize Auth & read permanent role from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            // Read permanent role assigned at registration
            setRole(userDocSnap.data().role || 'student');
          } else {
            // Fallback default only if record does not exist
            setRole('student');
          }
          setCurrentUser(user);
        } catch (err) {
          console.error('Error fetching role from Firestore:', err);
          setRole('student');
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Standard Login: purely verifies credentials. Does NOT prompt or change role.
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, 'users', cred.user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userRole = userDocSnap.data().role || 'student';
      setRole(userRole);
      return { user: cred.user, role: userRole };
    }
    return { user: cred.user, role: 'student' };
  };

  // Registration: ONLY place where role is selected and permanently written
  const register = async (email, password, selectedRole = 'student') => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, 'users', cred.user.uid);

    await setDoc(userDocRef, {
      email,
      role: selectedRole, // Saved permanently
      createdAt: serverTimestamp(),
    });

    setRole(selectedRole);
    return { user: cred.user, role: selectedRole };
  };

  // Google SSO: Reads role from Firestore; defaults to student only for brand new accounts
  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const userDocRef = doc(db, 'users', cred.user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        email: cred.user.email,
        role: 'student',
        createdAt: serverTimestamp(),
      });
      setRole('student');
      return { user: cred.user, role: 'student' };
    } else {
      const existingRole = userDocSnap.data().role || 'student';
      setRole(existingRole);
      return { user: cred.user, role: existingRole };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
