import React, { useEffect, useState } from 'react';
import { useAuth } from './lib/AuthContext';
import { useCrypto } from './lib/CryptoContext';
import { LoginScreen } from './components/LoginScreen';
import { SetupVaultScreen } from './components/SetupVaultScreen';
import { UnlockVaultScreen } from './components/UnlockVaultScreen';
import { VaultDashboard } from './components/VaultDashboard';
import { LandingPage } from './components/LandingPage';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { isUnlocked, hasVaultSetup, checkVaultSetup } = useCrypto();
  const [showLanding, setShowLanding] = useState(() => {
    // Check if user has visited before to skip landing page
    return localStorage.getItem('gravity-pass-visited') !== 'true';
  });

  useEffect(() => {
    if (user && hasVaultSetup === null) {
      checkVaultSetup();
    }
  }, [user, hasVaultSetup, checkVaultSetup]);

  const handleGetStarted = () => {
    localStorage.setItem('gravity-pass-visited', 'true');
    setShowLanding(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (showLanding) {
      return <LandingPage onGetStarted={handleGetStarted} />;
    }
    return <LoginScreen />;
  }

  if (hasVaultSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!hasVaultSetup) {
    return <SetupVaultScreen />;
  }

  if (!isUnlocked) {
    return <UnlockVaultScreen />;
  }

  return <VaultDashboard />;
}
