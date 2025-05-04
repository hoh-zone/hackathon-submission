import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { ConfigProvider, Drawer, Flex, Space, Spin } from 'antd';
import { AllBalanceItem } from '@/components';
import { ConnectModal, useCurrentAccount } from '@mysten/dapp-kit';
import { LeftCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import icon_wallet from '@/assets/icon_wallet.png';
import { useAllBalance, useCoinsPrice } from '@/hooks';
import { useInView } from 'react-intersection-observer';
import icon_pyth from '@/assets/icon_pyth.svg';
const cx = classNames.bind(styles);
const DrawerAllBalance: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const [open, setOpen] = useState(true);
  const [open1, setOpen1] = useState(false);
  const handleAfterOpenChange = (visible: boolean) => {
    if (!visible) {
      setOpen1(true);
    }
  };
  const handleAfterOpenChange1 = (visible: boolean) => {
    if (!visible) {
      setOpen(true);
    }
  };
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: false,
  });
  const allBalance = useAllBalance(currentAccount?.address, inView);
  const allPrice = useCoinsPrice(inView);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const onWalletClick = () => {
    if (currentAccount) {
      setIsModalOpen(!isModalOpen);
    }
  };
  return (
    <>
      <Drawer
        className={cx('wallet')}
        rootStyle={{
          boxShadow: 'none !important',
          height: '70px',
          zIndex: 100,
          borderRadius: '8px',
        }}
        closeIcon={false}
        mask={false}
        maskClosable={false}
        placement={'left'}
        width={26}
        open={open}
        footer={false}
        styles={{
          body: {
            overflow: 'hidden !important',
            padding: 0,
          },
        }}
        afterOpenChange={handleAfterOpenChange}
      >
        <div
          className={cx('drawer-content')}
          onClick={() => {
            setOpen(false);
          }}
        >
          <div
            style={{
              height: '15px',
              width: '17.5px',
              backgroundImage: `url(${icon_wallet})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              flexShrink: 0,
            }}
          ></div>
        </div>
      </Drawer>
      <Drawer
        afterOpenChange={handleAfterOpenChange1}
        className={cx('glass-container')}
        rootStyle={{
          marginTop: '50px',
          boxShadow: 'none !important',
          height: 'calc(100vh - 408px)',
          maxHeight: '600px',
          minHeight: '300px',
          zIndex: 101,
          borderRadius: '8px',
        }}
        styles={{
          body: {
            overflow: 'hidden !important',
            paddingLeft: 0,
            paddingRight: 0,
            paddingBottom: 16,
            paddingTop: 0,
          },
        }}
        style={{ background: '#0d0d23', color: '#ffffff' }}
        closeIcon={false}
        mask={false}
        maskClosable={false}
        title={
          <Flex vertical={false} align={'center'}>
            <div
              style={{
                marginRight: '10px',
                height: '18px',
                width: '21px',
                backgroundImage: `url(${icon_wallet})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                flexShrink: 0,
              }}
            ></div>
            Your Wallet
          </Flex>
        }
        placement={'left'}
        width={350}
        onClose={() => {
          setOpen1(false);
        }}
        open={open1}
        extra={
          <Space>
            <img
              style={{
                marginRight: '10px',
                width: '90px',
                height: '30.5px',
                borderRadius: 0,
              }}
              src={icon_pyth}
            />
            <LeftCircleOutlined
              style={{
                fontSize: '25px',
              }}
              onClick={() => {
                setOpen1(false);
              }}
              type="primary"
            />
          </Space>
        }
      >
        <div
          ref={ref}
          className={cx('hide-scrollbar')}
          style={{
            maxHeight: '100%',
            height: '100%',
            overflow: 'auto',
          }}
        >
          {!currentAccount ? (
            <Flex
              vertical={true}
              align={'center'}
              justify={'center'}
              style={{ width: '100%', height: '100%' }}
            >
              <div className={cx('drawer')} onClick={onWalletClick}>
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
                <ConnectModal
                  trigger={<div className={cx('drawer-address')}>Connect</div>}
                  open={showModal}
                  onOpenChange={(isOpen) => setShowModal(isOpen)}
                />
              </div>
            </Flex>
          ) : (
            <Flex vertical={true} style={{ width: '100%' }}>
              {allBalance.isLoading && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <ConfigProvider
                    theme={{
                      components: {
                        Spin: {
                          colorPrimary: '#fefefe',
                        },
                      },
                    }}
                  >
                    <Spin
                      style={{
                        marginTop: '35px',
                      }}
                      indicator={<LoadingOutlined spin />}
                    />
                  </ConfigProvider>
                </div>
              )}
              {allBalance.isError && (
                <div
                  style={{
                    color: '#fefefe',
                    fontSize: '18px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: '35px',
                    fontFamily: 'Bold, serif',
                  }}
                >
                  error
                </div>
              )}
              {allBalance.isSuccess &&
                (allBalance.data?.length || 0) > 0 &&
                allBalance.data?.map((item, index) => {
                  const priceInfo = allPrice.data?.[item.coinType];
                  return (
                    <AllBalanceItem
                      priceInfo={priceInfo}
                      item={item}
                      key={index}
                    />
                  );
                })}
            </Flex>
          )}
        </div>
      </Drawer>
    </>
  );
};

export default React.memo(DrawerAllBalance);
