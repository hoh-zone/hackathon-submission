import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getFullnodeUrl } from '@mysten/sui/client';
import { DEFAULT_NETWORK } from './config/config';

// 布局
import MainLayout from './components/layout/MainLayout';

// 页面
import HomePage from './pages/Home';
import AdSpacesPage from './pages/AdSpaces';
import AdSpaceDetailPage from './pages/AdSpaceDetail';
import PurchaseAdSpacePage from './pages/PurchaseAdSpace';
import MyNFTsPage from './pages/MyNFTs';
import NFTDetailPage from './pages/NFTDetail';
import ManagePage from './pages/Manage';
import NotFoundPage from './pages/NotFound';

// 全局样式
import './App.scss';
import '@mysten/dapp-kit/dist/index.css';
import './styles/AdSpaceDetailFix.css';

const queryClient = new QueryClient();

// 配置网络
const networks = {
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  devnet: { url: getFullnodeUrl('devnet') },
  localnet: { url: 'http://localhost:9000' },
};

// 推荐：所有页面/组件的链上数据请求都用 react-query 包裹 contract.ts 的异步方法
// 例如：const { data, isLoading } = useQuery(['adSpaces'], getAvailableAdSpaces)

function App() {
  // 监听网络变化
  useEffect(() => {
    // 保存当前网络到 localStorage
    localStorage.setItem('current_network', DEFAULT_NETWORK);

    // 监听网络变化
    window.addEventListener('sui_networkChange', (event: any) => {
      const newNetwork = event.detail?.network || DEFAULT_NETWORK;
      localStorage.setItem('current_network', newNetwork);
    });

    return () => {
      window.removeEventListener('sui_networkChange', () => {});
    };
  }, []);

  return (
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networks} defaultNetwork={DEFAULT_NETWORK}>
          <WalletProvider autoConnect={true}>
            <Router>
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/ad-spaces" element={<AdSpacesPage />} />
                <Route path="/ad-spaces/:id" element={<AdSpaceDetailPage />} />
                <Route path="/ad-spaces/:id/purchase" element={<PurchaseAdSpacePage />} />
                <Route path="/my-nfts" element={<MyNFTsPage />} />
                <Route path="/my-nfts/:id" element={<NFTDetailPage />} />
                <Route path="/my-nfts/:id/renew" element={<NFTDetailPage />} />
                <Route path="/manage" element={<ManagePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </MainLayout>
          </Router>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
