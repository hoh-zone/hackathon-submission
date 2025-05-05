import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 创建 QueryClient 实例
const queryClient = new QueryClient();

// 手动指定测试网 URL
const networks = {
    testnet: { url: 'https://fullnode.testnet.sui.io' },
};

// 错误边界组件
class ErrorBoundary extends React.Component {
    state = { error: null };
    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
        this.setState({ error });
    }
    render() {
        if (this.state.error) {
            return <p>⚠️ 发生错误：${this.state.error.message}</p>;
        }
        return this.props.children;
    }
}

// 配置 OKX 钱包适配器
const okxAdapter = {
    name: 'OKX Wallet',
    icon: 'https://www.okx.com/cdn/assets/imgs/221/4E2F3F9F0D7B8C5B.png',
    connect: async () => {
        console.log('Attempting to connect with OKX Wallet');
        if (window.okxwallet && window.okxwallet.sui) {
            try {
                await window.okxwallet.sui.connect();
                console.log('OKX Wallet connected successfully');
                return true;
            } catch (error) {
                console.error('OKX Wallet connection error:', error);
                return false;
            }
        }
        console.warn('OKX Wallet not installed');
        return false;
    },
    disconnect: async () => {
        console.log('Attempting to disconnect OKX Wallet');
        if (window.okxwallet && window.okxwallet.sui) {
            try {
                await window.okxwallet.sui.disconnect();
                console.log('OKX Wallet disconnected successfully');
            } catch (error) {
                console.error('OKX Wallet disconnection error:', error);
            }
        }
    },
    getAccounts: async () => {
        console.log('Fetching OKX Wallet accounts');
        if (window.okxwallet && window.okxwallet.sui) {
            try {
                const accounts = await window.okxwallet.sui.getAccounts();
                console.log('OKX Wallet accounts:', accounts);
                return accounts || [];
            } catch (error) {
                console.error('OKX Wallet getAccounts error:', error);
                return [];
            }
        }
        return [];
    },
};

// 仅支持 OKX 钱包
const supportedWallets = [okxAdapter];

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networks} defaultNetwork="testnet">
                <WalletProvider supportedWallets={supportedWallets} autoConnect={false}>
                    <ErrorBoundary>
                        <App />
                    </ErrorBoundary>
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    </React.StrictMode>
);