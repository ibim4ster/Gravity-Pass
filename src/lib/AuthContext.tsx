import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth, signInWithGoogle, logOut, signInWithEmail as firebaseSignInWithEmail, signUpWithEmail as firebaseSignUpWithEmail } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    await signInWithGoogle();
  };

  const signInWithEmail = async (e: string, p: string) => {
    await firebaseSignInWithEmail(e, p);
  };

  const signUpWithEmail = async (e: string, p: string) => {
    await firebaseSignUpWithEmail(e, p);
  };

  const updateUserProfile = async (displayName: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      setUser({ ...auth.currentUser } as User);
    }
  };

  const signOut = async () => {
    await logOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithEmail, signUpWithEmail, updateUserProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
