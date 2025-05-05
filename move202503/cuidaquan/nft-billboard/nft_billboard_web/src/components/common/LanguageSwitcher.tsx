import React from 'react';
import { Button, Dropdown, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.scss';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  const currentLanguage = i18n.language;
  
  const items = [
    {
      key: 'en',
      label: (
        <div className="language-item" onClick={() => changeLanguage('en')}>
          <span className="language-flag">🇺🇸</span>
          <span className="language-name">English</span>
        </div>
      ),
    },
    {
      key: 'zh',
      label: (
        <div className="language-item" onClick={() => changeLanguage('zh')}>
          <span className="language-flag">🇨🇳</span>
          <span className="language-name">中文</span>
        </div>
      ),
    },
  ];
  
  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Button type="text" className="language-switcher-btn">
        <Space>
          <GlobalOutlined />
          {currentLanguage === 'zh' ? '中文' : 'English'}
        </Space>
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitcher;
