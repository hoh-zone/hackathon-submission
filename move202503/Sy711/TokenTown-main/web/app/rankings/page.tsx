"use client"

import { Suspense } from "react"
import RankingsPageComponent from "@/components/rankings-page"


export default function RankingsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">加载中...</div>}>
    <RankingsPageComponent/>
    </Suspense>
  )
}
