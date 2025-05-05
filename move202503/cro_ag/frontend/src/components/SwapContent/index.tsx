import React, { useCallback, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import icon_arrow from '@/assets/icon_arrow.png';
import icon_arrow_down from '@/assets/icon_arrow_down.png';
import { ConfigProvider, Flex, notification, Spin } from 'antd';
import {
  DepositSwapView,
  SelectCoinBtn,
  SettingSlippageBtn,
  SwapRoutersView,
} from '@/components';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  currentCoinType,
  updateCurrentCoinSwapIn,
  updateCurrentCoinSwapOut,
} from '@/store/feature/currentCoinTypeSlice';
import { LoadingOutlined } from '@ant-design/icons';
import { useTabletOrMobile } from '@/hooks';
import { Transaction } from '@mysten/sui/transactions';
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
import { useInView } from 'react-intersection-observer';
import { invalidateZeroObj } from '@/hooks/useZeroObj';
import { invalidateAllBalance } from '@/hooks/useAllBalance';
const cx = classNames.bind(styles);
const SwapContent: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const currentCoin = useAppSelector(currentCoinType);
  const isTabletOrMobile = useTabletOrMobile();
  const [showModal, setShowModal] = useState(false); //swap ******
  const [inputTargetValue, setInputTargeValue] = useState(0);
  const [insufficient, setInsufficient] = useState(false);
  const [reallyValue, setReallyValue] = useState<number | undefined>(undefined);
  const [reallyValueBigint, setReallyValueBigint] = useState<
    bigint | undefined
  >(undefined);
  const onDSViewChange = useCallback(
    (
      reallyVB: bigint | undefined,
      value: number | undefined,
      resultBalance: bigint | undefined,
      insufficientBalance: boolean | undefined
    ) => {
      setReallyValue(value);
      setReallyValueBigint(reallyVB);
      if (value === 0) {
        setInputTargeValue(0);
      }
      setInsufficient(insufficientBalance || false);
    },
    []
  );
  const checkSubmitAble = (): boolean => {
    return (
      !insufficient &&
      !!currentCoin?.coinSwapIn?.type &&
      !!currentCoin?.coinSwapOut?.type &&
      (reallyValue == undefined ? 0 : reallyValue) > 0 &&
      !!currentAccount &&
      inputTargetValue !== 0
    );
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
  const swapFn = () => {
    if (!checkSubmitAble()) {
      return;
    }
    if (signTx.isPending) {
      return;
    }
    if (txRef.current) {
      swap(txRef.current);
    }
  };
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (title: string, info: string) => {
    api.open({
      message: title,
      description: info,
      duration: 4.5,
    });
  };
  const swap = (tx: Transaction) => {
    signTx.mutate(
      {
        transaction: tx,
      },
      {
        onSuccess: () => {
          setInputTargeValue(0);
          invalidateBalanceByType(queryClient);
          invalidateAllBalance(queryClient);
          invalidateZeroObj(queryClient);
        },
        onError: (error) => {
          invalidateBalanceByType(queryClient);
          invalidateAllBalance(queryClient);
          invalidateZeroObj(queryClient);
          openNotification(error.name, error.message);
        },
      }
    );
  };
  const queryClient = useQueryClient();
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: false,
  });
  const txRef = useRef<Transaction>();
  const dispatch = useAppDispatch();
  const arrowClick = () => {
    dispatch(updateCurrentCoinSwapOut(currentCoin.coinSwapIn));
    dispatch(updateCurrentCoinSwapIn(currentCoin.coinSwapOut));
  };
  const onRealTimeChange = useCallback(() => {
    setInputTargeValue(0);
  }, []);
  return (
    <>
      {contextHolder}
      <Flex vertical={isTabletOrMobile} justify="flex-start">
        <Flex vertical justify="space-between" style={{ marginTop: '12px' }}>
          <Flex vertical={isTabletOrMobile} align="center">
            <DepositSwapView
              viewType={CURRENT_COIN_BTN_TYPES[1]}
              onDSViewChange={onDSViewChange}
              initValue={0}
              onRealTimeChange={onRealTimeChange}
              maxBalanceAbled={false}
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
                onClick={arrowClick}
                src={isTabletOrMobile ? icon_arrow_down : icon_arrow}
                width={isTabletOrMobile ? 37 : 46}
                height={isTabletOrMobile ? 46 : 37}
                preview={false}
              />
            </div>
            <div
              ref={ref}
              className={cx('left1', 'glass-container')}
              style={{ width: isTabletOrMobile ? '580px' : '550px' }}
            >
              <Flex vertical={false} align="center">
                <SelectCoinBtn
                  btnType={CURRENT_COIN_BTN_TYPES[2]}
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
                  fontSize:
                    String(inputTargetValue || 0).length > 15 ? '45px' : '54px',
                  fontFamily: 'Regular, serif',
                }}
              >
                {inputTargetValue}
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
                onClick={swapFn}
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
                  <div>{insufficient ? 'insufficient balance' : 'Swap'}</div>
                )}
              </div>
            )}
            <SettingSlippageBtn btnType={CURRENT_COIN_BTN_TYPES[1]} />
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
      {!!currentCoin?.coinSwapIn?.type &&
        !!currentCoin?.coinSwapOut?.type &&
        (reallyValue == undefined ? 0 : reallyValue) > 0 && (
          <SwapRoutersView
            inViewP={inView}
            targetIncomeAfterExchange={(value, tx) => {
              setInputTargeValue(Number(value));
              txRef.current = tx;
            }}
            from={currentCoin.coinSwapIn}
            target={currentCoin.coinSwapOut}
            amount={String(reallyValue)}
            decimals={currentCoin.coinSwapIn?.decimals}
            reallyValueBigint={reallyValueBigint || 0n}
            refetchInterval={!signTx.isPending}
            onState={(value) => {
              if (value !== 'success') {
                setInputTargeValue(0);
              }
            }}
          />
        )}
    </>
  );
};

export default SwapContent;
