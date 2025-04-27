import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import ConnectWallet from '../wallet/ConnectWallet';
import ProfileButton from '../wallet/ProfileButton';
import { Database } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isConnected } = useWallet();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-md">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-primary-900 dark:text-white">SealVault</span>
            </Link>

            <nav className="hidden md:ml-10 md:flex space-x-8">
              <Link to="/" className="text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                首页
              </Link>
              <Link to="/dashboard" className="text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                仪表板
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isConnected ? (
              <ProfileButton />
            ) : (
              <ConnectWallet />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;