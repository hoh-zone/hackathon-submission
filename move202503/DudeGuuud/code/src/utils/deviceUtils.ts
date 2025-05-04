/**
 * 设备工具函数
 */

/**
 * 检测当前设备是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  // 检测常见的移动设备关键词
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
  
  return mobileRegex.test(userAgent);
};

/**
 * 检测当前设备类型
 * @returns {string} 设备类型: 'mobile', 'tablet', 或 'desktop'
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof navigator === 'undefined') return 'desktop';
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  // 平板设备的正则表达式
  const tabletRegex = /(ipad|tablet|(android(?!.*mobile)))/i;
  
  // 移动设备的正则表达式 (排除平板)
  const mobileRegex = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i;
  
  if (tabletRegex.test(userAgent)) {
    return 'tablet';
  } else if (mobileRegex.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
};

/**
 * 根据设备类型返回不同的样式类名
 * @param {Object} classNames 不同设备对应的类名
 * @param {string} classNames.mobile 移动设备类名
 * @param {string} classNames.tablet 平板设备类名
 * @param {string} classNames.desktop 桌面设备类名
 * @returns {string} 对应当前设备的类名
 */
export const getResponsiveClassName = (classNames: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}): string => {
  const deviceType = getDeviceType();
  return classNames[deviceType] || '';
}; 