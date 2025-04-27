// src/main.tsx
import ReactDOM from 'react-dom/client';
import { WalletProvider } from '@suiet/wallet-kit';            // :contentReference[oaicite:0]{index=0}
import '@suiet/wallet-kit/style.css';                         // 必须引入样式
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WalletProvider>
    <App />
  </WalletProvider>
);

