import React, { useState } from 'react';
import { useCrypto } from '../lib/CryptoContext';
import { useAuth } from '../lib/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Fingerprint, Lock } from 'lucide-react';

export function UnlockVaultScreen() {
  const { unlockVault } = useCrypto();
  const { signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await unlockVault(password);
    if (!success) {
      setError('Incorrect Master Key or decryption failed.');
    }
    setLoading(false);
  };

  const handleBiometric = () => {
    // In a production PWA, this would invoke navigator.credentials.get()
    // to retrieve the master key securely stored via WebAuthn PRF.
    alert("Biometric unlock via WebAuthn PRF is simulated in this environment. Please enter your Master Key manually.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <CardTitle>Vault Locked</CardTitle>
          </div>
          <CardDescription>
            Enter your Master Key to decrypt your vault locally.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Master Key</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700" disabled={loading}>
                {loading ? 'Decrypting...' : 'Unlock'}
              </Button>
              <Button type="button" variant="outline" onClick={handleBiometric} className="px-3">
                <Fingerprint className="w-5 h-5" />
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <Button variant="link" onClick={signOut} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 text-xs">
              Sign out and lock
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
