import { createRoot } from 'react-dom/client'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { networkConfig } from '/@/utils/networkConfig'
import { ConfigProvider } from 'antd'
import PageLayout from './components/Layout'
import '/@/assets/less/basic.less'
import '/@/assets/less/tailwind.css'
import zhCN from 'antd/locale/zh_CN'

const queryClient = new QueryClient()
const container = document.querySelector('#root')

if (container) {
  const root = createRoot(container)

  root.render(
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          // Seed Token，影响范围大
          colorPrimary: '#00b96b',
          borderRadius: 2
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider
            autoConnect
            stashedWallet={{
              name: 'SuiHi-随嗨'
            }}
          >
            <PageLayout />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </ConfigProvider>
  )
}
