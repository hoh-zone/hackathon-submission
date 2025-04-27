"use client"

import { useState, useEffect } from "react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Users, Info } from "lucide-react"
import { Card } from "@/components/ui/card"
import { getTodayLeaderboard, getTodayFirstSubmitter, getPaymentEvents } from "@/contracts/query"
import type { DailyLeaderboardEvent } from "@/types/game-types"
import { formatAddress } from "@mysten/sui/utils"

export default function Rankings() {
  const [isLoading, setIsLoading] = useState(true)
  const [vaultAmount, setVaultAmount] = useState<number>(0)
  const [rankings, setRankings] = useState<DailyLeaderboardEvent[]>([])
  const account = useCurrentAccount()
  const [firstPlayer, setFirstPlayer] = useState<string>("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [leaderboardData, vaultData, firstSubmitterData] = await Promise.all([
          getTodayLeaderboard(),
          getPaymentEvents(),
          getTodayFirstSubmitter(),
        ])

        setRankings(leaderboardData)
        setVaultAmount(vaultData ?? 0)
        setFirstPlayer(firstSubmitterData ?? "")
        setIsLoading(false)
      } catch (e) {
        console.error("Error fetching rankings data:", e)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="w-full">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-white">TokenTown 排行榜</h2>
        <p className="mt-1 text-gray-300">当前金库总额: {vaultAmount} SUI</p>
      </div>

      <Card className="w-full bg-black/20 p-4">
        <h3 className="text-xl font-bold text-white mb-4 text-center">今日排行</h3>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-lg bg-blue-900/20 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-blue-400" />
                  <span className="text-sm text-gray-300">仅限前20名玩家参与游戏</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-400" />
                  <span className="text-sm text-gray-300">限制名额: 20名</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-black/40 p-4">
              <div className="mb-3 grid grid-cols-12 text-xs font-medium text-white">
                <div className="col-span-1">排名</div>
                <div className="col-span-5">玩家</div>
                <div className="col-span-3">卡牌数</div>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {rankings.map((item: DailyLeaderboardEvent, idx: number) => (
                  <div
                    key={item.player + "-" + idx}
                    className={`grid grid-cols-12 items-center rounded py-2 text-sm ${
                      account && item.player === account.address ? "bg-blue-900/30" : ""
                    }`}
                  >
                    <div className="col-span-1 font-bold text-white">{idx + 1}</div>
                    <div className="col-span-5 flex items-center gap-1 text-white">
                      {formatAddress(item.player)}
                      {firstPlayer && item.player === firstPlayer && (
                        <span className="rounded bg-purple-500/30 px-1 py-0.5 text-xs text-purple-300">首位提交</span>
                      )}
                    </div>
                    <div className="col-span-3 text-white">{item.card_count}张</div>
                   
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
