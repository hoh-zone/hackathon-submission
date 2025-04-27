"use client"

import { motion } from "framer-motion"
import { useMemo } from "react"

export default function BackgroundIcons() {
  const icons = [
    { src: "/wusdc.svg", width: 60, height: 60, className: "animate-float-slow" },
    { src: "/wbtc.svg", width: 70, height: 70, className: "animate-float-medium" },
    { src: "/wal.png", width: 55, height: 55, className: "animate-float-fast" },
    { src: "/cetus.png", width: 50, height: 50, className: "animate-float-slow" },
    { src: "/usdt.svg", width: 65, height: 65, className: "animate-float-medium" },
    { src: "/sui.svg", width: 58, height: 58, className: "animate-float-fast" },
    { src: "/navx.svg", width: 62, height: 62, className: "animate-float-slow" },
    { src: "/deep.svg", width: 56, height: 56, className: "animate-float-medium" },
    { src: "/fdusd.svg", width: 60, height: 60, className: "animate-float-slow" }, // 新增图标
    { src: "/ns.svg", width: 60, height: 60, className: "animate-float-medium" }, // 新增图标
    { src: "/blue.png",width: 60, height: 60, className: "animate-float-medium" },

  ]

  // 使用 useMemo 缓存图标实例，避免每次重新渲染时重新生成
  const iconInstances = useMemo(() => {
    const instances = []
    for (let i = 0; i < 24; i++) {
      const icon = icons[i % icons.length]
      const left = `${Math.random() * 100}%`
      const top = `${Math.random() * 100}%`
      const delay = `${Math.random() * 5}s`
      const opacity = 0.1 + Math.random() * 0.15 // 低透明度

      instances.push(
        <motion.img
          key={`bg-icon-${i}`}
          src={icon.src}
          width={icon.width}
          height={icon.height}
          alt=""
          className={`absolute ${icon.className} pointer-events-none`}
          style={{
            left,
            top,
            opacity,
            animationDelay: delay,
            pointerEvents: "none", // 添加内联样式确保兼容性
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity, scale: 1 }}
          transition={{ duration: 1, delay: i * 0.1 }}
        />,
      )
    }
    return instances
  }, []) // 空依赖数组，确保只在组件首次渲染时生成

  return (
    <div className="pointer-events-none" style={{ zIndex: -1 }}>
      {iconInstances}
    </div>
  )
}
