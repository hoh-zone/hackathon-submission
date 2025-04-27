import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { ConfigProvider, Flex, InputNumberProps, Slider } from 'antd';
import { SelectCoinBtn } from '@/components';
import { useAppSelector } from '@/store/hooks';
import { currentCoinType } from '@/store/feature/currentCoinTypeSlice';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useBalanceByType } from '@/hooks/useBalanceByType';
import { convertToBigInt, formatBalance } from '@/utils/formatUtil';
import stringUtil from '@/utils/stringUtil';
import Decimal from 'decimal.js';
import NumInput from '@/components/NumInput';
import { CurrentCoinBtnType } from '@/constants';
import { useDebounce } from 'use-debounce';
import { SUI } from 'cro-sdk';
import { coinByCons } from '@/utils/coinByConsUtil';
const cx = classNames.bind(styles);
export type DepositSwapViewProps = {
  viewType: CurrentCoinBtnType;
  initValue: number;
  onDSViewChange: (
    reallyValueBigint: bigint,
    reallyValue: number,
    resultBalance: bigint
  ) => void;
  onRealTimeChange: (value: number) => void;
};
const DepositSwapView: React.FC<DepositSwapViewProps> = (props) => {
  console.log('^^^^^^^^^^^^^^^^^ ');
  const currentAccount = useCurrentAccount();
  const lastUpdatedBy = useRef<'input' | 'slider' | null>(null);
  const currentCoin = useAppSelector(currentCoinType);
  const selectBalance = useBalanceByType(
    coinByCons(props.viewType, currentCoin)?.type
  );
  const [_inputValue, setInputValue] = useState(0);
  const [reallyValue] = useDebounce(_inputValue, 500);
  const onInputChange: InputNumberProps['onChange'] = (value) => {
    if (stringUtil.isNotEmpty(value)) {
      setInput(value as number, true);
    }
  };

  const [maxBalance, setMaxBalance] = useState(
    new Decimal(Number.MAX_SAFE_INTEGER.toString())
      .div(
        new Decimal('10').pow(
          coinByCons(props.viewType, currentCoin)?.decimals || 0
        )
      )
      .toNumber() - 10000
  );
  const formatBalanceMax = () => {
    const balanceMax = coinBalanceShow;
    if (stringUtil.isEmpty(balanceMax)) {
      return (
        new Decimal(Number.MAX_SAFE_INTEGER.toString())
          .div(
            new Decimal('10').pow(
              coinByCons(props.viewType, currentCoin)?.decimals || 0
            )
          )
          .toNumber() - 10000
      );
    } else {
      let max;
      if (coinByCons(props.viewType, currentCoin)?.type === SUI) {
        max = Decimal(balanceMax).minus(Decimal('0.1')).toNumber();
      } else {
        max = Number(balanceMax);
      }
      if (max > 0) {
        return max;
      } else {
        return 0;
      }
    }
  };
  useEffect(() => {
    if (!currentAccount?.address) {
      setMaxBalance(
        new Decimal(Number.MAX_SAFE_INTEGER.toString())
          .div(
            new Decimal('10').pow(
              coinByCons(props.viewType, currentCoin)?.decimals || 0
            )
          )
          .toNumber() - 10000
      );
    }
  }, [currentCoin]);
  const setInput = (value: number, voluntarily: boolean) => {
    if (lastUpdatedBy.current === 'input' && !voluntarily) {
      return;
    }
    if (voluntarily) {
      lastUpdatedBy.current = 'input';
    }
    props.onRealTimeChange(value);
    setInputValue(value);
  };

  const coinBalanceShow = formatBalance(
    selectBalance?.data?.balance,
    selectBalance?.data?.decimals
  );

  const setSlider = (value: number, voluntarily: boolean) => {
    if (lastUpdatedBy.current === 'slider' && !voluntarily) {
      return;
    }
    if (voluntarily) {
      lastUpdatedBy.current = 'slider';
    }
    setSliderValue(value);
  };
  useEffect(() => {
    const v = Number(
      formatBalance(
        selectBalance?.data?.balance,
        coinByCons(props.viewType, currentCoin)?.decimals
      )
    );
    setInput(v >= maxBalance ? maxBalance : v, true);
    setMaxBalance(formatBalanceMax());
  }, [selectBalance?.data?.balance]);
  useEffect(() => {
    const v = Number(
      formatBalance(
        selectBalance?.data?.balance,
        coinByCons(props.viewType, currentCoin)?.decimals
      )
    );
    setInput(v >= maxBalance ? maxBalance : v, true);
  }, [maxBalance]);
  const [sliderValue, setSliderValue] = useState(0);
  const onSliderValueChange: InputNumberProps['onChange'] = (value) => {
    if (Number.isNaN(value)) {
      return;
    }
    setSlider(value as number, true);
  };
  useEffect(() => {
    if (lastUpdatedBy.current === 'input') {
      return;
    }
    const v = Number(
      (((sliderValue as number) * Number(coinBalanceShow)) / 100).toFixed(
        selectBalance?.data?.decimals
      )
    );
    setInput(v >= maxBalance ? maxBalance : v, false);
  }, [sliderValue]);
  useEffect(() => {
    if (_inputValue >= maxBalance) {
      setSlider(100, false);
    } else {
      setSlider(Number(((_inputValue / maxBalance) * 100).toFixed(2)), false);
    }
  }, [_inputValue]);
  const onHalfMaxClick = (value: number) => {
    setSlider(value, true);
  };
  const reallyVB = !selectBalance?.data?.decimals
    ? 0n
    : convertToBigInt(selectBalance?.data?.decimals, String(reallyValue));
  useEffect(() => {
    if (
      reallyValue === maxBalance &&
      coinByCons(props.viewType, currentCoin)?.type !== SUI
    ) {
      props.onDSViewChange(
        selectBalance?.data?.balance || 0n,
        reallyValue,
        selectBalance?.data?.decimals == undefined
          ? 0n
          : selectBalance?.data?.balance - reallyVB
      );
    } else {
      props.onDSViewChange(
        reallyVB,
        reallyValue,
        selectBalance?.data?.decimals == undefined
          ? 0n
          : selectBalance?.data?.balance - reallyVB
      );
    }
  }, [reallyValue]);
  return (
    <div className={cx('left1', 'glass-container')}>
      <Flex vertical={false} align="center">
        <SelectCoinBtn
          onComplete={() => {
            props.onDSViewChange(0n, 0, 0n);
          }}
          btnType={props.viewType}
        ></SelectCoinBtn>
        <div
          className={cx('selected-balance')}
          style={{ flex: 1, textAlign: 'right', marginRight: '16px' }}
        >
          {coinBalanceShow}
        </div>
      </Flex>
      <NumInput
        currentValue={_inputValue}
        decimalPlaces={
          selectBalance?.data?.decimals ||
          coinByCons(props.viewType, currentCoin)?.decimals ||
          0
        }
        onInputChange={onInputChange}
        maxBalance={maxBalance}
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
  );
};

export default React.memo(DepositSwapView);
