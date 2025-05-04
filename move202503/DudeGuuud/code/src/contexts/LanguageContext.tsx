import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getBrowserLanguage, replaceParams } from '../utils/langUtils';
import zhCN from '../locales/zh-CN';
import enUS from '../locales/en-US';

// 语言类型定义
export type LangType = 'zh-CN' | 'en-US';

// 语言数据映射表
const TRANSLATIONS = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

// 语言上下文接口
interface LangContextType {
  currentLang: LangType;
  setLanguage: (lang: LangType) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

// 创建语言上下文
const LangContext = createContext<LangContextType>({
  currentLang: 'en-US',
  setLanguage: () => {},
  t: (key) => key,
});

// 语言提供者Props
interface LangProviderProps {
  children: ReactNode;
}

// 语言提供者组件
export const LangProvider: React.FC<LangProviderProps> = ({ children }) => {
  // 初始化语言状态，默认使用浏览器语言
  const [currentLang, setCurrentLang] = useState<LangType>(getBrowserLanguage() as LangType);

  // 切换语言方法
  const setLanguage = (lang: LangType) => {
    setCurrentLang(lang);
    localStorage.setItem('preferred_language', lang);
    document.documentElement.lang = lang;
  };

  // 翻译方法
  const t = (key: string, params?: Record<string, any>): string => {
    const translations = TRANSLATIONS[currentLang] || TRANSLATIONS['en-US'];
    
    // 使用点符号查找嵌套翻译
    const keys = key.split('.');
    let value = keys.reduce((obj, k) => (obj && obj[k] !== undefined) ? obj[k] : undefined, translations as any);
    
    // 如果找不到翻译，返回原始key
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    // 替换参数
    if (params) {
      return replaceParams(value, params);
    }
    
    return value;
  };

  // 初始化时设置document语言
  useEffect(() => {
    document.documentElement.lang = currentLang;
  }, []);

  return (
    <LangContext.Provider value={{ currentLang, setLanguage, t }}>
      {children}
    </LangContext.Provider>
  );
};

// 使用语言上下文的钩子
export const useLang = () => useContext(LangContext); 