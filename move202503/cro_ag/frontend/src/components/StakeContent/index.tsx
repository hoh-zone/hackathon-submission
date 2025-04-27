/* eslint-disable prettier/prettier */
import React, { useCallback, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import icon_arrow from '@/assets/icon_arrow.png';
import icon_arrow_down from '@/assets/icon_arrow_down.png';
import { ConfigProvider, Flex, notification, Spin } from 'antd';
import { DepositSwapView, SelectCoinBtn } from '@/components';
import { useAppSelector } from '@/store/hooks';
import { currentCoinType } from '@/store/feature/currentCoinTypeSlice';
import { LoadingOutlined } from '@ant-design/icons';
import { useSuiToCSuiPrice, useTabletOrMobile } from '@/hooks';
import {
  ConnectModal,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { invalidateBalanceByType } from '@/hooks/useBalanceByType';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'antd';
import { CURRENT_COIN_BTN_TYPES } from '@/constants';
import { invalidateZeroObj } from '@/hooks/useZeroObj';
const cx = classNames.bind(styles);
const StakeContent: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const currentCoin = useAppSelector(currentCoinType);
  const isTabletOrMobile = useTabletOrMobile();
  const [showModal, setShowModal] = useState(false);
  // const txRef = useRef<Transaction>();
  const [reallyValue, setReallyValue] = useState(0);
  const [reallyValueBigint, setReallyValueBigint] = useState(0n)
const onDSViewChange = useCallback((reallyVB: bigint, value: number) => {
  setReallyValue(value);
  setReallyValueBigint(reallyValueBigint);
  }, []);
  const cSuiBalance = useSuiToCSuiPrice(reallyValue, reallyValueBigint, currentAccount?.address)
  const checkSubmitAble = (): boolean => {
    return (
      !!currentCoin?.coinStakeIn?.type &&
      !!currentCoin?.coinStakeOut?.type &&
      reallyValue > 0 &&
      !!currentAccount &&
      cSuiBalance.isSuccess &&
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      !!cSuiBalance.data!.tx
    );
  };
  const client = useSuiClient();
  const stakeTx = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          // Raw effects are required so the effects can be reported back to the wallet
          showRawEffects: true,
          // Select additional data to return
          showObjectChanges: true,
        },
      }),
  });

  const stakeFn = () => {
    if (!checkSubmitAble()) {
      return;
    }
    if(stakeTx.isPending){
      return;
    }
    stakeTx.mutate(
          {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            transaction: cSuiBalance.data!.tx!,
          },
          {
            onSuccess: () => {
              invalidateBalanceByType(queryClient);
              invalidateZeroObj(queryClient);
              
            },
            onError: (error) => {
              invalidateBalanceByType(queryClient);
              invalidateZeroObj(queryClient);
              openNotification(error.name, error.message);
            },
          }
        );
  };
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (title: string, info: string) => {
    api.open({
      message: title,
      description: info,
      duration: 4.5,
    });
  };
  const queryClient = useQueryClient();
  const onRealTimeChange = useCallback(() => {
    setReallyValue(0)
    }, []);
  return (
    <>
    {contextHolder}
      <Flex vertical={isTabletOrMobile} justify="flex-start">
        <Flex vertical justify="space-between" style={{ marginTop: '12px' }}>
          <Flex vertical={isTabletOrMobile} align="center">
            <DepositSwapView
              viewType={CURRENT_COIN_BTN_TYPES[3]}
              onDSViewChange={onDSViewChange}
              initValue={0}
              onRealTimeChange={onRealTimeChange}
            ></DepositSwapView>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '70px',
                height: '70px',
              }}
            >
              <Image
                src={isTabletOrMobile ? icon_arrow_down : icon_arrow}
                width={isTabletOrMobile ? 37 : 46}
                height={isTabletOrMobile ? 46 : 37}
                preview={false}
              />
            </div>
            <div
              className={cx('left1', 'glass-container')}
              style={{ width: isTabletOrMobile ? '580px' : '550px' }}
            >
              <Flex vertical={false} align="center">
                <SelectCoinBtn
                  btnType={CURRENT_COIN_BTN_TYPES[4]}
                ></SelectCoinBtn>
                <div
                  className={cx('selected-balance')}
                  style={{ flex: 1, textAlign: 'right', marginRight: '16px' }}
                ></div>
              </Flex>
              <div
                style={{
                  boxSizing: 'border-box',
                  padding: '0px 11px',
                  height: '72px',
                  marginTop: '27px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  fontSize: '54px',
                  fontFamily: 'Regular, serif',
                }}
              >
                {cSuiBalance.data?.value.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0*$/, '')}
              </div>
              <div
                className={cx('total-coin')}
                style={{ marginTop: '3px' }}
              ></div>
            </div>
          </Flex>
          <Flex vertical={false} align="center" style={{ marginTop: '22px' }}>
            {!currentAccount ? (
              <ConnectModal
                trigger={<div className={cx('left2')}>Connect</div>}
                open={showModal}
                onOpenChange={(isOpen) => setShowModal(isOpen)}
              />
            ) : (
              <div
                className={cx('left2')}
                style={{
                  backgroundColor: !checkSubmitAble() ? '#9a94cf' : '#6072fd',
                }}
                onClick={stakeFn}
              >
                {stakeTx.isPending ? (
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
                      style={{ marginTop: '0px' }}
                      indicator={<LoadingOutlined spin />}
                    />
                  </ConfigProvider>
                ) : (
                  'Stake'
                )}
              </div>
            )}
            <div style={{ flex: 1 }}></div>
            {!isTabletOrMobile && (
              <div
                style={{
                  fontSize: '18px',
                  fontStretch: 'normal',
                  letterSpacing: '1px',
                  fontFamily: 'Bold, serif',
                  color: '#fefefe',
                }}
              >
                Powered by Crater Lab
              </div>
            )}
          </Flex>
        </Flex>
      </Flex>
    </>
  );
};

export default StakeContent;
