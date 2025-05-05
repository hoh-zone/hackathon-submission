import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化地址显示
export function formatAddress(address: string, startLength = 5, endLength = 4): string {
  if (!address) return "";
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

// 格式化日期时间
export function formatDateTime(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// 计算剩余时间
export function getRemainingTime(endDate: number): string {
  const now = new Date();
  const nowTime = now.getTime();

  if (nowTime >= endDate) return "已结束";

  const diffMs = endDate - nowTime;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return `剩余 ${diffDays} 天 ${diffHours} 小时`;
}
