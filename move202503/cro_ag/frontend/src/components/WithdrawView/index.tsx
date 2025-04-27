import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import {
  ConfigProvider,
  Flex,
  InputNumberProps,
  notification,
  Slider,
  Spin,
} from 'antd';
import { PortfoliosList } from '@/components';
import { LoadingOutlined } from '@ant-design/icons';
import { CroPortfolio } from 'cro-sdk';
import {
  useCoinByType,
  invalidateBalanceByType,
  useTabletOrMobile,
  useWithdraw_10s,
} from '@/hooks';
import {
  ConnectModal,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { convertToBigInt, formatBalance } from '@/utils/formatUtil';
import stringUtil from '@/utils/stringUtil';

import { useDebounce } from 'use-debounce';
import NumInput from '@/components/NumInput';
import { Transaction } from '@mysten/sui/dist/cjs/transactions';
import { useQueryClient } from '@tanstack/react-query';
import { invalidatePortfolios } from '@/hooks/usePortfolios';
import { invalidateZeroObj } from '@/hooks/useZeroObj';
const cx = classNames.bind(styles);
const WithdrawView: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const isTabletOrMobile = useTabletOrMobile();
  const [croPortfolioItem, setCroPortfolioItem] = useState<CroPortfolio | null>(
    null
  );
  const selectedCion = useCoinByType(croPortfolioItem?.coinType);
  const [showModal, setShowModal] = useState(false); //Deposit ******
  const [_inputValue, setInputValue] = useState(0); //*****
  // ** 500ms *********
  const [reallyValue] = useDebounce(_inputValue, 500);
  const [maxBalance, setMaxBalance] = useState(Number.MAX_SAFE_INTEGER); //*******
  const [sliderValue, setSliderValue] = useState(0);
  const lastUpdatedBy = useRef<'input' | 'slider' | null>(null); // ******
  const depositTx = useWithdraw_10s(
    croPortfolioItem,
    reallyValue === maxBalance
      ? croPortfolioItem?.totalBalance || 0n
      : selectedCion?.decimals
      ? convertToBigInt(selectedCion?.decimals, String(reallyValue))
      : 0n
  );
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const [totalBalance, setTotalBalance] = useState('');
  const onInputChange: InputNumberProps['onChange'] = (value) => {
    if (stringUtil.isNotEmpty(value)) {
      lastUpdatedBy.current = 'input';
      setInputValue(value as number);
    }
  };

  const formatBalanceMax = () => {
    const balanceMax = formatBalance(
      croPortfolioItem?.totalBalance,
      selectedCion?.decimals
    );
    if (stringUtil.isEmpty(balanceMax)) {
      return Number.MAX_SAFE_INTEGER;
    } else {
      const max = Number(balanceMax);
      if (max > 0) {
        return max;
      } else {
        return 0;
      }
    }
  };
  useEffect(() => {
    if (
      croPortfolioItem?.totalBalance == null ||
      croPortfolioItem?.totalBalance == undefined ||
      selectedCion?.decimals == null ||
      selectedCion?.decimals == undefined
    ) {
      return;
    }
    const formatTotal = formatBalance(
      croPortfolioItem?.totalBalance,
      selectedCion?.decimals
    );
    const v = Number(formatTotal);
    lastUpdatedBy.current = 'input';
    setInputValue(v >= maxBalance ? maxBalance : v);
    setMaxBalance(formatBalanceMax());
    setTotalBalance(formatTotal);
  }, [croPortfolioItem?.totalBalance, selectedCion?.decimals]);

  const onSliderValueChange: InputNumberProps['onChange'] = (value) => {
    if (Number.isNaN(value)) {
      return;
    }
    lastUpdatedBy.current = 'slider';
    setSliderValue(value as number);
  };

  useEffect(() => {
    if (lastUpdatedBy.current === 'input') {
      return;
    }
    const v = Number(
      (
        ((sliderValue as number) *
          Number(
            formatBalance(
              croPortfolioItem?.totalBalance,
              selectedCion?.decimals
            )
          )) /
        100
      ).toFixed(selectedCion?.decimals)
    );
    setInputValue(v >= maxBalance ? maxBalance : v);
  }, [sliderValue]);

  useEffect(() => {
    if (lastUpdatedBy.current === 'slider') {
      return;
    }
    if (_inputValue >= maxBalance) {
      setSliderValue(100);
    } else {
      setSliderValue(Number(((_inputValue / maxBalance) * 100).toFixed(2)));
    }
  }, [_inputValue, maxBalance]);

  const onHalfMaxClick = (value: number) => {
    lastUpdatedBy.current = 'slider';
    setSliderValue(value);
  };

  const apyItemClick = (item: CroPortfolio | undefined) => {
    if (item) {
      setCroPortfolioItem(item);
    }
  };

  const depositFn = () => {
    if (
      !croPortfolioItem ||
      !currentAccount ||
      !selectedCion ||
      (reallyValue <= 0 && croPortfolioItem?.totalBalance <= 0n) ||
      !depositTx.data ||
      _inputValue != reallyValue
    ) {
      return;
    }
    if (signTx.isPending) {
      return;
    }
    deposit(depositTx.data);
  };
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (title: string, info: string) => {
    api.open({
      message: title,
      description: info,
      duration: 4.5,
    });
  };
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
  const deposit = (tx: Transaction) => {
    signTx.mutate(
      {
        transaction: tx,
      },
      {
        onSuccess: () => {
          // if (croPortfolioItem?.totalBalance && selectedCion?.decimals) {
          //   setTotalBalance(
          //     formatBalance(
          //       croPortfolioItem?.totalBalance -
          //         convertToBigInt(selectedCion?.decimals, String(reallyValue)),
          //       selectedCion?.decimals
          //     )
          //   );
          // }
          setCroPortfolioItem({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ...croPortfolioItem!,
            totalBalance:
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              croPortfolioItem!.totalBalance! -
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              convertToBigInt(selectedCion!.decimals, String(reallyValue)),
          });
          setInputValue(0);
          invalidateBalanceByType(queryClient);
          invalidateZeroObj(queryClient);
          invalidatePortfolios(queryClient);
        },
        onError: (error) => {
          invalidateBalanceByType(queryClient);
          invalidateZeroObj(queryClient);
          openNotification(error.name, error.message);
        },
      }
    );
  };
  return (
    <Flex vertical={isTabletOrMobile} justify="flex-start">
      {contextHolder}
      <Flex vertical justify="space-between" style={{ marginTop: '12px' }}>
        <div className={cx('left1', 'glass-container')}>
          <Flex vertical={false} align="center">
            <div className={cx('select-coin')}></div>
            <div
              className={cx('selected-balance')}
              style={{ flex: 1, textAlign: 'right', marginRight: '16px' }}
            >
              {totalBalance}
            </div>
          </Flex>
          <NumInput
            currentValue={_inputValue}
            onInputChange={onInputChange}
            maxBalance={maxBalance}
            disabled={!currentAccount}
            decimalPlaces={selectedCion?.decimals || 0}
          />
          <div
            className={cx('split')}
            style={{ marginBottom: '3px', marginTop: '0px' }}
          ></div>
          {!currentAccount ? (
            <></>
          ) : (
            <div className={cx('slider-box')}>
              <div className={cx('left-percentage')}>{sliderValue}%</div>
              <ConfigProvider
                theme={{
                  components: {
                    Slider: {
                      handleSize: 20,
                      handleSizeHover: 20,
                      railSize: 10,
                      dotBorderColor: '#2531ca',
                      dotActiveBorderColor: '#2531ca',
                      railBg: '#2531ca55',
                      railHoverBg: '#2531ca55',
                      trackBg: '#2531ca',
                    },
                  },
                }}
              >
                <div className={cx('slider-left')}>
                  <Slider
                    defaultValue={50}
                    tooltip={{ open: false }}
                    min={0}
                    max={100}
                    step={1}
                    onChange={onSliderValueChange}
                    value={sliderValue}
                  />
                </div>
              </ConfigProvider>

              <div className={cx('slider-right')}>
                <div
                  className={cx('half')}
                  onClick={() => {
                    onHalfMaxClick(50);
                  }}
                >
                  Half
                </div>
                <div
                  className={cx('max')}
                  onClick={() => {
                    onHalfMaxClick(100);
                  }}
                >
                  Max
                </div>
              </div>
            </div>
          )}
        </div>
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
                !croPortfolioItem ||
                !currentAccount ||
                !selectedCion?.type ||
                (reallyValue <= 0 && croPortfolioItem?.totalBalance <= 0n) ||
                !depositTx.data
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
                <Spin indicator={<LoadingOutlined spin />} />
              </ConfigProvider>
            ) : (
              'Withdraw'
            )}
          </div>
        )}
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
        ></div>
        <PortfoliosList
          portfolioItem={croPortfolioItem}
          onItemClick={(item) => apyItemClick(item)}
        />
      </div>
    </Flex>
  );
};

export default WithdrawView;
