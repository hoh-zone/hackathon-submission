"use client"
import { useDroppable } from "@dnd-kit/core"
import DraggableCard from "./DraggableCard"
import type { CardSlots, CardType } from "@/types/game-types"
import { cn } from "@/lib/utils"
import { memo } from "react"

const CardSlot = memo(function CardSlot({
  slot,
  isDisabled,
  selectedType,
}: {
  slot: CardSlots
  isDisabled: boolean
  selectedType: CardType | null
}) {
  // 使卡槽可以接收拖拽
  const { setNodeRef, isOver } = useDroppable({
    id: slot.id,
    disabled: isDisabled,
  })

  // 获取卡槽中顶部卡牌的类型（如果有卡牌）
  const topCardType = slot.cards.length > 0 ? slot.cards[slot.cards.length - 1].type : null

  // 检查是否可以接收当前选中类型的卡牌
  const canAcceptSelectedType = selectedType === null || topCardType === null || topCardType === selectedType

  // 计算从顶部开始连续的相同类型卡牌数量
  const getConsecutiveSameTypeCount = (cardIndex: number) => {
    if (slot.cards.length === 0 || cardIndex < 0 || cardIndex >= slot.cards.length) {
      return 0
    }

    const cardType = slot.cards[cardIndex].type
    let count = 1 // 包含当前卡牌

    // 从当前索引向下计算连续相同类型的卡牌
    for (let i = cardIndex - 1; i >= 0; i--) {
      if (slot.cards[i].type === cardType) {
        count++
      } else {
        break
      }
    }

    return count
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <div
        ref={setNodeRef}
        className={cn(
          "h-28 w-full rounded-lg p-1 transition-colors relative",
          isOver && canAcceptSelectedType ? "bg-green-900/30 border-2 border-green-500/50" : "bg-yellow-900/20",
          isDisabled && "opacity-70",
        )}
        style={{ touchAction: "none" }}
      >
        <div className="relative h-full w-full">
          {slot.cards.map((card, index) => {
            // 检查是否是最顶层的卡牌
            const isTopCard = index === slot.cards.length - 1

            // 只为顶部卡牌计算连续相同类型的数量
            const sameTypeCount = isTopCard ? getConsecutiveSameTypeCount(index) : 0

            return (
              <DraggableCard
                key={card.id}
                card={card}
                index={index}
                total={slot.cards.length}
                isDisabled={isDisabled}
                sameTypeCount={sameTypeCount}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default CardSlot
