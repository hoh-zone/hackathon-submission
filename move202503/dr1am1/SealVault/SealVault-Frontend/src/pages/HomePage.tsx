import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Lock, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConnectWallet from '../components/wallet/ConnectWallet';
import { useWallet } from '../context/WalletContext';

type HomePageProps = {
  redirectMessage?: boolean;
};

const HomePage: React.FC<HomePageProps> = ({ redirectMessage = false }) => {
  const { isConnected } = useWallet();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isConnected) {
      navigate('/dashboard');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-6xl mx-auto"
    >
      {redirectMessage && (
        <div className="mb-8 p-4 bg-warning-50 border-l-4 border-warning-500 text-warning-700 rounded">
          <p className="font-medium">请连接您的钱包以访问仪表板。</p>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-12 pb-24 text-center">
        <motion.h1 
          className="text-4xl md:text-6xl font-bold text-primary-950 dark:text-white mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          文件即资产 <br />
          <span className="text-accent-500">访问靠持有</span>
        </motion.h1>
        
        <motion.p 
          className="text-xl text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto mb-12"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          将您的文件转化为数字资产，通过区块链技术实现安全存储和访问控制。
          只有持有相应NFT的用户才能访问您的文件。
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative">
            <div className="relative">
              {!isConnected ? (
                <ConnectWallet size="large" />
              ) : (
                <button
                  onClick={handleGetStarted}
                  className="flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all"
                >
                  进入仪表板 <ArrowRight size={20} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-neutral-800 rounded-3xl shadow-sm px-8">
        <h2 className="text-3xl font-bold text-center mb-16 text-primary-900 dark:text-white">核心功能</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div 
            className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-700 shadow-sm"
            whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="h-14 w-14 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-primary-600 dark:text-primary-300" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-primary-900 dark:text-white">安全存储</h3>
            <p className="text-neutral-600 dark:text-neutral-300">您的文件经过加密并存储在walrus中，确保最高级别的安全和隐私。</p>
          </motion.div>

          <motion.div 
            className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-700 shadow-sm"
            whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="h-14 w-14 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-7 w-7 text-secondary-600 dark:text-secondary-300" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-primary-900 dark:text-white">Web3 认证</h3>
            <p className="text-neutral-600 dark:text-neutral-300">使用您喜欢的钱包连接，无需传统的用户名/密码即可安全访问您的文件。</p>
          </motion.div>

          <motion.div 
            className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-700 shadow-sm"
            whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="h-14 w-14 bg-accent-100 dark:bg-accent-800 rounded-full flex items-center justify-center mb-4">
              <Database className="h-7 w-7 text-accent-600 dark:text-accent-300" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-primary-900 dark:text-white">不可篡改记录</h3>
            <p className="text-neutral-600 dark:text-neutral-300">所有文件上传都会被记录在区块链上，创建永久且可验证的数据历史记录。</p>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default HomePage;