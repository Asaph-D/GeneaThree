// src/App.tsx
import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';

const DemoPage = lazy(() => import('./pages/DemoPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const CreateAccountForm = lazy(() => import('./components/modals/CreateAccountForm'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AssistantPage = lazy(() => import('./pages/AssistantPage'));
const CreationPage = lazy(() => import('./creation/CreationPage'));

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const hideFooter = location.pathname === '/demo' || location.pathname === '/assistant';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') === 'dark';
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
      <main className={hideFooter ? 'min-h-0 flex-1' : undefined}>
        <Suspense fallback={<div className="grid min-h-[40vh] place-items-center text-sm text-zinc-500">Chargement…</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/quick-start" element={<SubscriptionPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/atelier" element={<CreationPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/signin" element={<CreateAccountForm onSubmit={() => undefined} />} />
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
