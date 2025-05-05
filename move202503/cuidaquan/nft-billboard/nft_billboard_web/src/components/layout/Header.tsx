import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { HomeOutlined, AppstoreOutlined, PictureOutlined, SettingOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useTranslation } from 'react-i18next';
import { UserRole } from '../../types';
import { checkUserRole } from '../../utils/auth';
import ConnectWallet from '../common/ConnectWallet';
import LanguageSwitcher from '../common/LanguageSwitcher';
import './Header.scss';
import logo from '../../assets/logo.svg';

const { Header } = Layout;
const { Title } = Typography;

const AppHeader: React.FC = () => {
  const location = useLocation();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);

  // 当账户变化时检查用户角色
  useEffect(() => {
    if (currentAccount) {
      checkUserRole(currentAccount.address, suiClient)
        .then(role => {
          setUserRole(role);
        })
        .catch(error => {
          console.error('检查用户角色失败:', error);
          setUserRole(UserRole.USER);
        });
    } else {
      setUserRole(UserRole.USER);
    }
  }, [currentAccount, suiClient, forceUpdateKey]);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">{t('header.home')}</Link>,
    },
    {
      key: '/ad-spaces',
      icon: <AppstoreOutlined />,
      label: <Link to="/ad-spaces">{t('header.adSpaces')}</Link>,
    },
    {
      key: '/my-nfts',
      icon: <PictureOutlined />,
      label: <Link to="/my-nfts">{t('header.myNFTs')}</Link>,
    },
  ];

  // 管理员角色显示管理菜单
  if (userRole === UserRole.ADMIN || userRole === UserRole.OWNER || userRole === UserRole.GAME_DEV) {
    menuItems.push({
      key: '/manage',
      icon: <SettingOutlined />,
      label: <Link to="/manage">{t('header.manage')}</Link>,
    });
  }

  return (
    <Header className="app-header">
      <div className="logo">
        <Title level={3}>
          <Link to="/">
            <img src={logo} alt="NFT Billboard" className="logo-image" />
            {t('app.shortName')}
          </Link>
        </Title>
      </div>

      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        className="header-menu"
      />

      <div className="header-right">
        <LanguageSwitcher />
        <ConnectWallet />
      </div>

      {/* 添加科技感装饰元素 */}
      <div className="header-decoration"></div>
    </Header>
  );
};

export default AppHeader;