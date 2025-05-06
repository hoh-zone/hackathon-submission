"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ConnectButton } from "@mysten/dapp-kit"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Trophy, Info } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import BackgroundIcons from "../components/background-icons"
import { getPaymentEvents, getTodayLeaderboard } from "@/contracts/query"

export default function HomeScreen() {
  const account = useCurrentAccount()
  const [showConnectPrompt, setShowConnectPrompt] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [vaultAmount, setVaultAmount] = useState<number>(0)
  const [leaderboardCount, setLeaderboardCount] = useState(0) // 新增排行榜长度状态
  const [showLimitPrompt, setShowLimitPrompt] = useState(false) // 新增限制提示状态

  // 获取排行榜数据时更新长度
  useEffect(() => {
    // 获取奖池金额
    const fetchVaultAmount = async () => {
      const amount = await getPaymentEvents()
      setVaultAmount(amount ?? 0)
    }

    // 获取排行榜数据
    const fetchLeaderboard = async () => {
      const events = await getTodayLeaderboard()
      setLeaderboardCount(events.length)
    }

    fetchVaultAmount()
    fetchLeaderboard()
  }, [])

  // 处理游戏按钮点击
  const handleGameButtonClick = () => {
    if (leaderboardCount >= 5) {
      setShowLimitPrompt(true)
      return
    }
  }

  // 删除 isConnected 状态

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      {/* 背景图标 */}
      <div className="absolute inset-0 z-0">
        <BackgroundIcons />
      </div>

      {/* 顶部导航 */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <div className="w-20"></div> {/* 为固定的 Logo 预留空间 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            <Info size={16} />
            <span>游戏规则</span>
          </button>
          <ConnectButton />
        </div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-8 text-center"
        >
          <h1 className="text-5xl font-bold text-white drop-shadow-glow">TokenTown</h1>
          <p className="mt-2 text-lg text-[#a0aec0]">区块链卡牌堆叠游戏</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-300">
              <Trophy size={14} />
              <span>今日奖池: {vaultAmount} SUI</span>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-4">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: account ? 1.05 : 1, boxShadow: account ? "0 0 25px rgba(66, 153, 225, 0.6)" : "none" }}
            whileTap={{ scale: account ? 0.95 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`relative overflow-hidden rounded-full px-16 py-4 font-bold text-white shadow-lg ${
              account ? "bg-gradient-to-r from-[#4DA2FF] to-[#0DC3A4]" : "bg-gray-400/50 cursor-not-allowed"
            }`}
            onClick={() => {
              if (!account) {
                setShowConnectPrompt(true)
              } else if (leaderboardCount >= 5) {
                setShowLimitPrompt(true)
              }
            }}
          >
            {account ? (
              <Link href={leaderboardCount < 5 ? "/game" : "#"} className="block w-full h-full" onClick={(e) => leaderboardCount >= 5 && e.preventDefault()}>
                <span className="relative z-10 text-xl">{leaderboardCount >= 5 ? "今日已满" : "开始游戏"}</span>
              </Link>
            ) : (
              <span className="relative z-10 text-xl">连接钱包</span>
            )}
          </motion.button>
          <Dialog open={showConnectPrompt} onOpenChange={setShowConnectPrompt}></Dialog>
          
          {/* 新增每日限制提示弹窗 */}
          <Dialog open={showLimitPrompt} onOpenChange={setShowLimitPrompt}>
            <DialogContent className="bg-gray-900 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl">每日限制</DialogTitle>
                <DialogDescription className="text-gray-300">游戏参与人数已达上限</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p>今日游戏参与人数已达到5人上限，请明天再来参与！</p>
                <p>您可以查看当前排行榜，了解今日游戏情况。</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Link href="/rankings" className="mt-4">
          {" "}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-8 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            <Trophy size={20} />
            <span>查看排行榜</span>
          </motion.button>
        </Link>
      </div>

      {/* 规则弹窗 */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">游戏规则</DialogTitle>
            <DialogDescription className="text-gray-300">TokenTown 堆堆乐游戏规则说明</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="mb-1 font-medium text-blue-400">基本规则</h3>
              <p>1. 初始获得30张卡牌分配至7个卡槽</p>
              <p>2. 从卡槽中选定一类卡牌为目标堆叠卡</p>
              <p>3. 只能将相同类型卡牌堆叠至目标卡槽</p>
              <p>4. 每日前6次抽卡免费，之后每次抽卡0.2 SUI</p>
              <h4 className="mt-2 mb-1 font-medium text-red-400">结束之前，已经提交了的玩家可以再次提交哟（取最高成绩）</h4>
            </div>
            <div>
              <h3 className="mb-1 font-medium text-blue-400">奖励机制</h3>
              <p>1. 若当日有人付费抽卡，排名第1名玩家可获得金库一半的奖励</p>
              <p>2. 若当日有人付费抽卡，作为激励最后提交者可获得1/6金库奖励</p>
              <p>3. 第一位付费提交者可获得1/3金库奖励</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
