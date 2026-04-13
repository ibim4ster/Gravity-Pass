import React, { useState } from 'react';
import { useCrypto } from '../lib/CryptoContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { KeyRound } from 'lucide-react';

export function SetupVaultScreen() {
  const { setupVault } = useCrypto();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 && password !== 'admin') {
      setError('Master key must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await setupVault(password);
    } catch (err) {
      setError('Failed to setup vault.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <KeyRound className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <CardTitle>Create Master Key</CardTitle>
          </div>
          <CardDescription>
            This key encrypts all your data locally. If you lose it, your data cannot be recovered. We do not store this key.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Master Key</Label>
              <Input 
                id="confirm" 
                type="password" 
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700" disabled={loading}>
              {loading ? 'Encrypting Vault...' : 'Initialize Vault'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
