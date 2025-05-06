"use client"
import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import type { Card, CardType } from "@/types/game-types"
import { memo } from "react"

const TargetStack = memo(function TargetStack({
  cards,
  selectedType,
  isLocked,
}: {
  cards: Card[]
  selectedType: CardType | null
  isLocked: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "target-stack",
    disabled: isLocked,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-32 items-center justify-center rounded-lg border-2 border-dashed transition-colors relative",
        isOver
          ? "bg-green-900/30 border-green-500"
          : selectedType
            ? "border-green-500/50 bg-green-900/10"
            : "border-yellow-500/50 bg-yellow-900/10",
        isLocked && "border-gray-500/50 bg-gray-900/10",
      )}
      style={{ touchAction: "none" }}
    >
      {cards.length === 0 ? (
        <div className="text-center text-gray-400">{isLocked ? "已锁定" : "拖拽卡牌到这里"}</div>
      ) : (
        <div className="relative flex h-full w-full items-center">
          {/* Card count badge - positioned at top-right corner with high z-index */}
          <div className="absolute top-2 right-2 z-50">
            <span className="rounded-full bg-black/80 px-3 py-1 text-sm font-medium text-white shadow-md border border-green-500/30">
              {cards.length} 张
            </span>
          </div>

          {cards.map((card, index) => (
            <div
              key={card.id}
              className="absolute"
              style={{
                left: `${index * 20}px`,
                zIndex: index,
              }}
            >
              <img
                src={card.image || "/placeholder.svg"}
                alt={card.type}
                className="h-16 w-16 rounded-full border-2 border-white/20 bg-black/40 p-1 shadow-lg"
                draggable="false"
              />
            </div>
          ))}
           <div className="ml-4 pl-[calc(20px*var(--count))]" style={{ "--count": cards.length } as any}>
          <span className="rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white"></span>
        </div>    
        </div>
      )}
    </div>
  )
})

export default TargetStack
