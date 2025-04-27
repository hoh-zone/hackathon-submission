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
    title: "BlackSquid Jumping: Remastered",
    description: "BlackSquid Jumping: Remastered",
    icons: `${process.env.NEXT_PUBLIC_AGGREGATOR}/XDRQ-jpUnIi8gLCg__Q7Fo5DoeDQmV4E0ggkEPM0lVc`
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
