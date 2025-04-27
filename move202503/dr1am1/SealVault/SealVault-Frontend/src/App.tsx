import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import { useWallet } from './context/WalletContext';

function App() {
  const { isConnected } = useWallet();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/dashboard" 
              element={
                isConnected ? <DashboardPage /> : <HomePage redirectMessage={true} />
              } 
            />
          </Routes>
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}

export default App;