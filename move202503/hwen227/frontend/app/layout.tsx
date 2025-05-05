import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Providers } from "./providers";
import { Navbar } from '@/components/ui/navbar';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '匿名投票工具 - ShadowVote',
  description: '基于Sui区块链的安全匿名投票平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.className
      )}>
        <div className="relative flex min-h-screen flex-col">
          <Providers>
            <Navbar />
            <div className="flex-1">
              {children}
            </div>
          </Providers>
          <footer className="border-t py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                &copy; 2025 ShadowVote. 基于Sui区块链构建的隐私保护投票平台
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted-foreground underline underline-offset-4"
                >
                  GitHub
                </a>
                <a
                  href="#"
                  className="text-sm text-muted-foreground underline underline-offset-4"
                >
                  文档
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
