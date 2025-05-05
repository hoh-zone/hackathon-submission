"use client";

// 定义可能的事件类型
export type EventType = 'FILE_UPLOADED' | 'REFRESH_FILE_LIST';

// 事件监听器类型
type EventListener = (data?: any) => void;

// 事件映射
const listeners: { [key in EventType]?: EventListener[] } = {};

/**
 * 注册事件监听器
 * @param event 事件类型
 * @param callback 回调函数
 * @returns 取消监听的函数
 */
export const on = (event: EventType, callback: EventListener): () => void => {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  
  listeners[event]!.push(callback);
  
  // 返回取消监听的函数
  return () => {
    if (listeners[event]) {
      listeners[event] = listeners[event]!.filter(listener => listener !== callback);
    }
  };
};

/**
 * 触发事件
 * @param event 事件类型
 * @param data 可选的事件数据
 */
export const emit = (event: EventType, data?: any): void => {
  if (listeners[event]) {
    listeners[event]!.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`事件处理错误 (${event}):`, error);
      }
    });
  }
};

// 导出事件总线对象
export const eventBus = {
  on,
  emit
}; 