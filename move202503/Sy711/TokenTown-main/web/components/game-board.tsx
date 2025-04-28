"use client"

import { useState, useEffect, useMemo } from "react"
import TargetStack from "@/components/game/TargetStack"
import CardSlot from "@/components/game/CardSlot"
import TrashBin from "@/components/game/TrashBin"
import type { CardType, Card, CardSlots } from "@/types/game-types"
import { motion } from "framer-motion"
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  pointerWithin,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core"
import { Wallet, Loader2, RefreshCw, Send, Trophy, Info } from "lucide-react"
import Link from "next/link"
import { formatAddress } from "@mysten/sui/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import BackgroundIcons from "../components/background-icons"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSuiClientQuery } from "@mysten/dapp-kit"
import { useBetterSignAndExecuteTransaction } from "@/hooks/useBetterTx"
import { previewPaymentTx, previewIncentiveSubmitTx, getLatestIncentiveSubmitEvent } from "@/contracts/query"
import type { IncentiveSubmitPreviewResult } from "@/types/game-types"
// Import the Rankings component at the top of the file
import Rankings from "@/components/game/Rankings"

// 定义卡牌类型

interface Props {
  accountAddress: string
}
export default function GameBoard({ accountAddress }: Props) {
  const [gameState, setGameState] = useState<"playing" | "submitted" | "finished">("playing")
  const [cardSlots, setCardSlots] = useState<CardSlots[]>([])
  const [targetStack, setTargetStack] = useState<Card[]>([])
  const [selectedCardType, setSelectedCardType] = useState<CardType | null>(null)
  const [drawCount, setDrawCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [showRankings, setShowRankings] = useState(false)
  const [trashError, setTrashError] = useState<string | null>(null)
  const [showTrashSuccess, setShowTrashSuccess] = useState(false)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  // 修改 DndContext 配置，优化拖拽灵敏度和响应性

  // 找到 sensors 配置部分并替换为以下代码
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // 使用更低的激活阈值，提高响应性
      activationConstraint: {
        distance: 1, // 降低到1px就可以开始拖拽
        tolerance: 8, // 增加容差
        delay: 0, // 移除延迟
      },
    }),
    useSensor(TouchSensor, {
      // 为触摸设备优化
      activationConstraint: {
        delay: 0, // 移除延迟
        tolerance: 10, // 增加容差
      },
    }),
  )

  // 添加自定义拖动动画配置
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  }

  const { handleSignAndExecuteTransaction: previewPayment } = useBetterSignAndExecuteTransaction({
    tx: previewPaymentTx,
  })
  const { handleSignAndExecuteTransaction: previewIncentiveSubmit } = useBetterSignAndExecuteTransaction({
    tx: previewIncentiveSubmitTx,
  })

  const [previewResult, setPreviewResult] = useState<IncentiveSubmitPreviewResult | null>(null)
  // 修改后的余额查询代码
  const {
    data: balance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useSuiClientQuery(
    "getBalance",
    {
      owner: accountAddress,
      coinType: "0x2::sui::SUI",
    },
    {
      enabled: !!accountAddress,
      refetchInterval: 3000,
    },
  )

  // 添加调试信息
  useEffect(() => {
    if (balanceError) {
      console.error("余额查询错误:", balanceError)
    }
  }, [accountAddress, balance, balanceError])

  // 修改后的余额显示逻辑
  const walletBalance = useMemo(() => {
    if (!balance || !balance.totalBalance) {
      return 0
    }

    return Number(balance?.totalBalance) / 1e9
  }, [balance])
  const [currentCardTypes, setCurrentCardTypes] = useState<CardType[]>([])

  // 初始化游戏
  useEffect(() => {
    // 初始化空卡槽
    initializeEmptySlots()
  }, [])

  // 初始化空卡槽
  const initializeEmptySlots = () => {
    const slots: CardSlots[] = []
    // 创建7个空卡槽
    for (let i = 0; i < 7; i++) {
      slots.push({
        id: `slot-${i}`,
        cards: [],
      })
    }
    setCardSlots(slots)
  }

  // 新增：处理拖拽开始事件
  const handleDragStart = (event: DragStartEvent) => {
    console.log("Drag Start - Active ID:", event.active.id)
    setActiveCardId(event.active.id as string)
  }

  // 处理卡牌拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCardId(null)

    if (!over) return

    const cardId = active.id as string
    const [sourceSlotId, cardIndex] = getCardLocation(cardId)

    if (!sourceSlotId || cardIndex === -1) return

    // 找到被拖拽的卡牌
    const sourceSlotIndex = cardSlots.findIndex((slot) => slot.id === sourceSlotId)
    if (sourceSlotIndex === -1) return

    const card = cardSlots[sourceSlotIndex].cards[cardIndex]

    // 检查是否是最顶层的卡牌
    const isTopCard = cardIndex === cardSlots[sourceSlotIndex].cards.length - 1

    // 如果不是最顶层卡牌，不允许拖拽
    if (!isTopCard) return

    // 如果目标是垃圾桶
    if (over.id === "trash-bin") {
      // 计算当前卡槽中同类型卡牌的数量
      const sameTypeCardsInSlot = cardSlots[sourceSlotIndex].cards.filter((c) => c.type === card.type)
      const sameTypeCountInSlot = sameTypeCardsInSlot.length

      // 检查是否满足丢弃条件（当前卡槽中同类型卡牌数量 >= 10）
      if (sameTypeCountInSlot >= 10) {
        // 只从当前卡槽中移除该类型的卡牌
        const newCardSlots = [...cardSlots]
        newCardSlots[sourceSlotIndex].cards = newCardSlots[sourceSlotIndex].cards.filter((c) => c.type !== card.type)

        setCardSlots(newCardSlots)
        setShowTrashSuccess(true)
        setTimeout(() => setShowTrashSuccess(false), 2000)
      } else {
        // 显示错误信息
        setTrashError(`需要至少10张相同类型的卡牌才能丢弃（当前卡槽: ${sameTypeCountInSlot}张）`)
        setTimeout(() => setTrashError(null), 3000)
      }
      return
    }

    // 如果目标是目标堆
    if (over.id === "target-stack") {
      // 检查是否已经选择了卡牌类型
      if (selectedCardType === null) {
        // 第一次选择，设置目标卡牌类型
        setSelectedCardType(card.type)
        // 移动所有相同类型的卡牌
        moveAllSameTypeCards(sourceSlotIndex, card.type, "target")
      } else if (card.type === selectedCardType) {
        // 类型匹配，移动所有相同类型的卡牌
        moveAllSameTypeCards(sourceSlotIndex, card.type, "target")
      }
    }
    // 如果目标是另一个卡槽
    else if (typeof over.id === "string" && over.id.startsWith("slot-")) {
      const targetSlotIndex = cardSlots.findIndex((slot) => slot.id === over.id)
      if (targetSlotIndex === -1 || targetSlotIndex === sourceSlotIndex) return

      // 检查目标卡槽中是否有卡牌
      if (cardSlots[targetSlotIndex].cards.length > 0) {
        // 检查目标卡槽顶部卡牌类型是否与拖拽卡牌类型一致
        const targetTopCard = cardSlots[targetSlotIndex].cards[cardSlots[targetSlotIndex].cards.length - 1]
        if (targetTopCard.type !== card.type) {
          // 类型不匹配，不允许拖拽
          return
        }
      }

      // 移动所有相同类型的卡牌到目标卡槽
      moveAllSameTypeCards(sourceSlotIndex, card.type, "slot", targetSlotIndex)
    }
  }

  const moveAllSameTypeCards = (
    sourceSlotIndex: number,
    cardType: CardType,
    targetType: "target" | "slot",
    targetSlotIndex?: number,
  ) => {
    const newCardSlots = [...cardSlots]
    const sourceSlot = newCardSlots[sourceSlotIndex]

    // 只获取从顶部开始连续的相同类型卡牌
    const topCardIndex = sourceSlot.cards.length - 1
    const consecutiveSameTypeCards: Card[] = []

    // 从顶部开始向下检查连续的相同类型卡牌
    for (let i = topCardIndex; i >= 0; i--) {
      if (sourceSlot.cards[i].type === cardType) {
        consecutiveSameTypeCards.unshift(sourceSlot.cards[i])
      } else {
        // 一旦遇到不同类型的卡牌，就停止
        break
      }
    }

    // 从源卡槽中移除这些连续的相同类型卡牌
    newCardSlots[sourceSlotIndex].cards = sourceSlot.cards.slice(
      0,
      sourceSlot.cards.length - consecutiveSameTypeCards.length,
    )

    if (targetType === "target") {
      // 添加到目标堆
      setTargetStack((prev) => [...prev, ...consecutiveSameTypeCards])
    } else if (targetType === "slot" && targetSlotIndex !== undefined) {
      // 添加到目标卡槽
      newCardSlots[targetSlotIndex].cards = [...newCardSlots[targetSlotIndex].cards, ...consecutiveSameTypeCards]
    }

    // 更新卡槽
    setCardSlots(newCardSlots)
  }
  // 获取卡牌所在的卡槽和索引
  const getCardLocation = (cardId: string): [string | null, number] => {
    for (const slot of cardSlots) {
      const cardIndex = slot.cards.findIndex((card) => card.id === cardId)
      if (cardIndex !== -1) {
        return [slot.id, cardIndex]
      }
    }
    return [null, -1]
  }

  // 获取当前拖拽的卡牌
  const getActiveCard = (): Card | null => {
    if (!activeCardId) return null

    for (const slot of cardSlots) {
      const card = slot.cards.find((card) => card.id === activeCardId)
      if (card) return card
    }

    return null
  }

  // 抽取新卡
  const handleDrawCards = () => {
    if (!accountAddress) {
      alert("请先连接钱包")
      return
    }
    setIsLoading(true) // 首先设置加载状态

    // 如果超过免费次数，扣除SUI
    const currentBalance = Number(balance?.totalBalance || 0) / 1e9
    if (drawCount >= 6) {
      if (currentBalance < 0.2) {
        alert("余额不足，无法抽卡")
        setIsLoading(false) // 余额不足时重置加载状态
        return
      }
      previewPayment({ wallet: null })
        .onSuccess(async (result) => {
          console.log("付款成功", result)

          distributeNewCards()
          setDrawCount((prev) => prev + 1)
          setIsLoading(false) // 完成后重置加载状态
        })
        .onError(async (e) => {
          console.log("付款失败", e)
          alert("抽卡过程中发生错误")
          setIsLoading(false) // 错误时重置加载状态
        })
        .execute()
    } else {
      // 免费抽卡
      distributeNewCards()
      setDrawCount((prev) => prev + 1)
      setIsLoading(false) // 完成后重置加载状态
    }
  }
  // 分配新卡牌到卡槽
  const distributeNewCards = () => {
    const allCardTypes: CardType[] = ["wusdc", "wbtc", "wal", "cetus", "usdt", "sui", "navx", "deep", "fdusd", "ns","blue"]

    // 随机选择7种卡牌类型
    const shuffledTypes = [...allCardTypes].sort(() => Math.random() - 0.5)
    const selectedTypes = shuffledTypes.slice(0, 7)

    // 保存当前使用的卡牌类型
    setCurrentCardTypes(selectedTypes)

    const newCardSlots = [...cardSlots]

    // 为每个卡槽添加4-5张新卡牌，只使用选定的7种类型
    for (let i = 0; i < newCardSlots.length; i++) {
      const cardCount = Math.floor(Math.random() * 2) + 4 // 4-5张卡牌
      for (let j = 0; j < cardCount; j++) {
        const randomType = selectedTypes[Math.floor(Math.random() * selectedTypes.length)]
        // 改进卡牌 ID 生成，确保唯一性
        const uniqueId = `card-${i}-${j}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
        newCardSlots[i].cards.push({
          id: uniqueId,
          type: randomType,
          image: `/${randomType}${randomType === "wal" || randomType === "cetus"|| randomType === "blue" ? ".png" : ".svg"}`,
        })
      }
    }

    setCardSlots(newCardSlots)
  }

  // 提交卡组
  const handleSubmit = async (cardCount: number) => {
    if (targetStack.length === 0) {
      alert("请先选择卡牌")
      return
    }
    const now = new Date();
const currentDay = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
console.log(currentDay)
    setIsLoading(true)
    previewIncentiveSubmit({ cardCount: cardCount,time:currentDay })
      .onSuccess(async (result) => {
        console.log("提交成功", result)
        setTimeout(() => {
          setGameState("submitted")
          setIsLoading(false)
        }, 1500)
        getLatestIncentiveSubmitEvent().then((value) => {
          setPreviewResult(value ?? null)
        })
      })

      .onError(async (e) => {
        console.log("提交失败", e)
        // 添加错误提示和重置加载状态
        alert("提交失败：" + ("提交人数已满"))
        setIsLoading(false)
      })
      .execute()
  }

  // 获取当前拖拽的卡牌
  const activeCard = getActiveCard()

  return (
    <div className="relative min-h-screen w-full p-4">
      <div className="absolute inset-0 z-[-2]">
        <BackgroundIcons />
      </div>
      {/* 顶部状态栏 */}
      <div className="mb-4 flex items-center justify-between rounded-lg bg-black/30 p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="text-yellow-400" />
          <span className="text-sm font-medium text-white">{walletBalance.toFixed(6)} SUI</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRankings(true)}
            className="flex items-center gap-1 rounded bg-blue-600/80 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Trophy size={16} />
            排行榜
          </button>
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 rounded bg-gray-600/50 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            <Info size={16} />
            规则
          </button>
        </div>
      </div>

      {/* 游戏界面 */}
      {gameState === "playing" && (
        // 修改：在 DndContext 上添加 sensors 和 collisionDetection 策略
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          autoScroll={{
            enabled: true,
            threshold: {
              x: 0,
              y: 0,
            },
          }}
        >
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 目标卡牌堆 */}
              <div className="relative">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-300">目标卡牌堆</h3>
                  <span className="text-xs text-gray-400">
                    {selectedCardType
                      ? `已选择 ${selectedCardType.toUpperCase()} 类型卡牌`
                      : "请选择一种卡牌类型作为目标"}
                  </span>
                </div>
                <TargetStack cards={targetStack} selectedType={selectedCardType} isLocked={false} />
              </div>

              {/* 垃圾桶 */}
              <div className="relative">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-300">垃圾桶</h3>
                  <span className="text-xs text-gray-400">需要至少10张相同类型卡牌才能丢弃</span>
                </div>
                <TrashBin error={trashError} success={showTrashSuccess} />
              </div>
            </div>

            {/* 卡牌区域 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-300">卡牌区域</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleDrawCards}
                        disabled={isLoading}
                        className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-600"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        抽卡 {drawCount >= 6 ? "(0.2 SUI)" : `(${6 - drawCount}/6免费)`}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>每日前6次抽卡免费，之后每次需要0.2 SUI</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {cardSlots.map((slot) => (
                  <CardSlot key={slot.id} slot={slot} isDisabled={isLoading} selectedType={selectedCardType} />
                ))}
              </div>
            </div>
          </div>

          {/* 拖拽覆盖层 - 显示当前拖拽的卡牌 */}
          <DragOverlay dropAnimation={dropAnimation}>
            {activeCard && (
              <div className="relative">
                <img
                  src={activeCard.image || "/placeholder.svg"}
                  alt={activeCard.type}
                  className="h-16 w-16 rounded-full border-2 border-green-400 bg-black/40 p-1 shadow-lg scale-110"
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* 新增固定定位按钮容器 */}
      {gameState === "playing" && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform">
          <button
            onClick={() => handleSubmit(targetStack.length)}
            disabled={targetStack.length === 0 || isLoading}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 font-medium text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            提交成绩
          </button>
        </div>
      )}

      {/* 提交成功界面 */}
      {gameState === "submitted" && (
        <div className="flex h-[70vh] flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-8 rounded-2xl bg-gradient-to-b from-black/50 to-black/70 p-8 text-center backdrop-blur-md"
          >
            <Trophy className="mx-auto mb-4 h-20 w-20 text-yellow-400" />
            <h2 className="mb-2 text-3xl font-bold text-white">提交成功!</h2>
            <p className="mb-6 text-xl text-gray-300">
              您已成功提交 {targetStack.length} 张 {selectedCardType?.toUpperCase()} 卡牌
            </p>
            {previewResult && (
              <div className="mb-6 space-y-2 text-left">
                <p className="text-sm text-gray-300">
                  自己: <span className="font-bold text-white">{formatAddress(previewResult.endPlayer)}</span>
                </p>
                <p className="text-sm text-gray-300">
                  自己奖励:{" "}
                  <span className="font-bold text-white">{Number(previewResult.endAmount) / 1_000_000_000}</span>
                </p>
                <p className="text-sm text-gray-300">
                  赢家 <span className="font-bold text-white">{formatAddress(previewResult.ownPlayer)}</span>
                </p>
                <p className="text-sm text-gray-300">
                  赢家奖励:{" "}
                  <span className="font-bold text-white">{Number(previewResult.ownAmount) / 1_000_000_000}</span>
                </p>
                <p className="text-sm text-gray-300">
                  首位玩家: <span className="font-bold text-white">{formatAddress(previewResult.firstPlayer)}</span>
                </p>
                <p className="text-sm text-gray-300">
                  首位奖励:{" "}
                  <span className="font-bold text-white">{Number(previewResult.firstAmount) / 1_000_000_000}</span>
                </p>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <Link href="/">
                <Button variant="outline" className="bg-gray-800 text-white hover:bg-gray-700">
                  返回首页
                </Button>
              </Link>
              <Button onClick={() => setShowRankings(true)} className="bg-blue-600 hover:bg-blue-700">
                查看排行榜
              </Button>
            </div>
          </motion.div>
        </div>
      )}

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

      {/* 排行榜弹窗 */}
      <Dialog open={showRankings} onOpenChange={setShowRankings}>
        <DialogContent className="bg-gray-900 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">今日排行榜</DialogTitle>
          </DialogHeader>
          <Rankings />
        </DialogContent>
      </Dialog>
    </div>
  )
}
