"use client"
import { Suspense } from "react"
import GameBoard from "@/components/game-board"
import { useCurrentAccount } from '@mysten/dapp-kit';

function GameContent() {
  const account = useCurrentAccount();
  console.log(account?.address, "当前账户")
  
  if (!account) {
    return <div className="flex h-screen w-full items-center justify-center">请先连接钱包</div>
  }

  return <GameBoard accountAddress={account.address} />
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">加载中...</div>}>
      <GameContent />
    </Suspense>
  )
}
