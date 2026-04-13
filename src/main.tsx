import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/AuthContext.tsx';
import { CryptoProvider } from './lib/CryptoContext.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { isFirebaseConfigured } from './lib/firebase.ts';

function MissingConfig() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-red-500">Missing Firebase Configuration</h1>
        <p className="text-zinc-400">
          The application cannot connect to Firebase. Please ensure you have set the following environment variables in your Vercel project settings:
        </p>
        <ul className="text-sm text-zinc-500 text-left bg-zinc-900 p-4 rounded-md space-y-1 font-mono">
          <li>VITE_FIREBASE_API_KEY</li>
          <li>VITE_FIREBASE_AUTH_DOMAIN</li>
          <li>VITE_FIREBASE_PROJECT_ID</li>
          <li>VITE_FIREBASE_STORAGE_BUCKET</li>
          <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
          <li>VITE_FIREBASE_APP_ID</li>
          <li>VITE_FIRESTORE_DATABASE_ID</li>
        </ul>
        <p className="text-zinc-400 text-sm">
          After adding these variables, redeploy your application.
        </p>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="gravity-pass-theme">
      {isFirebaseConfigured ? (
        <AuthProvider>
          <CryptoProvider>
            <App />
          </CryptoProvider>
        </AuthProvider>
      ) : (
        <MissingConfig />
      )}
    </ThemeProvider>
  </StrictMode>,
);
