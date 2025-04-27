import React, { useEffect, useState } from 'react';
import {
  Avatar,
  ConfigProvider,
  Flex,
  Layout,
  Menu,
  MenuProps,
  Modal,
} from 'antd';
import bg_home from '@/assets/bg_home.png';
import icon_book from '@/assets/icon_book.svg';
import icon_discord from '@/assets/icon_discord.svg';
import icon_twitter from '@/assets/icon_twitter.svg';
import icon_logo from '@/assets/icon_logo.png';
import icon_wallet from '@/assets/icon_wallet.png';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { menuToken } from '@/utils/menuUpdateToken';
import { Outlet, useLocation, useNavigate } from 'react-router';
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from '@mysten/dapp-kit';
import { useFetchQueryCoinsShow } from '@/hooks/useCoinsShow';
import Decimal from 'decimal.js';

const cx = classNames.bind(styles);
const { Header, Content, Footer } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  {
    label: (
      <Flex
        gap={14}
        style={{
          fontFamily: 'Bold, serif',
          letterSpacing: '2px',
        }}
      >
        Swap Ag
      </Flex>
    ),
    key: 'Swap',
  },
  {
    label: (
      <Flex
        gap={14}
        style={{
          fontFamily: 'Bold, serif',
          letterSpacing: '2px',
        }}
      >
        Lending Ag
      </Flex>
    ),
    key: 'Lending',
  },
  {
    label: (
      <Flex
        gap={14}
        style={{
          fontFamily: 'Bold, serif',
          letterSpacing: '2px',
        }}
      >
        Nft
      </Flex>
    ),
    key: 'Nft',
  },
  {
    label: (
      <Flex
        gap={14}
        style={{
          fontFamily: 'Bold, serif',
          letterSpacing: '2px',
        }}
      >
        0-obj
      </Flex>
    ),
    key: 'Obj',
  },
  // {
  //   key: 'O',
  //   label: (
  //     <a
  //       style={{
  //         fontSize: '16px',
  //         fontFamily: 'Regular',
  //         fontWeight: 'bold',
  //         letterSpacing: '2px',
  //       }}
  //       href="https://ant.design"
  //       target="_blank"
  //       rel="noopener noreferrer"
  //     >
  //       0-obj
  //     </a>
  //   ),
  // },
  {
    label: (
      <Flex
        gap={14}
        style={{
          fontFamily: 'Bold, serif',
          letterSpacing: '2px',
        }}
      >
        cSui
      </Flex>
    ),
    key: 'cSui',
  },
];

const AppLayout: React.FC = () => {
  const location = useLocation();
  const currentAccount = useCurrentAccount();
  useFetchQueryCoinsShow();
  const [current, setCurrent] = useState('Lending');
  const { mutate: disconnect } = useDisconnectWallet();
  if ('/lending' === location.pathname) {
    if (current !== 'Lending') {
      setCurrent('Lending');
    }
  } else if ('/swap' === location.pathname) {
    if (current !== 'Swap') {
      setCurrent('Swap');
    }
  } else if ('/nft' === location.pathname) {
    if (current !== 'Nft') {
      setCurrent('Nft');
    }
  } else if ('/obj' === location.pathname) {
    if (current !== 'Obj') {
      setCurrent('Obj');
    }
  } else if ('/cSui' === location.pathname) {
    if (current !== 'cSui') {
      setCurrent('cSui');
    }
  }
  const onClick: MenuProps['onClick'] = (e) => {
    if ('Lending' === e.key) {
      toRedux();
    } else if ('test' === e.key) {
      router('/home');
    } else if ('Swap' === e.key) {
      router('/swap');
    } else if ('Nft' === e.key) {
      router('/nft');
    } else if ('Obj' === e.key) {
      router('/obj');
    } else if ('cSui' === e.key) {
      router('/cSui');
    }
    setCurrent(e.key);
  };
  Decimal.set({
    precision: 20,
    rounding: Decimal.ROUND_HALF_UP,
  });
  const [showModal, setShowModal] = useState(false);
  const onWalletClick = () => {
    if (currentAccount) {
      setIsModalOpen(!isModalOpen);
    }
  };
  const onDisConnectClick = () => {
    if (currentAccount) {
      disconnect();
    }
    setIsModalOpen(!isModalOpen);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStyle, setModalStyle] = useState({ top: 46, left: 0 });
  // *******
  useEffect(() => {
    const updateModalPosition = () => {
      const halfScreenWidth = window.innerWidth / 2;
      setModalStyle((prevState) => ({
        ...prevState,
        left: halfScreenWidth - 165, // 150 * modal ******
      }));
    };

    // *********
    updateModalPosition();

    // ********，******
    window.addEventListener('resize', updateModalPosition);
    // *******
    return () => window.removeEventListener('resize', updateModalPosition);
  }, []);
  const router = useNavigate();

  // const toRedux = () => router('/first');
  const toRedux = () => router('/lending');
  const handleClick = (value: string) => {
    if (value === 'book') {
      window.open('https://cro.ag/book/', '_blank');
    } else if (value === 'x') {
      window.open('https://x.com/cro_aggregator', '_blank');
    } else if (value === 'discord') {
      window.open('https://discord.gg/UG6c7nXr5X', '_blank');
    }

    // *******
    // window.location.href = 'https://example.com';
  };
  return (
    <Layout
      style={{
        height: '100%',
        width: '100%',
        backgroundColor: '#353559',
        backgroundImage: `url(${bg_home})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <ConfigProvider
        theme={{
          components: {
            Menu: menuToken,
            Modal: {
              contentBg: 'rgba(55, 85, 218, 0.3)',
              padding: 16,
            },
          },
        }}
      >
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            width: '100%',
            height: '44px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(55, 85, 218, 0.15)',
            borderTop: 'solid 2px rgba(55, 85, 218, 0.3)',
            borderBottom: 'solid 2px rgba(55, 85, 218, 0.3)',
            padding: '0px',
          }}
        >
          <div className={cx('header-left')}>
            <div
              style={{
                height: '40px',
                width: '40px',
                backgroundImage: `url(${icon_logo})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            ></div>
            <div className={cx('aggregator')}>Cro Ag</div>
          </div>
          <div className={cx('header-middle')}>
            <Menu
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#fefefe',
                fontFamily: 'Bold, serif',
                lineHeight: '44px',
              }}
              onClick={onClick}
              selectedKeys={[current]}
              mode="horizontal"
              items={items}
            />
          </div>
          <div className={cx('header-right')}>
            <div className={cx('header-right-top')} onClick={onWalletClick}>
              <div
                style={{
                  height: '24px',
                  width: '28px',
                  backgroundImage: `url(${icon_wallet})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  flexShrink: 0,
                }}
              ></div>
              {!currentAccount ? (
                <ConnectModal
                  trigger={<div className={cx('address')}>Connect</div>}
                  open={showModal}
                  onOpenChange={(isOpen) => setShowModal(isOpen)}
                />
              ) : (
                <div className={cx('address')}>
                  {currentAccount?.address?.substr(0, 6) +
                    '.....' +
                    currentAccount?.address?.substr(-4)}
                </div>
              )}
            </div>
            <Modal
              open={isModalOpen}
              footer={null}
              getContainer={false}
              width={300}
              onCancel={() => setIsModalOpen(false)}
              destroyOnClose
              style={modalStyle}
            >
              <Avatar
                size={64}
                src={
                  <img
                    src="https://api.dicebear.com/7.x/miniavs/svg?seed=1"
                    alt="avatar"
                  />
                }
              />
              <div
                style={{
                  fontSize: '16px',
                  color: '#f1f1f1',
                  padding: '15px',
                  marginTop: '15px',
                  borderRadius: '12px',
                  width: '100%',
                  height: '300px',
                  backgroundColor: 'rgba(55, 85, 218, 0.15)',
                  border: 'solid 2px rgba(55, 85, 218, 0.5)',
                }}
              >
                {currentAccount?.address}
                <div></div>
              </div>
              <div
                onClick={onDisConnectClick}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: '10px',
                  borderRadius: '12px',
                  width: '100%',
                  height: '60px',
                  backgroundColor: 'rgba(55, 85, 218, 0.15)',
                  border: 'solid 2px rgba(55, 85, 218, 0.5)',
                  fontSize: '18px',
                  color: '#f1f1f1',
                  userSelect: 'none',
                }}
              >
                Disconnect
              </div>
            </Modal>
          </div>
        </Header>
      </ConfigProvider>
      <Content
        style={{
          padding: 0,
          height: '100%',
          backgroundColor: '#00000000',
        }}
      >
        <Outlet />
      </Content>
      <Footer
        style={{
          position: 'sticky',
          width: '100%',
          height: '60px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(55, 85, 218, 0.15)',
          borderTop: 'solid 2px rgba(55, 85, 218, 0.3)',
          borderBottom: 'solid 2px rgba(55, 85, 218, 0.3)',
          padding: '0px',
        }}
      >
        <div style={{ flex: '4' }}></div>
        <img
          onClick={() => {
            handleClick('book');
          }}
          src={icon_book}
          alt="icon_book"
          style={{ width: '50px', height: '50px' }}
        />
        <img
          onClick={() => {
            handleClick('discord');
          }}
          src={icon_discord}
          alt="icon_discord"
          style={{ width: '38px', height: '38px', margin: '0 10px' }}
        />
        <img
          onClick={() => {
            handleClick('x');
          }}
          src={icon_twitter}
          alt="icon_twitter"
          style={{ width: '33px', height: '33px' }}
        />
        <div style={{ flex: '13' }}></div>
      </Footer>
    </Layout>
  );
};

export default AppLayout;
