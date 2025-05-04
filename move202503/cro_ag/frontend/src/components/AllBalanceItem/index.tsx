import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { Avatar, Flex } from 'antd';
import { ICON_URL } from '@/config/iconDefaultUrl';
import { AllCoinsBalanceItem } from '@/hooks/useAllBalance';
import { PriceInfo } from 'cro-sdk';
import Decimal from 'decimal.js';
import { formatBalance } from '@/utils/formatUtil';
import { toSignificantDigitsUtils } from '@/utils/toSignificantDigitsUtils';
import './index.css';
import { CheckCircleOutlined } from '@ant-design/icons';
import useCopyToClipboard from '@/hooks/useCopyToClipboard';
import icon_copy from '@/assets/icon_copy.png';
import icon_share from '@/assets/icon_share.png';
import icon_swap from '@/assets/icon_swap.svg';
import icon_lending from '@/assets/icon_lending.svg';
import { useLocation, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  currentCoinType,
  updateCurrentCoinLendingIn,
  updateCurrentCoinSwapIn,
  updateCurrentCoinSwapOut,
} from '@/store/feature/currentCoinTypeSlice';
const cx = classNames.bind(styles);
export type AllBalanceItemProps = {
  item: AllCoinsBalanceItem;
  priceInfo: PriceInfo | undefined;
};
const AllBalanceItem: React.FC<AllBalanceItemProps> = ({ item, priceInfo }) => {
  const [price, balance, balancePrice] = useMemo(() => {
    const balance = formatBalance(item.balance, item.coin?.decimals);
    if (!priceInfo) {
      return [undefined, balance, undefined];
    }
    const price = new Decimal(priceInfo.last_price.toString()).mul(
      new Decimal('10').pow(priceInfo.expo.toString())
    );

    if (!balance) {
      return [price, balance, undefined];
    }
    const balancePrice = new Decimal(priceInfo?.last_price.toString())
      .mul(new Decimal(balance))
      .mul(new Decimal('10').pow(priceInfo?.expo.toString()));
    return [price, balance, balancePrice];
  }, [priceInfo]);
  const [hovered, setHovered] = useState(false);
  // const [transitionEnd, setTransitionEnd] = useState(false);
  const mouseLeave = () => {
    setHovered(false);
    // setTransitionEnd(false);
  };
  const { copyState, handleCopy } = useCopyToClipboard();
  const slideRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let animationFrame: number;

    const trackTransform = () => {
      if (slideRef.current) {
        const style = getComputedStyle(slideRef.current);
        const matrix = new DOMMatrixReadOnly(style.transform);

        const x = matrix.m41;
        const opacity = Math.abs(x) / 350;
        slideRef.current.style.opacity = `${Math.min(Math.max(opacity, 0), 1)}`;
        if ((x == 0 && !hovered) || (x > 349 && hovered)) {
          return;
        }
        // console.log('************   ', `${Math.min(Math.max(opacity, 0), 1)}`);
      }
      animationFrame = requestAnimationFrame(trackTransform);
    };

    // if (hovered) {
    //   animationFrame = requestAnimationFrame(trackTransform);
    // }
    animationFrame = requestAnimationFrame(trackTransform);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [hovered]);
  // useEffect(() => {
  //   let animationFrameId: number;

  //   const update = () => {
  //     const el = slideRef.current;
  //     if (el) {
  //       const matrix = window.getComputedStyle(el).transform;
  //       if (matrix !== 'none') {
  //         const match = matrix.match(/matrix\(1, 0, 0, 1, (-?\d+), 0\)/);
  //         const translateX = match ? parseFloat(match[1]) : 0;
  //       }
  //     }
  //     animationFrameId = requestAnimationFrame(update);
  //   };

  //   if (hovered) {
  //     animationFrameId = requestAnimationFrame(update);
  //   } else {
  //     const el = slideRef.current;
  //     if (el) el.style.opacity = '0';
  //   }

  //   return () => cancelAnimationFrame(animationFrameId);
  // }, [hovered]);
  const router = useNavigate();
  const currentCoin = useAppSelector(currentCoinType);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const swapClick = () => {
    if ('/lending' === location.pathname) {
      if (item.coinType === currentCoin.coinLendingIn.type) {
        return;
      }
      if (item.coin) {
        dispatch(updateCurrentCoinLendingIn(item.coin));
      }
    } else if ('/swap' === location.pathname) {
      if (item.coinType === currentCoin.coinSwapIn.type) {
        return;
      }
      if (item.coin) {
        if (item.coinType === currentCoin.coinSwapOut.type) {
          dispatch(updateCurrentCoinSwapOut(currentCoin.coinSwapIn));
        }
        dispatch(updateCurrentCoinSwapIn(item.coin));
      }
    } else {
      if (item.coinType === currentCoin.coinSwapIn.type) {
        return;
      }
      if (item.coin) {
        if (item.coinType === currentCoin.coinSwapOut.type) {
          dispatch(updateCurrentCoinSwapOut(currentCoin.coinSwapIn));
        }
        dispatch(updateCurrentCoinSwapIn(item.coin));
      }
      router('/swap');
    }
  };
  return (
    <div
      className={(cx('first'), 'hover-container')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={mouseLeave}
      // onTransitionEnd={() => {
      //   setTransitionEnd(true);
      // }}
    >
      <div className={cx('label-right')}>
        <Avatar
          style={{
            marginRight: '10px',
            width: '39px',
            height: '39px',
          }}
          src={item.coin?.iconUrl || ICON_URL}
        />
        {/* {item.coin?.name} */}
      </div>
      <div className={cx('label-left')}>
        <div
          style={{
            marginRight: '18px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <div className={cx('left-top')} style={{ flex: 1 }}>
            {item.coin?.name}
          </div>
          <div className={cx('left-top')}>
            {toSignificantDigitsUtils(Number(balance))}
          </div>
        </div>
        <div
          style={{
            marginRight: '18px',
            marginTop: '3px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <div className={cx('left-bottom')} style={{ flex: 1 }}>
            ${price ? toSignificantDigitsUtils(price) : '--'}
          </div>
          <div className={cx('left-bottom')}>
            {balancePrice ? '$' + toSignificantDigitsUtils(balancePrice) : ''}
          </div>
        </div>
      </div>
      <div
        ref={slideRef}
        className={`slide-box ${hovered ? 'slide-in' : 'slide-out'}`}
      >
        <div className={cx('label-right')}>
          <Avatar
            style={{
              marginRight: '10px',
              width: '39px',
              height: '39px',
            }}
            src={item.coin?.iconUrl || ICON_URL}
          />
        </div>
        <div className={cx('label-left')}>
          <div
            style={{
              marginRight: '18px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <div className={cx('left-top')}>{item.coin?.name}</div>
            <div
              className={cx('left-top')}
              style={{ marginLeft: '13px', flex: 1 }}
            >
              {toSignificantDigitsUtils(Number(balance))}
            </div>
          </div>
          <div
            style={{
              marginRight: '18px',
              marginTop: '3px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <div className={cx('left-bottom')} style={{ flex: 1 }}>
              <Flex vertical={false} align="center">
                <div
                  style={{
                    marginRight: '8px',
                    lineHeight: 1,
                    fontSize: '16px',
                    fontFamily: 'Regular, serif',
                    letterSpacing: '0px',
                    color: '#fefefe',
                  }}
                >
                  {item.coinType.substr(0, 6) +
                    '...' +
                    item.coinType.substr(-6)}
                </div>
                {copyState ? (
                  <CheckCircleOutlined style={{ fontSize: '18px' }} />
                ) : (
                  <div
                    onClick={(event: React.MouseEvent) => {
                      handleCopy(item.coinType);
                      event.stopPropagation();
                    }}
                    style={{
                      width: '18px',
                      height: '18px',
                      backgroundImage: `url(${icon_copy})`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                    }}
                  ></div>
                )}
                {item.coinType && (
                  <div
                    onClick={() => {
                      window.open(
                        'https://suivision.xyz/coin/' + item.coinType,
                        '_blank'
                      );
                    }}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginLeft: '12px',
                      backgroundImage: `url(${icon_share})`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                    }}
                  ></div>
                )}
              </Flex>
            </div>
          </div>
        </div>
        <div
          onClick={swapClick}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }} //
        >
          <Avatar
            style={{
              marginRight: '15px',
              width: '26px',
              height: '26px',
            }}
            src={'/lending' === location.pathname ? icon_lending : icon_swap}
          />
        </div>
      </div>
    </div>
  );
};

export default AllBalanceItem;
