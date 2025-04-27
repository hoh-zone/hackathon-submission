"use client"
import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import type { Card } from "@/types/game-types"
import { memo } from "react"

const DraggableCard = memo(function DraggableCard({
  card,
  index,
  total,
  isDisabled,
  sameTypeCount,
}: {
  card: Card
  index: number
  total: number
  isDisabled: boolean
  sameTypeCount: number
}) {
  // 检查是否是最顶层的卡牌
  const isTopCard = index === total - 1

  // 只有最顶层的卡牌可以拖拽
  const isDraggableDisabled = isDisabled || !isTopCard

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    disabled: isDraggableDisabled,
    data: {
      card,
      index,
      total,
    },
  })

  // 计算卡牌在卡槽中的位置
  const offset = index * 5 // 每张卡片偏移5px

  // 检查是否有多张相同类型的卡牌
  const hasMultipleSameType = sameTypeCount > 1

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "absolute left-0 top-0 will-change-transform",
        isDragging ? "z-50 cursor-grabbing opacity-30" : isTopCard ? "cursor-grab" : "cursor-default",
        isDraggableDisabled && "pointer-events-none opacity-50",
      )}
      style={{
        transform: `translateY(${offset}px)`,
        zIndex: index,
        touchAction: "none",
        // 扩大点击区域
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <img
        src={card.image || "/placeholder.svg"}
        alt={card.type}
        className={cn(
          "h-16 w-16 rounded-full border-2 bg-black/40 p-1 shadow-lg",
          isDragging ? "border-green-400 scale-110" : "border-white/20",
          isDraggableDisabled ? "border-gray-500/50" : "",
        )}
        draggable="false"
        style={{
          pointerEvents: "none", // 确保图片不会干扰拖拽事件
        }}
      />
      {isTopCard && hasMultipleSameType && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white pointer-events-none">
          {sameTypeCount}
        </div>
      )}
    </div>
  )
})

export default DraggableCard
