import React, { useCallback, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { ConfigProvider, Flex, notification, Spin } from 'antd';
import {
  ApyList,
  DepositSwapView,
  LendingRouters,
  SettingSlippageBtn,
} from '@/components';
import { useAppSelector } from '@/store/hooks';
import { currentCoinType } from '@/store/feature/currentCoinTypeSlice';
import { LoadingOutlined } from '@ant-design/icons';
import { ApyData } from 'cro-sdk';
import { useCoinByType, useTabletOrMobile } from '@/hooks';
import {
  ConnectModal,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import {
  setQueryData_balanceByType,
  invalidateBalanceByType,
} from '@/hooks/useBalanceByType';
import { ApyTypeLocal } from '@/config/dict.enum';

import { useQueryClient } from '@tanstack/react-query';
import { CURRENT_COIN_BTN_TYPES } from '@/constants';
import { Transaction } from '@mysten/sui/transactions';
import { invalidatePortfolios } from '@/hooks/usePortfolios';
import { invalidateZeroObj } from '@/hooks/useZeroObj';
const cx = classNames.bind(styles);
const DepositView: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const currentCoin = useAppSelector(currentCoinType);

  const isTabletOrMobile = useTabletOrMobile();
  const [selectRightKey, setSelectRightKey] = useState(
    ApyTypeLocal.STABLECOINS
  );
  const handleClickRightKey = (value: ApyTypeLocal) => {
    //********
    setSelectRightKey(value);
  };
  const [lendingState, setLendingState] = useState('loading');
  const [showModal, setShowModal] = useState(false); //Deposit ******
  const [reallyValue, setReallyValue] = useState(0);
  const [reallyValueBigint, setReallyValueBigint] = useState(0n);
  const resultBalanceRef = useRef(0n);

  const onDSViewChange = useCallback(
    (reallyVB: bigint, value: number, resultBalance: bigint) => {
      setReallyValue(value);
      setReallyValueBigint(reallyVB);
      resultBalanceRef.current = resultBalance;
    },
    [resultBalanceRef]
  );

  const [apyDataItem, setApyDataItem] = useState<ApyData | null>(null);
  const targetCion = useCoinByType(apyDataItem?.coin_type);
  const apyItemClick = (item: ApyData) => {
    setApyDataItem(item);
  };
  const onRealTimeChange = useCallback(() => {
    setLendingState('loading');
  }, []);
  const txRef = useRef<Transaction>();
  const depositFn = () => {
    if (
      !apyDataItem ||
      !currentAccount ||
      !currentCoin.coinLendingIn.type ||
      reallyValue <= 0 ||
      !txRef.current ||
      signTx.isPending ||
      lendingState !== 'success'
    ) {
      return;
    }
    deposit(txRef.current);
  };
  const client = useSuiClient();
  const signTx = useSignAndExecuteTransaction({
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
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (title: string, info: string) => {
    api.open({
      message: title,
      description: info,
      duration: 4.5,
    });
  };
  const deposit = (tx: Transaction | null | undefined) => {
    if (!tx) {
      return;
    }
    signTx.mutate(
      {
        transaction: tx,
      },
      {
        onSuccess: () => {
          if (currentAccount?.address) {
            setQueryData_balanceByType(
              queryClient,
              currentCoin.coinLendingIn.type,
              resultBalanceRef.current,
              currentAccount?.address
            );
          }
          invalidateBalanceByType(queryClient);
          invalidateZeroObj(queryClient);
          invalidatePortfolios(queryClient);
        },
        onError: (error) => {
          invalidateBalanceByType(queryClient);
          invalidateZeroObj(queryClient);
          invalidatePortfolios(queryClient);
          openNotification(error.name, error.message);
        },
      }
    );
  };
  const queryClient = useQueryClient();

  return (
    <>
      {contextHolder}
      <Flex vertical={isTabletOrMobile} justify="flex-start">
        <Flex vertical justify="space-between" style={{ marginTop: '12px' }}>
          <DepositSwapView
            viewType={CURRENT_COIN_BTN_TYPES[0]}
            onDSViewChange={onDSViewChange}
            initValue={0}
            onRealTimeChange={onRealTimeChange}
          ></DepositSwapView>
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
                  backgroundColor:
                    !apyDataItem ||
                    !currentAccount ||
                    !currentCoin.coinLendingIn.type ||
                    reallyValue <= 0 ||
                    lendingState !== 'success'
                      ? '#9a94cf'
                      : '#6072fd',
                }}
                onClick={depositFn}
              >
                {signTx.isPending ? (
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
                  'Deposit'
                )}
              </div>
            )}
            <SettingSlippageBtn btnType={CURRENT_COIN_BTN_TYPES[0]} />
          </Flex>
        </Flex>
        <div style={{ width: '40px' }}></div>
        <div
          className={cx('right', 'glass-container')}
          style={{
            marginTop: '12px',
            paddingBottom: '45px',
          }}
        >
          <div
            className={cx('right-top')}
            style={{
              visibility: 'visible',
            }}
          >
            <div
              onClick={() => handleClickRightKey(ApyTypeLocal.STABLECOINS)}
              style={{
                color: `${
                  selectRightKey === ApyTypeLocal.STABLECOINS
                    ? '#fefefe'
                    : '#8694ff'
                }`,
                borderBottom: `${
                  selectRightKey === ApyTypeLocal.STABLECOINS
                    ? '3px solid #5356b1'
                    : 'none'
                }`,
                borderRadius: '2px',
              }}
            >
              {ApyTypeLocal.STABLECOINS}
            </div>
            <div
              onClick={() => handleClickRightKey(ApyTypeLocal.LST)}
              style={{
                color: `${
                  selectRightKey === ApyTypeLocal.LST ? '#fefefe' : '#8694ff'
                }`,
                borderBottom: `${
                  selectRightKey === ApyTypeLocal.LST
                    ? '3px solid #5356b1'
                    : 'none'
                }`,
                borderRadius: '2px',
              }}
            >
              {ApyTypeLocal.LST}
            </div>
            <div
              onClick={() => handleClickRightKey(ApyTypeLocal.DEFI)}
              style={{
                color: `${
                  selectRightKey === ApyTypeLocal.DEFI ? '#fefefe' : '#8694ff'
                }`,
                borderBottom: `${
                  selectRightKey === ApyTypeLocal.DEFI
                    ? '3px solid #5356b1'
                    : 'none'
                }`,
                borderRadius: '2px',
              }}
            >
              {ApyTypeLocal.DEFI}
            </div>
            <div
              onClick={() => handleClickRightKey(ApyTypeLocal.MEME)}
              style={{
                color: `${
                  selectRightKey === ApyTypeLocal.MEME ? '#fefefe' : '#8694ff'
                }`,
                borderBottom: `${
                  selectRightKey === ApyTypeLocal.MEME
                    ? '3px solid #5356b1'
                    : 'none'
                }`,
                borderRadius: '2px',
              }}
            >
              {ApyTypeLocal.MEME}
            </div>
          </div>
          <ApyList
            apyType={selectRightKey}
            apyDataItem={apyDataItem}
            onItemClick={(item) => apyItemClick(item)}
          />
        </div>
      </Flex>
      {!!targetCion && !!apyDataItem && (
        <LendingRouters
          apyDataItem={apyDataItem}
          from={currentCoin.coinLendingIn}
          target={targetCion}
          amount={String(reallyValue)}
          decimals={currentCoin.coinLendingIn?.decimals}
          refetchInterval={!signTx.isPending}
          reallyValueBigint={reallyValueBigint}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onState={(value) => {
            setLendingState(value);
          }}
          targetIncomeAfterExchange={(value: string, tx?: Transaction) => {
            txRef.current = tx;
          }}
        />
      )}
    </>
  );
};

export default DepositView;
