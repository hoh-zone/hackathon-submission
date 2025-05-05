"use client";

import { useState } from "react";
import { useWallets, useCurrentWallet, useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { WalletDropdown } from "./wallet-dropdown";

export function WalletButton() {
    const { wallets, select } = useWallets();
    const { wallet, disconnect } = useCurrentWallet();
    const { account } = useCurrentAccount();
    const [showDropdown, setShowDropdown] = useState(false);

    // 处理连接钱包
    const handleConnect = async () => {
        if (wallets.length > 0) {
            try {
                await select(wallets[0].name);
            } catch (error) {
                console.error("Failed to connect wallet:", error);
            }
        }
    };

    // 处理断开连接
    const handleDisconnect = async () => {
        if (wallet) {
            try {
                await disconnect();
                setShowDropdown(false);
            } catch (error) {
                console.error("Failed to disconnect wallet:", error);
            }
        }
    };

    // 格式化地址显示
    const formatAddress = (address: string): string => {
        if (!address) return "";
        return `${address.slice(0, 5)}...${address.slice(-4)}`;
    };

    // 切换下拉菜单显示
    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    // 点击其他区域关闭下拉菜单
    const closeDropdown = () => {
        setShowDropdown(false);
    };

    const isConnected = !!wallet && !!account;

    if (!isConnected) {
        return (
            <Button onClick={handleConnect} className="bg-primary hover:bg-primary-dark text-white">
                <i className="fas fa-wallet mr-2"></i> 连接钱包
            </Button>
        );
    }

    return (
        <div className="relative">
            <Button
                variant="outline"
                onClick={toggleDropdown}
                className="bg-indigo-50 text-primary border-transparent hover:bg-indigo-100 hover:text-primary-dark"
            >
                <i className="fas fa-wallet mr-2"></i>
                {account && formatAddress(account.address)}
                <i className={`fas fa-chevron-down ml-2 text-xs transition-transform ${showDropdown ? 'rotate-180' : ''}`}></i>
            </Button>

            {showDropdown && (
                <WalletDropdown
                    address={account.address}
                    onClose={closeDropdown}
                    onDisconnect={handleDisconnect}
                />
            )}
        </div>
    );
} 