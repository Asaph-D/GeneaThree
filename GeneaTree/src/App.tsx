// src/App.tsx
import React, { lazy, Suspense, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import { useAuth } from './auth/AuthContext';

const DemoPage = lazy(() => import('./pages/DemoPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const CreateAccountForm = lazy(() => import('./components/modals/CreateAccountForm'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AssistantPage = lazy(() => import('./pages/AssistantPage'));
const CreationPage = lazy(() => import('./creation/CreationPage'));

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  const location = useLocation();
  const { authError, clearAuthError } = useAuth();
  const hideFooter = location.pathname === '/demo' || location.pathname === '/assistant';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') !== 'light';
    setDarkMode(savedTheme);
    document.body.classList.toggle('dark', savedTheme);
  }, [location.pathname]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className={`flex flex-col bg-[#f4f1ea] text-zinc-900 transition-colors duration-300 dark:bg-[#09090b] dark:text-zinc-100 ${hideFooter ? 'h-dvh overflow-hidden' : 'min-h-dvh'}`}>
      <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />
      {authError && (
        <div role="alert" className="fixed left-1/2 top-20 z-[90] flex w-[min(92vw,42rem)] -translate-x-1/2 items-start gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-2xl dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          <span className="flex-1"><strong>Connexion impossible.</strong> {authError}</span>
          <button type="button" onClick={clearAuthError} aria-label="Fermer le message"><X size={18} /></button>
        </div>
      )}
      <main className={hideFooter ? 'min-h-0 flex-1' : undefined}>
        <Suspense fallback={<div className="grid min-h-[40vh] place-items-center text-sm text-zinc-500">Chargement…</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/quick-start" element={<SubscriptionPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/atelier" element={<CreationPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/signin" element={<CreateAccountForm />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FaqPage />} />
          </Routes>
        </Suspense>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default App;
