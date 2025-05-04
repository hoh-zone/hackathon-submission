import React from 'react';
import { useLang, LangType } from '../../contexts/lang/LangContext';
import { SupportedLanguages } from '../../translations';

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useLang();

  const handleLangChange = (newLang: LangType) => {
    setLang(newLang);
  };

  return (
    <div className="relative group">
      <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
        <span className="mr-1">{lang === 'zh' ? '🇨🇳' : '🇺🇸'}</span>
        <span className="text-sm text-gray-600 dark:text-gray-300">{SupportedLanguages[lang]}</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
        {Object.entries(SupportedLanguages).map(([code, name]) => (
          <button
            key={code}
            className={`block w-full text-left px-4 py-2 text-sm ${
              code === lang
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-100'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleLangChange(code as LangType)}
          >
            <span className="mr-2">{code === 'zh' ? '🇨🇳' : '🇺🇸'}</span>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher; 