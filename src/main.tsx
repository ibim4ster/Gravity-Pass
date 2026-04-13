import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/AuthContext.tsx';
import { CryptoProvider } from './lib/CryptoContext.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="gravity-pass-theme">
      <AuthProvider>
        <CryptoProvider>
          <App />
        </CryptoProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
