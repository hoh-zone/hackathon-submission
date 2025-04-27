import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@mysten/dapp-kit/dist/index.css';
import SuiProviders from "@/provider";
import { GlobalLodingProvider } from "@/provider/GlobalLoadingProvier";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Onchain dApp Store",
  description: "The first Onchain dApp Store.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SuiProviders>
          <GlobalLodingProvider>
            {children}
          </GlobalLodingProvider>
        </SuiProviders>
      </body>
    </html>
  );
}
