/**
 * 语言工具函数
 */

/**
 * 替换翻译文本中的参数
 * 例如: "当前页面: {current}/{total}" 会被替换为 "当前页面: 1/5"
 * 
 * @param text 原始文本，包含 {paramName} 形式的参数
 * @param params 参数对象，键为参数名，值为替换值
 * @returns 替换后的文本
 */
export const replaceParams = (text: string, params: Record<string, any>): string => {
  if (!text) return '';
  if (!params || Object.keys(params).length === 0) return text;
  
  return Object.entries(params).reduce((result, [key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    return result.replace(regex, String(value));
  }, text);
};

/**
 * 根据浏览器语言设置或localStorage获取当前语言
 */
export const getBrowserLanguage = (): string => {
  // 优先从localStorage获取
  const savedLang = localStorage.getItem('preferred_language');
  if (savedLang) return savedLang;
  
  // 从浏览器语言设置获取
  const browserLang = navigator.language.toLowerCase();
  
  // 如果以zh开头，返回zh-CN
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  
  // 默认返回英文
  return 'en-US';
}; 

// 地址缩略显示 0x1234...abcd
export function shortenAddress(addr: string, head = 4, tail = 4) {
  if (!addr) return '';
  if (addr.length <= head + tail + 2) return addr;
  return addr.slice(0, head + 2) + '...' + addr.slice(-tail);
} 