import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { WalletProvider } from '@suiet/wallet-kit'
import '@suiet/wallet-kit/style.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import { LangProvider } from './contexts/lang/LangContext'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ThemeProvider>
          <LangProvider>
            <RouterProvider router={router} future={{ v7_startTransition: true }} />
          </LangProvider>
        </ThemeProvider>
      </WalletProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
