// src/App.tsx
import React, { lazy, Suspense, useState, useEffect } from 'react';
import { GitBranch, X } from 'lucide-react';
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

function RouteLoader() {
  return <div className="relative min-h-[55vh] overflow-hidden bg-[#f4f1ea]/70 backdrop-blur-[2px] dark:bg-[#09090b]/70" role="status" aria-label="Chargement de la page">
    <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(56,189,248,.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,.12)_1px,transparent_1px)] [background-size:44px_44px]" />
    <div className="relative grid min-h-[55vh] place-items-center"><div className="flex flex-col items-center gap-4"><div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-sky-400/25 bg-white/70 shadow-2xl dark:bg-zinc-950/70"><span className="absolute inset-1 animate-ping rounded-xl border border-sky-400/30" /><GitBranch className="relative animate-pulse text-sky-500" size={30} /></div><div className="text-center"><p className="font-serif text-lg">GeneaTreePro</p><p className="mt-1 text-xs text-zinc-500">Préparation de votre espace…</p></div></div></div>
  </div>;
}

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
        <Suspense fallback={<RouteLoader />}>
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
