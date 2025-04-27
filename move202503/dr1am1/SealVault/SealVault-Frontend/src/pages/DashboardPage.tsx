import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFiles } from '../context/FileContext';
import { useWallet } from '../context/WalletContext';
import FileUploader from '../components/files/FileUploader';
import FileList from '../components/files/FileList';
import FileStats from '../components/files/FileStats';
import { Activity } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { files } = useFiles();
  const { account } = useWallet();
  const [activeTab, setActiveTab] = useState<'files' | 'activity'>('files');

  const truncateAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto"
    >
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-900 dark:text-white">仪表板</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            已连接: <span className="font-medium">{truncateAddress(account)}</span>
          </p>
        </div>
        
        <FileUploader />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <FileStats />
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('files')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'files'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-neutral-600 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-white'
                }`}
              >
                NFT
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'activity'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-neutral-600 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-white'
                }`}
              >
                活动
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'files' ? (
            <FileList files={files} />
          ) : (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              <Activity className="h-12 w-12 mx-auto mb-4 text-neutral-400 dark:text-neutral-500" />
              <p>暂无活动记录</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;