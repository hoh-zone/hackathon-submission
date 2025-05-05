"use client";

import { useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useRouter } from "next/navigation";
import Image from "next/image";


export default function HomePage() {
  const currentAccount = useCurrentAccount();
  const router = useRouter();

  useEffect(() => {
    // 这里可以添加一些初始化逻辑
    const fetchState = async () => {
      console.log("initial")
    };

    fetchState();
  }, [currentAccount]);

  // 未连接钱包时的首页
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center py-12">
        <div className="mx-auto mb-4">
          <Image
            src="/sui-logo.png"
            alt="Sui Logo"
            width={80}
            height={80}
            className="mx-auto"
          />
        </div>
        <h1 className="text-2xl font-semibold mb-4 text-primary">匿名投票工具</h1>
        <p className="text-gray-500 mb-8">基于区块链技术的隐私保护投票平台</p>

        <div className="inline-block">
          <button
            onClick={() => router.push('/votes/create')}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md flex items-center"
          >
            <i className="fas fa-plus-circle mr-2"></i>
            创建投票
          </button>
        </div>

        <div className="mt-4">
          <span
            onClick={() => router.push('/votes')}
            className="text-sm text-gray-500 underline cursor-pointer flex items-center justify-center"
          >
            {"探索投票池->"}
          </span>
        </div>

        <div className="mt-16">
          <h2 className="text-lg font-medium mb-6">特色功能</h2>
          <div className="flex flex-col md:flex-row justify-between text-left">
            <div className="flex-1 px-4 mb-6 md:mb-0">
              <div className="text-primary mb-2">
                <i className="fas fa-shield-alt text-xl"></i>
              </div>
              <h3 className="font-medium mb-2">投票加密</h3>
              <p className="text-sm text-gray-600">您的投票选择将被加密上传，确保投票过程中的隐私安全</p>
            </div>
            <div className="flex-1 px-4">
              <div className="text-primary mb-2">
                <i className="fas fa-check-double text-xl"></i>
              </div>
              <h3 className="font-medium mb-2">可验证结果</h3>
              <p className="text-sm text-gray-600">区块链技术确保投票结果公开透明，任何人都可验证</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
