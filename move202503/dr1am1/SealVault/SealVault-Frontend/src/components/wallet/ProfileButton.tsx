import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { User, LogOut, Copy, ExternalLink, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '../../context/FileContext';

const ProfileButton: React.FC = () => {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const { files, removeFile } = useFiles();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const truncateAddress = (address: string | undefined) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDisconnect = () => {
    try {
      disconnect(undefined, {
        onSuccess: () => {
          // 清除所有文件
          files.forEach(file => removeFile(file.id));
          setIsOpen(false);
          navigate('/');
        },
        onError: (error) => {
          console.error('Error disconnecting wallet:', error);
        }
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  if (!account) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-2 px-3 rounded-lg bg-primary-50 dark:bg-neutral-800 hover:bg-primary-100 dark:hover:bg-neutral-700 transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
          <User size={16} className="text-primary-700 dark:text-primary-400" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-neutral-800 dark:text-white">
            {truncateAddress(account.address)}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Sui 网络</p>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-72 bg-white dark:bg-neutral-800 rounded-xl shadow-lg z-40 overflow-hidden"
            >
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <User size={20} className="text-primary-700 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-800 dark:text-white">
                      {truncateAddress(account.address)}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Sui 网络</p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => copyToClipboard(account.address)}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Copy size={16} className="text-neutral-500" />
                  <span className="text-sm text-neutral-800 dark:text-white">复制地址</span>
                </button>
                
                <a
                  href={`https://suiexplorer.com/address/${account.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <ExternalLink size={16} className="text-neutral-500" />
                  <span className="text-sm text-neutral-800 dark:text-white">在浏览器中查看</span>
                </a>
                
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-error-600 dark:text-error-400 transition-colors"
                >
                  <LogOut size={16} />
                  <span className="text-sm">断开连接</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileButton;