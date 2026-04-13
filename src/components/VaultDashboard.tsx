import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useCrypto } from '../lib/CryptoContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { encryptData, decryptData } from '../lib/crypto';
import { generateSecurePassword, analyzePasswordStrength } from '../lib/ai';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Plus, LogOut, Orbit, Key, Copy, Trash2, Eye, EyeOff, Sparkles, Activity, Search, Sun, Moon, UserCircle, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from './ThemeProvider';

export function VaultDashboard() {
  const { user, signOut, updateUserProfile } = useAuth();
  const { masterKey, lockVault } = useCrypto();
  const { theme, setTheme } = useTheme();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [decryptionError, setDecryptionError] = useState(false);

  // Profile State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // New Entry State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{ score: number; feedback: string; vulnerabilities: string[] } | null>(null);

  useEffect(() => {
    if (!user || !masterKey) return;

    const vaultRef = collection(db, `users/${user.uid}/vault`);
    const unsubscribe = onSnapshot(vaultRef, async (snapshot) => {
      try {
        const decryptedEntries = [];
        let hasError = false;
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          try {
            const decryptedJson = await decryptData(masterKey, data.encryptedData, data.iv);
            const entryData = JSON.parse(decryptedJson);
            decryptedEntries.push({ id: docSnap.id, ...entryData });
          } catch (e) {
            console.error("Failed to decrypt entry", docSnap.id);
            hasError = true;
          }
        }
        
        if (hasError && snapshot.docs.length > 0) {
          setDecryptionError(true);
        } else {
          setDecryptionError(false);
          setEntries(decryptedEntries);
        }
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/vault`);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/vault`);
    });

    return () => unsubscribe();
  }, [user, masterKey]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateUserProfile(displayName);
      setIsProfileOpen(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !masterKey) return;

    const entryData = { title, username, password, website, notes };
    const jsonStr = JSON.stringify(entryData);
    
    try {
      const { ciphertext, iv } = await encryptData(masterKey, jsonStr);
      const entryId = crypto.randomUUID();
      
      await setDoc(doc(db, `users/${user.uid}/vault`, entryId), {
        uid: user.uid,
        encryptedData: ciphertext,
        iv: iv,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      setIsAddOpen(false);
      setTitle(''); setUsername(''); setPassword(''); setWebsite(''); setNotes(''); setAnalysis(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/vault`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/vault`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/vault/${id}`);
    }
  };

  const handleGenerate = async () => {
    setAiLoading(true);
    try {
      const newPass = await generateSecurePassword("at least 16 characters, mix of uppercase, lowercase, numbers, and symbols, highly secure but memorable");
      setPassword(newPass);
      handleAnalyze(newPass);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAnalyze = async (passToAnalyze: string = password) => {
    if (!passToAnalyze) return;
    setAiLoading(true);
    try {
      const result = await analyzePasswordStrength(passToAnalyze);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const [showPasswordId, setShowPasswordId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredEntries = entries.filter(e => 
    (e.title && e.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (e.username && e.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (e.website && e.website.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (decryptionError) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 transition-colors duration-300">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-zinc-950 dark:text-zinc-50">Decryption Failed</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              The Master Key you entered is incorrect, or the vault data is corrupted. We cannot decrypt your passwords.
            </p>
            <Button onClick={() => { lockVault(); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">
              Lock Vault & Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-100 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <Orbit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-xl font-semibold">Gravity-Pass</h1>
          </div>
          
          <div className="flex-1 w-full md:max-w-xs relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
            <Input 
              placeholder="Search vault..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <UserCircle className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>User Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateProfile} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email || ''} disabled className="bg-zinc-100 dark:bg-zinc-900 opacity-70" />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Enter your name" />
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsProfileOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={profileLoading}>
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 gap-2">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Password</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveEntry} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Website / URL</Label>
                      <Input value={website} onChange={e => setWebsite(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Username / Email</Label>
                    <Input value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="flex gap-2">
                      <Input type="text" value={password} onChange={e => setPassword(e.target.value)} required className="font-mono" />
                      <Button type="button" variant="outline" onClick={handleGenerate} disabled={aiLoading}>
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <Button type="button" variant="ghost" onClick={() => handleAnalyze()} disabled={!password || aiLoading} className="text-xs text-zinc-500 dark:text-zinc-400">
                      <Activity className="w-3 h-3 mr-2" /> Analyze Strength
                    </Button>
                  </div>

                  {analysis && (
                    <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-md border border-zinc-200 dark:border-zinc-800 text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">Strength Score:</span>
                        <span className={cn("font-bold", analysis.score > 80 ? "text-emerald-500" : analysis.score > 50 ? "text-yellow-500" : "text-red-500")}>
                          {analysis.score}/100
                        </span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300">{analysis.feedback}</p>
                      {analysis.vulnerabilities.length > 0 && (
                        <ul className="list-disc pl-4 text-red-500 dark:text-red-400 text-xs">
                          {analysis.vulnerabilities.map((v, i) => <li key={i}>{v}</li>)}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">Save Encrypted</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => { lockVault(); signOut(); }}>
              <LogOut className="w-4 h-4 mr-2" /> Exit
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="text-center text-zinc-500 py-12">Decrypting vault...</div>
        ) : entries.length === 0 ? (
          <div className="text-center text-zinc-500 py-12 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
            <Key className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Your vault is empty.</p>
            <p className="text-sm mt-2">Add a password to get started.</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center text-zinc-500 py-12">
            No entries found matching "{searchQuery}".
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredEntries.map(entry => (
              <Card key={entry.id}>
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{entry.title}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{entry.username}</p>
                    {entry.website && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">{entry.website}</p>}
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex items-center flex-1 md:flex-none">
                      <Input 
                        type={showPasswordId === entry.id ? "text" : "password"} 
                        value={entry.password} 
                        readOnly 
                        className="w-full md:w-48 font-mono text-sm pr-10"
                      />
                      <button 
                        onClick={() => setShowPasswordId(showPasswordId === entry.id ? null : entry.id)}
                        className="absolute right-3 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                      >
                        {showPasswordId === entry.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(entry.password)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(entry.id)} className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
