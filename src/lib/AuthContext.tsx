import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth, signInWithGoogle, signInWithApple as firebaseSignInWithApple, logOut, signInWithEmail as firebaseSignInWithEmail, signUpWithEmail as firebaseSignUpWithEmail, resetPassword as firebaseResetPassword, deleteAccount as firebaseDeleteAccount } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string, name: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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

  const signInWithApple = async () => {
    await firebaseSignInWithApple();
  };

  const signInWithEmail = async (e: string, p: string) => {
    await firebaseSignInWithEmail(e, p);
  };

  const signUpWithEmail = async (e: string, p: string, name: string) => {
    const user = await firebaseSignUpWithEmail(e, p);
    await updateProfile(user, { displayName: name });
    setUser({ ...user, displayName: name } as User);
  };

  const updateUserProfile = async (displayName: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      setUser({ ...auth.currentUser } as User);
    }
  };

  const resetPassword = async (email: string) => {
    await firebaseResetPassword(email);
  };

  const signOut = async () => {
    await logOut();
  };

  const deleteAccount = async () => {
    await firebaseDeleteAccount();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithApple, signInWithEmail, signUpWithEmail, updateUserProfile, resetPassword, signOut, deleteAccount }}>
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
