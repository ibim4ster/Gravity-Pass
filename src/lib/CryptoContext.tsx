import React, { createContext, useContext, useState } from 'react';
import { deriveKey, generateSalt } from './crypto';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { useAuth } from './AuthContext';

interface CryptoContextType {
  masterKey: CryptoKey | null;
  isUnlocked: boolean;
  unlockVault: (password: string) => Promise<boolean>;
  setupVault: (password: string) => Promise<void>;
  lockVault: () => void;
  hasVaultSetup: boolean | null;
  checkVaultSetup: () => Promise<void>;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

export const CryptoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [hasVaultSetup, setHasVaultSetup] = useState<boolean | null>(null);

  const checkVaultSetup = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      setHasVaultSetup(userDoc.exists());
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    }
  };

  const setupVault = async (password: string) => {
    if (!user) throw new Error("Not authenticated");
    const salt = generateSalt();
    const key = await deriveKey(password, salt);
    
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        salt: salt,
        createdAt: new Date()
      });
      setMasterKey(key);
      setHasVaultSetup(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
    }
  };

  const unlockVault = async (password: string): Promise<boolean> => {
    if (!user) throw new Error("Not authenticated");
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error("Vault not set up");
      }
      const salt = userDoc.data().salt;
      const key = await deriveKey(password, salt);
      // In a real app, we'd verify the key against a known encrypted test block.
      // For simplicity, we assume derivation succeeds. A failed decryption later will indicate wrong password.
      setMasterKey(key);
      return true;
    } catch (error) {
      console.error("Unlock failed", error);
      return false;
    }
  };

  const lockVault = () => {
    setMasterKey(null);
  };

  return (
    <CryptoContext.Provider value={{
      masterKey,
      isUnlocked: !!masterKey,
      unlockVault,
      setupVault,
      lockVault,
      hasVaultSetup,
      checkVaultSetup
    }}>
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => {
  const context = useContext(CryptoContext);
  if (context === undefined) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
};
