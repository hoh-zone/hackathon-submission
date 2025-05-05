"use client";

import Link from "next/link";
import { ConnectButton } from "@mysten/dapp-kit";

export function Navbar() {
    return (
        <nav className="w-full bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-10">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold text-primary">
                    ShadowVote
                </Link>

                <div>
                    <ConnectButton connectText="Connect Wallet" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md flex items-center">
                        <i className="fas fa-wallet mr-2"></i>
                    </ConnectButton>
                </div>
            </div>
        </nav>
    );
} 