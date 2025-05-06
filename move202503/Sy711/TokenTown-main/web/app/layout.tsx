import type { Metadata } from "next";
import "./globals.css";
import { inter } from "./fonts";
import { Providers } from "./providers";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TokenTown - 区块链卡牌堆叠游戏",
  description: "TokenTown 是一款基于区块链的卡牌堆叠游戏，每日奖池等你来赢！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="fixed top-14 left-10 z-50">
          <Link href="/">
            <Image 
              src="/logo/logo.png" 
              alt="TokenTown Logo" 
              width={100} 
              height={100} 
              className="rounded-full shadow-lg"
            />
          </Link>
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
