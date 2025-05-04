import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useLang } from '../../contexts/lang/LangContext';
import { isMobileDevice } from '../../utils/deviceUtils';
import { Globe, Sun, Moon, Menu, X, Check } from 'lucide-react';
import { ConnectButton } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';

// 导航链接配置
const LINKS = [
  { to: '/', label: 'home' },
  { to: '/create', label: 'create' },
  { to: '/story/latest', label: 'browse' },
  { to: '/profile', label: 'profile' },
];

// 语言选项
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
];

// NavLink 组件
const NavLink = ({ children, to, className, onClick }: { 
  children: React.ReactNode; 
  to: string; 
  className: (props: { isActive: boolean }) => string;
  onClick?: () => void;
}) => {
  return (
    <RouterNavLink to={to} className={className} onClick={onClick}>
      {children}
    </RouterNavLink>
  );
};

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // 检测设备类型
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(isMobileDevice());
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // 处理语言切换
  const handleLangChange = (langCode: 'en' | 'zh') => {
    console.log(`Changing language from ${lang} to ${langCode}`);
    setLang(langCode);
    setLangMenuOpen(false);
  };

  // 使用ref和useEffect处理点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    
    if (langMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [langMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 backdrop-blur-md bg-white/70 dark:bg-gray-900/70">
      <div className="container flex h-14 items-center">
        <Link to="/" title="Home">
          <img src="/logo_white.png" alt="Logo" className="h-10 w-10 ml-10" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex flex-1 items-center justify-center">
          <ul className="flex space-x-4">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink 
                  to={link.to} 
                  className={({ isActive }) => isActive 
                    ? `text-sm font-medium ${theme === 'dark' ? 'text-primary-300' : 'text-primary-600'} nav-link`
                    : `text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-primary-300' : 'text-gray-600 hover:text-primary-600'} nav-link`
                  }
                >
                  {t(`nav_${link.label}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {/* Right Side Actions - 钱包连接按钮和钱包信息 */}
        <div className="flex-1 flex justify-end items-center space-x-3">
          <div className="flex items-center space-x-2">
            <ConnectButton />
          </div>
          {/* 语言切换 */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLangMenuOpen(!langMenuOpen);
              }}
              className="flex items-center justify-center rounded-md p-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-haspopup="true"
              aria-expanded={langMenuOpen}
            >
              <Globe className="w-4 h-4 mr-1" />
              <span>{lang === 'en' ? 'EN' : '中文'}</span>
            </button>
            {langMenuOpen && (
              <div 
                className="absolute top-full right-0 w-24 py-1 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 menu-transition open animate-slideDown"
                role="menu"
              >
                {LANGUAGES.map((language) => (
                  <button
                    key={language.code}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLangChange(language.code as 'en' | 'zh');
                    }}
                    className={`w-full text-left px-3 py-1 text-xs flex items-center justify-between ${
                      lang === language.code
                        ? 'bg-gray-100 dark:bg-gray-700 font-medium text-primary-600 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    role="menuitem"
                  >
                    <span>{language.name}</span>
                    {lang === language.code && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 主题切换 */}
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;