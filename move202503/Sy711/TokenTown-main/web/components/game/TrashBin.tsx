"use client";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react"


export default function TrashBin({ error, success }: { error: string | null; success: boolean }) { // <-- 注意：组件名建议改为 TrashBin
  const { setNodeRef } = useDroppable({
    // 修正：将 id 从 "target-stack" 改为 "trash-bin"
    id: "trash-bin",
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all",
        error ? "border-red-500 bg-red-900/20" : "border-gray-500/50 bg-gray-800/30",
        success && "border-green-500 bg-green-900/20",
      )}
    >
      <Trash2
        size={32}
        className={cn("mb-2 transition-colors", error ? "text-red-400" : "text-gray-400", success && "text-green-400")}
      />

      {error ? (
        <p className="text-center text-xs text-red-400 px-4">{error}</p>
      ) : success ? (
        <p className="text-center text-xs text-green-400">丢弃成功!</p>
      ) : (
        <p className="text-center text-xs text-gray-400">拖拽单个卡槽中至少10张相同类型卡牌到此处丢弃</p>
      )}
    </div>
  )
}