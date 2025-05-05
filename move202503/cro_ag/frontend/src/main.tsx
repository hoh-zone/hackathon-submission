import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import './index.scss';
import './styles/global.scss';
import 'antd/dist/reset.css';
import enUS from 'antd/locale/en_US';
// import 'dayjs/locale/zh-cn';
import { ConfigProvider } from 'antd';
import { Provider } from 'react-redux';
import { store } from './store';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import client from './api/query/query.client';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import '@mysten/dapp-kit/dist/index.css';
import { CroAgSDKProvider } from './context/CroAgSDKContext';
// dayjs.locale('zh-cn');
const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          fontFamily: 'Regular, serif',
        },
      }}
      locale={enUS}
    >
      <Provider store={store}>
        <QueryClientProvider client={client}>
          {/* **devtools */}
          {process.env.NODE_ENV === 'development' ? (
            <ReactQueryDevtools initialIsOpen={false} />
          ) : (
            ''
          )}
          <SuiClientProvider networks={networks} defaultNetwork="mainnet">
            <WalletProvider autoConnect={true}>
              <CroAgSDKProvider>
                <App />
              </CroAgSDKProvider>
            </WalletProvider>
          </SuiClientProvider>
        </QueryClientProvider>
      </Provider>
    </ConfigProvider>
  </React.StrictMode>
);
