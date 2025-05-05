/**
 * 格式化SUI金额，将基本单位转换为SUI显示单位
 * @param amount 金额（基本单位）
 * @returns 格式化后的金额（SUI单位）
 */
export function formatSuiAmount(amount: string): string {
  return (Number(amount) / 1000000000).toFixed(9);
}

/**
 * 格式化日期（仅日期部分，无时间）
 * @param timestamp 时间戳或ISO日期字符串
 * @returns 格式化后的日期字符串 (年/月/日)
 */
export function formatDate(timestamp: number | string): string {
  try {
    // 处理传入的参数可能是时间戳数字或ISO日期字符串
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.error('无效的日期:', timestamp);
      return '无效日期';
    }

    // 只显示日期部分
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '无效日期';
  }
}

/**
 * 格式化日期（包含时间信息）
 * @param timestamp 时间戳或ISO日期字符串
 * @returns 格式化后的日期和时间字符串 (年/月/日 时:分:秒)
 */
export function formatDateWithTime(timestamp: number | string): string {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);

    if (isNaN(date.getTime())) {
      console.error('无效的日期:', timestamp);
      return '无效日期';
    }

    // 日期和时间格式
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '无效日期';
  }
}

/**
 * 格式化日期时间戳为可读字符串
 * @param timestamp Unix时间戳（秒）
 * @returns 格式化后的日期字符串
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 计算剩余时间，返回天数
 * @param timestamp Unix时间戳（秒）
 * @returns 剩余天数
 */
export const getRemainingDays = (timestamp: number): number => {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;
  return Math.max(0, Math.floor(diff / (60 * 60 * 24)));
};

/**
 * 截断钱包地址，显示前6位和后4位
 * @param address 完整地址
 * @returns 截断后的地址
 */
export function truncateAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * 格式化日期为简化的租期格式 (DD/MM/YYYY, HH:MM:SS)
 * @param timestamp 时间戳或ISO日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatLeasePeriod(timestamp: number | string): string {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);

    if (isNaN(date.getTime())) {
      console.error('无效的日期:', timestamp);
      return '无效日期';
    }

    // 日期和时间格式 DD/MM/YYYY, HH:MM:SS
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '无效日期';
  }
}