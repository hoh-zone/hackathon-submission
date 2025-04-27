import {ReactNode} from "react";
import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import CustomProvider from "@/providers";
import CustomContextProvider from "@/contexts";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Fight For Dove",
    description: "Fight For Dove",
    icons: `${process.env.NEXT_PUBLIC_AGGREGATOR}/7zi-F7J4B9JqsQ_PjfIpTUiK1NZywVXRiC00deTHZ2Q`
};

export default function RootLayout({children}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased select-none`}>
                <CustomProvider>
                    <CustomContextProvider>
                        {children}
                    </CustomContextProvider>
                </CustomProvider>
            </body>
        </html>
    );
}