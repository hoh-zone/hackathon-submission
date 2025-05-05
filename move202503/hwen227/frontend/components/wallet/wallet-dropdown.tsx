"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface WalletDropdownProps {
    address: string;
    onClose: () => void;
    onDisconnect: () => void;
}

export function WalletDropdown({ onClose, onDisconnect }: WalletDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={dropdownRef}
            className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
        >
            <div className="py-3 px-4 border-b border-gray-100 flex items-center cursor-pointer hover:bg-gray-50">
                <i className="fas fa-user text-primary mr-2"></i>
                <Link href="/profile" className="text-sm font-medium">个人主页</Link>
            </div>
            <div
                className="py-3 px-4 flex items-center cursor-pointer hover:bg-gray-50"
                onClick={onDisconnect}
            >
                <i className="fas fa-sign-out-alt text-red-500 mr-2"></i>
                <span className="text-sm font-medium">断开连接</span>
            </div>
        </div>
    );
} 